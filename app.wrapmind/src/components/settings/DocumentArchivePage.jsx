// src/components/settings/DocumentArchivePage.jsx
import { useState, useEffect, useCallback } from 'react';
import { PageHeader } from '../ui/Card';
import { supabaseUrl } from '../../lib/supabase';
import { supabase } from '../../lib/supabase';

const PAGE_SIZE = 20;

const STATUS_LABELS = {
  pending:    { label: 'Pending',    cls: 'text-[#F59E0B]' },
  generated:  { label: 'Generated only', cls: 'text-[#64748B]' },
  stored:     { label: 'Stored',     cls: 'text-[#10B981]' },
};

function getStatus(record) {
  if (record.deleted_at) return { label: 'Deleted', cls: 'text-[#EF4444]' };
  if (record.storage_path == null) return STATUS_LABELS.pending;
  return STATUS_LABELS.generated;
}

function fmtDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

async function fetchArchives({ offset = 0, docType = 'all' } = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) throw new Error('Not authenticated');

  const params = new URLSearchParams({ offset: String(offset), limit: String(PAGE_SIZE) });
  if (docType !== 'all') params.set('doc_type', docType);

  const res = await fetch(`${supabaseUrl}/functions/v1/list-archives?${params}`, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error(`Failed to fetch archives: ${res.status}`);
  return res.json();
}

async function fetchSignedUrl(storagePath) {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) throw new Error('Not authenticated');

  const res = await fetch(`${supabaseUrl}/functions/v1/get-archive`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ storage_path: storagePath }),
  });
  if (!res.ok) throw new Error(`Failed to get signed URL: ${res.status}`);
  const data = await res.json();
  return data.url ?? data.signed_url ?? null;
}

async function sendArchiveEmail({ record, pdfUrl }) {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) throw new Error('Not authenticated');

  const res = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      doc_number: record.doc_number,
      doc_type: record.doc_type,
      pdf_url: pdfUrl,
    }),
  });
  if (!res.ok) throw new Error(`Failed to send email: ${res.status}`);
  return res.json();
}

async function softDeleteArchive(recordId) {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) throw new Error('Not authenticated');

  const res = await fetch(`${supabaseUrl}/functions/v1/update-pdf-archive`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: recordId, deleted_at: new Date().toISOString() }),
  });
  if (!res.ok) throw new Error(`Failed to delete: ${res.status}`);
  return res.json();
}

