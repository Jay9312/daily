import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, Check, Flame, MessageCircle, Plus, Sparkles } from "lucide-react";
import { useDaily } from "../../app/AppProvider";
import { formatKoreanFullDate, getLocalDateKey } from "../../domain/date";
import {
  getCompletionRate,
  getDailyStreak,
  getDoneCount,
  getHabitLogForDate,
  isHabitDoneOnDate,
} from "../../domain/habitStats";
import type { Habit } from "../../types";

const quickColors = ["#35f3c7", "#22d3ee", "#a7f3d0", "#f472b6"];

function HabitIcon({ habit, done }: { habit: Habit; done: boolean }) {
  return (
    <span
      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border ${
        done ? "border-white/20 text-daily-bg" : "border-white/10 text-daily-ink"
      }`}
      style={{ backgroundColor: done ? habit.color : `${habit.color}22` }}
    >
      <Sparkles className="h-5 w-5" />
    </span>
  );
}

function TodayHabitItem({ habit, today }: { habit: Habit; today: string }) {
  const { data, actions } = useDaily();
  const log = getHabitLogForDate(habit.id, data.habitLogs, today);
  const done = isHabitDoneOnDate(habit.id, data.habitLogs, today);
  const [memoOpen, setMemoOpen] = useState(Boolean(log?.memo));
  const [memo, setMemo] = useState(log?.memo ?? "");

  const saveLog = (nextDone = done, nextMemo = memo) => {
    actions.upsertHabitLog({
      habitId: habit.id,
      date: today,
      done: nextDone,
      memo: nextMemo,
      mood: log?.mood ?? null,
    });
  };

  const toggleDone = () => {
    saveLog(!done, memo);
  };

  const saveMemo = () => {
    saveLog(done, memo.trim());
    setMemoOpen(Boolean(memo.trim()));
  };

  return (
    <motion.article
      layout
      drag={data.settings.swipeEnabled ? "x" : false}
      dragConstraints={{ left: 0, right: 88 }}
      dragElastic={0.18}
      onDragEnd={(_, info) => {
        if (data.settings.swipeEnabled && info.offset.x > 56 && !done) {
          saveLog(true, memo);
        }
      }}
      className="rounded-[28px] border border-white/10 bg-white/[0.065] p-4 shadow-soft backdrop-blur-xl"
    >
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={toggleDone}
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition ${
            done
              ? "border-daily-mint bg-daily-mint text-daily-bg"
              : "border-white/20 bg-white/5 text-white/50"
          }`}
          aria-label={done ? `${habit.name} 완료 해제` : `${habit.name} 완료`}
        >
          {done && <Check className="h-4 w-4" strokeWidth={3} />}
        </button>

        <HabitIcon habit={habit} done={done} />

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className={`truncate text-base font-semibold ${done ? "text-white/55 line-through" : ""}`}>
              {habit.name}
            </h3>
            {done && <span className="rounded-full bg-daily-mint/15 px-2 py-0.5 text-[10px] text-daily-mint">done</span>}
          </div>
          <p className="mt-1 truncate text-sm text-daily-muted">{habit.goal}</p>
          <div className="mt-2 flex items-center gap-3 text-xs text-daily-muted">
            <span className="inline-flex items-center gap-1">
              <Bell className="h-3.5 w-3.5" />
              {habit.reminderTime ?? "알림 없음"}
            </span>
            {log?.memo && (
              <span className="inline-flex items-center gap-1 text-daily-cyan">
                <MessageCircle className="h-3.5 w-3.5" />
                메모 있음
              </span>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={() => setMemoOpen((value) => !value)}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/5 text-daily-muted transition hover:bg-white/10 hover:text-daily-ink"
          aria-label={`${habit.name} 메모`}
        >
          <MessageCircle className="h-4 w-4" />
        </button>
      </div>

      <AnimatePresence initial={false}>
        {memoOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-3">
              <textarea
                value={memo}
                onChange={(event) => setMemo(event.target.value)}
                onBlur={saveMemo}
                placeholder="오늘의 짧은 기록을 남겨두기"
                className="min-h-20 w-full resize-none bg-transparent text-sm leading-6 text-daily-ink outline-none placeholder:text-daily-muted"
              />
              <button
                type="button"
                onClick={saveMemo}
                className="mt-2 rounded-full bg-daily-mint px-4 py-2 text-xs font-semibold text-daily-bg"
              >
                메모 저장
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  );
}

function QuickAddHabit() {
  const { activeHabits, actions } = useDaily();
  const [name, setName] = useState("");

  const addQuickHabit = () => {
    const trimmed = name.trim();

    if (!trimmed) {
      return;
    }

    actions.addHabit({
      name: trimmed,
      icon: "Sparkles",
      color: quickColors[activeHabits.length % quickColors.length],
      goal: "오늘부터 이어가기",
      reminderTime: null,
      priorityQuadrant: "schedule",
      detailMemo: "",
    });
    setName("");
  };

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        addQuickHabit();
      }}
      className="rounded-[28px] border border-daily-mint/15 bg-daily-mint/10 p-3"
    >
      <label className="sr-only" htmlFor="quick-habit">
        빠른 습관 추가
      </label>
      <div className="flex items-center gap-2">
        <input
          id="quick-habit"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="빠른 습관 추가"
          className="min-h-12 flex-1 rounded-2xl border border-white/10 bg-black/20 px-4 text-sm text-daily-ink outline-none placeholder:text-daily-muted focus:border-daily-mint/60"
        />
        <button
          type="submit"
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-daily-mint text-daily-bg"
          aria-label="습관 추가"
        >
          <Plus className="h-5 w-5" strokeWidth={3} />
        </button>
      </div>
    </form>
  );
}

