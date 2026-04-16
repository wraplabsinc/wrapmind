import { useState, useRef } from 'react';
import WMIcon from '../ui/WMIcon';
import { useAuth } from '../../context/AuthContext';
import { config as supabaseConfig } from '../../lib/supabase';
import { pushTestLead } from '../../lib/leadsDb';
import Button from '../ui/Button';

// ─── CSV Parser (simple) ─────────────────────────────────────────────────────
function parseCSV(text) {
  const rows = [];
  const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
  if (lines.length === 0) return { headers: [], rows: [] };
  const parseLine = (line) => {
    const out = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') { cur += '"'; i++; }
        else inQuotes = !inQuotes;
      } else if (ch === ',' && !inQuotes) {
        out.push(cur); cur = '';
      } else {
        cur += ch;
      }
    }
    out.push(cur);
    return out.map(s => s.trim());
  };
  const headers = parseLine(lines[0]);
  for (let i = 1; i < lines.length; i++) {
    const vals = parseLine(lines[i]);
    const row = {};
    headers.forEach((h, idx) => { row[h] = vals[idx] || ''; });
    rows.push(row);
  }
  return { headers, rows };
}

// Field targets for mapping
const FIELD_TARGETS = [
  { id: '__skip__', label: '— Skip —' },
  { id: 'name',            label: 'Name' },
  { id: 'phone',           label: 'Phone' },
  { id: 'email',           label: 'Email' },
  { id: 'vehicle_year',    label: 'Vehicle Year' },
  { id: 'vehicle_make',    label: 'Vehicle Make' },
  { id: 'vehicle_model',   label: 'Vehicle Model' },
  { id: 'serviceInterest', label: 'Service Interest' },
  { id: 'budget',          label: 'Budget' },
  { id: 'source',          label: 'Source' },
  { id: 'priority',        label: 'Priority' },
  { id: 'notes',           label: 'Notes' },
];

function autoDetect(header) {
  const h = header.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (['name', 'fullname', 'customer', 'contact'].includes(h)) return 'name';
  if (['phone', 'mobile', 'tel', 'phonenumber'].includes(h)) return 'phone';
  if (['email', 'mail', 'emailaddress'].includes(h)) return 'email';
  if (['year', 'vehicleyear'].includes(h)) return 'vehicle_year';
  if (['make', 'vehiclemake'].includes(h)) return 'vehicle_make';
  if (['model', 'vehiclemodel'].includes(h)) return 'vehicle_model';
  if (['service', 'serviceinterest', 'interest'].includes(h)) return 'serviceInterest';
  if (['budget', 'amount', 'estimate'].includes(h)) return 'budget';
  if (['source', 'leadsource'].includes(h)) return 'source';
  if (['priority'].includes(h)) return 'priority';
  if (['notes', 'note', 'comments'].includes(h)) return 'notes';
  return '__skip__';
}

const SAMPLE_CSV = `name,phone,email,year,make,model,service,budget,source,notes
Jane Doe,(555) 123-4567,jane@example.com,2024,Tesla,Model Y,Full Vehicle PPF,8500,website,Interested in XPEL
John Smith,(555) 987-6543,john@example.com,2023,BMW,M5,Color Change – Satin Black,6000,referral,Friend of Tavo
`;

const SAMPLE_PAYLOAD = `{
  "name": "Jane Doe",
  "phone": "(555) 123-4567",
  "email": "jane@example.com",
  "vehicle_year": 2024,
  "vehicle_make": "Tesla",
  "vehicle_model": "Model Y",
  "service_interest": "Full Vehicle PPF",
  "budget": 8500,
  "source": "zapier",
  "priority": "warm"
}`;

const EMBED_SNIPPET = `<iframe
  src="https://wrapmind.app/embed/lead-form?shop=YOUR_SHOP_ID"
  width="100%"
  height="640"
  style="border:0;border-radius:8px;"
></iframe>`;

