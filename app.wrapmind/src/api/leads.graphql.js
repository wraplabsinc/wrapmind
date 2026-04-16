import { gql } from '@apollo/client';
import { useQuery, useMutation } from '@apollo/client/react';

// ─── Fragment ────────────────────────────────────────────────────────────────

export const LEAD_FIELDS = gql`
  fragment LeadFields on Lead {
    id
    orgId
    locationId
    name
    phone
    email
    source
    serviceInterest
    budget
    priority
    status
    assigneeId
    customerId
    notes
    createdAt
    updatedAt
  }
`;

// ─── Queries ─────────────────────────────────────────────────────────────────

/**
 * List leads for an org, ordered by createdAt desc.
 */
export const LIST_LEADS = gql`
  query ListLeads($orgId: UUID!, $first: Int, $offset: Int) {
    leadsCollection(
      filter: { orgId: { eq: $orgId } }
      first: $first
      offset: $offset
      orderBy: [{ createdAt: DESC }]
    ) {
      edges {
        node {
          id
          orgId
          locationId
          name
          phone
          email
          source
          serviceInterest
          budget
          priority
          status
          assigneeId
          customerId
          notes
          createdAt
          updatedAt
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
  ${LEAD_FIELDS}
`;

/**
 * Get a single lead by ID.
 */
export const GET_LEAD = gql`
  query GetLead($id: UUID!) {
    lead(id: $id) {
      ...LeadFields
    }
  }
  ${LEAD_FIELDS}
`;

// ─── Mutations ──────────────────────────────────────────────────────────────

export const CREATE_LEAD = gql`
  mutation CreateLead(
    $orgId: UUID!
    $locationId: UUID
    $name: String!
    $phone: String
    $email: String
    $source: String
    $serviceInterest: String
    $budget: numeric
    $priority: String
    $status: String
    $notes: String
  ) {
    leadInsert(
      input: {
        orgId: $orgId
        locationId: $locationId
        name: $name
        phone: $phone
        email: $email
        source: $source
        serviceInterest: $serviceInterest
        budget: $budget
        priority: $priority
        status: $status
        notes: $notes
      }
    ) {
      ...LeadFields
    }
  }
  ${LEAD_FIELDS}
`;

export const UPDATE_LEAD = gql`
  mutation UpdateLead(
    $id: UUID!
    $name: String
    $phone: String
    $email: String
    $source: String
    $serviceInterest: String
    $budget: numeric
    $priority: String
    $status: String
    $assigneeId: UUID
    $customerId: UUID
    $notes: String
  ) {
    leadUpdate(
      id: $id
      set: {
        name: $name
        phone: $phone
        email: $email
        source: $source
        serviceInterest: $serviceInterest
        budget: $budget
        priority: $priority
        status: $status
        assigneeId: $assigneeId
        customerId: $customerId
        notes: $notes
      }
    ) {
      ...LeadFields
    }
  }
  ${LEAD_FIELDS}
`;

export const DELETE_LEAD = gql`
  mutation DeleteLead($id: UUID!) {
    leadDelete(id: $id) {
      id
    }
  }
`;

// ─── Apollo React Hooks ─────────────────────────────────────────────────────

export function USE_LEADS({ orgId, first = 200, offset = 0 } = {}) {
  const { data, loading, error, refetch } = useQuery(LIST_LEADS, {
    variables: { orgId, first, offset },
    skip: !orgId,
  });
  const edges = data?.leadsCollection?.edges ?? [];
  const leads = edges.map(e => e.node);
  return { leads, loading, error, refetch };
}

export function USE_LEAD(id) {
  const { data, loading, error } = useQuery(GET_LEAD, {
    variables: { id },
    skip: !id,
  });
  return { lead: data?.lead ?? null, loading, error };
}

export function USE_CREATE_LEAD() {
  return useMutation(CREATE_LEAD, {
    update(cache, { data: { leadInsert } }) {
      if (!leadInsert?.edges?.[0]?.node) return;
      const newLead = leadInsert.edges[0].node;
      cache.modify({
        fields: {
          // eslint-disable-next-line no-unused-vars
          leadsCollection(existing = { edges: [] }, { TO_MUCH }) {
            return {
              ...existing,
              edges: [
                { __typename: 'LeadEdge', node: newLead },
                ...existing.edges,
              ],
            };
          },
        },
      });
    },
  });
}

export function USE_UPDATE_LEAD() {
  return useMutation(UPDATE_LEAD, {
    update(cache, { data: { leadUpdate } }) {
      if (!leadUpdate) return;
      cache.modify({
        fields: {
          // eslint-disable-next-line no-unused-vars
          leadsCollection(existing = { edges: [] }, { TO_MUCH }) {
            return {
              ...existing,
              edges: existing.edges.map(e =>
                e.node?.id === leadUpdate.id
                  ? { ...e, node: { ...e.node, ...leadUpdate } }
                  : e
              ),
            };
          },
        },
      });
    },
  });
}

export function USE_DELETE_LEAD() {
  return useMutation(DELETE_LEAD, {
    update(cache, { data: { leadDelete } }) {
      if (!leadDelete?.id) return;
      cache.modify({
        fields: {
          // eslint-disable-next-line no-unused-vars
          leadsCollection(existing = { edges: [] }, { TO_MUCH }) {
            return {
              ...existing,
              edges: existing.edges.filter(e => e.node?.id !== leadDelete.id),
            };
          },
        },
      });
    },
  });
}
