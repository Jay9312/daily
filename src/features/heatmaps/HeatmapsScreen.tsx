import { useMemo, useState, type ReactNode } from "react";
import { CalendarDays, Grid3X3, Hourglass, Rows3, Sparkles, type LucideIcon } from "lucide-react";
import { useDaily } from "../../app/AppProvider";
import {
  getDayCompletionSummary,
  getHeatLevel,
  getMonthGrid,
  getYearDays,
  getYearProgress,
  type CalendarDay,
} from "../../domain/calendarStats";
import { getLocalDateKey } from "../../domain/date";
import type { ISODateString } from "../../types";

type HeatmapMode = "year" | "months" | "habitYear" | "habitMonths" | "lifeWeeks";

const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const heatClasses = ["bg-white/[0.07]", "bg-daily-mint/20", "bg-daily-mint/40", "bg-daily-mint/70", "bg-daily-mint"];
const lifeYears = 100;
const weeksPerYear = 52;
const lifeWeeks = lifeYears * weeksPerYear;
const lifeGridColumns = 80;

function getLastTwelveMonths(today = new Date()) {
  return Array.from({ length: 12 }, (_, index) => {
    const date = new Date(today.getFullYear(), today.getMonth() - 11 + index, 1);
    return { year: date.getFullYear(), month: date.getMonth() };
  });
}

function dateFromKey(dateKey: ISODateString) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getLivedWeeks(birthDate: ISODateString | null, today = new Date()) {
  if (!birthDate) {
    return 0;
  }

  const start = dateFromKey(birthDate).getTime();
  const current = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  return clamp(Math.floor((current - start) / 604_800_000), 0, lifeWeeks);
}

function addWeeks(date: Date, weeks: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + weeks * 7);
  return next;
}

function getAgeYearsOnDate(birthDate: Date, targetDate: Date) {
  let age = targetDate.getFullYear() - birthDate.getFullYear();
  const birthdayThisYear = new Date(targetDate.getFullYear(), birthDate.getMonth(), birthDate.getDate());

  if (targetDate < birthdayThisYear) {
    age -= 1;
  }

  return clamp(age, 0, lifeYears);
}

function getBirthdayForAge(birthDate: Date, ageYears: number) {
  return new Date(birthDate.getFullYear() + ageYears, birthDate.getMonth(), birthDate.getDate());
}

function getWeeksBetween(startDate: Date, targetDate: Date) {
  const start = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate()).getTime();
  const target = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate()).getTime();
  return Math.max(Math.floor((target - start) / 604_800_000), 0);
}

function getLifeWeekDetails(birthDate: ISODateString | null, weekIndex: number) {
  if (!birthDate) {
    return { ageYears: 0, weekOfAge: 0 };
  }

  const birth = dateFromKey(birthDate);
  const weekStart = addWeeks(birth, weekIndex);
  const ageYears = getAgeYearsOnDate(birth, weekStart);
  const lastBirthday = getBirthdayForAge(birth, ageYears);
  const weekOfAge = getWeeksBetween(lastBirthday, weekStart) + 1;

  return { ageYears, weekOfAge };
}

function HeatDot({ level, title, active = false }: { level: number; title: string; active?: boolean }) {
  return (
    <span
      title={title}
      className={`aspect-square rounded-[4px] ${
        active ? "bg-white shadow-[0_0_12px_rgba(255,255,255,0.45)]" : heatClasses[level]
      }`}
    />
  );
}

