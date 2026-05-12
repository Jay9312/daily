import { useMemo, useState } from "react";
import {
  Archive,
  Bell,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Dumbbell,
  Droplets,
  PenLine,
  Plus,
  RotateCcw,
  Save,
  Sparkles,
  Trash2,
  X,
  type LucideIcon,
} from "lucide-react";
import { useDaily } from "../../app/AppProvider";
import type { Habit, NewHabitInput, PriorityQuadrant } from "../../types";

interface HabitFormState {
  name: string;
  icon: string;
  color: string;
  goal: string;
  reminderTime: string;
  priorityQuadrant: PriorityQuadrant;
  detailMemo: string;
}

const colors = ["#35f3c7", "#22d3ee", "#a7f3d0", "#f472b6", "#facc15", "#c084fc"];

const icons: Array<{ id: string; label: string; Icon: LucideIcon }> = [
  { id: "Sparkles", label: "기본", Icon: Sparkles },
  { id: "Droplets", label: "물", Icon: Droplets },
  { id: "BookOpen", label: "독서", Icon: BookOpen },
  { id: "Dumbbell", label: "운동", Icon: Dumbbell },
  { id: "PenLine", label: "기록", Icon: PenLine },
];

const iconMap = icons.reduce<Record<string, LucideIcon>>((map, option) => {
  map[option.id] = option.Icon;
  return map;
}, {});

const quadrantOptions: Array<{ id: PriorityQuadrant; label: string; description: string }> = [
  { id: "do_first", label: "먼저 하기", description: "중요하고 긴급" },
  { id: "schedule", label: "계획하기", description: "중요하지만 여유 있음" },
  { id: "delegate", label: "위임하기", description: "긴급하지만 덜 중요" },
  { id: "eliminate", label: "제거하기", description: "줄이거나 없애기" },
];

const emptyForm: HabitFormState = {
  name: "",
  icon: "Sparkles",
  color: colors[0],
  goal: "",
  reminderTime: "",
  priorityQuadrant: "schedule",
  detailMemo: "",
};

function toFormState(habit: Habit): HabitFormState {
  return {
    name: habit.name,
    icon: habit.icon,
    color: habit.color,
    goal: habit.goal,
    reminderTime: habit.reminderTime ?? "",
    priorityQuadrant: habit.priorityQuadrant,
    detailMemo: habit.detailMemo,
  };
}

function toHabitInput(form: HabitFormState): NewHabitInput {
  return {
    name: form.name.trim(),
    icon: form.icon,
    color: form.color,
    goal: form.goal.trim() || "오늘부터 이어가기",
    reminderTime: form.reminderTime || null,
    priorityQuadrant: form.priorityQuadrant,
    detailMemo: form.detailMemo.trim(),
  };
}

function HabitGlyph({ habit }: { habit: Pick<Habit, "icon" | "color"> }) {
  const Icon = iconMap[habit.icon] ?? Sparkles;

  return (
    <span
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-daily-bg"
      style={{ backgroundColor: habit.color }}
    >
      <Icon className="h-4 w-4" strokeWidth={2.4} />
    </span>
  );
}

function FieldLabel({ children }: { children: string }) {
  return <p className="mb-2 text-xs font-semibold uppercase tracking-normal text-daily-muted">{children}</p>;
}

