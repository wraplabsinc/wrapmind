import { useState, useRef, useEffect } from 'react';
import { useTheme, ACCENT_PALETTES, NAV_THEMES, FONT_SIZE_STEPS, FONT_SIZE_MAP, FONT_SIZE_LABELS, FONT_FAMILY_MAP, DENSITY_OPTIONS, RADIUS_OPTIONS, CARD_STYLE_OPTIONS, MODULE_GAP_OPTIONS } from '../context/ThemeContext';
import { useRoles, ROLES, ACCESS_MATRIX } from '../context/RolesContext';
import { useUnits } from '../context/UnitsContext';
import { useFeatureFlags } from '../context/FeatureFlagsContext';
import { useAuditLog } from '../context/AuditLogContext';
import { useLanguage } from '../context/LanguageContext';
import { useTicker, TICKER_SPEEDS } from '../context/TickerContext';
import Button from './ui/Button';
import WMIcon from './ui/WMIcon';
import Toggle from './ui/Toggle';
import { Card, CardHeader, CardBody, Field, CheckboxRow, SectionHeader, PageHeader, ComingSoon } from './ui/Card';
import { TextInput, SelectInput, TextArea } from './ui/Input';
import Tooltip from './ui/Tooltip';
import IntegrationsPage from './settings/IntegrationsPage';
import LocationsPage from './settings/LocationsPage';
import DocumentArchivePage from './settings/DocumentArchivePage';
import { getRateLimitStats, getRateLimitConfig, setRateLimitConfig } from '../lib/aiRateLimiter';

const labelCls = 'block text-xs font-medium text-[#0F1923] dark:text-[#F8FAFE] mb-1';

// ─────────────────────────────────────────────
// PROFILE
// ─────────────────────────────────────────────

// ── Logo Upload ───────────────────────────────────────────────────────────────

const LOGO_REQUIREMENTS = {
  maxSizeMB: 2,
  minPx: 100,
  maxPx: 2000,
  types: ['image/png', 'image/svg+xml', 'image/jpeg', 'image/webp'],
  accept: '.png,.svg,.jpg,.jpeg,.webp,image/png,image/svg+xml,image/jpeg,image/webp',
};