function ModeButton({
  active,
  label,
  Icon,
  onClick,
  wide = false,
}: {
  active: boolean;
  label: string;
  Icon: LucideIcon;
  onClick: () => void;
  wide?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-h-14 items-center gap-3 rounded-2xl border px-3 text-left text-sm font-semibold transition ${
        wide ? "col-span-2" : ""
      } ${
        active
          ? "border-daily-mint/60 bg-daily-mint/15 text-daily-mint"
          : "border-white/10 bg-white/[0.05] text-daily-muted"
      }`}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {label}
    </button>
  );
}

function Panel({ title, caption, children }: { title?: string; caption?: string; children: ReactNode }) {
  return (
    <section className="rounded-[30px] border border-white/10 bg-white/[0.055] p-4 shadow-soft">
      {(title || caption) && (
        <div className="mb-4">
          {title && <h2 className="text-xl font-semibold">{title}</h2>}
          {caption && <p className="mt-1 text-sm text-daily-muted">{caption}</p>}
        </div>
      )}
      {children}
    </section>
  );
}

function YearHeatmap({
  days,
  levelForDay,
}: {
  days: CalendarDay[];
  levelForDay: (day: CalendarDay) => number;
}) {
  return (
    <div className="grid grid-cols-[repeat(21,minmax(0,1fr))] gap-1">
      {days.map((day) => (
        <HeatDot key={day.dateKey} level={levelForDay(day)} title={day.dateKey} active={day.isToday} />
      ))}
    </div>
  );
}

function MonthHeatmap({
  year,
  month,
  levelForDate,
}: {
  year: number;
  month: number;
  levelForDate: (dateKey: ISODateString, isFuture: boolean) => number;
}) {
  const todayKey = getLocalDateKey();
  const grid = getMonthGrid(year, month);

  return (
    <article className="min-w-0">
      <p className="mb-2 text-xs font-semibold text-daily-muted">{monthLabels[month]}</p>
      <div className="grid grid-cols-7 gap-1">
        {grid.map((date, index) => {
          if (!date) {
            return <span key={`blank-${year}-${month}-${index}`} className="aspect-square" />;
          }

          const dateKey = getLocalDateKey(date);
          const isFuture = dateKey > todayKey;

          return (
            <HeatDot
              key={dateKey}
              level={levelForDate(dateKey, isFuture)}
              title={dateKey}
              active={dateKey === todayKey}
            />
          );
        })}
      </div>
    </article>
  );
}

function LifeWeeksPanel({
  birthDate,
  onChangeBirthDate,
}: {
  birthDate: ISODateString | null;
  onChangeBirthDate: (birthDate: ISODateString | null) => void;
}) {
  const [editing, setEditing] = useState(!birthDate);
  const [draftBirthDate, setDraftBirthDate] = useState(birthDate ?? "");
  const [selectedWeekIndex, setSelectedWeekIndex] = useState(() =>
    clamp(getLivedWeeks(birthDate), 0, lifeWeeks - 1),
  );
  const livedWeeks = getLivedWeeks(birthDate);
  const weeksLeft = lifeWeeks - livedWeeks;
  const percent = Math.round((livedWeeks / lifeWeeks) * 100);
  const currentWeekIndex = birthDate ? clamp(livedWeeks, 0, lifeWeeks - 1) : -1;
  const selectedWeek = clamp(selectedWeekIndex, 0, lifeWeeks - 1);
  const selectedDetails = getLifeWeekDetails(birthDate, selectedWeek);
  const selectedStatus = !birthDate
    ? "Set your birth date"
    : selectedWeek < livedWeeks
      ? "Lived"
      : selectedWeek === currentWeekIndex
        ? "This week"
        : "Ahead";

  const saveBirthDate = () => {
    const nextBirthDate = draftBirthDate || null;
    onChangeBirthDate(nextBirthDate);
    setSelectedWeekIndex(clamp(getLivedWeeks(nextBirthDate), 0, lifeWeeks - 1));
    setEditing(false);
  };

  return (
    <Panel>
      <div
        className="mx-auto grid max-w-[320px] gap-[2px]"
        style={{ gridTemplateColumns: `repeat(${lifeGridColumns}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: lifeWeeks }, (_, index) => {
          const lived = index < livedWeeks;
          const current = index === currentWeekIndex;
          const selected = index === selectedWeek;
          return (
            <button
              type="button"
              key={index}
              title={`Week ${index + 1}`}
              onClick={() => setSelectedWeekIndex(index)}
              className={`aspect-square rounded-[2px] transition ${
                current
                  ? "bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                  : lived
                    ? "bg-daily-mint"
                    : "bg-white/[0.07]"
              } ${selected ? "scale-[1.45] ring-1 ring-white/80" : ""}`}
              aria-label={`Select week ${index + 1}`}
            />
          );
        })}
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 rounded-[22px] border border-white/10 bg-black/20 p-3 text-center">
        <div>
          <p className="text-[10px] font-semibold uppercase text-daily-muted">Progress</p>
          <p className="mt-1 text-lg font-semibold text-daily-mint">{percent}%</p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase text-daily-muted">Weeks left</p>
          <p className="mt-1 text-lg font-semibold">{weeksLeft.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase text-daily-muted">{selectedStatus}</p>
          <p className="mt-1 text-xs font-semibold text-daily-muted">
            {birthDate ? `${selectedDetails.ageYears}y ${selectedDetails.weekOfAge}w` : "--"}
          </p>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        <button
          type="button"
          onClick={() => setSelectedWeekIndex(0)}
          className="min-h-10 rounded-2xl border border-white/10 bg-white/[0.05] text-xs font-semibold text-daily-muted"
        >
          Birth
        </button>
        <button
          type="button"
          onClick={() => setSelectedWeekIndex(currentWeekIndex >= 0 ? currentWeekIndex : 0)}
          className="min-h-10 rounded-2xl bg-daily-mint text-xs font-semibold text-daily-bg"
        >
          This week
        </button>
        <button
          type="button"
          onClick={() => setSelectedWeekIndex(lifeWeeks - 1)}
          className="min-h-10 rounded-2xl border border-white/10 bg-white/[0.05] text-xs font-semibold text-daily-muted"
        >
          100y
        </button>
      </div>

      <div className="mt-3 rounded-[22px] border border-white/10 bg-white/[0.045] p-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold">{birthDate ? birthDate : "Birth date not set"}</p>
            <p className="mt-1 text-[11px] text-daily-muted">
              {birthDate
                ? `Age ${selectedDetails.ageYears}, week ${selectedDetails.weekOfAge} - week ${selectedWeek + 1} of 5,200`
                : `Week ${selectedWeek + 1} of 5,200`}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setDraftBirthDate(birthDate ?? "");
              setEditing((value) => !value);
            }}
            className="min-h-9 shrink-0 rounded-full border border-daily-mint/30 bg-daily-mint/10 px-3 text-xs font-semibold text-daily-mint"
          >
            Birth Date
          </button>
        </div>

        {editing && (
          <div className="mt-3 grid grid-cols-[1fr_auto] gap-2">
            <input
              type="date"
              value={draftBirthDate}
              onChange={(event) => setDraftBirthDate(event.target.value)}
              className="min-h-10 rounded-2xl border border-white/10 bg-black/30 px-3 text-sm outline-none"
              aria-label="Birth date"
            />
            <button
              type="button"
              onClick={saveBirthDate}
              className="min-h-10 rounded-2xl bg-daily-mint px-3 text-xs font-semibold text-daily-bg"
            >
              Change
            </button>
          </div>
        )}
      </div>
    </Panel>
  );
}

