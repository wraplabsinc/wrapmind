import { useState } from 'react';
import Button from './ui/Button';

const PHONE_TYPES = ['Mobile', 'Home', 'Work', 'Other'];
const LANGUAGES = ['English (United States)', 'Spanish', 'French', 'Portuguese', 'German', 'Chinese', 'Japanese'];
const REFERRAL_SOURCES = ['', 'Google', 'Instagram', 'Facebook', 'Yelp', 'Referral', 'Repeat Customer', 'Walk-in', 'Other'];
const PAYMENT_TERMS = ['On Receipt', 'Net 15', 'Net 30', 'Net 45', 'Net 60', '50% Deposit'];

function Field({ label, required, children }) {
  return (
    <div>
      <label className="block text-xs font-medium text-[#0F1923] dark:text-[#F8FAFE] mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls = 'w-full h-8 px-3 rounded border border-gray-200 dark:border-[#243348] bg-white dark:bg-[#243348] text-sm text-[#0F1923] dark:text-[#F8FAFE] placeholder:text-[#64748B] dark:placeholder:text-[#7D93AE] focus:outline-none focus:border-[#2E8BF0] focus:ring-1 focus:ring-[#2E8BF0] transition-colors';
const selectCls = 'w-full h-8 px-3 rounded border border-gray-200 dark:border-[#243348] bg-white dark:bg-[#243348] text-sm text-[#0F1923] dark:text-[#F8FAFE] focus:outline-none focus:border-[#2E8BF0] focus:ring-1 focus:ring-[#2E8BF0] transition-colors';

export default function CustomerForm({ initialData = {}, onContinue, onSkip }) {
  const [firstName, setFirstName]   = useState(initialData.firstName || '');
  const [lastName, setLastName]     = useState(initialData.lastName || '');
  const [phones, setPhones]         = useState(initialData.phones || [{ type: 'Mobile', number: '' }]);
  const [emails, setEmails]         = useState(initialData.emails || [{ address: '' }]);
  const [contactPref, setContactPref] = useState(initialData.contactPref || 'Both');
  const [tags, setTags]             = useState(initialData.tags || []);
  const [tagInput, setTagInput]     = useState('');
  const [language, setLanguage]     = useState(initialData.language || 'English (United States)');
  const [notes, setNotes]           = useState(initialData.notes || '');
  const [referral, setReferral]     = useState(initialData.referral || '');
  const [company, setCompany]       = useState(initialData.company || '');
  const [fleet, setFleet]           = useState(initialData.fleet || '');
  const [paymentTerms, setPaymentTerms] = useState(initialData.paymentTerms || 'On Receipt');
  const [useShopDefault, setUseShopDefault] = useState(true);
  const [additionalOpen, setAdditionalOpen] = useState(false);
  const [errors, setErrors] = useState({});

  // ── Phone helpers ──────────────────────────────────────────────────────────
  const addPhone = () => setPhones(p => [...p, { type: 'Mobile', number: '' }]);
  const removePhone = (i) => setPhones(p => p.filter((_, idx) => idx !== i));
  const updatePhone = (i, field, val) => setPhones(p => p.map((ph, idx) => idx === i ? { ...ph, [field]: val } : ph));

  // ── Email helpers ──────────────────────────────────────────────────────────
  const addEmail = () => setEmails(e => [...e, { address: '' }]);
  const removeEmail = (i) => setEmails(e => e.filter((_, idx) => idx !== i));
  const updateEmail = (i, val) => setEmails(e => e.map((em, idx) => idx === i ? { address: val } : em));

  // ── Tag helpers ────────────────────────────────────────────────────────────
  const addTag = (e) => {
    e.preventDefault();
    const t = tagInput.trim();
    if (t && !tags.includes(t)) setTags(prev => [...prev, t]);
    setTagInput('');
  };
  const removeTag = (t) => setTags(prev => prev.filter(x => x !== t));

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = {};
    if (!firstName.trim()) errs.firstName = 'Required';
    if (!lastName.trim()) errs.lastName = 'Required';
    if (Object.keys(errs).length) { setErrors(errs); return; }

    onContinue({
      firstName, lastName, phones, emails, contactPref,
      tags, language, notes, referral, company, fleet,
      paymentTerms: useShopDefault ? 'On Receipt' : paymentTerms,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-0">
      <div className="bg-white dark:bg-[#1B2A3E] border border-gray-200 dark:border-[#243348] rounded overflow-hidden">

        {/* ── Basic info ─────────────────────────────────────────────────────── */}
        <div className="px-5 py-4 space-y-4">

          {/* Name row */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="First Name" required>
              <input
                value={firstName}
                onChange={e => { setFirstName(e.target.value); setErrors(v => ({ ...v, firstName: null })); }}
                placeholder="First"
                className={`${inputCls} ${errors.firstName ? 'border-red-400 focus:border-red-400 focus:ring-red-400' : ''}`}
              />
              {errors.firstName && <p className="text-[11px] text-red-500 mt-0.5">{errors.firstName}</p>}
            </Field>
            <Field label="Last Name" required>
              <input
                value={lastName}
                onChange={e => { setLastName(e.target.value); setErrors(v => ({ ...v, lastName: null })); }}
                placeholder="Last"
                className={`${inputCls} ${errors.lastName ? 'border-red-400 focus:border-red-400 focus:ring-red-400' : ''}`}
              />
              {errors.lastName && <p className="text-[11px] text-red-500 mt-0.5">{errors.lastName}</p>}
            </Field>
          </div>

          {/* Phone */}
          <Field label="Phone">
            <div className="space-y-2">
              {phones.map((ph, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <select
                    value={ph.type}
                    onChange={e => updatePhone(i, 'type', e.target.value)}
                    className="h-8 pl-2 pr-7 rounded border border-gray-200 dark:border-[#243348] bg-white dark:bg-[#243348] text-sm text-gray-700 dark:text-[#F8FAFE] focus:outline-none focus:border-[#2E8BF0] transition-colors"
                  >
                    {PHONE_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                  <input
                    type="tel"
                    value={ph.number}
                    onChange={e => updatePhone(i, 'number', e.target.value)}
                    placeholder="(555) 000-0000"
                    className={`${inputCls} flex-1`}
                  />
                  {phones.length > 1 && (
                    <button type="button" onClick={() => removePhone(i)} className="text-[#64748B] dark:text-[#7D93AE] hover:text-gray-600 flex-shrink-0 transition-colors">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
              <button type="button" onClick={addPhone} className="text-xs text-[#2E8BF0] hover:text-[#2E8BF0] font-medium transition-colors">
                + Add Phone
              </button>
            </div>
          </Field>

          {/* Email */}
          <Field label="Email">
            <div className="space-y-2">
              {emails.map((em, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input
                    type="email"
                    value={em.address}
                    onChange={e => updateEmail(i, e.target.value)}
                    placeholder="name@example.com"
                    className={`${inputCls} flex-1`}
                  />
                  {emails.length > 1 && (
                    <button type="button" onClick={() => removeEmail(i)} className="text-[#64748B] dark:text-[#7D93AE] hover:text-gray-600 flex-shrink-0 transition-colors">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
              <button type="button" onClick={addEmail} className="text-xs text-[#2E8BF0] hover:text-[#2E8BF0] font-medium transition-colors">
                + Add Email
              </button>
            </div>
          </Field>

          {/* Preferred Contact Method */}
          <Field label="Preferred Contact Method">
            <div className="flex rounded border border-gray-200 dark:border-[#243348] overflow-hidden w-fit">
              {['SMS', 'Email', 'Both'].map(opt => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setContactPref(opt)}
                  className={`h-8 px-4 text-xs font-medium transition-colors last:border-r-0
                    ${contactPref === opt
                      ? 'wm-btn-primary'
                      : 'bg-white dark:bg-[#243348] text-gray-600 dark:text-[#F8FAFE] hover:bg-gray-50 dark:hover:bg-gray-600 border-r border-gray-200 dark:border-[#243348]'
                    }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </Field>
        </div>

        {/* ── Additional Info accordion ──────────────────────────────────────── */}
        <div className="border-t border-gray-200 dark:border-[#243348]">
          <button
            type="button"
            onClick={() => setAdditionalOpen(o => !o)}
            className="w-full flex items-center gap-2 px-5 py-3 text-xs font-medium text-[#64748B] dark:text-[#7D93AE] hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left"
          >
            <svg
              className={`w-3.5 h-3.5 text-[#64748B] dark:text-[#7D93AE] transition-transform ${additionalOpen ? 'rotate-180' : ''}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
            Additional Info
          </button>

          {additionalOpen && (
            <div className="px-5 pb-4 space-y-4 border-t border-gray-200 dark:border-[#243348] pt-4">

              {/* Tags */}
              <Field label="Tags">
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {tags.map(tag => (
                    <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#2E8BF0]/10 dark:bg-blue-900/30 text-[#2E8BF0] dark:text-blue-300 text-xs font-medium">
                      {tag}
                      <button type="button" onClick={() => removeTag(tag)} className="hover:text-blue-900">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    value={tagInput}
                    onChange={e => setTagInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addTag(e)}
                    placeholder="Add a tag..."
                    className={`${inputCls} flex-1`}
                  />
                  <button
                    type="button"
                    onClick={addTag}
                    className="h-8 px-3 rounded border border-gray-200 dark:border-[#243348] bg-white dark:bg-[#243348] text-xs font-medium text-gray-600 dark:text-[#F8FAFE] hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                  >
                    + Add
                  </button>
                </div>
              </Field>

              {/* Language */}
              <Field label="Preferred Language">
                <select value={language} onChange={e => setLanguage(e.target.value)} className={selectCls}>
                  {LANGUAGES.map(l => <option key={l}>{l}</option>)}
                </select>
              </Field>

              {/* Notes */}
              <Field label="Notes">
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Enter a note..."
                  rows={3}
                  className="w-full px-3 py-2 rounded border border-gray-200 dark:border-[#243348] bg-white dark:bg-[#243348] text-sm text-[#0F1923] dark:text-[#F8FAFE] placeholder:text-[#64748B] dark:placeholder:text-[#7D93AE] focus:outline-none focus:border-[#2E8BF0] focus:ring-1 focus:ring-[#2E8BF0] resize-none transition-colors"
                />
              </Field>

              {/* Referral Source */}
              <Field label="Referral Source">
                <select value={referral} onChange={e => setReferral(e.target.value)} className={selectCls}>
                  {REFERRAL_SOURCES.map(s => <option key={s} value={s}>{s || '— Select source —'}</option>)}
                </select>
              </Field>

              {/* Company */}
              <Field label="Company">
                <input
                  value={company}
                  onChange={e => setCompany(e.target.value)}
                  placeholder="Company name"
                  className={inputCls}
                />
              </Field>

              {/* Fleet */}
              <Field label="Fleet">
                <select value={fleet} onChange={e => setFleet(e.target.value)} className={selectCls}>
                  <option value="">Add Fleet...</option>
                  <option>Fleet A</option>
                  <option>Fleet B</option>
                </select>
              </Field>

              {/* Payment Terms */}
              <Field label="Payment Terms">
                <select
                  value={paymentTerms}
                  onChange={e => setPaymentTerms(e.target.value)}
                  disabled={useShopDefault}
                  className={`${selectCls} ${useShopDefault ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {PAYMENT_TERMS.map(t => <option key={t}>{t}</option>)}
                </select>
                <label className="flex items-center gap-2 mt-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useShopDefault}
                    onChange={e => setUseShopDefault(e.target.checked)}
                    className="w-3.5 h-3.5 rounded border-gray-300 text-[#2E8BF0] focus:ring-[#2E8BF0]"
                  />
                  <span className="text-xs text-[#64748B] dark:text-[#7D93AE]">Use shop default</span>
                </label>
              </Field>

            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-4">
        <Button type="submit" variant="primary">
          Continue to Package
        </Button>
        <button
          type="button"
          onClick={onSkip}
          className="h-8 px-4 rounded border border-gray-200 dark:border-[#243348] bg-white dark:bg-[#243348] text-xs font-medium text-gray-600 dark:text-[#F8FAFE] hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
        >
          Skip for now
        </button>
      </div>
    </form>
  );
}
