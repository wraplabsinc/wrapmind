import { gql } from '@apollo/client';
import { useQuery, useMutation } from '@apollo/client/react';

// ─── Fragments ────────────────────────────────────────────────────────────────

export const VEHICLE_FIELDS = gql`
  fragment VehicleFields on vehicles {
    id
    org_id
    customer_id
    year
    make
    model
    trim
    vin
    vehicle_type
    color
    length_mm
    width_mm
    height_mm
    wheelbase_mm
    curb_weight_kg
    wrap_status
    wrap_color
    tags
    notes
    last_service_at
    created_at
    updated_at
  }
`;

// ─── Queries ─────────────────────────────────────────────────────────────────

/**
 * List vehicles for an org (all vehicles, paginated).
 */
export const LIST_VEHICLES = gql`
  query ListVehicles($orgId: UUID!, $first: Int, $offset: Int) {
    vehiclesCollection(
      filter: { org_id: { eq: $orgId } }
      first: $first
      offset: $offset
      orderBy: [{ created_at: DESC }]
    ) {
      edges {
        node {
          id
          customer_id
          year
          make
          model
          trim
          vin
          vehicle_type
          color
          wrap_status
          wrap_color
          created_at
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
      filter: { customer_id: { eq: $customerId } }
      first: $first
      orderBy: [{ created_at: DESC }]
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
    vehiclesCollection(filter: { id: { eq: $id } }, first: 1) {
      edges {
        node {
          ...VehicleFields
        }
      }
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
  ) {
    insertIntovehiclesCollection(objects: [{
      org_id: $orgId
      customer_id: $customerId
      year: $year
      make: $make
      model: $model
      trim: $trim
      vin: $vin
      vehicle_type: $vehicleType
      color: $color
      length_mm: $lengthMm
      width_mm: $widthMm
      height_mm: $heightMm
      wheelbase_mm: $wheelbaseMm
      curb_weight_kg: $curbWeightKg
      wrap_status: $wrapStatus
      wrap_color: $wrapColor
      tags: $tags
      notes: $notes
    }]) {
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
  ) {
    updatevehiclesCollection(set: {
      year: $year
      make: $make
      model: $model
      trim: $trim
      vin: $vin
      vehicle_type: $vehicleType
      color: $color
      length_mm: $lengthMm
      width_mm: $widthMm
      height_mm: $heightMm
      wheelbase_mm: $wheelbaseMm
      curb_weight_kg: $curbWeightKg
      wrap_status: $wrapStatus
      wrap_color: $wrapColor
      tags: $tags
      notes: $notes
    }, filter: { id: { eq: $id } }) {
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
 * Delete a vehicle.
 */
export const DELETE_VEHICLE = gql`
  mutation DeleteVehicle($id: UUID!) {
    deleteFromvehiclesCollection(filter: { id: { eq: $id } }) {
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

  const vehicles = data?.vehiclesCollection?.edges ?? [];
  return { vehicle: vehicles[0]?.node ?? null, loading, error };
}

/**
 * Create a vehicle mutation hook.
 * Returns [createVehicle, { loading, error, data }]
 */
export function USE_CREATE_VEHICLE() {
  return useMutation(CREATE_VEHICLE, {
    update(cache, { data: { insertIntovehiclesCollection } }) {
      if (!insertIntovehiclesCollection?.edges?.[0]?.node) return;
      const newVehicle = insertIntovehiclesCollection.edges[0].node;
      cache.modify({
        fields: {
          // eslint-disable-next-line no-unused-vars
          vehiclesCollection(existing = { edges: [] }, { readField }) {
            return {
              ...existing,
              edges: [
                { __typename: 'vehiclesEdge', node: newVehicle },
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
    update(cache, { data: { deleteFromvehiclesCollection } }) {
      if (!deleteFromvehiclesCollection?.id) return;
      cache.modify({
        fields: {
          // eslint-disable-next-line no-unused-vars
          vehiclesCollection(existing = { edges: [] }, { readField }) {
            return {
              ...existing,
              edges: existing.edges.filter(
                e => e.node?.id !== deleteFromvehiclesCollection.id
              ),
            };
          },
        },
      });
    },
  });
}
