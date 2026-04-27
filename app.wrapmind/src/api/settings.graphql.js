import { gql } from '@apollo/client';
import { useQuery, useMutation } from '@apollo/client/react';

// ─── Fragments ────────────────────────────────────────────────────────────────

export const WRAP_PACKAGE_FIELDS = gql`
  fragment WrapPackageFields on wrap_packages {
    id
    location_id
    name
    description
    base_price
    labor_hours
    labor_cost
    material_cost
    is_active
    created_at
    updated_at
  }
`;

export const MODIFIER_FIELDS = gql`
  fragment ModifierFields on modifiers {
    id
    location_id
    name
    description
    price
    unit
    is_active
    created_at
    updated_at
  }
`;

export const SERVICE_DURATION_FIELDS = gql`
  fragment ServiceDurationFields on service_durations {
    id
    location_id
    service_type
    duration_minutes
    created_at
    updated_at
  }
`;

export const PERMISSION_FIELDS = gql`
  fragment PermissionFields on permissions {
    id
    org_id
    role
    resource
    action
    created_at
  }
`;

export const LOCATION_SETTINGS_FIELDS = gql`
  fragment LocationSettingsFields on location_settings {
    id
    location_id
    shop_name
    shop_hours
    default_tax_rate
    platform_settings
    created_at
    updated_at
  }
`;

export const ORGANIZATION_SETTINGS_FIELDS = gql`
  fragment OrganizationSettingsFields on organization_settings {
    id
    org_id
    default_service_durations
    default_packages
    default_modifiers
    config
    created_at
    updated_at
  }
`;

// ─── Queries ────────────────────────────────────────────────────────────────

/** List wrap packages for a location */
export const LIST_WRAP_PACKAGES = gql`
  query ListWrapPackages($locationId: UUID!, $first: Int, $offset: Int) {
    wrap_packagesCollection(
      filter: { location_id: { eq: $locationId } }
      first: $first
      offset: $offset
      orderBy: [{ name: ASC }]
    ) {
      edges {
        node {
          ...WrapPackageFields
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
  ${WRAP_PACKAGE_FIELDS}
`;

/** List modifiers for a location */
export const LIST_MODIFIERS = gql`
  query ListModifiers($locationId: UUID!, $first: Int, $offset: Int) {
    modifiersCollection(
      filter: { location_id: { eq: $locationId } }
      first: $first
      offset: $offset
      orderBy: [{ name: ASC }]
    ) {
      edges {
        node {
          ...ModifierFields
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
  ${MODIFIER_FIELDS}
`;

/** List service durations for a location */
export const LIST_SERVICE_DURATIONS = gql`
  query ListServiceDurations($locationId: UUID!) {
    service_durationsCollection(
      filter: { location_id: { eq: $locationId } }
      first: 100
      orderBy: [{ service_type: ASC }]
    ) {
      edges {
        node {
          ...ServiceDurationFields
        }
      }
    }
  }
  ${SERVICE_DURATION_FIELDS}
`;

/** List permissions for an org */
export const LIST_PERMISSIONS = gql`
  query ListPermissions($orgId: UUID!) {
    permissionsCollection(
      filter: { org_id: { eq: $orgId } }
      first: 200
    ) {
      edges {
        node {
          ...PermissionFields
        }
      }
    }
  }
  ${PERMISSION_FIELDS}
`;

/** Get location settings for a location */
export const GET_LOCATION_SETTINGS = gql`
  query GetLocationSettings($locationId: UUID!) {
    location_settingsCollection(filter: { location_id: { eq: $locationId } }, first: 1) {
      edges {
        node {
          ...LocationSettingsFields
        }
      }
    }
  }
  ${LOCATION_SETTINGS_FIELDS}
`;

/** Get organization settings for an org */
export const GET_ORGANIZATION_SETTINGS = gql`
  query GetOrganizationSettings($orgId: UUID!) {
    organization_settingsCollection(filter: { org_id: { eq: $orgId } }, first: 1) {
      edges {
        node {
          ...OrganizationSettingsFields
        }
      }
    }
  }
  ${ORGANIZATION_SETTINGS_FIELDS}
`;

// ─── Mutations ──────────────────────────────────────────────────────────────

export const UPSERT_LOCATION_SETTINGS = gql`
  mutation UpsertLocationSettings(
    $locationId: UUID!
    $shopName: String
    $shopHours: JSON
    $defaultTaxRate: numeric
    $platformSettings: JSON
  ) {
    location_settingsUpsert(
      location_id: $locationId
      set: {
        shop_name: $shopName
        shop_hours: $shopHours
        default_tax_rate: $defaultTaxRate
        platform_settings: $platformSettings
      }
    ) {
      ...LocationSettingsFields
    }
  }
  ${LOCATION_SETTINGS_FIELDS}
`;

