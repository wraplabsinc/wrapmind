import { gql } from '@apollo/client';
import { useQuery, useMutation } from '@apollo/client/react';

// ─── Fragments ────────────────────────────────────────────────────────────────

export const VEHICLE_FIELDS = gql`
  fragment VehicleFields on Vehicle {
    id
    orgId
    customerId
    year
    make
    model
    trim
    vin
    vehicleType
    color
    lengthMm
    widthMm
    heightMm
    wheelbaseMm
    curbWeightKg
    wrapStatus
    wrapColor
    tags
    notes
    lastServiceAt
    createdAt
    updatedAt
    locationId
    leadId
  }
`;

// ─── Queries ─────────────────────────────────────────────────────────────────

/**
 * List vehicles for an org (all vehicles, paginated).
 */
export const LIST_VEHICLES = gql`
  query ListVehicles($orgId: UUID!, $first: Int, $offset: Int) {
    vehiclesCollection(
      filter: { orgId: { eq: $orgId } }
      first: $first
      offset: $offset
      orderBy: [{ createdAt: DESC }]
    ) {
      edges {
        node {
          id
          customerId
          year
          make
          model
          trim
          vin
          vehicleType
          color
          wrapStatus
          wrapColor
          createdAt
          locationId
          leadId
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
  ${VEHICLE_FIELDS}
`;

/**
 * List vehicles for a specific customer.
 */
export const LIST_VEHICLES_BY_CUSTOMER = gql`
  query ListVehiclesByCustomer($customerId: UUID!, $first: Int) {
    vehiclesCollection(
      filter: { customerId: { eq: $customerId } }
      first: $first
      orderBy: [{ createdAt: DESC }]
    ) {
      edges {
        node {
          ...VehicleFields
        }
      }
    }
  }
  ${VEHICLE_FIELDS}
`;

/**
 * Get a single vehicle by ID.
 */
export const GET_VEHICLE = gql`
  query GetVehicle($id: UUID!) {
    vehicle(id: $id) {
      ...VehicleFields
    }
  }
  ${VEHICLE_FIELDS}
`;

// ─── Mutations ───────────────────────────────────────────────────────────────

/**
 * Create a new vehicle.
 */
export const CREATE_VEHICLE = gql`
  mutation CreateVehicle(
    $orgId: UUID!
    $customerId: UUID!
    $year: Int
    $make: String
    $model: String
    $trim: String
    $vin: String
    $vehicleType: String
    $color: String
    $lengthMm: Int
    $widthMm: Int
    $heightMm: Int
    $wheelbaseMm: Int
    $curbWeightKg: Float
    $wrapStatus: String
    $wrapColor: String
    $tags: [String!]
    $notes: String
    $locationId: UUID
  ) {
    vehicleInsert(
      collection: "vehicles"
      records: [{
        orgId: $orgId
        customerId: $customerId
        year: $year
        make: $make
        model: $model
        trim: $trim
        vin: $vin
        vehicleType: $vehicleType
        color: $color
        lengthMm: $lengthMm
        widthMm: $widthMm
        heightMm: $heightMm
        wheelbaseMm: $wheelbaseMm
        curbWeightKg: $curbWeightKg
        wrapStatus: $wrapStatus
        wrapColor: $wrapColor
        tags: $tags
        notes: $notes
        locationId: $locationId
      }]
    ) {
      edges {
        node {
          ...VehicleFields
        }
      }
    }
  }
  ${VEHICLE_FIELDS}
`;

/**
 * Update an existing vehicle.
 */
