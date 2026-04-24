import { gql } from '@apollo/client';
import { useQuery, useMutation } from '@apollo/client/react';

// ════════════════════════════════════════════════════════════════════════════
// MARKETING CAMPAIGNS
// DB: campaigns  |  Collection: marketing_campaignsCollection
// ════════════════════════════════════════════════════════════════════════════

export const CAMPAIGN_FIELDS = gql`
  fragment CampaignFields on marketing_campaigns {
    id
    org_id
    location_id
    name
    channel
    status
    budget
    start_date
    end_date
    created_at
    updated_at
  }
`;

export const LIST_CAMPAIGNS = gql`
  query ListCampaigns($orgId: UUID!, $locationId: UUID!, $first: Int, $offset: Int) {
    marketing_campaignsCollection(
      filter: { org_id: { eq: $orgId }, location_id: { eq: $locationId } }
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
          channel
          status
          budget
          start_date
          end_date
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
  ${CAMPAIGN_FIELDS}
`;

export const CREATE_CAMPAIGN = gql`
  mutation CreateCampaign(
    $orgId: UUID!
    $locationId: UUID!
    $name: String!
    $channel: String!
    $status: String!
    $budget: Float
    $startDate: DateTime
    $endDate: DateTime
  ) {
    insertIntocampaignsCollection(objects: [{
      org_id: $orgId
      location_id: $locationId
      name: $name
      channel: $channel
      status: $status
      budget: $budget
      start_date: $startDate
      end_date: $endDate
    }]) {
      returning {
        ...CampaignFields
      }
    }
  }
  ${CAMPAIGN_FIELDS}
`;

export const UPDATE_CAMPAIGN = gql`
  mutation UpdateCampaign(
    $id: UUID!
    $name: String
    $channel: String
    $status: String
    $budget: Float
    $startDate: DateTime
    $endDate: DateTime
  ) {
    updatemarketing_campaignsCollection(
      filter: { id: { eq: $id } }
      set: {
        name: $name
        channel: $channel
        status: $status
        budget: $budget
        start_date: $startDate
        end_date: $endDate
      }
    ) {
      returning {
        ...CampaignFields
      }
    }
  }
  ${CAMPAIGN_FIELDS}
`;

export const DELETE_CAMPAIGN = gql`
  mutation DeleteCampaign($id: UUID!) {
    deleteFrommarketing_campaignsCollection(filter: { id: { eq: $id } }) {
      returning { id }
    }
  }
`;

// ════════════════════════════════════════════════════════════════════════════
// GALLERY IMAGES
// DB: gallery_images  |  Collection: gallery_imagesCollection
// ════════════════════════════════════════════════════════════════════════════

export const GALLERY_IMAGE_FIELDS = gql`
  fragment GalleryImageFields on gallery_images {
    id
    org_id
    location_id
    url
    caption
    featured
    tags
    created_at
  }
`;

export const LIST_GALLERY_IMAGES = gql`
  query ListGalleryImages($orgId: UUID!, $locationId: UUID!, $first: Int, $offset: Int) {
    gallery_imagesCollection(
      filter: { org_id: { eq: $orgId }, location_id: { eq: $locationId } }
      first: $first
      offset: $offset
      orderBy: [{ created_at: DESC }]
    ) {
      edges {
        node {
          id
          org_id
          location_id
          url
          caption
          featured
          tags
          created_at
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
  ${GALLERY_IMAGE_FIELDS}
`;

export const CREATE_GALLERY_IMAGE = gql`
  mutation CreateGalleryImage(
    $orgId: UUID!
    $locationId: UUID!
    $url: String!
    $caption: String
    $featured: Boolean
    $tags: String
  ) {
    insertIntogallery_imagesCollection(objects: [{
      org_id: $orgId
      location_id: $locationId
      url: $url
      caption: $caption
      featured: $featured
      tags: $tags
    }]) {
      returning {
        ...GalleryImageFields
      }
    }
  }
  ${GALLERY_IMAGE_FIELDS}
`;

export const DELETE_GALLERY_IMAGE = gql`
  mutation DeleteGalleryImage($id: UUID!) {
    deleteFromgallery_imagesCollection(filter: { id: { eq: $id } }) {
      returning { id }
    }
  }
`;

