import { useMemo, useState, type ReactNode } from "react";
import {
  CalendarDays,
  Check,
  Flag,
  Grid2X2,
  ListTodo,
  Plus,
  Repeat,
  Sparkles,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import { useDaily } from "../../app/AppProvider";
import { getLocalDateKey } from "../../domain/date";
import { getHabitLogForDate } from "../../domain/habitStats";
import { getRecurrenceLabel, isScheduledOnDate, recurrenceOptions } from "../../domain/schedule";
import type { Goal, Habit, ISODateString, RecurrenceFrequency, Task } from "../../types";

type CreateType = "todo" | "habit" | "goal";

interface CreateFormState {
  title: string;
  memo: string;
  startDate: ISODateString;
  endDate: ISODateString;
  repeat: RecurrenceFrequency;
}

const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function dateFromKey(dateKey: ISODateString) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function addDaysToKey(dateKey: ISODateString, days: number) {
  const date = dateFromKey(dateKey);
  date.setDate(date.getDate() + days);
  return getLocalDateKey(date);
}

function getWeekDaysContaining(dateKey: ISODateString) {
  const date = dateFromKey(dateKey);
  const firstDay = new Date(date);
  firstDay.setDate(date.getDate() - date.getDay());
  const firstDayKey = getLocalDateKey(firstDay);

  return Array.from({ length: 7 }, (_, index) => addDaysToKey(firstDayKey, index));
}

function getThirtyDays(todayKey: ISODateString) {
  return Array.from({ length: 30 }, (_, index) => addDaysToKey(todayKey, index));
}

function formatMonthTitle(dateKey: ISODateString) {
  return new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(dateFromKey(dateKey));
}

function formatShortDate(dateKey: ISODateString | null) {
  if (!dateKey) {
    return "No date";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(dateFromKey(dateKey));
}

function formatSelectedDate(dateKey: ISODateString) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(dateFromKey(dateKey));
}

function emptyForm(selectedDate: ISODateString): CreateFormState {
  return {
    title: "",
    memo: "",
    startDate: selectedDate,
    endDate: "",
    repeat: "none",
  };
}

function isTaskOnDate(task: Task, date: ISODateString) {
  const startDate = task.startDate ?? task.dueDate;
  const endDate = task.endDate ?? task.dueDate;

  return isScheduledOnDate({
    startDate,
    endDate,
    repeat: task.repeat ?? "none",
    date,
  });
}

function isGoalOnDate(goal: Goal, date: ISODateString) {
  return isScheduledOnDate({
    startDate: goal.startDate,
    endDate: goal.endDate,
    repeat: goal.repeat,
    date,
  });
}

function isHabitOnDate(habit: Habit, date: ISODateString) {
  return isScheduledOnDate({
    startDate: habit.startDate ?? habit.createdAt.slice(0, 10),
    endDate: habit.endDate,
    repeat: habit.repeat ?? "daily",
    date,
  });
}

function itemCountForDate(date: ISODateString, tasks: Task[], habits: Habit[], goals: Goal[]) {
  return (
    tasks.filter((task) => isTaskOnDate(task, date)).length +
    habits.filter((habit) => isHabitOnDate(habit, date)).length +
    goals.filter((goal) => isGoalOnDate(goal, date)).length
  );
}

function WeekStrip({
  days,
  todayKey,
  selectedDate,
  onSelectDate,
}: {
  days: ISODateString[];
  todayKey: ISODateString;
  selectedDate: ISODateString;
  onSelectDate: (date: ISODateString) => void;
}) {
  return (
    <div className="grid grid-cols-7 gap-1 border-b border-white/10 pb-4">
      {days.map((dateKey) => {
        const date = dateFromKey(dateKey);
        const selected = dateKey === selectedDate;
        const today = dateKey === todayKey;

        return (
          <button
            key={dateKey}
            type="button"
            onClick={() => onSelectDate(dateKey)}
            className="flex min-h-[58px] flex-col items-center justify-center gap-1 rounded-2xl text-center transition"
            aria-label={`Open ${dateKey}`}
          >
            <span className="text-[11px] font-semibold text-daily-muted">{weekdayLabels[date.getDay()]}</span>
            <span
              className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold ${
                selected
                  ? "bg-daily-mint text-daily-bg shadow-[0_0_24px_rgba(53,243,199,0.28)]"
                  : today
                    ? "border border-daily-mint/50 text-daily-mint"
                    : "text-white"
              }`}
            >
              {date.getDate()}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function ThirtyDayCalendar({
  days,
  selectedDate,
  todayKey,
  tasks,
  habits,
  goals,
  onSelectDate,
}: {
  days: ISODateString[];
  selectedDate: ISODateString;
  todayKey: ISODateString;
  tasks: Task[];
  habits: Habit[];
  goals: Goal[];
  onSelectDate: (date: ISODateString) => void;
}) {
  return (
    <section className="rounded-[30px] border border-white/10 bg-white/[0.05] p-4 shadow-soft">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-sm text-daily-muted">30-day calendar</p>
          <h2 className="text-xl font-semibold">{formatMonthTitle(selectedDate)}</h2>
        </div>
        <CalendarDays className="h-5 w-5 text-daily-mint" />
      </div>

      <div className="grid grid-cols-7 gap-2">
        {days.map((dateKey) => {
          const date = dateFromKey(dateKey);
          const selected = dateKey === selectedDate;
          const count = itemCountForDate(dateKey, tasks, habits, goals);

          return (
            <button
              key={dateKey}
              type="button"
              onClick={() => onSelectDate(dateKey)}
              className={`relative flex aspect-square min-h-10 items-center justify-center rounded-2xl text-sm font-semibold transition ${
                selected
                  ? "bg-daily-mint text-daily-bg"
                  : dateKey === todayKey
                    ? "border border-daily-mint/40 bg-daily-mint/10 text-daily-mint"
                    : "bg-white/[0.07] text-white"
              }`}
              aria-label={`Open ${dateKey}`}
            >
              {date.getDate()}
              {count > 0 && (
                <span
                  className={`absolute bottom-1.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full ${
                    selected ? "bg-daily-bg" : "bg-daily-cyan"
                  }`}
                />
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}

function CreatePanel({
  type,
  selectedDate,
  onClose,
}: {
  type: CreateType;
  selectedDate: ISODateString;
  onClose: () => void;
}) {
  const { activeHabits, actions } = useDaily();
  const [form, setForm] = useState<CreateFormState>(() => emptyForm(selectedDate));
  const typeLabel = type === "todo" ? "Todo" : type === "habit" ? "Habit" : "Goal";

  const submit = () => {
    const title = form.title.trim();

    if (!title) {
      return;
    }

    if (type === "todo") {
      actions.addTask({
        title,
        quadrant: "schedule",
        startDate: form.startDate,
        endDate: form.endDate || null,
        repeat: form.repeat,
        dueDate: form.endDate || form.startDate,
        memo: form.memo.trim(),
      });
    }

    if (type === "habit") {
      actions.addHabit({
        name: title,
        icon: "Sparkles",
        color: "#35f3c7",
        goal: form.memo.trim() || "Keep the rhythm.",
        startDate: form.startDate,
        endDate: form.endDate || null,
        repeat: form.repeat === "none" ? "daily" : form.repeat,
        reminderTime: null,
        priorityQuadrant: "schedule",
        detailMemo: form.memo.trim(),
      });
    }

    if (type === "goal") {
      actions.addGoal({
        title,
        color: activeHabits[0]?.color ?? "#35f3c7",
        startDate: form.startDate,
        endDate: form.endDate || null,
        repeat: form.repeat,
        memo: form.memo.trim(),
      });
    }

    onClose();
  };

  return (
    <section className="rounded-[30px] border border-daily-mint/20 bg-white/[0.07] p-4 shadow-soft">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Create {typeLabel}</h2>
        <button type="button" onClick={onClose} className="text-sm text-daily-muted">
          Close
        </button>
      </div>

      <div className="space-y-3">
        <input
          value={form.title}
          onChange={(event) => setForm({ ...form, title: event.target.value })}
          placeholder={`${typeLabel} title`}
          className="min-h-12 w-full rounded-2xl border border-white/10 bg-black/20 px-4 text-sm outline-none placeholder:text-daily-muted focus:border-daily-mint/60"
        />

        <div className="grid grid-cols-2 gap-2">
          <label className="text-xs text-daily-muted">
            Start
            <input
              type="date"
              value={form.startDate}
              onChange={(event) => setForm({ ...form, startDate: event.target.value })}
              className="mt-1 min-h-12 w-full rounded-2xl border border-white/10 bg-black/20 px-3 text-sm text-daily-ink outline-none"
            />
          </label>
          <label className="text-xs text-daily-muted">
            End
            <input
              type="date"
              value={form.endDate}
              onChange={(event) => setForm({ ...form, endDate: event.target.value })}
              className="mt-1 min-h-12 w-full rounded-2xl border border-white/10 bg-black/20 px-3 text-sm text-daily-ink outline-none"
            />
          </label>
        </div>

        <label className="text-xs text-daily-muted">
          Repeat
          <select
            value={form.repeat}
            onChange={(event) => setForm({ ...form, repeat: event.target.value as RecurrenceFrequency })}
            className="mt-1 min-h-12 w-full rounded-2xl border border-white/10 bg-black/20 px-3 text-sm text-daily-ink outline-none"
          >
            {recurrenceOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <textarea
          value={form.memo}
          onChange={(event) => setForm({ ...form, memo: event.target.value })}
          placeholder={type === "habit" ? "Goal or detail memo" : "Memo"}
          className="min-h-20 w-full resize-none rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm leading-6 outline-none placeholder:text-daily-muted focus:border-daily-mint/60"
        />

        <button
          type="button"
          onClick={submit}
          className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-daily-mint text-sm font-semibold text-daily-bg"
        >
          <Plus className="h-4 w-4" />
          Save {typeLabel}
        </button>
      </div>
    </section>
  );
}

function EmptyLine({ text }: { text: string }) {
  return <p className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-daily-muted">{text}</p>;
}

function AgendaItem({
  icon,
  title,
  meta,
  done,
  color,
  onToggle,
  onDelete,
}: {
  icon: ReactNode;
  title: string;
  meta: string;
  done: boolean;
  color?: string;
  onToggle?: () => void;
  onDelete?: () => void;
}) {
  return (
    <article className="flex items-center gap-3 rounded-[24px] border border-white/10 bg-white/[0.065] p-4 shadow-soft">
      <button
        type="button"
        onClick={onToggle}
        disabled={!onToggle}
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition ${
          done ? "border-daily-mint bg-daily-mint text-daily-bg" : "border-white/45 text-transparent"
        }`}
        aria-label={`Toggle ${title}`}
      >
        <Check className="h-4 w-4" strokeWidth={3} />
      </button>

      <div className="min-w-0 flex-1">
        <p className={`truncate font-semibold ${done ? "text-white/45 line-through" : ""}`}>{title}</p>
        <p className="mt-1 flex items-center gap-1 truncate text-xs text-daily-muted">
          <span style={color ? { color } : undefined}>{icon}</span>
          {meta}
        </p>
      </div>

      {onDelete && (
        <button
          type="button"
          onClick={onDelete}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-500/10 text-red-200"
          aria-label={`Delete ${title}`}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )}
    </article>
  );
}

function SectionList({
  title,
  Icon,
  count,
  children,
}: {
  title: string;
  Icon: LucideIcon;
  count: number;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <Icon className="h-5 w-5 text-daily-mint" />
          {title}
        </h2>
        <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-semibold text-daily-muted">{count}</span>
      </div>
      {children}
    </section>
  );
}

function FloatingCalendarActions({
  menuOpen,
  onToggleMenu,
  onCreate,
}: {
  menuOpen: boolean;
  onToggleMenu: () => void;
  onCreate: (type: CreateType) => void;
}) {
  const createItems: Array<{ type: CreateType; label: string; Icon: LucideIcon }> = [
    { type: "todo", label: "Todo", Icon: ListTodo },
    { type: "habit", label: "Habit", Icon: Sparkles },
    { type: "goal", label: "Goal", Icon: Flag },
  ];

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+88px)] z-30">
      <div className="mx-auto flex max-w-md justify-end px-5">
        <div className="relative flex items-end gap-2">
          {menuOpen && (
            <div className="pointer-events-auto absolute bottom-14 right-0 w-36 overflow-hidden rounded-3xl border border-white/10 bg-daily-bg/95 p-2 shadow-soft backdrop-blur-xl">
              {createItems.map(({ type, label, Icon }) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => onCreate(type)}
                  className="flex min-h-11 w-full items-center gap-3 rounded-2xl px-3 text-left text-sm font-semibold text-daily-ink hover:bg-white/[0.08]"
                >
                  <Icon className="h-4 w-4 text-daily-mint" />
                  {label}
                </button>
              ))}
            </div>
          )}

          <a
            href="#/matrix"
            className="pointer-events-auto flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/[0.09] text-daily-mint shadow-soft backdrop-blur-xl"
            aria-label="Open matrix view"
          >
            <Grid2X2 className="h-5 w-5" />
          </a>

          <button
            type="button"
            onClick={onToggleMenu}
            className="pointer-events-auto flex h-12 w-12 items-center justify-center rounded-full bg-daily-mint text-daily-bg shadow-[0_12px_32px_rgba(53,243,199,0.28)]"
            aria-label="Create item"
            aria-expanded={menuOpen}
          >
            <Plus className={`h-5 w-5 transition ${menuOpen ? "rotate-45" : ""}`} strokeWidth={2.8} />
          </button>
        </div>
      </div>
    </div>
  );
}

