// =============================================================================
// EstimateArchiveDrawer — Archive history drawer for InvoiceDetailPanel
// PRD: docs/PRD-pdf-archive.md §11
// Decision: Drawer (not separate page)
// =============================================================================

import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function EstimateArchiveDrawer({ estimateId, estimateDocNumber, onClose }) {
  const { session } = useAuth();
  const [archives, setArchives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [resending, setResending] = useState(null); // id of entry being resent

  useEffect(() => {
    if (!estimateId || !session?.access_token) return;
    let cancelled = false;
    setLoading(true);
    setError('');

    fetch(`${SUPABASE_URL}/functions/v1/get-archive`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'apikey': session.access_token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ docType: 'estimate', docId: estimateId }),
    })
      .then(r => r.json())
      .then(data => {
        if (cancelled) return;
        if (data.error) { setError(data.error); setArchives([]); }
        else { setArchives(data.archives ?? []); }
      })
      .catch(err => {
        if (cancelled) return;
        setError(err.message || 'Failed to load archive');
        setArchives([]);
      })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [estimateId, session?.access_token]);

  async function handleResend(archive) {
    if (!archive.storageUrl) return;
    setResending(archive.id);
    try {
      await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': session.access_token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: archive.emailedTo || '',
          subject: `Invoice ${estimateDocNumber}`,
          body: `Please find your invoice at the following link:\n\n${archive.storageUrl}\n\nDocument: ${estimateDocNumber}`,
          documentType: 'invoice',
          documentId: estimateId,
        }),
      });
    } catch (err) {
      console.error('[EstimateArchiveDrawer] resend failed:', err);
    } finally {
      setResending(null);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="flex-1 bg-black/40" onClick={onClose} />

      {/* Drawer */}
      <div className="w-[380px] h-full bg-white dark:bg-[#1B2A3E] border-l border-gray-200 dark:border-[#243348] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="h-11 flex items-center px-4 border-b border-gray-200 dark:border-[#243348] flex-shrink-0">
          <span className="font-semibold text-[#0F1923] dark:text-[#F8FAFE] text-sm flex-1">
            Archive History
          </span>
          <span className="text-xs text-[#64748B] dark:text-[#7D93AE] mr-2">
            {archives.length} record{archives.length !== 1 ? 's' : ''}
          </span>
          <button
            onClick={onClose}
            className="text-[#64748B] dark:text-[#7D93AE] hover:text-[#0F1923] dark:hover:text-[#F8FAFE]"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {loading && (
            <div className="flex items-center justify-center h-32">
              <div className="w-5 h-5 border-2 border-[#2E8BF0] border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {!loading && error && (
            <div className="p-4 text-xs text-red-500">{error}</div>
          )}

          {!loading && !error && archives.length === 0 && (
            <div className="flex flex-col items-center justify-center h-40 text-center px-6">
              <svg className="w-10 h-10 text-gray-200 dark:text-[#364860] mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
              <p className="text-sm font-medium text-[#64748B] dark:text-[#7D93AE]">No archive records yet</p>
              <p className="text-xs text-[#64748B] dark:text-[#7D93AE] mt-1">
                PDFs generated for this estimate will appear here
              </p>
            </div>
          )}

          {!loading && !error && archives.length > 0 && (
            <div className="divide-y divide-gray-100 dark:divide-[#243348]">
              {archives.map((arch) => (
                <div key={arch.id} className="p-4 hover:bg-[#F8FAFE] dark:hover:bg-[#0F1923] transition-colors">
                  {/* Meta row */}
                  <div className="flex items-start justify-between mb-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className={`inline-block w-1.5 h-1.5 rounded-full ${arch.storagePath ? 'bg-green-500' : 'bg-amber-500'}`} />
                        <span className="text-xs font-semibold text-[#0F1923] dark:text-[#F8FAFE]">
                          {arch.storagePath ? 'Stored' : 'Generated only'}
                        </span>
                      </div>
                      <p className="text-[10px] text-[#64748B] dark:text-[#7D93AE] mt-0.5 font-mono truncate max-w-[200px]">
                        {arch.contentHash?.slice(0, 12)}...
                      </p>
                    </div>
                    <span className="text-[10px] text-[#64748B] dark:text-[#7D93AE] flex-shrink-0 ml-2">
                      {fmtDate(arch.generatedAt)}
                    </span>
                  </div>

                  {/* Emailed to */}
                  {arch.emailedTo && (
                    <p className="text-xs text-[#64748B] dark:text-[#7D93AE] mb-2">
                      Emailed to: <span className="font-medium">{arch.emailedTo}</span>
                      {arch.emailedAt && <span className="ml-1">({fmtDate(arch.emailedAt)})</span>}
                    </p>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 mt-2">
                    {arch.storageUrl ? (
                      <a
                        href={arch.storageUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 px-2.5 h-6 rounded text-[10px] font-medium bg-[#F8FAFE] dark:bg-[#0F1923] border border-gray-200 dark:border-[#243348] text-[#0F1923] dark:text-[#F8FAFE] hover:bg-gray-100 dark:hover:bg-[#243348] transition-colors"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Download
                      </a>
                    ) : (
                      <span className="flex items-center gap-1 px-2.5 h-6 rounded text-[10px] font-medium text-[#64748B] dark:text-[#7D93AE] bg-gray-50 dark:bg-[#0F1923] border border-gray-200 dark:border-[#243348] opacity-60">
                        No file
                      </span>
                    )}

                    {arch.emailedTo && arch.storageUrl && (
                      <button
                        onClick={() => handleResend(arch)}
                        disabled={resending === arch.id}
                        className="flex items-center gap-1 px-2.5 h-6 rounded text-[10px] font-medium bg-[#2E8BF0]/10 dark:bg-[#2E8BF0]/20 border border-[#2E8BF0]/30 dark:border-[#2E8BF0]/40 text-[#2E8BF0] hover:bg-[#2E8BF0]/20 dark:hover:bg-[#2E8BF0]/30 transition-colors disabled:opacity-50"
                      >
                        {resending === arch.id ? (
                          <div className="w-3 h-3 border-1.5 border-[#2E8BF0] border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                          </svg>
                        )}
                        Resend
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
