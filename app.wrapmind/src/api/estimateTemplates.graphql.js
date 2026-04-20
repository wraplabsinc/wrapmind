import { gql } from '@apollo/client';
import { useQuery, useMutation } from '@apollo/client/react';

// ─── Fragments ────────────────────────────────────────────────────────────────

export const ESTIMATE_TEMPLATE_FIELDS = gql`
  fragment EstimateTemplateFields on EstimateTemplate {
    id
    orgId
    locationId
    name
    package
    modifierSelections
    material
    materialColor
    basePrice
    createdById
    createdAt
    updatedAt
  }
`;

// ─── Queries ─────────────────────────────────────────────────────────────────

/**
 * List estimate templates for an org, optionally filtered by location.
 * pg_graphql uses first/offset for pagination.
 */
export const LIST_ESTIMATE_TEMPLATES = gql`
  query ListEstimateTemplates($orgId: UUID!, $locationId: UUID, $first: Int, $offset: Int) {
    estimateTemplatesCollection(
      filter: {
        orgId: { eq: $orgId }
      }
      first: $first
      offset: $offset
      orderBy: [{ name: ASC }]
    ) {
      edges {
        node {
          id
          orgId
          locationId
          name
          package
          modifierSelections
          material
          materialColor
          basePrice
          createdById
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
  ${ESTIMATE_TEMPLATE_FIELDS}
`;

/**
 * Get a single estimate template by ID.
 */
export const GET_ESTIMATE_TEMPLATE = gql`
  query GetEstimateTemplate($id: UUID!) {
    estimateTemplate(id: $id) {
      ...EstimateTemplateFields
    }
  }
  ${ESTIMATE_TEMPLATE_FIELDS}
`;

// ─── Mutations ────────────────────────────────────────────────────────────────

const ESTIMATE_TEMPLATE_INPUT = `
  $orgId: UUID!
  $locationId: UUID!
  $name: String!
  $package: String
  $modifierSelections: JSON
  $material: String
  $materialColor: String
  $basePrice: Float
`;

const ESTIMATE_TEMPLATE_VARIABLES = `
  orgId: $orgId
  locationId: $locationId
  name: $name
  package: $package
  modifierSelections: $modifierSelections
  material: $material
  materialColor: $materialColor
  basePrice: $basePrice
`;

/**
 * Create a new estimate template.
 */
export const CREATE_ESTIMATE_TEMPLATE = gql`
  mutation CreateEstimateTemplate(
    ${ESTIMATE_TEMPLATE_INPUT}
  ) {
    estimateTemplateInsert(
      collection: "estimateTemplates"
      records: [{ ${ESTIMATE_TEMPLATE_VARIABLES} }]
    ) {
      edges {
        node {
          ...EstimateTemplateFields
        }
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
    estimateTemplateUpdate(id: $id, set: {
      name: $name
      package: $package
      modifierSelections: $modifierSelections
      material: $material
      materialColor: $materialColor
      basePrice: $basePrice
    }) {
      ...EstimateTemplateFields
    }
  }
  ${ESTIMATE_TEMPLATE_FIELDS}
`;

/**
 * Delete an estimate template.
 */
export const DELETE_ESTIMATE_TEMPLATE = gql`
  mutation DeleteEstimateTemplate($id: UUID!) {
    estimateTemplateDelete(id: $id) {
      id
    }
  }
`;

// ─── Apollo React Hooks ───────────────────────────────────────────────────────

/**
 * List estimate templates for an org.
 * Returns { estimateTemplates, loading, error, refetch }
 */
export function USE_ESTIMATE_TEMPLATES({ orgId, locationId, first = 100, offset = 0 } = {}) {
  const { data, loading, error, refetch } = useQuery(LIST_ESTIMATE_TEMPLATES, {
    variables: { orgId, first, offset },
    skip: !orgId,
  });

  let edges = data?.estimateTemplatesCollection?.edges ?? [];

  // Client-side location filter (pg_graphql filter on locationId is also valid)
  if (locationId) {
    edges = edges.filter(e => e.node.locationId === locationId);
  }

  const estimateTemplates = edges.map(e => e.node);
  const pageInfo = data?.estimateTemplatesCollection?.pageInfo ?? {};

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

  return { estimateTemplate: data?.estimateTemplate ?? null, loading, error };
}

/**
 * Create an estimate template mutation hook.
 * Returns [createEstimateTemplate, { loading, error, data }]
 */
export function USE_CREATE_ESTIMATE_TEMPLATE() {
  return useMutation(CREATE_ESTIMATE_TEMPLATE, {
    update(cache, { data: { estimateTemplateInsert } }) {
      if (!estimateTemplateInsert?.edges?.[0]?.node) return;
      const newEstimateTemplate = estimateTemplateInsert.edges[0].node;
      cache.modify({
        fields: {
          // eslint-disable-next-line no-unused-vars
          estimateTemplatesCollection(existing = { edges: [] }, { TO_MUCH }) {
            return {
              ...existing,
              edges: [
                { __typename: 'EstimateTemplateEdge', node: newEstimateTemplate },
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
    update(cache, { data: { estimateTemplateDelete } }) {
      if (!estimateTemplateDelete?.id) return;
      cache.modify({
        fields: {
          // eslint-disable-next-line no-unused-vars
          estimateTemplatesCollection(existing = { edges: [] }, { TO_MUCH }) {
            return {
              ...existing,
              edges: existing.edges.filter(
                e => e.node?.id !== estimateTemplateDelete.id
              ),
            };
          },
        },
      });
    },
  });
}