function HabitForm({
  editingHabit,
  form,
  setForm,
  onCancel,
  onSubmit,
}: {
  editingHabit: Habit | null;
  form: HabitFormState;
  setForm: (form: HabitFormState) => void;
  onCancel: () => void;
  onSubmit: () => void;
}) {
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
      className="max-h-[min(78vh,720px)] space-y-4 overflow-y-auto rounded-[32px] border border-daily-mint/15 bg-daily-bg/95 p-4 shadow-soft backdrop-blur-xl"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{editingHabit ? "Edit Habit" : "Add Habit"}</h2>
        <button
          type="button"
          onClick={onCancel}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.08] text-daily-muted"
          aria-label="Close habit form"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div>
        <FieldLabel>습관 이름</FieldLabel>
        <input
          value={form.name}
          onChange={(event) => setForm({ ...form, name: event.target.value })}
          placeholder="예: 아침 물 한 잔"
          className="min-h-12 w-full rounded-2xl border border-white/10 bg-black/20 px-4 text-sm outline-none placeholder:text-daily-muted focus:border-daily-mint/60"
        />
      </div>

      <div>
        <FieldLabel>아이콘</FieldLabel>
        <div className="grid grid-cols-5 gap-2">
          {icons.map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setForm({ ...form, icon: id })}
              className={`flex min-h-14 flex-col items-center justify-center rounded-2xl border text-[10px] transition ${
                form.icon === id
                  ? "border-daily-mint bg-daily-mint/15 text-daily-mint"
                  : "border-white/10 bg-black/15 text-daily-muted"
              }`}
              aria-label={`${label} 아이콘 선택`}
            >
              <Icon className="mb-1 h-4 w-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <FieldLabel>색상</FieldLabel>
        <div className="flex flex-wrap gap-2">
          {colors.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => setForm({ ...form, color })}
              className={`h-9 w-9 rounded-full border-2 ${
                form.color === color ? "border-white" : "border-transparent"
              }`}
              style={{ backgroundColor: color }}
              aria-label={`${color} 색상 선택`}
            />
          ))}
        </div>
      </div>

      <div>
        <FieldLabel>목표</FieldLabel>
        <input
          value={form.goal}
          onChange={(event) => setForm({ ...form, goal: event.target.value })}
          placeholder="예: 하루 15분 읽기"
          className="min-h-12 w-full rounded-2xl border border-white/10 bg-black/20 px-4 text-sm outline-none placeholder:text-daily-muted focus:border-daily-mint/60"
        />
      </div>

      <div>
        <FieldLabel>알림 시간</FieldLabel>
        <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4">
          <Bell className="h-4 w-4 text-daily-muted" />
          <input
            type="time"
            value={form.reminderTime}
            onChange={(event) => setForm({ ...form, reminderTime: event.target.value })}
            className="min-h-12 flex-1 bg-transparent text-sm outline-none"
          />
        </div>
      </div>

      <div>
        <FieldLabel>우선순위 영역</FieldLabel>
        <div className="grid grid-cols-2 gap-2">
          {quadrantOptions.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setForm({ ...form, priorityQuadrant: option.id })}
              className={`rounded-2xl border p-3 text-left transition ${
                form.priorityQuadrant === option.id
                  ? "border-daily-cyan bg-daily-cyan/15"
                  : "border-white/10 bg-black/15"
              }`}
            >
              <span className="block text-sm font-semibold">{option.label}</span>
              <span className="mt-1 block text-[11px] text-daily-muted">{option.description}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <FieldLabel>상세 메모</FieldLabel>
        <textarea
          value={form.detailMemo}
          onChange={(event) => setForm({ ...form, detailMemo: event.target.value })}
          placeholder="이 습관을 이어가야 하는 이유"
          className="min-h-24 w-full resize-none rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm leading-6 outline-none placeholder:text-daily-muted focus:border-daily-mint/60"
        />
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-daily-mint px-4 text-sm font-semibold text-daily-bg"
        >
          {editingHabit ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {editingHabit ? "수정 저장" : "습관 추가"}
        </button>
        {editingHabit && (
          <button
            type="button"
            onClick={onCancel}
            className="min-h-12 rounded-2xl border border-white/10 bg-white/5 px-4 text-sm font-semibold text-daily-muted"
          >
            취소
          </button>
        )}
      </div>
    </form>
  );
}

function HabitCard({
  habit,
  index,
  total,
  onEdit,
  onArchive,
  onDelete,
  onMove,
}: {
  habit: Habit;
  index: number;
  total: number;
  onEdit: (habit: Habit) => void;
  onArchive: (habit: Habit) => void;
  onDelete: (habit: Habit) => void;
  onMove: (habit: Habit, direction: -1 | 1) => void;
}) {
  return (
    <article className="rounded-[22px] border border-white/10 bg-white/[0.06] p-3 shadow-soft">
      <div className="flex items-start gap-3">
        <HabitGlyph habit={habit} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-sm font-semibold">{habit.name}</h3>
            <span className="rounded-full bg-black/20 px-2 py-0.5 text-[10px] text-daily-muted">
              {index + 1}
            </span>
          </div>
          <p className="mt-1 line-clamp-1 text-xs leading-5 text-daily-muted">{habit.goal}</p>
          <p className="mt-1 text-[11px] text-daily-muted">
            {habit.reminderTime ? `${habit.reminderTime} 알림` : "알림 없음"}
          </p>
          {habit.detailMemo && (
            <p className="mt-2 line-clamp-1 rounded-xl bg-black/20 px-2.5 py-1.5 text-[11px] leading-4 text-white/65">
              {habit.detailMemo}
            </p>
          )}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-6 gap-1.5">
        <button
          type="button"
          onClick={() => onMove(habit, -1)}
          disabled={index === 0}
          className="flex min-h-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-daily-muted disabled:opacity-30"
          aria-label={`${habit.name} 위로 이동`}
        >
          <ChevronUp className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => onMove(habit, 1)}
          disabled={index === total - 1}
          className="flex min-h-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-daily-muted disabled:opacity-30"
          aria-label={`${habit.name} 아래로 이동`}
        >
          <ChevronDown className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => onEdit(habit)}
          className="col-span-2 min-h-9 rounded-xl border border-white/10 bg-white/5 text-xs font-semibold text-daily-ink"
        >
          수정
        </button>
        <button
          type="button"
          onClick={() => onArchive(habit)}
          className="flex min-h-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-daily-muted"
          aria-label={`${habit.name} 아카이브`}
        >
          <Archive className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => onDelete(habit)}
          className="flex min-h-9 items-center justify-center rounded-xl border border-red-400/20 bg-red-500/10 text-red-200"
          aria-label={`${habit.name} 삭제`}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </article>
  );
}

