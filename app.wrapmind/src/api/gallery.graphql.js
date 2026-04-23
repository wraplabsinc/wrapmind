import { gql } from '@apollo/client';
import { useQuery, useMutation } from '@apollo/client/react';

// ─── Fragment ────────────────────────────────────────────────────────────────

export const GALLERY_IMAGE_FIELDS = gql`
  fragment GalleryImageFields on GalleryImage {
    id
    shopId
    url
    caption
    tags
    createdBy
    createdAt
  }
`;

// ─── Queries ─────────────────────────────────────────────────────────────────

/**
 * List gallery images for a shop.
 */
export const LIST_GALLERY_IMAGES = gql`
  query ListGalleryImages($shopId: UUID!, $first: Int, $offset: Int) {
    galleryImagesCollection(
      filter: { shopId: { eq: $shopId } }
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

/**
 * Get a single gallery image by ID.
 */
export const GET_GALLERY_IMAGE = gql`
  query GetGalleryImage($id: UUID!) {
    galleryImage(id: $id) {
      ...GalleryImageFields
    }
  }
  ${GALLERY_IMAGE_FIELDS}
`;

// ─── Mutations ───────────────────────────────────────────────────────────────

export const CREATE_GALLERY_IMAGE = gql`
  mutation CreateGalleryImage(
    $shopId: UUID!
    $url: String!
    $caption: String
    $tags: [String!]
  ) {
    galleryImageInsert(
      input: {
        shopId: $shopId
        url: $url
        caption: $caption
        tags: $tags
      }
    ) {
      ...GalleryImageFields
    }
  }
  ${GALLERY_IMAGE_FIELDS}
`;

export const UPDATE_GALLERY_IMAGE = gql`
  mutation UpdateGalleryImage(
    $id: UUID!
    $url: String
    $caption: String
    $tags: [String!]
  ) {
    galleryImageUpdate(
      id: $id
      set: {
        url: $url
        caption: $caption
        tags: $tags
      }
    ) {
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

export function USE_GALLERY_IMAGES({ shopId, first = 100, offset = 0 } = {}) {
  const { data, loading, error, refetch } = useQuery(LIST_GALLERY_IMAGES, {
    variables: { shopId, first, offset },
    skip: !shopId,
  });
  const edges = data?.galleryImagesCollection?.edges ?? [];
  const galleryImages = edges.map(e => e.node);
  return { galleryImages, loading, error, refetch };
}

export function USE_GALLERY_IMAGE(id) {
  const { data, loading, error } = useQuery(GET_GALLERY_IMAGE, {
    variables: { id },
    skip: !id,
  });
  return { galleryImage: data?.galleryImage ?? null, loading, error };
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
  return useMutation(UPDATE_GALLERY_IMAGE, {
    update(cache, { data: { galleryImageUpdate } }) {
      if (!galleryImageUpdate) return;
      cache.modify({
        fields: {
          // eslint-disable-next-line no-unused-vars
          galleryImagesCollection(existing = { edges: [] }, { readField }) {
            return {
              ...existing,
              edges: existing.edges.map(e =>
                e.node?.id === galleryImageUpdate.id
                  ? { ...e, node: { ...e.node, ...galleryImageUpdate } }
                  : e
              ),
            };
          },
        },
      });
    },
  });
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
