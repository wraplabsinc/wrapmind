import { gql } from '@apollo/client';
import { useQuery, useMutation } from '@apollo/client/react';

// ─── Fragments ────────────────────────────────────────────────────────────────

export const ESTIMATE_TEMPLATE_FIELDS = gql`
  fragment EstimateTemplateFields on estimate_templates {
    id
    org_id
    location_id
    name
    package
    modifier_selections
    material
    material_color
    base_price
    created_by_id
    created_at
    updated_at
  }
`;

// ─── Queries ─────────────────────────────────────────────────────────────────

/**
 * List estimate templates for an org, optionally filtered by location.
 * pg_graphql uses first/offset for pagination.
 */
export const LIST_ESTIMATE_TEMPLATES = gql`
  query ListEstimateTemplates($orgId: UUID!, $locationId: UUID, $first: Int, $offset: Int) {
    estimate_templatesCollection(
      filter: {
        org_id: { eq: $orgId }
      }
      first: $first
      offset: $offset
      orderBy: [{ name: ASC }]
    ) {
      edges {
        node {
          id
          org_id
          location_id
          name
          package
          modifier_selections
          material
          material_color
          base_price
          created_by_id
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
  ${ESTIMATE_TEMPLATE_FIELDS}
`;

/**
 * Get a single estimate template by ID.
 */
export const GET_ESTIMATE_TEMPLATE = gql`
  query GetEstimateTemplate($id: UUID!) {
    estimate_templatesCollection(filter: { id: { eq: $id } }, first: 1) {
      edges {
        node {
          ...EstimateTemplateFields
        }
      }
    }
  }
  ${ESTIMATE_TEMPLATE_FIELDS}
`;

// ─── Mutations ────────────────────────────────────────────────────────────────

/**
 * Create a new estimate template.
 */
export const CREATE_ESTIMATE_TEMPLATE = gql`
  mutation CreateEstimateTemplate(
    $orgId: UUID!
    $locationId: UUID!
    $name: String!
    $package: String
    $modifierSelections: JSON
    $material: String
    $materialColor: String
    $basePrice: Float
    $createdById: UUID
  ) {
    insertIntoestimate_templatesCollection(objects: [{
      org_id: $orgId
      location_id: $locationId
      name: $name
      package: $package
      modifier_selections: $modifierSelections
      material: $material
      material_color: $materialColor
      base_price: $basePrice
      created_by_id: $createdById
    }]) {
      returning {
        ...EstimateTemplateFields
      }
    }
  }
  ${ESTIMATE_TEMPLATE_FIELDS}
`;

/**
 * Update an existing estimate template.
 */
export const UPDATE_ESTIMATE_TEMPLATE = gql`
  mutation UpdateEstimateTemplate(
    $id: UUID!
    $name: String
    $package: String
    $modifierSelections: JSON
    $material: String
    $materialColor: String
    $basePrice: Float
  ) {
    updateestimate_templatesCollection(
      filter: { id: { eq: $id } }
      set: {
        name: $name
        package: $package
        modifier_selections: $modifierSelections
        material: $material
        material_color: $materialColor
        base_price: $basePrice
      }
    ) {
      returning {
        ...EstimateTemplateFields
      }
    }
  }
  ${ESTIMATE_TEMPLATE_FIELDS}
`;

/**
 * Delete an estimate template.
 */
export const DELETE_ESTIMATE_TEMPLATE = gql`
  mutation DeleteEstimateTemplate($id: UUID!) {
    deleteFromestimate_templatesCollection(filter: { id: { eq: $id } }) {
      returning {
        id
      }
    }
  }
`;

// ─── Apollo React Hooks ───────────────────────────────────────────────────────

/**
 * Normalize a DB estimate_template row (snake_case) → app shape (camelCase).
 */
export function normalizeEstimateTemplate(row = {}) {
  if (!row || !row.id) return null;
  return {
    id: row.id,
    orgId: row.org_id,
    locationId: row.location_id,
    name: row.name,
    package: row.package,
    modifierSelections: row.modifier_selections,
    material: row.material,
    materialColor: row.material_color,
    basePrice: row.base_price != null ? Number(row.base_price) : null,
    createdById: row.created_by_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * List estimate templates for an org.
 * Returns { estimateTemplates, loading, error, refetch }
 */
export function USE_ESTIMATE_TEMPLATES({ orgId, locationId, first = 100, offset = 0 } = {}) {
  const { data, loading, error, refetch } = useQuery(LIST_ESTIMATE_TEMPLATES, {
    variables: { orgId, first, offset },
    skip: !orgId,
  });

  let edges = data?.estimate_templatesCollection?.edges ?? [];

  // Client-side location filter
  if (locationId) {
    edges = edges.filter(e => e.node.location_id === locationId);
  }

  const estimateTemplates = edges.map(e => normalizeEstimateTemplate(e.node));
  const pageInfo = data?.estimate_templatesCollection?.pageInfo ?? {};

  return { estimateTemplates, loading, error, refetch, ...pageInfo };
}

/**
 * Get a single estimate template by ID.
 * Returns { estimateTemplate, loading, error }
 */
export function USE_ESTIMATE_TEMPLATE(id) {
  const { data, loading, error } = useQuery(GET_ESTIMATE_TEMPLATE, {
    variables: { id },
    skip: !id,
  });

  const edge = data?.estimate_templatesCollection?.edges?.[0];
  return { estimateTemplate: edge ? normalizeEstimateTemplate(edge.node) : null, loading, error };
}

/**
 * Create an estimate template mutation hook.
 * Returns [createEstimateTemplate, { loading, error, data }]
 */
export function USE_CREATE_ESTIMATE_TEMPLATE() {
  return useMutation(CREATE_ESTIMATE_TEMPLATE, {
    update(cache, { data: { insertIntoestimate_templatesCollection } }) {
      const returning = insertIntoestimate_templatesCollection?.returning ?? [];
      if (!returning[0]) return;
      const newTemplate = normalizeEstimateTemplate(returning[0]);
      cache.modify({
        fields: {
          // eslint-disable-next-line no-unused-vars
          estimate_templatesCollection(existing = { edges: [] }, { readField }) {
            return {
              ...existing,
              edges: [
                { __typename: 'estimate_templatesEdge', node: newTemplate },
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
 * Update an estimate template mutation hook.
 * Returns [updateEstimateTemplate, { loading, error, data }]
 */
export function USE_UPDATE_ESTIMATE_TEMPLATE() {
  return useMutation(UPDATE_ESTIMATE_TEMPLATE);
}

/**
 * Delete an estimate template mutation hook.
 * Returns [deleteEstimateTemplate, { loading, error, data }]
 */
export function USE_DELETE_ESTIMATE_TEMPLATE() {
  return useMutation(DELETE_ESTIMATE_TEMPLATE, {
    update(cache, { data: { deleteFromestimate_templatesCollection } }) {
      const returning = deleteFromestimate_templatesCollection?.returning ?? [];
      if (!returning[0]?.id) return;
      cache.modify({
        fields: {
          // eslint-disable-next-line no-unused-vars
          estimate_templatesCollection(existing = { edges: [] }, { readField }) {
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