export function TodayScreen() {
  const { activeHabits, data } = useDaily();
  const today = getLocalDateKey();
  const completionRate = getCompletionRate(activeHabits, data.habitLogs, today);
  const doneCount = getDoneCount(activeHabits, data.habitLogs, today);
  const streak = useMemo(
    () => getDailyStreak(activeHabits, data.habitLogs),
    [activeHabits, data.habitLogs],
  );

  return (
    <section className="space-y-5">
      <div className="overflow-hidden rounded-[36px] border border-daily-mint/20 bg-[radial-gradient(circle_at_25%_0%,rgba(53,243,199,0.28),transparent_36%),linear-gradient(180deg,rgba(255,255,255,0.09),rgba(255,255,255,0.035))] p-5 shadow-soft">
        <p className="text-sm text-daily-muted">{formatKoreanFullDate()}</p>
        <div className="mt-5 flex items-end justify-between gap-4">
          <div>
            <p className="text-[64px] font-semibold leading-none tracking-normal">{completionRate}%</p>
            <p className="mt-2 text-sm text-daily-muted">오늘 완료율</p>
          </div>
          <div className="mb-1 rounded-3xl border border-white/10 bg-black/20 px-4 py-3 text-right">
            <p className="text-2xl font-semibold text-daily-mint">
              {doneCount}/{activeHabits.length}
            </p>
            <p className="mt-1 text-xs text-daily-muted">완료한 습관</p>
          </div>
        </div>
        <div className="mt-5 h-2.5 overflow-hidden rounded-full bg-white/10">
          <motion.div
            className="h-full rounded-full bg-daily-mint"
            initial={false}
            animate={{ width: `${completionRate}%` }}
            transition={{ type: "spring", stiffness: 160, damping: 24 }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-[28px] border border-white/10 bg-white/[0.06] p-4">
          <p className="inline-flex items-center gap-2 text-sm text-daily-muted">
            <Flame className="h-4 w-4 text-daily-cyan" />
            streak
          </p>
          <p className="mt-2 text-4xl font-semibold">{streak}</p>
          <p className="mt-1 text-xs text-daily-muted">연속 완벽 완료일</p>
        </div>
        <div className="rounded-[28px] border border-white/10 bg-white/[0.06] p-4">
          <p className="text-sm text-daily-muted">남은 습관</p>
          <p className="mt-2 text-4xl font-semibold">{Math.max(activeHabits.length - doneCount, 0)}</p>
          <p className="mt-1 text-xs text-daily-muted">오늘의 다음 점</p>
        </div>
      </div>

      <QuickAddHabit />

      <div className="space-y-3">
        {activeHabits.length === 0 ? (
          <div className="rounded-[28px] border border-white/10 bg-white/[0.06] p-5 text-sm leading-6 text-daily-muted">
            아직 활성 습관이 없습니다. 위 입력창에서 오늘 시작할 작은 습관을 추가하세요.
          </div>
        ) : (
          activeHabits.map((habit) => <TodayHabitItem key={habit.id} habit={habit} today={today} />)
        )}
      </div>
    </section>
  );
}
