import { addDays, getLocalDateKey } from "./date";
import { getCompletionRate, getDoneCount } from "./habitStats";
import type { Habit, HabitLog, ISODateString } from "../types";

export interface DailyRate {
  date: ISODateString;
  completionRate: number;
  doneCount: number;
  totalCount: number;
}

export interface HabitPerformance {
  habit: Habit;
  doneCount: number;
  trackedDays: number;
  missedDays: number;
  completionRate: number;
}

export interface TimePattern {
  id: string;
  label: string;
  range: string;
  count: number;
  percent: number;
}

export interface MonthlyRate {
  month: number;
  label: string;
  completionRate: number;
  doneCount: number;
  possibleCount: number;
}

function startOfLocalDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function dateFromKey(dateKey: ISODateString) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function clampToToday(date: Date, today: Date) {
  return date.getTime() > today.getTime() ? today : date;
}

function daysBetweenInclusive(start: Date, end: Date) {
  const startDay = startOfLocalDay(start).getTime();
  const endDay = startOfLocalDay(end).getTime();
  return Math.max(Math.floor((endDay - startDay) / 86_400_000) + 1, 1);
}

function uniqueDoneDates(logs: HabitLog[], habitId: string, todayKey: ISODateString) {
  return new Set(
    logs
      .filter((log) => log.habitId === habitId && log.done && log.date <= todayKey)
      .map((log) => log.date),
  );
}

export function getRecentDailyRates(
  habits: Habit[],
  logs: HabitLog[],
  days: number,
  endDate = new Date(),
): DailyRate[] {
  return Array.from({ length: days }, (_, index) => {
    const date = addDays(endDate, -(days - 1 - index));
    const dateKey = getLocalDateKey(date);

    return {
      date: dateKey,
      completionRate: getCompletionRate(habits, logs, dateKey),
      doneCount: getDoneCount(habits, logs, dateKey),
      totalCount: habits.length,
    };
  });
}

export function averageRate(rates: DailyRate[]) {
  if (rates.length === 0) {
    return 0;
  }

  return Math.round(rates.reduce((sum, rate) => sum + rate.completionRate, 0) / rates.length);
}

export function getHabitPerformance(
  habits: Habit[],
  logs: HabitLog[],
  today = new Date(),
): HabitPerformance[] {
  const todayKey = getLocalDateKey(today);

  return habits.map((habit) => {
    const createdAt = clampToToday(new Date(habit.createdAt), today);
    const trackedDays = daysBetweenInclusive(createdAt, today);
    const doneDates = uniqueDoneDates(logs, habit.id, todayKey);
    const doneCount = doneDates.size;
    const missedDays = Math.max(trackedDays - doneCount, 0);

    return {
      habit,
      doneCount,
      trackedDays,
      missedDays,
      completionRate: Math.round((doneCount / trackedDays) * 100),
    };
  });
}

export function getMostCompletedHabit(performance: HabitPerformance[]) {
  return [...performance].sort((a, b) => b.doneCount - a.doneCount)[0] ?? null;
}

export function getMostMissedHabit(performance: HabitPerformance[]) {
  return [...performance].sort((a, b) => b.missedDays - a.missedDays || a.completionRate - b.completionRate)[0] ?? null;
}

export function getTimePatterns(logs: HabitLog[]): TimePattern[] {
  const buckets = [
    { id: "dawn", label: "새벽", range: "00-05", count: 0 },
    { id: "morning", label: "오전", range: "06-11", count: 0 },
    { id: "afternoon", label: "오후", range: "12-17", count: 0 },
    { id: "evening", label: "저녁", range: "18-23", count: 0 },
  ];

  logs
    .filter((log) => log.done && log.completedAt)
    .forEach((log) => {
      const hour = new Date(log.completedAt!).getHours();
      const bucketIndex = hour < 6 ? 0 : hour < 12 ? 1 : hour < 18 ? 2 : 3;
      buckets[bucketIndex].count += 1;
    });

  const total = buckets.reduce((sum, bucket) => sum + bucket.count, 0);

  return buckets.map((bucket) => ({
    ...bucket,
    percent: total === 0 ? 0 : Math.round((bucket.count / total) * 100),
  }));
}

export function getMonthlyRates(habits: Habit[], logs: HabitLog[], year: number, today = new Date()): MonthlyRate[] {
  const todayDay = startOfLocalDay(today);

  return Array.from({ length: 12 }, (_, monthIndex) => {
    const firstDay = new Date(year, monthIndex, 1);
    const lastDay = new Date(year, monthIndex + 1, 0);

    if (firstDay.getTime() > todayDay.getTime()) {
      return {
        month: monthIndex,
        label: `${monthIndex + 1}월`,
        completionRate: 0,
        doneCount: 0,
        possibleCount: 0,
      };
    }

    const endDay = lastDay.getTime() > todayDay.getTime() ? todayDay : lastDay;
    const dayCount = daysBetweenInclusive(firstDay, endDay);
    let doneCount = 0;
    let rateSum = 0;

    for (let index = 0; index < dayCount; index += 1) {
      const dateKey = getLocalDateKey(addDays(firstDay, index));
      doneCount += getDoneCount(habits, logs, dateKey);
      rateSum += getCompletionRate(habits, logs, dateKey);
    }

    return {
      month: monthIndex,
      label: `${monthIndex + 1}월`,
      completionRate: dayCount === 0 ? 0 : Math.round(rateSum / dayCount),
      doneCount,
      possibleCount: dayCount * habits.length,
    };
  });
}

export function getHeatmapRates(habits: Habit[], logs: HabitLog[], days = 112, endDate = new Date()) {
  return getRecentDailyRates(habits, logs, days, endDate).map((rate) => ({
    ...rate,
    level:
      rate.completionRate >= 100
        ? 4
        : rate.completionRate >= 67
          ? 3
          : rate.completionRate >= 34
            ? 2
            : rate.completionRate > 0
              ? 1
              : 0,
  }));
}

export function getMonthToDateRates(habits: Habit[], logs: HabitLog[], today = new Date()) {
  const start = new Date(today.getFullYear(), today.getMonth(), 1);
  const days = daysBetweenInclusive(start, today);
  return getRecentDailyRates(habits, logs, days, today);
}

export function getLogDate(log: HabitLog) {
  return dateFromKey(log.date);
}
