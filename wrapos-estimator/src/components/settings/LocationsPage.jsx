// src/components/settings/LocationsPage.jsx
import { useState } from 'react';
import { useLocations } from '../../context/LocationContext';

const COLOR_SWATCHES = [
  '#2E8BF0', '#10B981', '#F59E0B', '#EF4444',
  '#8B5CF6', '#EC4899', '#06B6D4', '#F97316',
];

const BLANK_FORM = { name: '', nickname: '', address: '', city: '', state: '', zip: '', phone: '', color: '#2E8BF0' };

function LocationForm({ initial = BLANK_FORM, onSave, onCancel, otherLocations = [] }) {
  const [form, setForm] = useState({ nickname: '', ...initial });
  const [nicknameError, setNicknameError] = useState('');
  const set = (key, val) => {
    setForm(f => ({ ...f, [key]: val }));
    if (key === 'nickname') setNicknameError('');
  };

  const handleSave = () => {
    const nick = form.nickname?.trim();
    if (nick) {
      const duplicate = otherLocations.some(
        l => (l.nickname?.trim() || '').toLowerCase() === nick.toLowerCase()
      );
      if (duplicate) {
        setNicknameError('This nickname is already in use. Please choose a unique value.');
        return;
      }
    }
    onSave({ ...form, nickname: nick });
  };

  return (
    <div className="bg-[#0F1923] border border-[#243348] rounded-lg p-4 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[10px] font-semibold uppercase tracking-wider text-[#4A6080] mb-1">Location Name *</label>
          <input
            value={form.name}
            onChange={e => set('name', e.target.value)}
            placeholder="e.g. Main Street Shop"
            className="w-full bg-[#1B2A3E] border border-[#243348] rounded px-2.5 py-1.5 text-[11px] text-[#F8FAFE] placeholder-[#364860] focus:outline-none focus:border-[#2E8BF0]"
          />
        </div>
        <div>
          <label className="block text-[10px] font-semibold uppercase tracking-wider text-[#4A6080] mb-1">
            Nickname <span className="normal-case font-normal text-[#364860]">(optional)</span>
          </label>
          <input
            value={form.nickname || ''}
            onChange={e => set('nickname', e.target.value)}
            placeholder="e.g. Main, DT Studio"
            maxLength={30}
            className={`w-full bg-[#1B2A3E] border rounded px-2.5 py-1.5 text-[11px] text-[#F8FAFE] placeholder-[#364860] focus:outline-none focus:border-[#2E8BF0] ${nicknameError ? 'border-[#EF4444]' : 'border-[#243348]'}`}
          />
          {nicknameError && (
            <p className="mt-1 text-[10px] text-[#EF4444] leading-tight">{nicknameError}</p>
          )}
        </div>
        <div>
          <label className="block text-[10px] font-semibold uppercase tracking-wider text-[#4A6080] mb-1">Address</label>
          <input
            value={form.address}
            onChange={e => set('address', e.target.value)}
            placeholder="123 Main St"
            className="w-full bg-[#1B2A3E] border border-[#243348] rounded px-2.5 py-1.5 text-[11px] text-[#F8FAFE] placeholder-[#364860] focus:outline-none focus:border-[#2E8BF0]"
          />
        </div>
        <div>
          <label className="block text-[10px] font-semibold uppercase tracking-wider text-[#4A6080] mb-1">City</label>
          <input
            value={form.city}
            onChange={e => set('city', e.target.value)}
            placeholder="Los Angeles"
            className="w-full bg-[#1B2A3E] border border-[#243348] rounded px-2.5 py-1.5 text-[11px] text-[#F8FAFE] placeholder-[#364860] focus:outline-none focus:border-[#2E8BF0]"
          />
        </div>
        <div>
          <label className="block text-[10px] font-semibold uppercase tracking-wider text-[#4A6080] mb-1">State</label>
          <input
            value={form.state}
            onChange={e => set('state', e.target.value)}
            placeholder="CA"
            maxLength={2}
            className="w-full bg-[#1B2A3E] border border-[#243348] rounded px-2.5 py-1.5 text-[11px] text-[#F8FAFE] placeholder-[#364860] focus:outline-none focus:border-[#2E8BF0]"
          />
        </div>
        <div>
          <label className="block text-[10px] font-semibold uppercase tracking-wider text-[#4A6080] mb-1">ZIP</label>
          <input
            value={form.zip}
            onChange={e => set('zip', e.target.value)}
            placeholder="90001"
            className="w-full bg-[#1B2A3E] border border-[#243348] rounded px-2.5 py-1.5 text-[11px] text-[#F8FAFE] placeholder-[#364860] focus:outline-none focus:border-[#2E8BF0]"
          />
        </div>
        <div>
          <label className="block text-[10px] font-semibold uppercase tracking-wider text-[#4A6080] mb-1">Phone</label>
          <input
            value={form.phone}
            onChange={e => set('phone', e.target.value)}
            placeholder="(310) 555-0100"
            className="w-full bg-[#1B2A3E] border border-[#243348] rounded px-2.5 py-1.5 text-[11px] text-[#F8FAFE] placeholder-[#364860] focus:outline-none focus:border-[#2E8BF0]"
          />
        </div>
      </div>

      {/* Color picker */}
      <div>
        <label className="block text-[10px] font-semibold uppercase tracking-wider text-[#4A6080] mb-1.5">Color</label>
        <div className="flex gap-2 flex-wrap">
          {COLOR_SWATCHES.map(c => (
            <button
              key={c}
              type="button"
              onClick={() => set('color', c)}
              className={`w-6 h-6 rounded-full transition-transform ${form.color === c ? 'ring-2 ring-white ring-offset-1 ring-offset-[#0F1923] scale-110' : 'hover:scale-110'}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={handleSave}
          disabled={!form.name.trim()}
          className="flex items-center justify-center bg-[#2E8BF0] hover:bg-[#2577D0] disabled:opacity-40 text-white text-[11px] font-semibold rounded px-4 h-7 transition-colors"
        >
          Save
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex items-center justify-center bg-[#243348] hover:bg-[#364860] text-[#F8FAFE] text-[11px] font-medium rounded px-4 h-7 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export default function LocationsPage() {
  const { locations, addLocation, updateLocation, deleteLocation, activeLocationId, setActiveLocation } = useLocations();
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const handleAdd = (form) => {
    addLocation(form);
    setShowAdd(false);
  };

  const handleEdit = (id, form) => {
    updateLocation(id, form);
    setEditingId(null);
  };

  const handleDelete = (id) => {
    if (locations.length <= 1) return; // don't delete the last location
    deleteLocation(id);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-6 pt-5 pb-4 border-b border-[#243348] flex-shrink-0 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-[#F8FAFE] tracking-tight">Locations</h2>
          <p className="text-[11px] text-[#4A6080] mt-0.5">Manage your shop locations.</p>
        </div>
        <button
          onClick={() => { setShowAdd(v => !v); setEditingId(null); }}
          className="flex items-center gap-1.5 bg-[#2E8BF0] hover:bg-[#2577D0] text-white text-[11px] font-semibold rounded px-3 h-8 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add Location
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-3">
        {/* Add form */}
        {showAdd && (
          <LocationForm
            onSave={handleAdd}
            onCancel={() => setShowAdd(false)}
            otherLocations={locations}
          />
        )}

        {/* Location cards */}
        {locations.map(loc => (
          <div key={loc.id}>
            {editingId === loc.id ? (
              <LocationForm
                initial={loc}
                onSave={(form) => handleEdit(loc.id, form)}
                onCancel={() => setEditingId(null)}
                otherLocations={locations.filter(l => l.id !== loc.id)}
              />
            ) : (
              <div className={[
                'flex items-center gap-3 bg-[#1B2A3E] border rounded-lg px-4 py-3 transition-colors',
                activeLocationId === loc.id ? 'border-[#2E8BF0]' : 'border-[#243348]',
              ].join(' ')}>
                {/* Color dot */}
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: loc.color }} />
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {loc.nickname?.trim() ? (
                      <div className="flex items-center gap-1.5 min-w-0">
                        <p className="text-[#F8FAFE] text-[12px] font-semibold truncate">{loc.nickname.trim()}</p>
                        <span className="text-[9px] text-[#4A6080] truncate flex-shrink-0">({loc.name})</span>
                      </div>
                    ) : (
                      <p className="text-[#F8FAFE] text-[12px] font-semibold truncate">{loc.name}</p>
                    )}
                    {activeLocationId === loc.id && (
                      <span className="text-[9px] font-semibold text-[#2E8BF0] bg-[#2E8BF0]/10 rounded-full px-2 py-0.5 flex-shrink-0">ACTIVE</span>
                    )}
                  </div>
                  <p className="text-[#4A6080] text-[10px] mt-0.5">
                    {[loc.address, loc.city, loc.state, loc.zip].filter(Boolean).join(', ')}
                    {loc.phone ? ` · ${loc.phone}` : ''}
                  </p>
                </div>
                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  {activeLocationId !== loc.id && (
                    <button
                      onClick={() => setActiveLocation(loc.id)}
                      className="text-[10px] text-[#4A6080] hover:text-[#2E8BF0] font-medium px-2 h-6 rounded transition-colors"
                    >
                      Switch
                    </button>
                  )}
                  <button
                    onClick={() => { setEditingId(loc.id); setShowAdd(false); }}
                    className="text-[10px] text-[#4A6080] hover:text-[#F8FAFE] font-medium px-2 h-6 rounded transition-colors"
                  >
                    Edit
                  </button>
                  {locations.length > 1 && (
                    <button
                      onClick={() => handleDelete(loc.id)}
                      className="text-[10px] text-[#4A6080] hover:text-[#EF4444] font-medium px-2 h-6 rounded transition-colors"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
