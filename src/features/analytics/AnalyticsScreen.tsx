import { useMemo } from "react";
import {
  Activity,
  BarChart3,
  CalendarRange,
  Flame,
  Target,
  TrendingDown,
  Trophy,
} from "lucide-react";
import { useDaily } from "../../app/AppProvider";
import {
  averageRate,
  getHabitPerformance,
  getHeatmapRates,
  getMonthToDateRates,
  getMonthlyRates,
  getMostCompletedHabit,
  getMostMissedHabit,
  getRecentDailyRates,
  getTimePatterns,
  type HabitPerformance,
} from "../../domain/analyticsStats";
import { getDailyStreak } from "../../domain/habitStats";

function StatTile({
  label,
  value,
  caption,
  tone = "mint",
}: {
  label: string;
  value: string;
  caption: string;
  tone?: "mint" | "cyan" | "white";
}) {
  const valueClass =
    tone === "mint" ? "text-daily-mint" : tone === "cyan" ? "text-daily-cyan" : "text-daily-ink";

  return (
    <article className="rounded-[28px] border border-white/10 bg-white/[0.06] p-4">
      <p className="text-xs font-semibold text-daily-muted">{label}</p>
      <p className={`mt-2 text-4xl font-semibold leading-none ${valueClass}`}>{value}</p>
      <p className="mt-2 text-xs leading-5 text-daily-muted">{caption}</p>
    </article>
  );
}

function ProgressBar({ value, color = "bg-daily-mint" }: { value: number; color?: string }) {
  return (
    <div className="h-2 overflow-hidden rounded-full bg-white/10">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(Math.max(value, 0), 100)}%` }} />
    </div>
  );
}

function InsightCard({
  icon,
  label,
  title,
  caption,
  tone = "mint",
}: {
  icon: "trophy" | "down" | "flame";
  label: string;
  title: string;
  caption: string;
  tone?: "mint" | "cyan" | "rose";
}) {
  const Icon = icon === "trophy" ? Trophy : icon === "down" ? TrendingDown : Flame;
  const toneClass =
    tone === "mint" ? "text-daily-mint bg-daily-mint/15" : tone === "cyan" ? "text-daily-cyan bg-daily-cyan/15" : "text-rose-200 bg-rose-500/15";

  return (
    <article className="rounded-[28px] border border-white/10 bg-white/[0.06] p-4 shadow-soft">
      <div className="flex items-start gap-3">
        <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${toneClass}`}>
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="text-xs text-daily-muted">{label}</p>
          <p className="mt-1 truncate text-lg font-semibold">{title}</p>
          <p className="mt-1 text-xs leading-5 text-daily-muted">{caption}</p>
        </div>
      </div>
    </article>
  );
}

function HabitPerformanceRow({ item }: { item: HabitPerformance }) {
  return (
    <article className="rounded-2xl border border-white/10 bg-black/15 p-3">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{item.habit.name}</p>
          <p className="mt-1 text-xs text-daily-muted">
            {item.doneCount}/{item.trackedDays}일 완료
          </p>
        </div>
        <p className="text-lg font-semibold text-daily-mint">{item.completionRate}%</p>
      </div>
      <ProgressBar value={item.completionRate} />
    </article>
  );
}

