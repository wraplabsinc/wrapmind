import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useAuditLog } from '../../context/AuditLogContext';
import { useRoles } from '../../context/RolesContext';
import { useInvoices } from '../../context/InvoiceContext';
import { useNotifications } from '../../context/NotificationsContext';
import { celebrate } from '../../lib/celebrate';
import Button from '../ui/Button';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// ─── Constants ────────────────────────────────────────────────────────────────

const TAX_RATE = 0.0875;

const STATUS_CONFIG = {
  draft:   { label: 'Draft',   bg: 'bg-gray-100 dark:bg-gray-800',    text: 'text-gray-600 dark:text-gray-400' },
  sent:    { label: 'Sent',    bg: 'bg-blue-100 dark:bg-blue-900/30',  text: 'text-blue-700 dark:text-blue-400' },
  viewed:  { label: 'Viewed',  bg: 'bg-cyan-100 dark:bg-cyan-900/30',  text: 'text-cyan-700 dark:text-cyan-400' },
  partial: { label: 'Partial', bg: 'bg-amber-100 dark:bg-amber-900/30',text: 'text-amber-700 dark:text-amber-400' },
  paid:    { label: 'Paid',    bg: 'bg-green-100 dark:bg-green-900/30',text: 'text-green-700 dark:text-green-400' },
  overdue: { label: 'Overdue', bg: 'bg-red-100 dark:bg-red-900/30',   text: 'text-red-700 dark:text-red-400' },
  void:    { label: 'Void',    bg: 'bg-gray-100 dark:bg-gray-800',    text: 'text-gray-400 dark:text-gray-500' },
};

const PAYMENT_METHODS = ['Card', 'Cash', 'Check', 'Zelle', 'ACH'];
const TERMS_OPTIONS = ['Net 7', 'Net 15', 'Net 30', 'Net 60', 'Due on Receipt', 'Custom'];

// ─── Utilities ────────────────────────────────────────────────────────────────

function fmt(n) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n ?? 0);
}

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function isOverdue(inv) {
  if (inv.status === 'paid' || inv.status === 'void') return false;
  return new Date(inv.dueAt) < new Date();
}

function isDueSoon(inv) {
  if (inv.status === 'paid' || inv.status === 'void') return false;
  const diff = new Date(inv.dueAt) - new Date();
  return diff > 0 && diff < 7 * 24 * 60 * 60 * 1000;
}

function calcLineItems(lineItems) {
  const subtotal = lineItems.reduce((s, li) => s + (Number(li.total) || 0), 0);
  const taxAmount = parseFloat((subtotal * TAX_RATE).toFixed(2));
  const total = parseFloat((subtotal + taxAmount).toFixed(2));
  return { subtotal, taxAmount, total };
}

