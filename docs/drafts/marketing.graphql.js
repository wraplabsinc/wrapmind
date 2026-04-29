import { gql } from '@apollo/client';
import { useQuery, useMutation } from '@apollo/client/react';

// ════════════════════════════════════════════════════════════════════════════
// MARKETING CAMPAIGNS
// DB: marketing_campaigns  |  Collection: marketing_campaignsCollection
// ════════════════════════════════════════════════════════════════════════════

export const CAMPAIGN_FIELDS = gql`
  fragment CampaignFields on marketing_campaigns {
    id
    org_id
    name
    budget
    start_date
    end_date
    status
    created_at
  }
`;

// ─── Queries ─────────────────────────────────────────────────────────────────

/**
 * List marketing campaigns for an org, optionally filtered by status.
 */
export const LIST_CAMPAIGNS = gql`
  query ListCampaigns($orgId: UUID!, $status: String, $first: Int, $offset: Int) {
    marketing_campaignsCollection(
      filter: { org_id: { eq: $orgId }, status: { eq: $status } }
      first: $first
      offset: $offset
      orderBy: [{ created_at: DESC }]
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

/**
 * Get a single marketing campaign by ID.
 */
export const GET_CAMPAIGN = gql`
  query GetCampaign($id: UUID!) {
    marketing_campaignsCollection(filter: { id: { eq: $id } }, first: 1) {
      edges {
        node {
          ...CampaignFields
        }
      }
    }
  }
  ${CAMPAIGN_FIELDS}
`;

// ─── Mutations ───────────────────────────────────────────────────────────────

export const CREATE_CAMPAIGN = gql`
  mutation CreateCampaign(
    $orgId: UUID!
    $name: String!
    $budget: Float
    $startDate: DateTime
    $endDate: DateTime
    $status: String
  ) {
    insertIntocampaignsCollection(objects: [{
      org_id: $orgId
      name: $name
      budget: $budget
      start_date: $startDate
      end_date: $endDate
      status: $status
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
    $budget: Float
    $startDate: DateTime
    $endDate: DateTime
    $status: String
  ) {
    updatemarketing_campaignsCollection(
      filter: { id: { eq: $id } }
      set: {
        name: $name
        budget: $budget
        start_date: $startDate
        end_date: $endDate
        status: $status
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

// ─── Apollo React Hooks ───────────────────────────────────────────────────────

export function USE_CAMPAIGNS({ orgId, status, first = 100, offset = 0 } = {}) {
  const { data, loading, error, refetch } = useQuery(LIST_CAMPAIGNS, {
    variables: { orgId, status, first, offset },
    skip: !orgId,
  });
  return { data, loading, error, refetch };
}

export function USE_CAMPAIGN(id) {
  const { data, loading, error, refetch } = useQuery(GET_CAMPAIGN, {
    variables: { id },
    skip: !id,
  });
  const campaign = data?.marketing_campaignsCollection?.edges?.[0]?.node ?? null;
  return { campaign, loading, error, refetch };
}

export function USE_CREATE_CAMPAIGN() {
  const [mutate, { data, loading, error }] = useMutation(CREATE_CAMPAIGN);
  return { createCampaign: mutate, data, loading, error };
}

export function USE_UPDATE_CAMPAIGN() {
  const [mutate, { data, loading, error }] = useMutation(UPDATE_CAMPAIGN);
  return { updateCampaign: mutate, data, loading, error };
}

export function USE_DELETE_CAMPAIGN() {
  const [mutate, { data, loading, error }] = useMutation(DELETE_CAMPAIGN);
  return { deleteCampaign: mutate, data, loading, error };
}
