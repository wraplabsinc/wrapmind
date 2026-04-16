import { useState, useMemo } from 'react';
import { celebrate } from '../../lib/celebrate';
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

import KanbanCard from './KanbanCard';
import { formatCurrency } from './workflowData';

// ─── Sortable wrapper ────────────────────────────────────────────────────────
function SortableCard({ card, columns, onOpenEstimate, onMove, onArchive, onDelete, onEditTags, onAssign, onSetPriority, apptByEstimate, onScheduleCard }) {
  const {
    attributes, listeners, setNodeRef, transform, transition, isDragging,
  } = useSortable({ id: card.id, data: { columnId: card.columnId, card } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 999 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <KanbanCard
        card={card}
        columns={columns}
        onOpenEstimate={onOpenEstimate}
        onMove={onMove}
        onArchive={onArchive}
        onDelete={onDelete}
        onEditTags={onEditTags}
        onAssign={onAssign}
        onSetPriority={onSetPriority}
        apptByEstimate={apptByEstimate}
        onScheduleCard={onScheduleCard}
      />
    </div>
  );
}

// ─── Droppable Column ────────────────────────────────────────────────────────
function DroppableColumn({ column, cards, children, onAddCard, onColumnMenu }) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id, data: { columnId: column.id } });

  const totalValue = cards.reduce((sum, c) => sum + (c.total || 0), 0);
  const tintBg = isOver
    ? `${column.color}14`
    : 'transparent';

  return (
    <div
      className="flex flex-col w-[220px] flex-shrink-0 rounded-lg transition-colors duration-150"
      style={{ backgroundColor: tintBg }}
    >
      {/* Header */}
      <div className="flex items-center gap-1.5 px-2 pt-2 pb-1.5">
        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: column.color }} />
        <span className="text-[11px] font-semibold text-[#0F1923] dark:text-[#F8FAFE] truncate flex-1">
          {column.label}
        </span>
        <span
          className="text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
          style={{ backgroundColor: `${column.color}20`, color: column.color }}
        >
          {cards.length}
        </span>
      </div>
      <div className="flex items-center justify-between px-2 pb-2">
        <span className="text-[10px] font-mono text-[#64748B] dark:text-[#7D93AE]">
          {formatCurrency(totalValue)}
        </span>
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => onAddCard?.(column.id)}
            title="Add estimate"
            className="w-4 h-4 flex items-center justify-center rounded text-[#64748B] dark:text-[#7D93AE] hover:bg-gray-100 dark:hover:bg-[#243348] hover:text-[#2E8BF0] transition-colors"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </button>
          <button
            onClick={() => onColumnMenu?.(column)}
            title="Column options"
            className="w-4 h-4 flex items-center justify-center rounded text-[#64748B] dark:text-[#7D93AE] hover:bg-gray-100 dark:hover:bg-[#243348] transition-colors"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h.01M12 12h.01M19 12h.01" />
            </svg>
          </button>
        </div>
      </div>

      {/* Cards area */}
      <div
        ref={setNodeRef}
        className={`flex-1 px-1.5 pb-2 min-h-[80px] rounded-md ${
          cards.length === 0 ? 'border border-dashed border-gray-200 dark:border-[#243348] mx-1.5' : ''
        }`}
      >
        <div className="flex flex-col gap-1.5">
          {children}
          {cards.length === 0 && (
            <div className="flex items-center justify-center h-16 text-[10px] text-[#94A3B8] dark:text-[#64748B] italic">
              Drop estimates here
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main board ──────────────────────────────────────────────────────────────
export default function KanbanBoard({
  columns,
  cards,
  setCards,
  onLog,
  onOpenEstimate,
  onAddCard,
  onColumnMenu,
  apptByEstimate,
  onScheduleCard,
}) {
  const [activeId, setActiveId] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  const activeCard = activeId ? cards.find(c => c.id === activeId) : null;

  // Group cards by column, preserving current order
  const cardsByColumn = useMemo(() => {
    const map = Object.fromEntries(columns.map(c => [c.id, []]));
    for (const card of cards) {
      if (map[card.columnId]) map[card.columnId].push(card);
    }
    return map;
  }, [cards, columns]);

  const findContainer = (id) => {
    if (columns.some(c => c.id === id)) return id;
    const card = cards.find(c => c.id === id);
    return card?.columnId;
  };

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragOver = (event) => {
    const { active, over } = event;
    if (!over) return;

    const activeContainer = findContainer(active.id);
    const overContainer = findContainer(over.id);

    if (!activeContainer || !overContainer || activeContainer === overContainer) return;

    setCards(prev => {
      const activeCard = prev.find(c => c.id === active.id);
      if (!activeCard) return prev;
      return prev.map(c => c.id === active.id ? { ...c, columnId: overContainer, daysInColumn: 0 } : c);
    });
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;

    const activeCard = cards.find(c => c.id === active.id);
    if (!activeCard) return;

    const overContainer = findContainer(over.id);
    const activeContainer = activeCard.columnId;

    if (!overContainer) return;

    // Same column reorder
    if (activeContainer === overContainer && active.id !== over.id) {
      setCards(prev => {
        const inColumn = prev.filter(c => c.columnId === overContainer);
        const oldIdx = inColumn.findIndex(c => c.id === active.id);
        const newIdx = inColumn.findIndex(c => c.id === over.id);
        if (oldIdx === -1 || newIdx === -1) return prev;
        const reordered = arrayMove(inColumn, oldIdx, newIdx);
        // Rebuild cards array
        const others = prev.filter(c => c.columnId !== overContainer);
        return [...others, ...reordered];
      });
      return;
    }

    // Column changed – log it
    if (activeContainer !== overContainer) {
      const fromCol = columns.find(c => c.id === activeContainer);
      const toCol = columns.find(c => c.id === overContainer);
      onLog?.('ESTIMATE_STATUS_CHANGED', {
        card: activeCard,
        fromLabel: fromCol?.label || activeContainer,
        toLabel: toCol?.label || overContainer,
      });
      // Celebrate when a card lands in the "Won" column
      const destLabel = (toCol?.label || overContainer).toLowerCase();
      if (destLabel === 'won') {
        celebrate('deal_won', {
          customer: activeCard.customerName,
          amount: activeCard.total,
        });
      }
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
          {columns.map(col => {
            const colCards = cardsByColumn[col.id] || [];
            return (
              <DroppableColumn
                key={col.id}
                column={col}
                cards={colCards}
                onAddCard={onAddCard}
                onColumnMenu={onColumnMenu}
              >
                <SortableContext items={colCards.map(c => c.id)} strategy={verticalListSortingStrategy}>
                  {colCards.map(card => (
                    <SortableCard
                      key={card.id}
                      card={card}
                      columns={columns}
                      onOpenEstimate={onOpenEstimate}
                      apptByEstimate={apptByEstimate}
                      onScheduleCard={onScheduleCard}
                    />
                  ))}
                </SortableContext>
              </DroppableColumn>
            );
          })}
        </div>
      </div>

      <DragOverlay>
        {activeCard ? (
          <KanbanCard card={activeCard} columns={columns} isDragOverlay />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
