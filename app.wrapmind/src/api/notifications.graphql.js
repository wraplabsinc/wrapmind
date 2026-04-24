import { gql } from '@apollo/client';
import { useQuery, useMutation } from '@apollo/client/react';

// ─── Fragment ────────────────────────────────────────────────────────────────

export const NOTIFICATION_FIELDS = gql`
  fragment NotificationFields on notifications {
    id
    org_id
    profile_id
    title
    body
    link
    type
    read
    record_id
    created_at
  }
`;

// ─── Queries ─────────────────────────────────────────────────────────────────

/**
 * List notifications for a profile, ordered by created_at desc.
 */
export const LIST_NOTIFICATIONS = gql`
  query ListNotifications($profileId: UUID!, $first: Int, $offset: Int) {
    notificationsCollection(
      filter: { profile_id: { eq: $profileId } }
      first: $first
      offset: $offset
      orderBy: [{ created_at: DESC }]
    ) {
      edges {
        node {
          id
          org_id
          profile_id
          title
          body
          link
          type
          read
          record_id
          created_at
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
  ${NOTIFICATION_FIELDS}
`;

/**
 * Get a single notification by ID.
 */
export const GET_NOTIFICATION = gql`
  query GetNotification($id: UUID!) {
    notificationsCollection(filter: { id: { eq: $id } }, first: 1) {
      edges {
        node {
          ...NotificationFields
        }
      }
    }
  }
  ${NOTIFICATION_FIELDS}
`;

// ─── Mutations ──────────────────────────────────────────────────────────────

export const CREATE_NOTIFICATION = gql`
  mutation CreateNotification(
    $orgId: UUID!
    $profileId: UUID!
    $type: String
    $title: String!
    $body: String
    $link: String
    $recordId: String
    $read: Boolean
  ) {
    insertintonotificationsCollection(objects: [{
      org_id: $orgId
      profile_id: $profileId
      type: $type
      title: $title
      body: $body
      link: $link
      record_id: $recordId
      read: $read
    }]) {
      returning {
        ...NotificationFields
      }
    }
  }
  ${NOTIFICATION_FIELDS}
`;

/**
 * Mark a single notification as read (or unread).
 */
export const MARK_NOTIFICATION_READ = gql`
  mutation MarkNotificationRead($id: UUID!, $read: Boolean!) {
    updatenotificationsCollection(
      filter: { id: { eq: $id } }
      set: { read: $read }
    ) {
      returning {
        ...NotificationFields
      }
    }
  }
  ${NOTIFICATION_FIELDS}
`;

export const DELETE_NOTIFICATION = gql`
  mutation DeleteNotification($id: UUID!) {
    deleteFromnotificationsCollection(filter: { id: { eq: $id } }) {
      returning {
        id
      }
    }
  }
`;

// ─── Apollo React Hooks ─────────────────────────────────────────────────────

/**
 * Normalize a DB notification row (snake_case) → app shape (camelCase).
 */
export function normalizeNotification(row = {}) {
  if (!row || !row.id) return null;
  return {
    id: row.id,
    orgId: row.org_id,
    profileId: row.profile_id,
    title: row.title,
    body: row.body,
    link: row.link,
    type: row.type,
    read: row.read,
    recordId: row.record_id,
    createdAt: row.created_at,
  };
}

export function USE_NOTIFICATIONS({ profileId, first = 100, offset = 0 } = {}) {
  const { data, loading, error, refetch } = useQuery(LIST_NOTIFICATIONS, {
    variables: { profileId, first, offset },
    skip: !profileId,
  });
  const edges = data?.notificationsCollection?.edges ?? [];
  const notifications = edges.map(e => normalizeNotification(e.node));
  return { notifications, loading, error, refetch };
}

export function USE_NOTIFICATION(id) {
  const { data, loading, error } = useQuery(GET_NOTIFICATION, {
    variables: { id },
    skip: !id,
  });
  const edge = data?.notificationsCollection?.edges?.[0];
  return { notification: edge ? normalizeNotification(edge.node) : null, loading, error };
}

export function USE_CREATE_NOTIFICATION() {
  return useMutation(CREATE_NOTIFICATION, {
    update(cache, { data: { insertintonotificationsCollection } }) {
      const returning = insertintonotificationsCollection?.returning ?? [];
      if (!returning[0]) return;
      const newNotif = normalizeNotification(returning[0]);
      cache.modify({
        fields: {
          // eslint-disable-next-line no-unused-vars
          notificationsCollection(existing = { edges: [] }, { readField }) {
            return {
              ...existing,
              edges: [
                { __typename: 'notificationsEdge', node: newNotif },
                ...existing.edges,
              ],
            };
          },
        },
      });
    },
  });
}

export function USE_MARK_NOTIFICATION_READ() {
  return useMutation(MARK_NOTIFICATION_READ, {
    update(cache, { data: { updatenotificationsCollection } }) {
      const returning = updatenotificationsCollection?.returning ?? [];
      if (!returning[0]) return;
      const updated = normalizeNotification(returning[0]);
      cache.modify({
        fields: {
          // eslint-disable-next-line no-unused-vars
          notificationsCollection(existing = { edges: [] }, { readField }) {
            return {
              ...existing,
              edges: existing.edges.map(e =>
                e.node?.id === updated.id
                  ? { ...e, node: { ...e.node, read: updated.read } }
                  : e
              ),
            };
          },
        },
      });
    },
  });
}

export function USE_DELETE_NOTIFICATION() {
  return useMutation(DELETE_NOTIFICATION, {
    update(cache, { data: { deleteFromnotificationsCollection } }) {
      const returning = deleteFromnotificationsCollection?.returning ?? [];
      if (!returning[0]?.id) return;
      cache.modify({
        fields: {
          // eslint-disable-next-line no-unused-vars
          notificationsCollection(existing = { edges: [] }, { readField }) {
            return {
              ...existing,
              edges: existing.edges.filter(
                e => e.node?.id !== returning[0].id
              ),
            };
          },
        },
      });
    },
  });
}
