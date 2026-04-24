import { gql } from '@apollo/client';
import { useQuery, useMutation } from '@apollo/client/react';

// ─── Fragment ────────────────────────────────────────────────────────────────

export const GALLERY_IMAGE_FIELDS = gql`
  fragment GalleryImageFields on gallery_images {
    id
    shop_id
    url
    caption
    tags
    created_by
    created_at
  }
`;

// ─── Queries ─────────────────────────────────────────────────────────────────

/**
 * List gallery images for a shop.
 */
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
    gallery_imagesCollection(filter: { id: { eq: $id } }, first: 1) {
      edges {
        node {
          ...GalleryImageFields
        }
      }
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
    insertIntogallery_imagesCollection(objects: [{
      shop_id: $shopId
      url: $url
      caption: $caption
      tags: $tags
    }]) {
      returning {
        ...GalleryImageFields
      }
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
    updategallery_imagesCollection(
      filter: { id: { eq: $id } }
      set: {
        url: $url
        caption: $caption
        tags: $tags
      }
    ) {
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

// ─── Apollo React Hooks ─────────────────────────────────────────────────────

export function USE_GALLERY_IMAGES({ shopId, first = 100, offset = 0 } = {}) {
  const { data, loading, error, refetch } = useQuery(LIST_GALLERY_IMAGES, {
    variables: { shopId, first, offset },
    skip: !shopId,
  });
  const edges = data?.gallery_imagesCollection?.edges ?? [];
  const galleryImages = edges.map(e => e.node);
  return { galleryImages, loading, error, refetch };
}

export function USE_GALLERY_IMAGE(id) {
  const { data, loading, error } = useQuery(GET_GALLERY_IMAGE, {
    variables: { id },
    skip: !id,
  });
  const edge = data?.gallery_imagesCollection?.edges?.[0];
  return { galleryImage: edge?.node ?? null, loading, error };
}

export function USE_CREATE_GALLERY_IMAGE() {
  return useMutation(CREATE_GALLERY_IMAGE, {
    update(cache, { data: { insertIntogallery_imagesCollection } }) {
      const returning = insertIntogallery_imagesCollection?.returning ?? [];
      if (!returning[0]) return;
      const newImage = returning[0];
      cache.modify({
        fields: {
          // eslint-disable-next-line no-unused-vars
          gallery_imagesCollection(existing = { edges: [] }, { readField }) {
            return {
              ...existing,
              edges: [
                { __typename: 'gallery_imagesEdge', node: newImage },
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
    update(cache, { data: { updategallery_imagesCollection } }) {
      const returning = updategallery_imagesCollection?.returning ?? [];
      if (!returning[0]) return;
      const updated = returning[0];
      cache.modify({
        fields: {
          // eslint-disable-next-line no-unused-vars
          gallery_imagesCollection(existing = { edges: [] }, { readField }) {
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
              edges: existing.edges.filter(e => e.node?.id !== returning[0].id),
            },
          },
        },
      });
    },
  });
}
