import { useState, useEffect, useMemo } from 'react';
import { useFeedback } from '../../context/FeedbackContext';

const STATUS_CONFIG = {
  open:      { label: 'Open',       color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' },
  resolved:  { label: 'Resolved',   color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' },
  wontfix:   { label: "Won't Fix",  color: 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400' },
};

function timeAgo(iso) {
  const secs = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (secs < 60) return `${secs}s ago`;
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return `${Math.floor(secs / 86400)}d ago`;
}

function SortIcon({ col, sortKey, sortDir }) {
  if (sortKey !== col) return (
    <svg className="w-3 h-3 text-gray-400 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
    </svg>
  );
  return sortDir === 'asc' ? (
    <svg className="w-3 h-3 text-[#2E8BF0]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
    </svg>
  ) : (
    <svg className="w-3 h-3 text-[#2E8BF0]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
    </svg>
  );
}

export default function SiteBugsPage() {
  const { items, loading, loadAll, respond, username } = useFeedback();

  const [filterReaction, setFilterReaction] = useState('all');
  const [filterStatus,   setFilterStatus]   = useState('all');
  const [filterShop,     setFilterShop]     = useState('all');
  const [filterBuild,    setFilterBuild]    = useState('all');
  const [search,         setSearch]         = useState('');
  const [sortKey,        setSortKey]        = useState('created_at');
  const [sortDir,        setSortDir]        = useState('desc');
  const [expandedId,     setExpandedId]     = useState(null);
  const [replyText,      setReplyText]      = useState('');
  const [responding,     setResponding]     = useState(false);

  useEffect(() => { loadAll(); }, [loadAll]);

  // ── Unique filter values from data ─────────────────────────────────────
  const shops  = useMemo(() => ['all', ...new Set(items.map(i => i.shop_name))], [items]);
  const builds = useMemo(() => ['all', ...new Set(items.map(i => i.build))], [items]);

  // ── Filter + sort ──────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = items;
    if (filterReaction !== 'all') list = list.filter(i => i.reaction === filterReaction);
    if (filterStatus !== 'all')   list = list.filter(i => i.status   === filterStatus);
    if (filterShop !== 'all')     list = list.filter(i => i.shop_name === filterShop);
    if (filterBuild !== 'all')    list = list.filter(i => i.build     === filterBuild);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(i =>
        (i.note || '').toLowerCase().includes(q) ||
        i.username.toLowerCase().includes(q) ||
        i.page.toLowerCase().includes(q)
      );
    }
    return [...list].sort((a, b) => {
      let av = a[sortKey], bv = b[sortKey];
      if (typeof av === 'string') av = av.toLowerCase();
      if (typeof bv === 'string') bv = bv.toLowerCase();
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [items, filterReaction, filterStatus, filterShop, filterBuild, search, sortKey, sortDir]);

  const openCount = items.filter(i => i.status === 'open').length;

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const handleRespond = async (id, newStatus) => {
    setResponding(true);
    try {
      await respond(id, { status: newStatus, response: replyText.trim() });
      setExpandedId(null);
      setReplyText('');
    } finally {
      setResponding(false);
    }
  };

  const ColHeader = ({ label, col }) => (
    <th
      className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-[#64748B] dark:text-[#7D93AE] cursor-pointer select-none hover:text-[#0F1923] dark:hover:text-[#F8FAFE] transition-colors"
      onClick={() => toggleSort(col)}
    >
      <div className="flex items-center gap-1">
        {label}
        <SortIcon col={col} sortKey={sortKey} sortDir={sortDir} />
      </div>
    </th>
  );

  return (
    <div className="flex flex-col h-full">
      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div className="h-10 bg-white dark:bg-[#1B2A3E] border-b border-gray-200 dark:border-[#243348] flex items-center justify-between px-6 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-[#0F1923] dark:text-[#F8FAFE]">Site Bugs</span>
          {openCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-bold leading-none">
              {openCount}
            </span>
          )}
        </div>
        <button
          onClick={loadAll}
          disabled={loading}
          className="h-7 px-3 rounded border border-gray-200 dark:border-[#243348] text-xs font-medium text-[#64748B] dark:text-[#7D93AE] hover:bg-gray-100 dark:hover:bg-[#243348] transition-colors disabled:opacity-40"
        >
          {loading ? 'Loading…' : '↻ Refresh'}
        </button>
      </div>

      {/* ── Filter bar ──────────────────────────────────────────────────── */}
      <div className="px-6 py-3 border-b border-gray-200 dark:border-[#243348] bg-gray-50 dark:bg-[#0F1923]/40 flex flex-wrap gap-2 items-center flex-shrink-0">
        {/* Search */}
        <div className="relative">
          <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 15.803a7.5 7.5 0 0 0 10.607 0Z" />
          </svg>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search notes, user, page…"
            className="h-7 pl-8 pr-3 rounded border border-gray-200 dark:border-[#243348] bg-white dark:bg-[#243348] text-xs text-[#0F1923] dark:text-[#F8FAFE] focus:outline-none focus:ring-1 focus:ring-[#2E8BF0] w-48"
          />
        </div>

        {/* Reaction filter */}
        <div className="flex rounded border border-gray-200 dark:border-[#243348] overflow-hidden h-7">
          {[['all', 'All'], ['up', 'Helpful'], ['down', 'Not Helpful']].map(([val, label]) => (
            <button key={val} onClick={() => setFilterReaction(val)}
              className={`px-3 text-xs font-medium border-r last:border-r-0 border-gray-200 dark:border-[#243348] transition-colors ${filterReaction === val ? 'wm-btn-primary' : 'bg-white dark:bg-[#243348] text-[#64748B] dark:text-[#7D93AE] hover:bg-gray-50 dark:hover:bg-[#1B2A3E]'}`}
            >{label}</button>
          ))}
        </div>

        {/* Status filter */}
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="h-7 px-2 rounded border border-gray-200 dark:border-[#243348] bg-white dark:bg-[#243348] text-xs text-[#0F1923] dark:text-[#F8FAFE] focus:outline-none focus:ring-1 focus:ring-[#2E8BF0]"
        >
          <option value="all">All Statuses</option>
          <option value="open">Open</option>
          <option value="resolved">Resolved</option>
          <option value="wontfix">Won't Fix</option>
        </select>

        {/* Shop filter */}
        <select
          value={filterShop}
          onChange={e => setFilterShop(e.target.value)}
          className="h-7 px-2 rounded border border-gray-200 dark:border-[#243348] bg-white dark:bg-[#243348] text-xs text-[#0F1923] dark:text-[#F8FAFE] focus:outline-none focus:ring-1 focus:ring-[#2E8BF0]"
        >
          {shops.map(s => <option key={s} value={s}>{s === 'all' ? 'All Shops' : s}</option>)}
        </select>

        {/* Build filter */}
        <select
          value={filterBuild}
          onChange={e => setFilterBuild(e.target.value)}
          className="h-7 px-2 rounded border border-gray-200 dark:border-[#243348] bg-white dark:bg-[#243348] text-xs text-[#0F1923] dark:text-[#F8FAFE] focus:outline-none focus:ring-1 focus:ring-[#2E8BF0]"
        >
          {builds.map(b => <option key={b} value={b}>{b === 'all' ? 'All Builds' : `v${b}`}</option>)}
        </select>

        <span className="ml-auto text-[11px] text-[#64748B] dark:text-[#7D93AE]">
          {filtered.length} of {items.length} entries
        </span>
      </div>

      {/* ── Grid ────────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-auto">
        {loading && items.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-5 h-5 border border-gray-300 border-t-[#2E8BF0] rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-3">
              <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
              </svg>
            </div>
            <p className="text-sm font-medium text-[#0F1923] dark:text-[#F8FAFE]">No feedback yet</p>
            <p className="text-xs text-[#64748B] dark:text-[#7D93AE] mt-1">Submissions from the sidebar widget will appear here.</p>
          </div>
        ) : (
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-white dark:bg-[#1B2A3E] border-b border-gray-200 dark:border-[#243348] z-10">
              <tr>
                <ColHeader label="Reaction" col="reaction" />
                <ColHeader label="Note" col="note" />
                <ColHeader label="Page" col="page" />
                <ColHeader label="User" col="username" />
                <ColHeader label="Shop" col="shop_name" />
                <ColHeader label="Build" col="build" />
                <ColHeader label="Time" col="created_at" />
                <ColHeader label="Status" col="status" />
                <th className="px-3 py-2.5 w-16" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-[#243348]">
              {filtered.map(item => {
                const isExpanded = expandedId === item.id;
                return (
                  <>
                    <tr
                      key={item.id}
                      className={`hover:bg-gray-50 dark:hover:bg-[#1B2A3E]/60 transition-colors cursor-pointer ${isExpanded ? 'bg-blue-50/50 dark:bg-[#2E8BF0]/5' : ''}`}
                      onClick={() => { setExpandedId(isExpanded ? null : item.id); setReplyText(item.response || ''); }}
                    >
                      {/* Reaction */}
                      <td className="px-3 py-3">
                        <span className={`flex items-center justify-center ${item.reaction === 'up' ? 'text-green-500' : 'text-red-500'}`}>
                          {item.reaction === 'up' ? (
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6.633 10.25c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 0 1 2.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 0 0 .322-1.672V2.75a.75.75 0 0 1 .75-.75 2.25 2.25 0 0 1 2.25 2.25c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282m0 0h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 0 1-2.649 7.521c-.388.482-.987.729-1.605.729H13.48c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 0 0-1.423-.23H5.904m10.598-9.75H14.25M5.904 18.5c.083.205.173.405.27.602.197.4-.078.898-.523.898h-.908c-.889 0-1.713-.518-1.972-1.368a12 12 0 0 1-.521-3.507c0-1.553.295-3.036.831-4.398C3.387 9.953 4.167 9.5 5 9.5h1.053a4.5 4.5 0 0 1 1.423.23l3.114 1.04a4.5 4.5 0 0 0 1.423.23H12M5.904 18.5H4" /></svg>
                          ) : (
                            <svg className="w-3.5 h-3.5 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6.633 10.25c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 0 1 2.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 0 0 .322-1.672V2.75a.75.75 0 0 1 .75-.75 2.25 2.25 0 0 1 2.25 2.25c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282m0 0h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 0 1-2.649 7.521c-.388.482-.987.729-1.605.729H13.48c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 0 0-1.423-.23H5.904m10.598-9.75H14.25M5.904 18.5c.083.205.173.405.27.602.197.4-.078.898-.523.898h-.908c-.889 0-1.713-.518-1.972-1.368a12 12 0 0 1-.521-3.507c0-1.553.295-3.036.831-4.398C3.387 9.953 4.167 9.5 5 9.5h1.053a4.5 4.5 0 0 1 1.423.23l3.114 1.04a4.5 4.5 0 0 0 1.423.23H12M5.904 18.5H4" /></svg>
                          )}
                        </span>
                      </td>
                      {/* Note + attachment badges */}
                      <td className="px-3 py-3 max-w-[220px]">
                        <div className="flex items-center gap-1.5">
                          {item.screenshot_url && (
                            <svg className="w-3 h-3 flex-shrink-0 text-[#2E8BF0]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} title="Has screenshot">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316Z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
                            </svg>
                          )}
                          {item.voice_memo_url && (
                            <svg className="w-3 h-3 flex-shrink-0 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} title="Has voice memo">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                            </svg>
                          )}
                          <p className="truncate text-[#0F1923] dark:text-[#F8FAFE]">
                            {item.note || <span className="text-[#64748B] dark:text-[#7D93AE] italic">No note</span>}
                          </p>
                        </div>
                      </td>
                      {/* Page */}
                      <td className="px-3 py-3">
                        <span className="font-mono text-[#64748B] dark:text-[#7D93AE]">{item.page}</span>
                      </td>
                      {/* User */}
                      <td className="px-3 py-3 text-[#0F1923] dark:text-[#F8FAFE]">{item.username}</td>
                      {/* Shop */}
                      <td className="px-3 py-3 text-[#64748B] dark:text-[#7D93AE]">{item.shop_name}</td>
                      {/* Build */}
                      <td className="px-3 py-3">
                        <span className="font-mono text-[#64748B] dark:text-[#7D93AE]">v{item.build}</span>
                      </td>
                      {/* Time */}
                      <td className="px-3 py-3" title={new Date(item.created_at).toLocaleString()}>
                        <span className="text-[#64748B] dark:text-[#7D93AE]">{timeAgo(item.created_at)}</span>
                      </td>
                      {/* Status */}
                      <td className="px-3 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${STATUS_CONFIG[item.status]?.color}`}>
                          {STATUS_CONFIG[item.status]?.label}
                        </span>
                      </td>
                      {/* Expand chevron */}
                      <td className="px-3 py-3 text-right">
                        <svg
                          className={`w-3.5 h-3.5 text-gray-400 transition-transform inline ${isExpanded ? 'rotate-180' : ''}`}
                          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </td>
                    </tr>

                    {/* ── Expanded panel ─────────────────────────────────── */}
                    {isExpanded && (
                      <tr key={`${item.id}-expand`} className="bg-blue-50/30 dark:bg-[#2E8BF0]/5">
                        <td colSpan={9} className="px-6 py-4">
                          <div className="max-w-3xl space-y-3">
                            {/* Screenshot + Voice memo — side by side if both exist */}
                            {(item.screenshot_url || item.voice_memo_url) && (
                              <div className={`flex gap-4 ${item.screenshot_url && item.voice_memo_url ? 'flex-col lg:flex-row' : ''}`}>
                                {item.screenshot_url && (
                                  <div className={item.voice_memo_url ? 'flex-1' : 'w-full max-w-lg'}>
                                    <p className="text-[10px] font-semibold uppercase tracking-wider text-[#64748B] dark:text-[#7D93AE] mb-1">Screenshot</p>
                                    <a href={item.screenshot_url} target="_blank" rel="noopener noreferrer"
                                      className="block group relative w-full rounded overflow-hidden border border-gray-200 dark:border-[#243348] hover:border-[#2E8BF0] transition-colors">
                                      <img src={item.screenshot_url} alt="Feedback screenshot"
                                        className="w-full object-cover object-top rounded" style={{ maxHeight: '200px' }} />
                                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                                        <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/70 text-white text-[10px] font-medium px-2 py-1 rounded">
                                          Open full size ↗
                                        </span>
                                      </div>
                                    </a>
                                  </div>
                                )}
                                {item.voice_memo_url && (
                                  <div className="flex-shrink-0">
                                    <p className="text-[10px] font-semibold uppercase tracking-wider text-[#64748B] dark:text-[#7D93AE] mb-1">Voice Memo</p>
                                    <div className="rounded border border-gray-200 dark:border-[#243348] bg-gray-50 dark:bg-[#0F1923]/40 px-3 py-2 flex flex-col gap-1.5">
                                      <div className="flex items-center gap-1.5 text-[10px] text-[#64748B] dark:text-[#7D93AE]">
                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                                        </svg>
                                        Audio recording
                                      </div>
                                      <audio src={item.voice_memo_url} controls
                                        className="w-full" style={{ minWidth: '220px', colorScheme: 'light dark' }} />
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Full note */}
                            {item.note && (
                              <div>
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-[#64748B] dark:text-[#7D93AE] mb-1">Full Note</p>
                                <p className="text-sm text-[#0F1923] dark:text-[#F8FAFE] bg-white dark:bg-[#1B2A3E] rounded border border-gray-200 dark:border-[#243348] px-3 py-2">
                                  {item.note}
                                </p>
                              </div>
                            )}

                            {/* Existing response */}
                            {item.response && (
                              <div>
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-green-600 dark:text-green-400 mb-1">
                                  Response by {item.responded_by} · {timeAgo(item.responded_at)}
                                </p>
                                <p className="text-sm text-[#0F1923] dark:text-[#F8FAFE] bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-800/40 px-3 py-2">
                                  {item.response}
                                </p>
                              </div>
                            )}

                            {/* Reply textarea */}
                            <div>
                              <p className="text-[10px] font-semibold uppercase tracking-wider text-[#64748B] dark:text-[#7D93AE] mb-1">
                                {item.response ? 'Update Response' : 'Add Response'}
                              </p>
                              <textarea
                                value={replyText}
                                onChange={e => setReplyText(e.target.value)}
                                placeholder="Type your response or internal note…"
                                rows={2}
                                className="w-full rounded border border-gray-200 dark:border-[#243348] bg-white dark:bg-[#243348] px-3 py-2 text-sm text-[#0F1923] dark:text-[#F8FAFE] focus:outline-none focus:ring-1 focus:ring-[#2E8BF0] resize-none"
                              />
                            </div>

                            {/* Action buttons */}
                            <div className="flex gap-2 flex-wrap">
                              <button
                                onClick={() => handleRespond(item.id, 'resolved')}
                                disabled={responding}
                                className="h-7 px-3 rounded bg-green-500 hover:bg-green-600 text-white text-xs font-medium transition-colors disabled:opacity-40"
                              >
                                ✓ Mark Resolved
                              </button>
                              <button
                                onClick={() => handleRespond(item.id, 'wontfix')}
                                disabled={responding}
                                className="h-7 px-3 rounded border border-gray-200 dark:border-[#243348] bg-white dark:bg-[#243348] text-xs font-medium text-[#64748B] dark:text-[#7D93AE] hover:bg-gray-50 dark:hover:bg-[#1B2A3E] transition-colors disabled:opacity-40"
                              >
                                Won't Fix
                              </button>
                              {item.status !== 'open' && (
                                <button
                                  onClick={() => handleRespond(item.id, 'open')}
                                  disabled={responding}
                                  className="h-7 px-3 rounded border border-amber-300 dark:border-amber-700 bg-white dark:bg-[#243348] text-xs font-medium text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors disabled:opacity-40"
                                >
                                  ↩ Reopen
                                </button>
                              )}
                              {replyText.trim() && (
                                <button
                                  onClick={() => handleRespond(item.id, item.status)}
                                  disabled={responding}
                                  className="wm-btn-primary disabled:opacity-40"
                                >
                                  {responding ? 'Saving…' : 'Save Response'}
                                </button>
                              )}
                            </div>

                            {/* Metadata footer */}
                            <p className="text-[10px] text-[#64748B] dark:text-[#7D93AE]">
                              ID: <span className="font-mono">{item.id}</span> · Submitted {new Date(item.created_at).toLocaleString()}
                            </p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