export const UPDATE_VEHICLE = gql`
  mutation UpdateVehicle(
    $id: UUID!
    $year: Int
    $make: String
    $model: String
    $trim: String
    $vin: String
    $vehicleType: String
    $color: String
    $lengthMm: Int
    $widthMm: Int
    $heightMm: Int
    $wheelbaseMm: Int
    $curbWeightKg: Float
    $wrapStatus: String
    $wrapColor: String
    $tags: [String!]
    $notes: String
    $locationId: UUID
    $leadId: UUID
  ) {
    vehicleUpdate(id: $id, set: {
      year: $year
      make: $make
      model: $model
      trim: $trim
      vin: $vin
      vehicleType: $vehicleType
      color: $color
      lengthMm: $lengthMm
      widthMm: $widthMm
      heightMm: $heightMm
      wheelbaseMm: $wheelbaseMm
      curbWeightKg: $curbWeightKg
      wrapStatus: $wrapStatus
      wrapColor: $wrapColor
      tags: $tags
      notes: $notes
      locationId: $locationId
      leadId: $leadId
    }) {
      ...VehicleFields
    }
  }
  ${VEHICLE_FIELDS}
`;

/**
 * Delete a vehicle.
 */
export const DELETE_VEHICLE = gql`
  mutation DeleteVehicle($id: UUID!) {
    vehicleDelete(id: $id) {
      id
    }
  }
`;

// ─── Apollo React Hooks ───────────────────────────────────────────────────────

/**
 * List all vehicles for an org.
 * Returns { vehicles, loading, error, refetch }
 */
export function USE_VEHICLES({ orgId, first = 100, offset = 0 } = {}) {
  const { data, loading, error, refetch } = useQuery(LIST_VEHICLES, {
    variables: { orgId, first, offset },
    skip: !orgId,
  });

  const vehicles = data?.vehiclesCollection?.edges?.map(e => e.node) ?? [];
  const pageInfo = data?.vehiclesCollection?.pageInfo ?? {};

  return { vehicles, loading, error, refetch, ...pageInfo };
}

/**
 * List vehicles for a specific customer.
 * Returns { vehicles, loading, error }
 */
export function USE_VEHICLES_BY_CUSTOMER(customerId, first = 50) {
  const { data, loading, error } = useQuery(LIST_VEHICLES_BY_CUSTOMER, {
    variables: { customerId, first },
    skip: !customerId,
  });

  const vehicles = data?.vehiclesCollection?.edges?.map(e => e.node) ?? [];

  return { vehicles, loading, error };
}

/**
 * Get a single vehicle by ID.
 * Returns { vehicle, loading, error }
 */
export function USE_VEHICLE(id) {
  const { data, loading, error } = useQuery(GET_VEHICLE, {
    variables: { id },
    skip: !id,
  });

  return { vehicle: data?.vehicle ?? null, loading, error };
}

/**
 * Create a vehicle mutation hook.
 * Returns [createVehicle, { loading, error, data }]
 */
export function USE_CREATE_VEHICLE() {
  return useMutation(CREATE_VEHICLE, {
    update(cache, { data: { vehicleInsert } }) {
      if (!vehicleInsert?.edges?.[0]?.node) return;
      const newVehicle = vehicleInsert.edges[0].node;
      cache.modify({
        fields: {
          // eslint-disable-next-line no-unused-vars
          vehiclesCollection(existing = { edges: [] }, { TO_MUCH }) {
            return {
              ...existing,
              edges: [
                { __typename: 'VehicleEdge', node: newVehicle },
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
 * Update a vehicle mutation hook.
 * Returns [updateVehicle, { loading, error, data }]
 */
export function USE_UPDATE_VEHICLE() {
  return useMutation(UPDATE_VEHICLE);
}

/**
 * Delete a vehicle mutation hook.
 * Returns [deleteVehicle, { loading, error, data }]
 */
export function USE_DELETE_VEHICLE() {
  return useMutation(DELETE_VEHICLE, {
    update(cache, { data: { vehicleDelete } }) {
      if (!vehicleDelete?.id) return;
      cache.modify({
        fields: {
          // eslint-disable-next-line no-unused-vars
          vehiclesCollection(existing = { edges: [] }, { TO_MUCH }) {
            return {
              ...existing,
              edges: existing.edges.filter(
                e => e.node?.id !== vehicleDelete.id
              ),
            };
          },
        },
      });
    },
  });
}
