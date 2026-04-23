import { gql } from '@apollo/client';
import { useQuery, useMutation } from '@apollo/client/react';

// ─── Fragments ────────────────────────────────────────────────────────────────

export const INVOICE_FIELDS = gql`
  fragment InvoiceFields on Invoice {
    id
    orgId
    locationId
    invoiceNumber
    estimateId
    customerId
    vehicleId
    status
    lineItems
    subtotal
    taxRate
    taxAmount
    discount
    total
    amountPaid
    amountDue
    payments
    terms
    notes
    issuedAt
    dueAt
    paidAt
    voidedAt
    createdById
    createdAt
    updatedAt
  }
`;

// ─── Queries ─────────────────────────────────────────────────────────────────

/**
 * List invoices for an org, ordered by createdAt desc.
 * pg_graphql uses first/offset for pagination.
 */
export const LIST_INVOICES = gql`
  query ListInvoices($orgId: UUID!, $first: Int, $offset: Int) {
    invoicesCollection(
      filter: {
        orgId: { eq: $orgId }
      }
      first: $first
      offset: $offset
      orderBy: [{ createdAt: DESC }]
    ) {
      edges {
        node {
          id
          invoiceNumber
          status
          locationId
          estimateId
          customerId
          vehicleId
          lineItems
          subtotal
          taxRate
          taxAmount
          discount
          total
          amountPaid
          amountDue
          payments
          terms
          notes
          issuedAt
          dueAt
          paidAt
          voidedAt
          createdById
          createdAt
          updatedAt
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
  ${INVOICE_FIELDS}
`;

/**
 * Get a single invoice by ID.
 */
export const GET_INVOICE = gql`
  query GetInvoice($id: UUID!) {
    invoice(id: $id) {
      ...InvoiceFields
    }
  }
  ${INVOICE_FIELDS}
`;

// ─── Mutations ──────────────────────────────────────────────────────────────

/**
 * Create an invoice.
 * lineItems and payments are passed as JSON strings (pg_graphql JSONB input).
 */
export const CREATE_INVOICE = gql`
  mutation CreateInvoice(
    $orgId: UUID!
    $locationId: UUID!
    $invoiceNumber: String!
    $customerId: UUID!
    $estimateId: UUID
    $vehicleId: UUID
    $status: String!
    $lineItems: String
    $subtotal: numeric
    $taxRate: numeric
    $taxAmount: numeric
    $discount: numeric
    $total: numeric!
    $amountPaid: numeric
    $amountDue: numeric
    $payments: String
    $terms: String
    $notes: String
    $issuedAt: timestamptz
    $dueAt: timestamptz
    $createdById: UUID
  ) {
    invoiceInsert(
      input: {
        orgId: $orgId
        locationId: $locationId
        invoiceNumber: $invoiceNumber
        customerId: $customerId
        estimateId: $estimateId
        vehicleId: $vehicleId
        status: $status
        lineItems: $lineItems
        subtotal: $subtotal
        taxRate: $taxRate
        taxAmount: $taxAmount
        discount: $discount
        total: $total
        amountPaid: $amountPaid
        amountDue: $amountDue
        payments: $payments
        terms: $terms
        notes: $notes
        issuedAt: $issuedAt
        dueAt: $dueAt
        createdById: $createdById
      }
    ) {
      ...InvoiceFields
    }
  }
  ${INVOICE_FIELDS}
`;

/**
 * Update an invoice.
 * Payments array is updated via dedicated INSERT then re-fetch or use JSONB concat.
 * Status changes: paid, voided, partial, sent, draft.
 */
export const UPDATE_INVOICE = gql`
  mutation UpdateInvoice(
    $id: UUID!
    $status: String
    $lineItems: String
    $subtotal: numeric
    $taxRate: numeric
    $taxAmount: numeric
    $discount: numeric
    $total: numeric
    $amountPaid: numeric
    $amountDue: numeric
    $payments: String
    $terms: String
    $notes: String
    $issuedAt: timestamptz
    $dueAt: timestamptz
    $paidAt: timestamptz
    $voidedAt: timestamptz
  ) {
    invoiceUpdate(
      id: $id
      set: {
        status: $status
        lineItems: $lineItems
        subtotal: $subtotal
        taxRate: $taxRate
        taxAmount: $taxAmount
        discount: $discount
        total: $total
        amountPaid: $amountPaid
        amountDue: $amountDue
        payments: $payments
        terms: $terms
        notes: $notes
        issuedAt: $issuedAt
        dueAt: $dueAt
        paidAt: $paidAt
        voidedAt: $voidedAt
      }
    ) {
      ...InvoiceFields
    }
  }
  ${INVOICE_FIELDS}
`;

/**
 * Delete an invoice.
 */
export const DELETE_INVOICE = gql`
  mutation DeleteInvoice($id: UUID!) {
    invoiceDelete(id: $id) {
      id
    }
  }
`;

// ─── Apollo React Hooks ───────────────────────────────────────────────────────

/**
 * List invoices for an org.
 * Returns { invoices, loading, error, refetch }
 */
export function USE_INVOICES({ orgId, first = 300, offset = 0 } = {}) {
  const { data, loading, error, refetch } = useQuery(LIST_INVOICES, {
    variables: { orgId, first, offset },
    skip: !orgId,
  });

  const edges = data?.invoicesCollection?.edges ?? [];
  const invoices = edges.map(e => e.node);
  const pageInfo = data?.invoicesCollection?.pageInfo ?? {};

  return { invoices, loading, error, refetch, ...pageInfo };
}

/**
 * Get a single invoice by ID.
 * Returns { invoice, loading, error }
 */
export function USE_INVOICE(id) {
  const { data, loading, error } = useQuery(GET_INVOICE, {
    variables: { id },
    skip: !id,
  });

  return { invoice: data?.invoice ?? null, loading, error };
}

/**
 * Create an invoice mutation hook.
 * Returns [createInvoice, { loading, error, data }]
 */
export function USE_CREATE_INVOICE() {
  return useMutation(CREATE_INVOICE, {
    update(cache, { data: { invoiceInsert } }) {
      if (!invoiceInsert?.edges?.[0]?.node) return;
      const newInvoice = invoiceInsert.edges[0].node;
      cache.modify({
        fields: {
          // eslint-disable-next-line no-unused-vars
          invoicesCollection(existing = { edges: [] }, { readField }) {
            return {
              ...existing,
              edges: [
                { __typename: 'InvoiceEdge', node: newInvoice },
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
 * Update an invoice mutation hook.
 * Returns [updateInvoice, { loading, error, data }]
 */
export function USE_UPDATE_INVOICE() {
  return useMutation(UPDATE_INVOICE);
}

/**
 * Delete an invoice mutation hook.
 * Returns [deleteInvoice, { loading, error, data }]
 */
export function USE_DELETE_INVOICE() {
  return useMutation(DELETE_INVOICE, {
    update(cache, { data: { invoiceDelete } }) {
      if (!invoiceDelete?.id) return;
      cache.modify({
        fields: {
          // eslint-disable-next-line no-unused-vars
          invoicesCollection(existing = { edges: [] }, { readField }) {
            return {
              ...existing,
              edges: existing.edges.filter(
                e => e.node?.id !== invoiceDelete.id
              ),
            };
          },
        },
      });
    },
  });
}
