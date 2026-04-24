import { gql } from '@apollo/client';
import { useQuery, useMutation } from '@apollo/client/react';

// ─── Fragments ────────────────────────────────────────────────────────────────

export const LOCATION_FIELDS = gql`
  fragment LocationFields on Location {
    id
    orgId
    name
    nickname
    address
    city
    state
    zip
    phone
    color
    isActive
    createdAt
    updatedAt
  }
`;

// ─── Queries ────────────────────────────────────────────────────────────────

/** List locations for an org */
export const LIST_LOCATIONS = gql`
  query ListLocations($orgId: UUID!, $first: Int, $offset: Int) {
    locationsCollection(
      filter: { orgId: { eq: $orgId } }
      first: $first
      offset: $offset
      orderBy: [{ createdAt: DESC }]
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
    locationInsert(
      collection: "locations"
      records: [{
        orgId: $orgId
        name: $name
        nickname: $nickname
        address: $address
        city: $city
        state: $state
        zip: $zip
        phone: $phone
        color: $color
      }]
    ) {
      edges {
        node {
          ...LocationFields
        }
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
    locationUpdate(id: $id, set: {
      name: $name
      nickname: $nickname
      address: $address
      city: $city
      state: $state
      zip: $zip
      phone: $phone
      color: $color
      isActive: $isActive
    }) {
      ...LocationFields
    }
  }
  ${LOCATION_FIELDS}
`;

export const DELETE_LOCATION = gql`
  mutation DeleteLocation($id: UUID!) {
    locationDelete(id: $id) {
      id
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
    update(cache, { data: { locationInsert } }) {
      if (!locationInsert?.edges?.[0]?.node) return;
      const newLoc = locationInsert.edges[0].node;
      cache.modify({
        fields: {
          // eslint-disable-next-line no-unused-vars
          locationsCollection(existing = { edges: [] }, { readField }) {
            return {
              ...existing,
              edges: [
                { __typename: 'LocationEdge', node: newLoc },
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
    update(cache, { data: { locationDelete } }) {
      if (!locationDelete?.id) return;
      cache.modify({
        fields: {
          // eslint-disable-next-line no-unused-vars
          locationsCollection(existing = { edges: [] }, { readField }) {
            return {
              ...existing,
              edges: existing.edges.filter(
                e => e.node?.id !== locationDelete.id
              ),
            };
          },
        },
      });
    },
  });
}