export const UPSERT_ORGANIZATION_SETTINGS = gql`
  mutation UpsertOrganizationSettings(
    $orgId: UUID!
    $defaultServiceDurations: JSON
    $defaultPackages: JSON
    $defaultModifiers: JSON
    $config: JSON
  ) {
    organization_settingsUpsert(
      org_id: $orgId
      set: {
        default_service_durations: $defaultServiceDurations
        default_packages: $defaultPackages
        default_modifiers: $defaultModifiers
        config: $config
      }
    ) {
      ...OrganizationSettingsFields
    }
  }
  ${ORGANIZATION_SETTINGS_FIELDS}
`;

export const CREATE_WRAP_PACKAGE = gql`
  mutation CreateWrapPackage(
    $locationId: UUID!
    $name: String!
    $description: String
    $basePrice: numeric!
    $laborHours: numeric!
    $laborCost: numeric
    $materialCost: numeric
  ) {
    wrap_packageInsert(
      collection: "wrap_packages"
      records: [{
        location_id: $locationId
        name: $name
        description: $description
        base_price: $basePrice
        labor_hours: $laborHours
        labor_cost: $laborCost
        material_cost: $materialCost
      }]
    ) {
      edges {
        node {
          ...WrapPackageFields
        }
      }
    }
  }
  ${WRAP_PACKAGE_FIELDS}
`;

export const UPDATE_WRAP_PACKAGE = gql`
  mutation UpdateWrapPackage(
    $id: UUID!
    $name: String
    $description: String
    $basePrice: numeric
    $laborHours: numeric
    $laborCost: numeric
    $materialCost: numeric
    $isActive: Boolean
  ) {
    wrap_packageUpdate(id: $id, set: {
      name: $name
      description: $description
      base_price: $basePrice
      labor_hours: $laborHours
      labor_cost: $laborCost
      material_cost: $materialCost
      is_active: $isActive
    }) {
      ...WrapPackageFields
    }
  }
  ${WRAP_PACKAGE_FIELDS}
`;

export const CREATE_MODIFIER = gql`
  mutation CreateModifier(
    $locationId: UUID!
    $name: String!
    $description: String
    $price: numeric!
    $unit: String
  ) {
    modifierInsert(
      collection: "modifiers"
      records: [{
        location_id: $locationId
        name: $name
        description: $description
        price: $price
        unit: $unit
      }]
    ) {
      edges {
        node {
          ...ModifierFields
        }
      }
    }
  }
  ${MODIFIER_FIELDS}
`;

export const UPDATE_MODIFIER = gql`
  mutation UpdateModifier(
    $id: UUID!
    $name: String
    $description: String
    $price: numeric
    $unit: String
    $isActive: Boolean
  ) {
    modifierUpdate(id: $id, set: {
      name: $name
      description: $description
      price: $price
      unit: $unit
      is_active: $isActive
    }) {
      ...ModifierFields
    }
  }
  ${MODIFIER_FIELDS}
`;

export const UPSERT_SERVICE_DURATION = gql`
  mutation UpsertServiceDuration(
    $locationId: UUID!
    $serviceType: String!
    $durationMinutes: Int!
  ) {
    service_durationsUpsert(
      location_id: $locationId
      service_type: $serviceType
      set: {
        duration_minutes: $durationMinutes
      }
    ) {
      ...ServiceDurationFields
    }
  }
  ${SERVICE_DURATION_FIELDS}
`;

export const UPSERT_PERMISSION = gql`
  mutation UpsertPermission(
    $orgId: UUID!
    $role: String!
    $resource: String!
    $action: String!
  ) {
    permissionsUpsert(
      org_id: $orgId
      role: $role
      resource: $resource
      action: $action
      set: {}
    ) {
      ...PermissionFields
    }
  }
  ${PERMISSION_FIELDS}
`;

export const DELETE_PERMISSION = gql`
  mutation DeletePermission($id: UUID!) {
    permissionDelete(id: $id) {
      id
    }
  }
`;

// ─── Apollo React Hooks ─────────────────────────────────────────────────────

export function USE_WRAP_PACKAGES({ locationId, first = 100, offset = 0 } = {}) {
  const { data, loading, error, refetch } = useQuery(LIST_WRAP_PACKAGES, {
    variables: { locationId, first, offset },
    skip: !locationId,
  });
  const packages = data?.wrap_packagesCollection?.edges?.map(e => e.node) ?? [];
  return { packages, loading, error, refetch };
}

