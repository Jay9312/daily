import { getCompletionRate, getDoneCount, getLogsForDate } from "./habitStats";
import { getLocalDateKey } from "./date";
import type { Habit, HabitLog, ISODateString } from "../types";

export interface CalendarDay {
  date: Date;
  dateKey: ISODateString;
  dayOfYear: number;
  month: number;
  day: number;
  isToday: boolean;
  isFuture: boolean;
}

export interface DayCompletionSummary {
  date: ISODateString;
  completionRate: number;
  doneCount: number;
  totalCount: number;
  logs: HabitLog[];
}

export function getDaysInYear(year: number) {
  return isLeapYear(year) ? 366 : 365;
}

export function isLeapYear(year: number) {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

export function getDayOfYear(date: Date) {
  const start = new Date(date.getFullYear(), 0, 1);
  return Math.floor((date.getTime() - start.getTime()) / 86_400_000) + 1;
}

export function getYearProgress(year: number, today = new Date()) {
  if (today.getFullYear() < year) {
    return { dayOfYear: 0, daysInYear: getDaysInYear(year), percent: 0, remaining: getDaysInYear(year) };
  }

  if (today.getFullYear() > year) {
    return { dayOfYear: getDaysInYear(year), daysInYear: getDaysInYear(year), percent: 100, remaining: 0 };
  }

  const daysInYear = getDaysInYear(year);
  const dayOfYear = getDayOfYear(today);
  return {
    dayOfYear,
    daysInYear,
    percent: Math.round((dayOfYear / daysInYear) * 100),
    remaining: Math.max(daysInYear - dayOfYear, 0),
  };
}

export function getYearDays(year: number, today = new Date()): CalendarDay[] {
  const todayKey = getLocalDateKey(today);
  const todayTime = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const daysInYear = getDaysInYear(year);

  return Array.from({ length: daysInYear }, (_, index) => {
    const date = new Date(year, 0, index + 1);
    const dateKey = getLocalDateKey(date);

    return {
      date,
      dateKey,
      dayOfYear: index + 1,
      month: date.getMonth(),
      day: date.getDate(),
      isToday: dateKey === todayKey,
      isFuture: date.getTime() > todayTime,
    };
  });
}

export function getDayCompletionSummary(
  habits: Habit[],
  logs: HabitLog[],
  date: ISODateString,
): DayCompletionSummary {
  const dayLogs = getLogsForDate(logs, date);

  return {
    date,
    completionRate: getCompletionRate(habits, logs, date),
    doneCount: getDoneCount(habits, logs, date),
    totalCount: habits.length,
    logs: dayLogs,
  };
}

export function getHeatLevel(summary: DayCompletionSummary, isFuture = false) {
  if (isFuture) {
    return 0;
  }

  if (summary.totalCount === 0 || summary.completionRate === 0) {
    return summary.logs.some((log) => log.done) ? 1 : 0;
  }

  if (summary.completionRate >= 100) {
    return 4;
  }

  if (summary.completionRate >= 67) {
    return 3;
  }

  if (summary.completionRate >= 34) {
    return 2;
  }

  return 1;
}

export function getMonthGrid(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const leadingBlanks = firstDay.getDay();
  const days = Array.from({ length: lastDay.getDate() }, (_, index) => new Date(year, month, index + 1));

  return [...Array.from({ length: leadingBlanks }, () => null), ...days];
}