export default function DocumentArchivePage() {
  const [archives, setArchives] = useState([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [docType, setDocType] = useState('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    setActionError('');
    try {
      const data = await fetchArchives({ offset, docType });
      const items = data.archives ?? data.results ?? data.data ?? [];
      setArchives(items);
      setTotal(typeof data.total === 'number' ? data.total : items.length);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [offset, docType]);

  useEffect(() => { load(); }, [load]);

  const handleDownload = async (record) => {
    if (!record.storage_path) {
      setActionError('No file available to download.');
      return;
    }
    try {
      const url = await fetchSignedUrl(record.storage_path);
      if (!url) { setActionError('Could not generate download link.'); return; }
      window.open(url, '_blank', 'noopener');
    } catch (err) {
      setActionError(err.message);
    }
  };

  const handleResend = async (record) => {
    if (!record.storage_path) {
      setActionError('No file available to resend.');
      return;
    }
    try {
      const url = await fetchSignedUrl(record.storage_path);
      if (!url) { setActionError('Could not generate email link.'); return; }
      await sendArchiveEmail({ record, pdfUrl: url });
      setActionError('');
      alert(`Email re-sent for ${record.doc_type} #${record.doc_number}`);
    } catch (err) {
      setActionError(err.message);
    }
  };

  const handleDelete = async (record) => {
    if (!window.confirm(`Soft-delete archive ${record.doc_number}? This cannot be undone.`)) return;
    try {
      await softDeleteArchive(record.id ?? record.doc_number);
      await load();
    } catch (err) {
      setActionError(err.message);
    }
  };

  const hasNext = offset + PAGE_SIZE < total;
  const hasPrev = offset > 0;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <PageHeader title="Documents" subtitle={`${total} archive${total !== 1 ? 's' : ''}`}>
        <div className="flex items-center gap-2">
          {/* Type filter */}
          <select
            value={docType}
            onChange={e => { setDocType(e.target.value); setOffset(0); }}
            className="bg-[#1B2A3E] border border-[#243348] rounded px-2.5 py-1.5 text-[11px] text-[#F8FAFE] focus:outline-none focus:border-[#2E8BF0]"
          >
            <option value="all">All Types</option>
            <option value="estimate">Estimates</option>
            <option value="invoice">Invoices</option>
          </select>
        </div>
      </PageHeader>

      <div className="flex-1 overflow-y-auto">
        {error && (
          <div className="mx-6 mt-4 px-4 py-3 bg-[#EF4444]/10 border border-[#EF4444]/30 rounded text-[11px] text-[#EF4444]">
            {error}
          </div>
        )}
        {actionError && (
          <div className="mx-6 mt-4 px-4 py-3 bg-[#EF4444]/10 border border-[#EF4444]/30 rounded text-[11px] text-[#EF4444]">
            {actionError}
          </div>
        )}

        {loading && archives.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-[11px] text-[#4A6080]">Loading…</div>
        ) : archives.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-2">
            <svg className="w-10 h-10 text-[#243348]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414A1 1 0 0119 9.414V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-[11px] text-[#4A6080]">No archived documents found.</p>
          </div>
        ) : (
          <table className="w-full text-[11px]">
            <thead>
              <tr className="bg-[#0F1923] sticky top-0 z-10 border-b border-[#243348]">
                {['Document #', 'Type', 'Customer', 'Generated', 'Emailed To', 'Status'].map(h => (
                  <th key={h} className="px-4 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-[#4A6080]">
                    {h}
                  </th>
                ))}
                <th className="px-4 py-2 text-right text-[10px] font-semibold uppercase tracking-wider text-[#4A6080]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {archives.map((rec, i) => {
                const status = getStatus(rec);
                return (
                  <tr key={rec.id ?? i} className="border-b border-[#243348] hover:bg-[#1B2A3E]/50 transition-colors">
                    <td className="px-4 py-2.5 text-[#F8FAFE] font-medium">{rec.doc_number ?? '—'}</td>
                    <td className="px-4 py-2.5 text-[#F8FAFE] capitalize">{rec.doc_type ?? '—'}</td>
                    <td className="px-4 py-2.5 text-[#4A6080]">{rec.customer_name ?? rec.customer ?? '—'}</td>
                    <td className="px-4 py-2.5 text-[#4A6080]">{fmtDate(rec.generated_at)}</td>
                    <td className="px-4 py-2.5 text-[#4A6080]">{rec.emailed_to ?? rec.email ?? '—'}</td>
                    <td className={`px-4 py-2.5 font-medium ${status.cls}`}>{status.label}</td>
                    <td className="px-4 py-2.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleDownload(rec)}
                          disabled={!rec.storage_path}
                          className="text-[10px] text-[#4A6080] hover:text-[#2E8BF0] font-medium px-2 h-6 rounded transition-colors disabled:opacity-30 disabled:cursor-default"
                        >
                          Download
                        </button>
                        <button
                          onClick={() => handleResend(rec)}
                          disabled={!rec.storage_path}
                          className="text-[10px] text-[#4A6080] hover:text-[#2E8BF0] font-medium px-2 h-6 rounded transition-colors disabled:opacity-30 disabled:cursor-default"
                        >
                          Resend
                        </button>
                        <button
                          onClick={() => handleDelete(rec)}
                          className="text-[10px] text-[#4A6080] hover:text-[#EF4444] font-medium px-2 h-6 rounded transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      <div className="flex-shrink-0 flex items-center justify-between px-6 py-3 border-t border-[#243348]">
        <p className="text-[10px] text-[#4A6080]">
          {offset + 1}–{Math.min(offset + PAGE_SIZE, total)} of {total}
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => setOffset(o => Math.max(0, o - PAGE_SIZE))}
            disabled={!hasPrev}
            className="flex items-center justify-center bg-[#243348] hover:bg-[#364860] disabled:opacity-30 text-[#F8FAFE] text-[11px] font-medium rounded px-3 h-7 transition-colors"
          >
            Previous
          </button>
          <button
            onClick={() => setOffset(o => o + PAGE_SIZE)}
            disabled={!hasNext}
            className="flex items-center justify-center bg-[#2E8BF0] hover:bg-[#2577D0] disabled:opacity-30 text-white text-[11px] font-semibold rounded px-3 h-7 transition-colors"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