// ─── Main ────────────────────────────────────────────────────────────────────
export default function ImportModal({
  open,
  onClose,
  onImport,
  onToast,
}) {
  const { orgId } = useAuth();
  const [tab, setTab] = useState('csv');
  const [headers, setHeaders] = useState([]);
  const [rows, setRows] = useState([]);
  const [mapping, setMapping] = useState({});
  const [fileName, setFileName] = useState('');
  const [dragging, setDragging] = useState(false);
  const [copied, setCopied] = useState('');
  const fileInputRef = useRef(null);

  if (!open) return null;

  const resetCSV = () => {
    setHeaders([]);
    setRows([]);
    setMapping({});
    setFileName('');
  };

  const handleFile = (file) => {
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const { headers: h, rows: r } = parseCSV(text);
      setHeaders(h);
      setRows(r);
      const m = {};
      h.forEach(col => { m[col] = autoDetect(col); });
      setMapping(m);
    };
    reader.readAsText(file);
  };

  const handleFileInput = (e) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const downloadSample = () => {
    const blob = new Blob([SAMPLE_CSV], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'lead-import-sample.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const performImport = () => {
    const now = new Date().toISOString();
    const imported = rows.map((row, idx) => {
      const lead = {
        id: `lead-imp-${Date.now()}-${idx}`,
        name: '',
        phone: '',
        email: '',
        vehicle: { year: null, make: '', model: '' },
        serviceInterest: '',
        budget: null,
        source: 'manual',
        status: 'new',
        priority: 'warm',
        assignee: null,
        tags: [],
        notes: '',
        followUpDate: null,
        createdAt: now,
        lastContactedAt: null,
        activities: [{ type: 'created', text: 'Imported via CSV', at: now }],
      };
      for (const [col, target] of Object.entries(mapping)) {
        const val = row[col];
        if (!val || target === '__skip__') continue;
        switch (target) {
          case 'name':            lead.name = val; break;
          case 'phone':           lead.phone = val; break;
          case 'email':           lead.email = val; break;
          case 'vehicle_year':    lead.vehicle.year = Number(val) || null; break;
          case 'vehicle_make':    lead.vehicle.make = val; break;
          case 'vehicle_model':   lead.vehicle.model = val; break;
          case 'serviceInterest': lead.serviceInterest = val; break;
          case 'budget':          lead.budget = Number(val) || null; break;
          case 'source':          lead.source = val.toLowerCase(); break;
          case 'priority':        lead.priority = val.toLowerCase(); break;
          case 'notes':           lead.notes = val; break;
          default: break;
        }
      }
      return lead;
    }).filter(l => l.name);
    onImport?.(imported);
    resetCSV();
    onClose?.();
  };

  const copy = (text, key) => {
    try {
      navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(''), 1500);
    } catch { /* ignore */ }
  };

  const handleTestPush = async () => {
    const result = await pushTestLead(orgId);
    if (result) {
      onToast?.({ name: result.name, service: result.serviceInterest });
    } else {
      onToast?.({
        name: 'Test push failed',
        service: 'Supabase table may not exist. See SQL in leadsDb.js',
        error: true,
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl max-h-[90vh] bg-white dark:bg-[#1B2A3E] rounded-lg shadow-2xl border border-gray-200 dark:border-[#243348] flex flex-col"
      >
        {/* Header + tabs */}
        <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-[#243348] flex-shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-semibold text-[#0F1923] dark:text-[#F8FAFE]">Import Leads</h2>
            <div className="flex items-center bg-gray-100 dark:bg-[#0F1923] rounded p-0.5">
              <button
                onClick={() => setTab('csv')}
                className={`h-6 px-2 text-[11px] font-medium rounded ${
                  tab === 'csv'
                    ? 'bg-white dark:bg-[#1B2A3E] text-[#0F1923] dark:text-[#F8FAFE] shadow-sm'
                    : 'text-[#64748B] dark:text-[#7D93AE]'
                }`}
              >
                Import CSV
              </button>
              <button
                onClick={() => setTab('push')}
                className={`h-6 px-2 text-[11px] font-medium rounded ${
                  tab === 'push'
                    ? 'bg-white dark:bg-[#1B2A3E] text-[#0F1923] dark:text-[#F8FAFE] shadow-sm'
                    : 'text-[#64748B] dark:text-[#7D93AE]'
                }`}
              >
                Push Integration
              </button>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-6 h-6 flex items-center justify-center rounded text-[#64748B] dark:text-[#7D93AE] hover:bg-gray-100 dark:hover:bg-[#243348]"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          {tab === 'csv' && (
            <div className="space-y-3">
              {rows.length === 0 ? (
                <>
                  <div
                    onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                      dragging
                        ? 'border-[#2E8BF0] bg-[#2E8BF0]/5'
                        : 'border-gray-300 dark:border-[#243348] hover:border-[#2E8BF0]'
                    }`}
                  >
                    <svg className="w-8 h-8 mb-2 text-[#64748B] mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg>
                    <p className="text-[12px] font-semibold text-[#0F1923] dark:text-[#F8FAFE]">
                      Drop CSV file here
                    </p>
                    <p className="text-[10px] text-[#64748B] dark:text-[#7D93AE] mt-1">
                      or click to browse
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv,text/csv"
                      onChange={handleFileInput}
                      className="hidden"
                    />
                  </div>
                  <button
                    onClick={downloadSample}
                    className="text-[11px] text-[#2E8BF0] hover:underline"
                  >
                    Download sample CSV template
                  </button>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <div className="text-[11px] text-[#64748B] dark:text-[#7D93AE]">
                      <span className="font-mono font-semibold text-[#0F1923] dark:text-[#F8FAFE]">{fileName}</span>
                      {' · '}
                      {rows.length} row{rows.length !== 1 ? 's' : ''}
                    </div>
                    <button
                      onClick={resetCSV}
                      className="text-[10px] text-[#64748B] dark:text-[#7D93AE] hover:underline"
                    >
                      Clear
                    </button>
                  </div>
                  {/* Column mapping */}
                  <div>
                    <h4 className="text-[10px] font-semibold uppercase tracking-wider text-[#64748B] dark:text-[#7D93AE] mb-1.5">
                      Column mapping
                    </h4>
                    <div className="space-y-1">
                      {headers.map(h => (
                        <div key={h} className="flex items-center gap-2">
                          <span className="text-[10px] font-mono text-[#0F1923] dark:text-[#F8FAFE] w-32 truncate">{h}</span>
                          <svg className="w-3 h-3 text-[#94A3B8] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                          </svg>
                          <select
                            value={mapping[h] || '__skip__'}
                            onChange={(e) => setMapping(prev => ({ ...prev, [h]: e.target.value }))}
                            className="flex-1 h-7 px-2 text-[11px] rounded border border-gray-200 dark:border-[#243348] bg-white dark:bg-[#0F1923] text-[#0F1923] dark:text-[#F8FAFE]"
                          >
                            {FIELD_TARGETS.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Preview */}
                  <div>
                    <h4 className="text-[10px] font-semibold uppercase tracking-wider text-[#64748B] dark:text-[#7D93AE] mb-1.5">
                      Preview (first 5 rows)
                    </h4>
                    <div className="border border-gray-200 dark:border-[#243348] rounded overflow-auto max-h-48">
                      <table className="w-full text-[10px]">
                        <thead className="bg-gray-50 dark:bg-[#0F1923]">
                          <tr>
                            {headers.map(h => (
                              <th key={h} className="px-2 py-1 text-left font-semibold text-[#64748B] dark:text-[#7D93AE] border-b border-gray-200 dark:border-[#243348]">
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {rows.slice(0, 5).map((r, i) => (
                            <tr key={i} className="border-b border-gray-100 dark:border-[#243348]">
                              {headers.map(h => (
                                <td key={h} className="px-2 py-1 text-[#0F1923] dark:text-[#F8FAFE] whitespace-nowrap">
                                  {r[h]}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <Button variant="primary" className="w-full" onClick={performImport}>
                    Import {rows.length} Lead{rows.length !== 1 ? 's' : ''}
                  </Button>
                </>
              )}
            </div>
          )}

          {tab === 'push' && (
            <div className="space-y-3">
              {/* 1. Supabase Realtime */}
              <IntegrationCard
                title="Supabase Realtime (Live Push)"
                icon="bolt"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-red-500">
                    <span className="w-2 h-2 rounded-full bg-red-500" />
                    Disconnected
                  </span>
                </div>
                <p className="text-[11px] text-[#64748B] dark:text-[#7D93AE] mb-2">
                  Any lead inserted into your Supabase <code className="font-mono text-[10px] bg-gray-100 dark:bg-[#0F1923] px-1 rounded">leads</code> table appears here instantly.
                </p>
                <div className="text-[10px] text-[#94A3B8] mb-2 font-mono break-all">
                  {supabaseConfig.projectUrl}
                </div>
                <Button variant="primary" size="sm" onClick={handleTestPush}>
                  Test Push Lead
                </Button>
              </IntegrationCard>

              {/* 2. Zapier / Make */}
              <IntegrationCard
                title="Zapier / Make"
                icon="link"
              >
                <p className="text-[11px] text-[#64748B] dark:text-[#7D93AE] mb-2">
                  Configure your Zapier Zap or Make Scenario to POST lead data to this URL:
                </p>
                <div className="flex items-center gap-1 mb-2">
                  <code className="flex-1 text-[10px] font-mono bg-gray-100 dark:bg-[#0F1923] px-2 py-1.5 rounded border border-gray-200 dark:border-[#243348] text-[#0F1923] dark:text-[#F8FAFE] break-all">
                    https://[your-edge-function].supabase.co/functions/v1/receive-lead
                  </code>
                  <button
                    onClick={() => copy('https://[your-edge-function].supabase.co/functions/v1/receive-lead', 'webhook')}
                    className="h-7 px-2 rounded border border-gray-200 dark:border-[#243348] text-[10px] text-[#64748B] dark:text-[#7D93AE] hover:bg-gray-50 dark:hover:bg-[#243348]"
                  >
                    {copied === 'webhook' ? '✓' : 'Copy'}
                  </button>
                </div>
                <p className="text-[10px] text-[#64748B] dark:text-[#7D93AE] mb-1 font-semibold">Sample payload:</p>
                <div className="relative">
                  <pre className="text-[10px] font-mono bg-gray-100 dark:bg-[#0F1923] px-2 py-1.5 rounded border border-gray-200 dark:border-[#243348] text-[#0F1923] dark:text-[#F8FAFE] overflow-auto whitespace-pre">
{SAMPLE_PAYLOAD}
                  </pre>
                  <button
                    onClick={() => copy(SAMPLE_PAYLOAD, 'payload')}
                    className="absolute top-1 right-1 h-6 px-1.5 rounded bg-white dark:bg-[#1B2A3E] border border-gray-200 dark:border-[#243348] text-[9px] text-[#64748B] dark:text-[#7D93AE] hover:bg-gray-50 dark:hover:bg-[#243348]"
                  >
                    {copied === 'payload' ? '✓' : 'Copy'}
                  </button>
                </div>
              </IntegrationCard>

              {/* 3. Facebook Lead Ads */}
              <IntegrationCard
                title="Facebook Lead Ads"
                icon="chat-bubble"
              >
                <p className="text-[11px] text-[#64748B] dark:text-[#7D93AE]">
                  Connect Facebook Lead Ads via Zapier — create a Zap that triggers on
                  new Facebook leads and sends them to the Zapier / Make webhook above.
                  New leads will appear in your pipeline automatically.
                </p>
              </IntegrationCard>

              {/* 4. Website Form Embed */}
              <IntegrationCard
                title="Website Form (Embed)"
                icon="globe-alt"
              >
                <p className="text-[11px] text-[#64748B] dark:text-[#7D93AE] mb-2">
                  Embed this form on your website to collect leads directly into WrapMind:
                </p>
                <div className="relative">
                  <pre className="text-[10px] font-mono bg-gray-100 dark:bg-[#0F1923] px-2 py-1.5 rounded border border-gray-200 dark:border-[#243348] text-[#0F1923] dark:text-[#F8FAFE] overflow-auto whitespace-pre">
{EMBED_SNIPPET}
                  </pre>
                  <button
                    onClick={() => copy(EMBED_SNIPPET, 'embed')}
                    className="absolute top-1 right-1 h-6 px-1.5 rounded bg-white dark:bg-[#1B2A3E] border border-gray-200 dark:border-[#243348] text-[9px] text-[#64748B] dark:text-[#7D93AE] hover:bg-gray-50 dark:hover:bg-[#243348]"
                  >
                    {copied === 'embed' ? '✓' : 'Copy'}
                  </button>
                </div>
              </IntegrationCard>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function IntegrationCard({ title, icon, children }) {
  return (
    <div className="border border-gray-200 dark:border-[#243348] rounded-lg p-3">
      <h3 className="text-[12px] font-semibold text-[#0F1923] dark:text-[#F8FAFE] mb-2 flex items-center gap-1.5">
        <WMIcon name={icon} className="w-3.5 h-3.5" />
        {title}
      </h3>
      {children}
    </div>
  );
}
