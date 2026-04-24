import { gql } from '@apollo/client';
import { useQuery, useMutation } from '@apollo/client/react';

// NOTE: Job bookings are currently handled inside SchedulingContext.
// This file exists for future explicit workflow/kanban use cases
// that need direct job_bookingsCollection access.
//
// Job booking schema (DB: job_bookings):
//   id, org_id, estimate_id, bay_id, start_date,
//   estimated_hours, actual_hours, created_at, updated_at

export const JOB_BOOKING_FIELDS = gql`
  fragment JobBookingFields on job_bookings {
    id
    org_id
    estimate_id
    bay_id
    start_date
    estimated_hours
    actual_hours
    created_at
    updated_at
  }
`;

export const LIST_JOB_BOOKINGS = gql`
  query ListJobBookings($orgId: UUID!, $first: Int, $offset: Int) {
    job_bookingsCollection(
      filter: { org_id: { eq: $orgId } }
      first: $first
      offset: $offset
      orderBy: [{ start_date: ASC }]
    ) {
      edges {
        node {
          id
          org_id
          estimate_id
          bay_id
          start_date
          estimated_hours
          actual_hours
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
  ${JOB_BOOKING_FIELDS}
`;

export const CREATE_JOB_BOOKING = gql`
  mutation CreateJobBooking(
    $orgId: UUID!
    $estimateId: UUID!
    $bayId: UUID
    $startDate: date!
    $estimatedHours: BigFloat
  ) {
    insertIntojob_bookingsCollection(objects: [{
      org_id: $orgId
      estimate_id: $estimateId
      bay_id: $bayId
      start_date: $startDate
      estimated_hours: $estimatedHours
    }]) {
      returning {
        ...JobBookingFields
      }
    }
  }
  ${JOB_BOOKING_FIELDS}
`;

export const UPDATE_JOB_BOOKING = gql`
  mutation UpdateJobBooking(
    $id: UUID!
    $bayId: UUID
    $startDate: date
    $estimatedHours: BigFloat
    $actualHours: BigFloat
  ) {
    updatejob_bookingsCollection(
      filter: { id: { eq: $id } }
      set: {
        bay_id: $bayId
        start_date: $startDate
        estimated_hours: $estimatedHours
        actual_hours: $actualHours
      }
    ) {
      returning {
        ...JobBookingFields
      }
    }
  }
  ${JOB_BOOKING_FIELDS}
`;

export const DELETE_JOB_BOOKING = gql`
  mutation DeleteJobBooking($id: UUID!) {
    deleteFromjob_bookingsCollection(filter: { id: { eq: $id } }) {
      returning { id }
    }
  }
`;

// ─── Apollo React Hooks ─────────────────────────────────────────────────────

export function normalizeJobBooking(row = {}) {
  if (!row || !row.id) return null;
  return {
    id: row.id,
    orgId: row.org_id,
    estimateId: row.estimate_id,
    bayId: row.bay_id,
    startDate: row.start_date,
    estimatedHours: row.estimated_hours != null ? Number(row.estimated_hours) : null,
    actualHours: row.actual_hours != null ? Number(row.actual_hours) : null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function USE_JOB_BOOKINGS({ orgId, first = 200, offset = 0 } = {}) {
  const { data, loading, error, refetch } = useQuery(LIST_JOB_BOOKINGS, {
    variables: { orgId, first, offset },
    skip: !orgId,
  });
  const edges = data?.job_bookingsCollection?.edges ?? [];
  const jobBookings = edges.map(e => normalizeJobBooking(e.node));
  const pageInfo = data?.job_bookingsCollection?.pageInfo ?? {};
  return { jobBookings, loading, error, refetch, ...pageInfo };
}

export function USE_CREATE_JOB_BOOKING() {
  return useMutation(CREATE_JOB_BOOKING, {
    update(cache, { data: { insertIntojob_bookingsCollection } }) {
      const returning = insertIntojob_bookingsCollection?.returning ?? [];
      if (!returning[0]) return;
      const newBooking = normalizeJobBooking(returning[0]);
      cache.modify({
        fields: {
          // eslint-disable-next-line no-unused-vars
          job_bookingsCollection(existing = { edges: [] }, { readField }) {
            return {
              ...existing,
              edges: [
                { __typename: 'job_bookingsEdge', node: newBooking },
                ...existing.edges,
              ],
            };
          },
        },
      });
    },
  });
}

export function USE_UPDATE_JOB_BOOKING() {
  return useMutation(UPDATE_JOB_BOOKING, {
    update(cache, { data: { updatejob_bookingsCollection } }) {
      const returning = updatejob_bookingsCollection?.returning ?? [];
      if (!returning[0]) return;
      const updated = normalizeJobBooking(returning[0]);
      cache.modify({
        fields: {
          // eslint-disable-next-line no-unused-vars
          job_bookingsCollection(existing = { edges: [] }, { readField }) {
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

export function USE_DELETE_JOB_BOOKING() {
  return useMutation(DELETE_JOB_BOOKING, {
    update(cache, { data: { deleteFromjob_bookingsCollection } }) {
      const returning = deleteFromjob_bookingsCollection?.returning ?? [];
      if (!returning[0]?.id) return;
      cache.modify({
        fields: {
          // eslint-disable-next-line no-unused-vars
          job_bookingsCollection(existing = { edges: [] }, { readField }) {
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
