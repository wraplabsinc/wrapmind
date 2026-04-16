import { gql } from '@apollo/client';
import { useQuery, useMutation } from '@apollo/client/react';

// ─── Fragments ────────────────────────────────────────────────────────────────

export const ESTIMATE_FIELDS = gql`
  fragment EstimateFields on Estimate {
    id
    orgId
    locationId
    estimateNumber
    status
    customerId
    vehicleId
    package
    material
    materialColor
    laborHours
    basePrice
    laborCost
    materialCost
    discount
    total
    notes
    createdById
    assignedToId
    sentAt
    expiresAt
    approvedAt
    declinedAt
    convertedToInvoiceId
    createdAt
    updatedAt
  }
`;

// ─── Queries ─────────────────────────────────────────────────────────────────

/**
 * List estimates for an org, optionally filtered by location.
 * pg_graphql uses first/offset for pagination.
 */
export const LIST_ESTIMATES = gql`
  query ListEstimates($orgId: UUID!, $locationId: UUID, $first: Int, $offset: Int) {
    estimatesCollection(
      filter: {
        orgId: { eq: $orgId }
      }
      first: $first
      offset: $offset
      orderBy: [{ createdAt: DESC }]
    ) {
      edges {
        node {
          id
          estimateNumber
          status
          locationId
          customerId
          vehicleId
          package
          material
          materialColor
          laborHours
          basePrice
          laborCost
          materialCost
          discount
          total
          notes
          assignedToId
          sentAt
          expiresAt
          approvedAt
          declinedAt
          convertedToInvoiceId
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
  ${ESTIMATE_FIELDS}
`;

/**
 * Get a single estimate by ID.
 */
export const GET_ESTIMATE = gql`
  query GetEstimate($id: UUID!) {
    estimate(id: $id) {
      ...EstimateFields
    }
  }
  ${ESTIMATE_FIELDS}
`;

// ─── Mutations ────────────────────────────────────────────────────────────────

const ESTIMATE_INPUT = `
  $orgId: UUID!
  $locationId: UUID!
  $customerId: UUID!
  $estimateNumber: String!
  $status: String
  $package: String
  $material: String
  $materialColor: String
  $laborHours: Float
  $basePrice: Float
  $laborCost: Float
  $materialCost: Float
  $discount: Float
  $total: Float
  $notes: String
  $assignedToId: UUID
`;

const ESTIMATE_VARIABLES = `
  orgId: $orgId
  locationId: $locationId
  customerId: $customerId
  estimateNumber: $estimateNumber
  status: $status
  package: $package
  material: $material
  materialColor: $materialColor
  laborHours: $laborHours
  basePrice: $basePrice
  laborCost: $laborCost
  materialCost: $materialCost
  discount: $discount
  total: $total
  notes: $notes
  assignedToId: $assignedToId
`;

/**
 * Create a new estimate.
 */
export const CREATE_ESTIMATE = gql`
  mutation CreateEstimate(
    ${ESTIMATE_INPUT}
  ) {
    estimateInsert(
      collection: "estimates"
      records: [{ ${ESTIMATE_VARIABLES} }]
    ) {
      edges {
        node {
          ...EstimateFields
        }
      }
    }
  }
  ${ESTIMATE_FIELDS}
`;

/**
 * Update an existing estimate.
 */
export const UPDATE_ESTIMATE = gql`
  mutation UpdateEstimate(
    $id: UUID!
    $status: String
    $package: String
    $material: String
    $materialColor: String
    $laborHours: Float
    $basePrice: Float
    $laborCost: Float
    $materialCost: Float
    $discount: Float
    $total: Float
    $notes: String
    $assignedToId: UUID
    $sentAt: TIMESTAMPTZ
    $expiresAt: TIMESTAMPTZ
    $approvedAt: TIMESTAMPTZ
    $declinedAt: TIMESTAMPTZ
    $convertedToInvoiceId: UUID
  ) {
    estimateUpdate(id: $id, set: {
      status: $status
      package: $package
      material: $material
      materialColor: $materialColor
      laborHours: $laborHours
      basePrice: $basePrice
      laborCost: $laborCost
      materialCost: $materialCost
      discount: $discount
      total: $total
      notes: $notes
      assignedToId: $assignedToId
      sentAt: $sentAt
      expiresAt: $expiresAt
      approvedAt: $approvedAt
      declinedAt: $declinedAt
      convertedToInvoiceId: $convertedToInvoiceId
    }) {
      ...EstimateFields
    }
  }
  ${ESTIMATE_FIELDS}
`;

/**
 * Delete an estimate.
 */
export const DELETE_ESTIMATE = gql`
  mutation DeleteEstimate($id: UUID!) {
    estimateDelete(id: $id) {
      id
    }
  }
`;

// ─── Apollo React Hooks ───────────────────────────────────────────────────────

/**
 * List estimates for an org.
 * Returns { estimates, loading, error, refetch }
 */
export function USE_ESTIMATES({ orgId, locationId, first = 100, offset = 0 } = {}) {
  const { data, loading, error, refetch } = useQuery(LIST_ESTIMATES, {
    variables: { orgId, first, offset },
    skip: !orgId,
  });

  let edges = data?.estimatesCollection?.edges ?? [];

  // Client-side location filter (pg_graphql filter on locationId is also valid)
  if (locationId) {
    edges = edges.filter(e => e.node.locationId === locationId);
  }

  const estimates = edges.map(e => e.node);
  const pageInfo = data?.estimatesCollection?.pageInfo ?? {};

  return { estimates, loading, error, refetch, ...pageInfo };
}

/**
 * Get a single estimate by ID.
 * Returns { estimate, loading, error }
 */
export function USE_ESTIMATE(id) {
  const { data, loading, error } = useQuery(GET_ESTIMATE, {
    variables: { id },
    skip: !id,
  });

  return { estimate: data?.estimate ?? null, loading, error };
}

/**
 * Create an estimate mutation hook.
 * Returns [createEstimate, { loading, error, data }]
 */
export function USE_CREATE_ESTIMATE() {
  return useMutation(CREATE_ESTIMATE, {
    update(cache, { data: { estimateInsert } }) {
      if (!estimateInsert?.edges?.[0]?.node) return;
      const newEstimate = estimateInsert.edges[0].node;
      cache.modify({
        fields: {
          // eslint-disable-next-line no-unused-vars
          estimatesCollection(existing = { edges: [] }, { TO_MUCH }) {
            return {
              ...existing,
              edges: [
                { __typename: 'EstimateEdge', node: newEstimate },
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
 * Update an estimate mutation hook.
 * Returns [updateEstimate, { loading, error, data }]
 */
export function USE_UPDATE_ESTIMATE() {
  return useMutation(UPDATE_ESTIMATE);
}

/**
 * Delete an estimate mutation hook.
 * Returns [deleteEstimate, { loading, error, data }]
 */
export function USE_DELETE_ESTIMATE() {
  return useMutation(DELETE_ESTIMATE, {
    update(cache, { data: { estimateDelete } }) {
      if (!estimateDelete?.id) return;
      cache.modify({
        fields: {
          // eslint-disable-next-line no-unused-vars
          estimatesCollection(existing = { edges: [] }, { TO_MUCH }) {
            return {
              ...existing,
              edges: existing.edges.filter(
                e => e.node?.id !== estimateDelete.id
              ),
            };
          },
        },
      });
    },
  });
}