function generateInvoicePDF(invoice) {
  const doc = new jsPDF({ unit: 'pt', format: 'letter' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;
  let y = margin;

  const primary = [46, 139, 240];
  const dark = [15, 25, 35];
  const gray = [100, 121, 139];
  const green = [16, 185, 129];
  const red = [239, 68, 68];

  // White background
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  // Shop header
  doc.setFontSize(24);
  doc.setTextColor(...primary);
  doc.setFont('helvetica', 'bold');
  doc.text('WrapMind', margin, y);

  doc.setFontSize(9);
  doc.setTextColor(...gray);
  doc.setFont('helvetica', 'normal');
  doc.text('1234 Vinyl Ave, Los Angeles CA 90001', margin, y + 14);
  doc.text('(310) 555-0100', margin, y + 26);

  // Invoice title & meta (right aligned)
  doc.setFontSize(18);
  doc.setTextColor(...dark);
  doc.setFont('helvetica', 'bold');
  doc.text('INVOICE', pageWidth - margin, y, { align: 'right' });
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...gray);
  doc.text(invoice.invoiceNumber, pageWidth - margin, y + 16, { align: 'right' });
  doc.text(`Issued: ${fmtDate(invoice.issuedAt)}`, pageWidth - margin, y + 30, { align: 'right' });
  doc.text(`Due: ${fmtDate(invoice.dueAt)}`, pageWidth - margin, y + 44, { align: 'right' });

  y += 70;

  // Bill To
  doc.setFontSize(10);
  doc.setTextColor(...gray);
  doc.setFont('helvetica', 'bold');
  doc.text('BILL TO', margin, y);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...dark);
  doc.text(invoice.customerName, margin, y + 14);
  doc.setFontSize(9);
  doc.setTextColor(...gray);
  if (invoice.customerEmail) doc.text(invoice.customerEmail, margin, y + 26);
  if (invoice.customerPhone) doc.text(invoice.customerPhone, margin, y + 38);
  if (invoice.vehicleLabel) doc.text(invoice.vehicleLabel, margin, y + 50);

  y += 80;

  // Line items table
  const tableBody = invoice.lineItems.map(li => [
    li.description,
    String(li.qty),
    fmt(li.total),
  ]);

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [['Description', 'Qty', 'Total']],
    body: tableBody,
    theme: 'grid',
    headStyles: { fillColor: primary, textColor: 255, fontStyle: 'bold' },
    bodyStyles: { textColor: dark },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { cellWidth: 60, halign: 'center' },
      2: { cellWidth: 80, halign: 'right' },
    },
    styles: { fontSize: 9, cellPadding: 6 },
  });

  let finalY = doc.lastAutoTable.finalY + 20;

  // Pricing breakdown
  const totalsX = pageWidth - margin - 160;
  const valueX = pageWidth - margin;

  doc.setFontSize(9);
  doc.setTextColor(...gray);
  doc.setFont('helvetica', 'normal');
  doc.text('Subtotal', totalsX, finalY);
  doc.setTextColor(...dark);
  doc.text(fmt(invoice.subtotal), valueX, finalY, { align: 'right' });
  finalY += 14;

  if (invoice.discount > 0) {
    doc.setTextColor(...gray);
    doc.text('Discount', totalsX, finalY);
    doc.setTextColor(...dark);
    doc.text(`-${fmt(invoice.discount)}`, valueX, finalY, { align: 'right' });
    finalY += 14;
  }

  doc.setTextColor(...gray);
  doc.text(`Tax (${(TAX_RATE * 100).toFixed(2)}%)`, totalsX, finalY);
  doc.setTextColor(...dark);
  doc.text(fmt(invoice.taxAmount), valueX, finalY, { align: 'right' });
  finalY += 14;

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...dark);
  doc.text('Total', totalsX, finalY);
  doc.text(fmt(invoice.total), valueX, finalY, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  finalY += 14;

  doc.setTextColor(...gray);
  doc.text('Amount Paid', totalsX, finalY);
  doc.setTextColor(...green);
  doc.text(fmt(invoice.amountPaid), valueX, finalY, { align: 'right' });
  doc.setTextColor(...dark);
  finalY += 14;

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...dark);
  doc.text('Balance Due', totalsX, finalY);
  doc.setTextColor(invoice.amountDue <= 0 ? green : red);
  doc.text(fmt(invoice.amountDue), valueX, finalY, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...dark);
  finalY += 24;

  // Notes / Terms
  if (invoice.terms || invoice.notes) {
    doc.setFontSize(9);
    doc.setTextColor(...gray);
    if (invoice.terms) {
      doc.setFont('helvetica', 'bold');
      doc.text('Terms:', margin, finalY);
      doc.setFont('helvetica', 'normal');
      doc.text(invoice.terms, margin + 35, finalY);
      finalY += 14;
    }
    if (invoice.notes) {
      const splitNotes = doc.splitTextToSize(invoice.notes, pageWidth - margin * 2);
      doc.text(splitNotes, margin, finalY);
      finalY += splitNotes.length * 12 + 6;
    }
    finalY += 10;
  }

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(...gray);
  doc.text('Thank you for your business!', margin, pageHeight - margin);
  doc.text('Page 1 of 1', pageWidth - margin, pageHeight - margin, { align: 'right' });

  doc.save(`${invoice.invoiceNumber}.pdf`);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status, void: isVoid }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.draft;
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text} ${status === 'void' ? 'line-through opacity-70' : ''}`}
    >
      {cfg.label}
    </span>
  );
}

function StatTile({ label, value, sub, accent }) {
  return (
    <div className="bg-white dark:bg-[#1B2A3E] border border-gray-200 dark:border-[#243348] rounded-xl p-4 flex flex-col gap-1">
      <span className="text-[10px] font-semibold text-[#64748B] dark:text-[#7D93AE] uppercase tracking-wider">{label}</span>
      <span
        className="text-xl font-bold font-mono text-[#0F1923] dark:text-[#F8FAFE] leading-none"
        style={accent ? { color: accent } : {}}
      >
        {value}
      </span>
      {sub && <span className="text-xs text-[#64748B] dark:text-[#7D93AE]">{sub}</span>}
    </div>
  );
}

// ─── Dropdown Menu ────────────────────────────────────────────────────────────

function ActionsMenu({ invoice, onView, onRecordPayment, onSend, onVoid, onDuplicate, onDelete }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  function act(fn) {
    setOpen(false);
    fn();
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        className="p-1.5 rounded-lg text-[#64748B] dark:text-[#7D93AE] hover:bg-gray-100 dark:hover:bg-[#243348] transition-colors"
        title="Actions"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <circle cx="10" cy="4" r="1.5" />
          <circle cx="10" cy="10" r="1.5" />
          <circle cx="10" cy="16" r="1.5" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-1 w-44 bg-white dark:bg-[#1B2A3E] border border-gray-200 dark:border-[#243348] rounded-xl shadow-xl overflow-hidden">
          <MenuItem label="View Details" onClick={() => act(onView)} />
          {invoice.status !== 'void' && invoice.status !== 'paid' && (
            <MenuItem label="Record Payment" onClick={() => act(onRecordPayment)} />
          )}
          {(invoice.status === 'draft' || invoice.status === 'sent') && (
            <MenuItem label="Mark as Sent" onClick={() => act(onSend)} />
          )}
          {invoice.status !== 'void' && (
            <MenuItem label="Mark Void" onClick={() => act(onVoid)} danger />
          )}
          <MenuItem label="Duplicate" onClick={() => act(onDuplicate)} />
          <MenuItem label="Delete" onClick={() => act(onDelete)} danger />
        </div>
      )}
    </div>
  );
}

function MenuItem({ label, onClick, danger }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-2 text-sm transition-colors ${
        danger
          ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
          : 'text-[#0F1923] dark:text-[#F8FAFE] hover:bg-gray-50 dark:hover:bg-[#243348]'
      }`}
    >
      {label}
    </button>
  );
}

// ─── Invoice Detail Panel ─────────────────────────────────────────────────────