// ════════════════════════════════════════════════════════════════════════════
// REFERRALS
// DB: referrals  |  Collection: referralsCollection
// ════════════════════════════════════════════════════════════════════════════

export const REFERRAL_FIELDS = gql`
  fragment ReferralFields on referrals {
    id
    org_id
    location_id
    customer_id
    referred_name
    referred_phone
    referred_email
    status
    converted_to_customer_id
    created_at
  }
`;

export const LIST_REFERRALS = gql`
  query ListReferrals($orgId: UUID!, $locationId: UUID!, $first: Int, $offset: Int) {
    referralsCollection(
      filter: { org_id: { eq: $orgId }, location_id: { eq: $locationId } }
      first: $first
      offset: $offset
      orderBy: [{ created_at: DESC }]
    ) {
      edges {
        node {
          id
          org_id
          location_id
          customer_id
          referred_name
          referred_phone
          referred_email
          status
          converted_to_customer_id
          created_at
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
  ${REFERRAL_FIELDS}
`;

export const CREATE_REFERRAL = gql`
  mutation CreateReferral(
    $orgId: UUID!
    $locationId: UUID!
    $customerId: UUID!
    $referredName: String!
    $referredPhone: String
    $referredEmail: String
    $status: String
  ) {
    insertIntoreferralsCollection(objects: [{
      org_id: $orgId
      location_id: $locationId
      customer_id: $customerId
      referred_name: $referredName
      referred_phone: $referredPhone
      referred_email: $referredEmail
      status: $status
    }]) {
      returning {
        ...ReferralFields
      }
    }
  }
  ${REFERRAL_FIELDS}
`;

// ════════════════════════════════════════════════════════════════════════════
// NORMALIZE FUNCTIONS
// snake_case (DB) → camelCase (app)
// ════════════════════════════════════════════════════════════════════════════

