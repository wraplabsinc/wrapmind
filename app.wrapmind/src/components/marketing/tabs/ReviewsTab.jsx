import { useState, useMemo } from 'react';
import { useMarketing } from '../../../context/MarketingContext';
import WMIcon from '../../ui/WMIcon';

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
function fmtRelative(iso) {
  if (!iso) return '';
  const days = Math.floor((Date.now() - new Date(iso)) / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 30) return `${days}d ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

// ── Sub-components ────────────────────────────────────────────────────────────
function StarRating({ rating, size = 'sm' }) {
  if (rating === null || rating === undefined) return <span className="text-xs text-gray-400">—</span>;
  const sz = size === 'lg' ? 'w-4 h-4' : 'w-3 h-3';
  return (
    <span className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(i => (
        <svg key={i} className={`${sz} ${i <= rating ? 'text-amber-400' : 'text-gray-300 dark:text-gray-600'}`} viewBox="0 0 24 24" fill="currentColor">
          <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
        </svg>
      ))}
    </span>
  );
}

function PlatformBadge({ platform }) {
  const isGoogle = platform === 'Google';
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
      isGoogle
        ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800/40'
        : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800/40'
    }`}>
      {isGoogle ? (
        <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
      ) : (
        <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z"/>
        </svg>
      )}
      {platform}
    </span>
  );
}

