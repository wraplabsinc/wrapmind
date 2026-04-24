import { gql } from '@apollo/client';
import { useQuery, useMutation } from '@apollo/client/react';

// ─── Fragments ────────────────────────────────────────────────────────────────

export const AUDIT_LOG_FIELDS = gql`
  fragment AuditLogFields on audit_log {
    id
    org_id
    user_id
    action
    entity_type
    entity_id
    before_json
    after_json
    created_at
  }
`;

export const EMPLOYEE_FIELDS = gql`
  fragment EmployeeFields on employees {
    id
    org_id
    profile_id
    name
    initials
    role
    color
    is_active
    created_at
  }
`;

// ─── Queries ────────────────────────────────────────────────────────────────

/**
 * List audit log entries for an org.
 * Ordered by created_at desc (most recent first).
 * Supports optional filters: user_id, entity_id, action.
 */
export const LIST_AUDIT_LOG = gql`
  query ListAuditLog(
    $orgId: UUID!
    $userId: UUID
    $entityId: UUID
    $action: String
    $first: Int
    $offset: Int
  ) {
    audit_logCollection(
      filter: {
        org_id: { eq: $orgId }
      }
      first: $first
      offset: $offset
      orderBy: [{ created_at: DESC }]
    ) {
      edges {
        node {
          ...AuditLogFields
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
  ${AUDIT_LOG_FIELDS}
`;

/**
 * Get a single audit log entry by ID.
 */
export const GET_AUDIT_LOG_ENTRY = gql`
  query GetAuditLogEntry($id: UUID!) {
    audit_logCollection(filter: { id: { eq: $id } }, first: 1) {
      edges {
        node {
          ...AuditLogFields
        }
      }
    }
  }
  ${AUDIT_LOG_FIELDS}
`;

// ─── Mutations ──────────────────────────────────────────────────────────────

/**
 * Insert a new audit log entry.
 */
export const INSERT_AUDIT_LOG = gql`
  mutation InsertAuditLog(
    $orgId: UUID!
    $userId: UUID!
    $action: String!
    $entityType: String!
    $entityId: UUID!
    $beforeJson: String
    $afterJson: String
  ) {
    insertIntoaudit_logCollection(objects: [{
      org_id: $orgId
      user_id: $userId
      action: $action
      entity_type: $entityType
      entity_id: $entityId
      before_json: $beforeJson
      after_json: $afterJson
    }]) {
      returning {
        ...AuditLogFields
      }
    }
  }
  ${AUDIT_LOG_FIELDS}
`;

// ─── Apollo React Hooks ─────────────────────────────────────────────────────

/**
 * Normalize a DB audit log row (snake_case) → app shape (camelCase).
 */
export function normalizeAuditLog(row = {}) {
  if (!row || !row.id) return null;
  return {
    id: row.id,
    orgId: row.org_id,
    userId: row.user_id,
    action: row.action,
    entityType: row.entity_type,
    entityId: row.entity_id,
    beforeJson: row.before_json,
    afterJson: row.after_json,
    createdAt: row.created_at,
  };
}

/**
 * List audit log entries for an org.
 * @param {object} params
 * @param {string} params.orgId - Required org UUID
 * @param {number} params.first - Page size (default 100)
 * @param {number} params.offset - Pagination offset (default 0)
 * @returns {{ auditLogs, loading, error, refetch }}
 */
export function USE_AUDIT_LOG({ orgId, first = 100, offset = 0 } = {}) {
  const { data, loading, error, refetch } = useQuery(LIST_AUDIT_LOG, {
    variables: { orgId, first, offset },
    skip: !orgId,
  });
  const edges = data?.audit_logCollection?.edges ?? [];
  const auditLogs = edges.map(e => normalizeAuditLog(e.node));
  const pageInfo = data?.audit_logCollection?.pageInfo ?? {};
  return { auditLogs, loading, error, refetch, ...pageInfo };
}

/**
 * Get a single audit log entry by ID.
 * @param {string} id - Audit log entry UUID
 * @returns {{ entry, loading, error }}
 */
export function USE_AUDIT_LOG_ENTRY(id) {
  const { data, loading, error } = useQuery(GET_AUDIT_LOG_ENTRY, {
    variables: { id },
    skip: !id,
  });
  const edge = data?.audit_logCollection?.edges?.[0];
  return { entry: edge ? normalizeAuditLog(edge.node) : null, loading, error };
}

/**
 * Insert an audit log entry.
 * Returns [insertAuditLog, { loading, error, data }]
 */
export function USE_INSERT_AUDIT_LOG() {
  return useMutation(INSERT_AUDIT_LOG, {
    update(cache, { data: { insertIntoaudit_logCollection } }) {
      const returning = insertIntoaudit_logCollection?.returning ?? [];
      if (!returning[0]) return;
      const newEntry = normalizeAuditLog(returning[0]);
      cache.modify({
        fields: {
          // eslint-disable-next-line no-unused-vars
          audit_logCollection(existing = { edges: [] }, { readField }) {
            return {
              ...existing,
              edges: [
                { __typename: 'audit_logEdge', node: newEntry },
                ...existing.edges,
              ],
            };
          },
        },
      });
    },
  });
}
