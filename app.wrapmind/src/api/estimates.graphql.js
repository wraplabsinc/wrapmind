import { gql } from '@apollo/client';
import { useQuery, useMutation } from '@apollo/client/react';

// ─── Fragments ────────────────────────────────────────────────────────────────

export const ESTIMATE_FIELDS = gql`
  fragment EstimateFields on estimates {
    id
    org_id
    location_id
    estimate_number
    status
    customer_id
    vehicle_id
    package
    material
    material_color
    labor_hours
    base_price
    labor_cost
    material_cost
    discount
    total
    notes
    created_by_id
    assigned_to_id
    sent_at
    expires_at
    approved_at
    declined_at
    converted_to_invoice_id
    created_at
    updated_at
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
        org_id: { eq: $orgId }
      }
      first: $first
      offset: $offset
      orderBy: [{ created_at: DESC }]
    ) {
      edges {
        node {
          id
          estimate_number
          status
          location_id
          customer_id
          vehicle_id
          package
          material
          material_color
          labor_hours
          base_price
          labor_cost
          material_cost
          discount
          total
          notes
          created_by_id
          assigned_to_id
          sent_at
          expires_at
          approved_at
          declined_at
          converted_to_invoice_id
          created_at
          updated_at
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
    estimatesCollection(filter: { id: { eq: $id } }, first: 1) {
      edges {
        node {
          ...EstimateFields
        }
      }
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
  $createdById: UUID
`;

const ESTIMATE_VARIABLES = `
  org_id: $orgId
  location_id: $locationId
  customer_id: $customerId
  estimate_number: $estimateNumber
  status: $status
  package: $package
  material: $material
  material_color: $materialColor
  labor_hours: $laborHours
  base_price: $basePrice
  labor_cost: $laborCost
  material_cost: $materialCost
  discount: $discount
  total: $total
  notes: $notes
  assigned_to_id: $assignedToId
  created_by_id: $createdById
`;

/**
 * Create a new estimate.
 * pg_graphql uses insertInto<Collection> with objects: [].
 */
export const CREATE_ESTIMATE = gql`
  mutation CreateEstimate(
    ${ESTIMATE_INPUT}
  ) {
    insertIntoestimatesCollection(objects: [{
      ${ESTIMATE_VARIABLES}
    }]) {
      returning {
        ...EstimateFields
      }
    }
  }
  ${ESTIMATE_FIELDS}
`;

/**
 * Update an existing estimate.
 * pg_graphql uses update<Collection> with filter + set:.
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
    $createdById: UUID
  ) {
    updateestimatesCollection(
      filter: { id: { eq: $id } }
      set: {
        status: $status
        package: $package
        material: $material
        material_color: $materialColor
        labor_hours: $laborHours
        base_price: $basePrice
        labor_cost: $laborCost
        material_cost: $materialCost
        discount: $discount
        total: $total
        notes: $notes
        assigned_to_id: $assignedToId
        sent_at: $sentAt
        expires_at: $expiresAt
        approved_at: $approvedAt
        declined_at: $declinedAt
        converted_to_invoice_id: $convertedToInvoiceId
        created_by_id: $createdById
      }
    ) {
      returning {
        ...EstimateFields
      }
    }
  }
  ${ESTIMATE_FIELDS}
`;

/**
 * Delete an estimate.
 */
export const DELETE_ESTIMATE = gql`
  mutation DeleteEstimate($id: UUID!) {
    deleteFromestimatesCollection(filter: { id: { eq: $id } }) {
      returning {
        id
      }
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
    edges = edges.filter(e => e.node.location_id === locationId);
  }

  // Normalize snake_case DB fields → camelCase for app consumers
  const estimates = edges.map(e => normalizeEstimate(e.node));
  const pageInfo = data?.estimatesCollection?.pageInfo ?? {};

  return { estimates, loading, error, refetch, ...pageInfo };
}

/**
 * Normalize a DB estimate row (snake_case) → app shape (camelCase).
 */
export function normalizeEstimate(row = {}) {
  if (!row || !row.id) return null;
  return {
    id: row.id,
    orgId: row.org_id,
    locationId: row.location_id,
    estimateNumber: row.estimate_number,
    status: row.status,
    customerId: row.customer_id,
    vehicleId: row.vehicle_id,
    package: row.package,
    material: row.material,
    materialColor: row.material_color,
    laborHours: row.labor_hours != null ? Number(row.labor_hours) : null,
    basePrice: row.base_price != null ? Number(row.base_price) : null,
    laborCost: row.labor_cost != null ? Number(row.labor_cost) : null,
    materialCost: row.material_cost != null ? Number(row.material_cost) : null,
    discount: row.discount != null ? Number(row.discount) : 0,
    total: row.total != null ? Number(row.total) : null,
    notes: row.notes,
    createdById: row.created_by_id,
    assignedToId: row.assigned_to_id,
    sentAt: row.sent_at,
    expiresAt: row.expires_at,
    approvedAt: row.approved_at,
    declinedAt: row.declined_at,
    convertedToInvoiceId: row.converted_to_invoice_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
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

  const edge = data?.estimatesCollection?.edges?.[0];
  return { estimate: edge ? normalizeEstimate(edge.node) : null, loading, error };
}

/**
 * Create an estimate mutation hook.
 * Returns [createEstimate, { loading, error, data }]
 */
export function USE_CREATE_ESTIMATE() {
  return useMutation(CREATE_ESTIMATE, {
    update(cache, { data: { insertIntoestimatesCollection } }) {
      const returning = insertIntoestimatesCollection?.returning ?? [];
      if (!returning[0]) return;
      const newEstimate = normalizeEstimate(returning[0]);
      cache.modify({
        fields: {
          // eslint-disable-next-line no-unused-vars
          estimatesCollection(existing = { edges: [] }, { readField }) {
            return {
              ...existing,
              edges: [
                { __typename: 'estimatesEdge', node: newEstimate },
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
    update(cache, { data: { deleteFromestimatesCollection } }) {
      const returning = deleteFromestimatesCollection?.returning ?? [];
      if (!returning[0]?.id) return;
      cache.modify({
        fields: {
          // eslint-disable-next-line no-unused-vars
          estimatesCollection(existing = { edges: [] }, { readField }) {
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
