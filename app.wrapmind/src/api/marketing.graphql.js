import { gql } from '@apollo/client';
import { useQuery, useMutation } from '@apollo/client';

// ════════════════════════════════════════════════════════════════════════════
// REVIEW REQUESTS
// DB: review_requests  |  Collection: review_requestsCollection
// ════════════════════════════════════════════════════════════════════════════

export const REVIEW_REQUEST_FIELDS = gql`
  fragment ReviewRequestFields on review_requests {
    id
    org_id
    location_id
    client_id
    estimate_id
    rating
    reviewed
    sent_at
    created_at
    clicked_at
    opened_at
  }
`;

export const LIST_REVIEW_REQUESTS = gql`
  query ListReviewRequests($orgId: UUID!, $first: Int, $offset: Int) {
    review_requestsCollection(
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
          client_id
          estimate_id
          rating
          reviewed
          sent_at
          created_at
          clicked_at
          opened_at
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
  ${REVIEW_REQUEST_FIELDS}
`;

export const CREATE_REVIEW_REQUEST = gql`
  mutation CreateReviewRequest(
    $orgId: UUID!
    $locationId: UUID!
    $clientId: UUID!
    $estimateId: UUID
  ) {
    insertIntoreview_requestsCollection(objects: [{
      org_id: $orgId
      location_id: $locationId
      client_id: $clientId
      estimate_id: $estimateId
    }]) {
      returning {
        ...ReviewRequestFields
      }
    }
  }
  ${REVIEW_REQUEST_FIELDS}
`;

export const MARK_REVIEW_CLICKED = gql`
  mutation MarkReviewClicked($id: UUID!) {
    updatereview_requestsCollection(
      filter: { id: { eq: $id } }
      set: { clicked_at: "now()" }
    ) {
      returning {
        ...ReviewRequestFields
      }
    }
  }
  ${REVIEW_REQUEST_FIELDS}
`;

// ════════════════════════════════════════════════════════════════════════════
// MARKETING CAMPAIGNS
// DB: marketing_campaigns  |  Collection: marketing_campaignsCollection
// ════════════════════════════════════════════════════════════════════════════

export const CAMPAIGN_FIELDS = gql`
  fragment CampaignFields on marketing_campaigns {
    id
    shop_id
    name
    type
    status
    subject
    body
    stats
    sent_at
    created_at
    created_by
  }
`;

export const LIST_CAMPAIGNS = gql`
  query ListCampaigns($shopId: UUID!, $first: Int, $offset: Int) {
    marketing_campaignsCollection(
      filter: { shop_id: { eq: $shopId } }
      first: $first
      offset: $offset
      orderBy: [{ created_at: DESC }]
    ) {
      edges {
        node {
          id
          shop_id
          name
          type
          status
          subject
          body
          stats
          sent_at
          created_at
          created_by
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
    $shopId: UUID!
    $name: String!
    $type: String!
    $status: String!
    $subject: String
    $body: String
    $createdBy: UUID
  ) {
    insertIntomarketing_campaignsCollection(objects: [{
      shop_id: $shopId
      name: $name
      type: $type
      status: $status
      subject: $subject
      body: $body
      created_by: $createdBy
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
    $type: String
    $status: String
    $subject: String
    $body: String
    $stats: String
  ) {
    updatemarketing_campaignsCollection(
      filter: { id: { eq: $id } }
      set: {
        name: $name
        type: $type
        status: $status
        subject: $subject
        body: $body
        stats: $stats
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
    shop_id
    url
    caption
    tags
    created_at
    created_by
  }
`;

export const LIST_GALLERY_IMAGES = gql`
  query ListGalleryImages($shopId: UUID!, $first: Int, $offset: Int) {
    gallery_imagesCollection(
      filter: { shop_id: { eq: $shopId } }
      first: $first
      offset: $offset
      orderBy: [{ created_at: DESC }]
    ) {
      edges {
        node {
          id
          shop_id
          url
          caption
          tags
          created_at
          created_by
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
    $shopId: UUID!
    $url: String!
    $caption: String
    $tags: String
    $createdBy: UUID
  ) {
    insertIntogallery_imagesCollection(objects: [{
      shop_id: $shopId
      url: $url
      caption: $caption
      tags: $tags
      created_by: $createdBy
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
    referrer_org_id
    referred_org_id
    referral_code
    credit_applied
    activated_at
  }
`;

