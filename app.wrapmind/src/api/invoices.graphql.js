import { gql } from '@apollo/client';
import { useQuery, useMutation } from '@apollo/client/react';

// ─── Fragments ────────────────────────────────────────────────────────────────

export const INVOICE_FIELDS = gql`
  fragment InvoiceFields on invoices {
    id
    org_id
    location_id
    invoice_number
    estimate_id
    customer_id
    vehicle_json
    line_items_json
    subtotal
    tax
    discount
    total
    amount_paid
    amount_due
    status
    payments
    terms
    notes
    issued_at
    due_at
    paid_at
    voided_at
    created_at
    updated_at
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
        org_id: { eq: $orgId }
      }
      first: $first
      offset: $offset
      orderBy: [{ created_at: DESC }]
    ) {
      edges {
        node {
          id
          invoice_number
          status
          location_id
          estimate_id
          customer_id
          vehicle_json
          line_items_json
          subtotal
          tax
          discount
          total
          amount_paid
          amount_due
          payments
          terms
          notes
          issued_at
          due_at
          paid_at
          voided_at
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
  ${INVOICE_FIELDS}
`;

/**
 * Get a single invoice by ID.
 */
export const GET_INVOICE = gql`
  query GetInvoice($id: UUID!) {
    invoicesCollection(filter: { id: { eq: $id } }, first: 1) {
      edges {
        node {
          ...InvoiceFields
        }
      }
    }
  }
  ${INVOICE_FIELDS}
`;

// ─── Mutations ───────────────────────────────────────────────────────────────

/**
 * Create an invoice.
 * pg_graphql uses insertInto<Collection>(objects: []).
 * line_items and payments are passed as JSON strings.
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
    $subtotal: BigFloat
    $taxAmount: BigFloat
    $discount: BigFloat
    $total: BigFloat!
    $amountPaid: BigFloat
    $amountDue: BigFloat
    $payments: String
    $terms: String
    $notes: String
    $issuedAt: TIMESTAMPTZ
    $dueAt: TIMESTAMPTZ
  ) {
    insertIntoinvoicesCollection(objects: [{
      org_id: $orgId
      location_id: $locationId
      invoice_number: $invoiceNumber
      customer_id: $customerId
      estimate_id: $estimateId
      vehicle_json: $vehicleId
      status: $status
      line_items_json: $lineItems
      subtotal: $subtotal
      tax: $taxAmount
      discount: $discount
      total: $total
      amount_paid: $amountPaid
      amount_due: $amountDue
      payments: $payments
      terms: $terms
      notes: $notes
      issued_at: $issuedAt
      due_at: $dueAt
    }]) {
      returning {
        ...InvoiceFields
      }
    }
  }
  ${INVOICE_FIELDS}
`;

/**
 * Update an invoice.
 * pg_graphql uses update<Collection>(filter: {...}, set: {...}).
 */
export const UPDATE_INVOICE = gql`
  mutation UpdateInvoice(
    $id: UUID!
    $status: String
    $lineItems: String
    $subtotal: BigFloat
    $taxAmount: BigFloat
    $discount: BigFloat
    $total: BigFloat
    $amountPaid: BigFloat
    $amountDue: BigFloat
    $payments: String
    $terms: String
    $notes: String
    $issuedAt: TIMESTAMPTZ
    $dueAt: TIMESTAMPTZ
    $paidAt: TIMESTAMPTZ
    $voidedAt: TIMESTAMPTZ
  ) {
    updateinvoicesCollection(
      filter: { id: { eq: $id } }
      set: {
        status: $status
        line_items_json: $lineItems
        subtotal: $subtotal
        tax: $taxAmount
        discount: $discount
        total: $total
        amount_paid: $amountPaid
        amount_due: $amountDue
        payments: $payments
        terms: $terms
        notes: $notes
        issued_at: $issuedAt
        due_at: $dueAt
        paid_at: $paidAt
        voided_at: $voidedAt
      }
    ) {
      returning {
        ...InvoiceFields
      }
    }
  }
  ${INVOICE_FIELDS}
`;

/**
 * Delete an invoice.
 */
export const DELETE_INVOICE = gql`
  mutation DeleteInvoice($id: UUID!) {
    deleteFrominvoicesCollection(filter: { id: { eq: $id } }) {
      returning {
        id
      }
    }
  }
`;

// ─── Apollo React Hooks ───────────────────────────────────────────────────────

/**
 * Normalize a DB invoice row (snake_case) → app shape (camelCase).
 */
export function normalizeInvoice(row = {}) {
  if (!row || !row.id) return null;
  return {
    id: row.id,
    orgId: row.org_id,
    locationId: row.location_id,
    invoiceNumber: row.invoice_number,
    estimateId: row.estimate_id,
    customerId: row.customer_id,
    vehicleId: row.vehicle_json,
    status: row.status,
    lineItems: row.line_items_json ? (typeof row.line_items_json === 'string' ? JSON.parse(row.line_items_json) : row.line_items_json) : [],
    subtotal: row.subtotal != null ? Number(row.subtotal) : 0,
    taxRate: 0.0875,          // Always derive from TAX_RATE constant; not stored
    taxAmount: row.tax != null ? Number(row.tax) : 0,
    discount: row.discount != null ? Number(row.discount) : 0,
    total: row.total != null ? Number(row.total) : 0,
    amountPaid: row.amount_paid != null ? Number(row.amount_paid) : 0,
    amountDue: row.amount_due != null ? Number(row.amount_due) : 0,
    payments: row.payments ? (typeof row.payments === 'string' ? JSON.parse(row.payments) : row.payments) : [],
    terms: row.terms,
    notes: row.notes,
    issuedAt: row.issued_at,
    dueAt: row.due_at,
    paidAt: row.paid_at,
    voidedAt: row.voided_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

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
  const invoices = edges.map(e => normalizeInvoice(e.node));
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

  const edge = data?.invoicesCollection?.edges?.[0];
  return { invoice: edge ? normalizeInvoice(edge.node) : null, loading, error };
}

/**
 * Create an invoice mutation hook.
 * Returns [createInvoice, { loading, error, data }]
 */
export function USE_CREATE_INVOICE() {
  return useMutation(CREATE_INVOICE, {
    update(cache, { data: { insertIntoinvoicesCollection } }) {
      const returning = insertIntoinvoicesCollection?.returning ?? [];
      if (!returning[0]) return;
      const newInvoice = normalizeInvoice(returning[0]);
      cache.modify({
        fields: {
          // eslint-disable-next-line no-unused-vars
          invoicesCollection(existing = { edges: [] }, { readField }) {
            return {
              ...existing,
              edges: [
                { __typename: 'invoicesEdge', node: newInvoice },
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
    update(cache, { data: { deleteFrominvoicesCollection } }) {
      const returning = deleteFrominvoicesCollection?.returning ?? [];
      if (!returning[0]?.id) return;
      cache.modify({
        fields: {
          // eslint-disable-next-line no-unused-vars
          invoicesCollection(existing = { edges: [] }, { readField }) {
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