function SentimentDot({ sentiment }) {
  const colors = {
    positive: 'bg-green-500',
    mixed:    'bg-amber-400',
    negative: 'bg-red-500',
  };
  const labels = { positive: 'Positive', mixed: 'Mixed', negative: 'Needs attention' };
  return (
    <span className="flex items-center gap-1">
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${colors[sentiment] || 'bg-gray-400'}`} />
      <span className="text-[10px] text-gray-500 dark:text-gray-400">{labels[sentiment] || sentiment}</span>
    </span>
  );
}

function Avatar({ initials }) {
  return (
    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center flex-shrink-0">
      <span className="text-[10px] font-bold text-white">{initials}</span>
    </div>
  );
}

// ── Reply modal ───────────────────────────────────────────────────────────────
function ReplyModal({ review, onClose, onSave }) {
  const [reply, setReply] = useState(review.ownerReplyText || '');
  const suggestions = [
    `Thank you ${review.reviewerName.split(' ')[0]} for taking the time to share your experience! We're glad you chose us.`,
    review.sentiment === 'negative'
      ? `We're sorry to hear about your experience, ${review.reviewerName.split(' ')[0]}. Please reach out directly so we can make it right.`
      : `${review.reviewerName.split(' ')[0]}, your feedback means the world to our team. We look forward to serving you again!`,
  ];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-[var(--wm-bg-secondary)] border border-[var(--wm-bg-border)] rounded-xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--wm-bg-border)]">
          <div>
            <h3 className="text-sm font-semibold text-[#0F1923] dark:text-[#F8FAFE]">
              {review.ownerReplied ? 'Edit Reply' : 'Reply to Review'}
            </h3>
            <p className="text-[10px] text-gray-400 mt-0.5">{review.reviewerName} · {review.platform} · <StarRating rating={review.rating} /></p>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Original review preview */}
        <div className="px-5 py-3 bg-[var(--wm-bg-primary)] border-b border-[var(--wm-bg-border)]">
          <p className="text-xs text-gray-500 dark:text-gray-400 italic line-clamp-2">"{review.text}"</p>
        </div>

        <div className="px-5 py-4 space-y-3">
          {/* AI suggestions */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-2 flex items-center gap-1.5">
              <svg className="w-3 h-3 text-violet-500" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a1 1 0 011 1v1.07A8.001 8.001 0 0120 12h.93a1 1 0 010 2H20a8.001 8.001 0 01-7 6.93V22a1 1 0 01-2 0v-.07A8.001 8.001 0 014 14H3.07a1 1 0 010-2H4a8.001 8.001 0 017-6.93V3a1 1 0 011-1zm0 4a6 6 0 100 12A6 6 0 0012 6zm0 2a4 4 0 110 8 4 4 0 010-8z"/></svg>
              AI Suggested Replies
            </p>
            <div className="space-y-1.5">
              {suggestions.map((s, i) => (
                <button key={i} onClick={() => setReply(s)}
                  className="w-full text-left text-[11px] text-gray-600 dark:text-gray-300 bg-violet-50 dark:bg-violet-900/15 border border-violet-200 dark:border-violet-800/40 rounded-lg px-3 py-2 hover:bg-violet-100 dark:hover:bg-violet-900/30 transition-colors line-clamp-2">
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Text area */}
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 block mb-1">Your Reply</label>
            <textarea rows={4} value={reply} onChange={e => setReply(e.target.value)}
              placeholder="Write a public reply..."
              className="w-full px-3 py-2 text-xs border border-[var(--wm-bg-border)] rounded-lg bg-[var(--wm-bg-primary)] text-[#0F1923] dark:text-[#F8FAFE] focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none" />
            <p className="text-[10px] text-gray-400 mt-1">Replies are public on {review.platform}. Keep it professional and grateful.</p>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button onClick={onClose} className="px-3 py-1.5 text-xs font-medium bg-[var(--wm-bg-secondary)] border border-[var(--wm-bg-border)] text-[#0F1923] dark:text-[#F8FAFE] rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors">Cancel</button>
            <button onClick={() => { onSave(reply); onClose(); }} disabled={!reply.trim()}
              className="px-3 py-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-lg transition-colors">
              {review.ownerReplied ? 'Update Reply' : 'Post Reply'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Send request modal ────────────────────────────────────────────────────────
function SendModal({ onClose, onSend }) {
  const [form, setForm] = useState({
    customerName: '', email: '', phone: '', platform: 'Google',
    message: "We'd love to hear about your experience! Please take a moment to leave us a review.",
  });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.customerName.trim() || !form.email.trim()) return;
    onSend(form);
    onClose();
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-[var(--wm-bg-secondary)] border border-[var(--wm-bg-border)] rounded-xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--wm-bg-border)]">
          <h3 className="text-sm font-semibold text-[#0F1923] dark:text-[#F8FAFE]">Send Review Request</h3>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-3">
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 block mb-1">Customer Name *</label>
            <input className="w-full h-8 px-3 text-xs border border-[var(--wm-bg-border)] rounded-lg bg-[var(--wm-bg-primary)] text-[#0F1923] dark:text-[#F8FAFE] focus:outline-none focus:ring-1 focus:ring-blue-500" value={form.customerName} onChange={e => set('customerName', e.target.value)} placeholder="Full name" required />
          </div>
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 block mb-1">Email *</label>
            <input type="email" className="w-full h-8 px-3 text-xs border border-[var(--wm-bg-border)] rounded-lg bg-[var(--wm-bg-primary)] text-[#0F1923] dark:text-[#F8FAFE] focus:outline-none focus:ring-1 focus:ring-blue-500" value={form.email} onChange={e => set('email', e.target.value)} placeholder="customer@email.com" required />
          </div>
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 block mb-1">Phone</label>
            <input className="w-full h-8 px-3 text-xs border border-[var(--wm-bg-border)] rounded-lg bg-[var(--wm-bg-primary)] text-[#0F1923] dark:text-[#F8FAFE] focus:outline-none focus:ring-1 focus:ring-blue-500" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="(000) 000-0000" />
          </div>
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 block mb-1">Platform</label>
            <div className="flex gap-4">
              {['Google', 'Yelp'].map(p => (
                <label key={p} className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="platform" value={p} checked={form.platform === p} onChange={() => set('platform', p)} className="accent-blue-600" />
                  <span className="text-xs text-[#0F1923] dark:text-[#F8FAFE]">{p}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 block mb-1">Message</label>
            <textarea rows={3} className="w-full px-3 py-2 text-xs border border-[var(--wm-bg-border)] rounded-lg bg-[var(--wm-bg-primary)] text-[#0F1923] dark:text-[#F8FAFE] focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none" value={form.message} onChange={e => set('message', e.target.value)} />
            <p className="text-[10px] text-gray-400 mt-1">A Google Maps or Yelp link will be appended automatically.</p>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className="px-3 py-1.5 text-xs font-medium bg-[var(--wm-bg-secondary)] border border-[var(--wm-bg-border)] text-[#0F1923] dark:text-[#F8FAFE] rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors">Cancel</button>
            <button type="submit" className="px-3 py-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">Send Request</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Review card (expanded) ────────────────────────────────────────────────────
function ReviewCard({ review, onReply }) {
  const [expanded, setExpanded] = useState(false);
  const needsReply = !review.ownerReplied && (review.sentiment === 'negative' || review.sentiment === 'mixed' || review.rating <= 3);

  return (
    <div className={`bg-[var(--wm-bg-secondary)] border rounded-xl transition-all ${
      needsReply ? 'border-amber-300/50 dark:border-amber-600/30' : 'border-[var(--wm-bg-border)]'
    }`}>
      <div className="p-4">
        <div className="flex items-start gap-3">
          <Avatar initials={review.reviewerInitials} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center flex-wrap gap-2 mb-1">
              <span className="text-xs font-semibold text-[#0F1923] dark:text-[#F8FAFE]">{review.reviewerName}</span>
              <PlatformBadge platform={review.platform} />
              {review.verified && (
                <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                  <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
                  Verified
                </span>
              )}
              {needsReply && (
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800/40">
                  Needs reply
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 mb-2">
              <StarRating rating={review.rating} size="lg" />
              <span className="text-[10px] text-gray-400">{fmtRelative(review.publishedAt)}</span>
              {review.helpfulVotes > 0 && (
                <span className="text-[10px] text-gray-400">{review.helpfulVotes} found helpful</span>
              )}
            </div>

            <p className={`text-xs text-gray-600 dark:text-gray-300 leading-relaxed ${expanded ? '' : 'line-clamp-3'}`}>
              {review.text}
            </p>
            {review.text.length > 150 && (
              <button onClick={() => setExpanded(v => !v)} className="text-[10px] text-blue-600 hover:text-blue-700 mt-1">
                {expanded ? 'Show less' : 'Read more'}
              </button>
            )}

            {/* Keywords */}
            {review.keywords?.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {review.keywords.map(k => (
                  <span key={k} className="text-[9px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-white/10">
                    {k}
                  </span>
                ))}
              </div>
            )}

            {/* Metadata row */}
            <div className="flex items-center gap-3 mt-2">
              <SentimentDot sentiment={review.sentiment} />
              {review.serviceType && (
                <span className="text-[10px] text-gray-400">{review.serviceType}</span>
              )}
              {review.vehicleType && (
                <span className="text-[10px] text-gray-400">{review.vehicleType}</span>
              )}
            </div>
          </div>

          {/* Reply button */}
          <button onClick={() => onReply(review)}
            className={`flex-shrink-0 px-2.5 py-1.5 text-[10px] font-medium rounded-lg border transition-colors ${
              review.ownerReplied
                ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/15 dark:text-green-400 dark:border-green-800/40 hover:bg-green-100 dark:hover:bg-green-900/30'
                : 'bg-[var(--wm-bg-primary)] text-[#0F1923] dark:text-[#F8FAFE] border-[var(--wm-bg-border)] hover:bg-gray-100 dark:hover:bg-white/5'
            }`}>
            {review.ownerReplied ? '✓ Replied' : 'Reply'}
          </button>
        </div>

        {/* Owner reply thread */}
        {review.ownerReplied && review.ownerReplyText && (
          <div className="mt-3 ml-11 pl-3 border-l-2 border-blue-200 dark:border-blue-800/40">
            <p className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 mb-1">Your reply · {fmtRelative(review.ownerRepliedAt)}</p>
            <p className="text-[11px] text-gray-600 dark:text-gray-300 leading-relaxed">{review.ownerReplyText}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── AI suggestions ────────────────────────────────────────────────────────────
function AISuggestions({ platformReviews }) {
  const [open, setOpen] = useState(true);

  const unreplied = platformReviews.filter(r => !r.ownerReplied);
  const negOrMixed = platformReviews.filter(r => r.sentiment !== 'positive');
  const avgRating = platformReviews.length
    ? (platformReviews.reduce((s, r) => s + r.rating, 0) / platformReviews.length).toFixed(1)
    : 0;
  const googleCount = platformReviews.filter(r => r.platform === 'Google').length;
  const yelpCount   = platformReviews.filter(r => r.platform === 'Yelp').length;
  const services = platformReviews.map(r => r.serviceType).filter(Boolean);
  const serviceFreq = services.reduce((acc, s) => { acc[s] = (acc[s] || 0) + 1; return acc; }, {});
  const topService  = Object.entries(serviceFreq).sort((a,b) => b[1]-a[1])[0]?.[0];
  const lowService  = Object.entries(serviceFreq).sort((a,b) => a[1]-b[1])[0]?.[0];

  const suggestions = [
    unreplied.length > 0 && {
      urgency: 'high',
      icon: 'chat-bubble',
      title: `${unreplied.length} review${unreplied.length > 1 ? 's' : ''} without a reply`,
      body: `Responding within 24–48 hours increases perceived professionalism and boosts your ranking on both Google and Yelp. Even a brief thank-you lifts future star ratings.`,
      action: 'Scroll down to reply',
    },
    negOrMixed.length > 0 && {
      urgency: 'high',
      icon: '⚠️',
      title: `${negOrMixed.length} mixed/negative review${negOrMixed.length > 1 ? 's' : ''} need attention`,
      body: `Shops that publicly acknowledge and resolve complaints convert up to 33% of upset customers into repeat business. Reply empathetically and offer a direct contact.`,
      action: 'Filter by Mixed / Negative',
    },
    yelpCount < googleCount && {
      urgency: 'medium',
      icon: 'chart-bar',
      title: `Your Yelp presence is weaker (${yelpCount} vs ${googleCount} Google)`,
      body: `Yelp drives significant local discovery for automotive services. Ask your next 5 customers specifically to leave a Yelp review to balance your profile strength.`,
      action: 'Send Yelp requests',
    },
    Number(avgRating) >= 4.5 && {
      urgency: 'low',
      icon: '⭐',
      title: `${avgRating}★ average — you\'re in the top tier`,
      body: `Shops with 4.5+ average ratings are 3× more likely to be clicked in local search. Add your Google review link to your estimate PDFs and invoice emails to keep the momentum.`,
      action: 'Add to estimate footer',
    },
    topService && {
      urgency: 'low',
      icon: 'target',
      title: `${topService} customers leave the most reviews`,
      body: `Lean into this by sending review requests within 24 hours of ${topService} job completion — while the excitement is fresh. Consider a text template specifically mentioning their vehicle transformation.`,
      action: 'Create follow-up template',
    },
    lowService && lowService !== topService && {
      urgency: 'low',
      icon: 'photo',
      title: `Few reviews mention ${lowService}`,
      body: `${lowService} customers may need more prompting. Try a photo-first approach — send a before/after image of their vehicle with a review link embedded. Visual proof increases conversion.`,
      action: null,
    },
    {
      urgency: 'low',
      icon: 'calendar',
      title: 'Automate post-job review requests',
      body: `Enable the Follow-ups tab sequence to automatically send a review request 2 days after an invoice is marked paid. Shops using automated asks get 4–6× more reviews than manual requests.`,
      action: 'Go to Follow-ups tab',
    },
  ].filter(Boolean);

  const urgencyColors = {
    high:   'border-red-200 dark:border-red-800/40 bg-red-50/50 dark:bg-red-900/10',
    medium: 'border-amber-200 dark:border-amber-800/40 bg-amber-50/50 dark:bg-amber-900/10',
    low:    'border-[var(--wm-bg-border)] bg-[var(--wm-bg-secondary)]',
  };
  const urgencyDot = { high: 'bg-red-500', medium: 'bg-amber-400', low: 'bg-blue-600' };

  return (
    <div className="bg-[var(--wm-bg-secondary)] border border-[var(--wm-bg-border)] rounded-xl overflow-hidden">
      <button onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-[var(--wm-bg-primary)] transition-colors">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-violet-500" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2a1 1 0 011 1v1.07A8.001 8.001 0 0120 12h.93a1 1 0 010 2H20a8.001 8.001 0 01-7 6.93V22a1 1 0 01-2 0v-.07A8.001 8.001 0 014 14H3.07a1 1 0 010-2H4a8.001 8.001 0 017-6.93V3a1 1 0 011-1zm0 4a6 6 0 100 12A6 6 0 0012 6zm0 2a4 4 0 110 8 4 4 0 010-8z"/>
          </svg>
          <span className="text-xs font-semibold text-[#0F1923] dark:text-[#F8FAFE]">AI Suggestions</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-violet-100 text-violet-700 border border-violet-200 dark:bg-violet-900/20 dark:text-violet-400 dark:border-violet-800/40 font-semibold">
            {suggestions.length} insights
          </span>
        </div>
        <svg className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {open && (
        <div className="px-4 pb-4 grid grid-cols-1 sm:grid-cols-2 gap-2 border-t border-[var(--wm-bg-border)] pt-3">
          {suggestions.map((s, i) => (
            <div key={i} className={`rounded-lg border p-3 ${urgencyColors[s.urgency]}`}>
              <div className="flex items-start gap-2">
                {['⚠️', '⭐'].includes(s.icon) ? (
                  <span className="text-base leading-none flex-shrink-0 mt-0.5">{s.icon}</span>
                ) : (
                  <WMIcon name={s.icon} className="w-4 h-4 flex-shrink-0 mt-0.5 text-[#64748B] dark:text-[#7D93AE]" />
                )}
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${urgencyDot[s.urgency]}`} />
                    <p className="text-[11px] font-semibold text-[#0F1923] dark:text-[#F8FAFE] leading-tight">{s.title}</p>
                  </div>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-relaxed">{s.body}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Rating distribution bar ───────────────────────────────────────────────────
function RatingDistribution({ reviews }) {
  const counts = [5,4,3,2,1].map(star => ({ star, count: reviews.filter(r => r.rating === star).length }));
  const max = Math.max(...counts.map(c => c.count), 1);
  return (
    <div className="space-y-1">
      {counts.map(({ star, count }) => (
        <div key={star} className="flex items-center gap-2">
          <span className="text-[10px] text-gray-500 dark:text-gray-400 w-3 text-right">{star}</span>
          <svg className="w-2.5 h-2.5 text-amber-400 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
            <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
          </svg>
          <div className="flex-1 h-2 rounded-full bg-gray-100 dark:bg-white/5 overflow-hidden">
            <div className="h-full bg-amber-400 rounded-full transition-all duration-500"
              style={{ width: `${max > 0 ? (count / max) * 100 : 0}%` }} />
          </div>
          <span className="text-[10px] text-gray-400 w-4 text-right">{count}</span>
        </div>
      ))}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
const SORT_OPTIONS = [
  { value: 'newest',  label: 'Newest first' },
  { value: 'oldest',  label: 'Oldest first' },
  { value: 'highest', label: 'Highest rated' },
  { value: 'lowest',  label: 'Lowest rated' },
  { value: 'helpful', label: 'Most helpful' },
];

const REQUEST_STATUS_BADGE = {
  responded: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800/40',
  sent:      'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800/40',
  declined:  'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800/40',
};

export default function ReviewsTab() {
  const { reviews, addReview, updateReview, platformReviews, updatePlatformReview } = useMarketing();

  // Review requests state
  const [showSendModal, setShowSendModal] = useState(false);

  // Published reviews filter/sort state
  const [filterPlatform, setFilterPlatform] = useState('all');
  const [filterRating,   setFilterRating]   = useState('all');
  const [filterSentiment,setFilterSentiment] = useState('all');
  const [filterReplied,  setFilterReplied]   = useState('all');
  const [sortBy,         setSortBy]          = useState('newest');
  const [searchText,     setSearchText]      = useState('');
  const [replyTarget,    setReplyTarget]     = useState(null);

  // ── Computed stats ──────────────────────────────────────────────────────────
  const totalPlatform    = platformReviews.length;
  const avgRating        = totalPlatform
    ? (platformReviews.reduce((s, r) => s + r.rating, 0) / totalPlatform).toFixed(1)
    : '—';
  const googleTotal      = platformReviews.filter(r => r.platform === 'Google').length;
  const yelpTotal        = platformReviews.filter(r => r.platform === 'Yelp').length;
  const replyRate        = totalPlatform
    ? Math.round((platformReviews.filter(r => r.ownerReplied).length / totalPlatform) * 100)
    : 0;
  const needsReplyCount  = platformReviews.filter(r => !r.ownerReplied).length;

  // Review requests stats
  const reqTotal     = reviews.length;
  const reqResponded = reviews.filter(r => r.status === 'responded').length;
  const reqResponseRate = reqTotal > 0 ? Math.round((reqResponded / reqTotal) * 100) : 0;

  // ── Filter + sort published reviews ────────────────────────────────────────
  const filteredReviews = useMemo(() => {
    let list = [...platformReviews];
    if (filterPlatform !== 'all')  list = list.filter(r => r.platform === filterPlatform);
    if (filterRating   !== 'all')  list = list.filter(r => r.rating === Number(filterRating));
    if (filterSentiment !== 'all') list = list.filter(r => r.sentiment === filterSentiment);
    if (filterReplied  !== 'all')  list = list.filter(r => filterReplied === 'replied' ? r.ownerReplied : !r.ownerReplied);
    if (searchText.trim()) {
      const q = searchText.toLowerCase();
      list = list.filter(r =>
        r.reviewerName.toLowerCase().includes(q) ||
        r.text.toLowerCase().includes(q) ||
        (r.keywords || []).some(k => k.toLowerCase().includes(q)) ||
        (r.serviceType || '').toLowerCase().includes(q)
      );
    }
    switch (sortBy) {
      case 'oldest':  list.sort((a,b) => new Date(a.publishedAt) - new Date(b.publishedAt)); break;
      case 'highest': list.sort((a,b) => b.rating - a.rating); break;
      case 'lowest':  list.sort((a,b) => a.rating - b.rating); break;
      case 'helpful': list.sort((a,b) => (b.helpfulVotes||0) - (a.helpfulVotes||0)); break;
      default:        list.sort((a,b) => new Date(b.publishedAt) - new Date(a.publishedAt));
    }
    return list;
  }, [platformReviews, filterPlatform, filterRating, filterSentiment, filterReplied, sortBy, searchText]);

  const handleSendRequest = (form) => {
    addReview({ customerName: form.customerName, email: form.email, phone: form.phone, platform: form.platform, status: 'sent', rating: null, requestSentAt: new Date().toISOString() });
  };

  const handleResendRequest = (id) => {
    updateReview(id, { requestSentAt: new Date().toISOString(), status: 'sent' });
  };

  const handleSaveReply = (id, replyText) => {
    updatePlatformReview(id, {
      ownerReplied: true,
      ownerReplyText: replyText,
      ownerRepliedAt: new Date().toISOString(),
    });
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 space-y-6 max-w-4xl">

      {/* ── Section 1: Review Requests ────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-[#0F1923] dark:text-[#F8FAFE]">Review Requests</h2>
            <p className="text-[10px] text-gray-400 mt-0.5">Outbound requests sent to customers</p>
          </div>
          <button onClick={() => setShowSendModal(true)}
            className="px-3 py-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
            + Send Review Request
          </button>
        </div>

        {/* Request stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          {[
            { label: 'Requests Sent', value: reqTotal },
            { label: 'Response Rate', value: `${reqResponseRate}%` },
            { label: 'Responded',     value: reqResponded },
            { label: 'Google / Yelp', value: `${reviews.filter(r=>r.platform==='Google').length} / ${reviews.filter(r=>r.platform==='Yelp').length}` },
          ].map(s => (
            <div key={s.label} className="bg-[var(--wm-bg-secondary)] border border-[var(--wm-bg-border)] rounded-xl p-4">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">{s.label}</p>
              <p className="text-xl font-bold text-[#0F1923] dark:text-[#F8FAFE] mt-1">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Request table */}
        <div className="bg-[var(--wm-bg-secondary)] border border-[var(--wm-bg-border)] rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--wm-bg-border)]">
                {['Customer', 'Platform', 'Status', 'Rating', 'Sent', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-2.5 text-[10px] font-semibold uppercase tracking-widest text-gray-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--wm-bg-border)]">
              {reviews.map(r => (
                <tr key={r.id} className="hover:bg-[var(--wm-bg-primary)] transition-colors">
                  <td className="px-4 py-3">
                    <p className="text-xs font-medium text-[#0F1923] dark:text-[#F8FAFE]">{r.customerName}</p>
                    <p className="text-[10px] text-gray-400">{r.email}</p>
                  </td>
                  <td className="px-4 py-3"><PlatformBadge platform={r.platform} /></td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${REQUEST_STATUS_BADGE[r.status] || REQUEST_STATUS_BADGE.sent}`}>
                      {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-4 py-3"><StarRating rating={r.rating} /></td>
                  <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">{fmtDate(r.requestSentAt)}</td>
                  <td className="px-4 py-3">
                    {r.status === 'sent' && (
                      <button onClick={() => handleResendRequest(r.id)}
                        className="px-2.5 py-1 text-[10px] font-medium bg-[var(--wm-bg-primary)] border border-[var(--wm-bg-border)] text-[#0F1923] dark:text-[#F8FAFE] rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors">
                        Resend
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {reviews.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-xs text-gray-400">No review requests yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Section 2: Published Reviews ──────────────────────────────────── */}
      <div className="border-t border-[var(--wm-bg-border)] pt-2">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-[#0F1923] dark:text-[#F8FAFE]">Published Reviews</h2>
            <p className="text-[10px] text-gray-400 mt-0.5">Google &amp; Yelp · synced automatically</p>
          </div>
          <button
            onClick={() => window.open('https://business.google.com', '_blank')}
            className="px-3 py-1.5 text-xs font-medium bg-[var(--wm-bg-secondary)] border border-[var(--wm-bg-border)] text-[#0F1923] dark:text-[#F8FAFE] rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            Sync Reviews
          </button>
        </div>

        {/* Overall stats */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-5">
          {/* Big avg rating */}
          <div className="sm:col-span-2 bg-[var(--wm-bg-secondary)] border border-[var(--wm-bg-border)] rounded-xl p-4 flex items-center gap-4">
            <div>
              <p className="text-4xl font-black text-[#0F1923] dark:text-[#F8FAFE]">{avgRating}</p>
              <StarRating rating={Math.round(Number(avgRating))} size="lg" />
              <p className="text-[10px] text-gray-400 mt-1">{totalPlatform} reviews total</p>
            </div>
            <div className="flex-1">
              <RatingDistribution reviews={platformReviews} />
            </div>
          </div>

          <div className="bg-[var(--wm-bg-secondary)] border border-[var(--wm-bg-border)] rounded-xl p-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Google</p>
            <p className="text-xl font-bold text-[#0F1923] dark:text-[#F8FAFE] mt-1">{googleTotal}</p>
            <p className="text-[10px] text-gray-400">reviews</p>
          </div>

          <div className="bg-[var(--wm-bg-secondary)] border border-[var(--wm-bg-border)] rounded-xl p-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Yelp</p>
            <p className="text-xl font-bold text-[#0F1923] dark:text-[#F8FAFE] mt-1">{yelpTotal}</p>
            <p className="text-[10px] text-gray-400">reviews</p>
          </div>

          <div className="bg-[var(--wm-bg-secondary)] border border-[var(--wm-bg-border)] rounded-xl p-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Replied</p>
            <p className="text-xl font-bold text-[#0F1923] dark:text-[#F8FAFE] mt-1">{replyRate}%</p>
            {needsReplyCount > 0 && (
              <p className="text-[10px] text-amber-500">{needsReplyCount} pending</p>
            )}
          </div>
        </div>

        {/* AI Suggestions */}
        <div className="mb-4">
          <AISuggestions platformReviews={platformReviews} />
        </div>

        {/* Filter / search / sort bar */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <input
            value={searchText} onChange={e => setSearchText(e.target.value)}
            placeholder="Search reviews…"
            className="h-8 px-3 text-xs border border-[var(--wm-bg-border)] rounded-lg bg-[var(--wm-bg-primary)] text-[#0F1923] dark:text-[#F8FAFE] focus:outline-none focus:ring-1 focus:ring-blue-500 min-w-[180px]"
          />

          {[
            { value: filterPlatform,  set: setFilterPlatform,  options: [['all','All Platforms'],['Google','Google'],['Yelp','Yelp']] },
            { value: filterRating,    set: setFilterRating,    options: [['all','All Ratings'],['5','5★'],['4','4★'],['3','3★'],['2','2★'],['1','1★']] },
            { value: filterSentiment, set: setFilterSentiment, options: [['all','All Sentiment'],['positive','Positive'],['mixed','Mixed'],['negative','Negative']] },
            { value: filterReplied,   set: setFilterReplied,   options: [['all','All'],['replied','Replied'],['unreplied','Needs reply']] },
          ].map((f, i) => (
            <select key={i} value={f.value} onChange={e => f.set(e.target.value)}
              className="h-8 px-2 text-xs border border-[var(--wm-bg-border)] rounded-lg bg-[var(--wm-bg-primary)] text-[#0F1923] dark:text-[#F8FAFE] focus:outline-none focus:ring-1 focus:ring-blue-500">
              {f.options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          ))}

          <select value={sortBy} onChange={e => setSortBy(e.target.value)}
            className="h-8 px-2 text-xs border border-[var(--wm-bg-border)] rounded-lg bg-[var(--wm-bg-primary)] text-[#0F1923] dark:text-[#F8FAFE] focus:outline-none focus:ring-1 focus:ring-blue-500 ml-auto">
            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        {/* Results count */}
        <p className="text-[10px] text-gray-400 mb-3">
          Showing {filteredReviews.length} of {totalPlatform} reviews
          {filterPlatform !== 'all' || filterRating !== 'all' || filterSentiment !== 'all' || filterReplied !== 'all' || searchText
            ? ' (filtered)'
            : ''}
        </p>

        {/* Review cards */}
        <div className="space-y-3">
          {filteredReviews.map(r => (
            <ReviewCard key={r.id} review={r} onReply={setReplyTarget} />
          ))}
          {filteredReviews.length === 0 && (
            <div className="text-center py-10 text-xs text-gray-400">
              No reviews match your filters.
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showSendModal && <SendModal onClose={() => setShowSendModal(false)} onSend={handleSendRequest} />}
      {replyTarget && (
        <ReplyModal
          review={replyTarget}
          onClose={() => setReplyTarget(null)}
          onSave={(text) => handleSaveReply(replyTarget.id, text)}
        />
      )}
    </div>
  );
}