function Heatmap({ rates }: { rates: ReturnType<typeof getHeatmapRates> }) {
  const levels = ["bg-white/7", "bg-daily-mint/30", "bg-daily-mint/50", "bg-daily-cyan/75", "bg-daily-cyan"];

  return (
    <div className="rounded-[32px] border border-white/10 bg-white/[0.06] p-4 shadow-soft">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-semibold">잔디 그래프</p>
        <p className="text-xs text-daily-muted">최근 {rates.length}일</p>
      </div>
      <div className="grid grid-cols-[repeat(16,minmax(0,1fr))] gap-1">
        {rates.map((rate) => (
          <span
            key={rate.date}
            title={`${rate.date} · ${rate.completionRate}%`}
            className={`aspect-square rounded-[4px] ${levels[rate.level]}`}
          />
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between text-xs text-daily-muted">
        <span>낮음</span>
        <span className="flex gap-1">
          {levels.map((level) => (
            <span key={level} className={`h-3 w-3 rounded-[3px] ${level}`} />
          ))}
        </span>
        <span>높음</span>
      </div>
    </div>
  );
}

function TimePatternChart({ patterns }: { patterns: ReturnType<typeof getTimePatterns> }) {
  return (
    <section className="rounded-[32px] border border-white/10 bg-white/[0.06] p-4 shadow-soft">
      <div className="mb-4 flex items-center gap-2">
        <Activity className="h-4 w-4 text-daily-cyan" />
        <h2 className="text-sm font-semibold">시간대별 완료 패턴</h2>
      </div>
      <div className="space-y-3">
        {patterns.map((pattern) => (
          <div key={pattern.id}>
            <div className="mb-1.5 flex items-center justify-between text-xs">
              <span className="font-semibold">{pattern.label}</span>
              <span className="text-daily-muted">
                {pattern.count}회 · {pattern.percent}%
              </span>
            </div>
            <ProgressBar value={pattern.percent} color="bg-daily-cyan" />
            <p className="mt-1 text-[10px] text-daily-muted">{pattern.range}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function MonthlyChart({ rates }: { rates: ReturnType<typeof getMonthlyRates> }) {
  const maxRate = Math.max(...rates.map((rate) => rate.completionRate), 1);

  return (
    <section className="rounded-[32px] border border-white/10 bg-white/[0.06] p-4 shadow-soft">
      <div className="mb-4 flex items-center gap-2">
        <CalendarRange className="h-4 w-4 text-daily-mint" />
        <h2 className="text-sm font-semibold">월별 완료 기록</h2>
      </div>
      <div className="flex h-36 items-end gap-1.5">
        {rates.map((rate) => (
          <div key={rate.month} className="flex flex-1 flex-col items-center gap-2">
            <div className="flex h-28 w-full items-end rounded-full bg-white/5">
              <div
                className="w-full rounded-full bg-daily-mint"
                style={{ height: `${Math.max((rate.completionRate / maxRate) * 100, rate.completionRate > 0 ? 8 : 0)}%` }}
                title={`${rate.label} · ${rate.completionRate}%`}
              />
            </div>
            <span className="text-[10px] text-daily-muted">{rate.month + 1}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

export function AnalyticsScreen() {
  const { activeHabits, data } = useDaily();
  const today = new Date();
  const weeklyRates = useMemo(
    () => getRecentDailyRates(activeHabits, data.habitLogs, 7, today),
    [activeHabits, data.habitLogs],
  );
  const monthToDateRates = useMemo(
    () => getMonthToDateRates(activeHabits, data.habitLogs, today),
    [activeHabits, data.habitLogs],
  );
  const performance = useMemo(
    () => getHabitPerformance(activeHabits, data.habitLogs, today),
    [activeHabits, data.habitLogs],
  );
  const heatmapRates = useMemo(
    () => getHeatmapRates(activeHabits, data.habitLogs, 112, today),
    [activeHabits, data.habitLogs],
  );
  const monthlyRates = useMemo(
    () => getMonthlyRates(activeHabits, data.habitLogs, today.getFullYear(), today),
    [activeHabits, data.habitLogs],
  );
  const timePatterns = useMemo(() => getTimePatterns(data.habitLogs), [data.habitLogs]);
  const weeklyAverage = averageRate(weeklyRates);
  const monthlyAverage = averageRate(monthToDateRates);
  const streak = getDailyStreak(activeHabits, data.habitLogs, today);
  const mostCompleted = getMostCompletedHabit(performance);
  const mostMissed = getMostMissedHabit(performance);
  const sortedPerformance = [...performance].sort((a, b) => b.completionRate - a.completionRate);

  return (
    <section className="space-y-5">
      <div className="rounded-[36px] border border-daily-mint/20 bg-[radial-gradient(circle_at_25%_0%,rgba(53,243,199,0.24),transparent_36%),linear-gradient(180deg,rgba(255,255,255,0.09),rgba(255,255,255,0.035))] p-5 shadow-soft">
        <p className="text-sm text-daily-muted">작은 완료가 쌓이는 방향을 숫자와 패턴으로 확인합니다.</p>
        <div className="mt-5 grid grid-cols-3 gap-3">
          <div>
            <p className="text-3xl font-semibold text-daily-mint">{weeklyAverage}%</p>
            <p className="mt-1 text-xs text-daily-muted">주간</p>
          </div>
          <div>
            <p className="text-3xl font-semibold text-daily-cyan">{monthlyAverage}%</p>
            <p className="mt-1 text-xs text-daily-muted">월간</p>
          </div>
          <div>
            <p className="text-3xl font-semibold">{streak}</p>
            <p className="mt-1 text-xs text-daily-muted">streak</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatTile label="활성 습관" value={`${activeHabits.length}`} caption="현재 분석 대상" />
        <StatTile label="누적 로그" value={`${data.habitLogs.length}`} caption="저장된 기록" tone="cyan" />
      </div>

      <div className="grid grid-cols-1 gap-3">
        <InsightCard
          icon="trophy"
          label="가장 많이 완료한 습관"
          title={mostCompleted ? mostCompleted.habit.name : "아직 없음"}
          caption={mostCompleted ? `${mostCompleted.doneCount}회 완료 · ${mostCompleted.completionRate}%` : "오늘 화면에서 습관을 완료하면 표시됩니다."}
        />
        <InsightCard
          icon="down"
          label="가장 자주 실패한 습관"
          title={mostMissed ? mostMissed.habit.name : "아직 없음"}
          caption={mostMissed ? `${mostMissed.missedDays}일 미완료 · ${mostMissed.completionRate}%` : "기록이 쌓이면 실패 패턴을 계산합니다."}
          tone="rose"
        />
      </div>

      <section className="rounded-[32px] border border-white/10 bg-white/[0.06] p-4 shadow-soft">
        <div className="mb-4 flex items-center gap-2">
          <Target className="h-4 w-4 text-daily-mint" />
          <h2 className="text-sm font-semibold">습관별 완료율</h2>
        </div>
        <div className="space-y-2">
          {sortedPerformance.length === 0 ? (
            <p className="rounded-2xl bg-black/15 p-4 text-sm leading-6 text-daily-muted">
              분석할 활성 습관이 없습니다. 습관 탭에서 루틴을 추가하세요.
            </p>
          ) : (
            sortedPerformance.map((item) => <HabitPerformanceRow key={item.habit.id} item={item} />)
          )}
        </div>
      </section>

      <Heatmap rates={heatmapRates} />

      <TimePatternChart patterns={timePatterns} />

      <MonthlyChart rates={monthlyRates} />

      <section className="rounded-[32px] border border-white/10 bg-white/[0.06] p-4 shadow-soft">
        <div className="mb-4 flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-daily-cyan" />
          <h2 className="text-sm font-semibold">최근 7일</h2>
        </div>
        <div className="space-y-3">
          {weeklyRates.map((rate) => (
            <div key={rate.date}>
              <div className="mb-1.5 flex items-center justify-between text-xs">
                <span className="text-daily-muted">{rate.date.slice(5)}</span>
                <span className="font-semibold">{rate.completionRate}%</span>
              </div>
              <ProgressBar value={rate.completionRate} color="bg-daily-cyan" />
            </div>
          ))}
        </div>
      </section>
    </section>
  );
}
