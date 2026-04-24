import { gql } from '@apollo/client';
import { useQuery, useMutation } from '@apollo/client/react';

// ─── Fragment ────────────────────────────────────────────────────────────────

export const MARKETING_CAMPAIGN_FIELDS = gql`
  fragment MarketingCampaignFields on marketing_campaigns {
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

// ─── Queries ─────────────────────────────────────────────────────────────────

/**
 * List marketing campaigns for an org/location.
 */
export const LIST_MARKETING_CAMPAIGNS = gql`
  query ListMarketingCampaigns($orgId: UUID!, $locationId: UUID!, $first: Int, $offset: Int) {
    marketing_campaignsCollection(
      filter: { org_id: { eq: $orgId }, location_id: { eq: $locationId } }
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
    $orgId: UUID!
    $locationId: UUID!
    $name: String!
    $channel: String!
    $status: String
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

export function USE_MARKETING_CAMPAIGNS({ orgId, locationId, first = 100, offset = 0 } = {}) {
  const { data, loading, error, refetch } = useQuery(LIST_MARKETING_CAMPAIGNS, {
    variables: { orgId, locationId, first, offset },
    skip: !orgId || !locationId,
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
    update(cache, { data: { insertIntocampaignsCollection } }) {
      const returning = insertIntocampaignsCollection?.returning ?? [];
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
