import { useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCenter,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import {
  Check,
  GripVertical,
  Plus,
  Sparkles,
  Trash2,
  X,
  type LucideIcon,
} from "lucide-react";
import { useDaily } from "../../app/AppProvider";
import { getLocalDateKey } from "../../domain/date";
import type { Habit, PriorityQuadrant, Task } from "../../types";

type MatrixItemType = "habit" | "task";

interface MatrixItem {
  id: string;
  type: MatrixItemType;
  title: string;
  subtitle: string;
  quadrant: PriorityQuadrant;
  done?: boolean;
  color?: string;
  updatedAt?: string;
}

const quadrants: Array<{
  id: PriorityQuadrant;
  title: string;
  description: string;
  tone: string;
  border: string;
}> = [
  {
    id: "do_first",
    title: "Do",
    description: "Important + urgent",
    tone: "text-daily-mint",
    border: "border-daily-mint/30",
  },
  {
    id: "schedule",
    title: "Schedule",
    description: "Important, not urgent",
    tone: "text-daily-cyan",
    border: "border-daily-cyan/30",
  },
  {
    id: "delegate",
    title: "Delegate",
    description: "Urgent, less important",
    tone: "text-amber-200",
    border: "border-amber-200/30",
  },
  {
    id: "eliminate",
    title: "Delete",
    description: "Not important or urgent",
    tone: "text-rose-200",
    border: "border-rose-200/30",
  },
];

function itemId(type: MatrixItemType, id: string) {
  return `${type}:${id}`;
}

function taskWasCompletedToday(task: Task, today: string) {
  return task.done && getLocalDateKey(new Date(task.updatedAt)) === today;
}

function shouldShowTask(task: Task, today: string) {
  return !task.done || taskWasCompletedToday(task, today);
}

function sortMatrixItems(items: MatrixItem[]) {
  return [...items].sort((a, b) => {
    if (Boolean(a.done) !== Boolean(b.done)) {
      return a.done ? 1 : -1;
    }

    if (a.type !== b.type) {
      return a.type === "habit" ? -1 : 1;
    }

    return a.title.localeCompare(b.title);
  });
}

function toMatrixItems(habits: Habit[], tasks: Task[], today: string): MatrixItem[] {
  return [
    ...habits.map((habit) => ({
      id: habit.id,
      type: "habit" as const,
      title: habit.name,
      subtitle: habit.goal,
      quadrant: habit.priorityQuadrant,
      color: habit.color,
    })),
    ...tasks.filter((task) => shouldShowTask(task, today)).map((task) => ({
      id: task.id,
      type: "task" as const,
      title: task.title,
      subtitle: task.memo || "Task",
      quadrant: task.quadrant,
      done: task.done,
      updatedAt: task.updatedAt,
    })),
  ];
}

function MatrixItemContent({
  item,
  listeners,
  attributes,
  onDeleteTask,
}: {
  item: MatrixItem;
  listeners?: ReturnType<typeof useDraggable>["listeners"];
  attributes?: ReturnType<typeof useDraggable>["attributes"];
  onDeleteTask?: (taskId: string) => void;
}) {
  return (
    <>
      <button
        type="button"
        onClick={(event) => event.stopPropagation()}
        className="flex h-5 w-4 shrink-0 touch-none items-center justify-center rounded-md bg-white/5 text-daily-muted"
        aria-label={`Drag ${item.title}`}
        {...listeners}
        {...attributes}
      >
        <GripVertical className="h-2.5 w-2.5" />
      </button>

      {item.type === "habit" && (
        <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
      )}

      <p className={`min-w-0 flex-1 truncate text-[11px] font-semibold ${item.done ? "text-white/45 line-through" : ""}`}>
        {item.title}
      </p>

      {item.type === "task" && onDeleteTask && (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onDeleteTask(item.id);
          }}
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-white/25 transition hover:bg-red-500/10 hover:text-red-200"
          aria-label={`Delete ${item.title}`}
        >
          <Trash2 className="h-3 w-3" />
        </button>
      )}
    </>
  );
}

function MatrixDragPreview({ item }: { item: MatrixItem }) {
  return (
    <div
      className={`flex min-h-8 items-center gap-1.5 rounded-xl border border-daily-mint/60 bg-daily-bg/95 px-2 py-1.5 text-left shadow-[0_16px_42px_rgba(0,0,0,0.42)] backdrop-blur-xl ${
        item.done ? "opacity-70" : ""
      }`}
    >
      <MatrixItemContent item={item} />
    </div>
  );
}

