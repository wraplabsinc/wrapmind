import { useState, useRef } from 'react';
import { generateEstimateFromText, analyzeVehicleImage } from '../../lib/ai.js';

// ─── Tiny spinner ─────────────────────────────────────────────────────────────
function Spinner() {
  return (
    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

// ─── AIEstimateGenerator ──────────────────────────────────────────────────────
// Props:
//   onUse(draftEstimate) — called when user clicks "Use this estimate"
//   onClose()
//   shopContext — string from buildWrapMindContext()
//   laborRates — object
export default function AIEstimateGenerator({ onUse, onClose, shopContext = '', laborRates = {} }) {
  const [mode, setMode]         = useState('text'); // 'text' | 'photo'
  const [description, setDescription] = useState('');
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoBase64, setPhotoBase64]   = useState(null);
  const [loading, setLoading]   = useState(false);
  const [phase, setPhase]       = useState(''); // 'identifying' | 'estimating'
  const [draft, setDraft]       = useState(null);
  const [error, setError]       = useState(null);
  const [activeAlt, setActiveAlt] = useState(null); // index of selected alternative
  const fileRef = useRef(null);

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const b64 = ev.target?.result;
      setPhotoBase64(b64);
      setPhotoPreview(b64);
      setDraft(null);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleGenerate = async () => {
    setLoading(true);
    setDraft(null);
    setError(null);
    setActiveAlt(null);

    try {
      let finalDescription = description.trim();

      if (mode === 'photo' && photoBase64) {
        setPhase('identifying');
        const vehicle = await analyzeVehicleImage(photoBase64);
        if (vehicle?.year && vehicle?.make && vehicle?.model) {
          finalDescription = `${vehicle.year} ${vehicle.make} ${vehicle.model}${vehicle.trim ? ' ' + vehicle.trim : ''} — ${finalDescription || 'full wrap'}`;
        } else {
          finalDescription = finalDescription || 'vehicle — full wrap';
        }
      }

      setPhase('estimating');
      const result = await generateEstimateFromText({ description: finalDescription, shopContext, laborRates });
      setDraft(result);
    } catch (e) {
      setError(e.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
      setPhase('');
    }
  };

  const activeDraft = activeAlt !== null && draft?.suggestedAlternatives?.[activeAlt]
    ? { ...draft, material: draft.suggestedAlternatives[activeAlt].material, materialColor: draft.suggestedAlternatives[activeAlt].materialColor, total: draft.suggestedAlternatives[activeAlt].total }
    : draft;

  const handleUse = () => {
    if (!activeDraft) return;
    onUse({
      vehicleLabel:  activeDraft.vehicleLabel  || '',
      package:       activeDraft.package       || 'Full Wrap',
      material:      activeDraft.material      || '',
      materialColor: activeDraft.materialColor || '',
      laborHours:    activeDraft.laborHours    || 0,
      basePrice:     activeDraft.basePrice     || 0,
      laborCost:     activeDraft.laborCost     || 0,
      materialCost:  activeDraft.materialCost  || 0,
      total:         activeDraft.total         || 0,
      notes:         activeDraft.notes         || '',
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-white dark:bg-[#1B2A3E] rounded-2xl shadow-2xl border border-gray-200 dark:border-[#243348] overflow-hidden flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 dark:border-[#243348] flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2.25l1.09 4.47 4.47 1.09-4.47 1.09L12 13.41l-1.09-4.47-4.47-1.09 4.47-1.09L12 2.25z"/>
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-[#0F1923] dark:text-[#F8FAFE]">AI Estimate Generator</p>
            <p className="text-[11px] text-gray-400">Describe the job or upload a photo</p>
          </div>
          <button onClick={onClose} className="ml-auto text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto p-5 space-y-4">

          {/* Mode tabs */}
          <div className="flex gap-1 p-1 bg-gray-100 dark:bg-[#0F1923] rounded-lg">
            {[
              { id: 'text',  label: 'Describe' },
              { id: 'photo', label: 'Photo' },
            ].map(t => (
              <button
                key={t.id}
                onClick={() => { setMode(t.id); setDraft(null); setError(null); }}
                className={`flex-1 h-8 rounded text-xs font-medium transition-all ${
                  mode === t.id
                    ? 'bg-white dark:bg-[#1B2A3E] text-[#0F1923] dark:text-[#F8FAFE] shadow-sm'
                    : 'text-gray-500 dark:text-[#7D93AE] hover:text-[#0F1923] dark:hover:text-[#F8FAFE]'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Input area */}
          {mode === 'text' ? (
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1.5">
                Job Description
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Full wrap Tesla Model 3 in 3M 1080 Matte Black, customer wants gloss roof"
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-[#243348] rounded-lg bg-transparent text-[#0F1923] dark:text-[#F8FAFE] placeholder-gray-400 dark:placeholder-[#4A6080] focus:outline-none focus:border-blue-400 resize-none"
              />
              <p className="text-[10px] text-gray-400 mt-1">Include vehicle year/make/model, service type, and any material preferences.</p>
            </div>
          ) : (
            <div>
              {photoPreview ? (
                <div className="relative rounded-xl overflow-hidden border border-gray-200 dark:border-[#243348]">
                  <img src={photoPreview} alt="Vehicle" className="w-full h-40 object-cover" />
                  <button
                    onClick={() => { setPhotoPreview(null); setPhotoBase64(null); setDraft(null); }}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileRef.current?.click()}
                  className="w-full h-32 rounded-xl border-2 border-dashed border-gray-200 dark:border-[#243348] flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-blue-400 hover:text-blue-500 transition-colors"
                >
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                  </svg>
                  <span className="text-xs font-medium">Upload vehicle photo</span>
                </button>
              )}
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
              {photoPreview && (
                <textarea
                  rows={2}
                  placeholder="Optional: any specific service or material notes"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="mt-3 w-full px-3 py-2 text-sm border border-gray-200 dark:border-[#243348] rounded-lg bg-transparent text-[#0F1923] dark:text-[#F8FAFE] placeholder-gray-400 focus:outline-none focus:border-blue-400 resize-none"
                />
              )}
            </div>
          )}

          {/* Generate button */}
          <button
            onClick={handleGenerate}
            disabled={loading || (mode === 'text' && !description.trim()) || (mode === 'photo' && !photoBase64)}
            className="w-full h-9 rounded-lg bg-gradient-to-r from-blue-500 to-violet-600 text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
          >
            {loading ? (
              <>
                <Spinner />
                <span>{phase === 'identifying' ? 'Identifying vehicle…' : 'Generating estimate…'}</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.25l1.09 4.47 4.47 1.09-4.47 1.09L12 13.41l-1.09-4.47-4.47-1.09 4.47-1.09L12 2.25z"/>
                </svg>
                Generate Estimate
              </>
            )}
          </button>

          {/* Error */}
          {error && (
            <div className="px-3 py-2.5 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40">
              <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Draft result */}
          {draft && (
            <div className="space-y-3">
              <div className="rounded-xl border border-gray-200 dark:border-[#243348] overflow-hidden">
                <div className="px-4 py-2.5 bg-gray-50 dark:bg-[#0F1923] border-b border-gray-100 dark:border-[#243348] flex items-center justify-between">
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">AI Draft</span>
                  <span className="text-sm font-black text-blue-600 dark:text-blue-400">
                    ${(activeDraft?.total || draft.total || 0).toLocaleString()}
                  </span>
                </div>
                <div className="divide-y divide-gray-100 dark:divide-[#243348]">
                  {[
                    { label: 'Vehicle',    value: draft.vehicleLabel },
                    { label: 'Service',    value: draft.package },
                    { label: 'Material',   value: `${activeDraft?.material || draft.material} — ${activeDraft?.materialColor || draft.materialColor}` },
                    { label: 'Labor',      value: `${draft.laborHours}h · $${(draft.laborCost || 0).toLocaleString()}` },
                    { label: 'Material $', value: `$${(draft.materialCost || 0).toLocaleString()} (${draft.sqFt || '?'} sq ft)` },
                  ].map(row => (
                    <div key={row.label} className="px-4 py-2 flex items-center justify-between">
                      <span className="text-[11px] text-gray-400 w-20 flex-shrink-0">{row.label}</span>
                      <span className="text-[12px] text-[#0F1923] dark:text-[#F8FAFE] text-right">{row.value}</span>
                    </div>
                  ))}
                  {draft.notes && (
                    <div className="px-4 py-2">
                      <span className="text-[11px] text-gray-400 block mb-0.5">Notes</span>
                      <span className="text-[11px] text-gray-500 dark:text-[#7D93AE] italic">{draft.notes}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Alternatives */}
              {draft.suggestedAlternatives?.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1.5">Alternatives</p>
                  <div className="space-y-1.5">
                    {draft.suggestedAlternatives.map((alt, i) => (
                      <button
                        key={i}
                        onClick={() => setActiveAlt(activeAlt === i ? null : i)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg border text-left transition-colors ${
                          activeAlt === i
                            ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-200 dark:border-[#243348] hover:bg-gray-50 dark:hover:bg-[#0F1923]'
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-medium text-[#0F1923] dark:text-[#F8FAFE] truncate">{alt.material} — {alt.materialColor}</p>
                          <p className="text-[10px] text-gray-400">{alt.note}</p>
                        </div>
                        <span className="text-[12px] font-bold text-blue-600 dark:text-blue-400 flex-shrink-0">${alt.total?.toLocaleString()}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {draft && (
          <div className="flex gap-2 px-5 py-3 border-t border-gray-100 dark:border-[#243348] flex-shrink-0">
            <button onClick={onClose} className="h-9 px-4 rounded-lg border border-gray-200 dark:border-[#243348] text-xs font-medium text-gray-600 dark:text-[#7D93AE] hover:bg-gray-50 dark:hover:bg-[#243348] transition-colors">
              Discard
            </button>
            <button onClick={handleUse} className="flex-1 h-9 rounded-lg bg-gradient-to-r from-blue-500 to-violet-600 text-white text-xs font-semibold hover:opacity-90 transition-opacity">
              Use this estimate →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
