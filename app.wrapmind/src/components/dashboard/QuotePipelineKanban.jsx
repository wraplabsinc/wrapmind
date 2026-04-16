import { useState } from 'react';
import { useAuditLog } from '../../context/AuditLogContext';
import { useRoles, ROLES } from '../../context/RolesContext';

const COLUMNS = [
  { id: 'draft',    label: 'Draft',       color: '#94A3B8', bg: 'rgba(148,163,184,0.12)' },
  { id: 'sent',     label: 'Sent',        color: '#F59E0B', bg: 'rgba(245,158,11,0.12)'  },
  { id: 'approved', label: 'Approved',    color: '#2E8BF0', bg: 'rgba(46,139,240,0.12)'  },
  { id: 'inprog',   label: 'In Progress', color: '#8B5CF6', bg: 'rgba(139,92,246,0.12)'  },
  { id: 'complete', label: 'Complete',    color: '#22C55E', bg: 'rgba(34,197,94,0.12)'   },
];

const INITIAL_CARDS = [
  { id: 1,  status: 'draft',    customer: 'Marcus Bell',     vehicle: '2023 Tesla Model 3',    amount: 3800,  days: 1  },
  { id: 2,  status: 'draft',    customer: 'Priya Nair',      vehicle: '2022 BMW M4',           amount: 5600,  days: 0  },
  { id: 3,  status: 'sent',     customer: 'Jordan Cole',     vehicle: '2021 Ford Raptor',      amount: 7200,  days: 3  },
  { id: 4,  status: 'sent',     customer: 'Remi Santos',     vehicle: '2024 Porsche 911',      amount: 9400,  days: 5  },
  { id: 5,  status: 'sent',     customer: 'Aisha Owens',     vehicle: '2020 Jeep Wrangler',    amount: 4100,  days: 2  },
  { id: 6,  status: 'approved', customer: 'Kyle Huang',      vehicle: '2023 Chevy Silverado',  amount: 6300,  days: 7  },
  { id: 7,  status: 'approved', customer: 'Tina Marsh',      vehicle: '2022 Range Rover Sport',amount: 11200, days: 4  },
  { id: 8,  status: 'inprog',   customer: 'Devon Walsh',     vehicle: '2021 Lamborghini Urus', amount: 14800, days: 9  },
  { id: 9,  status: 'inprog',   customer: 'Carla Reyes',     vehicle: '2023 Mercedes G-Wagon', amount: 13500, days: 6  },
  { id: 10, status: 'complete', customer: "Finn O'Brien",    vehicle: '2024 Toyota Supra',     amount: 5900,  days: 12 },
  { id: 11, status: 'complete', customer: 'Layla Dixon',     vehicle: '2022 Dodge Challenger', amount: 7800,  days: 11 },
  { id: 12, status: 'complete', customer: 'Marco Lima',      vehicle: '2023 Audi RS6',         amount: 9200,  days: 10 },
];

