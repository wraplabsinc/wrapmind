import { gql } from '@apollo/client';
import { useQuery, useMutation } from '@apollo/client/react';

// ─── Fragments ────────────────────────────────────────────────────────────────

export const APPOINTMENT_FIELDS = gql`
  fragment AppointmentFields on Appointment {
    id
    orgId
    locationId
    estimateId
    customerId
    vehicleId
    technicianId
    service
    date
    startTime
    endTime
    status
    reminderQueued
    reminderSent
    reminderAt
    notes
    createdAt
    updatedAt
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
        orgId: { eq: $orgId }
      }
      first: $first
      offset: $offset
      orderBy: [{ date: ASC }, { startTime: ASC }]
    ) {
      edges {
        node {
          id
          locationId
          estimateId
          customerId
          vehicleId
          technicianId
          service
          date
          startTime
          endTime
          status
          reminderQueued
          reminderSent
          reminderAt
          notes
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
  ${APPOINTMENT_FIELDS}
`;

/**
 * Get a single appointment by ID.
 */
export const GET_APPOINTMENT = gql`
  query GetAppointment($id: UUID!) {
    appointment(id: $id) {
      ...AppointmentFields
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
    appointmentInsert(
      input: {
        orgId: $orgId
        locationId: $locationId
        technicianId: $technicianId
        estimateId: $estimateId
        customerId: $customerId
        vehicleId: $vehicleId
        service: $service
        date: $date
        startTime: $startTime
        endTime: $endTime
        status: $status
        reminderQueued: $reminderQueued
        reminderAt: $reminderAt
        notes: $notes
      }
    ) {
      ...AppointmentFields
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
    appointmentUpdate(
      id: $id
      set: {
        technicianId: $technicianId
        service: $service
        date: $date
        startTime: $startTime
        endTime: $endTime
        status: $status
        reminderQueued: $reminderQueued
        reminderSent: $reminderSent
        reminderAt: $reminderAt
        notes: $notes
      }
    ) {
      ...AppointmentFields
    }
  }
  ${APPOINTMENT_FIELDS}
`;

/**
 * Delete an appointment.
 */
export const DELETE_APPOINTMENT = gql`
  mutation DeleteAppointment($id: UUID!) {
    appointmentDelete(id: $id) {
      id
    }
  }
`;

// ─── Apollo React Hooks ─────────────────────────────────────────────────────

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
  const appointments = edges.map(e => e.node);
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

  return { appointment: data?.appointment ?? null, loading, error };
}

/**
 * Create an appointment mutation hook.
 * Returns [createAppointment, { loading, error, data }]
 */
export function USE_CREATE_APPOINTMENT() {
  return useMutation(CREATE_APPOINTMENT, {
    update(cache, { data: { appointmentInsert } }) {
      if (!appointmentInsert?.edges?.[0]?.node) return;
      const newAppt = appointmentInsert.edges[0].node;
      cache.modify({
        fields: {
          // eslint-disable-next-line no-unused-vars
          appointmentsCollection(existing = { edges: [] }, { readField }) {
            return {
              ...existing,
              edges: [
                { __typename: 'AppointmentEdge', node: newAppt },
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
  return useMutation(UPDATE_APPOINTMENT);
}

/**
 * Delete an appointment mutation hook.
 * Returns [deleteAppointment, { loading, error, data }]
 */
export function USE_DELETE_APPOINTMENT() {
  return useMutation(DELETE_APPOINTMENT, {
    update(cache, { data: { appointmentDelete } }) {
      if (!appointmentDelete?.id) return;
      cache.modify({
        fields: {
          // eslint-disable-next-line no-unused-vars
          appointmentsCollection(existing = { edges: [] }, { readField }) {
            return {
              ...existing,
              edges: existing.edges.filter(
                e => e.node?.id !== appointmentDelete.id
              ),
            };
          },
        },
      });
    },
  });
}
