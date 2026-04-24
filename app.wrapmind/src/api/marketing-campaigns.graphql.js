import { gql } from '@apollo/client';
import { useQuery, useMutation } from '@apollo/client/react';

// ─── Fragment ────────────────────────────────────────────────────────────────

export const MARKETING_CAMPAIGN_FIELDS = gql`
  fragment MarketingCampaignFields on marketing_campaigns {
    id
    shop_id
    name
    type
    status
    subject
    body
    sent_at
    stats
    created_by
    created_at
    updated_at
  }
`;

// ─── Queries ─────────────────────────────────────────────────────────────────

/**
 * List marketing campaigns for a shop.
 */
export const LIST_MARKETING_CAMPAIGNS = gql`
  query ListMarketingCampaigns($shopId: UUID!, $first: Int, $offset: Int) {
    marketing_campaignsCollection(
      filter: { shop_id: { eq: $shopId } }
      first: $first
      offset: $offset
      orderBy: [{ created_at: DESC }]
    ) {
      edges {
        node {
          ...MarketingCampaignFields
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
  ${MARKETING_CAMPAIGN_FIELDS}
`;

/**
 * Get a single marketing campaign by ID.
 */
export const GET_MARKETING_CAMPAIGN = gql`
  query GetMarketingCampaign($id: UUID!) {
    marketing_campaignsCollection(filter: { id: { eq: $id } }, first: 1) {
      edges {
        node {
          ...MarketingCampaignFields
        }
      }
    }
  }
  ${MARKETING_CAMPAIGN_FIELDS}
`;

// ─── Mutations ───────────────────────────────────────────────────────────────

export const CREATE_MARKETING_CAMPAIGN = gql`
  mutation CreateMarketingCampaign(
    $shopId: UUID!
    $name: String!
    $type: String!
    $status: String
    $subject: String
    $body: String
    $sentAt: DateTime
    $stats: JSON
  ) {
    insertIntomarketing_campaignsCollection(objects: [{
      shop_id: $shopId
      name: $name
      type: $type
      status: $status
      subject: $subject
      body: $body
      sent_at: $sentAt
      stats: $stats
    }]) {
      returning {
        ...MarketingCampaignFields
      }
    }
  }
  ${MARKETING_CAMPAIGN_FIELDS}
`;

export const UPDATE_MARKETING_CAMPAIGN = gql`
  mutation UpdateMarketingCampaign(
    $id: UUID!
    $name: String
    $type: String
    $status: String
    $subject: String
    $body: String
    $sentAt: DateTime
    $stats: JSON
  ) {
    updatemarketing_campaignsCollection(
      filter: { id: { eq: $id } }
      set: {
        name: $name
        type: $type
        status: $status
        subject: $subject
        body: $body
        sent_at: $sentAt
        stats: $stats
      }
    ) {
      returning {
        ...MarketingCampaignFields
      }
    }
  }
  ${MARKETING_CAMPAIGN_FIELDS}
`;

export const DELETE_MARKETING_CAMPAIGN = gql`
  mutation DeleteMarketingCampaign($id: UUID!) {
    deleteFrommarketing_campaignsCollection(filter: { id: { eq: $id } }) {
      returning { id }
    }
  }
`;

// ─── Apollo React Hooks ───────────────────────────────────────────────────────

export function USE_MARKETING_CAMPAIGNS({ shopId, first = 100, offset = 0 } = {}) {
  const { data, loading, error, refetch } = useQuery(LIST_MARKETING_CAMPAIGNS, {
    variables: { shopId, first, offset },
    skip: !shopId,
  });
  const edges = data?.marketing_campaignsCollection?.edges ?? [];
  const marketingCampaigns = edges.map(e => e.node);
  return { marketingCampaigns, loading, error, refetch };
}

export function USE_MARKETING_CAMPAIGN(id) {
  const { data, loading, error } = useQuery(GET_MARKETING_CAMPAIGN, {
    variables: { id },
    skip: !id,
  });
  const edge = data?.marketing_campaignsCollection?.edges?.[0];
  return { marketingCampaign: edge?.node ?? null, loading, error };
}

export function USE_CREATE_MARKETING_CAMPAIGN() {
  return useMutation(CREATE_MARKETING_CAMPAIGN, {
    update(cache, { data: { insertIntomarketing_campaignsCollection } }) {
      const returning = insertIntomarketing_campaignsCollection?.returning ?? [];
      if (!returning[0]) return;
      const newCampaign = returning[0];
      cache.modify({
        fields: {
          // eslint-disable-next-line no-unused-vars
          marketing_campaignsCollection(existing = { edges: [] }, { readField }) {
            return {
              ...existing,
              edges: [
                { __typename: 'marketing_campaignsEdge', node: newCampaign },
                ...existing.edges,
              ],
            };
          },
        },
      });
    },
  });
}

export function USE_UPDATE_MARKETING_CAMPAIGN() {
  return useMutation(UPDATE_MARKETING_CAMPAIGN, {
    update(cache, { data: { updatemarketing_campaignsCollection } }) {
      const returning = updatemarketing_campaignsCollection?.returning ?? [];
      if (!returning[0]) return;
      const updated = returning[0];
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

export function USE_DELETE_MARKETING_CAMPAIGN() {
  return useMutation(DELETE_MARKETING_CAMPAIGN, {
    update(cache, { data: { deleteFrommarketing_campaignsCollection } }) {
      const returning = deleteFrommarketing_campaignsCollection?.returning ?? [];
      if (!returning[0]?.id) return;
      cache.modify({
        fields: {
          // eslint-disable-next-line no-unused-vars
          marketing_campaignsCollection(existing = { edges: [] }, { readField }) {
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
