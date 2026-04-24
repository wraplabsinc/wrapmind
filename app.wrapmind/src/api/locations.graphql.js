import { gql } from '@apollo/client';
import { useQuery, useMutation } from '@apollo/client/react';

// ─── Fragments ────────────────────────────────────────────────────────────────

export const LOCATION_FIELDS = gql`
  fragment LocationFields on locations {
    id
    org_id
    name
    address
    city
    state
    zip
    phone
    color
    is_active
    created_at
    updated_at
  }
`;

// ─── Queries ────────────────────────────────────────────────────────────────

/** List locations for an org */
export const LIST_LOCATIONS = gql`
  query ListLocations($orgId: UUID!, $first: Int, $offset: Int) {
    locationsCollection(
      filter: { org_id: { eq: $orgId } }
      first: $first
      offset: $offset
      orderBy: [{ created_at: DESC }]
    ) {
      edges {
        node {
          ...LocationFields
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
  ${LOCATION_FIELDS}
`;

// ─── Mutations ──────────────────────────────────────────────────────────────

export const CREATE_LOCATION = gql`
  mutation CreateLocation(
    $orgId: UUID!
    $name: String!
    $nickname: String
    $address: String
    $city: String
    $state: String
    $zip: String
    $phone: String
    $color: String
  ) {
    insertIntolocationsCollection(objects: [{
      org_id: $orgId
      name: $name
      nickname: $nickname
      address: $address
      city: $city
      state: $state
      zip: $zip
      phone: $phone
      color: $color
    }]) {
      returning {
        ...LocationFields
      }
    }
  }
  ${LOCATION_FIELDS}
`;

export const UPDATE_LOCATION = gql`
  mutation UpdateLocation(
    $id: UUID!
    $name: String
    $nickname: String
    $address: String
    $city: String
    $state: String
    $zip: String
    $phone: String
    $color: String
    $isActive: Boolean
  ) {
    updatelocationsCollection(
      filter: { id: { eq: $id } }
      set: {
        name: $name
        nickname: $nickname
        address: $address
        city: $city
        state: $state
        zip: $zip
        phone: $phone
        color: $color
        is_active: $isActive
      }
    ) {
      returning {
        ...LocationFields
      }
    }
  }
  ${LOCATION_FIELDS}
`;

export const DELETE_LOCATION = gql`
  mutation DeleteLocation($id: UUID!) {
    deletefromlocationsCollection(filter: { id: { eq: $id } }) {
      returning {
        id
      }
    }
  }
`;

// ─── Apollo React Hooks ─────────────────────────────────────────────────────

export function USE_LOCATIONS({ orgId, first = 100, offset = 0 } = {}) {
  const { data, loading, error, refetch } = useQuery(LIST_LOCATIONS, {
    variables: { orgId, first, offset },
    skip: !orgId,
  });
  const locations = data?.locationsCollection?.edges?.map(e => e.node) ?? [];
  return { locations, loading, error, refetch };
}

export function USE_CREATE_LOCATION() {
  return useMutation(CREATE_LOCATION, {
    update(cache, { data: { insertIntolocationsCollection } }) {
      const returning = insertIntolocationsCollection?.returning ?? [];
      if (!returning[0]) return;
      const newLoc = returning[0];
      cache.modify({
        fields: {
          // eslint-disable-next-line no-unused-vars
          locationsCollection(existing = { edges: [] }, { readField }) {
            return {
              ...existing,
              edges: [
                { __typename: 'locationsEdge', node: newLoc },
                ...existing.edges,
              ],
            };
          },
        },
      });
    },
  });
}

export function USE_UPDATE_LOCATION() {
  return useMutation(UPDATE_LOCATION);
}

export function USE_DELETE_LOCATION() {
  return useMutation(DELETE_LOCATION, {
    update(cache, { data: { deletefromlocationsCollection } }) {
      const returning = deletefromlocationsCollection?.returning ?? [];
      if (!returning[0]?.id) return;
      cache.modify({
        fields: {
          // eslint-disable-next-line no-unused-vars
          locationsCollection(existing = { edges: [] }, { readField }) {
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
