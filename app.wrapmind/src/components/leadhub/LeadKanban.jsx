import { useState, useMemo } from 'react';
import WMIcon from '../ui/WMIcon';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  pointerWithin,
  rectIntersection,
  useDroppable,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import LeadCard from './LeadCard';
import { LEAD_STATUSES, formatCurrencyShort } from './leadData';

// ─── Sortable wrapper ────────────────────────────────────────────────────────
function SortableLead({ lead, onOpenDetail, onMove, onDelete, onConvert, onAssign, onScheduleFollowUp, apptByLead }) {
  const {
    attributes, listeners, setNodeRef, transform, transition, isDragging,
  } = useSortable({ id: lead.id, data: { status: lead.status, lead } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 999 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <LeadCard
        lead={lead}
        onOpenDetail={onOpenDetail}
        onMove={onMove}
        onDelete={onDelete}
        onConvert={onConvert}
        onAssign={onAssign}
        onScheduleFollowUp={onScheduleFollowUp}
        apptByLead={apptByLead}
      />
    </div>
  );
}

// ─── Droppable Column ────────────────────────────────────────────────────────
function DroppableColumn({ status, leads, children }) {
  const { setNodeRef, isOver } = useDroppable({ id: status.id, data: { status: status.id } });

  const totalValue = leads.reduce((sum, l) => sum + (l.budget || 0), 0);
  const tintBg = isOver ? `${status.color}14` : 'transparent';

  return (
    <div
      className="flex flex-col w-[200px] flex-shrink-0 rounded-lg transition-colors duration-150"
      style={{ backgroundColor: tintBg }}
    >
      {/* Header */}
      <div className="flex items-center gap-1.5 px-2 pt-2 pb-1">
        <WMIcon name={status.emoji} className="w-3 h-3" />
        <span className="text-[11px] font-semibold text-[#0F1923] dark:text-[#F8FAFE] truncate flex-1">
          {status.label}
        </span>
        <span
          className="text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
          style={{ backgroundColor: `${status.color}20`, color: status.color }}
        >
          {leads.length}
        </span>
      </div>
      <div className="px-2 pb-2">
        <span className="text-[10px] font-mono text-[#64748B] dark:text-[#7D93AE]">
          {formatCurrencyShort(totalValue)}
        </span>
      </div>

      {/* Card area */}
      <div
        ref={setNodeRef}
        className={`flex-1 px-1.5 pb-2 min-h-[120px] rounded-md ${
          leads.length === 0 ? 'border border-dashed border-gray-200 dark:border-[#243348] mx-1.5' : ''
        }`}
      >
        <div className="flex flex-col gap-1.5">
          {children}
          {leads.length === 0 && (
            <div className="flex items-center justify-center h-20 text-[10px] text-[#94A3B8] dark:text-[#64748B] italic">
              Drop leads here
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main board ──────────────────────────────────────────────────────────────
export default function LeadKanban({
  leads,
  setLeads,
  onLog,
  onOpenDetail,
  onDelete,
  onConvert,
  onAssign,
  onScheduleFollowUp,
  apptByLead = {},
}) {
  const [activeId, setActiveId] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  const activeLead = activeId ? leads.find(l => l.id === activeId) : null;

  const leadsByStatus = useMemo(() => {
    const map = Object.fromEntries(LEAD_STATUSES.map(s => [s.id, []]));
    for (const lead of leads) {
      if (map[lead.status]) map[lead.status].push(lead);
    }
    return map;
  }, [leads]);

  const findContainer = (id) => {
    if (LEAD_STATUSES.some(s => s.id === id)) return id;
    const lead = leads.find(l => l.id === id);
    return lead?.status;
  };

  const handleDragStart = (event) => setActiveId(event.active.id);

  const handleDragOver = (event) => {
    const { active, over } = event;
    if (!over) return;

    const activeContainer = findContainer(active.id);
    const overContainer = findContainer(over.id);

    if (!activeContainer || !overContainer || activeContainer === overContainer) return;

    setLeads(prev => {
      const a = prev.find(l => l.id === active.id);
      if (!a) return prev;
      return prev.map(l => l.id === active.id ? { ...l, status: overContainer } : l);
    });
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;

    const activeLeadObj = leads.find(l => l.id === active.id);
    if (!activeLeadObj) return;

    const overContainer = findContainer(over.id);
    const activeContainer = activeLeadObj.status;

    if (!overContainer) return;

    // Same column reorder
    if (activeContainer === overContainer && active.id !== over.id) {
      setLeads(prev => {
        const inCol = prev.filter(l => l.status === overContainer);
        const oldIdx = inCol.findIndex(l => l.id === active.id);
        const newIdx = inCol.findIndex(l => l.id === over.id);
        if (oldIdx === -1 || newIdx === -1) return prev;
        const reordered = arrayMove(inCol, oldIdx, newIdx);
        const others = prev.filter(l => l.status !== overContainer);
        return [...others, ...reordered];
      });
      return;
    }

    // Status changed — log it
    if (activeContainer !== overContainer) {
      const fromSt = LEAD_STATUSES.find(s => s.id === activeContainer);
      const toSt = LEAD_STATUSES.find(s => s.id === overContainer);
      onLog?.('LEAD_STATUS_CHANGED', {
        lead: activeLeadObj,
        fromLabel: fromSt?.label || activeContainer,
        toLabel: toSt?.label || overContainer,
      });
    }
  };

  const collisionDetection = (args) => {
    const pointerCollisions = pointerWithin(args);
    if (pointerCollisions.length > 0) return pointerCollisions;
    return rectIntersection(args);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <div className="flex gap-2 p-3 min-w-max h-full">
          {LEAD_STATUSES.map(status => {
            const statusLeads = leadsByStatus[status.id] || [];
            return (
              <DroppableColumn key={status.id} status={status} leads={statusLeads}>
                <SortableContext items={statusLeads.map(l => l.id)} strategy={verticalListSortingStrategy}>
                  {statusLeads.map(lead => (
                    <SortableLead
                      key={lead.id}
                      lead={lead}
                      onOpenDetail={onOpenDetail}
                      onMove={(_l, newStatus) => {
                        setLeads(prev => prev.map(x => x.id === lead.id ? { ...x, status: newStatus } : x));
                        const fromSt = LEAD_STATUSES.find(s => s.id === lead.status);
                        const toSt = LEAD_STATUSES.find(s => s.id === newStatus);
                        onLog?.('LEAD_STATUS_CHANGED', {
                          lead,
                          fromLabel: fromSt?.label || lead.status,
                          toLabel: toSt?.label || newStatus,
                          newStatus,
                        });
                      }}
                      onDelete={onDelete}
                      onConvert={onConvert}
                      onAssign={onAssign}
                      onScheduleFollowUp={onScheduleFollowUp}
                      apptByLead={apptByLead}
                    />
                  ))}
                </SortableContext>
              </DroppableColumn>
            );
          })}
        </div>
      </div>

      <DragOverlay>
        {activeLead ? (
          <LeadCard lead={activeLead} isDragOverlay />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