function MatrixCard({
  item,
  onToggleTask,
  onDeleteTask,
}: {
  item: MatrixItem;
  onToggleTask: (taskId: string, done: boolean) => void;
  onDeleteTask: (taskId: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: itemId(item.type, item.id),
    data: {
      itemType: item.type,
      itemId: item.id,
      quadrant: item.quadrant,
    },
  });

  const style = isDragging
    ? undefined
    : {
        transform: CSS.Transform.toString(transform),
      };

  return (
    <article
      ref={setNodeRef}
      style={style}
      onClick={() => {
        if (item.type === "task") {
          onToggleTask(item.id, !item.done);
        }
      }}
      className={`group flex min-h-8 items-center gap-1.5 rounded-xl border border-white/10 bg-black/20 px-2 py-1.5 text-left shadow-sm transition ${
        item.type === "task" ? "cursor-pointer active:scale-[0.99]" : ""
      } ${item.done ? "bg-white/[0.035] opacity-60" : ""} ${
        isDragging ? "border-daily-mint/40 opacity-25" : ""
      }`}
    >
      <MatrixItemContent
        item={item}
        listeners={listeners}
        attributes={attributes}
        onDeleteTask={item.type === "task" ? onDeleteTask : undefined}
      />
    </article>
  );
}

function QuadrantCell({
  quadrant,
  items,
  onToggleTask,
  onDeleteTask,
}: {
  quadrant: (typeof quadrants)[number];
  items: MatrixItem[];
  onToggleTask: (taskId: string, done: boolean) => void;
  onDeleteTask: (taskId: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: quadrant.id });

  return (
    <section
      ref={setNodeRef}
      className={`min-h-[230px] rounded-[24px] border ${quadrant.border} bg-white/[0.055] p-2.5 transition ${
        isOver ? "bg-daily-mint/10 ring-2 ring-daily-mint/50" : ""
      }`}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className={`truncate text-lg font-semibold ${quadrant.tone}`}>{quadrant.title}</h2>
          <p className="mt-0.5 line-clamp-1 text-[10px] text-daily-muted">{quadrant.description}</p>
        </div>
        <span className="rounded-full bg-black/25 px-2 py-1 text-xs text-daily-muted">{items.length}</span>
      </div>

      <div className="max-h-[168px] space-y-1.5 overflow-y-auto pr-0.5">
        {items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/10 bg-black/10 p-2 text-[10px] leading-4 text-daily-muted">
            Drop here
          </div>
        ) : (
          sortMatrixItems(items).map((item) => (
            <MatrixCard
              key={itemId(item.type, item.id)}
              item={item}
              onToggleTask={onToggleTask}
              onDeleteTask={onDeleteTask}
            />
          ))
        )}
      </div>
    </section>
  );
}

function AddTaskPanel({ onClose }: { onClose: () => void }) {
  const { actions } = useDaily();
  const [title, setTitle] = useState("");
  const [quadrant, setQuadrant] = useState<PriorityQuadrant>("do_first");
  const [dueDate, setDueDate] = useState("");
  const [memo, setMemo] = useState("");

  const submit = () => {
    const trimmed = title.trim();

    if (!trimmed) {
      return;
    }

    actions.addTask({
      title: trimmed,
      quadrant,
      dueDate: dueDate || null,
      memo: memo.trim(),
    });
    onClose();
  };

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
      className="space-y-3 rounded-[32px] border border-daily-mint/20 bg-daily-bg/95 p-4 shadow-soft backdrop-blur-xl"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Add Task</h2>
        <button
          type="button"
          onClick={onClose}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.08] text-daily-muted"
          aria-label="Close task form"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <input
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="Task title"
        className="min-h-12 w-full rounded-2xl border border-white/10 bg-black/20 px-4 text-sm outline-none placeholder:text-daily-muted focus:border-daily-mint/60"
      />

      <div className="grid grid-cols-2 gap-2">
        <select
          value={quadrant}
          onChange={(event) => setQuadrant(event.target.value as PriorityQuadrant)}
          className="min-h-12 rounded-2xl border border-white/10 bg-black/20 px-3 text-sm outline-none"
          aria-label="Quadrant"
        >
          {quadrants.map((item) => (
            <option key={item.id} value={item.id}>
              {item.title}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={dueDate}
          onChange={(event) => setDueDate(event.target.value)}
          className="min-h-12 rounded-2xl border border-white/10 bg-black/20 px-3 text-sm outline-none"
          aria-label="Due date"
        />
      </div>

      <textarea
        value={memo}
        onChange={(event) => setMemo(event.target.value)}
        placeholder="Memo"
        className="min-h-20 w-full resize-none rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm leading-6 outline-none placeholder:text-daily-muted focus:border-daily-mint/60"
      />

      <button
        type="submit"
        className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-daily-mint text-sm font-semibold text-daily-bg"
      >
        <Plus className="h-4 w-4" />
        Save Task
      </button>
    </form>
  );
}

function FloatingAddButton({ open, onClick }: { open: boolean; onClick: () => void }) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+88px)] z-50">
      <div className="mx-auto flex max-w-md justify-end px-5">
        <button
          type="button"
          onClick={onClick}
          className="pointer-events-auto flex h-12 w-12 items-center justify-center rounded-full bg-daily-mint text-daily-bg shadow-[0_12px_32px_rgba(53,243,199,0.28)]"
          aria-label={open ? "Close task form" : "Add task"}
          aria-expanded={open}
        >
          <Plus className={`h-5 w-5 transition ${open ? "rotate-45" : ""}`} strokeWidth={2.8} />
        </button>
      </div>
    </div>
  );
}