export function LifeCalendarScreen() {
  const { activeHabits, data, actions } = useDaily();
  const todayKey = getLocalDateKey();
  const [selectedDate, setSelectedDate] = useState<ISODateString>(todayKey);
  const [showThirtyDays, setShowThirtyDays] = useState(false);
  const [createType, setCreateType] = useState<CreateType | null>(null);
  const [createMenuOpen, setCreateMenuOpen] = useState(false);

  const weekDays = useMemo(() => getWeekDaysContaining(todayKey), [todayKey]);
  const thirtyDays = useMemo(() => getThirtyDays(todayKey), [todayKey]);

  const todos = useMemo(
    () => data.tasks.filter((task) => isTaskOnDate(task, selectedDate)),
    [data.tasks, selectedDate],
  );
  const habits = useMemo(
    () => activeHabits.filter((habit) => isHabitOnDate(habit, selectedDate)),
    [activeHabits, selectedDate],
  );
  const goals = useMemo(
    () => data.goals.filter((goal) => isGoalOnDate(goal, selectedDate)),
    [data.goals, selectedDate],
  );

  return (
    <section className="space-y-5">
      <header className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-normal">{formatMonthTitle(selectedDate)}</h1>
            <p className="mt-1 text-sm text-daily-muted">{formatSelectedDate(selectedDate)}</p>
          </div>

          <button
            type="button"
            onClick={() => setShowThirtyDays((value) => !value)}
            className="flex min-h-10 items-center gap-2 rounded-full border border-white/10 bg-white/[0.07] px-3 text-sm font-semibold text-daily-mint"
          >
            <CalendarDays className="h-4 w-4" />
            {showThirtyDays ? "7 Days" : "30 Days"}
          </button>
        </div>

        <WeekStrip days={weekDays} todayKey={todayKey} selectedDate={selectedDate} onSelectDate={setSelectedDate} />
      </header>

      {selectedDate <= todayKey && (
        <a href={`#/reflection?date=${selectedDate}`}
          className="block rounded-2xl border border-daily-mint/30 bg-daily-mint/10 px-4 py-3 text-sm font-semibold">
          선택한 날의 성찰 열기
        </a>
      )}

      <SectionList title="Todo Items" Icon={ListTodo} count={todos.length}>
        {todos.length === 0 ? (
          <EmptyLine text="No todo items on this day." />
        ) : (
          todos.map((task) => (
            <AgendaItem
              key={task.id}
              icon={<ListTodo className="h-4 w-4" />}
              title={task.title}
              meta={`${getRecurrenceLabel(task.repeat)} · ${formatShortDate(task.dueDate ?? task.startDate)}`}
              done={task.done}
              onToggle={() => actions.updateTask(task.id, { done: !task.done })}
              onDelete={() => actions.deleteTask(task.id)}
            />
          ))
        )}
      </SectionList>

      <SectionList title="Habits" Icon={Sparkles} count={habits.length}>
        {habits.length === 0 ? (
          <EmptyLine text="No habits scheduled on this day." />
        ) : (
          habits.map((habit) => {
            const log = getHabitLogForDate(habit.id, data.habitLogs, selectedDate);

            return (
              <AgendaItem
                key={habit.id}
                icon={<Sparkles className="h-4 w-4" />}
                title={habit.name}
                meta={`${getRecurrenceLabel(habit.repeat)} · ${habit.reminderTime ?? "No reminder"}`}
                done={Boolean(log?.done)}
                color={habit.color}
                onToggle={() =>
                  actions.upsertHabitLog({
                    habitId: habit.id,
                    date: selectedDate,
                    done: !log?.done,
                    memo: log?.memo ?? "",
                    mood: log?.mood ?? null,
                  })
                }
              />
            );
          })
        )}
      </SectionList>

      <SectionList title="Goals" Icon={Flag} count={goals.length}>
        {goals.length === 0 ? (
          <EmptyLine text="No goals on this day." />
        ) : (
          goals.map((goal) => (
            <AgendaItem
              key={goal.id}
              icon={<Flag className="h-4 w-4" />}
              title={goal.title}
              meta={`${getRecurrenceLabel(goal.repeat)} · ${formatShortDate(goal.startDate)}`}
              done={goal.done}
              color={goal.color}
              onToggle={() => actions.updateGoal(goal.id, { done: !goal.done })}
              onDelete={() => actions.deleteGoal(goal.id)}
            />
          ))
        )}
      </SectionList>

      {createType && (
        <CreatePanel type={createType} selectedDate={selectedDate} onClose={() => setCreateType(null)} />
      )}

      {showThirtyDays && (
        <ThirtyDayCalendar
          days={thirtyDays}
          selectedDate={selectedDate}
          todayKey={todayKey}
          tasks={data.tasks}
          habits={activeHabits}
          goals={data.goals}
          onSelectDate={setSelectedDate}
        />
      )}

      <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-4 text-sm leading-6 text-daily-muted">
        <Repeat className="mb-3 h-5 w-5 text-daily-cyan" />
        Apple Calendar and Reminders sync will stay in the future native SwiftUI/EventKit version. This PWA keeps the
        local data shape ready for that move.
      </div>

      <FloatingCalendarActions
        menuOpen={createMenuOpen}
        onToggleMenu={() => setCreateMenuOpen((value) => !value)}
        onCreate={(type) => {
          setCreateType(type);
          setCreateMenuOpen(false);
        }}
      />
    </section>
  );
}
