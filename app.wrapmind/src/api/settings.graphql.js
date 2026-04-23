import { gql } from '@apollo/client';
import { useQuery, useMutation } from '@apollo/client/react';

// ─── Fragments ────────────────────────────────────────────────────────────────

export const WRAP_PACKAGE_FIELDS = gql`
  fragment WrapPackageFields on WrapPackage {
    id
    locationId
    name
    description
    basePrice
    laborHours
    laborCost
    materialCost
    isActive
    createdAt
    updatedAt
  }
`;

export const MODIFIER_FIELDS = gql`
  fragment ModifierFields on Modifier {
    id
    locationId
    name
    description
    price
    unit
    isActive
    createdAt
    updatedAt
  }
`;

export const SERVICE_DURATION_FIELDS = gql`
  fragment ServiceDurationFields on ServiceDuration {
    id
    locationId
    serviceType
    durationMinutes
    createdAt
    updatedAt
  }
`;

export const PERMISSION_FIELDS = gql`
  fragment PermissionFields on Permission {
    id
    orgId
    role
    resource
    action
    createdAt
  }
`;

export const LOCATION_SETTINGS_FIELDS = gql`
  fragment LocationSettingsFields on LocationSetting {
    id
    locationId
    shopName
    shopHours
    defaultTaxRate
    platformSettings
    createdAt
    updatedAt
  }
`;

export const ORGANIZATION_SETTINGS_FIELDS = gql`
  fragment OrganizationSettingsFields on OrganizationSetting {
    id
    orgId
    defaultServiceDurations
    defaultPackages
    defaultModifiers
    config
    createdAt
    updatedAt
  }
`;

// ─── Queries ────────────────────────────────────────────────────────────────

/** List wrap packages for a location */
export const LIST_WRAP_PACKAGES = gql`
  query ListWrapPackages($locationId: UUID!, $first: Int, $offset: Int) {
    wrapPackagesCollection(
      filter: { locationId: { eq: $locationId } }
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
      filter: { locationId: { eq: $locationId } }
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
    serviceDurationsCollection(
      filter: { locationId: { eq: $locationId } }
      first: 100
      orderBy: [{ serviceType: ASC }]
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
      filter: { orgId: { eq: $orgId } }
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
    locationSetting(locationId: $locationId) {
      ...LocationSettingsFields
    }
  }
  ${LOCATION_SETTINGS_FIELDS}
`;

/** Get organization settings for an org */
export const GET_ORGANIZATION_SETTINGS = gql`
  query GetOrganizationSettings($orgId: UUID!) {
    organizationSetting(orgId: $orgId) {
      ...OrganizationSettingsFields
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
    locationSettingsUpsert(
      locationId: $locationId
      set: {
        shopName: $shopName
        shopHours: $shopHours
        defaultTaxRate: $defaultTaxRate
        platformSettings: $platformSettings
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
    organizationSettingsUpsert(
      orgId: $orgId
      set: {
        defaultServiceDurations: $defaultServiceDurations
        defaultPackages: $defaultPackages
        defaultModifiers: $defaultModifiers
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
    wrapPackageInsert(
      collection: "wrapPackages"
      records: [{
        locationId: $locationId
        name: $name
        description: $description
        basePrice: $basePrice
        laborHours: $laborHours
        laborCost: $laborCost
        materialCost: $materialCost
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
    wrapPackageUpdate(id: $id, set: {
      name: $name
      description: $description
      basePrice: $basePrice
      laborHours: $laborHours
      laborCost: $laborCost
      materialCost: $materialCost
      isActive: $isActive
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
        locationId: $locationId
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
      isActive: $isActive
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
    serviceDurationsUpsert(
      locationId: $locationId
      serviceType: $serviceType
      set: {
        durationMinutes: $durationMinutes
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
      orgId: $orgId
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
  const packages = data?.wrapPackagesCollection?.edges?.map(e => e.node) ?? [];
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
  const durations = data?.serviceDurationsCollection?.edges?.map(e => e.node) ?? [];
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
  return { settings: data?.locationSetting ?? null, loading, error };
}

export function USE_ORGANIZATION_SETTINGS(orgId) {
  const { data, loading, error } = useQuery(GET_ORGANIZATION_SETTINGS, {
    variables: { orgId },
    skip: !orgId,
  });
  return { settings: data?.organizationSetting ?? null, loading, error };
}

export function USE_UPSERT_LOCATION_SETTINGS() {
  return useMutation(UPSERT_LOCATION_SETTINGS);
}

export function USE_UPSERT_ORGANIZATION_SETTINGS() {
  return useMutation(UPSERT_ORGANIZATION_SETTINGS);
}

export function USE_CREATE_WRAP_PACKAGE() {
  return useMutation(CREATE_WRAP_PACKAGE, {
    update(cache, { data: { wrapPackageInsert } }) {
      if (!wrapPackageInsert?.edges?.[0]?.node) return;
      const newPkg = wrapPackageInsert.edges[0].node;
      cache.modify({
        fields: {
          // eslint-disable-next-line no-unused-vars
          wrapPackagesCollection(existing = { edges: [] }, { readField }) {
            return {
              ...existing,
              edges: [
                { __typename: 'WrapPackageEdge', node: newPkg },
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
      if (!modifierInsert?.edges?.[0]?.node) return;
      const newMod = modifierInsert.edges[0].node;
      cache.modify({
        fields: {
          // eslint-disable-next-line no-unused-vars
          modifiersCollection(existing = { edges: [] }, { readField }) {
            return {
              ...existing,
              edges: [
                { __typename: 'ModifierEdge', node: newMod },
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
                { __typename: 'PermissionEdge', node: permissionsUpsert },
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
