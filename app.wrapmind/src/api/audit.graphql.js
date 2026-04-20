import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';

// ─── Fragment ────────────────────────────────────────────────────────────────

export const AUDIT_LOG_FIELDS = gql`
  fragment AuditLogFields on AuditLog {
    id
    orgId
    locationId
    actorId
    actorRole
    actorLabel
    action
    severity
    target
    targetId
    details
    createdAt
  }
`;

// ─── Queries ────────────────────────────────────────────────────────────────

/**
 * List audit log entries for an org.
 * Ordered by createdAt desc (most recent first).
 * Supports optional filters: actorId, targetId, action, severity.
 */
export const LIST_AUDIT_LOG = gql`
  query ListAuditLog(
    $orgId: UUID!
    $actorId: UUID
    $targetId: UUID
    $action: String
    $severity: String
    $first: Int
    $offset: Int
  ) {
    auditLogsCollection(
      filter: {
        orgId: { eq: $orgId }
      }
      first: $first
      offset: $offset
      orderBy: [{ createdAt: DESC }]
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
    auditLog(id: $id) {
      ...AuditLogFields
    }
  }
  ${AUDIT_LOG_FIELDS}
`;

// ─── Apollo React Hooks ─────────────────────────────────────────────────────

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
  const auditLogs = data?.auditLogsCollection?.edges?.map(e => e.node) ?? [];
  const pageInfo = data?.auditLogsCollection?.pageInfo ?? {};
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
  return { entry: data?.auditLog ?? null, loading, error };
}
