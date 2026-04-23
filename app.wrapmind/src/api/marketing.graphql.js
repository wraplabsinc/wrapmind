import { gql } from '@apollo/client';
import { useQuery, useMutation } from '@apollo/client/react';

// ─── Fragments ────────────────────────────────────────────────────────────────

export const REVIEW_FIELDS = gql`
  fragment ReviewFields on Review {
    id
    orgId
    locationId
    source
    rating
    body
    customerName
    responded
    createdAt
  }
`;

export const CAMPAIGN_FIELDS = gql`
  fragment CampaignFields on Campaign {
    id
    orgId
    locationId
    name
    channel
    status
    budget
    startDate
    endDate
    createdAt
    updatedAt
  }
`;

export const FOLLOW_UP_FIELDS = gql`
  fragment FollowUpFields on FollowUp {
    id
    orgId
    locationId
    name
    type
    template
    delayDays
    createdAt
  }
`;

export const REFERRAL_FIELDS = gql`
  fragment ReferralFields on Referral {
    id
    orgId
    locationId
    customerId
    referredName
    referredPhone
    referredEmail
    status
    convertedToCustomerId
    createdAt
  }
`;

export const GALLERY_IMAGE_FIELDS = gql`
  fragment GalleryImageFields on GalleryImage {
    id
    orgId
    locationId
    url
    caption
    featured
    tags
    createdAt
  }
`;

// ─── Queries ────────────────────────────────────────────────────────────────

/** List reviews for an org */
export const LIST_REVIEWS = gql`
  query ListReviews($orgId: UUID!, $first: Int, $offset: Int) {
    reviewsCollection(
      filter: { orgId: { eq: $orgId } }
      first: $first
      offset: $offset
      orderBy: [{ createdAt: DESC }]
    ) {
      edges {
        node {
          ...ReviewFields
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
  ${REVIEW_FIELDS}
`;

