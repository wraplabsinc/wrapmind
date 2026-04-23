import { gql } from '@apollo/client';
import { useQuery, useMutation } from '@apollo/client/react';

// ─── Fragment ────────────────────────────────────────────────────────────────

export const MARKETING_CAMPAIGN_FIELDS = gql`
  fragment MarketingCampaignFields on MarketingCampaign {
    id
    shopId
    name
    type
    status
    subject
    body
    sentAt
    stats
    createdBy
    createdAt
    updatedAt
  }
`;

// ─── Queries ─────────────────────────────────────────────────────────────────

/**
 * List marketing campaigns for a shop.
 */
export const LIST_MARKETING_CAMPAIGNS = gql`
  query ListMarketingCampaigns($shopId: UUID!, $first: Int, $offset: Int) {
    marketingCampaignsCollection(
      filter: { shopId: { eq: $shopId } }
      first: $first
      offset: $offset
      orderBy: [{ createdAt: DESC }]
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
    marketingCampaign(id: $id) {
      ...MarketingCampaignFields
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
    marketingCampaignInsert(
      input: {
        shopId: $shopId
        name: $name
        type: $type
        status: $status
        subject: $subject
        body: $body
        sentAt: $sentAt
        stats: $stats
      }
    ) {
      ...MarketingCampaignFields
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
    marketingCampaignUpdate(
      id: $id
      set: {
        name: $name
        type: $type
        status: $status
        subject: $subject
        body: $body
        sentAt: $sentAt
        stats: $stats
      }
    ) {
      ...MarketingCampaignFields
    }
  }
  ${MARKETING_CAMPAIGN_FIELDS}
`;

export const DELETE_MARKETING_CAMPAIGN = gql`
  mutation DeleteMarketingCampaign($id: UUID!) {
    marketingCampaignDelete(id: $id) {
      id
    }
  }
`;

// ─── Apollo React Hooks ─────────────────────────────────────────────────────

export function USE_MARKETING_CAMPAIGNS({ shopId, first = 100, offset = 0 } = {}) {
  const { data, loading, error, refetch } = useQuery(LIST_MARKETING_CAMPAIGNS, {
    variables: { shopId, first, offset },
    skip: !shopId,
  });
  const edges = data?.marketingCampaignsCollection?.edges ?? [];
  const marketingCampaigns = edges.map(e => e.node);
  return { marketingCampaigns, loading, error, refetch };
}

export function USE_MARKETING_CAMPAIGN(id) {
  const { data, loading, error } = useQuery(GET_MARKETING_CAMPAIGN, {
    variables: { id },
    skip: !id,
  });
  return { marketingCampaign: data?.marketingCampaign ?? null, loading, error };
}

export function USE_CREATE_MARKETING_CAMPAIGN() {
  return useMutation(CREATE_MARKETING_CAMPAIGN, {
    update(cache, { data: { marketingCampaignInsert } }) {
      if (!marketingCampaignInsert?.edges?.[0]?.node) return;
      const newCampaign = marketingCampaignInsert.edges[0].node;
      cache.modify({
        fields: {
          // eslint-disable-next-line no-unused-vars
          marketingCampaignsCollection(existing = { edges: [] }, { readField }) {
            return {
              ...existing,
              edges: [
                { __typename: 'MarketingCampaignEdge', node: newCampaign },
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
    update(cache, { data: { marketingCampaignUpdate } }) {
      if (!marketingCampaignUpdate) return;
      cache.modify({
        fields: {
          // eslint-disable-next-line no-unused-vars
          marketingCampaignsCollection(existing = { edges: [] }, { readField }) {
            return {
              ...existing,
              edges: existing.edges.map(e =>
                e.node?.id === marketingCampaignUpdate.id
                  ? { ...e, node: { ...e.node, ...marketingCampaignUpdate } }
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
    update(cache, { data: { marketingCampaignDelete } }) {
      if (!marketingCampaignDelete?.id) return;
      cache.modify({
        fields: {
          // eslint-disable-next-line no-unused-vars
          marketingCampaignsCollection(existing = { edges: [] }, { readField }) {
            return {
              ...existing,
              edges: existing.edges.filter(e => e.node?.id !== marketingCampaignDelete.id),
            };
          },
        },
      });
    },
  });
}