export function normalizeCampaign(row = {}) {
  if (!row || !row.id) return null;
  return {
    id: row.id,
    orgId: row.org_id,
    locationId: row.location_id,
    name: row.name,
    channel: row.channel,
    status: row.status,
    budget: row.budget,
    startDate: row.start_date,
    endDate: row.end_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function normalizeGalleryImage(row = {}) {
  if (!row || !row.id) return null;
  return {
    id: row.id,
    orgId: row.org_id,
    locationId: row.location_id,
    url: row.url,
    caption: row.caption,
    featured: row.featured,
    tags: row.tags,
    createdAt: row.created_at,
  };
}

export function normalizeReferral(row = {}) {
  if (!row || !row.id) return null;
  return {
    id: row.id,
    orgId: row.org_id,
    locationId: row.location_id,
    customerId: row.customer_id,
    referredName: row.referred_name,
    referredPhone: row.referred_phone,
    referredEmail: row.referred_email,
    status: row.status,
    convertedToCustomerId: row.converted_to_customer_id,
    createdAt: row.created_at,
  };
}

// ════════════════════════════════════════════════════════════════════════════
// APOLLO REACT HOOKS
// ════════════════════════════════════════════════════════════════════════════

// ── Campaigns ────────────────────────────────────────────────────────────────

export function USE_CAMPAIGNS({ orgId, locationId, first = 100, offset = 0 } = {}) {
  const { data, loading, error, refetch } = useQuery(LIST_CAMPAIGNS, {
    variables: { orgId, locationId, first, offset },
    skip: !orgId || !locationId,
  });
  const edges = data?.marketing_campaignsCollection?.edges ?? [];
  return {
    campaigns: edges.map(e => normalizeCampaign(e.node)),
    loading,
    error,
    refetch,
  };
}

export function USE_CREATE_CAMPAIGN() {
  return useMutation(CREATE_CAMPAIGN, {
    update(cache, { data: { insertIntocampaignsCollection } }) {
      const returning = insertIntocampaignsCollection?.returning ?? [];
      if (!returning[0]) return;
      const newCamp = normalizeCampaign(returning[0]);
      cache.modify({
        fields: {
          // eslint-disable-next-line no-unused-vars
          marketing_campaignsCollection(existing = { edges: [] }, { readField }) {
            return {
              ...existing,
              edges: [
                { __typename: 'marketing_campaignsEdge', node: newCamp },
                ...existing.edges,
              ],
            };
          },
        },
      });
    },
  });
}

export function USE_UPDATE_CAMPAIGN() {
  return useMutation(UPDATE_CAMPAIGN, {
    update(cache, { data: { updatemarketing_campaignsCollection } }) {
      const returning = updatemarketing_campaignsCollection?.returning ?? [];
      if (!returning[0]) return;
      const updated = normalizeCampaign(returning[0]);
      cache.modify({
        fields: {
          // eslint-disable-next-line no-unused-vars
          marketing_campaignsCollection(existing = { edges: [] }, { readField }) {
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

export function USE_DELETE_CAMPAIGN() {
  return useMutation(DELETE_CAMPAIGN, {
    update(cache, { data: { deleteFrommarketing_campaignsCollection } }) {
      const returning = deleteFrommarketing_campaignsCollection?.returning ?? [];
      if (!returning[0]?.id) return;
      cache.modify({
        fields: {
          // eslint-disable-next-line no-unused-vars
          marketing_campaignsCollection(existing = { edges: [] }, { readField }) {
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

// ── Gallery ──────────────────────────────────────────────────────────────────

export function USE_GALLERY_IMAGES({ orgId, locationId, first = 100, offset = 0 } = {}) {
  const { data, loading, error, refetch } = useQuery(LIST_GALLERY_IMAGES, {
    variables: { orgId, locationId, first, offset },
    skip: !orgId || !locationId,
  });
  const edges = data?.gallery_imagesCollection?.edges ?? [];
  return {
    galleryImages: edges.map(e => normalizeGalleryImage(e.node)),
    loading,
    error,
    refetch,
  };
}

export function USE_CREATE_GALLERY_IMAGE() {
  return useMutation(CREATE_GALLERY_IMAGE, {
    update(cache, { data: { insertIntogallery_imagesCollection } }) {
      const returning = insertIntogallery_imagesCollection?.returning ?? [];
      if (!returning[0]) return;
      const newImg = normalizeGalleryImage(returning[0]);
      cache.modify({
        fields: {
          // eslint-disable-next-line no-unused-vars
          gallery_imagesCollection(existing = { edges: [] }, { readField }) {
            return {
              ...existing,
              edges: [
                { __typename: 'gallery_imagesEdge', node: newImg },
                ...existing.edges,
              ],
            };
          },
        },
      });
    },
  });
}

export function USE_DELETE_GALLERY_IMAGE() {
  return useMutation(DELETE_GALLERY_IMAGE, {
    update(cache, { data: { deleteFromgallery_imagesCollection } }) {
      const returning = deleteFromgallery_imagesCollection?.returning ?? [];
      if (!returning[0]?.id) return;
      cache.modify({
        fields: {
          // eslint-disable-next-line no-unused-vars
          gallery_imagesCollection(existing = { edges: [] }, { readField }) {
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

// ── Referrals ────────────────────────────────────────────────────────────────

export function USE_REFERRALS({ orgId, locationId, first = 100, offset = 0 } = {}) {
  const { data, loading, error, refetch } = useQuery(LIST_REFERRALS, {
    variables: { orgId, locationId, first, offset },
    skip: !orgId || !locationId,
  });
  const edges = data?.referralsCollection?.edges ?? [];
  return {
    referrals: edges.map(e => normalizeReferral(e.node)),
    loading,
    error,
    refetch,
  };
}

export function USE_CREATE_REFERRAL() {
  return useMutation(CREATE_REFERRAL, {
    update(cache, { data: { insertIntoreferralsCollection } }) {
      const returning = insertIntoreferralsCollection?.returning ?? [];
      if (!returning[0]) return;
      const newRef = normalizeReferral(returning[0]);
      cache.modify({
        fields: {
          // eslint-disable-next-line no-unused-vars
          referralsCollection(existing = { edges: [] }, { readField }) {
            return {
              ...existing,
              edges: [
                { __typename: 'referralsEdge', node: newRef },
                ...existing.edges,
              ],
            };
          },
        },
      });
    },
  });
}