export function HeatmapsScreen() {
  const { activeHabits, data, actions } = useDaily();
  const today = new Date();
  const year = today.getFullYear();
  const todayKey = getLocalDateKey(today);
  const [mode, setMode] = useState<HeatmapMode>("year");

  const yearDays = useMemo(() => getYearDays(year, today), [year, todayKey]);
  const progress = getYearProgress(year, today);
  const lastTwelveMonths = useMemo(() => getLastTwelveMonths(today), [todayKey]);

  const progressLevel = (_dateKey: ISODateString, isFuture: boolean) => (isFuture ? 0 : 4);

  const habitCompletionLevel = (dateKey: ISODateString, isFuture: boolean) => {
    const summary = getDayCompletionSummary(activeHabits, data.habitLogs, dateKey);
    return getHeatLevel(summary, isFuture);
  };

  return (
    <section className="space-y-5">
      <div className="grid grid-cols-2 gap-2">
        <ModeButton active={mode === "year"} label="Year Heatmap" Icon={Grid3X3} onClick={() => setMode("year")} />
        <ModeButton active={mode === "months"} label="Monthly Heatmap" Icon={CalendarDays} onClick={() => setMode("months")} />
        <ModeButton active={mode === "habitYear"} label="Habit Year" Icon={Sparkles} onClick={() => setMode("habitYear")} />
        <ModeButton active={mode === "habitMonths"} label="Habit 12 Months" Icon={Rows3} onClick={() => setMode("habitMonths")} />
        <ModeButton active={mode === "lifeWeeks"} label="Life in Weeks" Icon={Hourglass} onClick={() => setMode("lifeWeeks")} wide />
      </div>

      {mode === "year" && (
        <Panel>
          <p className="mb-3 text-center text-xs font-semibold text-daily-muted">
            {progress.remaining} days left - {progress.percent}% of the year
          </p>
          <YearHeatmap days={yearDays} levelForDay={(day) => progressLevel(day.dateKey, day.isFuture)} />
        </Panel>
      )}

      {mode === "months" && (
        <Panel>
          <div className="grid grid-cols-3 gap-x-4 gap-y-5">
            {monthLabels.map((_, month) => (
              <MonthHeatmap key={month} year={year} month={month} levelForDate={progressLevel} />
            ))}
          </div>
        </Panel>
      )}

      {mode === "habitYear" && (
        <Panel>
          <YearHeatmap days={yearDays} levelForDay={(day) => habitCompletionLevel(day.dateKey, day.isFuture)} />
        </Panel>
      )}

      {mode === "habitMonths" && (
        <Panel>
          <div className="grid grid-cols-3 gap-x-4 gap-y-5">
            {lastTwelveMonths.map(({ year: itemYear, month }) => (
              <MonthHeatmap
                key={`${itemYear}-${month}`}
                year={itemYear}
                month={month}
                levelForDate={habitCompletionLevel}
              />
            ))}
          </div>
        </Panel>
      )}

      {mode === "lifeWeeks" && (
        <LifeWeeksPanel
          birthDate={data.settings.lifeBirthDate}
          onChangeBirthDate={(lifeBirthDate) => actions.updateSettings({ lifeBirthDate })}
        />
      )}
    </section>
  );
}