export function USE_MODIFIERS({ locationId, first = 100, offset = 0 } = {}) {
  const { data, loading, error, refetch } = useQuery(LIST_MODIFIERS, {
    variables: { locationId, first, offset },
    skip: !locationId,
  });
  const modifiers = data?.modifiersCollection?.edges?.map(e => e.node) ?? [];
  return { modifiers, loading, error, refetch };
}

export function USE_SERVICE_DURATIONS({ locationId } = {}) {
  const { data, loading, error, refetch } = useQuery(LIST_SERVICE_DURATIONS, {
    variables: { locationId },
    skip: !locationId,
  });
  const durations = data?.service_durationsCollection?.edges?.map(e => e.node) ?? [];
  return { durations, loading, error, refetch };
}

export function USE_PERMISSIONS({ orgId } = {}) {
  const { data, loading, error, refetch } = useQuery(LIST_PERMISSIONS, {
    variables: { orgId },
    skip: !orgId,
  });
  const permissions = data?.permissionsCollection?.edges?.map(e => e.node) ?? [];
  return { permissions, loading, error, refetch };
}

export function USE_LOCATION_SETTINGS(locationId) {
  const { data, loading, error } = useQuery(GET_LOCATION_SETTINGS, {
    variables: { locationId },
    skip: !locationId,
  });
  const edge = data?.location_settingsCollection?.edges?.[0];
  return { settings: edge?.node ?? null, loading, error };
}

export function USE_ORGANIZATION_SETTINGS(orgId) {
  const { data, loading, error, refetch } = useQuery(GET_ORGANIZATION_SETTINGS, {
    variables: { orgId },
    skip: !orgId,
  });
  const edge = data?.organization_settingsCollection?.edges?.[0];
  return { settings: edge?.node ?? null, loading, error, refetch };
}

export function USE_UPSERT_LOCATION_SETTINGS() {
  return useMutation(UPSERT_LOCATION_SETTINGS);
}

export function USE_UPSERT_ORGANIZATION_SETTINGS() {
  return useMutation(UPSERT_ORGANIZATION_SETTINGS);
}

export function USE_CREATE_WRAP_PACKAGE() {
  return useMutation(CREATE_WRAP_PACKAGE, {
    update(cache, { data: { wrap_packageInsert } }) {
      const edges = wrap_packageInsert?.edges ?? [];
      if (!edges[0]?.node) return;
      const newPkg = edges[0].node;
      cache.modify({
        fields: {
          // eslint-disable-next-line no-unused-vars
          wrap_packagesCollection(existing = { edges: [] }, { readField }) {
            return {
              ...existing,
              edges: [
                { __typename: 'wrap_packagesEdge', node: newPkg },
                ...existing.edges,
              ],
            };
          },
        },
      });
    },
  });
}

export function USE_UPDATE_WRAP_PACKAGE() {
  return useMutation(UPDATE_WRAP_PACKAGE);
}

export function USE_CREATE_MODIFIER() {
  return useMutation(CREATE_MODIFIER, {
    update(cache, { data: { modifierInsert } }) {
      const edges = modifierInsert?.edges ?? [];
      if (!edges[0]?.node) return;
      const newMod = edges[0].node;
      cache.modify({
        fields: {
          // eslint-disable-next-line no-unused-vars
          modifiersCollection(existing = { edges: [] }, { readField }) {
            return {
              ...existing,
              edges: [
                { __typename: 'modifiersEdge', node: newMod },
                ...existing.edges,
              ],
            };
          },
        },
      });
    },
  });
}

export function USE_UPDATE_MODIFIER() {
  return useMutation(UPDATE_MODIFIER);
}

export function USE_UPSERT_SERVICE_DURATION() {
  return useMutation(UPSERT_SERVICE_DURATION);
}

export function USE_UPSERT_PERMISSION() {
  return useMutation(UPSERT_PERMISSION, {
    update(cache, { data: { permissionsUpsert } }) {
      if (!permissionsUpsert) return;
      cache.modify({
        fields: {
          // eslint-disable-next-line no-unused-vars
          permissionsCollection(existing = { edges: [] }, { readField }) {
            return {
              ...existing,
              edges: [
                { __typename: 'permissionsEdge', node: permissionsUpsert },
                ...existing.edges,
              ],
            };
          },
        },
      });
    },
  });
}

export function USE_DELETE_PERMISSION() {
  return useMutation(DELETE_PERMISSION, {
    update(cache, { data: { permissionDelete } }) {
      if (!permissionDelete?.id) return;
      cache.modify({
        fields: {
          // eslint-disable-next-line no-unused-vars
          permissionsCollection(existing = { edges: [] }, { readField }) {
            return {
              ...existing,
              edges: existing.edges.filter(e => e.node?.id !== permissionDelete.id),
            };
          },
        },
      });
    },
  });
}
