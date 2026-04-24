import { gql } from '@apollo/client';
import { useQuery, useMutation } from '@apollo/client';

// ─── Fragment ────────────────────────────────────────────────────────────────

export const LEAD_FIELDS = gql`
  fragment LeadFields on leads {
    id
    org_id
    location_id
    name
    phone
    email
    source
    service_interest
    budget
    priority
    status
    assignee_id
    customer_id
    notes
    created_at
    updated_at
    vehicle_year
    vehicle_make
    vehicle_model
    vehicle_vin
    vehicle_type
    vehicle_color
    follow_up_date
  }
`;

// ─── Queries ─────────────────────────────────────────────────────────────────

/**
 * List leads for an org, ordered by created_at desc.
 */
export const LIST_LEADS = gql`
  query ListLeads($orgId: UUID!, $first: Int, $offset: Int) {
    leadsCollection(
      filter: { org_id: { eq: $orgId } }
      first: $first
      offset: $offset
      orderBy: [{ created_at: DESC }]
    ) {
      edges {
        node {
          id
          org_id
          location_id
          name
          phone
          email
          source
          service_interest
          budget
          priority
          status
          assignee_id
          customer_id
          notes
          created_at
          updated_at
          vehicle_year
          vehicle_make
          vehicle_model
          vehicle_vin
          vehicle_type
          vehicle_color
          follow_up_date
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
  ${LEAD_FIELDS}
`;

/**
 * Get a single lead by ID.
 */
export const GET_LEAD = gql`
  query GetLead($id: UUID!) {
    leadsCollection(filter: { id: { eq: $id } }, first: 1) {
      edges {
        node {
          ...LeadFields
        }
      }
    }
  }
  ${LEAD_FIELDS}
`;

// ─── Mutations ──────────────────────────────────────────────────────────────

export const CREATE_LEAD = gql`
  mutation CreateLead(
    $orgId: UUID!
    $locationId: UUID!
    $name: String!
    $phone: String
    $email: String
    $source: String
    $serviceInterest: String
    $budget: BigFloat
    $priority: String
    $status: String
    $notes: String
    $vehicleYear: Int
    $vehicleMake: String
    $vehicleModel: String
    $vehicleVin: String
    $vehicleType: String
    $vehicleColor: String
    $followUpDate: TIMESTAMPTZ
  ) {
    insertIntoleadsCollection(objects: [{
      org_id: $orgId
      location_id: $locationId
      name: $name
      phone: $phone
      email: $email
      source: $source
      service_interest: $serviceInterest
      budget: $budget
      priority: $priority
      status: $status
      notes: $notes
      vehicle_year: $vehicleYear
      vehicle_make: $vehicleMake
      vehicle_model: $vehicleModel
      vehicle_vin: $vehicleVin
      vehicle_type: $vehicleType
      vehicle_color: $vehicleColor
      follow_up_date: $followUpDate
    }]) {
      returning {
        ...LeadFields
      }
    }
  }
  ${LEAD_FIELDS}
`;

export const UPDATE_LEAD = gql`
  mutation UpdateLead(
    $id: UUID!
    $name: String
    $phone: String
    $email: String
    $source: String
    $serviceInterest: String
    $budget: BigFloat
    $priority: String
    $status: String
    $assigneeId: UUID
    $customerId: UUID
    $notes: String
    $vehicleYear: Int
    $vehicleMake: String
    $vehicleModel: String
    $vehicleVin: String
    $vehicleType: String
    $vehicleColor: String
    $followUpDate: TIMESTAMPTZ
  ) {
    updateleadsCollection(
      filter: { id: { eq: $id } }
      set: {
        name: $name
        phone: $phone
        email: $email
        source: $source
        service_interest: $serviceInterest
        budget: $budget
        priority: $priority
        status: $status
        assignee_id: $assigneeId
        customer_id: $customerId
        notes: $notes
        vehicle_year: $vehicleYear
        vehicle_make: $vehicleMake
        vehicle_model: $vehicleModel
        vehicle_vin: $vehicleVin
        vehicle_type: $vehicleType
        vehicle_color: $vehicleColor
        follow_up_date: $followUpDate
      }
    ) {
      returning {
        ...LeadFields
      }
    }
  }
  ${LEAD_FIELDS}
`;

