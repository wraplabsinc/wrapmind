import { gql } from '@apollo/client';
import { useQuery, useMutation } from '@apollo/client/react';

// ─── Fragments ────────────────────────────────────────────────────────────────

export const EMPLOYEE_FIELDS = gql`
  fragment EmployeeFields on Employee {
    id
    orgId
    profileId
    name
    initials
    role
    color
    isActive
    createdAt
  }
`;

export const ACHIEVEMENT_EVENT_FIELDS = gql`
  fragment AchievementEventFields on AchievementEvent {
    id
    orgId
    employeeId
    achievementId
    xp
    note
    awardedBy
    awardedAt
  }
`;

// ─── Queries ─────────────────────────────────────────────────────────────────

/**
 * List employees for an org.
 */
export const LIST_EMPLOYEES = gql`
  query ListEmployees($orgId: UUID!, $first: Int, $offset: Int) {
    employeesCollection(
      filter: { orgId: { eq: $orgId } }
      first: $first
      offset: $offset
      orderBy: [{ createdAt: ASC }]
    ) {
      edges {
        node {
          id
          orgId
          profileId
          name
          initials
          role
          color
          isActive
          createdAt
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
    employee(id: $id) {
      ...EmployeeFields
    }
  }
  ${EMPLOYEE_FIELDS}
`;

/**
 * List achievement events for an org, ordered by awarded_at desc.
 */
export const LIST_ACHIEVEMENT_EVENTS = gql`
  query ListAchievementEvents($orgId: UUID!, $first: Int, $offset: Int) {
    achievementEventsCollection(
      filter: { orgId: { eq: $orgId } }
      first: $first
      offset: $offset
      orderBy: [{ awardedAt: DESC }]
    ) {
      edges {
        node {
          id
          orgId
          employeeId
          achievementId
          xp
          note
          awardedBy
          awardedAt
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
    employeeInsert(
      input: {
        orgId: $orgId
        profileId: $profileId
        name: $name
        initials: $initials
        role: $role
        color: $color
        isActive: $isActive
      }
    ) {
      ...EmployeeFields
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
    employeeUpdate(
      id: $id
      set: {
        name: $name
        initials: $initials
        role: $role
        color: $color
        isActive: $isActive
      }
    ) {
      ...EmployeeFields
    }
  }
  ${EMPLOYEE_FIELDS}
`;

export const DELETE_EMPLOYEE = gql`
  mutation DeleteEmployee($id: UUID!) {
    employeeDelete(id: $id) {
      id
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
    achievementEventInsert(
      input: {
        orgId: $orgId
        employeeId: $employeeId
        achievementId: $achievementId
        xp: $xp
        note: $note
        awardedBy: $awardedBy
      }
    ) {
      ...AchievementEventFields
    }
  }
  ${ACHIEVEMENT_EVENT_FIELDS}
`;

// ─── Apollo React Hooks ─────────────────────────────────────────────────────

export function USE_EMPLOYEES({ orgId, first = 100, offset = 0 } = {}) {
  const { data, loading, error, refetch } = useQuery(LIST_EMPLOYEES, {
    variables: { orgId, first, offset },
    skip: !orgId,
  });
  const edges = data?.employeesCollection?.edges ?? [];
  const employees = edges.map(e => e.node);
  return { employees, loading, error, refetch };
}

export function USE_EMPLOYEE(id) {
  const { data, loading, error } = useQuery(GET_EMPLOYEE, {
    variables: { id },
    skip: !id,
  });
  return { employee: data?.employee ?? null, loading, error };
}

export function USE_ACHIEVEMENT_EVENTS({ orgId, first = 300, offset = 0 } = {}) {
  const { data, loading, error, refetch } = useQuery(LIST_ACHIEVEMENT_EVENTS, {
    variables: { orgId, first, offset },
    skip: !orgId,
  });
  const edges = data?.achievementEventsCollection?.edges ?? [];
  const events = edges.map(e => e.node);
  return { events, loading, error, refetch };
}

export function USE_CREATE_EMPLOYEE() {
  return useMutation(CREATE_EMPLOYEE, {
    update(cache, { data: { employeeInsert } }) {
      if (!employeeInsert?.edges?.[0]?.node) return;
      const newEmp = employeeInsert.edges[0].node;
      cache.modify({
        fields: {
          // eslint-disable-next-line no-unused-vars
          employeesCollection(existing = { edges: [] }, { readField }) {
            return {
              ...existing,
              edges: [
                { __typename: 'EmployeeEdge', node: newEmp },
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
  return useMutation(UPDATE_EMPLOYEE);
}

export function USE_DELETE_EMPLOYEE() {
  return useMutation(DELETE_EMPLOYEE, {
    update(cache, { data: { employeeDelete } }) {
      if (!employeeDelete?.id) return;
      cache.modify({
        fields: {
          // eslint-disable-next-line no-unused-vars
          employeesCollection(existing = { edges: [] }, { readField }) {
            return {
              ...existing,
              edges: existing.edges.filter(
                e => e.node?.id !== employeeDelete.id
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
    update(cache, { data: { achievementEventInsert } }) {
      if (!achievementEventInsert?.edges?.[0]?.node) return;
      const newEvent = achievementEventInsert.edges[0].node;
      cache.modify({
        fields: {
          // eslint-disable-next-line no-unused-vars
          achievementEventsCollection(existing = { edges: [] }, { readField }) {
            return {
              ...existing,
              edges: [
                { __typename: 'AchievementEventEdge', node: newEvent },
                ...existing.edges,
              ],
            };
          },
        },
      });
    },
  });
}
