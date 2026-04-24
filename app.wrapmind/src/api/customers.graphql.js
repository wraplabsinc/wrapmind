import { gql } from '@apollo/client';

// ─── Fragments ────────────────────────────────────────────────────────────────

export const CUSTOMER_FIELDS = gql`
  fragment CustomerFields on Customer {
    id
    orgId
    locationId
    name
    email
    phone
    company
    address
    tags
    source
    referralSourceId
    assigneeId
    notes
    status
    createdAt
    updatedAt
  }
`;

// ─── Queries ────────────────────────────────────────────────────────────────

/**
 * List customers for an org.
 * pg_graphql uses first/offset for pagination, not limit.
 */
export const LIST_CUSTOMERS = gql`
  query ListCustomers($orgId: UUID!, $first: Int, $offset: Int) {
    customersCollection(
      filter: { orgId: { eq: $orgId } }
      first: $first
      offset: $offset
      orderBy: [{ createdAt: DESC }]
    ) {
      edges {
        node {
          id
          name
          email
          phone
          company
          source
          tags
          status
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
  ${CUSTOMER_FIELDS}
`;

/**
 * Get a single customer by ID.
 */
export const GET_CUSTOMER = gql`
  query GetCustomer($id: UUID!) {
    customersCollection(filter: { id: { eq: $id } }, first: 1) {
      edges {
        node {
          ...CustomerFields
        }
      }
    }
  }
  ${CUSTOMER_FIELDS}
`;

/**
 * Get customer with their vehicles (nested).
 */
export const GET_CUSTOMER_WITH_VEHICLES = gql`
  query GetCustomerWithVehicles($id: UUID!) {
    customersCollection(filter: { id: { eq: $id } }, first: 1) {
      edges {
        node {
          ...CustomerFields
          vehiclesCollection(first: 50) {
            edges {
              node {
                id
                year
                make
                model
                vin
                vehicleType
                color
                wrapStatus
                wrapColor
                createdAt
              }
            }
          }
        }
      }
    }
  }
  ${CUSTOMER_FIELDS}
`;

// ─── Mutations ──────────────────────────────────────────────────────────────

const CUSTOMER_INPUT = `
  $orgId: UUID!
  $name: String!
  $email: String
  $phone: String
  $company: String
  $address: String
  $tags: [String!]
  $source: String
  $referralSourceId: UUID
  $assigneeId: UUID
  $notes: String
  $status: String
`;

const CUSTOMER_VARIABLES = `
  orgId: $orgId
  name: $name
  email: $email
  phone: $phone
  company: $company
  address: $address
  tags: $tags
  source: $source
  referralSourceId: $referralSourceId
  assigneeId: $assigneeId
  notes: $notes
  status: $status
`;

/**
 * Create a new customer.
 */
export const CREATE_CUSTOMER = gql`
  mutation CreateCustomer(
    ${CUSTOMER_INPUT}
  ) {
    insertIntocustomersCollection(
      objects: [{ ${CUSTOMER_VARIABLES} }]
    ) {
      edges {
        node {
          ...CustomerFields
        }
      }
    }
  }
  ${CUSTOMER_FIELDS}
`;

/**
 * Update an existing customer.
 * pg_graphql update uses set: { field: value }
 */
export const UPDATE_CUSTOMER = gql`
  mutation UpdateCustomer($id: UUID!, $name: String, $email: String, $phone: String, $company: String, $address: String, $tags: [String!], $source: String, $referralSourceId: UUID, $assigneeId: UUID, $notes: String, $status: String) {
    updatecustomersCollection(
      filter: { id: { eq: $id } }
      set: {
        name: $name
        email: $email
        phone: $phone
        company: $company
        address: $address
        tags: $tags
        source: $source
        referralSourceId: $referralSourceId
        assigneeId: $assigneeId
        notes: $notes
        status: $status
      }
    ) {
      edges {
        node {
          ...CustomerFields
        }
      }
    }
  }
  ${CUSTOMER_FIELDS}
`;

/**
 * Delete a customer.
 */
export const DELETE_CUSTOMER = gql`
  mutation DeleteCustomer($id: UUID!) {
    deleteFromcustomersCollection(filter: { id: { eq: $id } }) {
      id
    }
  }
`;

// ─── Apollo React Hooks ───────────────────────────────────────────────────────

import { useQuery, useMutation } from '@apollo/client/react';

/**
 * List customers for an org.
 * Returns { customers, loading, error, refetch }
 */
export function USE_CUSTOMERS({ orgId, first = 50, offset = 0 } = {}) {
  const { data, loading, error, refetch } = useQuery(LIST_CUSTOMERS, {
    variables: { orgId, first, offset },
    skip: !orgId,
  });

  const customers = data?.customersCollection?.edges?.map(e => e.node) ?? [];
  const pageInfo = data?.customersCollection?.pageInfo ?? {};

  return { customers, loading, error, refetch, ...pageInfo };
}

/**
 * Get a single customer by ID.
 * Returns { customer, loading, error }
 */
export function USE_CUSTOMER(id) {
  const { data, loading, error } = useQuery(GET_CUSTOMER, {
    variables: { id },
    skip: !id,
  });

  return { customer: data?.customersCollection?.edges?.[0]?.node ?? null, loading, error };
}

/**
 * Get a customer with their vehicles (nested).
 * Returns { customer, loading, error }
 */
export function USE_CUSTOMER_WITH_VEHICLES(id) {
  const { data, loading, error } = useQuery(GET_CUSTOMER_WITH_VEHICLES, {
    variables: { id },
    skip: !id,
  });

  return { customer: data?.customersCollection?.edges?.[0]?.node ?? null, loading, error };
}

/**
 * Create a customer mutation hook.
 * Returns [createCustomer, { loading, error, data }]
 */
export function USE_CREATE_CUSTOMER() {
  return useMutation(CREATE_CUSTOMER, {
    update(cache, { data: { insertIntocustomersCollection } }) {
      if (!insertIntocustomersCollection?.edges?.[0]?.node) return;
      const newCustomer = insertIntocustomersCollection.edges[0].node;
      // Prepend to list cache — append edge to existing collection
      cache.modify({
        fields: {
          // eslint-disable-next-line no-unused-vars
          customersCollection(existing = { edges: [] }, { readField }) {
            return {
              ...existing,
              edges: [
                { __typename: 'customersEdge', node: newCustomer },
                ...existing.edges,
              ],
            };
          },
        },
      });
    },
  });
}

/**
 * Update a customer mutation hook.
 * Returns [updateCustomer, { loading, error, data }]
 */
export function USE_UPDATE_CUSTOMER() {
  return useMutation(UPDATE_CUSTOMER);
}

/**
 * Delete a customer mutation hook.
 * Returns [deleteCustomer, { loading, error, data }]
 */
export function USE_DELETE_CUSTOMER() {
  return useMutation(DELETE_CUSTOMER, {
    update(cache, { data: { deleteFromcustomersCollection } }) {
      if (!deleteFromcustomersCollection?.id) return;
      cache.modify({
        fields: {
          // eslint-disable-next-line no-unused-vars
          customersCollection(existing = { edges: [] }, { readField }) {
            return {
              ...existing,
              edges: existing.edges.filter(
                e => e.node?.id !== deleteFromcustomersCollection.id
              ),
            };
          },
        },
      });
    },
  });
}