function LogoUpload() {
  const [logo, setLogo] = useState(() => localStorage.getItem('wm-shop-logo') || null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const inputRef = useRef(null);

  const processFile = (file) => {
    setError('');
    if (!LOGO_REQUIREMENTS.types.includes(file.type)) {
      setError('Unsupported format. Use PNG, SVG, JPG, or WebP.');
      return;
    }
    if (file.size > LOGO_REQUIREMENTS.maxSizeMB * 1024 * 1024) {
      setError(`File too large — maximum ${LOGO_REQUIREMENTS.maxSizeMB} MB.`);
      return;
    }
    const reader = new FileReader();
    reader.onload = (evt) => {
      const dataUrl = evt.target.result;
      if (file.type !== 'image/svg+xml') {
        const img = new Image();
        img.onload = () => {
          if (img.width < LOGO_REQUIREMENTS.minPx || img.height < LOGO_REQUIREMENTS.minPx) {
            setError(`Too small — minimum ${LOGO_REQUIREMENTS.minPx}×${LOGO_REQUIREMENTS.minPx} px.`);
            return;
          }
          if (img.width > LOGO_REQUIREMENTS.maxPx || img.height > LOGO_REQUIREMENTS.maxPx) {
            setError(`Too large — maximum ${LOGO_REQUIREMENTS.maxPx}×${LOGO_REQUIREMENTS.maxPx} px.`);
            return;
          }
          setLogo(dataUrl);
          localStorage.setItem('wm-shop-logo', dataUrl);
        };
        img.src = dataUrl;
      } else {
        setLogo(dataUrl);
        localStorage.setItem('wm-shop-logo', dataUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    // Reset so the same file can be re-selected
    e.target.value = '';
  };

  const handleUploadClick = () => {
    inputRef.current?.click();
  };

  const handleDeleteConfirm = () => {
    setLogo(null);
    setError('');
    setConfirmDelete(false);
    localStorage.removeItem('wm-shop-logo');
  };

  return (
    <div className="w-52 flex-shrink-0">
      <label className={labelCls}>Shop Logo</label>

      {/* Hidden file input — triggered only by explicit buttons */}
      <input
        ref={inputRef}
        type="file"
        accept={LOGO_REQUIREMENTS.accept}
        className="sr-only"
        onChange={handleFileChange}
      />

      {logo ? (
        /* ── Logo present state ── */
        <div>
          {/* Preview box */}
          <div className="rounded-lg border border-gray-200 dark:border-[#243348] bg-[#F8FAFE] dark:bg-[#0F1923] h-36 flex items-center justify-center overflow-hidden mb-2.5">
            <img
              src={logo}
              alt="Shop logo"
              className="max-h-full max-w-full object-contain p-3"
            />
          </div>

          {/* Action buttons */}
          {confirmDelete ? (
            <div className="rounded-lg border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-900/10 px-3 py-2.5 mb-2">
              <p className="text-xs font-medium text-red-600 dark:text-red-400 mb-2">Remove this logo?</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleDeleteConfirm}
                  className="flex-1 h-7 rounded bg-red-500 text-white text-xs font-medium hover:bg-red-600 transition-colors"
                >
                  Yes, remove
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="flex-1 h-7 rounded border border-gray-200 dark:border-[#243348] text-xs font-medium text-[#64748B] dark:text-[#7D93AE] hover:bg-gray-100 dark:hover:bg-[#243348] transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2 mb-2.5">
              <button
                type="button"
                onClick={handleUploadClick}
                className="flex-1 h-8 rounded border border-gray-200 dark:border-[#243348] text-xs font-medium text-[#0F1923] dark:text-[#F8FAFE] hover:bg-gray-100 dark:hover:bg-[#243348] transition-colors flex items-center justify-center gap-1.5"
              >
                {/* Upload / swap icon */}
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
                Change Logo
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="h-8 w-8 rounded border border-gray-200 dark:border-[#243348] text-[#64748B] dark:text-[#7D93AE] hover:border-red-300 hover:bg-red-50 hover:text-red-500 dark:hover:border-red-800 dark:hover:bg-red-900/10 dark:hover:text-red-400 transition-colors flex items-center justify-center flex-shrink-0"
                title="Delete logo"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                </svg>
              </button>
            </div>
          )}
        </div>
      ) : (
        /* ── Empty state ── */
        <div>
          {/* Drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            className={`rounded-lg border-2 border-dashed h-36 flex flex-col items-center justify-center gap-1.5 transition-colors mb-2.5 ${
              dragging
                ? 'border-[#2E8BF0] bg-[#2E8BF0]/5'
                : 'border-gray-200 dark:border-[#243348]'
            }`}
          >
            <svg className="w-7 h-7 text-gray-300 dark:text-[#3D5470]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M13.5 12h.008v.008H13.5V12zm3.75 3.75H6.75A2.25 2.25 0 014.5 13.5V6.75A2.25 2.25 0 016.75 4.5h10.5A2.25 2.25 0 0119.5 6.75v6.75a2.25 2.25 0 01-2.25 2.25z" />
            </svg>
            <p className="text-xs text-[#64748B] dark:text-[#7D93AE]">
              {dragging ? 'Drop to upload' : 'Drag & drop here'}
            </p>
          </div>

          {/* Explicit upload button */}
          <button
            type="button"
            onClick={handleUploadClick}
            className="w-full h-8 rounded border border-gray-200 dark:border-[#243348] text-xs font-medium text-[#0F1923] dark:text-[#F8FAFE] hover:bg-gray-100 dark:hover:bg-[#243348] transition-colors flex items-center justify-center gap-1.5 mb-2.5"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            Upload Logo
          </button>
        </div>
      )}

      {/* Validation error */}
      {error && (
        <p className="mb-2 text-[10px] text-red-500 leading-snug flex items-start gap-1">
          <svg className="w-3 h-3 mt-px flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}

      {/* Requirements fine print */}
      <div className="rounded-md bg-gray-50 dark:bg-[#0F1923] border border-gray-100 dark:border-[#243348] px-3 py-2.5 space-y-1">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 dark:text-[#4A6080] mb-1.5">Requirements</p>
        <div className="flex items-center gap-1.5 text-[10px] text-[#64748B] dark:text-[#7D93AE]">
          <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-[#364860] flex-shrink-0" />
          <span><span className="font-medium text-[#0F1923] dark:text-[#F8FAFE]">Formats:</span> PNG, SVG, JPG, WebP</span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-[#64748B] dark:text-[#7D93AE]">
          <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-[#364860] flex-shrink-0" />
          <span><span className="font-medium text-[#0F1923] dark:text-[#F8FAFE]">Max size:</span> 2 MB</span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-[#64748B] dark:text-[#7D93AE]">
          <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-[#364860] flex-shrink-0" />
          <span><span className="font-medium text-[#0F1923] dark:text-[#F8FAFE]">Dimensions:</span> 100×100 – 2000×2000 px</span>
        </div>
        <div className="flex items-start gap-1.5 text-[10px] text-[#64748B] dark:text-[#7D93AE] pt-0.5">
          <svg className="w-3 h-3 mt-px flex-shrink-0 text-[#2E8BF0]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
          </svg>
          <span>PNG or SVG with a transparent background looks best on printed quotes.</span>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_PROFILE = {
  name: 'Wrap Labs',
  website: 'https://wraplabs.com',
  email: 'hello@wraplabs.com',
  phone: '(805) 300-4940',
  ext: '',
  country: 'United States of America',
  timezone: 'America/Los_Angeles',
  address1: '31293 Via Colinas',
  address2: '',
  city: 'Westlake Village',
  state: 'CA',
  zip: '91062',
};

function ProfilePage() {
  const [form, setForm] = useState(() => {
    try {
      return { ...DEFAULT_PROFILE, ...JSON.parse(localStorage.getItem('wm-shop-profile') || '{}') };
    } catch {
      return DEFAULT_PROFILE;
    }
  });
  const [saveMsg, setSaveMsg] = useState('');
  const [certifications, setCertifications] = useState([{ label: 'XPEL', number: '1009556' }]);
  const [businessHours, setBusinessHours] = useState([
    { day: 'Monday',    open: true,  from: '08:00', to: '17:00' },
    { day: 'Tuesday',   open: true,  from: '08:00', to: '17:00' },
    { day: 'Wednesday', open: true,  from: '08:00', to: '17:00' },
    { day: 'Thursday',  open: true,  from: '08:00', to: '17:00' },
    { day: 'Friday',    open: true,  from: '08:00', to: '17:00' },
    { day: 'Saturday',  open: false, from: '09:00', to: '14:00' },
    { day: 'Sunday',    open: false, from: '09:00', to: '14:00' },
  ]);
  const updateHours = (i, field, val) =>
    setBusinessHours(h => h.map((x, idx) => idx === i ? { ...x, [field]: val } : x));

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSave = () => {
    localStorage.setItem('wm-shop-profile', JSON.stringify(form));
    setSaveMsg('Saved!');
    setTimeout(() => setSaveMsg(''), 2000);
  };

  const addCert = () => setCertifications((c) => [...c, { label: '', number: '' }]);
  const removeCert = (i) => setCertifications((c) => c.filter((_, idx) => idx !== i));
  const setCert = (i, key) => (e) => {
    const next = certifications.map((c, idx) => (idx === i ? { ...c, [key]: e.target.value } : c));
    setCertifications(next);
  };

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Company Profile">
        <Button variant="outline" onClick={() => {
          try { setForm({ ...DEFAULT_PROFILE, ...JSON.parse(localStorage.getItem('wm-shop-profile') || '{}') }); } catch { setForm(DEFAULT_PROFILE); }
        }}>Cancel</Button>
        <Button variant="primary" onClick={handleSave}>
          {saveMsg || 'Save'}
        </Button>
      </PageHeader>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-3xl space-y-4">

          {/* Company Info Card */}
          <Card>
            <CardHeader title="Company Info" />
            <CardBody>
              {/* Top row: form fields left, logo upload right */}
              <div className="flex gap-6">
                <div className="flex-1 space-y-3">
                  <Field label="Name *">
                    <TextInput value={form.name} onChange={set('name')} />
                    <CheckboxRow label="Show on printed documents" checked={false} onChange={() => {}} />
                  </Field>

                  <Field label="Website">
                    <TextInput value={form.website} onChange={set('website')} />
                    <CheckboxRow label="Show on printed documents" checked={false} onChange={() => {}} />
                  </Field>

                  <Field label="Email *">
                    <TextInput value={form.email} onChange={set('email')} />
                    <CheckboxRow label="Show on printed documents" checked={false} onChange={() => {}} />
                  </Field>

                  <Field label="Phone *">
                    <div className="flex gap-2">
                      <TextInput value={form.phone} onChange={set('phone')} />
                      <input
                        className="w-16 h-8 px-2 rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-[#0F1923] dark:text-[#F8FAFE] focus:outline-none focus:border-[#2E8BF0] focus:ring-1 focus:ring-[#2E8BF0] transition-colors"
                        placeholder="ext"
                        value={form.ext}
                        onChange={set('ext')}
                      />
                    </div>
                  </Field>
                </div>

                {/* Logo upload */}
                <LogoUpload />
              </div>

              {/* Divider */}
              <div className="my-4 border-t border-gray-200 dark:border-[#243348]" />

              {/* Country + Timezone */}
              <div className="grid grid-cols-2 gap-3 mb-3">
                <Field label="Country">
                  <SelectInput value={form.country} onChange={set('country')}>
                    <option>United States of America</option>
                    <option>Canada</option>
                    <option>Mexico</option>
                  </SelectInput>
                </Field>
                <Field label="Time Zone">
                  <SelectInput value={form.timezone} onChange={set('timezone')}>
                    <optgroup label="United States">
                      <option value="America/Los_Angeles">Pacific Time — Los Angeles</option>
                      <option value="America/Denver">Mountain Time — Denver</option>
                      <option value="America/Phoenix">Mountain Time (no DST) — Phoenix</option>
                      <option value="America/Chicago">Central Time — Chicago</option>
                      <option value="America/New_York">Eastern Time — New York</option>
                      <option value="America/Anchorage">Alaska Time — Anchorage</option>
                      <option value="Pacific/Honolulu">Hawaii Time — Honolulu</option>
                    </optgroup>
                    <optgroup label="Canada">
                      <option value="America/Vancouver">Pacific — Vancouver</option>
                      <option value="America/Edmonton">Mountain — Edmonton</option>
                      <option value="America/Winnipeg">Central — Winnipeg</option>
                      <option value="America/Toronto">Eastern — Toronto</option>
                      <option value="America/Halifax">Atlantic — Halifax</option>
                      <option value="America/St_Johns">Newfoundland — St. John's</option>
                    </optgroup>
                    <optgroup label="Mexico & Caribbean">
                      <option value="America/Mexico_City">Central — Mexico City</option>
                      <option value="America/Tijuana">Pacific — Tijuana</option>
                      <option value="America/Puerto_Rico">Atlantic — Puerto Rico</option>
                    </optgroup>
                    <optgroup label="Europe">
                      <option value="Europe/London">GMT/BST — London</option>
                      <option value="Europe/Paris">CET — Paris / Berlin / Rome</option>
                      <option value="Europe/Helsinki">EET — Helsinki / Athens</option>
                      <option value="Europe/Moscow">MSK — Moscow</option>
                    </optgroup>
                    <optgroup label="Asia & Pacific">
                      <option value="Asia/Dubai">GST — Dubai</option>
                      <option value="Asia/Kolkata">IST — India</option>
                      <option value="Asia/Bangkok">ICT — Bangkok</option>
                      <option value="Asia/Singapore">SGT — Singapore</option>
                      <option value="Asia/Tokyo">JST — Tokyo</option>
                      <option value="Asia/Seoul">KST — Seoul</option>
                      <option value="Australia/Sydney">AEST — Sydney</option>
                      <option value="Pacific/Auckland">NZST — Auckland</option>
                    </optgroup>
                    <optgroup label="Other">
                      <option value="UTC">UTC — Coordinated Universal Time</option>
                    </optgroup>
                  </SelectInput>
                </Field>
              </div>

              {/* Address row */}
              <div className="grid grid-cols-2 gap-3 mb-3">
                <Field label="Address 1">
                  <TextInput value={form.address1} onChange={set('address1')} />
                </Field>
                <Field label="Address 2">
                  <TextInput value={form.address2} onChange={set('address2')} />
                </Field>
              </div>

              {/* City / State / ZIP */}
              <div className="grid grid-cols-5 gap-3 mb-3">
                <div className="col-span-2">
                  <Field label="City">
                    <TextInput value={form.city} onChange={set('city')} />
                  </Field>
                </div>
                <Field label="State">
                  <TextInput value={form.state} onChange={set('state')} />
                </Field>
                <div className="col-span-2">
                  <Field label="ZIP Code">
                    <TextInput value={form.zip} onChange={set('zip')} />
                  </Field>
                </div>
              </div>

              {/* Certifications */}
              <div>
                <label className={labelCls}>Certifications</label>
                <div className="space-y-2">
                  {certifications.map((cert, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <TextInput
                        placeholder="Label"
                        value={cert.label}
                        onChange={setCert(i, 'label')}
                      />
                      <input
                        className="w-28 h-8 px-3 rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-[#0F1923] dark:text-[#F8FAFE] focus:outline-none focus:border-[#2E8BF0] focus:ring-1 focus:ring-[#2E8BF0] transition-colors flex-shrink-0"
                        placeholder="Number"
                        value={cert.number}
                        onChange={setCert(i, 'number')}
                      />
                      <button
                        onClick={() => removeCert(i)}
                        className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  onClick={addCert}
                  className="mt-2 text-[#2E8BF0] hover:text-blue-700 text-xs font-medium"
                >
                  + Add Certification
                </button>
              </div>
            </CardBody>
          </Card>

          {/* Business Hours */}
          <Card>
            <CardHeader title="Business Hours" />
            <CardBody>
              <p className="text-[11px] text-[#64748B] dark:text-[#7D93AE] mb-3">Time zone: {form.timezone || 'America/Los_Angeles'}</p>
              <div className="space-y-2">
                {businessHours.map((row, i) => (
                  <div key={row.day} className="grid grid-cols-[80px_40px_90px_16px_90px] items-center gap-2">
                    <span className="text-xs font-medium text-[#0F1923] dark:text-[#F8FAFE]">{row.day}</span>
                    <Toggle on={row.open} onChange={v => updateHours(i, 'open', v)} />
                    <input
                      type="time" value={row.from}
                      disabled={!row.open}
                      onChange={e => updateHours(i, 'from', e.target.value)}
                      className="h-7 px-2 rounded border border-gray-200 dark:border-[#243348] bg-white dark:bg-[#1B2A3E] text-xs text-[#0F1923] dark:text-[#F8FAFE] focus:outline-none focus:border-[#2E8BF0] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    />
                    <span className="text-[10px] text-center text-[#64748B] dark:text-[#7D93AE]">–</span>
                    <input
                      type="time" value={row.to}
                      disabled={!row.open}
                      onChange={e => updateHours(i, 'to', e.target.value)}
                      className="h-7 px-2 rounded border border-gray-200 dark:border-[#243348] bg-white dark:bg-[#1B2A3E] text-xs text-[#0F1923] dark:text-[#F8FAFE] focus:outline-none focus:border-[#2E8BF0] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    />
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>

        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// BILLING
// ─────────────────────────────────────────────

function BillingPage() {
  const { planTier, setPlanTier } = useFeatureFlags();

  const TIERS = [
    {
      id: 'starter',
      name: 'Starter', price: '$79/mo',
      features: ['1 location', 'Up to 2 users', 'Core estimating', 'Email support'],
    },
    {
      id: 'professional',
      name: 'Professional', price: '$224.99/mo',
      features: ['1 location', 'Up to 5 users', 'Full estimating suite', 'Labor & pricing matrices', 'Priority support'],
    },
    {
      id: 'enterprise',
      name: 'Enterprise', price: 'Custom',
      features: ['Multi-location', 'Unlimited users', 'Custom integrations', 'Dedicated account manager'],
    },
  ];

  const currentTier = TIERS.find(t => t.id === planTier) || TIERS[1];
  const tierPriceLabel = { starter: '$79', professional: '$224.99', enterprise: 'Custom' }[planTier] || '$224.99';
  const tierMoSuffix = planTier !== 'enterprise';

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Billing" />
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-3xl space-y-4">

          {/* Current Plan */}
          <Card>
            <CardHeader title="Current Plan" />
            <CardBody>
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg font-bold text-[#0F1923] dark:text-[#F8FAFE]">{currentTier.name}</span>
                    <span className="px-2 py-0.5 rounded-full bg-[#2E8BF0]/15 text-[#2E8BF0] text-[10px] font-bold uppercase tracking-wide">Current Plan</span>
                  </div>
                  <p className="text-2xl font-bold text-[#0F1923] dark:text-[#F8FAFE]">{tierPriceLabel}{tierMoSuffix && <span className="text-sm font-normal text-[#64748B] dark:text-[#7D93AE]">/mo</span>}</p>
                  <p className="text-xs text-[#64748B] dark:text-[#7D93AE] mt-0.5">Billed monthly · Next billing date: <span className="font-medium text-[#0F1923] dark:text-[#F8FAFE]">May 11, 2026</span></p>
                </div>
              </div>

              {/* Tier comparison table */}
              <div className="grid grid-cols-3 gap-3 border-t border-gray-100 dark:border-[#243348] pt-4">
                {TIERS.map((tier) => {
                  const isCurrent = tier.id === planTier;
                  const isEnterprise = tier.id === 'enterprise';
                  return (
                  <div
                    key={tier.name}
                    className={`rounded-lg border p-3 flex flex-col ${isCurrent ? 'border-[#2E8BF0] bg-[#2E8BF0]/5 dark:bg-[#2E8BF0]/10' : isEnterprise ? 'border-amber-500/40 bg-amber-500/5' : 'border-gray-200 dark:border-[#243348]'}`}
                  >
                    <p className={`text-xs font-semibold mb-0.5 ${isCurrent ? 'text-[#2E8BF0]' : isEnterprise ? 'text-amber-500' : 'text-[#0F1923] dark:text-[#F8FAFE]'}`}>{tier.name}</p>
                    <p className="text-sm font-bold text-[#0F1923] dark:text-[#F8FAFE] mb-2">{tier.price}</p>
                    <ul className="space-y-1 flex-1">
                      {tier.features.map((f) => (
                        <li key={f} className="flex items-start gap-1.5 text-[10px] text-[#64748B] dark:text-[#7D93AE]">
                          <svg className={`w-3 h-3 mt-px flex-shrink-0 ${isEnterprise ? 'text-amber-500' : 'text-emerald-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                          </svg>
                          {f}
                        </li>
                      ))}
                    </ul>
                    {!isCurrent && (
                      <button
                        onClick={() => setPlanTier(tier.id)}
                        className={`mt-3 w-full text-[10px] font-semibold rounded py-1.5 transition-colors ${isEnterprise ? 'bg-amber-500 hover:bg-amber-400 text-[#0F1923]' : 'bg-[#243348] hover:bg-[#364860] text-[#F8FAFE]'}`}
                      >
                        {isEnterprise ? 'Upgrade to Enterprise' : `Switch to ${tier.name}`}
                      </button>
                    )}
                    {isCurrent && (
                      <div className="mt-3 w-full text-center text-[10px] font-semibold text-[#2E8BF0]">Current plan</div>
                    )}
                  </div>
                  );
                })}
              </div>
            </CardBody>
          </Card>

          {/* Payment Method */}
          <Card>
            <CardHeader title="Payment Method" />
            <CardBody>
              <div className="flex items-center gap-4 p-3 rounded-lg border border-gray-200 dark:border-[#243348] bg-gray-50 dark:bg-[#0F1923]/40 mb-3">
                {/* Card brand icon */}
                <div className="w-10 h-7 rounded border border-gray-200 dark:border-[#243348] bg-white dark:bg-[#1B2A3E] flex items-center justify-center flex-shrink-0">
                  <span className="text-[11px] font-bold text-blue-700 dark:text-blue-400 tracking-tight">VISA</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-[#0F1923] dark:text-[#F8FAFE]">•••• •••• •••• 4242</p>
                  <p className="text-[11px] text-[#64748B] dark:text-[#7D93AE] mt-0.5">Tim Steuer · Expires 12/27</p>
                </div>
                <Button variant="outline">Update payment method</Button>
              </div>
              <button className="text-xs text-[#2E8BF0] hover:underline">+ Add backup payment</button>
              <div className="mt-3 flex items-center gap-1.5 text-[10px] text-gray-400 dark:text-[#4A6080]">
                <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
                Payments secured by Stripe
              </div>
            </CardBody>
          </Card>

          {/* Billing History */}
          <Card>
            <CardHeader title="Billing History" />
            <CardBody className="p-0">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30">
                    <th className="text-left px-5 py-2.5 font-medium text-[#64748B] dark:text-[#7D93AE]">Date</th>
                    <th className="text-right px-5 py-2.5 font-medium text-[#64748B] dark:text-[#7D93AE]">Total</th>
                    <th className="text-right px-5 py-2.5 font-medium text-[#64748B] dark:text-[#7D93AE]">Credits</th>
                    <th className="text-right px-5 py-2.5 font-medium text-[#64748B] dark:text-[#7D93AE]">Due</th>
                    <th className="text-center px-5 py-2.5 font-medium text-[#64748B] dark:text-[#7D93AE]">Status</th>
                    <th className="text-right px-5 py-2.5 font-medium text-[#64748B] dark:text-[#7D93AE]">Statement</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {[
                    { date: 'Mar 29, 2026', total: '$399.98', credits: '$0.00', due: '$399.98' },
                    { date: 'Feb 28, 2026', total: '$399.98', credits: '$0.00', due: '$399.98' },
                    { date: 'Feb 11, 2026', total: '$98.20',  credits: '($55.84)', due: '$42.36' },
                    { date: 'Feb 11, 2026', total: '-$55.84', credits: '$55.84', due: '$0.00' },
                    { date: 'Jan 29, 2026', total: '$324.49', credits: '$0.00', due: '$324.49' },
                  ].map((row, i) => (
                    <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                      <td className="px-5 py-2.5 text-[#0F1923] dark:text-[#F8FAFE]">{row.date}</td>
                      <td className="px-5 py-2.5 text-right text-[#0F1923] dark:text-[#F8FAFE]">{row.total}</td>
                      <td className="px-5 py-2.5 text-right text-[#0F1923] dark:text-[#F8FAFE]">{row.credits}</td>
                      <td className="px-5 py-2.5 text-right text-[#0F1923] dark:text-[#F8FAFE]">{row.due}</td>
                      <td className="px-5 py-2.5 text-center">
                        <span className="px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-medium">
                          Paid
                        </span>
                      </td>
                      <td className="px-5 py-2.5 text-right">
                        <button className="text-[#2E8BF0] hover:text-blue-700 text-xs font-medium">Download</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardBody>
          </Card>

        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// USERS
// ─────────────────────────────────────────────

function UsersPage() {
  const [mainTab, setMainTab] = useState('team');
  const [tab, setTab] = useState('active');
  const [search, setSearch] = useState('');

  const users = [
    { first: 'Bonnie', last: 'Stang',      phone: '',              email: 'cm@poweredbooks.com', role: 'Admin' },
    { first: 'Duke',   last: 'Delaet',     phone: '',              email: 'duke@wraplabs.com',   role: 'Admin' },
    { first: 'Tavo',   last: 'Hernandez',  phone: '(805) 422-4270', email: 'tavo@wraplabs.com',  role: 'Admin' },
    { first: 'Tim',    last: 'Steuer',     phone: '(805) 857-5004', email: 'tim@wraplabs.com',   role: 'Super Admin' },
  ];

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Users">
        {mainTab === 'team' && <Button variant="primary">+ New User</Button>}
      </PageHeader>

      {/* Main tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-6">
        {[
          { id: 'team', label: 'Team' },
          { id: 'roles', label: 'Roles & Permissions' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setMainTab(t.id)}
            className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-colors -mb-px ${
              mainTab === t.id
                ? 'border-blue-600 text-[#2E8BF0]'
                : 'border-transparent text-[#64748B] dark:text-[#7D93AE] hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {mainTab === 'roles' ? (
        <div className="flex-1 overflow-auto">
          <UserRolesPage embedded />
        </div>
      ) : (
        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-4xl space-y-4">

            {/* Stats */}
            <div className="flex gap-4">
              <div className="bg-white dark:bg-[#1B2A3E] border border-gray-200 dark:border-[#243348] rounded shadow-sm px-5 py-3 flex items-center gap-6">
                <div>
                  <p className="text-lg font-semibold text-[#0F1923] dark:text-[#F8FAFE]">0 of 4 Available</p>
                  <button className="text-[#2E8BF0] hover:text-blue-700 text-xs font-medium">Update Licenses</button>
                </div>
                <div className="border-l border-gray-100 dark:border-gray-700 pl-6">
                  <p className="text-xs text-[#64748B] dark:text-[#7D93AE]">Included: <span className="font-medium text-[#0F1923] dark:text-[#F8FAFE]">4</span></p>
                  <p className="text-xs text-[#64748B] dark:text-[#7D93AE] mt-0.5">Purchased: <span className="font-medium text-[#0F1923] dark:text-[#F8FAFE]">0</span></p>
                </div>
              </div>
            </div>

            {/* Sub-tabs */}
            <div className="flex border-b border-gray-200 dark:border-gray-700">
              {['active', 'deleted'].map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`px-4 py-2 text-xs font-medium capitalize border-b-2 transition-colors ${
                    tab === t
                      ? 'border-blue-600 text-[#2E8BF0]'
                      : 'border-transparent text-[#64748B] dark:text-[#7D93AE] hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Search + actions */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1 max-w-xs">
                <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 15.803a7.5 7.5 0 0 0 10.607 0Z" />
                </svg>
                <input
                  className="w-full h-8 pl-8 pr-3 rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-[#0F1923] dark:text-[#F8FAFE] focus:outline-none focus:border-[#2E8BF0] focus:ring-1 focus:ring-[#2E8BF0] transition-colors"
                  placeholder="Search users…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Button variant="outline">Filters</Button>
              <button className="ml-auto text-[#2E8BF0] hover:text-blue-700 text-xs font-medium">Customize</button>
            </div>

            {/* Table */}
            <Card>
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30">
                    {['First Name ↑', 'Last Name', 'Phone', 'Email', 'Role', ''].map((h) => (
                      <th key={h} className="text-left px-4 py-2.5 font-medium text-[#64748B] dark:text-[#7D93AE]">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {users
                    .filter(
                      (u) =>
                        !search ||
                        [u.first, u.last, u.email].some((v) =>
                          v.toLowerCase().includes(search.toLowerCase())
                        )
                    )
                    .map((u, i) => (
                      <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                        <td className="px-4 py-2.5 text-[#0F1923] dark:text-[#F8FAFE] font-medium">{u.first}</td>
                        <td className="px-4 py-2.5 text-[#0F1923] dark:text-[#F8FAFE]">{u.last}</td>
                        <td className="px-4 py-2.5 text-[#64748B] dark:text-[#7D93AE]">{u.phone}</td>
                        <td className="px-4 py-2.5 text-[#0F1923] dark:text-[#F8FAFE]">{u.email}</td>
                        <td className="px-4 py-2.5 text-[#0F1923] dark:text-[#F8FAFE]">{u.role}</td>
                        <td className="px-4 py-2.5 text-right">
                          <button className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 ml-auto">
                            <span className="text-base leading-none">···</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </Card>

          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// USER ROLES & PERMISSIONS
// ─────────────────────────────────────────────

const ROLE_ORDER = ['superadmin', 'admin', 'manager', 'user'];

const ROLE_USERS = {
  superadmin: ['Tim Steuer'],
  admin:      ['Duke Delaet', 'Tavo Hernandez'],
  manager:    ['Bonnie Stang'],
  user:       [],
};

// Access cell icon + color
function AccessCell({ level }) {
  if (level === 'full') {
    return (
      <div className="flex items-center justify-center">
        <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
          <svg className="w-3 h-3 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
      </div>
    );
  }
  if (level === 'limited') {
    return (
      <div className="flex items-center justify-center" title="Limited / own records only">
        <div className="w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
          <svg className="w-3 h-3 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
          </svg>
        </div>
      </div>
    );
  }
  if (level === 'view') {
    return (
      <div className="flex items-center justify-center" title="View only">
        <div className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
          <svg className="w-3 h-3 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.964-7.178z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
      </div>
    );
  }
  // none
  return (
    <div className="flex items-center justify-center">
      <div className="w-5 h-5 rounded-full bg-gray-100 dark:bg-gray-700/50 flex items-center justify-center">
        <svg className="w-3 h-3 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
        </svg>
      </div>
    </div>
  );
}

function UserRolesPage({ embedded = false }) {
  const { currentRole, setCurrentRole } = useRoles();
  const { addLog } = useAuditLog();
  const [previewRole, setPreviewRole] = useState(null);
  const [expandedGroups, setExpandedGroups] = useState(() => new Set(ACCESS_MATRIX.map((s) => s.group)));

  const toggleGroup = (group) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      next.has(group) ? next.delete(group) : next.add(group);
      return next;
    });
  };

  const activePreview = previewRole || currentRole;

  return (
    <div className="flex flex-col h-full">
      {!embedded && <PageHeader title="Roles & Permissions" />}

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-5xl space-y-5">

          {/* ── Role cards ─────────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {ROLE_ORDER.map((roleId) => {
              const role = ROLES[roleId];
              const isCurrentRole = currentRole === roleId;
              const userCount = ROLE_USERS[roleId]?.length ?? 0;
              return (
                <div
                  key={roleId}
                  className={`rounded-lg border-2 p-4 transition-all cursor-pointer ${
                    isCurrentRole
                      ? 'shadow-sm'
                      : 'border-gray-200 dark:border-[#243348] bg-white dark:bg-[#1B2A3E] hover:border-gray-300 dark:hover:border-[#2E4060]'
                  }`}
                  style={isCurrentRole ? {
                    borderColor: role.color,
                    backgroundColor: role.bg,
                  } : {}}
                  onClick={() => {
                    addLog('USER', 'ROLE_SWITCHED', { severity: 'warning', actor: { role: currentRole, label: ROLES[currentRole]?.label }, target: ROLES[roleId]?.label, details: { from: currentRole, to: roleId } });
                    setCurrentRole(roleId);
                  }}
                  title={`Switch to ${role.label} role`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: role.bg }}
                    >
                      <WMIcon name={role.icon} className="w-4 h-4 text-white" />
                    </div>
                    {isCurrentRole && (
                      <span
                        className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full"
                        style={{ backgroundColor: role.color, color: '#fff' }}
                      >
                        You
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-semibold text-[#0F1923] dark:text-[#F8FAFE] mb-0.5">{role.label}</p>
                  <p className="text-[10px] text-[#64748B] dark:text-[#7D93AE] leading-snug mb-2">{role.description}</p>
                  <div className="flex items-center gap-1 text-[10px]" style={{ color: role.color }}>
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                    </svg>
                    <span className="font-medium">{userCount} {userCount === 1 ? 'user' : 'users'}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── Role switcher note ──────────────────────────────────────────── */}
          <div className="flex items-center gap-2 px-3 py-2 rounded bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/40">
            <svg className="w-3.5 h-3.5 text-[#2E8BF0] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
            </svg>
            <p className="text-[11px] text-[#2E8BF0]">
              Click a role card above to simulate how the app appears for that role.
              Your current role is <strong>{ROLES[currentRole]?.label}</strong>.
            </p>
          </div>

          {/* ── Legend ─────────────────────────────────────────────────────── */}
          <div className="flex items-center gap-5 flex-wrap">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#64748B] dark:text-[#7D93AE]">Legend</p>
            {[
              { level: 'full',    label: 'Full Access' },
              { level: 'limited', label: 'Own Records Only' },
              { level: 'view',    label: 'View Only' },
              { level: 'none',    label: 'No Access' },
            ].map(({ level, label }) => (
              <div key={level} className="flex items-center gap-1.5">
                <AccessCell level={level} />
                <span className="text-[11px] text-[#64748B] dark:text-[#7D93AE]">{label}</span>
              </div>
            ))}
          </div>

          {/* ── Access Matrix ───────────────────────────────────────────────── */}
          <Card className="overflow-hidden">
            {/* Header row */}
            <div className="grid bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-[#243348]"
              style={{ gridTemplateColumns: '1fr 100px 100px 100px 100px' }}>
              <div className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-[#64748B] dark:text-[#7D93AE]">
                Feature / Area
              </div>
              {ROLE_ORDER.map((roleId) => {
                const role = ROLES[roleId];
                return (
                  <div key={roleId} className="px-2 py-2.5 text-center">
                    <div
                      className="text-[10px] font-semibold uppercase tracking-wider"
                      style={{ color: role.color }}
                    >
                      {role.label}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Sections */}
            {ACCESS_MATRIX.map((section) => {
              const isOpen = expandedGroups.has(section.group);
              return (
                <div key={section.group} className="border-b border-gray-100 dark:border-[#1B2A3E] last:border-0">
                  {/* Section header */}
                  <button
                    onClick={() => toggleGroup(section.group)}
                    className="w-full grid hover:bg-gray-50 dark:hover:bg-[#1B2A3E]/50 transition-colors"
                    style={{ gridTemplateColumns: '1fr 100px 100px 100px 100px' }}
                  >
                    <div className="px-4 py-2.5 flex items-center gap-2 text-left">
                      <svg
                        className={`w-3 h-3 text-gray-400 flex-shrink-0 transition-transform ${isOpen ? 'rotate-90' : ''}`}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="m9 18 6-6-6-6" />
                      </svg>
                      <span className="text-[11px] font-semibold text-[#0F1923] dark:text-[#F8FAFE]">
                        {section.group}
                      </span>
                      <span className="text-[10px] text-[#64748B] dark:text-[#7D93AE]">
                        {section.rows.length} {section.rows.length === 1 ? 'item' : 'items'}
                      </span>
                    </div>
                    {/* Summary dots for collapsed state */}
                    {!isOpen && ROLE_ORDER.map((roleId) => {
                      const levels = section.rows.map((r) => r[roleId]);
                      const worstLevel = levels.includes('none') ? 'none'
                        : levels.includes('limited') ? 'limited'
                        : levels.includes('view') ? 'view'
                        : 'full';
                      return (
                        <div key={roleId} className="flex items-center justify-center py-2.5">
                          <AccessCell level={worstLevel} />
                        </div>
                      );
                    })}
                    {isOpen && ROLE_ORDER.map((roleId) => (
                      <div key={roleId} />
                    ))}
                  </button>

                  {/* Rows */}
                  {isOpen && section.rows.map((row, ri) => (
                    <div
                      key={ri}
                      className="grid border-t border-gray-50 dark:border-[#1B2A3E] hover:bg-gray-50/60 dark:hover:bg-[#1B2A3E]/30 transition-colors"
                      style={{ gridTemplateColumns: '1fr 100px 100px 100px 100px' }}
                    >
                      <div className="pl-9 pr-4 py-2 text-[11px] text-[#64748B] dark:text-[#7D93AE]">
                        {row.label}
                      </div>
                      {ROLE_ORDER.map((roleId) => (
                        <div key={roleId} className="px-2 py-2 flex items-center justify-center">
                          <AccessCell level={row[roleId]} />
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              );
            })}
          </Card>

          {/* ── Expand/Collapse all ────────────────────────────────────────── */}
          <div className="flex gap-3">
            <button
              onClick={() => setExpandedGroups(new Set(ACCESS_MATRIX.map((s) => s.group)))}
              className="text-xs text-[#2E8BF0] hover:text-blue-700 font-medium"
            >
              Expand all
            </button>
            <span className="text-gray-300 dark:text-gray-600">·</span>
            <button
              onClick={() => setExpandedGroups(new Set())}
              className="text-xs text-[#64748B] dark:text-[#7D93AE] hover:text-[#0F1923] dark:hover:text-[#F8FAFE] font-medium"
            >
              Collapse all
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// GENERAL SETTINGS
// ─────────────────────────────────────────────

function GeneralSettingsPage() {
  const { units, setUnits } = useUnits();
  const { currentRole } = useRoles();
  const [confirmResetSetup, setConfirmResetSetup] = useState(false);
  const [repairOrders, setRepairOrders] = useState(true);
  const [condensed, setCondensed] = useState(false);
  const [addLabor, setAddLabor] = useState(true);
  const [displayCost, setDisplayCost] = useState(true);
  const [resetAuth, setResetAuth] = useState(false);

  // Notifications
  const [notifyNewEstimate, setNotifyNewEstimate] = useState(true);
  const [notifyApproved, setNotifyApproved] = useState(true);
  const [notifySMS, setNotifySMS] = useState(false);
  const [notifyDailySummary, setNotifyDailySummary] = useState(true);

  // Quote & Estimate Defaults
  const [estimateExpiry, setEstimateExpiry] = useState(30);
  const [depositPct, setDepositPct] = useState(25);
  const [autoSendEstimate, setAutoSendEstimate] = useState(false);
  const [managerApprovalThreshold, setManagerApprovalThreshold] = useState(5000);

  // Date & Number Formatting
  const [dateFormat, setDateFormat] = useState('MM/DD/YYYY');
  const [timeFormat, setTimeFormat] = useState('12h');
  const [currency, setCurrency] = useState('USD');
  const [decimalSep, setDecimalSep] = useState('period');

  // Auto-numbering
  const [estimatePrefix, setEstimatePrefix] = useState('EST-');
  const [invoicePrefix, setInvoicePrefix] = useState('INV-');
  const [startingNumber, setStartingNumber] = useState(1001);
  const [padNumbers, setPadNumbers] = useState(true);

  // Privacy & Security
  const [sessionTimeout, setSessionTimeout] = useState('30min');
  const [require2FA, setRequire2FA] = useState(false);
  const [auditLog, setAuditLog] = useState(true);
  const [crossTeamEstimates, setCrossTeamEstimates] = useState(true);

  const fees = [
    { label: 'Sales Tax',      summary: '7.25% on Parts' },
    { label: 'Shop Supplies',  summary: '15% on Labor, $1,000.00 Order Cap' },
    { label: 'EPA',            summary: '0%' },
    { label: 'Surcharge Fees', summary: '' },
  ];

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="General Settings">
        <Button variant="outline">Cancel</Button>
        <Button variant="primary">Save</Button>
      </PageHeader>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-3xl space-y-4">

          {/* Fees & Taxes */}
          <Card>
            <CardHeader title="Fees & Taxes" />
            <CardBody className="p-0">
              {fees.map((fee, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between px-5 py-3 border-b border-gray-100 dark:border-gray-700 last:border-0 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/30"
                >
                  <span className="text-xs font-medium text-[#0F1923] dark:text-[#F8FAFE]">{fee.label}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-[#64748B] dark:text-[#7D93AE]">{fee.summary}</span>
                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="m9 18 6-6-6-6" />
                    </svg>
                  </div>
                </div>
              ))}
            </CardBody>
          </Card>

          {/* Order Settings */}
          <Card>
            <CardHeader title="Order Settings" />
            <CardBody>
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-medium text-[#0F1923] dark:text-[#F8FAFE]">Enable Repair Orders</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      Adds a repair order status between estimates &amp; invoices.{' '}
                      <button className="text-[#2E8BF0] hover:text-blue-700">Learn More</button>
                    </p>
                  </div>
                  <Toggle on={repairOrders} onChange={setRepairOrders} />
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Service Card Settings */}
          <Card>
            <CardHeader title="Service Card Settings" />
            <CardBody>
              <div className="space-y-4">
                {[
                  { label: 'Condensed service cards', desc: 'Show a compact view of service cards in orders.', val: condensed, set: setCondensed },
                  { label: 'Add a labor line item when creating new services', desc: 'Automatically includes a labor line when adding a new service.', val: addLabor, set: setAddLabor },
                  { label: 'Display cost column on line items', desc: 'Shows the cost column alongside price in line item tables.', val: displayCost, set: setDisplayCost },
                ].map(({ label, desc, val, set }, i) => (
                  <div key={i} className={`flex items-start justify-between gap-4 ${i > 0 ? 'border-t border-gray-200 dark:border-[#243348] pt-4' : ''}`}>
                    <div>
                      <p className="text-xs font-medium text-[#0F1923] dark:text-[#F8FAFE]">{label}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">{desc}</p>
                    </div>
                    <Toggle on={val} onChange={set} />
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>

          {/* Vehicle Settings */}
          <Card>
            <CardHeader title="Vehicle Settings" />
            <CardBody>
              <p className="text-xs text-[#64748B] dark:text-[#7D93AE] mb-3">
                Select the vehicle types shown by default when creating and editing a vehicle.
              </p>
              <SelectInput style={{ maxWidth: 240 }}>
                <option>Vehicles: 12 of 27</option>
              </SelectInput>
            </CardBody>
          </Card>

          {/* Customer Authorization */}
          <Card>
            <CardHeader title="Customer Authorization" />
            <CardBody>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-medium text-[#0F1923] dark:text-[#F8FAFE]">
                    Reset authorization when service price increases
                  </p>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    Removes customer approval if the order total increases after authorization.
                  </p>
                </div>
                <Toggle on={resetAuth} onChange={setResetAuth} />
              </div>
            </CardBody>
          </Card>

          {/* Measurements */}
          <Card>
            <CardHeader title="Measurements" />
            <CardBody>
              <p className="text-xs font-medium text-[#0F1923] dark:text-[#F8FAFE] mb-0.5">Unit System</p>
              <p className="text-[11px] text-[#64748B] dark:text-[#7D93AE] mb-3">
                Controls how dimensions, coverage area, and material quantities are displayed throughout the app — on estimates, the dashboard, and vehicle details.
              </p>
              <div className="flex items-center gap-3">
                <div className="flex rounded border border-gray-200 dark:border-[#243348] overflow-hidden">
                  {[
                    { value: 'imperial', label: 'Imperial' },
                    { value: 'metric',   label: 'Metric' },
                  ].map(({ value, label }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setUnits(value)}
                      className={`px-5 py-2 text-xs font-medium transition-colors border-r last:border-r-0 border-gray-200 dark:border-[#243348] ${
                        units === value
                          ? 'wm-btn-primary'
                          : 'bg-white dark:bg-[#243348] text-[#64748B] dark:text-[#7D93AE] hover:bg-gray-50 dark:hover:bg-[#1B2A3E]'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-[#64748B] dark:text-[#7D93AE]">
                  Saved automatically
                </p>
              </div>
            </CardBody>
          </Card>

          {/* Notifications */}
          <Card>
            <CardHeader title="Notifications" />
            <CardBody>
              <div className="space-y-4">
                {[
                  { label: 'Email notifications for new estimates', desc: 'Receive an email whenever a new estimate is created.', val: notifyNewEstimate, set: setNotifyNewEstimate },
                  { label: 'Email notifications when estimate is approved', desc: 'Get notified when a customer approves an estimate.', val: notifyApproved, set: setNotifyApproved },
                  { label: 'SMS alerts for pending estimates > 48hrs', desc: 'Text alert when an estimate has been pending for over 48 hours.', val: notifySMS, set: setNotifySMS },
                  { label: 'Daily summary email', desc: 'Receive a daily digest of activity, estimates, and revenue.', val: notifyDailySummary, set: setNotifyDailySummary },
                ].map(({ label, desc, val, set }, i) => (
                  <div key={i} className={`flex items-start justify-between gap-4 ${i > 0 ? 'border-t border-gray-200 dark:border-[#243348] pt-4' : ''}`}>
                    <div>
                      <p className="text-xs font-medium text-[#0F1923] dark:text-[#F8FAFE]">{label}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">{desc}</p>
                    </div>
                    <Toggle on={val} onChange={set} />
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>

          {/* Quote & Estimate Defaults */}
          <Card>
            <CardHeader title="Quote & Estimate Defaults" />
            <CardBody>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Default estimate expiry (days)">
                    <TextInput type="number" min="1" value={estimateExpiry} onChange={e => setEstimateExpiry(parseInt(e.target.value) || 30)} />
                  </Field>
                  <Field label="Default deposit percentage (%)">
                    <TextInput type="number" min="0" max="100" value={depositPct} onChange={e => setDepositPct(parseInt(e.target.value) || 0)} />
                  </Field>
                </div>
                <div className="border-t border-gray-200 dark:border-[#243348] pt-4 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-medium text-[#0F1923] dark:text-[#F8FAFE]">Auto-send estimate to customer after creation</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">Automatically emails the estimate to the customer when it is created.</p>
                  </div>
                  <Toggle on={autoSendEstimate} onChange={setAutoSendEstimate} />
                </div>
                <div className="border-t border-gray-200 dark:border-[#243348] pt-4">
                  <Field label="Require manager approval for estimates over ($)">
                    <TextInput type="number" min="0" value={managerApprovalThreshold} onChange={e => setManagerApprovalThreshold(parseFloat(e.target.value) || 0)} />
                  </Field>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Date & Number Formatting */}
          <Card>
            <CardHeader title="Date & Number Formatting" />
            <CardBody>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Date format">
                  <SelectInput value={dateFormat} onChange={e => setDateFormat(e.target.value)}>
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                  </SelectInput>
                </Field>
                <Field label="Currency">
                  <SelectInput value={currency} onChange={e => setCurrency(e.target.value)}>
                    <option value="USD">USD — US Dollar</option>
                    <option value="CAD">CAD — Canadian Dollar</option>
                    <option value="EUR">EUR — Euro</option>
                    <option value="GBP">GBP — British Pound</option>
                  </SelectInput>
                </Field>
                <Field label="Time format">
                  <div className="flex rounded border border-gray-200 dark:border-[#243348] overflow-hidden h-8">
                    {[{ val: '12h', label: '12-hour' }, { val: '24h', label: '24-hour' }].map(({ val, label }) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setTimeFormat(val)}
                        className={`flex-1 text-xs font-medium transition-colors border-r last:border-r-0 border-gray-200 dark:border-[#243348] ${
                          timeFormat === val ? 'wm-btn-primary' : 'bg-white dark:bg-[#243348] text-[#64748B] dark:text-[#7D93AE] hover:bg-gray-50 dark:hover:bg-[#1B2A3E]'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </Field>
                <Field label="Decimal separator">
                  <SelectInput value={decimalSep} onChange={e => setDecimalSep(e.target.value)}>
                    <option value="period">Period (1,234.56)</option>
                    <option value="comma">Comma (1.234,56)</option>
                  </SelectInput>
                </Field>
              </div>
            </CardBody>
          </Card>

          {/* Auto-numbering */}
          <Card>
            <CardHeader title="Auto-Numbering" />
            <CardBody>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <Field label="Estimate prefix">
                  <TextInput value={estimatePrefix} onChange={e => setEstimatePrefix(e.target.value)} />
                </Field>
                <Field label="Invoice prefix">
                  <TextInput value={invoicePrefix} onChange={e => setInvoicePrefix(e.target.value)} />
                </Field>
                <Field label="Starting number">
                  <TextInput type="number" min="1" value={startingNumber} onChange={e => setStartingNumber(parseInt(e.target.value) || 1001)} />
                </Field>
                <div className="flex items-end pb-0.5">
                  <div className="flex items-center gap-2">
                    <Toggle on={padNumbers} onChange={setPadNumbers} />
                    <div>
                      <p className="text-xs font-medium text-[#0F1923] dark:text-[#F8FAFE]">Pad to 4 digits</p>
                      <p className="text-[11px] text-gray-400">e.g. EST-0042</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="rounded border border-gray-100 dark:border-[#243348] bg-gray-50 dark:bg-[#0F1923]/40 px-3 py-2 text-[11px] text-[#64748B] dark:text-[#7D93AE]">
                Preview: <span className="font-mono font-semibold text-[#0F1923] dark:text-[#F8FAFE]">{estimatePrefix}{padNumbers ? String(startingNumber).padStart(4, '0') : startingNumber}</span>
              </div>
            </CardBody>
          </Card>

          {/* Privacy & Security */}
          <Card>
            <CardHeader title="Privacy & Security" />
            <CardBody>
              <div className="space-y-4">
                <Field label="Session timeout">
                  <SelectInput value={sessionTimeout} onChange={e => setSessionTimeout(e.target.value)} style={{ maxWidth: 200 }}>
                    <option value="15min">15 minutes</option>
                    <option value="30min">30 minutes</option>
                    <option value="1hr">1 hour</option>
                    <option value="never">Never</option>
                  </SelectInput>
                </Field>
                {[
                  { label: 'Require 2FA for admin accounts', desc: 'Admins must use two-factor authentication to sign in.', val: require2FA, set: setRequire2FA },
                  { label: 'Log all user actions to audit log', desc: 'Records every action taken by users for compliance and review.', val: auditLog, set: setAuditLog },
                  { label: "Allow estimators to see other team's estimates", desc: 'When off, estimators can only view their own estimates.', val: crossTeamEstimates, set: setCrossTeamEstimates },
                ].map(({ label, desc, val, set }, i) => (
                  <div key={i} className="border-t border-gray-200 dark:border-[#243348] pt-4 flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-medium text-[#0F1923] dark:text-[#F8FAFE]">{label}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">{desc}</p>
                    </div>
                    <Toggle on={val} onChange={set} />
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>

          {/* ── Setup Wizard (admin/superadmin only) ─────────────────────── */}
          {(currentRole === 'superadmin' || currentRole === 'admin') && (
            <Card>
              <CardHeader title="Setup Wizard" />
              <CardBody>
                <div className="flex items-start gap-4">
                  <div className="w-9 h-9 rounded-lg bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-[#0F1923] dark:text-[#F8FAFE]">Restart Setup Wizard</p>
                    <p className="text-[11px] text-gray-400 mt-0.5 leading-relaxed">
                      Re-run the initial setup to reconfigure your shop profile, services, labor rates, and materials from scratch.
                    </p>

                    {!confirmResetSetup ? (
                      <button
                        onClick={() => setConfirmResetSetup(true)}
                        className="mt-3 h-8 px-3 rounded border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 text-xs font-semibold text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors flex items-center gap-1.5"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                        </svg>
                        Restart Setup Wizard
                      </button>
                    ) : (
                      <div className="mt-3 p-3 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 space-y-2.5">
                        <div className="flex items-start gap-2">
                          <svg className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                          </svg>
                          <p className="text-xs font-semibold text-red-700 dark:text-red-400">
                            Are you sure? This will clear your shop profile, labor rates, and material catalog and restart the setup wizard on next login.
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              ['wm-setup-complete','wm-shop-profile','wm-shop-logo','wm-labor-rates-v1','wm-materials-catalog','wm-target-margin'].forEach(k => localStorage.removeItem(k));
                              window.location.reload();
                            }}
                            className="h-7 px-3 rounded text-xs font-semibold text-white bg-red-500 hover:bg-red-600 transition-colors"
                          >
                            Yes, erase &amp; restart
                          </button>
                          <button
                            onClick={() => setConfirmResetSetup(false)}
                            className="h-7 px-3 rounded text-xs font-medium text-[#64748B] dark:text-[#7D93AE] hover:bg-gray-100 dark:hover:bg-[#243348] transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardBody>
            </Card>
          )}

        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// APPEARANCE (existing logic, new layout)
// ─────────────────────────────────────────────

const ACCENT_LABELS = {
  blue:       'Blue',
  violet:     'Violet',
  emerald:    'Emerald',
  rose:       'Rose',
  amber:      'Amber',
  slate:      'Slate',
  cyan:       'Cyan',
  indigo:     'Indigo',
  neonGreen:  'Neon Green',
  neonPink:   'Neon Pink',
  neonOrange: 'Neon Orange',
  custom:     'Custom',
};

function ThemeSwatch({ id, theme, active, onClick }) {
  const [a, b] = theme.swatch;
  return (
    <button
      onClick={onClick}
      title={theme.name}
      className={`flex flex-col items-center gap-1.5 p-2 rounded-lg border-2 transition-all hover:scale-105 ${
        active ? 'border-[#2E8BF0] bg-[#2E8BF0]/5' : 'border-transparent hover:border-gray-200 dark:hover:border-[#243348]'
      }`}
    >
      {/* Two-tone circle swatch */}
      <svg width="36" height="36" viewBox="0 0 36 36">
        <defs>
          <clipPath id={`clip-${id}`}>
            <circle cx="18" cy="18" r="16" />
          </clipPath>
        </defs>
        <circle cx="18" cy="18" r="16" fill={a} />
        <rect x="18" y="2" width="16" height="32" fill={b} clipPath={`url(#clip-${id})`} />
        {active && (
          <circle cx="18" cy="18" r="16" fill="none" stroke="white" strokeWidth="1.5" opacity="0.4" />
        )}
      </svg>
      <span className={`text-[10px] font-medium ${active ? 'text-[#2E8BF0]' : 'text-[#64748B] dark:text-[#7D93AE]'}`}>
        {theme.name}
      </span>
      {active && (
        <span className="w-1.5 h-1.5 rounded-full bg-[#2E8BF0]" />
      )}
    </button>
  );
}

// ─────────────────────────────────────────────
// USER PROFILE PAGE (personal, not shop)
// ─────────────────────────────────────────────

const AVATAR_COLORS = ['#2563eb','#7c3aed','#db2777','#dc2626','#d97706','#16a34a','#0891b2','#64748b'];

function UserProfilePage() {
  const { currentRole } = useRoles();
  const role = ROLES[currentRole];
  const [form, setForm] = useState(() => {
    try { return { displayName: '', title: '', personalEmail: '', avatarColor: AVATAR_COLORS[0], avatarUrl: null, ...JSON.parse(localStorage.getItem('wm-user-profile') || '{}') }; }
    catch { return { displayName: '', title: '', personalEmail: '', avatarColor: AVATAR_COLORS[0], avatarUrl: null }; }
  });
  const [saved, setSaved] = useState(false);
  const [avatarDrag, setAvatarDrag] = useState(false);
  const avatarInputRef = useRef(null);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const initials = (form.displayName || 'WM').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

  const handleSave = () => {
    localStorage.setItem('wm-user-profile', JSON.stringify(form));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleAvatarFile = (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => setForm(f => ({ ...f, avatarUrl: e.target.result }));
    reader.readAsDataURL(file);
  };

  const handleAvatarDrop = (e) => {
    e.preventDefault();
    setAvatarDrag(false);
    const file = e.dataTransfer.files[0];
    if (file) handleAvatarFile(file);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="h-10 bg-white dark:bg-[#1B2A3E] border-b border-gray-200 dark:border-[#243348] flex items-center justify-between px-6 flex-shrink-0">
        <span className="text-sm font-semibold text-[#0F1923] dark:text-[#F8FAFE]">My Profile</span>
        <div className="flex items-center gap-2">
          {saved && <span className="text-xs text-emerald-500 font-medium">Saved ✓</span>}
          <Button variant="primary" size="sm" onClick={handleSave}>Save Changes</Button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-6 space-y-5">

        {/* Avatar section */}
        <Card>
          <CardHeader title="Profile Photo" />
          <CardBody>
            <div className="flex items-center gap-5">
              {/* Avatar preview */}
              <div
                className={`relative w-20 h-20 rounded-full flex-shrink-0 cursor-pointer group border-2 transition-colors ${avatarDrag ? 'border-[#2E8BF0]' : 'border-transparent'}`}
                onClick={() => avatarInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setAvatarDrag(true); }}
                onDragLeave={() => setAvatarDrag(false)}
                onDrop={handleAvatarDrop}
                title="Click or drop an image to set your avatar"
              >
                {form.avatarUrl ? (
                  <img src={form.avatarUrl} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <div className="w-full h-full rounded-full flex items-center justify-center text-xl font-bold text-white"
                    style={{ background: `linear-gradient(135deg, ${form.avatarColor}, ${form.avatarColor}bb)` }}>
                    {initials}
                  </div>
                )}
                <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                  </svg>
                </div>
              </div>
              <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={e => handleAvatarFile(e.target.files[0])} />

              <div className="flex-1 space-y-3">
                <div>
                  <p className={labelCls}>Avatar color</p>
                  <div className="flex gap-2 flex-wrap">
                    {AVATAR_COLORS.map(c => (
                      <button key={c} onClick={() => setForm(f => ({ ...f, avatarColor: c, avatarUrl: null }))}
                        className="w-7 h-7 rounded-full transition-transform hover:scale-110 flex items-center justify-center"
                        style={{ backgroundColor: c }}>
                        {form.avatarColor === c && !form.avatarUrl && (
                          <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                          </svg>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
                {form.avatarUrl && (
                  <button onClick={() => setForm(f => ({ ...f, avatarUrl: null }))}
                    className="text-xs text-red-500 hover:underline">Remove photo</button>
                )}
                <p className="text-[10px] text-gray-400">Click the avatar or drop an image to upload a custom photo. PNG, JPG, WebP — max 2 MB.</p>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Identity */}
        <Card>
          <CardHeader title="Identity" />
          <CardBody>
            <div className="space-y-4">
              <Field label="Display Name" hint="Shown in the top bar and account dropdown">
                <TextInput value={form.displayName} onChange={set('displayName')} placeholder="Your full name" />
              </Field>
              <Field label="Job Title" hint="Your role or position at the shop">
                <TextInput value={form.title} onChange={set('title')} placeholder="e.g. Lead Installer, Shop Manager" />
              </Field>
              <Field label="Personal Email" hint="Used for account notifications — separate from your shop email">
                <TextInput type="email" value={form.personalEmail} onChange={set('personalEmail')} placeholder="you@example.com" />
              </Field>
            </div>
          </CardBody>
        </Card>

        {/* Current role (read-only) */}
        <Card>
          <CardHeader title="Role & Access" />
          <CardBody>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ backgroundColor: role?.bg }}>
                <WMIcon name={role?.icon} className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-xs font-semibold text-[#0F1923] dark:text-[#F8FAFE]">{role?.label}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">Your role is managed by an administrator — contact your shop owner to change it.</p>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Password placeholder */}
        <Card>
          <CardHeader title="Security" />
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-[#0F1923] dark:text-[#F8FAFE]">Password</p>
                <p className="text-[11px] text-gray-400 mt-0.5">Last changed: never</p>
              </div>
              <Button variant="outline" size="sm" disabled>Change Password</Button>
            </div>
          </CardBody>
        </Card>

      </div>
    </div>
  );
}

function AppearancePage() {
  const { mode, setMode, accent, setAccent, customAccentHex, setCustomAccentHex, navTheme, setNavTheme, customNavVars, setCustomNavVars, fontSize, setFontSize, fontFamily, setFontFamily, density, setDensity, borderRadius, setBorderRadius, reduceMotion, setReduceMotion, cardStyle, setCardStyle, highContrast, setHighContrast, colorBlindMode, setColorBlindMode, moduleGap, setModuleGap } = useTheme();
  const { currentRole } = useRoles();
  const { addLog } = useAuditLog();
  const { lang, setLang, t: tLang } = useLanguage();
  const { tickerEnabled, setTickerEnabled, tickerSpeed, setTickerSpeed, tickerCategories, setTickerCategory } = useTicker();
  const { tooltipsEnabled, setTooltipsEnabled, simpleMode, setSimpleMode } = useFeatureFlags();
  const [celebrationsEnabled, setCelebrationsEnabled] = useState(
    () => localStorage.getItem('wm-celebrations') !== 'false'
  );
  const [langSaved, setLangSaved] = useState(false);
  const [themeTab, setThemeTab] = useState('presets');

  const LANG_OPTIONS = [
    { id: 'en', label: 'English', native: 'English', flag: 'EN', desc: 'Full UI translation — all labels, navigation, and actions.' },
    { id: 'es', label: 'Spanish', native: 'Español',  flag: 'ES', desc: 'Traducción completa de la interfaz — etiquetas, navegación y acciones.' },
  ];

  const handleLangSelect = (id) => {
    setLang(id);
    setLangSaved(true);
    setTimeout(() => setLangSaved(false), 2000);
  };

  const activePresetVars = navTheme === 'custom'
    ? customNavVars
    : NAV_THEMES[navTheme]?.vars || NAV_THEMES.wrapmind.vars;

  const handleSwitchToCustom = () => {
    setThemeTab('custom');
    // Init custom vars from current preset if not already set
    if (navTheme !== 'custom') {
      setCustomNavVars({ ...activePresetVars });
    }
  };

  const handleCustomVarChange = (key, value) => {
    const updated = { ...activePresetVars, [key]: value };
    setCustomNavVars(updated);
  };

  const handleExportPreferences = () => {
    const prefs = {
      // Theme
      theme: {
        mode,
        accent,
        customAccentHex,
        navTheme,
        customNavVars: navTheme === 'custom' ? customNavVars : null,
        fontSize,
        fontFamily,
        density,
        borderRadius,
        cardStyle,
        highContrast,
        colorBlindMode,
        reduceMotion,
        moduleGap,
      },
      // Dashboard
      dashboardMode: (() => { try { return localStorage.getItem('wm-dashboard-mode') || 'essentials'; } catch { return 'essentials'; } })(),
      dashboardOrder: (() => { try { return JSON.parse(localStorage.getItem('wm-dashboard-order') || 'null'); } catch { return null; } })(),
      widgetConfigs:  (() => { try { return JSON.parse(localStorage.getItem('wm-widget-configs') || 'null'); } catch { return null; } })(),
      kpiThresholds:  (() => { try { return JSON.parse(localStorage.getItem('wm-kpi-thresholds') || 'null'); } catch { return null; } })(),
      // Ticker
      ticker: {
        enabled: (() => { try { return localStorage.getItem('wm-ticker-disabled') !== 'true'; } catch { return true; } })(),
        speed:   (() => { try { return localStorage.getItem('wm-ticker-speed-v2') || 'medium'; } catch { return 'medium'; } })(),
        categories: (() => { try { return JSON.parse(localStorage.getItem('wm-ticker-categories-v1') || 'null'); } catch { return null; } })(),
      },
      // Language
      language: (() => { try { return localStorage.getItem('wm-language') || 'en'; } catch { return 'en'; } })(),
      // Scheduling settings (non-PII)
      schedulingSettings: (() => { try { return JSON.parse(localStorage.getItem('wm-scheduling-settings-v1') || 'null'); } catch { return null; } })(),
    };
    const blob = new Blob([JSON.stringify(prefs, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'wrapmind-preferences.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleResetDashboard = () => {
    localStorage.removeItem('wm-dashboard-order');
    localStorage.removeItem('wm-widget-configs');
    window.location.reload();
  };

  const importRef = useRef(null);

  const handleImportPreferences = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const prefs = JSON.parse(evt.target.result);

        // Theme
        if (prefs.theme?.mode)          setMode(prefs.theme.mode);
        if (prefs.theme?.accent)        setAccent(prefs.theme.accent);
        if (prefs.theme?.customAccentHex) setCustomAccentHex(prefs.theme.customAccentHex);
        if (prefs.theme?.navTheme)      setNavTheme(prefs.theme.navTheme);
        if (prefs.theme?.customNavVars) setCustomNavVars(prefs.theme.customNavVars);
        if (prefs.theme?.fontSize)      setFontSize(prefs.theme.fontSize);
        if (prefs.theme?.fontFamily)    setFontFamily(prefs.theme.fontFamily);
        if (prefs.theme?.density)       setDensity(prefs.theme.density);
        if (prefs.theme?.borderRadius)  setBorderRadius(prefs.theme.borderRadius);
        if (prefs.theme?.cardStyle)     setCardStyle(prefs.theme.cardStyle);
        if (typeof prefs.theme?.highContrast === 'boolean') setHighContrast(prefs.theme.highContrast);
        if (prefs.theme?.colorBlindMode) setColorBlindMode(prefs.theme.colorBlindMode);
        if (typeof prefs.theme?.reduceMotion === 'boolean') setReduceMotion(prefs.theme.reduceMotion);
        if (prefs.theme?.moduleGap)     setModuleGap(prefs.theme.moduleGap);

        // Dashboard
        if (prefs.dashboardMode) localStorage.setItem('wm-dashboard-mode', prefs.dashboardMode);
        if (prefs.dashboardOrder) localStorage.setItem('wm-dashboard-order', JSON.stringify(prefs.dashboardOrder));
        if (prefs.widgetConfigs)  localStorage.setItem('wm-widget-configs',  JSON.stringify(prefs.widgetConfigs));
        if (prefs.kpiThresholds)  localStorage.setItem('wm-kpi-thresholds',  JSON.stringify(prefs.kpiThresholds));

        // Ticker
        if (typeof prefs.ticker?.enabled === 'boolean') localStorage.setItem('wm-ticker-disabled', String(!prefs.ticker.enabled));
        if (prefs.ticker?.speed) localStorage.setItem('wm-ticker-speed-v2', prefs.ticker.speed);
        if (prefs.ticker?.categories) localStorage.setItem('wm-ticker-categories-v1', JSON.stringify(prefs.ticker.categories));

        // Language
        if (prefs.language) localStorage.setItem('wm-language', prefs.language);

        // Scheduling settings
        if (prefs.schedulingSettings) localStorage.setItem('wm-scheduling-settings-v1', JSON.stringify(prefs.schedulingSettings));

        window.location.reload();
      } catch {
        // invalid file — silently ignore
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Appearance" />
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-lg space-y-4">

          {/* ── 1. Color Mode ─────────────────────────────────────────────────── */}
          <Card>
            <CardHeader title="Color Mode" />
            <CardBody>
              <p className="text-[11px] text-gray-400 dark:text-[#4A6080] mb-3">Sets the global light or dark theme for the entire interface.</p>
              <div className="flex gap-1.5">
                {['light', 'dark', 'system'].map((m) => (
                  <button
                    key={m}
                    onClick={() => { addLog('SETTINGS', 'DISPLAY_MODE_CHANGED', { severity: 'info', actor: { role: currentRole, label: ROLES[currentRole]?.label }, target: m, details: { from: mode, to: m } }); setMode(m); }}
                    className={`flex-1 h-8 rounded border text-xs font-medium transition-colors capitalize ${
                      mode === m
                        ? 'wm-btn-primary border-[var(--btn-primary-bg)]'
                        : 'bg-white dark:bg-[#243348] text-[#64748B] dark:text-[#7D93AE] border-gray-200 dark:border-[#243348] hover:bg-gray-50 dark:hover:bg-[#1B2A3E]'
                    }`}
                  >
                    <span className="flex items-center justify-center gap-1.5">
                      {m === 'light' && <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" /></svg>}
                      {m === 'dark' && <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" /></svg>}
                      {m === 'system' && <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 0 1-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0 1 15 18.257V17.25m6-12V15a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 15V5.25m18 0A2.25 2.25 0 0 0 18.75 3H5.25A2.25 2.25 0 0 0 3 5.25m18 0H3" /></svg>}
                      {m.charAt(0).toUpperCase() + m.slice(1)}
                    </span>
                  </button>
                ))}
              </div>
            </CardBody>
          </Card>

          {/* ── 2. Interface Mode ──────────────────────────────────────────────── */}
          <Card>
            <CardHeader title="Interface Mode" />
            <CardBody>
              {/* Simple / Advanced toggle row */}
              <div className={`rounded-xl border-2 transition-colors p-4 ${
                simpleMode
                  ? 'border-[#2E8BF0]/50 bg-[#2E8BF0]/5 dark:bg-[#2E8BF0]/10'
                  : 'border-gray-200 dark:border-[#243348] bg-gray-50 dark:bg-[#0F1923]'
              }`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    {/* Icon */}
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                      simpleMode ? 'bg-[#2E8BF0] text-white' : 'bg-gray-100 dark:bg-[#243348] text-gray-400 dark:text-[#7D93AE]'
                    }`}>
                      {simpleMode ? (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6z" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 13.5V3.75m0 9.75a1.5 1.5 0 010 3m0-3a1.5 1.5 0 000 3m0 3.75V16.5m12-3V3.75m0 9.75a1.5 1.5 0 010 3m0-3a1.5 1.5 0 000 3m0 3.75V16.5m-6-9V3.75m0 3.75a1.5 1.5 0 010 3m0-3a1.5 1.5 0 000 3m0 9.75V10.5" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm font-semibold text-[#0F1923] dark:text-[#F8FAFE]">
                          {simpleMode ? 'Simple Mode' : 'Advanced Mode'}
                        </p>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide ${
                          simpleMode
                            ? 'bg-[#2E8BF0]/20 text-[#2E8BF0]'
                            : 'bg-gray-100 dark:bg-[#243348] text-gray-500 dark:text-[#7D93AE]'
                        }`}>
                          {simpleMode ? 'On' : 'Off'}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500 dark:text-[#7D93AE] leading-relaxed">
                        {simpleMode
                          ? 'Showing only essential tools: Dashboard, Estimates, Leads, Customers, and Invoices. Advanced modules are hidden.'
                          : 'All modules visible. Switch to Simple Mode to hide advanced sections and streamline the navigation for day-to-day use.'}
                      </p>
                    </div>
                  </div>
                  <Toggle on={simpleMode} onChange={setSimpleMode} />
                </div>

                {/* What changes chips */}
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-[#243348] flex flex-wrap gap-1.5">
                  {[
                    { label: 'Dashboard', always: true },
                    { label: 'Estimates', always: true },
                    { label: 'Leads & Customers', always: true },
                    { label: 'Invoices', always: true },
                    { label: 'Reports', hidden: true },
                    { label: 'Workflow', hidden: true },
                    { label: 'Performance', hidden: true },
                    { label: 'Scheduling', hidden: true },
                    { label: 'Marketing', hidden: true },
                    { label: 'Orders', hidden: true },
                  ].map(chip => {
                    const isHidden = simpleMode && chip.hidden;
                    return (
                      <span
                        key={chip.label}
                        className={`text-[10px] font-medium px-2 py-0.5 rounded-full transition-all ${
                          chip.always
                            ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                            : isHidden
                              ? 'bg-gray-100 dark:bg-[#243348] text-gray-400 dark:text-[#4A6380] line-through opacity-60'
                              : 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400'
                        }`}
                      >
                        {chip.label}
                      </span>
                    );
                  })}
                </div>
              </div>
            </CardBody>
          </Card>

          {/* ── 3. Language ───────────────────────────────────────────────────── */}
          <Card>
            <CardHeader title="Language" />
            <CardBody>
              <div className="space-y-2">
                {LANG_OPTIONS.map((opt) => {
                  const active = lang === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => handleLangSelect(opt.id)}
                      className={`w-full flex items-center gap-4 p-3 rounded-lg border-2 text-left transition-all ${
                        active
                          ? 'border-[#2E8BF0] bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-[#243348] bg-white dark:bg-[#1B2A3E] hover:border-gray-300 dark:hover:border-[#2E4060]'
                      }`}
                    >
                      <span className="text-2xl flex-shrink-0">{opt.flag}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-semibold text-[#0F1923] dark:text-[#F8FAFE]">{opt.native}</p>
                          {opt.native !== opt.label && (
                            <p className="text-xs text-[#64748B] dark:text-[#7D93AE]">({opt.label})</p>
                          )}
                        </div>
                        <p className="text-[11px] text-[#64748B] dark:text-[#7D93AE] mt-0.5 leading-relaxed">{opt.desc}</p>
                      </div>
                      {active && (
                        <div className="flex-shrink-0 w-4 h-4 rounded-full bg-[#2E8BF0] flex items-center justify-center">
                          <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                          </svg>
                        </div>
                      )}
                    </button>
                  );
                })}
                {langSaved && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                    <svg className="w-3.5 h-3.5 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    <p className="text-xs font-medium text-green-700 dark:text-green-400">{tLang('language.saved')}</p>
                  </div>
                )}
                <p className="text-[11px] text-[#64748B] dark:text-[#7D93AE] leading-relaxed">More languages coming soon.</p>
              </div>
            </CardBody>
          </Card>

          {/* ── 4. Navigation Theme (Slack-style) ───────────────────────────────── */}
          <Card>
            <CardHeader title="Navigation Theme" />
            <CardBody>
              <p className="text-[11px] text-gray-400 dark:text-[#4A6080] mb-3">Customize the sidebar with curated palettes or build your own.</p>
              {/* Tab bar */}
              <div className="flex border-b border-gray-200 dark:border-[#243348] mb-4 -mx-4 px-4">
                {[['presets', 'WrapMind Themes'], ['custom', 'Custom theme']].map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => key === 'custom' ? handleSwitchToCustom() : setThemeTab('presets')}
                    className={`pb-2 mr-5 text-xs font-medium border-b-2 -mb-px transition-colors ${
                      themeTab === key
                        ? 'text-[#2E8BF0] border-[#2E8BF0]'
                        : 'text-[#64748B] dark:text-[#7D93AE] border-transparent hover:text-[#0F1923] dark:hover:text-[#F8FAFE]'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {themeTab === 'presets' && (
                <div className="grid grid-cols-4 gap-1">
                  {Object.entries(NAV_THEMES).map(([id, theme]) => (
                    <ThemeSwatch
                      key={id}
                      id={id}
                      theme={theme}
                      active={navTheme === id}
                      onClick={() => {
                        addLog('SETTINGS', 'THEME_CHANGED', { severity: 'info', actor: { role: currentRole, label: ROLES[currentRole]?.label }, target: NAV_THEMES[id]?.name, details: { from: navTheme, to: id } });
                        setNavTheme(id);
                        setThemeTab('presets');
                      }}
                    />
                  ))}
                </div>
              )}

              {themeTab === 'custom' && (
                <div className="space-y-3">
                  <p className="text-[11px] text-[#64748B] dark:text-[#7D93AE]">Fine-tune each color slot. Changes apply instantly.</p>
                  {[
                    { label: 'Navigation background', key: '--wm-nav-bg' },
                    { label: 'Active item color',     key: '--wm-nav-accent' },
                    { label: 'Navigation text',        key: '--wm-nav-text' },
                    { label: 'Active item text',       key: '--wm-nav-text-active' },
                  ].map(({ label, key }) => (
                    <div key={key} className="flex items-center justify-between gap-3">
                      <label className="text-xs text-[#0F1923] dark:text-[#F8FAFE] flex-1">{label}</label>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-8 h-8 rounded border border-gray-200 dark:border-[#243348] overflow-hidden cursor-pointer relative"
                          title={activePresetVars[key] || '#000000'}
                        >
                          <input
                            type="color"
                            value={activePresetVars[key]?.startsWith('#') ? activePresetVars[key] : '#1B2A3E'}
                            onChange={(e) => handleCustomVarChange(key, e.target.value)}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          />
                          <div className="w-full h-full" style={{ backgroundColor: activePresetVars[key] || '#1B2A3E' }} />
                        </div>
                        <span className="text-[11px] font-mono text-[#64748B] dark:text-[#7D93AE] w-16 truncate">
                          {activePresetVars[key] || '—'}
                        </span>
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={() => { setNavTheme('wrapmind'); setThemeTab('presets'); }}
                    className="text-xs text-[#64748B] dark:text-[#7D93AE] hover:text-[#0F1923] dark:hover:text-[#F8FAFE] transition-colors mt-1"
                  >
                    ← Reset to default theme
                  </button>
                </div>
              )}
            </CardBody>
          </Card>

          {/* ── 5. Accent color ─────────────────────────────────────────────────── */}
          <Card>
            <CardHeader title="Accent Color" />
            <CardBody>
              <p className="text-[11px] text-gray-400 dark:text-[#4A6080] mb-3">Your primary interaction color — used on buttons, selections, and active highlights.</p>
              <div className="grid grid-cols-6 gap-2">
                {Object.entries(ACCENT_PALETTES).map(([key, palette]) => (
                  <button
                    key={key}
                    onClick={() => { addLog('SETTINGS', 'ACCENT_CHANGED', { severity: 'info', actor: { role: currentRole, label: ROLES[currentRole]?.label }, target: key, details: { from: accent, to: key } }); setAccent(key); }}
                    className="flex flex-col items-center gap-1"
                    title={ACCENT_LABELS[key]}
                  >
                    <div
                      className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${
                        accent === key ? 'border-gray-900 dark:border-gray-100 scale-110' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: palette.primary }}
                    />
                    <span className={`text-[10px] ${accent === key ? 'text-[#0F1923] dark:text-[#F8FAFE] font-medium' : 'text-gray-400'}`}>
                      {ACCENT_LABELS[key]}
                    </span>
                  </button>
                ))}
                {/* Custom color */}
                <div className="flex flex-col items-center gap-1">
                  <label
                    className={`w-8 h-8 rounded-full border-2 cursor-pointer transition-transform hover:scale-110 relative overflow-hidden flex items-center justify-center ${
                      accent === 'custom'
                        ? 'border-[var(--wm-text-primary,#0F1923)] dark:border-white scale-110 ring-2 ring-offset-1 ring-[var(--accent-primary)]'
                        : 'border-gray-200 dark:border-[#243348]'
                    }`}
                    style={{ backgroundColor: customAccentHex }}
                    title="Custom color"
                  >
                    <input
                      type="color"
                      className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                      value={customAccentHex}
                      onChange={e => {
                        setCustomAccentHex(e.target.value);
                        setAccent('custom');
                      }}
                    />
                    {accent !== 'custom' && (
                      <svg className="w-3 h-3 text-white mix-blend-difference pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                      </svg>
                    )}
                  </label>
                  <span className={`text-[10px] ${accent === 'custom' ? 'font-semibold text-[#0F1923] dark:text-[#F8FAFE]' : 'text-gray-400 dark:text-[#7D93AE]'}`}>
                    Custom
                  </span>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* ── 6. Typography ───────────────────────────────────────────────────── */}
          <Card>
            <CardHeader title="Typography">
              <Tooltip
                text="Controls all UI text, form labels, and printed estimate documents."
                position="bottom"
                forceShow
              >
                <button
                  type="button"
                  className="w-4 h-4 rounded-full border border-gray-300 dark:border-[#364860] text-[#64748B] dark:text-[#7D93AE] text-[10px] leading-none flex items-center justify-center hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)] focus:outline-none focus:ring-1 focus:ring-[#2E8BF0] transition-colors"
                  aria-label="Typography info"
                >
                  ?
                </button>
              </Tooltip>
            </CardHeader>
            <CardBody>
              <p className="text-[11px] text-gray-400 dark:text-[#4A6080] mb-3">Text size and font family.</p>
              <div className="space-y-6">

                {/* Font size slider */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className={labelCls}>Text Size</label>
                    <span className="text-xs font-medium text-[#0F1923] dark:text-[#F8FAFE] tabular-nums">
                      {FONT_SIZE_LABELS[fontSize]} — {FONT_SIZE_MAP[fontSize]}
                    </span>
                  </div>

                  {/* Slider */}
                  <div className="relative">
                    <input
                      type="range"
                      min="0"
                      max={FONT_SIZE_STEPS.length - 1}
                      step="1"
                      value={FONT_SIZE_STEPS.indexOf(fontSize)}
                      onChange={e => { const v = FONT_SIZE_STEPS[+e.target.value]; addLog('SETTINGS', 'FONT_SIZE_CHANGED', { severity: 'info', actor: { role: currentRole, label: ROLES[currentRole]?.label }, target: v, details: { from: fontSize, to: v } }); setFontSize(v); }}
                      className="w-full h-1.5 rounded appearance-none cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, var(--accent-primary) 0%, var(--accent-primary) ${(FONT_SIZE_STEPS.indexOf(fontSize) / (FONT_SIZE_STEPS.length - 1)) * 100}%, var(--wm-bg-border, #243348) ${(FONT_SIZE_STEPS.indexOf(fontSize) / (FONT_SIZE_STEPS.length - 1)) * 100}%, var(--wm-bg-border, #243348) 100%)`,
                        accentColor: 'var(--accent-primary)',
                      }}
                    />
                  </div>

                  {/* Step labels */}
                  <div className="flex justify-between mt-1.5 px-0.5">
                    {FONT_SIZE_STEPS.map((step, i) => (
                      <button
                        key={step}
                        onClick={() => setFontSize(step)}
                        className={`text-[10px] transition-colors ${
                          fontSize === step
                            ? 'text-[#2E8BF0] font-semibold'
                            : 'text-gray-400 dark:text-[#4A6080] hover:text-[#64748B]'
                        }`}
                      >
                        {FONT_SIZE_LABELS[step]}
                      </button>
                    ))}
                  </div>

                  {/* Live preview */}
                  <div className="mt-3 rounded border border-gray-200 dark:border-[#243348] px-4 py-3 bg-gray-50 dark:bg-[#0F1923]">
                    <p
                      style={{
                        fontSize: FONT_SIZE_MAP[fontSize],
                        fontFamily: fontFamily === 'serif' ? "'Lora', Georgia, serif" : "'Inter', sans-serif",
                        lineHeight: 1.5,
                      }}
                      className="text-[#0F1923] dark:text-[#F8FAFE] font-medium"
                    >
                      The quick brown fox jumps over the lazy dog.
                    </p>
                    <p
                      style={{
                        fontSize: `calc(${FONT_SIZE_MAP[fontSize]} * 0.857)`,
                        fontFamily: fontFamily === 'serif' ? "'Lora', Georgia, serif" : "'Inter', sans-serif",
                      }}
                      className="text-[#64748B] dark:text-[#7D93AE] mt-1"
                    >
                      Invoice #1042 · Full wrap estimate for 2024 Tesla Model 3 Long Range
                    </p>
                  </div>
                </div>

                {/* Font family */}
                <div>
                  <label className={`${labelCls} block mb-2.5`}>Font Family</label>
                  <div className="flex gap-3">
                    {[
                      {
                        key: 'sans',
                        label: 'Sans-serif',
                        sublabel: 'Inter — clean & modern',
                        sample: 'Aa Bb Cc',
                        style: { fontFamily: "'Inter', sans-serif" },
                      },
                      {
                        key: 'serif',
                        label: 'Serif',
                        sublabel: 'Lora — warm & editorial',
                        sample: 'Aa Bb Cc',
                        style: { fontFamily: "'Lora', Georgia, serif" },
                      },
                    ].map(({ key, label, sublabel, sample, style }) => {
                      const isActive = fontFamily === key;
                      return (
                        <button
                          key={key}
                          onClick={() => { addLog('SETTINGS', 'FONT_FAMILY_CHANGED', { severity: 'info', actor: { role: currentRole, label: ROLES[currentRole]?.label }, target: key, details: { from: fontFamily, to: key } }); setFontFamily(key); }}
                          className={`flex-1 rounded border p-3 text-left transition-all ${
                            isActive
                              ? 'border-[#2E8BF0] bg-[#2E8BF0]/5 dark:bg-[#2E8BF0]/10'
                              : 'border-gray-200 dark:border-[#243348] hover:border-gray-300 dark:hover:border-[#364860]'
                          }`}
                        >
                          <span
                            style={style}
                            className="block text-2xl font-medium text-[#0F1923] dark:text-[#F8FAFE] mb-1.5 leading-none"
                          >
                            {sample}
                          </span>
                          <span className={`block text-xs font-medium mb-0.5 ${isActive ? 'text-[#2E8BF0]' : 'text-[#0F1923] dark:text-[#F8FAFE]'}`}>
                            {label}
                          </span>
                          <span className="block text-[10px] text-gray-400 dark:text-[#4A6080]">{sublabel}</span>
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[10px] text-gray-400 dark:text-[#4A6080] mt-2">
                    Applies to all UI text, forms, and printed estimates.
                  </p>
                </div>

              </div>
            </CardBody>
          </Card>

          {/* ── 7. Accessibility ─────────────────────────────────────────────────── */}
          <Card>
            <CardHeader title="Accessibility" />
            <CardBody>
              <p className="text-[11px] text-gray-400 dark:text-[#4A6080] mb-3">High contrast and color vision options for improved readability.</p>
              <div className="space-y-4">

                {/* High contrast toggle */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-[#0F1923] dark:text-[#F8FAFE]">High Contrast</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">Boost contrast across the entire interface for improved readability</p>
                  </div>
                  <Toggle on={highContrast} onChange={setHighContrast} />
                </div>

                {/* Color blind mode */}
                <div>
                  <p className="text-xs font-medium text-[#0F1923] dark:text-[#F8FAFE] mb-2">Color Vision Mode</p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { key: 'none',         label: 'Default',      desc: 'Normal color vision' },
                      { key: 'deuteranopia', label: 'Deuteranopia', desc: 'Red-green (green weak)' },
                      { key: 'protanopia',   label: 'Protanopia',   desc: 'Red-green (red weak)' },
                      { key: 'tritanopia',   label: 'Tritanopia',   desc: 'Blue-yellow' },
                    ].map(opt => (
                      <button
                        key={opt.key}
                        onClick={() => setColorBlindMode(opt.key)}
                        className={`p-2.5 rounded-lg border text-left transition-all ${
                          colorBlindMode === opt.key
                            ? 'border-[var(--accent-primary)] bg-[var(--accent-light)]'
                            : 'border-gray-200 dark:border-[#243348] hover:border-gray-300 dark:hover:border-[#364860]'
                        }`}
                      >
                        <p className={`text-[11px] font-semibold ${colorBlindMode === opt.key ? 'text-[var(--accent-primary)]' : 'text-[#0F1923] dark:text-[#F8FAFE]'}`}>{opt.label}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">{opt.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

              </div>
            </CardBody>
          </Card>

          {/* ── 8. Layout & Density ─────────────────────────────────────────────── */}
          <Card>
            <CardHeader title="Layout & Density" />
            <CardBody>
              <p className="text-[11px] text-gray-400 dark:text-[#4A6080] mb-3">Controls padding and spacing across all views.</p>
              <div className="flex gap-1.5">
                {Object.entries(DENSITY_OPTIONS).map(([key, opt]) => (
                  <button
                    key={key}
                    onClick={() => setDensity(key)}
                    className={`flex-1 h-8 text-xs font-medium transition-colors capitalize ${
                      density === key
                        ? 'wm-btn-primary'
                        : 'bg-white dark:bg-[#243348] text-[#64748B] dark:text-[#7D93AE] border border-gray-200 dark:border-[#243348] hover:bg-gray-50 dark:hover:bg-[#1B2A3E] rounded'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <div className="mt-3 rounded border border-gray-200 dark:border-[#243348] overflow-hidden">
                {['Service', 'Materials', 'Labor'].map((label) => (
                  <div
                    key={label}
                    className="flex items-center gap-2 border-b border-gray-100 dark:border-[#243348] last:border-0 text-xs text-[#64748B] dark:text-[#7D93AE] transition-all"
                    style={{ padding: `var(--wm-row-py, 0.5rem) var(--wm-card-px, 1.25rem)` }}
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-[#364860] flex-shrink-0" />
                    {label}
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>

          {/* ── 9. Card Style ────────────────────────────────────────────────────── */}
          <Card>
            <CardHeader title="Card Style" />
            <CardBody>
              <p className="text-[11px] text-gray-400 dark:text-[#4A6080] mb-3">Choose how panels and list cards visually present their content.</p>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(CARD_STYLE_OPTIONS).map(([key, opt]) => (
                  <button
                    key={key}
                    onClick={() => setCardStyle(key)}
                    className={`p-2.5 rounded border text-left transition-all ${
                      cardStyle === key
                        ? 'border-[var(--accent-primary)] bg-[var(--accent-light)]'
                        : 'border-gray-200 dark:border-[#243348] hover:border-gray-300 dark:hover:border-[#364860]'
                    }`}
                  >
                    <div
                      className="w-full h-8 bg-white dark:bg-[#243348] mb-2 rounded-sm"
                      style={{
                        border: key === 'flat'     ? 'none'
                               : key === 'bordered' ? '1.5px solid #d1d5db'
                                                    : '1px solid rgba(0,0,0,0.07)',
                        boxShadow: key === 'elevated' ? '0 2px 8px -2px rgba(0,0,0,0.2)' : 'none',
                      }}
                    />
                    <p className={`text-[10px] font-medium ${cardStyle === key ? 'text-[var(--accent-primary)]' : 'text-[#0F1923] dark:text-[#F8FAFE]'}`}>
                      {opt.label}
                    </p>
                    <p className="text-[10px] text-gray-400 dark:text-[#4A6080] mt-0.5 leading-tight">{opt.description}</p>
                  </button>
                ))}
              </div>
            </CardBody>
          </Card>

          {/* ── 10. Module Spacing ───────────────────────────────────────────────── */}
          <Card>
            <CardHeader title="Module Spacing" />
            <CardBody>
              <div className="space-y-2">
                <p className="text-[11px] text-gray-400 dark:text-[#4A6080]">Controls the gap between dashboard widget cards.</p>
                <div className="grid grid-cols-3 gap-2">
                  {MODULE_GAP_OPTIONS.map(opt => (
                    <button
                      key={opt.key}
                      onClick={() => setModuleGap(opt.key)}
                      className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                        moduleGap === opt.key
                          ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/5'
                          : 'border-gray-200 dark:border-[#243348] hover:border-gray-300 dark:hover:border-[#2E4060]'
                      }`}
                    >
                      {/* Visual preview */}
                      <div className="w-full flex flex-col" style={{ gap: opt.key === 'compact' ? '2px' : opt.key === 'comfortable' ? '8px' : '5px' }}>
                        {[0,1,2].map(i => (
                          <div key={i} className="h-2 rounded-sm bg-gray-200 dark:bg-[#243348]" />
                        ))}
                      </div>
                      <p className={`text-[10px] font-semibold ${moduleGap === opt.key ? 'text-[var(--accent-primary)]' : 'text-[#0F1923] dark:text-[#F8FAFE]'}`}>
                        {opt.label}
                      </p>
                      <p className="text-[9px] text-gray-400 dark:text-[#4A6080] text-center leading-tight">{opt.description}</p>
                    </button>
                  ))}
                </div>
              </div>
            </CardBody>
          </Card>

          {/* ── 11. Border Radius ─────────────────────────────────────────────────── */}
          <Card>
            <CardHeader title="Border Radius" />
            <CardBody>
              <p className="text-[11px] text-gray-400 dark:text-[#4A6080] mb-3">Controls the corner roundness of cards, buttons, and inputs throughout the app.</p>
              <div className="grid grid-cols-4 gap-2">
                {Object.entries(RADIUS_OPTIONS).map(([key, opt]) => {
                  const previewRadius = { sharp: '0px', rounded: '4px', soft: '8px', pill: '9999px' }[key];
                  return (
                    <button
                      key={key}
                      onClick={() => setBorderRadius(key)}
                      className={`flex flex-col items-center gap-2 p-2.5 rounded border transition-all ${
                        borderRadius === key
                          ? 'border-[var(--accent-primary)] bg-[var(--accent-light)]'
                          : 'border-gray-200 dark:border-[#243348] hover:border-gray-300 dark:hover:border-[#364860]'
                      }`}
                    >
                      <div
                        className="w-10 h-7 bg-gray-200 dark:bg-[#364860] border-2 border-gray-300 dark:border-[#4A6080]"
                        style={{ borderRadius: previewRadius }}
                      />
                      <span className={`text-[10px] font-medium ${borderRadius === key ? 'text-[var(--accent-primary)]' : 'text-gray-500 dark:text-[#7D93AE]'}`}>
                        {opt.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </CardBody>
          </Card>

          {/* ── 12. Ticker ───────────────────────────────────────────────────────── */}
          <Card>
            <CardHeader title="Ticker" />
            <CardBody>
              <p className="text-[11px] text-gray-400 dark:text-[#4A6080] mb-3">Live scrolling bar with announcements, alerts, and industry updates.</p>
              <div className="space-y-3">
                {/* Enable/disable */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-[#0F1923] dark:text-[#F8FAFE]">Show ticker</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">Scrolling news and product updates bar</p>
                  </div>
                  <Toggle on={tickerEnabled} onChange={setTickerEnabled} />
                </div>

                {/* Speed */}
                {tickerEnabled && (
                  <div>
                    <p className="text-xs font-medium text-[#0F1923] dark:text-[#F8FAFE] mb-2">Scroll speed</p>
                    <div className="flex gap-2">
                      {TICKER_SPEEDS.map(s => (
                        <button
                          key={s.key}
                          onClick={() => setTickerSpeed(s.key)}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                            tickerSpeed === s.key
                              ? 'bg-[#2E8BF0] border-[#2E8BF0] text-white'
                              : 'border-gray-200 dark:border-[#243348] text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-[#2E4060]'
                          }`}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Category toggles */}
                {tickerEnabled && (
                  <div>
                    <p className="text-xs font-medium text-[#0F1923] dark:text-[#F8FAFE] mb-2">Content to show</p>
                    <div className="space-y-1.5">
                      {[
                        { key: 'announcements', label: 'Announcements', color: '#F59E0B', desc: 'Shop announcements and WrapMind updates' },
                        { key: 'notifications', label: 'Notifications', color: '#3B82F6', desc: 'Estimate and activity alerts' },
                        { key: 'reminders',     label: 'Reminders',     color: '#8B5CF6', desc: 'Upcoming appointment alerts' },
                        { key: 'stockPrices',   label: 'Stock Prices',  color: '#10B981', desc: 'XPEL, 3M, Avery Dennison and more' },
                        { key: 'industryNews',  label: 'Industry News', color: '#64748B', desc: 'Wrap, PPF, and tint industry updates' },
                        { key: 'appointments',  label: 'Schedule',      color: '#06B6D4', desc: "Today's job and appointment summary" },
                      ].map(({ key, label, color, desc }) => (
                        <label key={key} className="flex items-center gap-3 py-1.5 cursor-pointer group">
                          <span
                            className="flex-shrink-0 w-4 h-4 rounded border-2 flex items-center justify-center transition-all"
                            style={{
                              borderColor: tickerCategories[key] ? color : '#9CA3AF',
                              backgroundColor: tickerCategories[key] ? color + '22' : 'transparent',
                            }}
                            onClick={() => setTickerCategory(key, !tickerCategories[key])}
                          >
                            {tickerCategories[key] && (
                              <svg className="w-2.5 h-2.5" viewBox="0 0 10 10" fill="none">
                                <path d="M2 5l2.5 2.5L8 3" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            )}
                          </span>
                          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                          <div className="flex-1 min-w-0" onClick={() => setTickerCategory(key, !tickerCategories[key])}>
                            <p className="text-xs font-medium text-[#0F1923] dark:text-[#F8FAFE]">{label}</p>
                            <p className="text-[10px] text-gray-400 dark:text-[#4A6080]">{desc}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardBody>
          </Card>

          {/* ── 13. Behavior ─────────────────────────────────────────────────── */}
          <Card>
            <CardHeader title="Behavior">
              <Tooltip
                text="Includes motion reduction for accessibility, tooltip visibility, and milestone celebration effects."
                position="bottom"
                forceShow
              >
                <button
                  type="button"
                  className="w-4 h-4 rounded-full border border-gray-300 dark:border-[#364860] text-[#64748B] dark:text-[#7D93AE] text-[10px] leading-none flex items-center justify-center hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)] focus:outline-none focus:ring-1 focus:ring-[#2E8BF0] transition-colors"
                  aria-label="Behavior info"
                >
                  ?
                </button>
              </Tooltip>
            </CardHeader>
            <CardBody>
              <p className="text-[11px] text-gray-400 dark:text-[#4A6080] mb-4">Animations, hints, and feedback.</p>
              <div className="space-y-0 divide-y divide-gray-100 dark:divide-[#243348]">
                <div className="flex items-center justify-between py-3 first:pt-0">
                  <div>
                    <p className="text-xs font-medium text-[#0F1923] dark:text-[#F8FAFE]">Tooltips</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">Hover labels on icon-only buttons and nav items</p>
                  </div>
                  <Toggle on={tooltipsEnabled} onChange={setTooltipsEnabled} />
                </div>
                <div className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-xs font-medium text-[#0F1923] dark:text-[#F8FAFE]">Reduce Motion</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">Disables all animations and transitions app-wide</p>
                  </div>
                  <Toggle on={reduceMotion} onChange={setReduceMotion} />
                </div>
                <div className="flex items-center justify-between py-3 last:pb-0">
                  <div>
                    <p className="text-xs font-medium text-[#0F1923] dark:text-[#F8FAFE]">Celebration Effects</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">Confetti and banner on milestones — approvals, payments, deals won</p>
                  </div>
                  <Toggle
                    on={celebrationsEnabled}
                    onChange={(val) => {
                      setCelebrationsEnabled(val);
                      localStorage.setItem('wm-celebrations', String(val));
                    }}
                  />
                </div>
              </div>
            </CardBody>
          </Card>

          {/* ── 14. Dashboard ────────────────────────────────────────────────────── */}
          <Card>
            <CardHeader title="Dashboard" />
            <CardBody>
              <p className="text-[11px] text-gray-400 dark:text-[#4A6080] mb-3">Reset layout, export or import your full preference set.</p>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-[#0F1923] dark:text-[#F8FAFE]">Reset dashboard layout</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">Restore widget order and settings to defaults</p>
                  </div>
                  <Button variant="outline" onClick={handleResetDashboard}>Reset</Button>
                </div>
                <div className="border-t border-gray-200 dark:border-[#243348] pt-2 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-[#0F1923] dark:text-[#F8FAFE]">Export preferences</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">Download your settings as a JSON file</p>
                  </div>
                  <Button variant="outline" onClick={handleExportPreferences}>Export</Button>
                </div>
                <div className="border-t border-gray-200 dark:border-[#243348] pt-2 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-[#0F1923] dark:text-[#F8FAFE]">Import preferences</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">Restore settings from a JSON file</p>
                  </div>
                  <Button variant="outline" onClick={() => importRef.current?.click()}>Import</Button>
                </div>
                <input ref={importRef} type="file" accept=".json" className="sr-only" onChange={handleImportPreferences} />
              </div>
            </CardBody>
          </Card>

        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// ABOUT
// ─────────────────────────────────────────────

function AboutPage() {
  return (
    <div className="flex flex-col h-full">
      <PageHeader title="About" />
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-lg space-y-4">
          <Card>
            <CardHeader title="WrapMind" />
            <CardBody>
              <div className="space-y-2">
                {[
                  ['Version', 'v1.0.0-beta'],
                  ['Release date', '2026-04-09'],
                  ['License', 'Commercial — Single Location'],
                  ['Support', 'support@wrapmind.io'],
                ].map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between text-xs border-b border-gray-100 dark:border-[#243348] pb-2 last:border-0 last:pb-0">
                    <span className="text-[#64748B] dark:text-[#7D93AE]">{k}</span>
                    <span className="text-[#0F1923] dark:text-[#F8FAFE] font-medium">{v}</span>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="Legal" />
            <CardBody>
              <div className="space-y-2">
                <button className="w-full text-left text-xs text-[#2E8BF0] hover:underline py-1">Terms of Service →</button>
                <button className="w-full text-left text-xs text-[#2E8BF0] hover:underline py-1">Privacy Policy →</button>
                <button className="w-full text-left text-xs text-[#2E8BF0] hover:underline py-1">Open Source Licenses →</button>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Mobile App" />
            <CardBody>
              <p className="text-xs text-[#64748B] dark:text-[#7D93AE] mb-3">
                Take WrapMind on the go. Manage estimates, leads, and your shop from anywhere.
              </p>
              <a href="#" aria-label="Download WrapMind on the App Store">
                <img
                  src="https://toolbox.marketingtools.apple.com/api/v2/badges/download-on-the-app-store/black/en-us"
                  alt="Download on the App Store"
                  style={{ height: 40, width: 'auto' }}
                />
              </a>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// EXPERIMENTAL FEATURES PAGE (Super Admin only)
// ─────────────────────────────────────────────

function ExperimentalPage() {
  const {
    xpEnabled, setXpEnabled,
    workflowEnabled, setWorkflowEnabled,
    invoicesEnabled, setInvoicesEnabled,
    reportsEnabled, setReportsEnabled,
    clientPortalEnabled, setClientPortalEnabled,
    marketingEnabled, setMarketingEnabled,
  } = useFeatureFlags();
  const { currentRole } = useRoles();
  const { addLog } = useAuditLog();

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Experimental Features" />

      <div className="flex-1 overflow-auto px-6 py-5 space-y-5">
        {/* Hero banner */}
        <div className="relative rounded-xl overflow-hidden border border-amber-200 dark:border-amber-800/50 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20 p-5">
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-5 pointer-events-none select-none">
            <div className="absolute top-2 right-4 opacity-10">
              <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 0 1-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 0 1 4.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0 1 12 15a9.065 9.065 0 0 1-6.23-.693L5 14.5m14.8.8 1.402 1.402c1 1 .28 2.716-1.128 2.716H3.926c-1.408 0-2.128-1.716-1.128-2.716L5 14.5" /></svg>
            </div>
          </div>
          <div className="relative flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-100 dark:bg-amber-900/40 border border-amber-200 dark:border-amber-700 flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15M14.25 3.104c.251.023.501.05.75.082M19.8 15a2.25 2.25 0 01-.659 1.591l-2.09 2.09a2.25 2.25 0 01-3.182 0l-2.09-2.09A2.25 2.25 0 0111.25 15H4.5m15.3 0H4.5m0 0a2.25 2.25 0 01-.659-1.591L5 14.5m-.5.5H19" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">Super Admin · Experimental Lab</p>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200 uppercase tracking-wide">Beta</span>
              </div>
              <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed max-w-md">
                These features are opt-in and may change or be removed. Toggling them on or off takes effect immediately across the whole app for all users on this device.
              </p>
            </div>
          </div>
        </div>

        {/* XP & Gamification Feature */}
        <div className="rounded-xl border-2 border-dashed border-amber-300 dark:border-amber-700/60 bg-white dark:bg-[#1B2A3E] overflow-hidden">
          {/* Feature header */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 dark:border-[#243348]">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                xpEnabled ? 'bg-amber-400' : 'bg-gray-100 dark:bg-[#243348]'
              }`}
            >
              <svg className={`w-5 h-5 transition-colors ${xpEnabled ? 'text-white' : 'text-gray-400 dark:text-[#7D93AE]'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-[#0F1923] dark:text-[#F8FAFE]">XP &amp; Gamification System</p>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide transition-colors ${
                  xpEnabled
                    ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                    : 'bg-gray-100 dark:bg-[#243348] text-gray-400 dark:text-[#7D93AE]'
                }`}>
                  {xpEnabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              <p className="text-xs text-[#64748B] dark:text-[#7D93AE] mt-0.5">
                Team motivation through XP points, levels, streaks, and leaderboards.
              </p>
            </div>
            <Toggle on={xpEnabled} onChange={(newValue) => { addLog('FEATURE', 'XP_SYSTEM_TOGGLED', { severity: 'warning', actor: { role: currentRole, label: ROLES[currentRole]?.label }, target: 'XP & Gamification', details: { enabled: newValue } }); setXpEnabled(newValue); }} />
          </div>

          {/* What's included */}
          <div className="px-5 py-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[#64748B] dark:text-[#7D93AE] mb-3">What this controls</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { icon: 'star', label: 'XP Ring in top bar', active: xpEnabled },
                { icon: 'trophy', label: 'Performance page', active: xpEnabled },
                { icon: 'chart-bar', label: 'XP dashboard widgets', active: xpEnabled },
                { icon: 'fire', label: 'Streaks & challenges', active: xpEnabled },
                { icon: 'target', label: 'XP Mode dashboard preset', active: xpEnabled },
                { icon: 'medal', label: 'Team leaderboards', active: xpEnabled },
              ].map(({ icon, label, active }) => (
                <div
                  key={label}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-all ${
                    active
                      ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40'
                      : 'bg-gray-50 dark:bg-[#243348]/50 text-gray-400 dark:text-[#4A6380] border border-gray-100 dark:border-[#243348]'
                  }`}
                >
                  <WMIcon name={icon} className={`w-3.5 h-3.5 transition-opacity ${active ? 'opacity-100' : 'opacity-30'}`} />
                  <span className={`font-medium transition-colors ${active ? '' : 'line-through'}`}>{label}</span>
                </div>
              ))}
            </div>

            {!xpEnabled && (
              <div className="mt-3 flex items-start gap-2 px-3 py-2.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/40">
                <svg className="w-3.5 h-3.5 text-[#2E8BF0] mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                </svg>
                <p className="text-[11px] text-[#2E8BF0] dark:text-blue-300 leading-relaxed">
                  XP data is preserved. Re-enabling this feature will restore all progress, levels, and leaderboard history.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Workflow */}
        <div className="rounded-xl border-2 border-dashed border-blue-300 dark:border-blue-700/60 bg-white dark:bg-[#1B2A3E] overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 dark:border-[#243348]">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${workflowEnabled ? 'bg-blue-600' : 'bg-gray-100 dark:bg-[#243348]'}`}>
              <svg className={`w-5 h-5 transition-colors ${workflowEnabled ? 'text-white' : 'text-gray-400 dark:text-[#7D93AE]'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-[#0F1923] dark:text-[#F8FAFE]">Workflow</p>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide transition-colors ${workflowEnabled ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'bg-gray-100 dark:bg-[#243348] text-gray-400 dark:text-[#7D93AE]'}`}>
                  {workflowEnabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              <p className="text-xs text-[#64748B] dark:text-[#7D93AE] mt-0.5">Job stage tracking, scheduling board, and team task management.</p>
            </div>
            <Toggle on={workflowEnabled} onChange={(v) => { addLog('FEATURE', 'WORKFLOW_TOGGLED', { severity: 'warning', actor: { role: currentRole, label: ROLES[currentRole]?.label }, target: 'Workflow', details: { enabled: v } }); setWorkflowEnabled(v); }} />
          </div>
          <div className="px-5 py-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[#64748B] dark:text-[#7D93AE] mb-3">What this controls</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { icon: 'squares-2x2', label: 'Kanban job board',       active: workflowEnabled },
                { icon: 'calendar', label: 'Scheduling calendar',    active: workflowEnabled },
                { icon: 'check-circle', label: 'Stage checklists',        active: workflowEnabled },
                { icon: 'users', label: 'Team task assignments',   active: workflowEnabled },
                { icon: 'bell', label: 'Status notifications',    active: workflowEnabled },
                { icon: 'chart-bar', label: 'Job pipeline view',       active: workflowEnabled },
              ].map(({ icon, label, active }) => (
                <div key={label} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-all ${active ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800/40' : 'bg-gray-50 dark:bg-[#243348]/50 text-gray-400 dark:text-[#4A6380] border border-gray-100 dark:border-[#243348]'}`}>
                  <WMIcon name={icon} className={`w-3.5 h-3.5 transition-opacity ${active ? 'opacity-100' : 'opacity-30'}`} />
                  <span className={`font-medium transition-colors ${active ? '' : 'line-through'}`}>{label}</span>
                </div>
              ))}
            </div>
            {!workflowEnabled && (
              <div className="mt-3 flex items-start gap-2 px-3 py-2.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/40">
                <svg className="w-3.5 h-3.5 text-[#2E8BF0] mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                </svg>
                <p className="text-[11px] text-[#2E8BF0] dark:text-blue-300 leading-relaxed">Workflow will not appear in the sidebar until enabled. All job data is preserved.</p>
              </div>
            )}
          </div>
        </div>

        {/* Invoices */}
        <div className="rounded-xl border-2 border-dashed border-green-300 dark:border-green-700/60 bg-white dark:bg-[#1B2A3E] overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 dark:border-[#243348]">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${invoicesEnabled ? 'bg-green-500' : 'bg-gray-100 dark:bg-[#243348]'}`}>
              <svg className={`w-5 h-5 transition-colors ${invoicesEnabled ? 'text-white' : 'text-gray-400 dark:text-[#7D93AE]'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-[#0F1923] dark:text-[#F8FAFE]">Invoices</p>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide transition-colors ${invoicesEnabled ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'bg-gray-100 dark:bg-[#243348] text-gray-400 dark:text-[#7D93AE]'}`}>
                  {invoicesEnabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              <p className="text-xs text-[#64748B] dark:text-[#7D93AE] mt-0.5">Invoice generation, payment tracking, and PDF export for completed jobs.</p>
            </div>
            <Toggle on={invoicesEnabled} onChange={(v) => { addLog('FEATURE', 'INVOICES_TOGGLED', { severity: 'warning', actor: { role: currentRole, label: ROLES[currentRole]?.label }, target: 'Invoices', details: { enabled: v } }); setInvoicesEnabled(v); }} />
          </div>
          <div className="px-5 py-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[#64748B] dark:text-[#7D93AE] mb-3">What this controls</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { icon: 'document-text', label: 'Invoice generator',     active: invoicesEnabled },
                { icon: 'credit-card', label: 'Payment tracking',      active: invoicesEnabled },
                { icon: 'document', label: 'PDF export',            active: invoicesEnabled },
                { icon: 'envelope', label: 'Email delivery',        active: invoicesEnabled },
                { icon: 'banknotes', label: 'Balance reports',       active: invoicesEnabled },
                { icon: 'tag', label: 'Line item builder',     active: invoicesEnabled },
              ].map(({ icon, label, active }) => (
                <div key={label} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-all ${active ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-800/40' : 'bg-gray-50 dark:bg-[#243348]/50 text-gray-400 dark:text-[#4A6380] border border-gray-100 dark:border-[#243348]'}`}>
                  <WMIcon name={icon} className={`w-3.5 h-3.5 transition-opacity ${active ? 'opacity-100' : 'opacity-30'}`} />
                  <span className={`font-medium transition-colors ${active ? '' : 'line-through'}`}>{label}</span>
                </div>
              ))}
            </div>
            {!invoicesEnabled && (
              <div className="mt-3 flex items-start gap-2 px-3 py-2.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/40">
                <svg className="w-3.5 h-3.5 text-[#2E8BF0] mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                </svg>
                <p className="text-[11px] text-[#2E8BF0] dark:text-blue-300 leading-relaxed">Invoices will not appear in the sidebar until enabled. All invoice data is preserved.</p>
              </div>
            )}
          </div>
        </div>

        {/* Reports */}
        <div className="rounded-xl border-2 border-dashed border-purple-300 dark:border-purple-700/60 bg-white dark:bg-[#1B2A3E] overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 dark:border-[#243348]">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${reportsEnabled ? 'bg-purple-500' : 'bg-gray-100 dark:bg-[#243348]'}`}>
              <svg className={`w-5 h-5 transition-colors ${reportsEnabled ? 'text-white' : 'text-gray-400 dark:text-[#7D93AE]'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-[#0F1923] dark:text-[#F8FAFE]">Reports</p>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide transition-colors ${reportsEnabled ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'bg-gray-100 dark:bg-[#243348] text-gray-400 dark:text-[#7D93AE]'}`}>
                  {reportsEnabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              <p className="text-xs text-[#64748B] dark:text-[#7D93AE] mt-0.5">Business analytics, performance charts, and exportable shop reports.</p>
            </div>
            <Toggle on={reportsEnabled} onChange={(v) => { addLog('FEATURE', 'REPORTS_TOGGLED', { severity: 'warning', actor: { role: currentRole, label: ROLES[currentRole]?.label }, target: 'Reports', details: { enabled: v } }); setReportsEnabled(v); }} />
          </div>
          <div className="px-5 py-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[#64748B] dark:text-[#7D93AE] mb-3">What this controls</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { icon: 'arrow-trending-up', label: 'Revenue analytics',     active: reportsEnabled },
                { icon: 'trophy', label: 'Tech performance',      active: reportsEnabled },
                { icon: 'chart-bar', label: 'Estimate conversion',   active: reportsEnabled },
                { icon: 'map', label: 'Regional breakdown',    active: reportsEnabled },
                { icon: 'arrow-up-tray', label: 'CSV & PDF export',      active: reportsEnabled },
                { icon: 'calendar', label: 'Scheduled reports',     active: reportsEnabled },
              ].map(({ icon, label, active }) => (
                <div key={label} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-all ${active ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800/40' : 'bg-gray-50 dark:bg-[#243348]/50 text-gray-400 dark:text-[#4A6380] border border-gray-100 dark:border-[#243348]'}`}>
                  <WMIcon name={icon} className={`w-3.5 h-3.5 transition-opacity ${active ? 'opacity-100' : 'opacity-30'}`} />
                  <span className={`font-medium transition-colors ${active ? '' : 'line-through'}`}>{label}</span>
                </div>
              ))}
            </div>
            {!reportsEnabled && (
              <div className="mt-3 flex items-start gap-2 px-3 py-2.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/40">
                <svg className="w-3.5 h-3.5 text-[#2E8BF0] mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                </svg>
                <p className="text-[11px] text-[#2E8BF0] dark:text-blue-300 leading-relaxed">Reports will not appear in the sidebar until enabled. Historical data is preserved.</p>
              </div>
            )}
          </div>
        </div>

        {/* Client Portal */}
        <div className="rounded-xl border-2 border-dashed border-teal-300 dark:border-teal-700/60 bg-white dark:bg-[#1B2A3E] overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 dark:border-[#243348]">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${clientPortalEnabled ? 'bg-teal-500' : 'bg-gray-100 dark:bg-[#243348]'}`}>
              <svg className={`w-5 h-5 transition-colors ${clientPortalEnabled ? 'text-white' : 'text-gray-400 dark:text-[#7D93AE]'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-[#0F1923] dark:text-[#F8FAFE]">Client Portal</p>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide transition-colors ${clientPortalEnabled ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'bg-gray-100 dark:bg-[#243348] text-gray-400 dark:text-[#7D93AE]'}`}>
                  {clientPortalEnabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              <p className="text-xs text-[#64748B] dark:text-[#7D93AE] mt-0.5">Client-facing portal for job status, digital approvals, and estimate review.</p>
            </div>
            <Toggle on={clientPortalEnabled} onChange={(v) => { addLog('FEATURE', 'CLIENT_PORTAL_TOGGLED', { severity: 'warning', actor: { role: currentRole, label: ROLES[currentRole]?.label }, target: 'Client Portal', details: { enabled: v } }); setClientPortalEnabled(v); }} />
          </div>
          <div className="px-5 py-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[#64748B] dark:text-[#7D93AE] mb-3">What this controls</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { icon: 'link', label: 'Client login link',     active: clientPortalEnabled },
                { icon: 'device-phone-mobile', label: 'Job status tracker',    active: clientPortalEnabled },
                { icon: 'pencil', label: 'Digital approvals',     active: clientPortalEnabled },
                { icon: 'chat-bubble', label: 'Client messaging',      active: clientPortalEnabled },
                { icon: 'camera', label: 'Photo sharing',         active: clientPortalEnabled },
                { icon: 'document-text', label: 'Invoice view',          active: clientPortalEnabled },
              ].map(({ icon, label, active }) => (
                <div key={label} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-all ${active ? 'bg-teal-50 dark:bg-teal-900/20 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800/40' : 'bg-gray-50 dark:bg-[#243348]/50 text-gray-400 dark:text-[#4A6380] border border-gray-100 dark:border-[#243348]'}`}>
                  <WMIcon name={icon} className={`w-3.5 h-3.5 transition-opacity ${active ? 'opacity-100' : 'opacity-30'}`} />
                  <span className={`font-medium transition-colors ${active ? '' : 'line-through'}`}>{label}</span>
                </div>
              ))}
            </div>
            {!clientPortalEnabled && (
              <div className="mt-3 flex items-start gap-2 px-3 py-2.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/40">
                <svg className="w-3.5 h-3.5 text-[#2E8BF0] mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                </svg>
                <p className="text-[11px] text-[#2E8BF0] dark:text-blue-300 leading-relaxed">Client Portal will not appear in the sidebar until enabled. Client data is preserved.</p>
              </div>
            )}
          </div>
        </div>

        {/* Marketing */}
        <div className="rounded-xl border-2 border-dashed border-amber-300 dark:border-amber-700/60 bg-white dark:bg-[#1B2A3E] overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 dark:border-[#243348]">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
              marketingEnabled ? 'bg-[#2E8BF0]' : 'bg-gray-100 dark:bg-[#243348]'
            }`}>
              <svg className={`w-5 h-5 transition-colors ${marketingEnabled ? 'text-white' : 'text-gray-400 dark:text-[#7D93AE]'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 110-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 01-1.44-4.282m3.102.069a18.03 18.03 0 01-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 018.835 2.535M10.34 6.66a23.847 23.847 0 008.835-2.535m0 0A23.74 23.74 0 0018.795 3m.38 1.125a23.91 23.91 0 011.014 5.395m-1.014 8.855c-.118.38-.245.754-.38 1.125m.38-1.125a23.91 23.91 0 001.014-5.395m0-3.46c.495.413.811 1.035.811 1.73 0 .695-.316 1.317-.811 1.73m0-3.46a24.347 24.347 0 010 3.46" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-[#0F1923] dark:text-[#F8FAFE]">Marketing</p>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide transition-colors ${
                  marketingEnabled
                    ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                    : 'bg-gray-100 dark:bg-[#243348] text-gray-400 dark:text-[#7D93AE]'
                }`}>
                  {marketingEnabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              <p className="text-xs text-[#64748B] dark:text-[#7D93AE] mt-0.5">
                Review generation, automated follow-ups, campaigns, referral tracking, and portfolio gallery.
              </p>
            </div>
            <Toggle
              on={marketingEnabled}
              onChange={(v) => {
                setMarketingEnabled(v);
                addLog('FEATURE', 'MARKETING_TOGGLED', { severity: 'warning', actor: { role: currentRole, label: ROLES[currentRole]?.label }, target: 'Marketing', details: { enabled: v } });
              }}
            />
          </div>
          <div className="px-5 py-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[#64748B] dark:text-[#7D93AE] mb-3">What this controls</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { icon: 'star', label: 'Review generation', active: marketingEnabled },
                { icon: 'bolt', label: 'Estimate follow-ups', active: marketingEnabled },
                { icon: 'envelope', label: 'Campaigns', active: marketingEnabled },
                { icon: 'photo', label: 'Portfolio gallery', active: marketingEnabled },
                { icon: 'users', label: 'Referral tracking', active: marketingEnabled },
                { icon: 'chart-bar', label: 'Marketing analytics', active: marketingEnabled },
              ].map(({ icon, label, active }) => (
                <div key={label} className={`flex items-center gap-2 text-[11px] transition-colors ${active ? 'text-[#0F1923] dark:text-[#F8FAFE]' : 'text-gray-300 dark:text-[#364860]'}`}>
                  <WMIcon name={icon} className={`w-3.5 h-3.5 transition-opacity ${active ? 'opacity-100' : 'opacity-30'}`} />
                  {label}
                </div>
              ))}
            </div>
            {marketingEnabled && (
              <div className="mt-4 flex items-center gap-2 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 px-3 py-2">
                <svg className="w-3.5 h-3.5 text-[#2E8BF0] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                </svg>
                <p className="text-[11px] text-[#2E8BF0] dark:text-blue-300 leading-relaxed">Marketing will appear in the sidebar under staff-access items. Modules are in active development.</p>
              </div>
            )}
          </div>
        </div>

        {/* More coming soon */}
        <div className="rounded-xl border border-dashed border-gray-200 dark:border-[#243348] bg-gray-50/50 dark:bg-[#0F1923]/30 px-5 py-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-[#243348] flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-gray-300 dark:text-[#364860]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-400 dark:text-[#4A6380]">More experimental features coming soon</p>
            <p className="text-[11px] text-gray-300 dark:text-[#364860] mt-0.5">AI estimating assistant, smart scheduling, and more are in development.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// WRAPMIND STAFF ACCESS PAGE
// ─────────────────────────────────────────────

function StaffAccessPage() {
  const { staffAccessGranted, grantStaffAccess, revokeStaffAccess, planTier, setPlanTier } = useFeatureFlags();
  const [code, setCode]       = useState('');
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState(false);

  const CONFIDENTIAL_SECTIONS = [
    { label: 'Shop Profiles',  icon: 'building-storefront', desc: 'All connected shop data, performance metrics, and profile details.' },
    { label: 'Intelligence',   icon: 'bolt', desc: 'WrapMind AI engine, market analytics, and network intelligence.' },
    { label: 'Audit Log',      icon: 'clipboard', desc: 'Full system activity log — all user actions and configuration changes.' },
    { label: 'Site Bugs',      icon: 'bug-ant', desc: 'Internal bug tracker and issue reporting for WrapMind staff.' },
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    const granted = grantStaffAccess(code);
    if (granted) {
      setSuccess(true);
      setCode('');
    } else {
      setError('Invalid access code. Contact your WrapMind administrator.');
    }
  };

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Staff Portal"
        icon={
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.955 11.955 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
          </svg>
        }
      />
      <div className="flex-1 overflow-auto px-6 py-5 space-y-5">

        {/* Classification banner */}
        <div className="relative rounded-xl overflow-hidden border border-red-200 dark:border-red-800/50 bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/30 dark:to-rose-950/20 p-5">
          <div className="absolute inset-0 opacity-5 pointer-events-none select-none">
            <div className="absolute top-2 right-4 opacity-10">
              <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" /></svg>
            </div>
          </div>
          <div className="relative flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-red-100 dark:bg-red-900/40 border border-red-200 dark:border-red-700 flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <p className="text-sm font-semibold text-red-900 dark:text-red-200">HIGHLY CONFIDENTIAL · WrapMind Internal</p>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-200 dark:bg-red-800 text-red-800 dark:text-red-200 uppercase tracking-wide">Restricted</span>
              </div>
              <p className="text-xs text-red-700 dark:text-red-400 leading-relaxed max-w-lg">
                The sections below are restricted to authorized WrapMind senior staff only. Access requires a valid clearance code issued by your WrapMind administrator. Unauthorized access attempts are logged.
              </p>
            </div>
          </div>
        </div>

        {/* Protected sections list */}
        <div className="rounded-xl border border-gray-200 dark:border-[#243348] bg-white dark:bg-[#1B2A3E] overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 dark:border-[#243348]">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[#64748B] dark:text-[#7D93AE]">Protected Sections</p>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-[#243348]">
            {CONFIDENTIAL_SECTIONS.map(({ label, icon, desc }) => (
              <div key={label} className="flex items-center gap-3 px-5 py-3.5">
                <WMIcon name={icon} className="w-3.5 h-3.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#0F1923] dark:text-[#F8FAFE]">{label}</p>
                  <p className="text-xs text-[#64748B] dark:text-[#7D93AE] mt-0.5">{desc}</p>
                </div>
                <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wide flex-shrink-0 ${
                  staffAccessGranted
                    ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                    : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                }`}>
                  {staffAccessGranted ? 'Unlocked' : 'Locked'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Credential entry / revoke */}
        {staffAccessGranted ? (
          <div className="rounded-xl border border-emerald-200 dark:border-emerald-800/50 bg-emerald-50 dark:bg-emerald-950/20 p-5">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-200">Staff clearance active</p>
                  <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">Session-only — access will reset on next page load.</p>
                </div>
              </div>
              <button
                onClick={() => { revokeStaffAccess(); setSuccess(false); }}
                className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
              >
                Revoke Access
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border-2 border-dashed border-gray-200 dark:border-[#243348] bg-white dark:bg-[#1B2A3E] p-5">
            <p className="text-sm font-semibold text-[#0F1923] dark:text-[#F8FAFE] mb-1">Enter Staff Access Code</p>
            <p className="text-xs text-[#64748B] dark:text-[#7D93AE] mb-4">
              Your clearance code is provided by your WrapMind administrator. Access is session-scoped and does not persist after a page reload.
            </p>
            <form onSubmit={handleSubmit} className="flex items-center gap-3">
              <input
                type="password"
                value={code}
                onChange={(e) => { setCode(e.target.value); setError(''); }}
                placeholder="Enter access code"
                autoComplete="off"
                className="flex-1 h-9 px-3 text-sm rounded-lg border border-gray-200 dark:border-[#364860] bg-gray-50 dark:bg-[#0F1923] text-[#0F1923] dark:text-[#F8FAFE] placeholder-gray-400 dark:placeholder-[#4A6380] focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-600"
              />
              <button
                type="submit"
                disabled={!code.trim()}
                className="flex-shrink-0 h-9 px-4 rounded-lg text-sm font-semibold bg-[#2E8BF0] hover:bg-blue-600 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Authenticate
              </button>
            </form>
            {error && (
              <p className="mt-2 text-xs text-red-600 dark:text-red-400 flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
                {error}
              </p>
            )}
            {success && (
              <p className="mt-2 text-xs text-emerald-600 dark:text-emerald-400">Access granted for this session.</p>
            )}
          </div>
        )}

        {/* Plan Tier Override — only visible when staff access is granted */}
        {staffAccessGranted && (
          <div className="rounded-xl border border-amber-200 dark:border-amber-700/40 bg-amber-50 dark:bg-amber-950/20 overflow-hidden">
            <div className="px-5 py-3 border-b border-amber-200 dark:border-amber-700/40 flex items-center gap-2">
              <svg className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15M14.25 3.104c.251.023.501.05.75.082M19.8 15a2.25 2.25 0 01-.659 1.591l-3.682 3.682a2.25 2.25 0 01-3.182 0l-3.682-3.682A2.25 2.25 0 015.2 15M19.8 15H5.2" />
              </svg>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-amber-700 dark:text-amber-400">Plan Tier Override · Staff Only</p>
            </div>
            <div className="p-5 space-y-3">
              <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
                Force a specific pricing tier for testing gated features. This persists to localStorage and resets only when you switch it back or clear storage.
              </p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'starter',      label: 'Starter',      desc: 'Basic features only' },
                  { id: 'professional', label: 'Professional',  desc: 'Standard paid tier' },
                  { id: 'enterprise',   label: 'Enterprise',    desc: 'Multi-location + all features' },
                ].map(tier => {
                  const active = planTier === tier.id;
                  return (
                    <button
                      key={tier.id}
                      onClick={() => setPlanTier(tier.id)}
                      className={`relative flex flex-col items-start gap-1 rounded-lg px-3 py-2.5 text-left border transition-all ${
                        active
                          ? 'border-amber-500 dark:border-amber-500 bg-amber-100 dark:bg-amber-900/40 ring-1 ring-amber-400 dark:ring-amber-600'
                          : 'border-amber-200 dark:border-amber-700/40 bg-white dark:bg-[#1B2A3E] hover:border-amber-400 dark:hover:border-amber-600'
                      }`}
                    >
                      {active && (
                        <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-amber-500 dark:bg-amber-400" />
                      )}
                      <span className={`text-xs font-semibold ${active ? 'text-amber-900 dark:text-amber-200' : 'text-[#0F1923] dark:text-[#F8FAFE]'}`}>
                        {tier.label}
                      </span>
                      <span className={`text-[10px] leading-tight ${active ? 'text-amber-700 dark:text-amber-400' : 'text-[#64748B] dark:text-[#7D93AE]'}`}>
                        {tier.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// NAV CONFIG
// ─────────────────────────────────────────────

// required: permission key from RolesContext (if set, item is restricted)
// ─────────────────────────────────────────────
// LANGUAGE SETTINGS
// ─────────────────────────────────────────────

function LanguagePage() {
  const { lang, setLang, t } = useLanguage();
  const [saved, setSaved] = useState(false);

  const LANG_OPTIONS = [
    {
      id: 'en',
      label: 'English',
      native: 'English',
      flag: 'EN',
      desc: 'Full UI translation — all labels, navigation, and actions.',
    },
    {
      id: 'es',
      label: 'Spanish',
      native: 'Español',
      flag: 'ES',
      desc: 'Traducción completa de la interfaz — etiquetas, navegación y acciones.',
    },
  ];

  const handleSelect = (id) => {
    setLang(id);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="flex flex-col h-full">
      <PageHeader title={t('language.title')} />
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-lg space-y-4">
          <p className="text-xs text-[#64748B] dark:text-[#7D93AE]">{t('language.subtitle')}</p>

          {/* Language cards */}
          <div className="space-y-2">
            {LANG_OPTIONS.map((opt) => {
              const active = lang === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => handleSelect(opt.id)}
                  className={`w-full flex items-center gap-4 p-4 rounded-lg border-2 text-left transition-all ${
                    active
                      ? 'border-[#2E8BF0] bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-[#243348] bg-white dark:bg-[#1B2A3E] hover:border-gray-300 dark:hover:border-[#2E4060]'
                  }`}
                >
                  {/* Flag */}
                  <span className="text-3xl flex-shrink-0">{opt.flag}</span>

                  {/* Labels */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-[#0F1923] dark:text-[#F8FAFE]">{opt.native}</p>
                      {opt.native !== opt.label && (
                        <p className="text-xs text-[#64748B] dark:text-[#7D93AE]">({opt.label})</p>
                      )}
                    </div>
                    <p className="text-[11px] text-[#64748B] dark:text-[#7D93AE] mt-0.5 leading-relaxed">{opt.desc}</p>
                  </div>

                  {/* Active indicator */}
                  {active && (
                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-[#2E8BF0] flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Saved toast */}
          {saved && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
              <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              <p className="text-xs font-medium text-green-700 dark:text-green-400">{t('language.saved')}</p>
            </div>
          )}

          <p className="text-[11px] text-[#64748B] dark:text-[#7D93AE] leading-relaxed">
            Language preference is saved locally and applies immediately across all pages.
            More languages coming soon.
          </p>
        </div>
      </div>
    </div>
  );
}

const NAV_GROUPS = [
  {
    label: 'Account', tk: 'settings.group.account',
    items: [
      { id: 'user-profile', label: 'My Profile' },
      { id: 'profile',    label: 'Company Profile', tk: 'settings.profile', required: 'settings.profile.edit' },
      { id: 'billing',    label: 'Billing',         tk: 'settings.billing',   required: 'settings.billing' },
      { id: 'users',      label: 'Users',           tk: 'settings.users',     required: 'settings.users.view' },
      { id: 'about',      label: 'About',     tk: 'settings.about' },
    ],
  },
  {
    label: 'Settings', tk: 'settings.group.settings',
    items: [
      { id: 'general-settings',  label: 'General Settings',tk: 'settings.general',         required: 'settings.general' },
      { id: 'pricing-matrices',  label: 'Pricing Matrices',tk: 'settings.pricingMatrices',  required: 'settings.general' },
      { id: 'labor-rates',       label: 'Labor Rates',     tk: 'settings.laborRates',       required: 'settings.general' },
      { id: 'labor-matrices',    label: 'Labor Matrices',  tk: 'settings.laborMatrices',    required: 'settings.general' },
      { id: 'payment-terms',     label: 'Payment Terms',   tk: 'settings.paymentTerms',     required: 'settings.general' },
      { id: 'payment-types',     label: 'Payment Types',   tk: 'settings.paymentTypes',     required: 'settings.general' },
      { id: 'payments',          label: 'Payments',        tk: 'settings.payments',         required: 'settings.general' },
      { id: 'security',          label: 'Security' },
      { id: 'appearance',        label: 'Appearance',      tk: 'settings.appearance' },
    ],
  },
  {
    label: 'Organization', tk: 'settings.group.organization',
    items: [
      { id: 'locations', label: 'Locations' },
      { id: 'documents', label: 'Documents' },
    ],
  },
  {
    label: 'Integrations', tk: 'settings.group.integrations',
    items: [
      { id: 'integrations', label: 'Integrations' },
      { id: 'api-keys',     label: 'API Keys', tk: 'settings.apiKeys',   required: 'settings.integrations' },
      { id: 'carfax',       label: 'Carfax',   tk: 'settings.carfax',    required: 'settings.integrations' },
      { id: 'webhooks',     label: 'Webhooks', tk: 'settings.webhooks',  required: 'settings.integrations' },
    ],
  },
  {
    label: 'Super Admin', tk: 'settings.group.superAdmin',
    items: [
      { id: 'experimental',  label: 'Experimental',      tk: 'settings.experimental', required: 'settings.experimental' },
      { id: 'staff-access',  label: 'Staff Portal',      tk: 'settings.staffAccess',  required: 'settings.experimental' },
    ],
  },
];

// Flat map for label lookup
const ALL_ITEMS = NAV_GROUPS.flatMap((g) => g.items);

function getSectionLabel(id) {
  return ALL_ITEMS.find((i) => i.id === id)?.label ?? id;
}

// ─────────────────────────────────────────────
// Restricted page blocker
// ─────────────────────────────────────────────

function RestrictedPage({ label }) {
  const { currentRole } = useRoles();
  const role = ROLES[currentRole];
  return (
    <div className="flex flex-col h-full">
      <PageHeader title={label} />
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center max-w-xs">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: 'rgba(239,68,68,0.1)' }}
          >
            <svg className="w-7 h-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-[#0F1923] dark:text-[#F8FAFE] mb-1">Access Restricted</p>
          <p className="text-xs text-[#64748B] dark:text-[#7D93AE] leading-relaxed mb-3">
            <strong>{label}</strong> is not available for the{' '}
            <span className="font-semibold" style={{ color: role?.color }}>{role?.label}</span> role.
            Contact a Super Admin to request access.
          </p>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-xs text-[#64748B] dark:text-[#7D93AE]">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
            Requires Admin or higher
          </span>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// LABOR RATES
// ─────────────────────────────────────────────
const DEFAULT_LABOR_RATES = [
  { id: 1, name: 'Standard Installation',   rate: 85,  unit: 'hr', active: true  },
  { id: 2, name: 'Complex Installation',    rate: 110, unit: 'hr', active: true  },
  { id: 3, name: 'Removal / Prep',          rate: 65,  unit: 'hr', active: true  },
  { id: 4, name: 'Detail & Surface Prep',   rate: 55,  unit: 'hr', active: true  },
  { id: 5, name: 'Paint Correction',        rate: 120, unit: 'hr', active: false },
  { id: 6, name: 'Ceramic Coat Application',rate: 95,  unit: 'hr', active: true  },
];
function LaborRatesPage() {
  const [rates, setRates] = useState(() => {
    try {
      const raw = localStorage.getItem('wm-labor-rates-v1');
      if (raw) { const p = JSON.parse(raw); if (Array.isArray(p) && p.length > 0) return p; }
    } catch { /* ignore */ }
    return DEFAULT_LABOR_RATES;
  });
  const [editing, setEditing] = useState(null); // id being edited
  const [adding, setAdding]   = useState(false);
  const [newRow, setNewRow]   = useState({ name: '', rate: '', unit: 'hr' });
  const [saved, setSaved]     = useState(false);

  const update = (id, field, val) =>
    setRates(r => r.map(x => x.id === id ? { ...x, [field]: val } : x));

  const saveNew = () => {
    if (!newRow.name.trim() || !newRow.rate) return;
    setRates(r => [...r, { id: Date.now(), ...newRow, rate: parseFloat(newRow.rate), active: true }]);
    setNewRow({ name: '', rate: '', unit: 'hr' });
    setAdding(false);
  };

  const remove = (id) => setRates(r => r.filter(x => x.id !== id));

  const handleSave = () => {
    setEditing(null);
    try { localStorage.setItem('wm-labor-rates-v1', JSON.stringify(rates)); } catch { /* ignore */ }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Labor Rates">
        <Button variant="outline" onClick={() => setAdding(true)}>+ Add Rate</Button>
        <Button variant="primary" onClick={handleSave} className={saved ? 'bg-green-500 hover:bg-green-600' : ''}>
          {saved ? 'Saved!' : 'Save'}
        </Button>
      </PageHeader>
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-3xl space-y-4">
          <p className="text-xs text-[#64748B] dark:text-[#7D93AE]">
            Define hourly labor rates by service type. These rates are applied automatically when building estimates.
          </p>
          <Card>
            <CardHeader title="Labor Rate Schedule" />
            <CardBody className="p-0">
              {/* Header row */}
              <div className="grid grid-cols-[1fr_100px_80px_60px_52px_36px] gap-2 px-5 py-2 border-b border-gray-100 dark:border-[#243348] bg-gray-50 dark:bg-[#0F1923]/40">
                {['Service Type', 'Rate / hr', 'Unit', 'Active', 'Edit', ''].map(h => (
                  <span key={h} className="text-[10px] font-semibold uppercase tracking-wider text-[#64748B] dark:text-[#7D93AE]">{h}</span>
                ))}
              </div>
              {rates.map((row) => (
                <div key={row.id} className="grid grid-cols-[1fr_100px_80px_60px_52px_36px] gap-2 items-center px-5 py-3 border-b border-gray-100 dark:border-[#243348] last:border-0 hover:bg-gray-50 dark:hover:bg-[#243348]/30 group">
                  {editing === row.id ? (
                    <>
                      <TextInput
                        value={row.name}
                        onChange={e => update(row.id, 'name', e.target.value)}
                        autoFocus
                      />
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-[#64748B]">$</span>
                        <TextInput
                          type="number" min="0" className="w-full" value={row.rate}
                          onChange={e => update(row.id, 'rate', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <SelectInput value={row.unit} onChange={e => update(row.id, 'unit', e.target.value)}>
                        <option value="hr">Per Hr</option>
                        <option value="job">Per Job</option>
                        <option value="panel">Per Panel</option>
                        <option value="sqft">Per Sq Ft</option>
                      </SelectInput>
                    </>
                  ) : (
                    <>
                      <span className="text-xs text-[#0F1923] dark:text-[#F8FAFE]">{row.name}</span>
                      <span className="text-xs font-mono text-[#0F1923] dark:text-[#F8FAFE]">${row.rate.toFixed(2)}</span>
                      <span className="text-xs text-[#64748B] dark:text-[#7D93AE] capitalize">{row.unit === 'hr' ? 'Per Hr' : row.unit === 'job' ? 'Per Job' : row.unit === 'panel' ? 'Per Panel' : 'Per Sq Ft'}</span>
                    </>
                  )}
                  <Toggle on={row.active} onChange={v => update(row.id, 'active', v)} />
                  {editing === row.id ? (
                    <div className="flex gap-1">
                      <button onClick={() => setEditing(null)} className="px-2 h-6 text-[10px] font-medium rounded border border-gray-200 dark:border-[#243348] text-[#2E8BF0] hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">✓</button>
                      <button onClick={() => setEditing(null)} className="px-1.5 h-6 text-[10px] font-medium rounded border border-gray-200 dark:border-[#243348] text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">✕</button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setEditing(row.id)}
                      className="px-2 h-6 text-[10px] font-medium rounded border border-gray-200 dark:border-[#243348] text-[#2E8BF0] hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                    >
                      Edit
                    </button>
                  )}
                  <button onClick={() => remove(row.id)} className="opacity-0 group-hover:opacity-100 w-7 h-7 rounded flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              ))}
              {adding && (
                <div className="grid grid-cols-[1fr_100px_80px_60px_52px_36px] gap-2 items-center px-5 py-3 border-b border-gray-100 dark:border-[#243348] bg-blue-50/40 dark:bg-[#2E8BF0]/5">
                  <TextInput placeholder="Rate name…" value={newRow.name} onChange={e => setNewRow(r => ({ ...r, name: e.target.value }))} autoFocus />
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-[#64748B]">$</span>
                    <TextInput type="number" min="0" placeholder="0.00" className="w-full" value={newRow.rate} onChange={e => setNewRow(r => ({ ...r, rate: e.target.value }))} />
                  </div>
                  <SelectInput value={newRow.unit} onChange={e => setNewRow(r => ({ ...r, unit: e.target.value }))}>
                    <option value="hr">Per Hr</option>
                    <option value="job">Per Job</option>
                    <option value="panel">Per Panel</option>
                    <option value="sqft">Per Sq Ft</option>
                  </SelectInput>
                  <span />
                  <div className="flex gap-1">
                    <button onClick={saveNew} className="w-7 h-7 rounded text-white flex items-center justify-center text-xs" style={{ backgroundColor: 'var(--btn-primary-bg)' }}>✓</button>
                    <button onClick={() => setAdding(false)} className="w-7 h-7 rounded border border-gray-200 dark:border-[#243348] text-gray-400 flex items-center justify-center text-xs hover:text-red-500">✕</button>
                  </div>
                  <span />
                </div>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Overtime & Premium Rules" />
            <CardBody>
              <div className="space-y-4">
                {[
                  { label: 'Overtime multiplier', desc: 'Applied to labor hours beyond 8hr/day.', value: '1.5×' },
                  { label: 'Rush job premium', desc: 'Added when job is marked urgent priority.', value: '20%' },
                  { label: 'Weekend premium', desc: 'Applied to weekend scheduling.', value: '10%' },
                ].map(({ label, desc, value }, i) => (
                  <div key={i} className={`flex items-center justify-between gap-4 ${i > 0 ? 'border-t border-gray-100 dark:border-[#243348] pt-4' : ''}`}>
                    <div>
                      <p className="text-xs font-medium text-[#0F1923] dark:text-[#F8FAFE]">{label}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">{desc}</p>
                    </div>
                    <TextInput className="w-20 text-right" defaultValue={value} />
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// PRICING MATRICES
// ─────────────────────────────────────────────
const VEHICLE_COLS = ['Compact', 'Mid-Size', 'Full-Size', 'SUV / CUV', 'Truck', 'Van / Fleet'];
const PRICING_SERVICES = ['Full Wrap', 'Partial Wrap (Hood)', 'Partial Wrap (Roof)', 'Roof + Hood', 'Racing Stripes', 'PPF Full Front', 'PPF Full Body', 'Ceramic Coat'];
const DEFAULT_MATRIX = {
  'Full Wrap':           [2800, 3400, 3900, 4600, 5200, 6800],
  'Partial Wrap (Hood)': [550,  620,  720,  840,  920,  1100],
  'Partial Wrap (Roof)': [480,  560,  640,  760,  800,  980],
  'Roof + Hood':         [980,  1140, 1310, 1540, 1680, 2020],
  'Racing Stripes':      [400,  440,  500,  580,  620,  780],
  'PPF Full Front':      [1200, 1450, 1700, 2000, 2200, 2800],
  'PPF Full Body':       [3800, 4600, 5400, 6400, 7200, 9200],
  'Ceramic Coat':        [900,  1100, 1300, 1600, 1800, 2400],
};
function PricingMatricesPage() {
  const [matrix, setMatrix] = useState(DEFAULT_MATRIX);
  const [saved, setSaved] = useState(false);

  const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };

  const update = (svc, col, val) =>
    setMatrix(m => ({ ...m, [svc]: m[svc].map((v, i) => i === col ? (parseFloat(val) || 0) : v) }));

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Pricing Matrices">
        <Button variant="primary" onClick={handleSave} className={saved ? 'bg-green-500 hover:bg-green-600' : ''}>
          {saved ? 'Saved!' : 'Save'}
        </Button>
      </PageHeader>
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-5xl space-y-4">
          <p className="text-xs text-[#64748B] dark:text-[#7D93AE]">
            Base pricing by service type and vehicle class. Individual estimates may override these values. All prices in USD.
          </p>
          <Card>
            <CardHeader title="Service × Vehicle Class Pricing" />
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-[#243348] bg-gray-50 dark:bg-[#0F1923]/40">
                    <th className="px-4 py-2.5 text-left font-semibold text-[10px] uppercase tracking-wider text-[#64748B] dark:text-[#7D93AE] min-w-[160px]">Service</th>
                    {VEHICLE_COLS.map(c => (
                      <th key={c} className="px-3 py-2.5 text-center font-semibold text-[10px] uppercase tracking-wider text-[#64748B] dark:text-[#7D93AE] min-w-[90px]">{c}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {PRICING_SERVICES.map((svc, si) => (
                    <tr key={svc} className={`border-b border-gray-100 dark:border-[#243348] last:border-0 ${si % 2 === 0 ? '' : 'bg-gray-50/50 dark:bg-[#243348]/20'}`}>
                      <td className="px-4 py-2 text-xs font-medium text-[#0F1923] dark:text-[#F8FAFE]">{svc}</td>
                      {VEHICLE_COLS.map((_, ci) => (
                        <td key={ci} className="px-3 py-2 text-center">
                          <div className="relative inline-flex items-center">
                            <span className="absolute left-2 text-[10px] text-[#64748B] pointer-events-none">$</span>
                            <input
                              type="number" min="0"
                              value={matrix[svc][ci]}
                              onChange={e => update(svc, ci, e.target.value)}
                              className="w-20 h-7 pl-5 pr-2 rounded border border-gray-200 dark:border-[#243348] bg-white dark:bg-[#1B2A3E] text-xs text-right font-mono text-[#0F1923] dark:text-[#F8FAFE] focus:outline-none focus:border-[#2E8BF0] focus:ring-1 focus:ring-[#2E8BF0] transition-colors"
                            />
                          </div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card>
            <CardHeader title="Complexity Adjustments" />
            <CardBody>
              <p className="text-xs text-[#64748B] dark:text-[#7D93AE] mb-4">
                Percentage modifiers applied on top of base matrix pricing based on vehicle complexity.
              </p>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'Low Complexity', desc: 'Standard shapes, few body lines', val: '0%' },
                  { label: 'Medium Complexity', desc: 'Some curves, moderate panel count', val: '+12%' },
                  { label: 'High Complexity', desc: 'Extreme contours, many recesses', val: '+28%' },
                ].map(({ label, desc, val }) => (
                  <div key={label} className="rounded border border-gray-200 dark:border-[#243348] p-3">
                    <p className="text-xs font-semibold text-[#0F1923] dark:text-[#F8FAFE] mb-0.5">{label}</p>
                    <p className="text-[10px] text-[#64748B] dark:text-[#7D93AE] mb-2">{desc}</p>
                    <TextInput className="w-full text-right font-mono" defaultValue={val} />
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// LABOR MATRICES
// ─────────────────────────────────────────────
const DEFAULT_LABOR_MATRIX = {
  'Full Wrap':           [12, 16, 20, 24, 28, 38],
  'Partial Wrap (Hood)': [2,  2.5, 3, 3.5, 4,  5 ],
  'Partial Wrap (Roof)': [1.5,2,  2.5,3,   3.5,4.5],
  'Roof + Hood':         [3.5,4.5,5.5,6.5, 7.5,9.5],
  'Racing Stripes':      [1.5,2,  2.5,3,   3.5,4  ],
  'PPF Full Front':      [4,  5,  6,  7,   8,  10 ],
  'PPF Full Body':       [14, 18, 22, 26,  30, 40 ],
  'Ceramic Coat':        [3,  4,  5,  6,   7,  9  ],
};
function LaborMatricesPage() {
  const [matrix, setMatrix] = useState(DEFAULT_LABOR_MATRIX);
  const [saved, setSaved] = useState(false);
  const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };
  const update = (svc, col, val) =>
    setMatrix(m => ({ ...m, [svc]: m[svc].map((v, i) => i === col ? (parseFloat(val) || 0) : v) }));

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Labor Matrices">
        <Button variant="primary" onClick={handleSave} className={saved ? 'bg-green-500 hover:bg-green-600' : ''}>
          {saved ? 'Saved!' : 'Save'}
        </Button>
      </PageHeader>
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-5xl space-y-4">
          <p className="text-xs text-[#64748B] dark:text-[#7D93AE]">
            Estimated labor hours by service type and vehicle class. Used to auto-calculate labor cost on estimates.
          </p>
          <Card>
            <CardHeader title="Hours × Vehicle Class" />
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-[#243348] bg-gray-50 dark:bg-[#0F1923]/40">
                    <th className="px-4 py-2.5 text-left font-semibold text-[10px] uppercase tracking-wider text-[#64748B] dark:text-[#7D93AE] min-w-[160px]">Service</th>
                    {VEHICLE_COLS.map(c => (
                      <th key={c} className="px-3 py-2.5 text-center font-semibold text-[10px] uppercase tracking-wider text-[#64748B] dark:text-[#7D93AE] min-w-[90px]">{c}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {PRICING_SERVICES.map((svc, si) => (
                    <tr key={svc} className={`border-b border-gray-100 dark:border-[#243348] last:border-0 ${si % 2 === 0 ? '' : 'bg-gray-50/50 dark:bg-[#243348]/20'}`}>
                      <td className="px-4 py-2 text-xs font-medium text-[#0F1923] dark:text-[#F8FAFE]">{svc}</td>
                      {VEHICLE_COLS.map((_, ci) => (
                        <td key={ci} className="px-3 py-2 text-center">
                          <input
                            type="number" min="0" step="0.5"
                            value={matrix[svc][ci]}
                            onChange={e => update(svc, ci, e.target.value)}
                            className="w-16 h-7 px-2 rounded border border-gray-200 dark:border-[#243348] bg-white dark:bg-[#1B2A3E] text-xs text-center font-mono text-[#0F1923] dark:text-[#F8FAFE] focus:outline-none focus:border-[#2E8BF0] focus:ring-1 focus:ring-[#2E8BF0] transition-colors"
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card>
            <CardHeader title="Installer Count" />
            <CardBody>
              <p className="text-xs text-[#64748B] dark:text-[#7D93AE] mb-4">
                Default number of installers assigned per vehicle class. Affects total elapsed time shown on work orders.
              </p>
              <div className="grid grid-cols-6 gap-3">
                {VEHICLE_COLS.map((col) => (
                  <div key={col} className="text-center">
                    <p className="text-[10px] font-medium text-[#64748B] dark:text-[#7D93AE] mb-1.5">{col}</p>
                    <SelectInput defaultValue={col.includes('Van') || col.includes('Truck') ? '2' : '1'}>
                      {['1','2','3','4'].map(n => <option key={n} value={n}>{n} installer{n !== '1' ? 's' : ''}</option>)}
                    </SelectInput>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// PAYMENT TERMS
// ─────────────────────────────────────────────
const DEFAULT_TERMS = [
  { id: 1, name: 'Due on Receipt',  days: 0,  depositPct: 100, default: true,  active: true  },
  { id: 2, name: 'Net 15',          days: 15, depositPct: 0,   default: false, active: true  },
  { id: 3, name: 'Net 30',          days: 30, depositPct: 0,   default: false, active: true  },
  { id: 4, name: 'Net 60',          days: 60, depositPct: 0,   default: false, active: false },
  { id: 5, name: '50% Deposit',     days: 0,  depositPct: 50,  default: false, active: true  },
  { id: 6, name: '30% Deposit',     days: 0,  depositPct: 30,  default: false, active: false },
];
function PaymentTermsPage() {
  const [terms, setTerms] = useState(DEFAULT_TERMS);
  const [adding, setAdding] = useState(false);
  const [newTerm, setNewTerm] = useState({ name: '', days: 0, depositPct: 0 });
  const [saved, setSaved] = useState(false);

  const update = (id, field, val) =>
    setTerms(t => t.map(x => x.id === id ? { ...x, [field]: val } : x));
  const setDefault = (id) =>
    setTerms(t => t.map(x => ({ ...x, default: x.id === id })));
  const remove = (id) => setTerms(t => t.filter(x => x.id !== id));
  const saveNew = () => {
    if (!newTerm.name.trim()) return;
    setTerms(t => [...t, { id: Date.now(), ...newTerm, default: false, active: true }]);
    setNewTerm({ name: '', days: 0, depositPct: 0 });
    setAdding(false);
  };
  const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Payment Terms">
        <Button variant="outline" onClick={() => setAdding(true)}>+ Add Term</Button>
        <Button variant="primary" onClick={handleSave} className={saved ? 'bg-green-500 hover:bg-green-600' : ''}>{saved ? 'Saved!' : 'Save'}</Button>
      </PageHeader>
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-3xl space-y-4">
          <p className="text-xs text-[#64748B] dark:text-[#7D93AE]">
            Payment terms define deposit requirements and due dates on estimates and invoices.
            The default term is pre-selected when creating new estimates.
          </p>
          <Card>
            <CardHeader title="Configured Terms" />
            <CardBody className="p-0">
              <div className="grid grid-cols-[1fr_80px_90px_70px_60px_36px] gap-2 px-5 py-2 border-b border-gray-100 dark:border-[#243348] bg-gray-50 dark:bg-[#0F1923]/40">
                {['Name', 'Net Days', 'Deposit %', 'Default', 'Active', ''].map(h => (
                  <span key={h} className="text-[10px] font-semibold uppercase tracking-wider text-[#64748B] dark:text-[#7D93AE]">{h}</span>
                ))}
              </div>
              {terms.map(term => (
                <div key={term.id} className="grid grid-cols-[1fr_80px_90px_70px_60px_36px] gap-2 items-center px-5 py-3 border-b border-gray-100 dark:border-[#243348] last:border-0 hover:bg-gray-50 dark:hover:bg-[#243348]/30 group">
                  <TextInput
                    height="h-7" value={term.name}
                    onChange={e => update(term.id, 'name', e.target.value)}
                  />
                  <TextInput
                    type="number" min="0" height="h-7" className="text-right font-mono"
                    value={term.days} onChange={e => update(term.id, 'days', parseInt(e.target.value) || 0)}
                  />
                  <div className="flex items-center gap-1">
                    <TextInput
                      type="number" min="0" max="100" height="h-7" className="text-right font-mono"
                      value={term.depositPct} onChange={e => update(term.id, 'depositPct', parseInt(e.target.value) || 0)}
                    />
                    <span className="text-xs text-[#64748B]">%</span>
                  </div>
                  <div className="flex justify-center">
                    {term.default ? (
                      <span className="px-1.5 py-0.5 rounded-full bg-[#2E8BF0]/15 text-[#2E8BF0] text-[9px] font-bold">DEFAULT</span>
                    ) : (
                      <button onClick={() => setDefault(term.id)} className="text-[10px] text-[#64748B] hover:text-[#2E8BF0] transition-colors">Set</button>
                    )}
                  </div>
                  <Toggle on={term.active} onChange={v => update(term.id, 'active', v)} />
                  <button onClick={() => remove(term.id)} className="opacity-0 group-hover:opacity-100 w-7 h-7 rounded flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              ))}
              {adding && (
                <div className="grid grid-cols-[1fr_80px_90px_70px_60px_36px] gap-2 items-center px-5 py-3 bg-blue-50/40 dark:bg-[#2E8BF0]/5">
                  <TextInput placeholder="Term name…" height="h-7" value={newTerm.name} onChange={e => setNewTerm(r => ({ ...r, name: e.target.value }))} autoFocus />
                  <TextInput type="number" min="0" height="h-7" className="text-right font-mono" value={newTerm.days} onChange={e => setNewTerm(r => ({ ...r, days: parseInt(e.target.value) || 0 }))} />
                  <div className="flex items-center gap-1">
                    <TextInput type="number" min="0" max="100" height="h-7" className="text-right font-mono" value={newTerm.depositPct} onChange={e => setNewTerm(r => ({ ...r, depositPct: parseInt(e.target.value) || 0 }))} />
                    <span className="text-xs text-[#64748B]">%</span>
                  </div>
                  <span /><span />
                  <div className="flex gap-1">
                    <button onClick={saveNew} className="w-7 h-7 rounded text-white flex items-center justify-center text-xs" style={{ backgroundColor: 'var(--btn-primary-bg)' }}>✓</button>
                    <button onClick={() => setAdding(false)} className="w-7 h-7 rounded border border-gray-200 dark:border-[#243348] text-gray-400 flex items-center justify-center text-xs hover:text-red-500">✕</button>
                  </div>
                </div>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Late Payment Policy" />
            <CardBody>
              <div className="space-y-4">
                {[
                  { label: 'Late fee percentage', desc: 'Applied to overdue invoice balance.', defaultVal: '1.5%' },
                  { label: 'Grace period (days)', desc: 'Days after due date before late fee applies.', defaultVal: '5' },
                ].map(({ label, desc, defaultVal }, i) => (
                  <div key={i} className={`flex items-center justify-between gap-4 ${i > 0 ? 'border-t border-gray-100 dark:border-[#243348] pt-4' : ''}`}>
                    <div>
                      <p className="text-xs font-medium text-[#0F1923] dark:text-[#F8FAFE]">{label}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">{desc}</p>
                    </div>
                    <TextInput className="w-24 text-right font-mono" defaultValue={defaultVal} />
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// PAYMENT TYPES
// ─────────────────────────────────────────────
const DEFAULT_PAYMENT_TYPES = [
  { id: 1, name: 'Cash',          icon: 'banknotes',           fee: 0,    feeType: 'none',    surchargeNote: '',             active: true  },
  { id: 2, name: 'Check',         icon: 'document',            fee: 0,    feeType: 'none',    surchargeNote: 'NSF: $35',     active: true  },
  { id: 3, name: 'Credit Card',   icon: 'credit-card',         fee: 2.9,  feeType: 'pct',     surchargeNote: '+ $0.30/txn',  active: true  },
  { id: 4, name: 'Debit Card',    icon: 'credit-card',         fee: 1.5,  feeType: 'pct',     surchargeNote: '',             active: true  },
  { id: 5, name: 'ACH / eCheck',  icon: 'building-library',    fee: 0.8,  feeType: 'pct',     surchargeNote: 'Max $5.00',    active: true  },
  { id: 6, name: 'Venmo',         icon: 'device-phone-mobile', fee: 0,    feeType: 'none',    surchargeNote: 'Personal only', active: false },
  { id: 7, name: 'Zelle',         icon: 'bolt',                fee: 0,    feeType: 'none',    surchargeNote: '',             active: false },
  { id: 8, name: 'Financing',     icon: 'clipboard',           fee: 0,    feeType: 'none',    surchargeNote: '3rd party',    active: true  },
];
function PaymentTypesPage() {
  const [types, setTypes] = useState(DEFAULT_PAYMENT_TYPES);
  const [saved, setSaved] = useState(false);
  const update = (id, field, val) => setTypes(t => t.map(x => x.id === id ? { ...x, [field]: val } : x));
  const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Payment Types">
        <Button variant="primary" onClick={handleSave} className={saved ? 'bg-green-500 hover:bg-green-600' : ''}>{saved ? 'Saved!' : 'Save'}</Button>
      </PageHeader>
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-3xl space-y-4">
          <p className="text-xs text-[#64748B] dark:text-[#7D93AE]">
            Configure which payment methods appear on invoices and estimates. Processing fees are shown to staff as a reminder — they are not automatically added to the customer bill unless configured in Payments.
          </p>
          <Card>
            <CardHeader title="Accepted Payment Methods" />
            <CardBody className="p-0">
              <div className="grid grid-cols-[32px_1fr_110px_130px_60px] gap-3 px-5 py-2 border-b border-gray-100 dark:border-[#243348] bg-gray-50 dark:bg-[#0F1923]/40">
                {['', 'Method', 'Processing Fee', 'Note', 'Active'].map(h => (
                  <span key={h} className="text-[10px] font-semibold uppercase tracking-wider text-[#64748B] dark:text-[#7D93AE]">{h}</span>
                ))}
              </div>
              {types.map(type => (
                <div key={type.id} className={`grid grid-cols-[32px_1fr_110px_130px_60px] gap-3 items-center px-5 py-3 border-b border-gray-100 dark:border-[#243348] last:border-0 hover:bg-gray-50 dark:hover:bg-[#243348]/30 ${!type.active ? 'opacity-50' : ''}`}>
                  <WMIcon name={type.icon} className="w-5 h-5 text-[#64748B] dark:text-[#7D93AE]" />
                  <span className="text-xs font-medium text-[#0F1923] dark:text-[#F8FAFE]">{type.name}</span>
                  <div className="flex items-center gap-1">
                    {type.feeType === 'pct' ? (
                      <>
                        <TextInput type="number" min="0" step="0.1" height="h-7" className="w-16 text-right font-mono" value={type.fee} onChange={e => update(type.id, 'fee', parseFloat(e.target.value) || 0)} />
                        <span className="text-xs text-[#64748B]">%</span>
                      </>
                    ) : (
                      <span className="text-xs text-[#64748B] dark:text-[#7D93AE] italic">No fee</span>
                    )}
                  </div>
                  <span className="text-[10px] text-[#64748B] dark:text-[#7D93AE]">{type.surchargeNote}</span>
                  <Toggle on={type.active} onChange={v => update(type.id, 'active', v)} />
                </div>
              ))}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Surcharge Settings" />
            <CardBody>
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-medium text-[#0F1923] dark:text-[#F8FAFE]">Pass credit card surcharge to customer</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">When enabled, the processing fee is added to the customer's invoice total automatically.</p>
                  </div>
                  <Toggle on={false} onChange={() => {}} />
                </div>
                <div className="border-t border-gray-100 dark:border-[#243348] pt-4 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-medium text-[#0F1923] dark:text-[#F8FAFE]">Show payment method on invoice</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">Prints the selected payment method next to the total on the customer copy.</p>
                  </div>
                  <Toggle on={true} onChange={() => {}} />
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// PAYMENTS (Processor / Gateway)
// ─────────────────────────────────────────────
function PaymentsPage() {
  const [processor, setProcessor] = useState('stripe');
  const [testMode, setTestMode]   = useState(true);
  const [autoReceipt, setAutoReceipt] = useState(true);
  const [saved, setSaved] = useState(false);
  const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };

  const processors = [
    { id: 'stripe', name: 'Stripe', desc: 'Cards, ACH, wallets. 2.9% + 30¢', logo: 'bolt' },
    { id: 'square', name: 'Square', desc: 'In-person + online. 2.6% + 10¢',   logo: 'squares-2x2' },
    { id: 'none',   name: 'Manual', desc: 'No integrated processor. Manual tracking only.', logo: 'clipboard' },
  ];

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Payments">
        <Button variant="primary" onClick={handleSave} className={saved ? 'bg-green-500 hover:bg-green-600' : ''}>{saved ? 'Saved!' : 'Save'}</Button>
      </PageHeader>
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-3xl space-y-4">

          {/* Processor selector */}
          <Card>
            <CardHeader title="Payment Processor" />
            <CardBody>
              <div className="grid grid-cols-3 gap-3 mb-4">
                {processors.map(p => (
                  <button
                    key={p.id}
                    onClick={() => setProcessor(p.id)}
                    className={`rounded border p-3 text-left transition-all ${
                      processor === p.id
                        ? 'border-[#2E8BF0] bg-[#2E8BF0]/8 ring-1 ring-[#2E8BF0]/40'
                        : 'border-gray-200 dark:border-[#243348] hover:border-[#2E8BF0]/40'
                    }`}
                  >
                    <div className="mb-1"><WMIcon name={p.logo} className="w-6 h-6 text-[#64748B] dark:text-[#7D93AE]" /></div>
                    <p className="text-xs font-semibold text-[#0F1923] dark:text-[#F8FAFE]">{p.name}</p>
                    <p className="text-[10px] text-[#64748B] dark:text-[#7D93AE] mt-0.5 leading-snug">{p.desc}</p>
                    {processor === p.id && (
                      <span className="inline-block mt-1.5 text-[9px] font-bold text-[#2E8BF0] uppercase tracking-wider">Selected</span>
                    )}
                  </button>
                ))}
              </div>
            </CardBody>
          </Card>

          {processor !== 'none' && (
            <Card>
              <CardHeader title={`${processor === 'stripe' ? 'Stripe' : 'Square'} Configuration`} />
              <CardBody>
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-medium text-[#0F1923] dark:text-[#F8FAFE]">Test mode</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">Use sandbox credentials. No real charges processed.</p>
                    </div>
                    <Toggle on={testMode} onChange={setTestMode} />
                  </div>
                  <div className="border-t border-gray-100 dark:border-[#243348] pt-4 space-y-3">
                    <Field label={testMode ? 'Test Publishable Key' : 'Live Publishable Key'}>
                      <div className="relative">
                        <TextInput
                          className="font-mono text-xs pr-20"
                          placeholder={processor === 'stripe' ? 'pk_test_…' : 'sandbox-sq0idp-…'}
                          defaultValue={processor === 'stripe' ? 'pk_test_51Kx…' : ''}
                        />
                        <span className={`absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-bold px-1.5 py-0.5 rounded ${testMode ? 'bg-amber-100 text-amber-600' : 'bg-green-100 text-green-700'}`}>
                          {testMode ? 'TEST' : 'LIVE'}
                        </span>
                      </div>
                    </Field>
                    <Field label={testMode ? 'Test Secret Key' : 'Live Secret Key'}>
                      <TextInput
                        className="font-mono text-xs"
                        type="password"
                        placeholder={processor === 'stripe' ? 'sk_test_…' : 'sandbox-sq0csp-…'}
                        defaultValue="sk_test_••••••••••••••••••••••"
                      />
                    </Field>
                    {processor === 'stripe' && (
                      <Field label="Webhook Signing Secret">
                        <TextInput className="font-mono text-xs" type="password" placeholder="whsec_…" />
                      </Field>
                    )}
                  </div>
                  <div className="rounded border border-dashed border-gray-200 dark:border-[#243348] p-3 flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" />
                    <p className="text-[11px] text-[#64748B] dark:text-[#7D93AE]">
                      Keys are stored encrypted. Only the last 4 characters are shown after saving.
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>
          )}

          <Card>
            <CardHeader title="Receipt Settings" />
            <CardBody>
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-medium text-[#0F1923] dark:text-[#F8FAFE]">Auto-send receipt on payment</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">Sends an email receipt to the customer immediately after payment clears.</p>
                  </div>
                  <Toggle on={autoReceipt} onChange={setAutoReceipt} />
                </div>
                <div className="border-t border-gray-100 dark:border-[#243348] pt-4">
                  <Field label="Receipt email from name">
                    <TextInput defaultValue="WrapMind Shop" />
                  </Field>
                </div>
                <Field label="Reply-to email">
                  <TextInput type="email" defaultValue="billing@wraplabs.io" />
                </Field>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// CARFAX
// ─────────────────────────────────────────────
function CarfaxPage() {
  const [connected, setConnected] = useState(false);
  const [autoLookup, setAutoLookup] = useState(true);
  const [saved, setSaved] = useState(false);
  const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Carfax Integration">
        <Button variant="primary" onClick={handleSave} className={saved ? 'bg-green-500 hover:bg-green-600' : ''}>{saved ? 'Saved!' : 'Save'}</Button>
      </PageHeader>
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-2xl space-y-4">

          <Card>
            <CardHeader title="Connection Status" />
            <CardBody>
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${connected ? 'bg-green-100 dark:bg-green-900/30' : 'bg-gray-100 dark:bg-gray-700'}`}>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" /></svg>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#0F1923] dark:text-[#F8FAFE]">Carfax for Business</p>
                    <p className={`text-[11px] mt-0.5 ${connected ? 'text-green-600 dark:text-green-400' : 'text-[#64748B] dark:text-[#7D93AE]'}`}>
                      {connected ? '● Connected' : '○ Not connected'}
                    </p>
                  </div>
                </div>
                <Button
                  variant={connected ? 'outline' : 'primary'}
                  onClick={() => setConnected(c => !c)}
                >
                  {connected ? 'Disconnect' : 'Connect Account'}
                </Button>
              </div>
              {!connected && (
                <div className="mt-4 rounded border border-dashed border-gray-200 dark:border-[#243348] p-4 text-center">
                  <p className="text-xs text-[#64748B] dark:text-[#7D93AE] mb-2">
                    Connect your Carfax for Business account to enable vehicle history lookups directly from the VIN search.
                  </p>
                  <a href="#" className="text-xs text-[#2E8BF0] hover:underline">Learn about Carfax for Business →</a>
                </div>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Lookup Settings" />
            <CardBody>
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-medium text-[#0F1923] dark:text-[#F8FAFE]">Automatic VIN lookup</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">Automatically fetch Carfax report when a VIN is entered on a new estimate.</p>
                  </div>
                  <Toggle on={autoLookup} onChange={setAutoLookup} />
                </div>
                <div className="border-t border-gray-100 dark:border-[#243348] pt-4 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-medium text-[#0F1923] dark:text-[#F8FAFE]">Show accident history badge on estimates</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">Displays a warning badge when the vehicle has a reported accident. Useful for PPF pricing.</p>
                  </div>
                  <Toggle on={true} onChange={() => {}} />
                </div>
                <div className="border-t border-gray-100 dark:border-[#243348] pt-4 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-medium text-[#0F1923] dark:text-[#F8FAFE]">Include previous owner count</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">Shows number of previous owners on the vehicle card. Helps assess surface condition risk.</p>
                  </div>
                  <Toggle on={true} onChange={() => {}} />
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Usage This Month" />
            <CardBody>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'Lookups Used', value: '24', sub: 'of 100 included' },
                  { label: 'Overage Lookups', value: '0', sub: 'at $0.99 each' },
                  { label: 'Renewal Date', value: 'May 1', sub: '2025' },
                ].map(({ label, value, sub }) => (
                  <div key={label} className="rounded border border-gray-100 dark:border-[#243348] p-3">
                    <p className="text-[10px] uppercase tracking-wider font-semibold text-[#64748B] dark:text-[#7D93AE] mb-1">{label}</p>
                    <p className="text-lg font-bold font-mono text-[#0F1923] dark:text-[#F8FAFE]">{value}</p>
                    <p className="text-[10px] text-[#64748B] dark:text-[#7D93AE]">{sub}</p>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// API KEYS
// ─────────────────────────────────────────────
const INITIAL_API_KEYS = [
  { id: 'k1', name: 'Production Key',  key: 'wm_live_4xKp…rT9q', created: '2024-11-01', lastUsed: '2025-04-09', scopes: ['read', 'write'], active: true  },
  { id: 'k2', name: 'Staging Key',     key: 'wm_test_8mNz…vL2w', created: '2024-12-15', lastUsed: '2025-03-28', scopes: ['read'],          active: true  },
  { id: 'k3', name: 'Zapier Webhook',  key: 'wm_live_1jHf…xP5r', created: '2025-01-10', lastUsed: '2025-04-08', scopes: ['write'],         active: true  },
  { id: 'k4', name: 'Old Integration', key: 'wm_live_9aDk…mQ3s', created: '2024-08-22', lastUsed: '2024-10-01', scopes: ['read'],          active: false },
];
function APIKeysPage() {
  const [keys, setKeys]         = useState(INITIAL_API_KEYS);
  const [creating, setCreating] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyScopes, setNewKeyScopes] = useState(['read']);
  const [newKeyResult, setNewKeyResult] = useState(null);
  const [copied, setCopied]     = useState('');

  const copyKey = (id, val) => {
    navigator.clipboard.writeText(val).catch(() => {});
    setCopied(id);
    setTimeout(() => setCopied(''), 2000);
  };

  const revokeKey = (id) => setKeys(k => k.map(x => x.id === id ? { ...x, active: false } : x));

  const createKey = () => {
    if (!newKeyName.trim()) return;
    const fake = `wm_live_${Math.random().toString(36).slice(2, 6)}…${Math.random().toString(36).slice(2, 6)}`;
    const full  = `wm_live_${Math.random().toString(36).slice(2, 24)}`;
    const newK  = { id: `k${Date.now()}`, name: newKeyName, key: fake, created: new Date().toISOString().slice(0,10), lastUsed: '—', scopes: newKeyScopes, active: true };
    setKeys(k => [newK, ...k]);
    setNewKeyResult(full);
    setNewKeyName('');
    setNewKeyScopes(['read']);
  };

  const SCOPE_COLORS = { read: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300', write: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300' };

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="API Keys">
        <Button variant="primary" onClick={() => setCreating(true)}>+ New Key</Button>
      </PageHeader>
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-3xl space-y-4">
          <p className="text-xs text-[#64748B] dark:text-[#7D93AE]">
            API keys grant programmatic access to your WrapMind account. Keep secret keys private — treat them like passwords.
          </p>

          {/* Create key panel */}
          {creating && !newKeyResult && (
            <Card>
              <CardHeader title="Create New API Key" />
              <CardBody>
                <div className="space-y-3">
                  <Field label="Key Name">
                    <TextInput placeholder="e.g. Zapier Integration" value={newKeyName} onChange={e => setNewKeyName(e.target.value)} autoFocus />
                  </Field>
                  <div>
                    <label className={labelCls}>Scopes</label>
                    <div className="flex gap-2 mt-1">
                      {['read', 'write'].map(s => (
                        <label key={s} className="flex items-center gap-1.5 cursor-pointer text-xs text-[#0F1923] dark:text-[#F8FAFE]">
                          <input type="checkbox" checked={newKeyScopes.includes(s)} onChange={e => setNewKeyScopes(prev => e.target.checked ? [...prev, s] : prev.filter(x => x !== s))} className="rounded border-gray-300 dark:border-gray-600 text-[#2E8BF0]" />
                          {s.charAt(0).toUpperCase() + s.slice(1)}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Button variant="primary" onClick={createKey}>Generate Key</Button>
                    <Button variant="outline" onClick={() => setCreating(false)}>Cancel</Button>
                  </div>
                </div>
              </CardBody>
            </Card>
          )}

          {/* Show newly created key — one-time display */}
          {newKeyResult && (
            <div className="rounded border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 p-4">
              <div className="flex items-start gap-2 mb-2">
                <svg className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                <div>
                  <p className="text-xs font-semibold text-green-800 dark:text-green-300">API key created — copy it now</p>
                  <p className="text-[11px] text-green-700/70 dark:text-green-400/70 mt-0.5">This key will not be shown again after you navigate away.</p>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <code className="flex-1 font-mono text-xs bg-white dark:bg-[#1B2A3E] border border-gray-200 dark:border-[#243348] px-3 py-2 rounded text-[#0F1923] dark:text-[#F8FAFE] overflow-x-auto">
                  {newKeyResult}
                </code>
                <Button variant="primary" onClick={() => copyKey('new', newKeyResult)} className="flex-shrink-0">
                  {copied === 'new' ? 'Copied!' : 'Copy'}
                </Button>
              </div>
              <button onClick={() => { setNewKeyResult(null); setCreating(false); }} className="mt-3 text-xs text-green-700 dark:text-green-400 hover:underline">
                I've saved this key →
              </button>
            </div>
          )}

          <Card>
            <CardHeader title="Active Keys" />
            <CardBody className="p-0">
              {keys.map((k, i) => (
                <div key={k.id} className={`px-5 py-4 border-b border-gray-100 dark:border-[#243348] last:border-0 ${!k.active ? 'opacity-50' : ''}`}>
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold text-[#0F1923] dark:text-[#F8FAFE]">{k.name}</span>
                        {k.scopes.map(s => (
                          <span key={s} className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${SCOPE_COLORS[s]}`}>{s.toUpperCase()}</span>
                        ))}
                        {!k.active && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-400">REVOKED</span>}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <code className="text-[11px] font-mono text-[#64748B] dark:text-[#7D93AE]">{k.key}</code>
                        <button onClick={() => copyKey(k.id, k.key)} className="text-[10px] text-[#2E8BF0] hover:underline flex-shrink-0">
                          {copied === k.id ? 'Copied!' : 'Copy'}
                        </button>
                      </div>
                      <p className="text-[10px] text-gray-400 mt-0.5">Created {k.created} · Last used {k.lastUsed}</p>
                    </div>
                    {k.active && (
                      <button onClick={() => revokeKey(k.id)} className="text-xs text-red-500 hover:text-red-700 hover:underline flex-shrink-0 transition-colors">
                        Revoke
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Rate Limits" />
            <CardBody>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'Requests / minute', value: '120' },
                  { label: 'Requests / day', value: '10,000' },
                  { label: 'Max payload size', value: '4 MB' },
                ].map(({ label, value }) => (
                  <div key={label} className="rounded border border-gray-100 dark:border-[#243348] p-3">
                    <p className="text-[10px] uppercase tracking-wider font-semibold text-[#64748B] dark:text-[#7D93AE] mb-1">{label}</p>
                    <p className="text-base font-bold font-mono text-[#0F1923] dark:text-[#F8FAFE]">{value}</p>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// WEBHOOKS
// ─────────────────────────────────────────────
const WEBHOOK_EVENTS = ['estimate.created', 'estimate.sent', 'estimate.approved', 'estimate.completed', 'invoice.paid', 'lead.created', 'lead.converted', 'customer.created', 'vehicle.added'];
const INITIAL_WEBHOOKS = [
  { id: 'wh1', name: 'Zapier Lead Intake', url: 'https://hooks.zapier.com/hooks/catch/123456/abcdef/', events: ['lead.created', 'lead.converted'], active: true,  lastStatus: 200, lastAt: '2025-04-09T10:34:00Z' },
  { id: 'wh2', name: 'Slack Notifications', url: 'https://hooks.slack.com/services/T0/B0/xxxx',       events: ['estimate.sent', 'invoice.paid'],   active: true,  lastStatus: 200, lastAt: '2025-04-09T08:11:00Z' },
  { id: 'wh3', name: 'CRM Sync',           url: 'https://api.example.com/wm-webhook',               events: ['customer.created', 'vehicle.added'], active: false, lastStatus: 503, lastAt: '2025-03-15T16:00:00Z' },
];
function WebhooksPage() {
  const [hooks, setHooks]       = useState(INITIAL_WEBHOOKS);
  const [creating, setCreating] = useState(false);
  const [form, setForm]         = useState({ name: '', url: '', events: [] });
  const [testingId, setTestingId] = useState(null);
  const [testResult, setTestResult] = useState({});

  const remove = (id) => setHooks(h => h.filter(x => x.id !== id));
  const toggle = (id) => setHooks(h => h.map(x => x.id === id ? { ...x, active: !x.active } : x));

  const saveHook = () => {
    if (!form.url.trim() || form.events.length === 0) return;
    setHooks(h => [...h, { id: `wh${Date.now()}`, name: form.name || 'Untitled Hook', url: form.url, events: form.events, active: true, lastStatus: null, lastAt: null }]);
    setForm({ name: '', url: '', events: [] });
    setCreating(false);
  };

  const testHook = async (id) => {
    setTestingId(id);
    await new Promise(r => setTimeout(r, 1200));
    setTestingId(null);
    setTestResult(r => ({ ...r, [id]: Math.random() > 0.2 ? 'ok' : 'fail' }));
    setTimeout(() => setTestResult(r => { const n = { ...r }; delete n[id]; return n; }), 3000);
  };

  const toggleEvent = (evt) => setForm(f => ({
    ...f, events: f.events.includes(evt) ? f.events.filter(e => e !== evt) : [...f.events, evt]
  }));

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Webhooks">
        <Button variant="primary" onClick={() => setCreating(true)}>+ Add Webhook</Button>
      </PageHeader>
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-3xl space-y-4">
          <p className="text-xs text-[#64748B] dark:text-[#7D93AE]">
            Webhooks send real-time HTTP POST notifications to external services when events occur in WrapMind.
          </p>

          {creating && (
            <Card>
              <CardHeader title="New Webhook" />
              <CardBody>
                <div className="space-y-3">
                  <Field label="Endpoint Name (optional)">
                    <TextInput placeholder="e.g. Zapier Lead Intake" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                  </Field>
                  <Field label="Endpoint URL *">
                    <TextInput placeholder="https://…" value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} autoFocus />
                  </Field>
                  <div>
                    <label className={labelCls}>Events to send *</label>
                    <div className="grid grid-cols-2 gap-1 mt-1.5">
                      {WEBHOOK_EVENTS.map(evt => (
                        <label key={evt} className="flex items-center gap-1.5 cursor-pointer text-xs text-[#64748B] dark:text-[#7D93AE] hover:text-[#0F1923] dark:hover:text-[#F8FAFE]">
                          <input type="checkbox" checked={form.events.includes(evt)} onChange={() => toggleEvent(evt)} className="rounded border-gray-300 dark:border-gray-600 text-[#2E8BF0]" />
                          <span className="font-mono text-[11px]">{evt}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Button variant="primary" onClick={saveHook}>Save Webhook</Button>
                    <Button variant="outline" onClick={() => setCreating(false)}>Cancel</Button>
                  </div>
                </div>
              </CardBody>
            </Card>
          )}

          <Card>
            <CardHeader title="Configured Endpoints" />
            <CardBody className="p-0">
              {hooks.length === 0 && (
                <div className="px-5 py-8 text-center text-xs text-[#64748B] dark:text-[#7D93AE]">No webhooks configured yet.</div>
              )}
              {hooks.map(hook => (
                <div key={hook.id} className="px-5 py-4 border-b border-gray-100 dark:border-[#243348] last:border-0">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold text-[#0F1923] dark:text-[#F8FAFE]">{hook.name}</span>
                        {hook.lastStatus && (
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${hook.lastStatus === 200 ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'}`}>
                            {hook.lastStatus}
                          </span>
                        )}
                        {!hook.active && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-400">PAUSED</span>}
                      </div>
                      <p className="text-[11px] font-mono text-[#64748B] dark:text-[#7D93AE] mt-0.5 truncate">{hook.url}</p>
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {hook.events.map(e => (
                          <span key={e} className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-gray-100 dark:bg-[#243348] text-[#64748B] dark:text-[#7D93AE]">{e}</span>
                        ))}
                      </div>
                      {hook.lastAt && <p className="text-[10px] text-gray-400 mt-1">Last delivery: {new Date(hook.lastAt).toLocaleString()}</p>}
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        onClick={() => testHook(hook.id)}
                        disabled={testingId === hook.id}
                        className={`h-7 px-2.5 rounded border text-[11px] font-medium transition-all ${
                          testResult[hook.id] === 'ok'   ? 'border-green-400 text-green-600' :
                          testResult[hook.id] === 'fail' ? 'border-red-400 text-red-500'     :
                          'border-gray-200 dark:border-[#243348] text-[#64748B] dark:text-[#7D93AE] hover:border-[#2E8BF0]/50 hover:text-[#2E8BF0]'
                        }`}
                      >
                        {testingId === hook.id ? (
                          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 border border-current border-t-transparent rounded-full animate-spin" />Testing</span>
                        ) : testResult[hook.id] === 'ok' ? '✓ 200 OK' : testResult[hook.id] === 'fail' ? '✕ Failed' : 'Test'}
                      </button>
                      <Toggle on={hook.active} onChange={() => toggle(hook.id)} />
                      <button onClick={() => remove(hook.id)} className="w-7 h-7 rounded flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Signing Secret" />
            <CardBody>
              <p className="text-xs text-[#64748B] dark:text-[#7D93AE] mb-3">
                Verify webhook authenticity by checking the <code className="font-mono text-[#2E8BF0]">X-WrapMind-Signature</code> header against this secret.
              </p>
              <div className="flex gap-2">
                <TextInput className="font-mono text-xs flex-1" type="password" defaultValue="whsec_wrapmind_1a2b3c4d5e6f" readOnly />
                <Button variant="outline">Reveal</Button>
                <Button variant="outline">Rotate</Button>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// SECURITY PAGE
// ─────────────────────────────────────────────

function SecurityPage() {
  const [stats,      setStats]      = useState(null);
  const [config,     setConfig]     = useState({ maxCalls: 20, windowMs: 60000 });
  const [maxInput,   setMaxInput]   = useState('20');
  const [winInput,   setWinInput]   = useState('60');
  const [saved,      setSaved]      = useState(false);
  const [clearDone,  setClearDone]  = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  // Load config and initial stats on mount
  useEffect(() => {
    const cfg = getRateLimitConfig();
    setConfig(cfg);
    setStats(getRateLimitStats());
    setMaxInput(String(cfg.maxCalls));
    setWinInput(String(Math.round(cfg.windowMs / 1000)));
  }, []);

  // Refresh stats every 5s
  useEffect(() => {
    const id = setInterval(() => setStats(getRateLimitStats()), 5000);
    return () => clearInterval(id);
  }, []);

  const handleSaveLimiter = () => {
    const maxCalls = Math.max(1, parseInt(maxInput, 10) || 20);
    const windowMs = Math.max(10, parseInt(winInput, 10) || 60) * 1000;
    setRateLimitConfig({ maxCalls, windowMs });
    setConfig({ maxCalls, windowMs });
    setStats(getRateLimitStats());
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleClearData = () => {
    Object.keys(localStorage).filter(k => k.startsWith('wm-')).forEach(k => localStorage.removeItem(k));
    setClearDone(true);
    setConfirmClear(false);
    setTimeout(() => window.location.reload(), 1200);
  };

  const usedPct = stats ? Math.round((stats.used / stats.maxCalls) * 100) : 0;

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Security" />

      <div className="flex-1 overflow-auto px-6 py-5 space-y-5">

        {/* ── Security posture summary ───────────────────────────────────────── */}
        <Card>
          <CardHeader title="Security Posture" />
          <CardBody>
            <div className="space-y-3">
              {[
                {
                  label: 'Content Security Policy',
                  status: 'active',
                  detail: 'CSP meta tag restricts resource origins — scripts, styles, images, and connect-src locked to trusted domains.',
                },
                {
                  label: 'Supabase Row-Level Security',
                  status: 'active',
                  detail: 'RLS policies on all tables ensure data is scoped to authenticated users.',
                },
                {
                  label: 'AI Rate Limiting',
                  status: 'active',
                  detail: 'Sliding-window limiter prevents runaway API usage and cost spikes. Configurable below.',
                },
                {
                  label: 'API Key — Client-Side Exposure',
                  status: 'warning',
                  detail: 'VITE_ANTHROPIC_API_KEY is bundled into the client for direct-API mode. For SaaS/multi-user deployments, proxy all AI calls through a server-side endpoint and remove the key from the browser bundle.',
                },
                {
                  label: 'Data in Transit',
                  status: 'active',
                  detail: 'All Supabase and Anthropic API traffic is TLS-encrypted (HTTPS / WSS).',
                },
                {
                  label: 'Local Storage Data',
                  status: 'info',
                  detail: 'User preferences, estimate drafts, and session data are stored in browser localStorage — not encrypted at rest. Avoid using on shared public computers.',
                },
              ].map(item => (
                <div key={item.label} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-[#0F1923]">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 mt-1.5 ${
                    item.status === 'active'  ? 'bg-emerald-500' :
                    item.status === 'warning' ? 'bg-amber-400' : 'bg-blue-400'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-xs font-semibold text-[#0F1923] dark:text-[#F8FAFE]">{item.label}</p>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide ${
                        item.status === 'active'  ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' :
                        item.status === 'warning' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' :
                                                    'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                      }`}>
                        {item.status === 'active' ? 'Active' : item.status === 'warning' ? 'Review' : 'Note'}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500 dark:text-[#7D93AE] leading-relaxed">{item.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        {/* ── AI Rate Limiter ────────────────────────────────────────────────── */}
        <Card>
          <CardHeader title="AI Rate Limiter" />
          <CardBody>
            {/* Current usage bar */}
            {stats && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-xs font-medium text-[#0F1923] dark:text-[#F8FAFE]">Current window usage</p>
                  <span className={`text-[11px] font-bold tabular-nums ${
                    usedPct >= 90 ? 'text-red-500' : usedPct >= 70 ? 'text-amber-500' : 'text-emerald-500'
                  }`}>
                    {stats.used} / {stats.maxCalls} calls
                  </span>
                </div>
                <div className="h-2 bg-gray-100 dark:bg-[#243348] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      usedPct >= 90 ? 'bg-red-500' : usedPct >= 70 ? 'bg-amber-400' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(100, usedPct)}%` }}
                  />
                </div>
                <p className="text-[10px] text-gray-400 dark:text-[#4A6380] mt-1">
                  Resets every {stats.windowLabel} · {stats.remaining} remaining
                </p>
              </div>
            )}

            {/* Config fields */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-xs font-medium text-[#0F1923] dark:text-[#F8FAFE] mb-1">Max requests</label>
                <input
                  type="number"
                  min={1}
                  max={200}
                  value={maxInput}
                  onChange={e => setMaxInput(e.target.value)}
                  className="w-full h-8 px-2.5 rounded border border-gray-200 dark:border-[#243348] text-xs bg-white dark:bg-[#0F1923] text-[#0F1923] dark:text-[#F8FAFE] focus:outline-none focus:ring-1 focus:ring-[#2E8BF0]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#0F1923] dark:text-[#F8FAFE] mb-1">Window (seconds)</label>
                <input
                  type="number"
                  min={10}
                  max={3600}
                  value={winInput}
                  onChange={e => setWinInput(e.target.value)}
                  className="w-full h-8 px-2.5 rounded border border-gray-200 dark:border-[#243348] text-xs bg-white dark:bg-[#0F1923] text-[#0F1923] dark:text-[#F8FAFE] focus:outline-none focus:ring-1 focus:ring-[#2E8BF0]"
                />
              </div>
            </div>
            <Button variant="primary" onClick={handleSaveLimiter} className="h-8 text-xs">
              {saved ? '✓ Saved' : 'Save Limits'}
            </Button>
            <p className="text-[10px] text-gray-400 dark:text-[#4A6380] mt-2">
              Default: 20 requests per 60s. Resets on page reload. Applies to WrapMind chat only.
            </p>
          </CardBody>
        </Card>

        {/* ── Local Data Management ─────────────────────────────────────────── */}
        <Card>
          <CardHeader title="Local Data" />
          <CardBody>
            <p className="text-xs text-gray-500 dark:text-[#7D93AE] mb-3">
              All settings, preferences, and cached data are stored in your browser's localStorage under <code className="text-[10px] font-mono bg-gray-100 dark:bg-[#243348] px-1 py-0.5 rounded">wm-*</code> keys. Clearing this data resets the app to factory defaults.
            </p>

            {confirmClear ? (
              <div className="rounded-lg border border-red-200 dark:border-red-800/50 bg-red-50 dark:bg-red-900/10 p-3 mb-3">
                <p className="text-xs font-semibold text-red-700 dark:text-red-400 mb-2">
                  This will clear ALL local data including theme preferences, estimates, and settings. Continue?
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleClearData}
                    className="h-7 px-3 rounded bg-red-500 text-white text-xs font-semibold hover:bg-red-600 transition-colors"
                  >
                    Yes, clear everything
                  </button>
                  <button
                    onClick={() => setConfirmClear(false)}
                    className="h-7 px-3 rounded border border-gray-200 dark:border-[#243348] text-xs font-medium text-[#64748B] dark:text-[#7D93AE] hover:bg-gray-100 dark:hover:bg-[#243348] transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : clearDone ? (
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mb-3">
                ✓ Data cleared — reloading…
              </p>
            ) : null}

            {!confirmClear && !clearDone && (
              <button
                onClick={() => setConfirmClear(true)}
                className="h-8 px-4 rounded border border-red-200 dark:border-red-800/50 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
              >
                Clear all local app data
              </button>
            )}
          </CardBody>
        </Card>

      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// ─────────────────────────────────────────────
// Locations upgrade upsell
// ─────────────────────────────────────────────
function LocationsUpgradePage() {
  const { setPlanTier } = useFeatureFlags();
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-6 pt-5 pb-4 border-b border-[#243348] flex-shrink-0">
        <h2 className="text-sm font-bold text-[#F8FAFE] tracking-tight">Locations</h2>
        <p className="text-[11px] text-[#4A6080] mt-0.5">Manage your shop locations.</p>
      </div>
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="max-w-sm w-full text-center">
          {/* Icon */}
          <div className="w-14 h-14 rounded-2xl bg-[#1B2A3E] border border-[#243348] flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-[#4A6080]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5V6.75a4.5 4.5 0 119 0v3.75M3.75 21.75h16.5a1.5 1.5 0 001.5-1.5v-6.75a1.5 1.5 0 00-1.5-1.5H3.75a1.5 1.5 0 00-1.5 1.5v6.75a1.5 1.5 0 001.5 1.5z" />
            </svg>
          </div>
          {/* Tier badge */}
          <span className="inline-flex items-center gap-1 bg-amber-500/15 text-amber-400 text-[10px] font-bold uppercase tracking-wider rounded-full px-2.5 py-1 mb-3">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            Enterprise Feature
          </span>
          <h3 className="text-[#F8FAFE] text-base font-bold mb-2">Multi-Location Management</h3>
          <p className="text-[#4A6080] text-[12px] leading-relaxed mb-6">
            Run multiple shops from one account. Switch locations in the top bar, keep estimates, customers, and data scoped per location, and get a rolled-up aggregate view across all your shops.
          </p>
          {/* Feature list */}
          <ul className="text-left space-y-2 mb-6">
            {[
              'Location switcher in the top bar',
              'Per-location estimates & customers',
              'All-locations aggregate dashboard',
              'Unlimited shop locations',
            ].map(f => (
              <li key={f} className="flex items-center gap-2 text-[11px] text-[#7D93AE]">
                <svg className="w-3.5 h-3.5 flex-shrink-0 text-[#10B981]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                {f}
              </li>
            ))}
          </ul>
          {/* CTA */}
          <button
            onClick={() => setPlanTier('enterprise')}
            className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-[#0F1923] text-[12px] font-bold rounded-lg h-10 transition-colors"
          >
            Upgrade to Enterprise
          </button>
          <p className="text-[10px] text-[#4A6080] mt-2">
            Already on Enterprise?{' '}
            <a href="mailto:support@wrapmind.io" className="text-[#2E8BF0] hover:underline">Contact support</a>
          </p>
        </div>
      </div>
    </div>
  );
}

// renderPage
// ─────────────────────────────────────────────
function renderPage(active, can, multiLocationEnabled) {
  // Helper: wrap in restricted page if no permission
  const guard = (perm, el, label) => (can(perm) ? el : <RestrictedPage label={label} />);

  switch (active) {
    case 'user-profile':     return <UserProfilePage />;
    case 'profile':          return <ProfilePage />;
    case 'billing':          return guard('settings.billing', <BillingPage />, 'Billing');
    case 'users':            return guard('settings.users.view', <UsersPage />, 'Users');
    case 'about':            return <AboutPage />;
    case 'appearance':       return <AppearancePage />;
    case 'security':         return <SecurityPage />;
    case 'general-settings': return guard('settings.general', <GeneralSettingsPage />, 'General Settings');
    case 'experimental':     return guard('settings.experimental', <ExperimentalPage />, 'Experimental Features');
    case 'staff-access':     return guard('settings.experimental', <StaffAccessPage />, 'Staff Portal');
    case 'labor-rates':      return guard('settings.general', <LaborRatesPage />, 'Labor Rates');
    case 'pricing-matrices': return guard('settings.general', <PricingMatricesPage />, 'Pricing Matrices');
    case 'labor-matrices':   return guard('settings.general', <LaborMatricesPage />, 'Labor Matrices');
    case 'payment-terms':    return guard('settings.general', <PaymentTermsPage />, 'Payment Terms');
    case 'payment-types':    return guard('settings.general', <PaymentTypesPage />, 'Payment Types');
    case 'payments':         return guard('settings.general', <PaymentsPage />, 'Payments');
    case 'carfax':           return guard('settings.integrations', <CarfaxPage />, 'Carfax');
    case 'locations':        return multiLocationEnabled ? <LocationsPage /> : <LocationsUpgradePage />;
    case 'documents':        return <DocumentArchivePage />;
    case 'integrations':     return <IntegrationsPage />;
    case 'api-keys':         return guard('settings.integrations', <APIKeysPage />, 'API Keys');
    case 'webhooks':         return guard('settings.integrations', <WebhooksPage />, 'Webhooks');

    default: {
      const item = ALL_ITEMS.find((i) => i.id === active);
      const label = item?.label ?? active;
      if (item?.required && !can(item.required)) return <RestrictedPage label={label} />;
      return (
        <div className="flex flex-col h-full">
          <PageHeader title={label} />
          <ComingSoon label={label} />
        </div>
      );
    }
  }
}

// ─────────────────────────────────────────────
// ROOT EXPORT
// ─────────────────────────────────────────────

export default function Settings({ initialTab = 'profile' }) {
  const [active, setActive] = useState(initialTab);
  const { can, currentRole } = useRoles();
  const { t } = useLanguage();
  const { multiLocationEnabled } = useFeatureFlags();

  // Sync tab when parent navigates to a specific tab while Settings is already mounted
  useEffect(() => { setActive(initialTab); }, [initialTab]);
  const role = ROLES[currentRole];
  return (
    <div className="flex-1 flex min-w-0 bg-gray-50 dark:bg-gray-900 h-full overflow-hidden">
      {/* Left sub-nav */}
      <div className="w-44 flex-shrink-0 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-y-auto">
        {/* Current role badge */}
        <div className="px-3 pt-3 pb-2 border-b border-gray-100 dark:border-gray-700 mb-1">
          <p className="text-[9px] font-semibold uppercase tracking-wider text-[#64748B] dark:text-[#7D93AE] mb-1">{t('common.signedInAs')}</p>
          <div className="flex items-center gap-1.5">
            <div
              className="w-4 h-4 rounded-full flex items-center justify-center"
              style={{ backgroundColor: role?.bg }}
            >
              <WMIcon name={role?.icon} className="w-2.5 h-2.5 text-white" />
            </div>
            <span
              className="text-[10px] font-semibold"
              style={{ color: role?.color }}
            >
              {role?.label}
            </span>
          </div>
        </div>

        {NAV_GROUPS.map((group) => {
          // Only show groups that have at least one item visible to this user
          const visibleItems = group.items.filter(item => !item.required || can(item.required));
          if (visibleItems.length === 0) return null;
          return (
          <div key={group.label}>
            <SectionHeader>{group.tk ? t(group.tk) : group.label}</SectionHeader>
            {visibleItems.map((item) => {
              const isExperimental  = item.id === 'experimental';
              const isStaffPortal   = item.id === 'staff-access';
              const isLockedByTier  = item.id === 'locations' && !multiLocationEnabled;
              return (
                <button
                  key={item.id}
                  onClick={() => setActive(item.id)}
                  className={`w-full text-left px-3 py-1.5 text-[11px] rounded-sm transition-colors flex items-center justify-between gap-1 ${
                    active === item.id
                      ? isStaffPortal
                        ? 'text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/30 font-bold'
                        : isExperimental
                          ? 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 font-medium'
                          : 'text-[#2E8BF0] bg-blue-50 dark:bg-blue-900/30 font-medium'
                      : isStaffPortal
                        ? 'text-red-600 dark:text-red-500 font-bold hover:bg-red-50 dark:hover:bg-red-900/20'
                        : isExperimental
                          ? 'text-amber-600 dark:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  }`}
                >
                  <span className="flex items-center gap-1.5 truncate min-w-0">
                    {isLockedByTier && (
                      <svg className="w-3 h-3 flex-shrink-0 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                      </svg>
                    )}
                    {isStaffPortal && (
                      <svg className="w-3.5 h-3.5 flex-shrink-0 text-red-500 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.955 11.955 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                      </svg>
                    )}
                    {isExperimental && (
                      <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 0 1-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 0 1 4.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15M14.25 3.104c.251.023.501.05.75.082M19.8 15a2.25 2.25 0 0 1 .45 1.314M19.8 15h-2.57m0 0c-.375.87-.875 1.712-1.5 2.5M17.23 15H6.77m10.46 0a23.4 23.4 0 0 1-1.47 2.5M6.77 15a2.25 2.25 0 0 0-.45 1.314M6.77 15H4.2m2.57 0c.375.87.875 1.712 1.5 2.5M6.32 16.314A2.25 2.25 0 0 0 6.77 18h10.46a2.25 2.25 0 0 0 .45-1.686" />
                      </svg>
                    )}
                    <span className="truncate">{item.tk ? t(item.tk) : item.label}</span>
                  </span>
                  {isLockedByTier && (
                    <span className="text-[8px] font-bold text-amber-500 bg-amber-500/10 rounded px-1 py-0.5 flex-shrink-0">ENT</span>
                  )}
                </button>
              );
            })}
          </div>
          );
        })}
      </div>

      {/* Right content */}
      <div className="flex-1 flex flex-col overflow-auto min-w-0">
        {renderPage(active, can, multiLocationEnabled)}
      </div>
    </div>
  );
}
