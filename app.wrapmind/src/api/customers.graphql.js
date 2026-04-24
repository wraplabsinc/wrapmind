import { gql } from '@apollo/client';
import { useQuery, useMutation } from '@apollo/client/react';

// ════════════════════════════════════════════════════════════════════════════
// FRAGMENT
// pg_graphql uses snake_case DB column names, not camelCase app field names.
// The normalizeCustomer function maps snake_case → camelCase.
// ════════════════════════════════════════════════════════════════════════════

export const CUSTOMER_FIELDS = gql`
  fragment CustomerFields on customers {
    id
    org_id
    first_name
    last_name
    email
    phone
    preferred_contact
    referral_source
    referred_by
    is_vip
    internal_notes
    shopmonkey_customer_id
    total_jobs
    lifetime_value
    created_at
    updated_at
    fleet_account_id
    disc_type
    disc_scores
    disc_signals
    communication_style
    closing_tips
    personality_confidence
  }
`;

// ════════════════════════════════════════════════════════════════════════════
// QUERIES
// ════════════════════════════════════════════════════════════════════════════

export const LIST_CUSTOMERS = gql`
  query ListCustomers($orgId: UUID!, $first: Int, $offset: Int) {
    customersCollection(
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
          email
          phone
          preferred_contact
          referral_source
          referred_by
          is_vip
          internal_notes
          shopmonkey_customer_id
          total_jobs
          lifetime_value
          created_at
          updated_at
          fleet_account_id
          disc_type
          disc_scores
          disc_signals
          communication_style
          closing_tips
          personality_confidence
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

export const GET_CUSTOMER = gql`
  query GetCustomer($id: UUID!) {
    customersCollection(filter: { id: { eq: $id } }, first: 1) {
      edges {
        node {
          ...CustomerFields
        }
      }
    }
  }
  ${CUSTOMER_FIELDS}
`;

export const GET_CUSTOMER_WITH_VEHICLES = gql`
  query GetCustomerWithVehicles($id: UUID!) {
    customersCollection(filter: { id: { eq: $id } }, first: 1) {
      edges {
        node {
          ...CustomerFields
          vehiclesCollection(first: 50) {
            edges {
              node {
                id
                org_id
                customer_id
                car_id
                sm_vehicle_id
                year
                make
                model
                trim
                vin
                color
                license_plate
                vehicle_type
                wrap_status
                wrap_color
                notes
                last_service_at
                created_at
                updated_at
                location_id
                lead_id
              }
            }
          }
        }
      }
    }
  }
  ${CUSTOMER_FIELDS}
`;

// ════════════════════════════════════════════════════════════════════════════
// MUTATIONS
// ════════════════════════════════════════════════════════════════════════════

export const CREATE_CUSTOMER = gql`
  mutation CreateCustomer(
    $orgId: UUID!
    $firstName: String!
    $lastName: String!
    $email: String
    $phone: String
    $preferredContact: String
    $referralSource: String
    $referredBy: String
    $isVip: Boolean
    $internalNotes: String
  ) {
    insertIntocustomersCollection(objects: [{
      org_id: $orgId
      first_name: $firstName
      last_name: $lastName
      email: $email
      phone: $phone
      preferred_contact: $preferredContact
      referral_source: $referralSource
      referred_by: $referredBy
      is_vip: $isVip
      internal_notes: $internalNotes
    }]) {
      returning {
        ...CustomerFields
      }
    }
  }
  ${CUSTOMER_FIELDS}
`;

export const UPDATE_CUSTOMER = gql`
  mutation UpdateCustomer(
    $id: UUID!
    $firstName: String
    $lastName: String
    $email: String
    $phone: String
    $preferredContact: String
    $referralSource: String
    $referredBy: String
    $isVip: Boolean
    $internalNotes: String
  ) {
    updatecustomersCollection(
      filter: { id: { eq: $id } }
      set: {
        first_name: $firstName
        last_name: $lastName
        email: $email
        phone: $phone
        preferred_contact: $preferredContact
        referral_source: $referralSource
        referred_by: $referredBy
        is_vip: $isVip
        internal_notes: $internalNotes
      }
    ) {
      returning {
        ...CustomerFields
      }
    }
  }
  ${CUSTOMER_FIELDS}
`;

export const DELETE_CUSTOMER = gql`
  mutation DeleteCustomer($id: UUID!) {
    deleteFromcustomersCollection(filter: { id: { eq: $id } }) {
      returning { id }
    }
  }
