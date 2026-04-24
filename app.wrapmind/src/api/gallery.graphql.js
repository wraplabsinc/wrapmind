import { gql } from '@apollo/client';
import { useQuery, useMutation } from '@apollo/client/react';

// ─── Fragment ────────────────────────────────────────────────────────────────

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

// ─── Queries ─────────────────────────────────────────────────────────────────

/**
 * List gallery images for an org.
 */
export const LIST_GALLERY_IMAGES = gql`
  query ListGalleryImages($orgId: UUID!, $first: Int, $offset: Int) {
    gallery_imagesCollection(
      filter: { org_id: { eq: $orgId } }
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

// ─── Mutations ────────────────────────────────────────────────────────────────

/**
 * Create a gallery image.
 */
export const CREATE_GALLERY_IMAGE = gql`
  mutation CreateGalleryImage(
    $orgId: UUID!
    $locationId: UUID!
    $url: String!
    $caption: String
    $featured: Boolean
    $tags: [String!]
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

/**
 * Delete a gallery image.
 */
export const DELETE_GALLERY_IMAGE = gql`
  mutation DeleteGalleryImage($id: UUID!) {
    deleteFromgallery_imagesCollection(filter: { id: { eq: $id } }) {
      returning {
        id
      }
    }
  }
`;

// ─── Apollo React Hooks ──────────────────────────────────────────────────────

/**
 * Normalize a DB gallery_image row (snake_case) → app shape (camelCase).
 */
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

/**
 * List gallery images for an org.
 * Returns { galleryImages, loading, error, refetch }
 */
export function USE_GALLERY_IMAGES({ orgId, first = 100, offset = 0 } = {}) {
  const { data, loading, error, refetch } = useQuery(LIST_GALLERY_IMAGES, {
    variables: { orgId, first, offset },
    skip: !orgId,
  });

  const edges = data?.gallery_imagesCollection?.edges ?? [];
  const galleryImages = edges.map(e => normalizeGalleryImage(e.node));
  const pageInfo = data?.gallery_imagesCollection?.pageInfo ?? {};

  return { galleryImages, loading, error, refetch, ...pageInfo };
}

/**
 * Get a single gallery image by ID.
 * Returns { galleryImage, loading, error }
 */
export function USE_GALLERY_IMAGE(id) {
  const { data, loading, error } = useQuery(GET_GALLERY_IMAGE, {
    variables: { id },
    skip: !id,
  });

  const edge = data?.gallery_imagesCollection?.edges?.[0];
  return { galleryImage: edge ? normalizeGalleryImage(edge.node) : null, loading, error };
}

/**
 * Create a gallery image mutation hook.
 * Returns [createGalleryImage, { loading, error, data }]
 */
export function USE_CREATE_GALLERY_IMAGE() {
  return useMutation(CREATE_GALLERY_IMAGE, {
    update(cache, { data: { insertIntogallery_imagesCollection } }) {
      const returning = insertIntogallery_imagesCollection?.returning ?? [];
      if (!returning[0]) return;
      const newImage = normalizeGalleryImage(returning[0]);
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

/**
 * Delete a gallery image mutation hook.
 * Returns [deleteGalleryImage, { loading, error, data }]
 */
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