function KanbanCard({ card, onStatusChange }) {
  const [expanded, setExpanded] = useState(false);
  const initials = card.customer.split(' ').map(n => n[0]).join('').slice(0, 2);
  const dayLabel = card.days === 0 ? 'Today' : card.days === 1 ? '1d ago' : `${card.days}d ago`;
  const currentCol = COLUMNS.find(c => c.id === card.status);

  return (
    <div
      className={`bg-white dark:bg-[#1B2A3E] border border-gray-200 dark:border-[#243348] rounded-lg shadow-sm transition-all duration-150 ${
        expanded ? 'ring-1' : 'hover:shadow-md cursor-pointer'
      }`}
      style={expanded ? { ringColor: currentCol?.color } : {}}
      onClick={() => !expanded && setExpanded(true)}
    >
      {/* Card body */}
      <div className="p-2.5">
        <div className="flex items-center gap-2 mb-1.5">
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: `${currentCol?.color}20` }}
          >
            <span className="text-[9px] font-bold" style={{ color: currentCol?.color }}>{initials}</span>
          </div>
          <span className="text-[11px] font-semibold text-[#0F1923] dark:text-[#F8FAFE] truncate flex-1">{card.customer}</span>
          {expanded && (
            <button
              onClick={e => { e.stopPropagation(); setExpanded(false); }}
              className="w-4 h-4 flex items-center justify-center text-[#64748B] dark:text-[#7D93AE] hover:text-[#0F1923] dark:hover:text-[#F8FAFE] flex-shrink-0"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        <p className="text-[10px] text-[#64748B] dark:text-[#7D93AE] truncate mb-1.5">{card.vehicle}</p>
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold font-mono text-[#0F1923] dark:text-[#F8FAFE]">
            ${card.amount.toLocaleString()}
          </span>
          <span className="text-[9px] text-[#64748B] dark:text-[#7D93AE]">{dayLabel}</span>
        </div>
      </div>

      {/* Expanded: status move panel */}
      {expanded && (
        <div
          className="border-t border-gray-100 dark:border-[#243348] px-2.5 pb-2.5 pt-2"
          onClick={e => e.stopPropagation()}
        >
          <p className="text-[9px] font-semibold uppercase tracking-widest text-[#64748B] dark:text-[#7D93AE] mb-1.5">
            Move to
          </p>
          <div className="flex flex-wrap gap-1">
            {COLUMNS.filter(c => c.id !== card.status).map(col => (
              <button
                key={col.id}
                onClick={() => {
                  onStatusChange(card, col.id);
                  setExpanded(false);
                }}
                className="text-[10px] font-medium px-2 py-0.5 rounded-full border transition-colors hover:opacity-90"
                style={{
                  borderColor: col.color,
                  color: col.color,
                  backgroundColor: col.bg,
                }}
              >
                {col.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function QuotePipelineKanban() {
  const { addLog } = useAuditLog();
  const { currentRole } = useRoles();
  const [hovered, setHovered] = useState(null);
  const [cards, setCards] = useState(INITIAL_CARDS);

  const handleStatusChange = (card, newStatus) => {
    const oldCol = COLUMNS.find(c => c.id === card.status);
    const newCol = COLUMNS.find(c => c.id === newStatus);

    setCards(prev => prev.map(c => c.id === card.id ? { ...c, status: newStatus } : c));

    addLog('ESTIMATE', 'ESTIMATE_STATUS_CHANGED', {
      severity: newStatus === 'complete' ? 'success' : newStatus === 'approved' ? 'success' : 'info',
      actor: { role: currentRole, label: ROLES[currentRole]?.label || currentRole },
      target: `${card.customer} — ${card.vehicle}`,
      details: {
        customer: card.customer,
        vehicle: card.vehicle,
        amount: `$${card.amount.toLocaleString()}`,
        from: oldCol?.label || card.status,
        to: newCol?.label || newStatus,
      },
    });
  };

  return (
    <div className="overflow-x-auto pb-1 -mx-4 px-4">
      <div className="flex gap-3 min-w-max">
        {COLUMNS.map(col => {
          const colCards = cards.filter(c => c.status === col.id);
          const total = colCards.reduce((sum, c) => sum + c.amount, 0);
          const isHovered = hovered === col.id;

          return (
            <div
              key={col.id}
              className="flex flex-col rounded-xl transition-all duration-200"
              style={{ width: 160, backgroundColor: isHovered ? col.bg : 'transparent' }}
              onMouseEnter={() => setHovered(col.id)}
              onMouseLeave={() => setHovered(null)}
            >
              {/* Column header */}
              <div className="flex items-center justify-between px-2 py-2 mb-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: col.color }} />
                  <span className="text-[11px] font-semibold text-[#0F1923] dark:text-[#F8FAFE]">{col.label}</span>
                </div>
                <span
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                  style={{ backgroundColor: col.bg, color: col.color }}
                >
                  {colCards.length}
                </span>
              </div>

              {/* Column total */}
              <div className="px-2 mb-2">
                <span className="text-[10px] text-[#64748B] dark:text-[#7D93AE] font-mono">
                  ${total.toLocaleString()}
                </span>
              </div>

              {/* Progress bar */}
              <div className="px-2 mb-3">
                <div className="h-0.5 bg-gray-100 dark:bg-[#0F1923] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min((colCards.length / 5) * 100, 100)}%`, backgroundColor: col.color }}
                  />
                </div>
              </div>

              {/* Cards */}
              <div className="flex flex-col gap-2 px-1 flex-1">
                {colCards.length === 0 ? (
                  <div className="flex items-center justify-center h-16 border-2 border-dashed border-gray-200 dark:border-[#243348] rounded-lg">
                    <span className="text-[10px] text-gray-400 dark:text-gray-600">Empty</span>
                  </div>
                ) : (
                  colCards.map(card => (
                    <KanbanCard
                      key={card.id}
                      card={card}
                      onStatusChange={handleStatusChange}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary footer */}
      <div className="flex items-center gap-4 mt-4 pt-3 border-t border-gray-100 dark:border-[#243348]">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-[#64748B] dark:text-[#7D93AE]">
          Pipeline Total
        </span>
        <span className="text-sm font-bold font-mono text-[#0F1923] dark:text-[#F8FAFE]">
          ${cards.filter(c => c.status !== 'complete').reduce((s, c) => s + c.amount, 0).toLocaleString()}
        </span>
        <span className="text-[10px] text-[#64748B] dark:text-[#7D93AE]">
          {cards.filter(c => c.status !== 'complete').length} open quotes
        </span>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-[10px] text-[#64748B] dark:text-[#7D93AE]">Closed this month:</span>
          <span className="text-[11px] font-bold font-mono text-emerald-600 dark:text-emerald-400">
            ${cards.filter(c => c.status === 'complete').reduce((s, c) => s + c.amount, 0).toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}
