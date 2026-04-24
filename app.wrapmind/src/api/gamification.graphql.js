import { gql } from '@apollo/client';
import { useQuery, useMutation } from '@apollo/client';

// ─── Fragments ────────────────────────────────────────────────────────────────

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

export const ACHIEVEMENT_EVENT_FIELDS = gql`
  fragment AchievementEventFields on achievement_events {
    id
    org_id
    employee_id
    achievement_id
    xp
    note
    awarded_by
    awarded_at
  }
`;

// ─── Queries ─────────────────────────────────────────────────────────────────

/**
 * List employees for an org.
 */
export const LIST_EMPLOYEES = gql`
  query ListEmployees($orgId: UUID!, $first: Int, $offset: Int) {
    employeesCollection(
      filter: { org_id: { eq: $orgId } }
      first: $first
      offset: $offset
      orderBy: [{ created_at: ASC }]
    ) {
      edges {
        node {
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
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
  ${EMPLOYEE_FIELDS}
`;

/**
 * Get a single employee by ID.
 */
export const GET_EMPLOYEE = gql`
  query GetEmployee($id: UUID!) {
    employeesCollection(filter: { id: { eq: $id } }, first: 1) {
      edges {
        node {
          ...EmployeeFields
        }
      }
    }
  }
  ${EMPLOYEE_FIELDS}
`;

/**
 * List achievement events for an org, ordered by awarded_at desc.
 */
export const LIST_ACHIEVEMENT_EVENTS = gql`
  query ListAchievementEvents($orgId: UUID!, $first: Int, $offset: Int) {
    achievement_eventsCollection(
      filter: { org_id: { eq: $orgId } }
      first: $first
      offset: $offset
      orderBy: [{ awarded_at: DESC }]
    ) {
      edges {
        node {
          id
          org_id
          employee_id
          achievement_id
          xp
          note
          awarded_by
          awarded_at
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
  ${ACHIEVEMENT_EVENT_FIELDS}
`;

// ─── Mutations ──────────────────────────────────────────────────────────────

export const CREATE_EMPLOYEE = gql`
  mutation CreateEmployee(
    $orgId: UUID!
    $profileId: UUID
    $name: String!
    $initials: String
    $role: String
    $color: String
    $isActive: Boolean
  ) {
    insertIntoemployeesCollection(objects: [{
      org_id: $orgId
      profile_id: $profileId
      name: $name
      initials: $initials
      role: $role
      color: $color
      is_active: $isActive
    }]) {
      returning {
        ...EmployeeFields
      }
    }
  }
  ${EMPLOYEE_FIELDS}
`;

export const UPDATE_EMPLOYEE = gql`
  mutation UpdateEmployee(
    $id: UUID!
    $name: String
    $initials: String
    $role: String
    $color: String
    $isActive: Boolean
  ) {
    updateemployeesCollection(
      filter: { id: { eq: $id } }
      set: {
        name: $name
        initials: $initials
        role: $role
        color: $color
        is_active: $isActive
      }
    ) {
      returning {
        ...EmployeeFields
      }
    }
  }
  ${EMPLOYEE_FIELDS}
`;

export const DELETE_EMPLOYEE = gql`
  mutation DeleteEmployee($id: UUID!) {
    deletefromemployeesCollection(filter: { id: { eq: $id } }) {
      returning {
        id
      }
    }
  }
`;

export const AWARD_ACHIEVEMENT = gql`
  mutation AwardAchievement(
    $orgId: UUID!
    $employeeId: UUID!
    $achievementId: String!
    $xp: Int!
    $note: String
    $awardedBy: String
  ) {
    insertIntoachievement_eventsCollection(objects: [{
      org_id: $orgId
      employee_id: $employeeId
      achievement_id: $achievementId
      xp: $xp
      note: $note
      awarded_by: $awardedBy
    }]) {
      returning {
        ...AchievementEventFields
      }
    }
  }
  ${ACHIEVEMENT_EVENT_FIELDS}
`;

// ─── Apollo React Hooks ─────────────────────────────────────────────────────

/**
 * Normalize a DB employee row (snake_case) → app shape (camelCase).
 */
export function normalizeEmployee(row = {}) {
  if (!row || !row.id) return null;
  return {
    id: row.id,
    orgId: row.org_id,
    profileId: row.profile_id,
    name: row.name,
    initials: row.initials,
    role: row.role,
    color: row.color,
    isActive: row.is_active,
    createdAt: row.created_at,
  };
}