`;

// ════════════════════════════════════════════════════════════════════════════
// NORMALIZE — snake_case (DB/pg_graphql) → camelCase (app)
// ════════════════════════════════════════════════════════════════════════════

export function normalizeCustomer(row = {}) {
  if (!row || !row.id) return null;
  return {
    id: row.id,
    orgId: row.org_id,
    firstName: row.first_name,
    lastName: row.last_name,
    name: [row.first_name, row.last_name].filter(Boolean).join(' ') || null,
    email: row.email,
    phone: row.phone,
    preferredContact: row.preferred_contact,
    referralSource: row.referral_source,
    referredBy: row.referred_by,
    isVip: row.is_vip,
    internalNotes: row.internal_notes,
    shopmonkeyCustomerId: row.shopmonkey_customer_id,
    totalJobs: row.total_jobs,
    lifetimeValue: row.lifetime_value ? String(row.lifetime_value) : null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    fleetAccountId: row.fleet_account_id,
    discType: row.disc_type,
    discScores: row.disc_scores,
    discSignals: row.disc_signals,
    communicationStyle: row.communication_style,
    closingTips: row.closing_tips,
    personalityConfidence: row.personality_confidence
      ? String(row.personality_confidence)
      : null,
  };
}

export function normalizeVehicle(row = {}) {
  if (!row || !row.id) return null;
  return {
    id: row.id,
    orgId: row.org_id,
    customerId: row.customer_id,
    carId: row.car_id,
    smVehicleId: row.sm_vehicle_id,
    year: row.year,
    make: row.make,
    model: row.model,
    trim: row.trim,
    vin: row.vin,
    color: row.color,
    licensePlate: row.license_plate,
    vehicleType: row.vehicle_type,
    wrapStatus: row.wrap_status,
    wrapColor: row.wrap_color,
    notes: row.notes,
    lastServiceAt: row.last_service_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    locationId: row.location_id,
    leadId: row.lead_id,
  };
}

// ════════════════════════════════════════════════════════════════════════════
// APOLLO REACT HOOKS
// ════════════════════════════════════════════════════════════════════════════

export function USE_CUSTOMERS({ orgId, first = 50, offset = 0 } = {}) {
  const { data, loading, error, refetch } = useQuery(LIST_CUSTOMERS, {
    variables: { orgId, first, offset },
    skip: !orgId,
  });
  const edges = data?.customersCollection?.edges ?? [];
  const pageInfo = data?.customersCollection?.pageInfo ?? {};
  return {
    customers: edges.map(e => normalizeCustomer(e.node)),
    loading,
    error,
    refetch,
    ...pageInfo,
  };
}

export function USE_CUSTOMER(id) {
  const { data, loading, error } = useQuery(GET_CUSTOMER, {
    variables: { id },
    skip: !id,
  });
  return {
    customer: data?.customersCollection?.edges?.[0]
      ? normalizeCustomer(data.customersCollection.edges[0].node)
      : null,
    loading,
    error,
  };
}

export function USE_CUSTOMER_WITH_VEHICLES(id) {
  const { data, loading, error } = useQuery(GET_CUSTOMER_WITH_VEHICLES, {
    variables: { id },
    skip: !id,
  });
  const node = data?.customersCollection?.edges?.[0]?.node ?? null;
  if (!node) return { customer: null, loading, error };
  return {
    customer: {
      ...normalizeCustomer(node),
      vehicles: node.vehiclesCollection?.edges?.map(e =>
        normalizeVehicle(e.node)
      ) ?? [],
    },
    loading,
    error,
  };
}

export function USE_CREATE_CUSTOMER() {
  return useMutation(CREATE_CUSTOMER, {
    update(cache, { data: { insertIntocustomersCollection } }) {
      const returning = insertIntocustomersCollection?.returning ?? [];
      if (!returning[0]) return;
      const newCustomer = normalizeCustomer(returning[0]);
      cache.modify({
        fields: {
          // eslint-disable-next-line no-unused-vars
          customersCollection(existing = { edges: [] }, { readField }) {
            return {
              ...existing,
              edges: [
                { __typename: 'customersEdge', node: newCustomer },
                ...existing.edges,
              ],
            };
          },
        },
      });
    },
  });
}

export function USE_UPDATE_CUSTOMER() {
  return useMutation(UPDATE_CUSTOMER, {
    update(cache, { data: { updatecustomersCollection } }) {
      const returning = updatecustomersCollection?.returning ?? [];
      if (!returning[0]) return;
      const updated = normalizeCustomer(returning[0]);
      cache.modify({
        fields: {
          // eslint-disable-next-line no-unused-vars
          customersCollection(existing = { edges: [] }, { readField }) {
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

export function USE_DELETE_CUSTOMER() {
  return useMutation(DELETE_CUSTOMER, {
    update(cache, { data: { deleteFromcustomersCollection } }) {
      const returning = deleteFromcustomersCollection?.returning ?? [];
      if (!returning[0]?.id) return;
      cache.modify({
        fields: {
          // eslint-disable-next-line no-unused-vars
          customersCollection(existing = { edges: [] }, { readField }) {
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