export const LIST_REFERRALS = gql`
  query ListReferrals($referrerOrgId: UUID!, $first: Int, $offset: Int) {
    referralsCollection(
      filter: { referrer_org_id: { eq: $referrerOrgId } }
      first: $first
      offset: $offset
      orderBy: [{ activated_at: DESC }]
    ) {
      edges {
        node {
          id
          referrer_org_id
          referred_org_id
          referral_code
          credit_applied
          activated_at
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
    $referrerOrgId: UUID!
    $referredOrgId: UUID!
    $referralCode: String!
  ) {
    insertIntoreferralsCollection(objects: [{
      referrer_org_id: $referrerOrgId
      referred_org_id: $referredOrgId
      referral_code: $referralCode
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

export function normalizeReviewRequest(row = {}) {
  if (!row || !row.id) return null;
  return {
    id: row.id,
    orgId: row.org_id,
    locationId: row.location_id,
    clientId: row.client_id,
    estimateId: row.estimate_id,
    rating: row.rating,
    reviewed: row.reviewed,
    sentAt: row.sent_at,
    createdAt: row.created_at,
    clickedAt: row.clicked_at,
    openedAt: row.opened_at,
  };
}

export function normalizeCampaign(row = {}) {
  if (!row || !row.id) return null;
  let stats = row.stats;
  try { stats = typeof row.stats === 'string' ? JSON.parse(row.stats) : row.stats ?? {}; } catch {}
  return {
    id: row.id,
    shopId: row.shop_id,
    name: row.name,
    type: row.type,
    status: row.status,
    subject: row.subject,
    body: row.body,
    stats,
    sentAt: row.sent_at,
    createdAt: row.created_at,
    createdBy: row.created_by,
  };
}

export function normalizeGalleryImage(row = {}) {
  if (!row || !row.id) return null;
  return {
    id: row.id,
    shopId: row.shop_id,
    url: row.url,
    caption: row.caption,
    tags: row.tags,
    createdAt: row.created_at,
    createdBy: row.created_by,
  };
}

export function normalizeReferral(row = {}) {
  if (!row || !row.id) return null;
  return {
    id: row.id,
    referrerOrgId: row.referrer_org_id,
    referredOrgId: row.referred_org_id,
    referralCode: row.referral_code,
    creditApplied: row.credit_applied,
    activatedAt: row.activated_at,
  };
}

// ════════════════════════════════════════════════════════════════════════════
// APOLLO REACT HOOKS
// ════════════════════════════════════════════════════════════════════════════

// ── Review Requests ──────────────────────────────────────────────────────────

export function USE_REVIEW_REQUESTS({ orgId, first = 100, offset = 0 } = {}) {
  const { data, loading, error, refetch } = useQuery(LIST_REVIEW_REQUESTS, {
    variables: { orgId, first, offset },
    skip: !orgId,
  });
  const edges = data?.review_requestsCollection?.edges ?? [];
  return {
    reviewRequests: edges.map(e => normalizeReviewRequest(e.node)),
    loading,
    error,
    refetch,
  };
}

export function USE_CREATE_REVIEW_REQUEST() {
  return useMutation(CREATE_REVIEW_REQUEST, {
    update(cache, { data: { insertIntoreview_requestsCollection } }) {
      const returning = insertIntoreview_requestsCollection?.returning ?? [];
      if (!returning[0]) return;
      const newReq = normalizeReviewRequest(returning[0]);
      cache.modify({
        fields: {
          // eslint-disable-next-line no-unused-vars
          review_requestsCollection(existing = { edges: [] }, { readField }) {
            return {
              ...existing,
              edges: [
                { __typename: 'review_requestsEdge', node: newReq },
                ...existing.edges,
              ],
            };
          },
        },
      });
    },
  });
}

export function USE_MARK_REVIEW_CLICKED() {
  return useMutation(MARK_REVIEW_CLICKED, {
    update(cache, { data: { updatereview_requestsCollection } }) {
      const returning = updatereview_requestsCollection?.returning ?? [];
      if (!returning[0]) return;
      const updated = normalizeReviewRequest(returning[0]);
      cache.modify({
        fields: {
          // eslint-disable-next-line no-unused-vars
          review_requestsCollection(existing = { edges: [] }, { readField }) {
            return {
              ...existing,
              edges: existing.edges.map(e =>
                e.node?.id === updated.id
                  ? { ...e, node: { ...e.node, clicked_at: updated.clickedAt } }
                  : e
              ),
            };
          },
        },
      });
    },
  });
}

// ── Campaigns ────────────────────────────────────────────────────────────────

export function USE_CAMPAIGNS({ shopId, first = 100, offset = 0 } = {}) {
  const { data, loading, error, refetch } = useQuery(LIST_CAMPAIGNS, {
    variables: { shopId, first, offset },
    skip: !shopId,
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
    update(cache, { data: { insertIntomarketing_campaignsCollection } }) {
      const returning = insertIntomarketing_campaignsCollection?.returning ?? [];
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

export function USE_GALLERY_IMAGES({ shopId, first = 100, offset = 0 } = {}) {
  const { data, loading, error, refetch } = useQuery(LIST_GALLERY_IMAGES, {
    variables: { shopId, first, offset },
    skip: !shopId,
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

export function USE_REFERRALS({ referrerOrgId, first = 100, offset = 0 } = {}) {
  const { data, loading, error, refetch } = useQuery(LIST_REFERRALS, {
    variables: { referrerOrgId, first, offset },
    skip: !referrerOrgId,
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