export function MatrixScreen() {
  const { activeHabits, data, actions } = useDaily();
  const [addOpen, setAddOpen] = useState(false);
  const [activeDragItem, setActiveDragItem] = useState<MatrixItem | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));
  const today = getLocalDateKey();
  const visibleTasks = useMemo(
    () => data.tasks.filter((task) => shouldShowTask(task, today)),
    [data.tasks, today],
  );
  const items = useMemo(() => toMatrixItems(activeHabits, data.tasks, today), [activeHabits, data.tasks, today]);

  const moveItem = (item: MatrixItem, target: PriorityQuadrant) => {
    if (item.quadrant === target) {
      return;
    }

    if (item.type === "habit") {
      actions.updateHabit(item.id, { priorityQuadrant: target });
      return;
    }

    actions.updateTask(item.id, { quadrant: target });
  };

  const handleDragStart = (event: DragStartEvent) => {
    const current = event.active.data.current as
      | { itemType?: MatrixItemType; itemId?: string; quadrant?: PriorityQuadrant }
      | undefined;

    if (!current?.itemType || !current.itemId) {
      setActiveDragItem(null);
      return;
    }

    setActiveDragItem(items.find((item) => item.type === current.itemType && item.id === current.itemId) ?? null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const overId = event.over?.id as PriorityQuadrant | undefined;
    const current = event.active.data.current as
      | { itemType?: MatrixItemType; itemId?: string; quadrant?: PriorityQuadrant }
      | undefined;

    setActiveDragItem(null);

    if (!overId || !current?.itemType || !current.itemId) {
      return;
    }

    const dragged = items.find((item) => item.type === current.itemType && item.id === current.itemId);
    if (!dragged) {
      return;
    }

    moveItem(dragged, overId);
  };

  const counts = {
    habits: activeHabits.length,
    tasks: visibleTasks.length,
    doneTasks: visibleTasks.filter((task) => task.done).length,
  };

  return (
    <section className="space-y-5">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveDragItem(null)}
      >
        <div className="grid grid-cols-2 gap-2">
          {quadrants.map((quadrant) => (
            <QuadrantCell
              key={quadrant.id}
              quadrant={quadrant}
              items={items.filter((item) => item.quadrant === quadrant.id)}
              onToggleTask={(taskId, done) => actions.updateTask(taskId, { done })}
              onDeleteTask={(taskId) => actions.deleteTask(taskId)}
            />
          ))}
        </div>
        <DragOverlay zIndex={1000}>
          {activeDragItem ? <MatrixDragPreview item={activeDragItem} /> : null}
        </DragOverlay>
      </DndContext>

      <div className="grid grid-cols-3 gap-2">
        <SummaryTile label="Habits" value={counts.habits} Icon={Sparkles} />
        <SummaryTile label="Tasks" value={counts.tasks} Icon={Plus} />
        <SummaryTile label="Done" value={counts.doneTasks} Icon={Check} />
      </div>

      <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-4 text-sm leading-6 text-daily-muted">
        Drag items between Do, Schedule, Delegate, and Delete. Use the floating plus button to add a new task.
      </div>

      {addOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/35 backdrop-blur-sm"
          onClick={() => setAddOpen(false)}
          role="presentation"
        >
          <div
            className="absolute inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+88px)] mx-auto max-w-md px-5"
            onClick={(event) => event.stopPropagation()}
          >
            <AddTaskPanel onClose={() => setAddOpen(false)} />
          </div>
        </div>
      )}

      <FloatingAddButton open={addOpen} onClick={() => setAddOpen((value) => !value)} />
    </section>
  );
}

function SummaryTile({ label, value, Icon }: { label: string; value: number; Icon: LucideIcon }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.055] p-3 shadow-soft">
      <Icon className="mb-3 h-4 w-4 text-daily-mint" />
      <p className="text-2xl font-semibold">{value}</p>
      <p className="mt-1 text-xs text-daily-muted">{label}</p>
    </div>
  );
}
