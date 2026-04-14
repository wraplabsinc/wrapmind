import { useState, useRef } from 'react';
import { useMarketing } from '../../../context/MarketingContext';
import Toggle from '../../ui/Toggle';

const SHOP_ID = 'wrapmind-shop';

function Toast({ message }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 bg-[#0F1923] dark:bg-[#F8FAFE] text-white dark:text-[#0F1923] text-xs font-medium px-4 py-2.5 rounded-lg shadow-xl">
      {message}
    </div>
  );
}

function UploadModal({ onClose, onAdd }) {
  const [form, setForm] = useState({ title: '', tags: '', jobDate: '', featured: false, thumbnail: null });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const fileRef = useRef(null);

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => set('thumbnail', ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    onAdd({
      title: form.title,
      url: null,
      thumbnail: form.thumbnail,
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      jobDate: form.jobDate,
      featured: form.featured,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-[var(--wm-bg-secondary)] border border-[var(--wm-bg-border)] rounded-xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--wm-bg-border)]">
          <h3 className="text-sm font-semibold text-[#0F1923] dark:text-[#F8FAFE]">Upload Photo</h3>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-3">
          {/* File input */}
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 block mb-1">Photo</label>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
            <button type="button" onClick={() => fileRef.current?.click()} className="w-full h-24 border-2 border-dashed border-[var(--wm-bg-border)] rounded-lg flex flex-col items-center justify-center gap-1 hover:border-blue-400 transition-colors">
              {form.thumbnail ? (
                <img src={form.thumbnail} alt="preview" className="h-full w-full object-cover rounded-lg" />
              ) : (
                <>
                  <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>
                  <span className="text-[10px] text-gray-400">Click to upload</span>
                </>
              )}
            </button>
          </div>
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 block mb-1">Title *</label>
            <input required className="w-full h-8 px-3 text-xs border border-[var(--wm-bg-border)] rounded-lg bg-[var(--wm-bg-primary)] text-[#0F1923] dark:text-[#F8FAFE] focus:outline-none focus:ring-1 focus:ring-blue-500" value={form.title} onChange={e => set('title', e.target.value)} placeholder="2023 Tesla Model 3 — Matte Charcoal" />
          </div>
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 block mb-1">Tags (comma-separated)</label>
            <input className="w-full h-8 px-3 text-xs border border-[var(--wm-bg-border)] rounded-lg bg-[var(--wm-bg-primary)] text-[#0F1923] dark:text-[#F8FAFE] focus:outline-none focus:ring-1 focus:ring-blue-500" value={form.tags} onChange={e => set('tags', e.target.value)} placeholder="Full Wrap, Tesla, Matte" />
          </div>
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 block mb-1">Job Date</label>
            <input type="date" className="w-full h-8 px-3 text-xs border border-[var(--wm-bg-border)] rounded-lg bg-[var(--wm-bg-primary)] text-[#0F1923] dark:text-[#F8FAFE] focus:outline-none focus:ring-1 focus:ring-blue-500" value={form.jobDate} onChange={e => set('jobDate', e.target.value)} />
          </div>
          <div className="flex items-center justify-between">
            <label className="text-xs text-[#0F1923] dark:text-[#F8FAFE]">Featured</label>
            <Toggle on={form.featured} onChange={val => set('featured', val)} size="sm" />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className="px-3 py-1.5 text-xs font-medium bg-[var(--wm-bg-secondary)] border border-[var(--wm-bg-border)] text-[#0F1923] dark:text-[#F8FAFE] rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors">Cancel</button>
            <button type="submit" className="px-3 py-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">Upload</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditModal({ photo, onClose, onSave }) {
  const [title, setTitle] = useState(photo.title);
  const [tags, setTags] = useState(photo.tags.join(', '));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-[var(--wm-bg-secondary)] border border-[var(--wm-bg-border)] rounded-xl shadow-2xl w-full max-w-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--wm-bg-border)]">
          <h3 className="text-sm font-semibold text-[#0F1923] dark:text-[#F8FAFE]">Edit Photo</h3>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="px-5 py-4 space-y-3">
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 block mb-1">Title</label>
            <input className="w-full h-8 px-3 text-xs border border-[var(--wm-bg-border)] rounded-lg bg-[var(--wm-bg-primary)] text-[#0F1923] dark:text-[#F8FAFE] focus:outline-none focus:ring-1 focus:ring-blue-500" value={title} onChange={e => setTitle(e.target.value)} />
          </div>
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 block mb-1">Tags (comma-separated)</label>
            <input className="w-full h-8 px-3 text-xs border border-[var(--wm-bg-border)] rounded-lg bg-[var(--wm-bg-primary)] text-[#0F1923] dark:text-[#F8FAFE] focus:outline-none focus:ring-1 focus:ring-blue-500" value={tags} onChange={e => setTags(e.target.value)} />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button onClick={onClose} className="px-3 py-1.5 text-xs font-medium bg-[var(--wm-bg-secondary)] border border-[var(--wm-bg-border)] text-[#0F1923] dark:text-[#F8FAFE] rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors">Cancel</button>
            <button onClick={() => { onSave({ title, tags: tags.split(',').map(t => t.trim()).filter(Boolean) }); onClose(); }} className="px-3 py-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">Save</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function GalleryTab() {
  const { gallery, addPhoto, updatePhoto, removePhoto } = useMarketing();
  const [showUpload, setShowUpload] = useState(false);
  const [editPhoto, setEditPhoto] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const copyPublicLink = () => {
    const url = `https://wrapmind.app/gallery/${SHOP_ID}`;
    navigator.clipboard.writeText(url).catch(() => {});
    showToast('Link copied!');
  };

  const featuredCount = gallery.filter(p => p.featured).length;

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-sm font-semibold text-[#0F1923] dark:text-[#F8FAFE]">Portfolio Gallery</h2>
        <div className="flex items-center gap-2">
          <button onClick={copyPublicLink} className="px-3 py-1.5 text-xs font-medium bg-[var(--wm-bg-secondary)] border border-[var(--wm-bg-border)] text-[#0F1923] dark:text-[#F8FAFE] rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" /></svg>
            Copy Public Link
          </button>
          <button onClick={() => setShowUpload(true)} className="px-3 py-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
            + Upload Photo
          </button>
        </div>
      </div>

      {/* Public link display */}
      <div className="flex items-center gap-2 px-3 py-2 bg-[var(--wm-bg-secondary)] border border-[var(--wm-bg-border)] rounded-lg">
        <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" /></svg>
        <span className="text-xs text-blue-600 dark:text-blue-400 font-mono">https://wrapmind.app/gallery/{SHOP_ID}</span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Total Photos', value: gallery.length },
          { label: 'Featured', value: featuredCount },
        ].map(s => (
          <div key={s.label} className="bg-[var(--wm-bg-secondary)] border border-[var(--wm-bg-border)] rounded-xl p-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">{s.label}</p>
            <p className="text-xl font-bold text-[#0F1923] dark:text-[#F8FAFE] mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Grid */}
      {gallery.length === 0 ? (
        <div className="bg-[var(--wm-bg-secondary)] border border-[var(--wm-bg-border)] rounded-xl p-8 text-center">
          <svg className="w-10 h-10 mx-auto text-gray-300 dark:text-gray-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg>
          <p className="text-xs text-gray-400">No photos yet. Upload your first portfolio photo.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {gallery.map(photo => (
            <div key={photo.id} className="bg-[var(--wm-bg-secondary)] border border-[var(--wm-bg-border)] rounded-xl overflow-hidden group">
              {/* Image area */}
              <div className="aspect-video bg-gray-100 dark:bg-gray-800 relative">
                {photo.thumbnail ? (
                  <img src={photo.thumbnail} alt={photo.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <svg className="w-10 h-10 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg>
                  </div>
                )}
                {/* Featured star */}
                <button
                  onClick={() => updatePhoto(photo.id, { featured: !photo.featured })}
                  className={`absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center transition-colors ${photo.featured ? 'bg-amber-400 text-white' : 'bg-black/30 text-white opacity-0 group-hover:opacity-100'}`}
                  title={photo.featured ? 'Remove from featured' : 'Mark as featured'}
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill={photo.featured ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" /></svg>
                </button>
              </div>
              {/* Card body */}
              <div className="p-3 space-y-2">
                <p className="text-xs font-medium text-[#0F1923] dark:text-[#F8FAFE] line-clamp-1">{photo.title}</p>
                {photo.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {photo.tags.map(tag => (
                      <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--wm-bg-primary)] border border-[var(--wm-bg-border)] text-gray-500 dark:text-gray-400">{tag}</span>
                    ))}
                  </div>
                )}
                {photo.jobDate && <p className="text-[10px] text-gray-400">{new Date(photo.jobDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>}
                <div className="flex items-center gap-1.5 pt-1">
                  <button onClick={() => setEditPhoto(photo)} className="flex-1 px-2 py-1 text-[10px] font-medium bg-[var(--wm-bg-primary)] border border-[var(--wm-bg-border)] text-[#0F1923] dark:text-[#F8FAFE] rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors">Edit</button>
                  <button onClick={() => removePhoto(photo.id)} className="flex-1 px-2 py-1 text-[10px] font-medium bg-[var(--wm-bg-primary)] border border-[var(--wm-bg-border)] text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors">Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showUpload && <UploadModal onClose={() => setShowUpload(false)} onAdd={addPhoto} />}
      {editPhoto && <EditModal photo={editPhoto} onClose={() => setEditPhoto(null)} onSave={(patch) => updatePhoto(editPhoto.id, patch)} />}
      {toast && <Toast message={toast} />}
    </div>
  );
}
