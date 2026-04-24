import { gql } from '@apollo/client';
import { useQuery, useMutation } from '@apollo/client';

// ─── Fragments ────────────────────────────────────────────────────────────────

export const APPOINTMENT_FIELDS = gql`
  fragment AppointmentFields on appointments {
    id
    org_id
    location_id
    customer_id
    vehicle_id
    technician_id
    service
    date
    start_time
    end_time
    status
    notes
    reminder_at
    reminder_sent
    reminder_queued
    created_at
    updated_at
    estimate_id
  }
`;

// ─── Queries ─────────────────────────────────────────────────────────────────

/**
 * List appointments for an org, ordered by date then start_time.
 * pg_graphql uses first/offset for pagination.
 */
export const LIST_APPOINTMENTS = gql`
  query ListAppointments($orgId: UUID!, $first: Int, $offset: Int) {
    appointmentsCollection(
      filter: {
        org_id: { eq: $orgId }
      }
      first: $first
      offset: $offset
      orderBy: [{ date: ASC }, { start_time: ASC }]
    ) {
      edges {
        node {
          id
          org_id
          location_id
          customer_id
          vehicle_id
          technician_id
          service
          date
          start_time
          end_time
          status
          notes
          reminder_at
          reminder_sent
          reminder_queued
          created_at
          updated_at
          estimate_id
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
  ${APPOINTMENT_FIELDS}
`;

/**
 * Get a single appointment by ID.
 */
export const GET_APPOINTMENT = gql`
  query GetAppointment($id: UUID!) {
    appointmentsCollection(filter: { id: { eq: $id } }, first: 1) {
      edges {
        node {
          ...AppointmentFields
        }
      }
    }
  }
  ${APPOINTMENT_FIELDS}
`;

// ─── Mutations ──────────────────────────────────────────────────────────────

/**
 * Create an appointment.
 */
export const CREATE_APPOINTMENT = gql`
  mutation CreateAppointment(
    $orgId: UUID!
    $locationId: UUID!
    $technicianId: UUID
    $estimateId: UUID
    $customerId: UUID
    $vehicleId: UUID
    $service: String!
    $date: date!
    $startTime: time!
    $endTime: time
    $status: String!
    $reminderQueued: Boolean
    $reminderAt: timestamptz
    $notes: String
  ) {
    insertIntoappointmentsCollection(objects: [{
      org_id: $orgId
      location_id: $locationId
      technician_id: $technicianId
      estimate_id: $estimateId
      customer_id: $customerId
      vehicle_id: $vehicleId
      service: $service
      date: $date
      start_time: $startTime
      end_time: $endTime
      status: $status
      reminder_queued: $reminderQueued
      reminder_at: $reminderAt
      notes: $notes
    }]) {
      returning {
        ...AppointmentFields
      }
    }
  }
  ${APPOINTMENT_FIELDS}
`;

/**
 * Update an appointment.
 */
export const UPDATE_APPOINTMENT = gql`
  mutation UpdateAppointment(
    $id: UUID!
    $technicianId: UUID
    $service: String
    $date: date
    $startTime: time
    $endTime: time
    $status: String
    $reminderQueued: Boolean
    $reminderSent: Boolean
    $reminderAt: timestamptz
    $notes: String
  ) {
    updateappointmentsCollection(
      filter: { id: { eq: $id } }
      set: {
        technician_id: $technicianId
        service: $service
        date: $date
        start_time: $startTime
        end_time: $endTime
        status: $status
        reminder_queued: $reminderQueued
        reminder_sent: $reminderSent
        reminder_at: $reminderAt
        notes: $notes
      }
    ) {
      returning {
        ...AppointmentFields
      }
    }
  }
  ${APPOINTMENT_FIELDS}
`;

/**
 * Delete an appointment.
 */
export const DELETE_APPOINTMENT = gql`
  mutation DeleteAppointment($id: UUID!) {
    deleteFromappointmentsCollection(filter: { id: { eq: $id } }) {
      returning {
        id
      }
    }
  }
`;

// ─── Apollo React Hooks ─────────────────────────────────────────────────────

/**
 * Normalize a DB appointment row (snake_case) → app shape (camelCase).
 */
export function normalizeAppointment(row = {}) {
  if (!row || !row.id) return null;
  return {
    id: row.id,
    orgId: row.org_id,
    locationId: row.location_id,
    customerId: row.customer_id,
    vehicleId: row.vehicle_id,
    technicianId: row.technician_id,
    service: row.service,
    date: row.date,
    startTime: row.start_time,
    endTime: row.end_time,
    status: row.status,
    notes: row.notes,
    reminderAt: row.reminder_at,
    reminderSent: row.reminder_sent,
    reminderQueued: row.reminder_queued,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    estimateId: row.estimate_id,
  };
}

/**
 * List appointments for an org.
 * Returns { appointments, loading, error, refetch }
 */
export function USE_APPOINTMENTS({ orgId, first = 300, offset = 0 } = {}) {
  const { data, loading, error, refetch } = useQuery(LIST_APPOINTMENTS, {
    variables: { orgId, first, offset },
    skip: !orgId,
  });

  const edges = data?.appointmentsCollection?.edges ?? [];
  const appointments = edges.map(e => normalizeAppointment(e.node));
  const pageInfo = data?.appointmentsCollection?.pageInfo ?? {};

  return { appointments, loading, error, refetch, ...pageInfo };
}

/**
 * Get a single appointment by ID.
 * Returns { appointment, loading, error }
 */
export function USE_APPOINTMENT(id) {
  const { data, loading, error } = useQuery(GET_APPOINTMENT, {
    variables: { id },
    skip: !id,
  });

  const edge = data?.appointmentsCollection?.edges?.[0];
  return { appointment: edge ? normalizeAppointment(edge.node) : null, loading, error };
}

/**
 * Create an appointment mutation hook.
 * Returns [createAppointment, { loading, error, data }]
 */
export function USE_CREATE_APPOINTMENT() {
  return useMutation(CREATE_APPOINTMENT, {
    update(cache, { data: { insertIntoappointmentsCollection } }) {
      const returning = insertIntoappointmentsCollection?.returning ?? [];
      if (!returning[0]) return;
      const newAppt = normalizeAppointment(returning[0]);
      cache.modify({
        fields: {
          // eslint-disable-next-line no-unused-vars
          appointmentsCollection(existing = { edges: [] }, { readField }) {
            return {
              ...existing,
              edges: [
                { __typename: 'appointmentsEdge', node: newAppt },
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
 * Update an appointment mutation hook.
 * Returns [updateAppointment, { loading, error, data }]
 */
export function USE_UPDATE_APPOINTMENT() {
  return useMutation(UPDATE_APPOINTMENT, {
    update(cache, { data: { updateappointmentsCollection } }) {
      const returning = updateappointmentsCollection?.returning ?? [];
      if (!returning[0]) return;
      const updated = normalizeAppointment(returning[0]);
      cache.modify({
        fields: {
          // eslint-disable-next-line no-unused-vars
          appointmentsCollection(existing = { edges: [] }, { readField }) {
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

/**
 * Delete an appointment mutation hook.
 * Returns [deleteAppointment, { loading, error, data }]
 */
export function USE_DELETE_APPOINTMENT() {
  return useMutation(DELETE_APPOINTMENT, {
    update(cache, { data: { deleteFromappointmentsCollection } }) {
      const returning = deleteFromappointmentsCollection?.returning ?? [];
      if (!returning[0]?.id) return;
      cache.modify({
        fields: {
          // eslint-disable-next-line no-unused-vars
          appointmentsCollection(existing = { edges: [] }, { readField }) {
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
