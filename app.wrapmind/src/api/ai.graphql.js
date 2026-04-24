import { gql } from '@apollo/client';
import { useQuery, useMutation } from '@apollo/client/react';

// ════════════════════════════════════════════════════════════════════════════
// AI CONVERSATIONS
// DB: ai_conversations  |  Collection: ai_conversationsCollection
//
// NOTE: This collection may not yet exist in the production DB.
// If the mutation/query returns "Unknown field", the table needs to be
// created first via a Supabase migration.
// ════════════════════════════════════════════════════════════════════════════

export const AI_CONVERSATION_FIELDS = gql`
  fragment AIConversationFields on ai_conversations {
    id
    org_id
    profile_id
    title
    created_at
    updated_at
  }
`;

export const LIST_AI_CONVERSATIONS = gql`
  query ListAIConversations($orgId: UUID!, $first: Int, $offset: Int) {
    ai_conversationsCollection(
      filter: { org_id: { eq: $orgId } }
      first: $first
      offset: $offset
      orderBy: [{ updated_at: DESC }]
    ) {
      edges {
        node {
          id
          org_id
          profile_id
          title
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
  ${AI_CONVERSATION_FIELDS}
`;

export const CREATE_AI_CONVERSATION = gql`
  mutation CreateAIConversation(
    $orgId: UUID!
    $profileId: UUID!
    $title: String!
  ) {
    insertIntoai_conversationsCollection(objects: [{
      org_id: $orgId
      profile_id: $profileId
      title: $title
    }]) {
      returning {
        ...AIConversationFields
      }
    }
  }
  ${AI_CONVERSATION_FIELDS}
`;

/**
 * Normalize a DB ai_conversation row (snake_case) → app shape (camelCase).
 */
export function normalizeAIConversation(row = {}) {
  if (!row || !row.id) return null;
  return {
    id: row.id,
    orgId: row.org_id,
    profileId: row.profile_id,
    title: row.title,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function USE_AI_CONVERSATIONS({ orgId, first = 50, offset = 0 } = {}) {
  const { data, loading, error, refetch } = useQuery(LIST_AI_CONVERSATIONS, {
    variables: { orgId, first, offset },
    skip: !orgId,
  });
  const edges = data?.ai_conversationsCollection?.edges ?? [];
  return {
    conversations: edges.map(e => normalizeAIConversation(e.node)),
    loading,
    error,
    refetch,
  };
}

export function USE_CREATE_AI_CONVERSATION() {
  return useMutation(CREATE_AI_CONVERSATION, {
    update(cache, { data: { insertIntoai_conversationsCollection } }) {
      const returning = insertIntoai_conversationsCollection?.returning ?? [];
      if (!returning[0]) return;
      const newConv = normalizeAIConversation(returning[0]);
      cache.modify({
        fields: {
          // eslint-disable-next-line no-unused-vars
          ai_conversationsCollection(existing = { edges: [] }, { readField }) {
            return {
              ...existing,
              edges: [
                { __typename: 'ai_conversationsEdge', node: newConv },
                ...existing.edges,
              ],
            };
          },
        },
      });
    },
  });
}