function InvoiceDetailPanel({ invoice, onClose, onRecordPayment, activityLog }) {
  const [tab, setTab] = useState('invoice');
  const [showPayForm, setShowPayForm] = useState(false);
  const [payForm, setPayForm] = useState({ amount: '', method: 'Card', note: '', date: new Date().toISOString().slice(0, 10) });

  useEffect(() => {
    if (invoice) {
      setPayForm({ amount: String(invoice.amountDue), method: 'Card', note: '', date: new Date().toISOString().slice(0, 10) });
      setShowPayForm(false);
      setTab('invoice');
    }
  }, [invoice?.id]);

  if (!invoice) return null;

  function handlePaySubmit(e) {
    e.preventDefault();
    const amt = parseFloat(payForm.amount);
    if (!amt || amt <= 0) return;
    onRecordPayment(invoice.id, {
      method: payForm.method,
      amount: amt,
      note: payForm.note,
      date: payForm.date,
    });
    setShowPayForm(false);
  }

  const tabs = ['invoice', 'payments', 'activity'];

  return (
    <div className="fixed inset-0 z-40 flex">
      <div className="flex-1 bg-black/40" onClick={onClose} />
      <div className="w-[420px] h-full bg-white dark:bg-[#1B2A3E] border-l border-gray-200 dark:border-[#243348] flex flex-col shadow-2xl overflow-hidden transform transition-transform duration-200">
        {/* Panel header */}
        <div className="h-11 flex items-center px-4 border-b border-gray-200 dark:border-[#243348] flex-shrink-0">
          <span className="font-semibold text-[#0F1923] dark:text-[#F8FAFE] text-sm flex-1">{invoice.invoiceNumber}</span>
          <StatusBadge status={invoice.status} />
          <button
            onClick={() => generateInvoicePDF(invoice)}
            className="ml-3 text-[#64748B] dark:text-[#7D93AE] hover:text-[#0F1923] dark:hover:text-[#F8FAFE] flex items-center gap-1 text-xs font-medium"
            title="Download PDF"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            PDF
          </button>
          <button onClick={onClose} className="ml-3 text-[#64748B] dark:text-[#7D93AE] hover:text-[#0F1923] dark:hover:text-[#F8FAFE]">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-[#243348] flex-shrink-0">
          {tabs.map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2.5 text-xs font-semibold uppercase tracking-wide transition-colors ${
                tab === t
                  ? 'text-[#2E8BF0] border-b-2 border-[#2E8BF0]'
                  : 'text-[#64748B] dark:text-[#7D93AE] hover:text-[#0F1923] dark:hover:text-[#F8FAFE]'
              }`}
            >
              {t === 'invoice' ? 'Invoice' : t === 'payments' ? 'Payments' : 'Activity'}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* ── Invoice Tab ── */}
          {tab === 'invoice' && (
            <div className="p-5 space-y-5">
              {/* Logo / Header area */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="w-24 h-8 rounded-lg bg-[#2E8BF0] flex items-center justify-center mb-2">
                    <span className="text-white text-xs font-bold tracking-widest">WRAPMIND</span>
                  </div>
                  <p className="text-xs text-[#64748B] dark:text-[#7D93AE]">1234 Vinyl Ave, Los Angeles CA 90001</p>
                  <p className="text-xs text-[#64748B] dark:text-[#7D93AE]">(310) 555-0100 · billing@wrapmind.io</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-[#0F1923] dark:text-[#F8FAFE]">{invoice.invoiceNumber}</p>
                  {invoice.estimateNumber && (
                    <p className="text-xs text-[#64748B] dark:text-[#7D93AE]">Est: {invoice.estimateNumber}</p>
                  )}
                  <p className="text-xs text-[#64748B] dark:text-[#7D93AE] mt-1">Issued: {fmtDate(invoice.issuedAt)}</p>
                  <p className="text-xs text-[#64748B] dark:text-[#7D93AE]">Due: {fmtDate(invoice.dueAt)}</p>
                </div>
              </div>

              {/* Bill To */}
              <div className="bg-[#F8FAFE] dark:bg-[#0F1923] rounded-xl p-4">
                <p className="text-xs font-semibold text-[#64748B] dark:text-[#7D93AE] uppercase tracking-wide mb-1">Bill To</p>
                <p className="font-semibold text-[#0F1923] dark:text-[#F8FAFE] text-sm">{invoice.customerName}</p>
                <p className="text-xs text-[#64748B] dark:text-[#7D93AE]">{invoice.customerEmail}</p>
                <p className="text-xs text-[#64748B] dark:text-[#7D93AE]">{invoice.customerPhone}</p>
                <p className="text-xs text-[#64748B] dark:text-[#7D93AE] mt-1">{invoice.vehicleLabel}</p>
              </div>

              {/* Line Items */}
              <div>
                <p className="text-xs font-semibold text-[#64748B] dark:text-[#7D93AE] uppercase tracking-wide mb-2">Line Items</p>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-[#64748B] dark:text-[#7D93AE]">
                      <th className="text-left pb-1 text-[10px] font-semibold uppercase tracking-wider text-[#64748B] dark:text-[#7D93AE]">Description</th>
                      <th className="text-center pb-1 text-[10px] font-semibold uppercase tracking-wider text-[#64748B] dark:text-[#7D93AE] w-8">Qty</th>
                      <th className="text-right pb-1 text-[10px] font-semibold uppercase tracking-wider text-[#64748B] dark:text-[#7D93AE] w-20">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.lineItems.map(li => (
                      <tr key={li.id} className="border-t border-gray-100 dark:border-[#243348]">
                        <td className="py-1.5 text-[#0F1923] dark:text-[#F8FAFE] pr-2">{li.description}</td>
                        <td className="py-1.5 text-center text-[#64748B] dark:text-[#7D93AE]">{li.qty}</td>
                        <td className="py-1.5 text-right text-[#0F1923] dark:text-[#F8FAFE]">{fmt(li.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="border-t border-gray-200 dark:border-[#243348] pt-3 space-y-1">
                <Row label="Subtotal" value={fmt(invoice.subtotal)} />
                {invoice.discount > 0 && <Row label="Discount" value={`−${fmt(invoice.discount)}`} />}
                <Row label={`Tax (${(TAX_RATE * 100).toFixed(2)}%)`} value={fmt(invoice.taxAmount)} />
                <div className="flex justify-between pt-1 border-t border-gray-200 dark:border-[#243348]">
                  <span className="font-bold text-sm text-[#0F1923] dark:text-[#F8FAFE]">Total</span>
                  <span className="font-bold text-sm text-[#0F1923] dark:text-[#F8FAFE]">{fmt(invoice.total)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-[#64748B] dark:text-[#7D93AE]">Amount Paid</span>
                  <span className="text-xs text-green-600 dark:text-green-400 font-medium">{fmt(invoice.amountPaid)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-bold text-[#0F1923] dark:text-[#F8FAFE]">Balance Due</span>
                  <span className={`text-sm font-bold ${invoice.amountDue <= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {fmt(invoice.amountDue)}
                  </span>
                </div>
              </div>

              {/* Notes / Terms */}
              {(invoice.notes || invoice.terms) && (
                <div className="text-xs text-[#64748B] dark:text-[#7D93AE] space-y-1">
                  {invoice.terms && <p><span className="font-semibold">Terms:</span> {invoice.terms}</p>}
                  {invoice.notes && <p>{invoice.notes}</p>}
                </div>
              )}

              {/* Payment history summary */}
              {invoice.payments.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-[#64748B] dark:text-[#7D93AE] uppercase tracking-wide mb-2">Payment History</p>
                  {invoice.payments.map(pay => (
                    <PaymentCard key={pay.id} pay={pay} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Payments Tab ── */}
          {tab === 'payments' && (
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-[#0F1923] dark:text-[#F8FAFE]">Balance Due</p>
                  <p className={`text-2xl font-bold ${invoice.amountDue <= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {fmt(invoice.amountDue)}
                  </p>
                </div>
                {invoice.status !== 'void' && invoice.status !== 'paid' && (
                  <Button variant="primary" size="sm" onClick={() => setShowPayForm(v => !v)}>
                    + Record Payment
                  </Button>
                )}
              </div>

              {/* Inline payment form */}
              {showPayForm && (
                <form onSubmit={handlePaySubmit} className="bg-[#F8FAFE] dark:bg-[#0F1923] rounded-xl p-4 space-y-3 border border-gray-200 dark:border-[#243348]">
                  <p className="text-xs font-semibold text-[#0F1923] dark:text-[#F8FAFE] uppercase tracking-wide">New Payment</p>
                  <div className="space-y-2">
                    <label className="block">
                      <span className="text-xs text-[#64748B] dark:text-[#7D93AE]">Amount</span>
                      <input
                        type="number"
                        step="0.01"
                        value={payForm.amount}
                        onChange={e => setPayForm(p => ({ ...p, amount: e.target.value }))}
                        className="mt-0.5 w-full px-3 py-1.5 text-sm bg-white dark:bg-[#1B2A3E] border border-gray-200 dark:border-[#243348] rounded-lg text-[#0F1923] dark:text-[#F8FAFE] focus:outline-none focus:ring-2 focus:ring-[#2E8BF0]"
                        required
                      />
                    </label>
                    <label className="block">
                      <span className="text-xs text-[#64748B] dark:text-[#7D93AE]">Payment Method</span>
                      <select
                        value={payForm.method}
                        onChange={e => setPayForm(p => ({ ...p, method: e.target.value }))}
                        className="mt-0.5 w-full px-3 py-1.5 text-sm bg-white dark:bg-[#1B2A3E] border border-gray-200 dark:border-[#243348] rounded-lg text-[#0F1923] dark:text-[#F8FAFE] focus:outline-none focus:ring-2 focus:ring-[#2E8BF0]"
                      >
                        {PAYMENT_METHODS.map(m => <option key={m}>{m}</option>)}
                      </select>
                    </label>
                    <label className="block">
                      <span className="text-xs text-[#64748B] dark:text-[#7D93AE]">Reference / Note</span>
                      <input
                        type="text"
                        value={payForm.note}
                        onChange={e => setPayForm(p => ({ ...p, note: e.target.value }))}
                        placeholder="e.g. Deposit, Balance"
                        className="mt-0.5 w-full px-3 py-1.5 text-sm bg-white dark:bg-[#1B2A3E] border border-gray-200 dark:border-[#243348] rounded-lg text-[#0F1923] dark:text-[#F8FAFE] focus:outline-none focus:ring-2 focus:ring-[#2E8BF0]"
                      />
                    </label>
                    <label className="block">
                      <span className="text-xs text-[#64748B] dark:text-[#7D93AE]">Date</span>
                      <input
                        type="date"
                        value={payForm.date}
                        onChange={e => setPayForm(p => ({ ...p, date: e.target.value }))}
                        className="mt-0.5 w-full px-3 py-1.5 text-sm bg-white dark:bg-[#1B2A3E] border border-gray-200 dark:border-[#243348] rounded-lg text-[#0F1923] dark:text-[#F8FAFE] focus:outline-none focus:ring-2 focus:ring-[#2E8BF0]"
                      />
                    </label>
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" variant="primary" className="flex-1">
                      Save Payment
                    </Button>
                    <button type="button" onClick={() => setShowPayForm(false)} className="flex-1 py-1.5 border border-gray-200 dark:border-[#243348] text-sm text-[#64748B] dark:text-[#7D93AE] rounded-lg hover:bg-gray-50 dark:hover:bg-[#243348] transition-colors">
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {invoice.payments.length === 0 ? (
                <p className="text-sm text-[#64748B] dark:text-[#7D93AE] text-center py-8">No payments recorded yet.</p>
              ) : (
                invoice.payments.map(pay => <PaymentCard key={pay.id} pay={pay} />)
              )}
            </div>
          )}

          {/* ── Activity Tab ── */}
          {tab === 'activity' && (
            <div className="p-5 space-y-2">
              {activityLog.length === 0 ? (
                <p className="text-sm text-[#64748B] dark:text-[#7D93AE] text-center py-8">No activity recorded.</p>
              ) : (
                activityLog.map((entry, i) => (
                  <div key={entry.id ?? i} className="flex gap-3 items-start">
                    <div className="w-2 h-2 mt-1.5 rounded-full bg-[#2E8BF0] flex-shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-[#0F1923] dark:text-[#F8FAFE]">{entry.action?.replace(/_/g, ' ')}</p>
                      <p className="text-xs text-[#64748B] dark:text-[#7D93AE]">{entry.details?.amount ? `${fmt(entry.details.amount)} via ${entry.details.method}` : ''}</p>
                      <p className="text-xs text-[#64748B] dark:text-[#7D93AE]">{fmtDate(entry.timestamp)} · {entry.actor?.label ?? entry.actor}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between">
      <span className="text-xs text-[#64748B] dark:text-[#7D93AE]">{label}</span>
      <span className="text-xs text-[#0F1923] dark:text-[#F8FAFE]">{value}</span>
    </div>
  );
}

function PaymentCard({ pay }) {
  return (
    <div className="flex items-center justify-between py-2 border-t border-gray-100 dark:border-[#243348]">
      <div>
        <p className="text-sm font-semibold text-[#0F1923] dark:text-[#F8FAFE]">{fmt(pay.amount)}</p>
        <p className="text-xs text-[#64748B] dark:text-[#7D93AE]">{pay.method}{pay.note ? ` · ${pay.note}` : ''}</p>
        <p className="text-xs text-[#64748B] dark:text-[#7D93AE]">{fmtDate(pay.recordedAt)} · {pay.recordedBy}</p>
      </div>
      <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full font-semibold">Paid</span>
    </div>
  );
}

// ─── Create Invoice Modal ─────────────────────────────────────────────────────

const EMPTY_LINE_ITEM = () => ({ id: `li-${Date.now()}-${Math.random().toString(36).slice(2,5)}`, description: '', qty: 1, unit: 'job', unitPrice: 0, total: 0 });

function CreateInvoiceModal({ onClose, onSave }) {
  const [form, setForm] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    vehicleLabel: '',
    estimateNumber: '',
    dueDate: '',
    terms: 'Net 15',
    notes: '',
    lineItems: [EMPTY_LINE_ITEM()],
  });

  function updateLine(id, field, value) {
    setForm(prev => ({
      ...prev,
      lineItems: prev.lineItems.map(li => {
        if (li.id !== id) return li;
        const updated = { ...li, [field]: value };
        if (field === 'qty' || field === 'unitPrice') {
          const qty = field === 'qty' ? Number(value) : Number(li.qty);
          const price = field === 'unitPrice' ? Number(value) : Number(li.unitPrice);
          updated.total = parseFloat((qty * price).toFixed(2));
        }
        return updated;
      }),
    }));
  }

  function addLine() {
    setForm(prev => ({ ...prev, lineItems: [...prev.lineItems, EMPTY_LINE_ITEM()] }));
  }

  function removeLine(id) {
    setForm(prev => ({ ...prev, lineItems: prev.lineItems.filter(li => li.id !== id) }));
  }

  const { subtotal, taxAmount, total } = useMemo(() => calcLineItems(form.lineItems), [form.lineItems]);

  function handleSubmit(e) {
    e.preventDefault();
    onSave({
      customerName: form.customerName,
      customerEmail: form.customerEmail,
      customerPhone: form.customerPhone,
      vehicleLabel: form.vehicleLabel,
      estimateNumber: form.estimateNumber,
      dueDate: form.dueDate,
      terms: form.terms,
      notes: form.notes,
      lineItems: form.lineItems,
      subtotal,
      taxAmount,
      total,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 overflow-y-auto py-8">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-2xl bg-white dark:bg-[#1B2A3E] border border-gray-200 dark:border-[#243348] rounded-2xl shadow-2xl mx-4"
      >
        {/* Header */}
        <div className="flex items-center px-6 py-4 border-b border-gray-200 dark:border-[#243348]">
          <h2 className="text-base font-bold text-[#0F1923] dark:text-[#F8FAFE] flex-1">New Invoice</h2>
          <button type="button" onClick={onClose} className="text-[#64748B] dark:text-[#7D93AE] hover:text-[#0F1923] dark:hover:text-[#F8FAFE]">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Customer info */}
          <div className="grid grid-cols-2 gap-4">
            <ModalField label="Customer Name *" value={form.customerName} onChange={v => setForm(p => ({ ...p, customerName: v }))} required />
            <ModalField label="Vehicle" value={form.vehicleLabel} onChange={v => setForm(p => ({ ...p, vehicleLabel: v }))} placeholder="e.g. 2024 Ford Mustang" />
            <ModalField label="Email" value={form.customerEmail} onChange={v => setForm(p => ({ ...p, customerEmail: v }))} type="email" />
            <ModalField label="Phone" value={form.customerPhone} onChange={v => setForm(p => ({ ...p, customerPhone: v }))} />
          </div>

          {/* Estimate / terms */}
          <div className="grid grid-cols-3 gap-4">
            <ModalField label="Linked Estimate #" value={form.estimateNumber} onChange={v => setForm(p => ({ ...p, estimateNumber: v }))} placeholder="WM-0001 (optional)" />
            <ModalField label="Due Date" value={form.dueDate} onChange={v => setForm(p => ({ ...p, dueDate: v }))} type="date" />
            <div>
              <label className="block text-xs text-[#64748B] dark:text-[#7D93AE] mb-1">Terms</label>
              <select
                value={form.terms}
                onChange={e => setForm(p => ({ ...p, terms: e.target.value }))}
                className="w-full px-3 py-1.5 text-sm bg-white dark:bg-[#0F1923] border border-gray-200 dark:border-[#243348] rounded-lg text-[#0F1923] dark:text-[#F8FAFE] focus:outline-none focus:ring-2 focus:ring-[#2E8BF0]"
              >
                {TERMS_OPTIONS.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>

          {/* Line Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-[#64748B] dark:text-[#7D93AE] uppercase tracking-wide">Line Items</p>
              <button type="button" onClick={addLine} className="text-xs text-[#2E8BF0] font-semibold hover:underline">+ Add Row</button>
            </div>
            <div className="space-y-2">
              <div className="grid grid-cols-12 gap-1 text-xs text-[#64748B] dark:text-[#7D93AE] px-1">
                <span className="col-span-5">Description</span>
                <span className="col-span-1 text-center">Qty</span>
                <span className="col-span-2">Unit</span>
                <span className="col-span-2">Unit Price</span>
                <span className="col-span-1 text-right">Total</span>
                <span className="col-span-1" />
              </div>
              {form.lineItems.map(li => (
                <div key={li.id} className="grid grid-cols-12 gap-1 items-center">
                  <input
                    className="col-span-5 px-2 py-1.5 text-xs bg-white dark:bg-[#0F1923] border border-gray-200 dark:border-[#243348] rounded-lg text-[#0F1923] dark:text-[#F8FAFE] focus:outline-none focus:ring-1 focus:ring-[#2E8BF0]"
                    value={li.description}
                    onChange={e => updateLine(li.id, 'description', e.target.value)}
                    placeholder="Description"
                  />
                  <input
                    type="number"
                    className="col-span-1 px-2 py-1.5 text-xs bg-white dark:bg-[#0F1923] border border-gray-200 dark:border-[#243348] rounded-lg text-[#0F1923] dark:text-[#F8FAFE] focus:outline-none focus:ring-1 focus:ring-[#2E8BF0] text-center"
                    value={li.qty}
                    min={0}
                    onChange={e => updateLine(li.id, 'qty', e.target.value)}
                  />
                  <input
                    className="col-span-2 px-2 py-1.5 text-xs bg-white dark:bg-[#0F1923] border border-gray-200 dark:border-[#243348] rounded-lg text-[#0F1923] dark:text-[#F8FAFE] focus:outline-none focus:ring-1 focus:ring-[#2E8BF0]"
                    value={li.unit}
                    onChange={e => updateLine(li.id, 'unit', e.target.value)}
                    placeholder="job"
                  />
                  <input
                    type="number"
                    step="0.01"
                    className="col-span-2 px-2 py-1.5 text-xs bg-white dark:bg-[#0F1923] border border-gray-200 dark:border-[#243348] rounded-lg text-[#0F1923] dark:text-[#F8FAFE] focus:outline-none focus:ring-1 focus:ring-[#2E8BF0]"
                    value={li.unitPrice}
                    min={0}
                    onChange={e => updateLine(li.id, 'unitPrice', e.target.value)}
                  />
                  <span className="col-span-1 text-xs text-right text-[#0F1923] dark:text-[#F8FAFE] font-medium">{fmt(li.total)}</span>
                  <button
                    type="button"
                    onClick={() => removeLine(li.id)}
                    className="col-span-1 flex justify-center text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>

            {/* Totals preview */}
            <div className="mt-3 flex justify-end">
              <div className="w-48 space-y-1 text-xs">
                <div className="flex justify-between text-[#64748B] dark:text-[#7D93AE]">
                  <span>Subtotal</span><span>{fmt(subtotal)}</span>
                </div>
                <div className="flex justify-between text-[#64748B] dark:text-[#7D93AE]">
                  <span>Tax (8.75%)</span><span>{fmt(taxAmount)}</span>
                </div>
                <div className="flex justify-between font-bold text-[#0F1923] dark:text-[#F8FAFE] pt-1 border-t border-gray-200 dark:border-[#243348]">
                  <span>Total</span><span>{fmt(total)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs text-[#64748B] dark:text-[#7D93AE] mb-1">Notes</label>
            <textarea
              rows={2}
              value={form.notes}
              onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-[#0F1923] border border-gray-200 dark:border-[#243348] rounded-lg text-[#0F1923] dark:text-[#F8FAFE] focus:outline-none focus:ring-2 focus:ring-[#2E8BF0] resize-none"
              placeholder="Payment terms, special instructions…"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-gray-200 dark:border-[#243348]">
          <Button type="submit" variant="primary" className="flex-1">
            Create Invoice
          </Button>
          <button type="button" onClick={onClose} className="flex-1 py-2 border border-gray-200 dark:border-[#243348] text-sm text-[#64748B] dark:text-[#7D93AE] rounded-xl hover:bg-gray-50 dark:hover:bg-[#243348] transition-colors">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

function ModalField({ label, value, onChange, type = 'text', placeholder, required }) {
  return (
    <div>
      <label className="block text-xs text-[#64748B] dark:text-[#7D93AE] mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full px-3 py-1.5 text-sm bg-white dark:bg-[#0F1923] border border-gray-200 dark:border-[#243348] rounded-lg text-[#0F1923] dark:text-[#F8FAFE] focus:outline-none focus:ring-2 focus:ring-[#2E8BF0]"
      />
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function InvoicesPage({ onNavigate, initialInvoiceId }) {
  const { addLog, logs } = useAuditLog();
  const { currentRole } = useRoles();
  const actor = currentRole;
  const {
    invoices,
    addInvoice,
    updateInvoice,
    deleteInvoice: ctxDeleteInvoice,
    recordPayment: ctxRecordPayment,
    getNextInvoiceNumber,
  } = useInvoices();
  const { addNotification } = useNotifications();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [panelMode, setPanelMode] = useState(null); // 'view' | 'pay'
  const [showCreate, setShowCreate] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null); // invoiceId

  // Update selected invoice reference when invoices change
  useEffect(() => {
    if (selectedInvoice) {
      const updated = invoices.find(i => i.id === selectedInvoice.id);
      if (updated) setSelectedInvoice(updated);
    }
  }, [invoices]);

  // Open a specific invoice by id (e.g. from a notification link)
  useEffect(() => {
    if (initialInvoiceId) {
      const inv = invoices.find(i => i.id === initialInvoiceId);
      if (inv) setSelectedInvoice(inv);
    }
  }, [initialInvoiceId, invoices]);

  // ── Mutations ──

  const recordPayment = useCallback((invoiceId, payData) => {
    const inv = invoices.find(i => i.id === invoiceId);
    ctxRecordPayment(invoiceId, {
      method: payData.method,
      amount: payData.amount,
      note: payData.note,
      recordedBy: actor,
      recordedAt: payData.date ? new Date(payData.date).toISOString() : new Date().toISOString(),
    });
    addLog('INVOICE', 'PAYMENT_RECORDED', {
      severity: 'info',
      actor: { role: actor, label: actor },
      target: inv?.invoiceNumber ?? invoiceId,
      details: { amount: payData.amount, method: payData.method },
    });
    addNotification({
      type: 'payment',
      title: 'Payment Recorded',
      body: `${inv?.invoiceNumber ?? invoiceId} — $${payData.amount.toLocaleString()} received via ${payData.method}`,
      link: 'invoices',
      icon: 'dollar',
    });
    // Celebrate — full fireworks if this payment clears the balance, medium otherwise
    const remainingDue = (inv?.amountDue ?? 0) - Number(payData.amount);
    celebrate(
      remainingDue <= 0 ? 'invoice_paid' : 'payment_received',
      { customer: inv?.customerName, amount: payData.amount },
    );
  }, [invoices, actor, addLog, ctxRecordPayment, addNotification]);

  const markVoid = useCallback((invoiceId) => {
    const inv = invoices.find(i => i.id === invoiceId);
    updateInvoice(invoiceId, { status: 'void', voidedAt: new Date().toISOString() });
    addLog('INVOICE', 'INVOICE_VOIDED', {
      severity: 'warning',
      actor: { role: actor, label: actor },
      target: inv?.invoiceNumber ?? invoiceId,
    });
    addNotification({
      type: 'invoice',
      title: 'Invoice Voided',
      body: `${inv?.invoiceNumber ?? invoiceId} for ${inv?.customerName ?? ''} has been voided`,
      link: 'invoices',
      icon: 'alert',
    });
    if (selectedInvoice?.id === invoiceId) setSelectedInvoice(null);
  }, [invoices, actor, addLog, updateInvoice, addNotification, selectedInvoice]);

  const markSent = useCallback((invoiceId) => {
    const inv = invoices.find(i => i.id === invoiceId);
    const issuedAt = inv?.status === 'draft' ? new Date().toISOString() : inv?.issuedAt;
    updateInvoice(invoiceId, { status: 'sent', issuedAt });
    addLog('INVOICE', 'INVOICE_SENT', {
      severity: 'info',
      actor: { role: actor, label: actor },
      target: inv?.invoiceNumber ?? invoiceId,
    });
  }, [invoices, actor, addLog, updateInvoice]);

  const duplicateInvoice = useCallback((invoiceId) => {
    const source = invoices.find(i => i.id === invoiceId);
    if (!source) return;
    const newInv = addInvoice({
      ...source,
      invoiceNumber: getNextInvoiceNumber(),
      status: 'draft',
      payments: [],
      amountPaid: 0,
      amountDue: source.total,
      paidAt: null,
      voidedAt: null,
      issuedAt: new Date().toISOString(),
      createdBy: actor,
    });
    addLog('INVOICE', 'INVOICE_CREATED', {
      severity: 'info',
      actor: { role: actor, label: actor },
      target: newInv.invoiceNumber,
    });
  }, [invoices, actor, addLog, addInvoice, getNextInvoiceNumber]);

  const deleteInvoice = useCallback((invoiceId) => {
    ctxDeleteInvoice(invoiceId);
    if (selectedInvoice?.id === invoiceId) setSelectedInvoice(null);
    setDeleteConfirm(null);
  }, [ctxDeleteInvoice, selectedInvoice]);

  const createInvoice = useCallback((formData) => {
    const newInv = addInvoice({
      invoiceNumber: getNextInvoiceNumber(),
      estimateId: '',
      estimateNumber: formData.estimateNumber || '',
      status: 'draft',
      customerId: `c-${Date.now()}`,
      customerName: formData.customerName,
      customerEmail: formData.customerEmail,
      customerPhone: formData.customerPhone,
      vehicleLabel: formData.vehicleLabel,
      lineItems: formData.lineItems,
      subtotal: formData.subtotal,
      taxRate: TAX_RATE,
      taxAmount: formData.taxAmount,
      discount: 0,
      total: formData.total,
      amountPaid: 0,
      amountDue: formData.total,
      payments: [],
      notes: formData.notes,
      terms: formData.terms,
      issuedAt: new Date().toISOString(),
      dueAt: formData.dueDate ? new Date(formData.dueDate).toISOString() : null,
      paidAt: null,
      voidedAt: null,
      createdBy: actor,
    });
    addLog('INVOICE', 'INVOICE_CREATED', {
      severity: 'info',
      actor: { role: actor, label: actor },
      target: newInv.invoiceNumber,
    });
    setShowCreate(false);
  }, [actor, addLog, addInvoice, getNextInvoiceNumber]);

  // ── Filtering ──

  const filtered = useMemo(() => {
    let list = [...invoices];

    // Status filter
    if (statusFilter !== 'all') {
      list = list.filter(inv => inv.status === statusFilter);
    }

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      list = list.filter(inv => {
        const d = new Date(inv.issuedAt);
        if (dateFilter === 'this-month') return d >= startOfMonth;
        if (dateFilter === 'last-month') return d >= startOfLastMonth && d <= endOfLastMonth;
        if (dateFilter === 'overdue') return isOverdue(inv);
        return true;
      });
    }

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(inv =>
        inv.invoiceNumber.toLowerCase().includes(q) ||
        inv.customerName.toLowerCase().includes(q) ||
        inv.vehicleLabel.toLowerCase().includes(q)
      );
    }

    return list;
  }, [invoices, statusFilter, dateFilter, search]);

  // ── Stats ──

  const stats = useMemo(() => {
    const nonVoid = invoices.filter(i => i.status !== 'void');
    const totalInvoiced = nonVoid.reduce((s, i) => s + i.total, 0);

    const outstandingStatuses = new Set(['sent', 'viewed', 'partial', 'overdue']);
    const outstanding = nonVoid
      .filter(i => outstandingStatuses.has(i.status))
      .reduce((s, i) => s + i.amountDue, 0);

    const overdueList = invoices.filter(i => i.status === 'overdue');
    const overdueSum = overdueList.reduce((s, i) => s + i.amountDue, 0);

    const now = new Date();
    const paidThisMonth = invoices
      .filter(i => i.paidAt && new Date(i.paidAt).getMonth() === now.getMonth() && new Date(i.paidAt).getFullYear() === now.getFullYear())
      .reduce((s, i) => s + i.total, 0);

    const avg = nonVoid.length > 0 ? totalInvoiced / nonVoid.length : 0;

    return { totalInvoiced, outstanding, overdueCount: overdueList.length, overdueSum, paidThisMonth, avg };
  }, [invoices]);

  // ── Activity log for selected invoice ──

  const invoiceActivity = useMemo(() => {
    if (!selectedInvoice) return [];
    return logs.filter(l => l.target === selectedInvoice.invoiceNumber && l.category === 'INVOICE');
  }, [logs, selectedInvoice]);

  // ── Render ──

  return (
    <div className="flex flex-col h-full bg-[#F8FAFE] dark:bg-[#0F1923]">
      {/* ── Header bar ── */}
      <div className="h-11 flex items-center gap-3 px-4 bg-white dark:bg-[#1B2A3E] border-b border-gray-200 dark:border-[#243348] sticky top-0 z-30 flex-shrink-0">
        {/* Title + count */}
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-bold text-sm text-[#0F1923] dark:text-[#F8FAFE] whitespace-nowrap">Invoices</span>
          <span className="text-xs bg-gray-100 dark:bg-[#243348] text-[#64748B] dark:text-[#7D93AE] px-2 py-0.5 rounded-full font-semibold">
            {invoices.length}
          </span>
        </div>

        {/* Search */}
        <div className="flex-1 max-w-xs relative">
          <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#64748B] dark:text-[#7D93AE]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search invoices…"
            className="w-full pl-8 pr-3 py-1 text-xs bg-[#F8FAFE] dark:bg-[#0F1923] border border-gray-200 dark:border-[#243348] rounded-lg text-[#0F1923] dark:text-[#F8FAFE] placeholder-[#64748B] dark:placeholder-[#7D93AE] focus:outline-none focus:ring-2 focus:ring-[#2E8BF0]"
          />
        </div>

        {/* Filters */}
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="py-1 px-2 text-xs bg-[#F8FAFE] dark:bg-[#0F1923] border border-gray-200 dark:border-[#243348] rounded-lg text-[#0F1923] dark:text-[#F8FAFE] focus:outline-none focus:ring-2 focus:ring-[#2E8BF0]"
        >
          <option value="all">All Statuses</option>
          {Object.entries(STATUS_CONFIG).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>

        <select
          value={dateFilter}
          onChange={e => setDateFilter(e.target.value)}
          className="py-1 px-2 text-xs bg-[#F8FAFE] dark:bg-[#0F1923] border border-gray-200 dark:border-[#243348] rounded-lg text-[#0F1923] dark:text-[#F8FAFE] focus:outline-none focus:ring-2 focus:ring-[#2E8BF0]"
        >
          <option value="all">All Dates</option>
          <option value="this-month">This Month</option>
          <option value="last-month">Last Month</option>
          <option value="overdue">Overdue</option>
        </select>

        {/* New Invoice */}
        <Button
          variant="primary"
          size="sm"
          className="ml-auto whitespace-nowrap flex-shrink-0"
          onClick={() => setShowCreate(true)}
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Invoice
        </Button>
      </div>

      {/* ── Stats strip ── */}
      <div className="flex-shrink-0 px-4 pt-4 pb-3 grid grid-cols-5 gap-3">
        <StatTile label="Total Invoiced" value={fmt(stats.totalInvoiced)} sub={`${invoices.filter(i => i.status !== 'void').length} invoices`} />
        <StatTile label="Outstanding" value={fmt(stats.outstanding)} sub="sent + partial + overdue" accent="#F59E0B" />
        <StatTile label="Overdue" value={fmt(stats.overdueSum)} sub={`${stats.overdueCount} invoice${stats.overdueCount !== 1 ? 's' : ''}`} accent="#EF4444" />
        <StatTile label="Paid This Month" value={fmt(stats.paidThisMonth)} sub={new Date().toLocaleString('default', { month: 'long' })} accent="#10B981" />
        <StatTile label="Avg Invoice Value" value={fmt(stats.avg)} sub="non-void invoices" />
      </div>

      {/* ── Table ── */}
      <div className="flex-1 px-4 pb-6 overflow-auto">
        <div className="bg-white dark:bg-[#1B2A3E] border border-gray-200 dark:border-[#243348] rounded-xl overflow-hidden">
          {filtered.length === 0 ? (
            <div className="py-16 text-center">
              {invoices.length === 0 && !search && statusFilter === 'all' && dateFilter === 'all' ? (
                <div className="flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-sm font-semibold text-[#0F1923] dark:text-[#F8FAFE]">No invoices yet</p>
                    <p className="text-xs text-[#64748B] dark:text-[#7D93AE] mt-1">Convert an approved estimate to generate your first invoice</p>
                  </div>
                </div>
              ) : (
                <span className="text-[#64748B] dark:text-[#7D93AE] text-sm">No invoices found.</span>
              )}
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-[#243348]">
                  {['Invoice #', 'Customer', 'Vehicle', 'Total', 'Paid', 'Due', 'Status', 'Due Date', ''].map(col => (
                    <th
                      key={col}
                      className="px-3 py-2 text-left text-[10px] font-semibold text-[#64748B] dark:text-[#7D93AE] uppercase tracking-wider whitespace-nowrap"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((inv, idx) => {
                  const overdue = isOverdue(inv);
                  const dueSoon = isDueSoon(inv);
                  return (
                    <tr
                      key={inv.id}
                      className={`border-t border-gray-100 dark:border-[#243348] hover:bg-[#F8FAFE] dark:hover:bg-[#0F1923] transition-colors cursor-pointer ${idx % 2 === 0 ? '' : ''}`}
                      onClick={() => { setSelectedInvoice(inv); setPanelMode('view'); }}
                    >
                      {/* Invoice # */}
                      <td className="px-4 py-3 font-semibold text-[#2E8BF0] whitespace-nowrap">{inv.invoiceNumber}</td>

                      {/* Customer */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <p className="font-medium text-[#0F1923] dark:text-[#F8FAFE]">{inv.customerName}</p>
                        <p className="text-xs text-[#64748B] dark:text-[#7D93AE]">{inv.customerEmail}</p>
                      </td>

                      {/* Vehicle */}
                      <td className="px-4 py-3 text-[#64748B] dark:text-[#7D93AE] text-xs whitespace-nowrap max-w-[160px] truncate">{inv.vehicleLabel}</td>

                      {/* Total */}
                      <td className="px-4 py-3 font-semibold text-[#0F1923] dark:text-[#F8FAFE] whitespace-nowrap">{fmt(inv.total)}</td>

                      {/* Paid */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`text-sm font-medium ${inv.amountPaid > 0 ? 'text-green-600 dark:text-green-400' : 'text-[#64748B] dark:text-[#7D93AE]'}`}>
                          {fmt(inv.amountPaid)}
                        </span>
                      </td>

                      {/* Due */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`text-sm font-semibold ${inv.amountDue <= 0 ? 'text-green-600 dark:text-green-400' : overdue ? 'text-red-600 dark:text-red-400' : 'text-[#0F1923] dark:text-[#F8FAFE]'}`}>
                          {fmt(inv.amountDue)}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3 whitespace-nowrap" onClick={e => e.stopPropagation()}>
                        <StatusBadge status={inv.status} />
                      </td>

                      {/* Due Date */}
                      <td className="px-4 py-3 whitespace-nowrap text-xs">
                        {inv.dueAt ? (
                          <span className={overdue ? 'text-red-600 dark:text-red-400 font-semibold' : dueSoon ? 'text-amber-600 dark:text-amber-400 font-semibold' : 'text-[#64748B] dark:text-[#7D93AE]'}>
                            {fmtDate(inv.dueAt)}
                            {overdue && ' ⚠'}
                          </span>
                        ) : '—'}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 whitespace-nowrap" onClick={e => e.stopPropagation()}>
                        {deleteConfirm === inv.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => deleteInvoice(inv.id)}
                              className="text-xs px-2 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(null)}
                              className="text-xs px-2 py-1 border border-gray-200 dark:border-[#243348] text-[#64748B] dark:text-[#7D93AE] rounded-lg hover:bg-gray-50 dark:hover:bg-[#243348] transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <ActionsMenu
                            invoice={inv}
                            onView={() => { setSelectedInvoice(inv); setPanelMode('view'); }}
                            onRecordPayment={() => { setSelectedInvoice(inv); setPanelMode('pay'); }}
                            onSend={() => markSent(inv.id)}
                            onVoid={() => markVoid(inv.id)}
                            onDuplicate={() => duplicateInvoice(inv.id)}
                            onDelete={() => setDeleteConfirm(inv.id)}
                          />
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ── Detail Panel ── */}
      {selectedInvoice && (
        <InvoiceDetailPanel
          invoice={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          onRecordPayment={recordPayment}
          activityLog={invoiceActivity}
        />
      )}

      {/* ── Create Invoice Modal ── */}
      {showCreate && (
        <CreateInvoiceModal
          onClose={() => setShowCreate(false)}
          onSave={createInvoice}
        />
      )}
    </div>
  );
}