/** List campaigns for an org */
export const LIST_CAMPAIGNS = gql`
  query ListCampaigns($orgId: UUID!, $first: Int, $offset: Int) {
    campaignsCollection(
      filter: { orgId: { eq: $orgId } }
      first: $first
      offset: $offset
      orderBy: [{ createdAt: DESC }]
    ) {
      edges {
        node {
          ...CampaignFields
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

/** List follow-ups for an org */
export const LIST_FOLLOW_UPS = gql`
  query ListFollowUps($orgId: UUID!, $first: Int, $offset: Int) {
    followUpsCollection(
      filter: { orgId: { eq: $orgId } }
      first: $first
      offset: $offset
      orderBy: [{ createdAt: DESC }]
    ) {
      edges {
        node {
          ...FollowUpFields
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
  ${FOLLOW_UP_FIELDS}
`;

/** List referrals for an org */
export const LIST_REFERRALS = gql`
  query ListReferrals($orgId: UUID!, $first: Int, $offset: Int) {
    referralsCollection(
      filter: { orgId: { eq: $orgId } }
      first: $first
      offset: $offset
      orderBy: [{ createdAt: DESC }]
    ) {
      edges {
        node {
          ...ReferralFields
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

/** List gallery images for a location */
export const LIST_GALLERY_IMAGES = gql`
  query ListGalleryImages($locationId: UUID!, $featured: Boolean, $first: Int, $offset: Int) {
    galleryImagesCollection(
      filter: { locationId: { eq: $locationId } }
      first: $first
      offset: $offset
      orderBy: [{ createdAt: DESC }]
    ) {
      edges {
        node {
          ...GalleryImageFields
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

// ─── Mutations ──────────────────────────────────────────────────────────────

export const CREATE_REVIEW = gql`
  mutation CreateReview(
    $orgId: UUID!
    $locationId: UUID!
    $source: String
    $rating: Int
    $body: String
    $customerName: String
  ) {
    reviewInsert(
      collection: "reviews"
      records: [{
        orgId: $orgId
        locationId: $locationId
        source: $source
        rating: $rating
        body: $body
        customerName: $customerName
      }]
    ) {
      edges {
        node {
          ...ReviewFields
        }
      }
    }
  }
  ${REVIEW_FIELDS}
`;

export const UPDATE_REVIEW = gql`
  mutation UpdateReview(
    $id: UUID!
    $rating: Int
    $body: String
    $responded: Boolean
  ) {
    reviewUpdate(id: $id, set: {
      rating: $rating
      body: $body
      responded: $responded
    }) {
      ...ReviewFields
    }
  }
  ${REVIEW_FIELDS}
`;

export const CREATE_CAMPAIGN = gql`
  mutation CreateCampaign(
    $orgId: UUID!
    $locationId: UUID!
    $name: String!
    $channel: String
    $status: String
    $budget: numeric
    $startDate: Date
    $endDate: Date
  ) {
    campaignInsert(
      collection: "campaigns"
      records: [{
        orgId: $orgId
        locationId: $locationId
        name: $name
        channel: $channel
        status: $status
        budget: $budget
        startDate: $startDate
        endDate: $endDate
      }]
    ) {
      edges {
        node {
          ...CampaignFields
        }
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
    $budget: numeric
    $startDate: Date
    $endDate: Date
  ) {
    campaignUpdate(id: $id, set: {
      name: $name
      channel: $channel
      status: $status
      budget: $budget
      startDate: $startDate
      endDate: $endDate
    }) {
      ...CampaignFields
    }
  }
  ${CAMPAIGN_FIELDS}
`;

export const DELETE_CAMPAIGN = gql`
  mutation DeleteCampaign($id: UUID!) {
    campaignDelete(id: $id) {
      id
    }
  }
`;

export const CREATE_FOLLOW_UP = gql`
  mutation CreateFollowUp(
    $orgId: UUID!
    $locationId: UUID!
    $name: String
    $type: String
    $template: String
    $delayDays: Int
  ) {
    followUpInsert(
      collection: "followUps"
      records: [{
        orgId: $orgId
        locationId: $locationId
        name: $name
        type: $type
        template: $template
        delayDays: $delayDays
      }]
    ) {
      edges {
        node {
          ...FollowUpFields
        }
      }
    }
  }
  ${FOLLOW_UP_FIELDS}
`;

export const UPDATE_FOLLOW_UP = gql`
  mutation UpdateFollowUp(
    $id: UUID!
    $name: String
    $type: String
    $template: String
    $delayDays: Int
  ) {
    followUpUpdate(id: $id, set: {
      name: $name
      type: $type
      template: $template
      delayDays: $delayDays
    }) {
      ...FollowUpFields
    }
  }
  ${FOLLOW_UP_FIELDS}
`;

export const DELETE_FOLLOW_UP = gql`
  mutation DeleteFollowUp($id: UUID!) {
    followUpDelete(id: $id) {
      id
    }
  }
`;

export const CREATE_REFERRAL = gql`
  mutation CreateReferral(
    $orgId: UUID!
    $locationId: UUID!
    $customerId: UUID
    $referredName: String!
    $referredPhone: String
    $referredEmail: String
  ) {
    referralInsert(
      collection: "referrals"
      records: [{
        orgId: $orgId
        locationId: $locationId
        customerId: $customerId
        referredName: $referredName
        referredPhone: $referredPhone
        referredEmail: $referredEmail
      }]
    ) {
      edges {
        node {
          ...ReferralFields
        }
      }
    }
  }
  ${REFERRAL_FIELDS}
`;

export const UPDATE_REFERRAL = gql`
  mutation UpdateReferral(
    $id: UUID!
    $status: String
    $convertedToCustomerId: UUID
  ) {
    referralUpdate(id: $id, set: {
      status: $status
      convertedToCustomerId: $convertedToCustomerId
    }) {
      ...ReferralFields
    }
  }
  ${REFERRAL_FIELDS}
`;

export const CREATE_GALLERY_IMAGE = gql`
  mutation CreateGalleryImage(
    $orgId: UUID!
    $locationId: UUID!
    $url: String!
    $caption: String
    $featured: Boolean
    $tags: [String!]
  ) {
    galleryImageInsert(
      collection: "galleryImages"
      records: [{
        orgId: $orgId
        locationId: $locationId
        url: $url
        caption: $caption
        featured: $featured
        tags: $tags
      }]
    ) {
      edges {
        node {
          ...GalleryImageFields
        }
      }
    }
  }
  ${GALLERY_IMAGE_FIELDS}
`;

export const UPDATE_GALLERY_IMAGE = gql`
  mutation UpdateGalleryImage(
    $id: UUID!
    $caption: String
    $featured: Boolean
    $tags: [String!]
  ) {
    galleryImageUpdate(id: $id, set: {
      caption: $caption
      featured: $featured
      tags: $tags
    }) {
      ...GalleryImageFields
    }
  }
  ${GALLERY_IMAGE_FIELDS}
`;

export const DELETE_GALLERY_IMAGE = gql`
  mutation DeleteGalleryImage($id: UUID!) {
    galleryImageDelete(id: $id) {
      id
    }
  }
`;

// ─── Apollo React Hooks ─────────────────────────────────────────────────────

export function USE_REVIEWS({ orgId, first = 100, offset = 0 } = {}) {
  const { data, loading, error, refetch } = useQuery(LIST_REVIEWS, {
    variables: { orgId, first, offset },
    skip: !orgId,
  });
  const reviews = data?.reviewsCollection?.edges?.map(e => e.node) ?? [];
  return { reviews, loading, error, refetch };
}

export function USE_CAMPAIGNS({ orgId, first = 100, offset = 0 } = {}) {
  const { data, loading, error, refetch } = useQuery(LIST_CAMPAIGNS, {
    variables: { orgId, first, offset },
    skip: !orgId,
  });
  const campaigns = data?.campaignsCollection?.edges?.map(e => e.node) ?? [];
  return { campaigns, loading, error, refetch };
}

export function USE_FOLLOW_UPS({ orgId, first = 100, offset = 0 } = {}) {
  const { data, loading, error, refetch } = useQuery(LIST_FOLLOW_UPS, {
    variables: { orgId, first, offset },
    skip: !orgId,
  });
  const followUps = data?.followUpsCollection?.edges?.map(e => e.node) ?? [];
  return { followUps, loading, error, refetch };
}

export function USE_REFERRALS({ orgId, first = 100, offset = 0 } = {}) {
  const { data, loading, error, refetch } = useQuery(LIST_REFERRALS, {
    variables: { orgId, first, offset },
    skip: !orgId,
  });
  const referrals = data?.referralsCollection?.edges?.map(e => e.node) ?? [];
  return { referrals, loading, error, refetch };
}

export function USE_GALLERY_IMAGES({ locationId, first = 50, offset = 0 } = {}) {
  const { data, loading, error, refetch } = useQuery(LIST_GALLERY_IMAGES, {
    variables: { locationId, first, offset },
    skip: !locationId,
  });
  const images = data?.galleryImagesCollection?.edges?.map(e => e.node) ?? [];
  return { images, loading, error, refetch };
}

export function USE_CREATE_REVIEW() {
  return useMutation(CREATE_REVIEW, {
    update(cache, { data: { reviewInsert } }) {
      if (!reviewInsert?.edges?.[0]?.node) return;
      const newReview = reviewInsert.edges[0].node;
      cache.modify({
        fields: {
          // eslint-disable-next-line no-unused-vars
          reviewsCollection(existing = { edges: [] }, { readField }) {
            return {
              ...existing,
              edges: [
                { __typename: 'ReviewEdge', node: newReview },
                ...existing.edges,
              ],
            };
          },
        },
      });
    },
  });
}

export function USE_UPDATE_REVIEW() {
  return useMutation(UPDATE_REVIEW);
}

export function USE_CREATE_CAMPAIGN() {
  return useMutation(CREATE_CAMPAIGN, {
    update(cache, { data: { campaignInsert } }) {
      if (!campaignInsert?.edges?.[0]?.node) return;
      const newCampaign = campaignInsert.edges[0].node;
      cache.modify({
        fields: {
          // eslint-disable-next-line no-unused-vars
          campaignsCollection(existing = { edges: [] }, { readField }) {
            return {
              ...existing,
              edges: [
                { __typename: 'CampaignEdge', node: newCampaign },
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
  return useMutation(UPDATE_CAMPAIGN);
}

export function USE_DELETE_CAMPAIGN() {
  return useMutation(DELETE_CAMPAIGN, {
    update(cache, { data: { campaignDelete } }) {
      if (!campaignDelete?.id) return;
      cache.modify({
        fields: {
          // eslint-disable-next-line no-unused-vars
          campaignsCollection(existing = { edges: [] }, { readField }) {
            return {
              ...existing,
              edges: existing.edges.filter(e => e.node?.id !== campaignDelete.id),
            };
          },
        },
      });
    },
  });
}

export function USE_CREATE_FOLLOW_UP() {
  return useMutation(CREATE_FOLLOW_UP, {
    update(cache, { data: { followUpInsert } }) {
      if (!followUpInsert?.edges?.[0]?.node) return;
      const newFollowUp = followUpInsert.edges[0].node;
      cache.modify({
        fields: {
          // eslint-disable-next-line no-unused-vars
          followUpsCollection(existing = { edges: [] }, { readField }) {
            return {
              ...existing,
              edges: [
                { __typename: 'FollowUpEdge', node: newFollowUp },
                ...existing.edges,
              ],
            };
          },
        },
      });
    },
  });
}

export function USE_UPDATE_FOLLOW_UP() {
  return useMutation(UPDATE_FOLLOW_UP);
}

export function USE_DELETE_FOLLOW_UP() {
  return useMutation(DELETE_FOLLOW_UP, {
    update(cache, { data: { followUpDelete } }) {
      if (!followUpDelete?.id) return;
      cache.modify({
        fields: {
          // eslint-disable-next-line no-unused-vars
          followUpsCollection(existing = { edges: [] }, { readField }) {
            return {
              ...existing,
              edges: existing.edges.filter(e => e.node?.id !== followUpDelete.id),
            };
          },
        },
      });
    },
  });
}

export function USE_CREATE_REFERRAL() {
  return useMutation(CREATE_REFERRAL, {
    update(cache, { data: { referralInsert } }) {
      if (!referralInsert?.edges?.[0]?.node) return;
      const newReferral = referralInsert.edges[0].node;
      cache.modify({
        fields: {
          // eslint-disable-next-line no-unused-vars
          referralsCollection(existing = { edges: [] }, { readField }) {
            return {
              ...existing,
              edges: [
                { __typename: 'ReferralEdge', node: newReferral },
                ...existing.edges,
              ],
            };
          },
        },
      });
    },
  });
}

export function USE_UPDATE_REFERRAL() {
  return useMutation(UPDATE_REFERRAL);
}

export function USE_CREATE_GALLERY_IMAGE() {
  return useMutation(CREATE_GALLERY_IMAGE, {
    update(cache, { data: { galleryImageInsert } }) {
      if (!galleryImageInsert?.edges?.[0]?.node) return;
      const newImage = galleryImageInsert.edges[0].node;
      cache.modify({
        fields: {
          // eslint-disable-next-line no-unused-vars
          galleryImagesCollection(existing = { edges: [] }, { readField }) {
            return {
              ...existing,
              edges: [
                { __typename: 'GalleryImageEdge', node: newImage },
                ...existing.edges,
              ],
            };
          },
        },
      });
    },
  });
}

export function USE_UPDATE_GALLERY_IMAGE() {
  return useMutation(UPDATE_GALLERY_IMAGE);
}

export function USE_DELETE_GALLERY_IMAGE() {
  return useMutation(DELETE_GALLERY_IMAGE, {
    update(cache, { data: { galleryImageDelete } }) {
      if (!galleryImageDelete?.id) return;
      cache.modify({
        fields: {
          // eslint-disable-next-line no-unused-vars
          galleryImagesCollection(existing = { edges: [] }, { readField }) {
            return {
              ...existing,
              edges: existing.edges.filter(e => e.node?.id !== galleryImageDelete.id),
            };
          },
        },
      });
    },
  });
}