export function HabitsScreen() {
  const { activeHabits, archivedHabits, actions } = useDaily();
  const [form, setForm] = useState<HabitFormState>(emptyForm);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  const orderedActiveHabits = useMemo(
    () => [...activeHabits].sort((a, b) => a.order - b.order),
    [activeHabits],
  );

  const submitForm = () => {
    const input = toHabitInput(form);

    if (!input.name) {
      return;
    }

    if (editingHabit) {
      actions.updateHabit(editingHabit.id, input);
    } else {
      actions.addHabit(input);
    }

    setForm(emptyForm);
    setEditingHabit(null);
    setShowForm(false);
  };

  const editHabit = (habit: Habit) => {
    setEditingHabit(habit);
    setForm(toFormState(habit));
    setShowForm(true);
  };

  const openAddForm = () => {
    setEditingHabit(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const closeForm = () => {
    setEditingHabit(null);
    setForm(emptyForm);
    setShowForm(false);
  };

  const moveHabit = (habit: Habit, direction: -1 | 1) => {
    const currentIndex = orderedActiveHabits.findIndex((item) => item.id === habit.id);
    const target = orderedActiveHabits[currentIndex + direction];

    if (!target) {
      return;
    }

    actions.updateHabit(habit.id, { order: target.order });
    actions.updateHabit(target.id, { order: habit.order });
  };

  const deleteHabit = (habit: Habit) => {
    if (window.confirm(`'${habit.name}' 습관과 관련 기록을 삭제할까요?`)) {
      actions.deleteHabit(habit.id);
      if (editingHabit?.id === habit.id) {
        setEditingHabit(null);
        setForm(emptyForm);
        setShowForm(false);
      }
    }
  };

  return (
    <section className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-[28px] border border-white/10 bg-white/[0.06] p-4">
          <p className="text-4xl font-semibold text-daily-mint">{activeHabits.length}</p>
          <p className="mt-1 text-xs text-daily-muted">활성 습관</p>
        </div>
        <div className="rounded-[28px] border border-white/10 bg-white/[0.06] p-4">
          <p className="text-4xl font-semibold text-daily-cyan">{archivedHabits.length}</p>
          <p className="mt-1 text-xs text-daily-muted">아카이브</p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">습관 목록</h2>
          <p className="text-xs text-daily-muted">위/아래 버튼으로 순서 변경</p>
        </div>

        {orderedActiveHabits.length === 0 ? (
          <div className="rounded-[28px] border border-white/10 bg-white/[0.06] p-5 text-sm leading-6 text-daily-muted">
            활성 습관이 없습니다. 위 폼에서 첫 번째 루틴을 추가하세요.
          </div>
        ) : (
          orderedActiveHabits.map((habit, index) => (
            <HabitCard
              key={habit.id}
              habit={habit}
              index={index}
              total={orderedActiveHabits.length}
              onEdit={editHabit}
              onArchive={(item) => actions.archiveHabit(item.id, true)}
              onDelete={deleteHabit}
              onMove={moveHabit}
            />
          ))
        )}
      </div>

      <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-4">
        <button
          type="button"
          onClick={() => setShowArchived((value) => !value)}
          className="flex w-full items-center justify-between text-left"
        >
          <span>
            <span className="block font-semibold">아카이브된 습관</span>
            <span className="mt-1 block text-xs text-daily-muted">지금은 숨기지만 기록은 보존합니다.</span>
          </span>
          <span className="text-sm text-daily-muted">{showArchived ? "닫기" : "보기"}</span>
        </button>

        {showArchived && (
          <div className="mt-4 space-y-2">
            {archivedHabits.length === 0 ? (
              <p className="text-sm text-daily-muted">아카이브된 습관이 없습니다.</p>
            ) : (
              archivedHabits.map((habit) => (
                <div
                  key={habit.id}
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/15 p-3"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <HabitGlyph habit={habit} />
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-white/70">{habit.name}</p>
                      <p className="text-xs text-daily-muted">{habit.goal}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => actions.archiveHabit(habit.id, false)}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-daily-mint/15 text-daily-mint"
                    aria-label={`${habit.name} 복원`}
                  >
                    <RotateCcw className="h-4 w-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {showForm && (
        <div
          className="fixed inset-0 z-40 bg-black/35 backdrop-blur-sm"
          onClick={closeForm}
          role="presentation"
        >
          <div
            className="absolute inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+88px)] mx-auto max-w-md px-5"
            onClick={(event) => event.stopPropagation()}
          >
            <HabitForm
              editingHabit={editingHabit}
              form={form}
              setForm={setForm}
              onSubmit={submitForm}
              onCancel={closeForm}
            />
          </div>
        </div>
      )}

      <div className="pointer-events-none fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+88px)] z-50">
        <div className="mx-auto flex max-w-md justify-end px-5">
          <button
            type="button"
            onClick={showForm ? closeForm : openAddForm}
            className="pointer-events-auto flex h-12 w-12 items-center justify-center rounded-full bg-daily-mint text-daily-bg shadow-[0_12px_32px_rgba(53,243,199,0.28)]"
            aria-label={showForm ? "Close habit form" : "Add habit"}
            aria-expanded={showForm}
          >
            <Plus className={`h-5 w-5 transition ${showForm ? "rotate-45" : ""}`} strokeWidth={2.8} />
          </button>
        </div>
      </div>
    </section>
  );
}