/**
 * Normalize a DB achievement event row (snake_case) → app shape (camelCase).
 */
export function normalizeAchievementEvent(row = {}) {
  if (!row || !row.id) return null;
  return {
    id: row.id,
    orgId: row.org_id,
    employeeId: row.employee_id,
    achievementId: row.achievement_id,
    xp: row.xp,
    note: row.note,
    awardedBy: row.awarded_by,
    awardedAt: row.awarded_at,
  };
}

export function USE_EMPLOYEES({ orgId, first = 100, offset = 0 } = {}) {
  const { data, loading, error, refetch } = useQuery(LIST_EMPLOYEES, {
    variables: { orgId, first, offset },
    skip: !orgId,
  });
  const edges = data?.employeesCollection?.edges ?? [];
  const employees = edges.map(e => normalizeEmployee(e.node));
  return { employees, loading, error, refetch };
}

export function USE_EMPLOYEE(id) {
  const { data, loading, error } = useQuery(GET_EMPLOYEE, {
    variables: { id },
    skip: !id,
  });
  const edge = data?.employeesCollection?.edges?.[0];
  return { employee: edge ? normalizeEmployee(edge.node) : null, loading, error };
}

export function USE_ACHIEVEMENT_EVENTS({ orgId, first = 300, offset = 0 } = {}) {
  const { data, loading, error, refetch } = useQuery(LIST_ACHIEVEMENT_EVENTS, {
    variables: { orgId, first, offset },
    skip: !orgId,
  });
  const edges = data?.achievement_eventsCollection?.edges ?? [];
  const events = edges.map(e => normalizeAchievementEvent(e.node));
  return { events, loading, error, refetch };
}

export function USE_CREATE_EMPLOYEE() {
  return useMutation(CREATE_EMPLOYEE, {
    update(cache, { data: { insertIntoemployeesCollection } }) {
      const returning = insertIntoemployeesCollection?.returning ?? [];
      if (!returning[0]) return;
      const newEmp = normalizeEmployee(returning[0]);
      cache.modify({
        fields: {
          // eslint-disable-next-line no-unused-vars
          employeesCollection(existing = { edges: [] }, { readField }) {
            return {
              ...existing,
              edges: [
                { __typename: 'employeesEdge', node: newEmp },
                ...existing.edges,
              ],
            };
          },
        },
      });
    },
  });
}

export function USE_UPDATE_EMPLOYEE() {
  return useMutation(UPDATE_EMPLOYEE, {
    update(cache, { data: { updateemployeesCollection } }) {
      const returning = updateemployeesCollection?.returning ?? [];
      if (!returning[0]) return;
      const updated = normalizeEmployee(returning[0]);
      cache.modify({
        fields: {
          // eslint-disable-next-line no-unused-vars
          employeesCollection(existing = { edges: [] }, { readField }) {
            return {
              ...existing,
              edges: existing.edges.map(e =>
                e.node?.id === updated.id
                  ? { ...e, node: { ...e.node, ...updated } }
                  : e
              ),
            };
          },
        },
      });
    },
  });
}

export function USE_DELETE_EMPLOYEE() {
  return useMutation(DELETE_EMPLOYEE, {
    update(cache, { data: { deletefromemployeesCollection } }) {
      const returning = deletefromemployeesCollection?.returning ?? [];
      if (!returning[0]?.id) return;
      cache.modify({
        fields: {
          // eslint-disable-next-line no-unused-vars
          employeesCollection(existing = { edges: [] }, { readField }) {
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

export function USE_AWARD_ACHIEVEMENT() {
  return useMutation(AWARD_ACHIEVEMENT, {
    update(cache, { data: { insertIntoachievement_eventsCollection } }) {
      const returning = insertIntoachievement_eventsCollection?.returning ?? [];
      if (!returning[0]) return;
      const newEvent = normalizeAchievementEvent(returning[0]);
      cache.modify({
        fields: {
          // eslint-disable-next-line no-unused-vars
          achievement_eventsCollection(existing = { edges: [] }, { readField }) {
            return {
              ...existing,
              edges: [
                { __typename: 'achievement_eventsEdge', node: newEvent },
                ...existing.edges,
              ],
            };
          },
        },
      });
    },
  });
}