export const DELETE_LEAD = gql`
  mutation DeleteLead($id: UUID!) {
    deleteFromleadsCollection(filter: { id: { eq: $id } }) {
      returning {
        id
      }
    }
  }
`;

// ─── Apollo React Hooks ─────────────────────────────────────────────────────

/**
 * Normalize a DB lead row (snake_case) → app shape (camelCase).
 */
export function normalizeLead(row = {}) {
  if (!row || !row.id) return null;
  return {
    id: row.id,
    orgId: row.org_id,
    locationId: row.location_id,
    name: row.name,
    phone: row.phone,
    email: row.email,
    source: row.source,
    serviceInterest: row.service_interest,
    budget: row.budget != null ? Number(row.budget) : null,
    priority: row.priority,
    status: row.status,
    assigneeId: row.assignee_id,
    customerId: row.customer_id,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    vehicleYear: row.vehicle_year,
    vehicleMake: row.vehicle_make,
    vehicleModel: row.vehicle_model,
    vehicleVin: row.vehicle_vin,
    vehicleType: row.vehicle_type,
    vehicleColor: row.vehicle_color,
    followUpDate: row.follow_up_date,
  };
}

export function USE_LEADS({ orgId, first = 200, offset = 0 } = {}) {
  const { data, loading, error, refetch } = useQuery(LIST_LEADS, {
    variables: { orgId, first, offset },
    skip: !orgId,
  });
  const edges = data?.leadsCollection?.edges ?? [];
  const leads = edges.map(e => normalizeLead(e.node));
  return { leads, loading, error, refetch };
}

export function USE_LEAD(id) {
  const { data, loading, error } = useQuery(GET_LEAD, {
    variables: { id },
    skip: !id,
  });
  const edge = data?.leadsCollection?.edges?.[0];
  return { lead: edge ? normalizeLead(edge.node) : null, loading, error };
}

export function USE_CREATE_LEAD() {
  return useMutation(CREATE_LEAD, {
    update(cache, { data: { insertIntoleadsCollection } }) {
      const returning = insertIntoleadsCollection?.returning ?? [];
      if (!returning[0]) return;
      const newLead = normalizeLead(returning[0]);
      cache.modify({
        fields: {
          // eslint-disable-next-line no-unused-vars
          leadsCollection(existing = { edges: [] }, { readField }) {
            return {
              ...existing,
              edges: [
                { __typename: 'leadsEdge', node: newLead },
                ...existing.edges,
              ],
            };
          },
        },
      });
    },
  });
}

