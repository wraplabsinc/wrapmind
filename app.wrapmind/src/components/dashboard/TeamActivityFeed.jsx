import { useState, useEffect } from 'react';
import WMIcon from '../ui/WMIcon';

const ACTION_TYPES = {
  estimate_created:  { icon: 'document-text', color: '#2E8BF0', label: 'created estimate' },
  estimate_approved: { icon: 'check-circle',  color: '#22C55E', label: 'got approval on' },
  job_completed:     { icon: 'trophy',        color: '#8B5CF6', label: 'completed job for' },
  lead_added:        { icon: 'user-plus',     color: '#F59E0B', label: 'added lead' },
  xp_awarded:        { icon: '⭐',            color: '#F59E0B', label: 'earned XP —' },
  note_added:        { icon: 'pencil',        color: '#64748B', label: 'added a note on' },
  payment_received:  { icon: 'banknotes',     color: '#22C55E', label: 'received payment from' },
  follow_up_sent:    { icon: 'envelope',      color: '#2E8BF0', label: 'sent follow-up to' },
};

const SEED_EVENTS = [
  { id: 1,  actor: 'Tavo',  avatar: 'TH', type: 'estimate_created',  subject: 'EST-0044 — Marcus Bell',      time: 60 * 2,        amount: null },
  { id: 2,  actor: 'Duke',  avatar: 'DD', type: 'estimate_approved',  subject: 'EST-0041 — Jordan Cole',      time: 60 * 8,        amount: 7200 },
  { id: 3,  actor: 'Tim',   avatar: 'TS', type: 'job_completed',      subject: 'Finn O\'Brien',               time: 60 * 15,       amount: 5900 },
  { id: 4,  actor: 'Bonnie',avatar: 'BS', type: 'lead_added',         subject: 'Carla Reyes — 2023 G-Wagon', time: 60 * 23,       amount: null },
  { id: 5,  actor: 'Tavo',  avatar: 'TH', type: 'xp_awarded',         subject: '250 XP for top closer',      time: 60 * 35,       amount: null },
  { id: 6,  actor: 'Duke',  avatar: 'DD', type: 'payment_received',   subject: 'Devon Walsh',                 time: 60 * 58,       amount: 14800 },
  { id: 7,  actor: 'Tim',   avatar: 'TS', type: 'follow_up_sent',     subject: 'Priya Nair',                  time: 60 * 80,       amount: null },
  { id: 8,  actor: 'Bonnie',avatar: 'BS', type: 'estimate_created',   subject: 'EST-0043 — Sam Ortega',      time: 60 * 105,      amount: null },
  { id: 9,  actor: 'Tavo',  avatar: 'TH', type: 'note_added',         subject: 'EST-0038 — Priya Nair',      time: 60 * 130,      amount: null },
  { id: 10, actor: 'Duke',  avatar: 'DD', type: 'job_completed',      subject: 'Layla Dixon',                 time: 60 * 60 * 3,   amount: 7800 },
  { id: 11, actor: 'Tim',   avatar: 'TS', type: 'estimate_approved',  subject: 'EST-0037 — Kyle Huang',      time: 60 * 60 * 5,   amount: 6300 },
  { id: 12, actor: 'Bonnie',avatar: 'BS', type: 'lead_added',         subject: 'Marco Lima — 2023 Audi RS6', time: 60 * 60 * 7,   amount: null },
];

const AVATAR_COLORS = {
  TH: '#2E8BF0',
  DD: '#8B5CF6',
  TS: '#F59E0B',
  BS: '#10B981',
};

function timeAgo(seconds) {
  if (seconds < 60)        return 'just now';
  if (seconds < 3600)      return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400)     return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export default function TeamActivityFeed() {
  const [filter, setFilter] = useState('all');
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(id);
  }, []);

  const filters = ['all', 'estimates', 'jobs', 'leads'];

  const filtered = SEED_EVENTS.filter(e => {
    if (filter === 'estimates') return e.type.startsWith('estimate');
    if (filter === 'jobs')      return e.type === 'job_completed';
    if (filter === 'leads')     return e.type === 'lead_added' || e.type === 'follow_up_sent';
    return true;
  });

  return (
    <div className="-mx-4">
      {/* Filter tabs */}
      <div className="flex gap-1 px-4 pb-3 border-b border-gray-100 dark:border-[#1B2A3E]">
        {filters.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-2.5 h-6 rounded-full text-[10px] font-semibold capitalize transition-colors ${
              filter === f
                ? 'wm-btn-primary'
                : 'bg-gray-100 dark:bg-[#0F1923] text-[#64748B] dark:text-[#7D93AE] hover:bg-gray-200 dark:hover:bg-[#1B2A3E]'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Event list */}
      <div className="max-h-72 overflow-y-auto">
        {filtered.map((event, i) => {
          const actionMeta = ACTION_TYPES[event.type];
          const avatarColor = AVATAR_COLORS[event.avatar] || '#64748B';

          return (
            <div
              key={event.id}
              className={`flex items-start gap-3 px-4 py-2.5 hover:bg-gray-50/60 dark:hover:bg-[#1B2A3E]/40 transition-colors ${
                i === 0 ? '' : 'border-t border-gray-50 dark:border-[#1B2A3E]'
              }`}
            >
              {/* Avatar */}
              <div className="relative flex-shrink-0 mt-0.5">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                  style={{ backgroundColor: avatarColor }}
                >
                  {event.avatar}
                </div>
                {/* Action type icon */}
                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-white dark:bg-[#1B2A3E] flex items-center justify-center text-[8px] leading-none">
                  {typeof actionMeta.icon === 'string' && actionMeta.icon.length > 2
                    ? <WMIcon name={actionMeta.icon} className="w-3.5 h-3.5" />
                    : actionMeta.icon}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-[11px] leading-snug text-[#0F1923] dark:text-[#F8FAFE]">
                  <span className="font-semibold">{event.actor}</span>
                  {' '}
                  <span className="text-[#64748B] dark:text-[#7D93AE]">{actionMeta.label}</span>
                  {' '}
                  <span className="font-medium truncate">{event.subject}</span>
                  {event.amount && (
                    <span className="font-bold font-mono text-emerald-600 dark:text-emerald-400 ml-1">
                      ${event.amount.toLocaleString()}
                    </span>
                  )}
                </p>
              </div>

              {/* Time */}
              <span className="text-[9px] text-[#64748B] dark:text-[#7D93AE] flex-shrink-0 mt-0.5">
                {timeAgo(event.time)}
              </span>
            </div>
          );
        })}
      </div>

      {/* Live indicator */}
      <div className="flex items-center gap-1.5 px-4 pt-2 border-t border-gray-100 dark:border-[#243348]">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-[10px] text-[#64748B] dark:text-[#7D93AE]">Live · updates every 30s</span>
        <span className="ml-auto text-[10px] text-[#64748B] dark:text-[#7D93AE]">
          {filtered.length} events
        </span>
      </div>
    </div>
  );
}
