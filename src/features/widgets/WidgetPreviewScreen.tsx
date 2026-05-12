import { CalendarDays, Camera, Flashlight, Smartphone } from "lucide-react";
import { useDaily } from "../../app/AppProvider";
import { getYearDays, getYearProgress, getDayCompletionSummary, getHeatLevel } from "../../domain/calendarStats";
import { getLocalDateKey } from "../../domain/date";
import { getCompletionRate, getDoneCount } from "../../domain/habitStats";

function getTimeLabel() {
  return new Intl.DateTimeFormat("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date());
}

function getDateLabel() {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "short",
  }).format(new Date());
}

function LockHeatmap() {
  const { activeHabits, data } = useDaily();
  const year = new Date().getFullYear();
  const yearDays = getYearDays(year);
  const levels = ["bg-white/12", "bg-cyan-300/35", "bg-cyan-300/55", "bg-cyan-300/75", "bg-daily-cyan"];

  return (
    <div className="grid grid-cols-[repeat(31,minmax(0,1fr))] gap-[3px]">
      {yearDays.map((day) => {
        const summary = getDayCompletionSummary(activeHabits, data.habitLogs, day.dateKey);
        const level = getHeatLevel(summary, day.isFuture);

        return (
          <span
            key={day.dateKey}
            className={`aspect-square rounded-[3px] ${levels[level]}`}
            title={`${day.dateKey} · ${summary.completionRate}%`}
          />
        );
      })}
    </div>
  );
}

function LockScreenPreview() {
  const { activeHabits, data } = useDaily();
  const today = getLocalDateKey();
  const todayRate = getCompletionRate(activeHabits, data.habitLogs, today);
  const progress = getYearProgress(new Date().getFullYear());

  return (
    <section className="rounded-[40px] border border-white/10 bg-[linear-gradient(180deg,rgba(204,226,219,0.35),rgba(78,118,120,0.35)_42%,rgba(4,10,10,0.95))] p-4 shadow-soft">
      <div className="relative min-h-[640px] overflow-hidden rounded-[34px] border border-black/40 bg-[radial-gradient(circle_at_48%_40%,rgba(180,218,204,0.32),transparent_28%),linear-gradient(180deg,rgba(151,177,190,0.58),rgba(10,26,25,0.96))] px-5 py-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_92%,rgba(53,243,199,0.18),transparent_22%),radial-gradient(circle_at_72%_18%,rgba(34,211,238,0.18),transparent_24%)]" />

        <div className="relative">
          <p className="text-center text-sm font-medium text-white/75">{getDateLabel()} · 5°</p>
          <p className="mt-2 text-center text-[76px] font-semibold leading-none text-white/55">{getTimeLabel()}</p>

          <div className="mt-12 rounded-[26px] border border-white/10 bg-black/20 p-3 backdrop-blur-xl">
            <LockHeatmap />
          </div>

          <div className="mt-24 text-center">
            <p className="text-sm font-semibold text-daily-cyan">{todayRate}% · {progress.remaining}일 남음</p>
            <p className="mt-1 text-xs text-white/45">{new Date().getFullYear()} · {progress.percent}%</p>
          </div>
        </div>

        <div className="absolute bottom-8 left-6 right-6 flex items-center justify-between">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/12 text-white/70 backdrop-blur-xl">
            <Flashlight className="h-5 w-5" />
          </span>
          <span className="h-1 w-28 rounded-full bg-white/75" />
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/12 text-white/70 backdrop-blur-xl">
            <Camera className="h-5 w-5" />
          </span>
        </div>
      </div>
    </section>
  );
}

function HomeWidgetPreview() {
  const { activeHabits, data } = useDaily();
  const today = getLocalDateKey();
  const todayRate = getCompletionRate(activeHabits, data.habitLogs, today);
  const doneCount = getDoneCount(activeHabits, data.habitLogs, today);
  const progress = getYearProgress(new Date().getFullYear());

  return (
    <section className="rounded-[34px] border border-white/10 bg-white/[0.06] p-4 shadow-soft">
      <div className="rounded-[30px] border border-white/10 bg-black/25 p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-daily-muted">Daily</p>
            <p className="mt-2 text-5xl font-semibold text-daily-mint">{todayRate}%</p>
            <p className="mt-1 text-xs text-daily-muted">오늘 완료율</p>
          </div>
          <Smartphone className="h-6 w-6 text-daily-cyan" />
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-white/5 p-3">
            <p className="text-2xl font-semibold">{doneCount}/{activeHabits.length}</p>
            <p className="mt-1 text-xs text-daily-muted">완료</p>
          </div>
          <div className="rounded-2xl bg-white/5 p-3">
            <p className="text-2xl font-semibold">{progress.remaining}</p>
            <p className="mt-1 text-xs text-daily-muted">일 남음</p>
          </div>
        </div>

        <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-daily-mint" style={{ width: `${todayRate}%` }} />
        </div>
      </div>
    </section>
  );
}

export function WidgetPreviewScreen() {
  const { data } = useDaily();
  const progress = getYearProgress(new Date().getFullYear());

  return (
    <section className="space-y-5">
      <div className="rounded-[36px] border border-daily-cyan/20 bg-[radial-gradient(circle_at_20%_0%,rgba(34,211,238,0.24),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.035))] p-5 shadow-soft">
        <p className="text-sm text-daily-muted">아이폰 잠금화면 위에 얹히는 heatmap 위젯의 UI 스펙입니다.</p>
        <div className="mt-5 grid grid-cols-3 gap-3">
          <div>
            <p className="text-3xl font-semibold text-daily-cyan">{progress.percent}%</p>
            <p className="mt-1 text-xs text-daily-muted">연간</p>
          </div>
          <div>
            <p className="text-3xl font-semibold text-daily-mint">{progress.remaining}</p>
            <p className="mt-1 text-xs text-daily-muted">남은 날</p>
          </div>
          <div>
            <p className="text-3xl font-semibold">{progress.daysInYear}</p>
            <p className="mt-1 text-xs text-daily-muted">점</p>
          </div>
        </div>
      </div>

      <LockScreenPreview />

      <HomeWidgetPreview />

      <section className="rounded-[30px] border border-white/10 bg-white/[0.06] p-5">
        <CalendarDays className="mb-3 h-5 w-5 text-daily-mint" />
        <p className="text-lg font-semibold">Memento mori</p>
        <p className="mt-2 text-sm leading-6 text-daily-muted">{data.settings.widgetQuote}</p>
      </section>

      <section className="rounded-[30px] border border-white/10 bg-white/[0.04] p-5 text-sm leading-6 text-daily-muted">
        실제 iOS 잠금화면/홈 화면 위젯, iCloud 동기화, 단축어 자동화는 PWA에서 구현하지 않고 SwiftUI 전환 시 WidgetKit, CloudKit, App Intents로 구현합니다.
      </section>
    </section>
  );
}