export function USE_UPDATE_LEAD() {
  return useMutation(UPDATE_LEAD, {
    update(cache, { data: { updateleadsCollection } }) {
      const returning = updateleadsCollection?.returning ?? [];
      if (!returning[0]) return;
      const updated = normalizeLead(returning[0]);
      cache.modify({
        fields: {
          // eslint-disable-next-line no-unused-vars
          leadsCollection(existing = { edges: [] }, { readField }) {
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

export function USE_DELETE_LEAD() {
  return useMutation(DELETE_LEAD, {
    update(cache, { data: { deleteFromleadsCollection } }) {
      const returning = deleteFromleadsCollection?.returning ?? [];
      if (!returning[0]?.id) return;
      cache.modify({
        fields: {
          // eslint-disable-next-line no-unused-vars
          leadsCollection(existing = { edges: [] }, { readField }) {
            return {
              ...existing,
              edges: existing.edges.filter(e => e.node?.id !== returning[0].id),
            };
          },
        },
      });
    },
  });
}

// ════════════════════════════════════════════════════════════════════════════
// INTAKE LEADS (web-form submissions)
// DB: intake_leads  |  Collection: intake_leadsCollection
// ════════════════════════════════════════════════════════════════════════════

export const INTAKE_LEAD_FIELDS = gql`
  fragment IntakeLeadFields on intake_leads {
    id
    org_id
    first_name
    last_name
    phone
    email
    vehicle_year
    vehicle_make
    vehicle_model
    vehicle_color
    services_requested
    photos_json
    status
    notes
    assigned_to
    created_at
    updated_at
    call_recording_url
    call_transcription
    intake_channel
  }
`;

export const LIST_INTAKE_LEADS = gql`
  query ListIntakeLeads($orgId: UUID!, $first: Int, $offset: Int) {
    intake_leadsCollection(
      filter: { org_id: { eq: $orgId } }
      first: $first
      offset: $offset
      orderBy: [{ created_at: DESC }]
    ) {
      edges {
        node {
          id
          org_id
          first_name
          last_name
          phone
          email
          vehicle_year
          vehicle_make
          vehicle_model
          vehicle_color
          services_requested
          photos_json
          status
          notes
          assigned_to
          created_at
          updated_at
          call_recording_url
          call_transcription
          intake_channel
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
  ${INTAKE_LEAD_FIELDS}
`;

export const CREATE_INTAKE_LEAD = gql`
  mutation CreateIntakeLead(
    $orgId: UUID!
    $firstName: String!
    $lastName: String!
    $phone: String
    $email: String
    $vehicleYear: Int
    $vehicleMake: String
    $vehicleModel: String
    $vehicleColor: String
    $servicesRequested: String
    $status: String
    $notes: String
    $intakeChannel: String
  ) {
    insertIntointake_leadsCollection(objects: [{
      org_id: $orgId
      first_name: $firstName
      last_name: $lastName
      phone: $phone
      email: $email
      vehicle_year: $vehicleYear
      vehicle_make: $vehicleMake
      vehicle_model: $vehicleModel
      vehicle_color: $vehicleColor
      services_requested: $servicesRequested
      status: $status
      notes: $notes
      intake_channel: $intakeChannel
    }]) {
      returning {
        ...IntakeLeadFields
      }
    }
  }
  ${INTAKE_LEAD_FIELDS}
`;

export function normalizeIntakeLead(row = {}) {
  if (!row || !row.id) return null;
  let photos = row.photos_json;
  try { photos = typeof row.photos_json === 'string' ? JSON.parse(row.photos_json) : row.photos_json ?? []; } catch {}
  return {
    id: row.id,
    orgId: row.org_id,
    firstName: row.first_name,
    lastName: row.last_name,
    phone: row.phone,
    email: row.email,
    vehicleYear: row.vehicle_year,
    vehicleMake: row.vehicle_make,
    vehicleModel: row.vehicle_model,
    vehicleColor: row.vehicle_color,
    servicesRequested: row.services_requested,
    photosJson: photos,
    status: row.status,
    notes: row.notes,
    assignedTo: row.assigned_to,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    callRecordingUrl: row.call_recording_url,
    callTranscription: row.call_transcription,
    intakeChannel: row.intake_channel,
  };
}

export function USE_INTAKE_LEADS({ orgId, first = 100, offset = 0 } = {}) {
  const { data, loading, error, refetch } = useQuery(LIST_INTAKE_LEADS, {
    variables: { orgId, first, offset },
    skip: !orgId,
  });
  const edges = data?.intake_leadsCollection?.edges ?? [];
  return {
    intakeLeads: edges.map(e => normalizeIntakeLead(e.node)),
    loading,
    error,
    refetch,
  };
}

export function USE_CREATE_INTAKE_LEAD() {
  return useMutation(CREATE_INTAKE_LEAD, {
    update(cache, { data: { insertIntointake_leadsCollection } }) {
      const returning = insertIntointake_leadsCollection?.returning ?? [];
      if (!returning[0]) return;
      const newLead = normalizeIntakeLead(returning[0]);
      cache.modify({
        fields: {
          // eslint-disable-next-line no-unused-vars
          intake_leadsCollection(existing = { edges: [] }, { readField }) {
            return {
              ...existing,
              edges: [
                { __typename: 'intake_leadsEdge', node: newLead },
                ...existing.edges,
              ],
            };
          },
        },
      });
    },
  });
}
