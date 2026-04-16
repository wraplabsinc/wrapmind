import { gql } from '@apollo/client';
import { useQuery, useMutation } from '@apollo/client/react';

// ─── Fragment ────────────────────────────────────────────────────────────────

export const NOTIFICATION_FIELDS = gql`
  fragment NotificationFields on Notification {
    id
    orgId
    profileId
    type
    title
    body
    link
    recordId
    read
    createdAt
  }
`;

// ─── Queries ─────────────────────────────────────────────────────────────────

/**
 * List notifications for a profile, ordered by createdAt desc.
 */
export const LIST_NOTIFICATIONS = gql`
  query ListNotifications($profileId: UUID!, $first: Int, $offset: Int) {
    notificationsCollection(
      filter: { profileId: { eq: $profileId } }
      first: $first
      offset: $offset
      orderBy: [{ createdAt: DESC }]
    ) {
      edges {
        node {
          id
          orgId
          profileId
          type
          title
          body
          link
          recordId
          read
          createdAt
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
    notification(id: $id) {
      ...NotificationFields
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
    notificationInsert(
      input: {
        orgId: $orgId
        profileId: $profileId
        type: $type
        title: $title
        body: $body
        link: $link
        recordId: $recordId
        read: $read
      }
    ) {
      ...NotificationFields
    }
  }
  ${NOTIFICATION_FIELDS}
`;

/**
 * Mark a single notification as read (or unread).
 */
export const MARK_NOTIFICATION_READ = gql`
  mutation MarkNotificationRead($id: UUID!, $read: Boolean!) {
    notificationUpdate(
      id: $id
      set: { read: $read }
    ) {
      ...NotificationFields
    }
  }
  ${NOTIFICATION_FIELDS}
`;

export const DELETE_NOTIFICATION = gql`
  mutation DeleteNotification($id: UUID!) {
    notificationDelete(id: $id) {
      id
    }
  }
`;

// ─── Apollo React Hooks ─────────────────────────────────────────────────────

export function USE_NOTIFICATIONS({ profileId, first = 100, offset = 0 } = {}) {
  const { data, loading, error, refetch } = useQuery(LIST_NOTIFICATIONS, {
    variables: { profileId, first, offset },
    skip: !profileId,
  });
  const edges = data?.notificationsCollection?.edges ?? [];
  const notifications = edges.map(e => e.node);
  return { notifications, loading, error, refetch };
}

export function USE_NOTIFICATION(id) {
  const { data, loading, error } = useQuery(GET_NOTIFICATION, {
    variables: { id },
    skip: !id,
  });
  return { notification: data?.notification ?? null, loading, error };
}

export function USE_CREATE_NOTIFICATION() {
  return useMutation(CREATE_NOTIFICATION, {
    update(cache, { data: { notificationInsert } }) {
      if (!notificationInsert?.edges?.[0]?.node) return;
      const newNotif = notificationInsert.edges[0].node;
      cache.modify({
        fields: {
          // eslint-disable-next-line no-unused-vars
          notificationsCollection(existing = { edges: [] }, { TO_MUCH }) {
            return {
              ...existing,
              edges: [
                { __typename: 'NotificationEdge', node: newNotif },
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
    update(cache, { data: { notificationUpdate } }) {
      if (!notificationUpdate) return;
      cache.modify({
        fields: {
          // eslint-disable-next-line no-unused-vars
          notificationsCollection(existing = { edges: [] }, { TO_MUCH }) {
            return {
              ...existing,
              edges: existing.edges.map(e =>
                e.node?.id === notificationUpdate.id
                  ? { ...e, node: { ...e.node, read: notificationUpdate.read } }
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
    update(cache, { data: { notificationDelete } }) {
      if (!notificationDelete?.id) return;
      cache.modify({
        fields: {
          // eslint-disable-next-line no-unused-vars
          notificationsCollection(existing = { edges: [] }, { TO_MUCH }) {
            return {
              ...existing,
              edges: existing.edges.filter(
                e => e.node?.id !== notificationDelete.id
              ),
            };
          },
        },
      });
    },
  });
}
