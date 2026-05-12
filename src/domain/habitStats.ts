import { addDays, getLocalDateKey } from "./date";
import type { Habit, HabitLog, ISODateString } from "../types";

export function getLogsForDate(logs: HabitLog[], date: ISODateString) {
  return logs.filter((log) => log.date === date);
}

export function isHabitDoneOnDate(habitId: string, logs: HabitLog[], date: ISODateString) {
  return logs.some((log) => log.habitId === habitId && log.date === date && log.done);
}

export function getHabitLogForDate(habitId: string, logs: HabitLog[], date: ISODateString) {
  return logs.find((log) => log.habitId === habitId && log.date === date);
}

export function getCompletionRate(habits: Habit[], logs: HabitLog[], date: ISODateString) {
  if (habits.length === 0) {
    return 0;
  }

  const doneCount = habits.filter((habit) => isHabitDoneOnDate(habit.id, logs, date)).length;
  return Math.round((doneCount / habits.length) * 100);
}

export function getDoneCount(habits: Habit[], logs: HabitLog[], date: ISODateString) {
  return habits.filter((habit) => isHabitDoneOnDate(habit.id, logs, date)).length;
}

export function getDailyStreak(habits: Habit[], logs: HabitLog[], fromDate = new Date()) {
  if (habits.length === 0) {
    return 0;
  }

  let streak = 0;

  for (let offset = 0; offset < 366; offset += 1) {
    const date = getLocalDateKey(addDays(fromDate, -offset));
    const rate = getCompletionRate(habits, logs, date);

    if (rate < 100) {
      break;
    }

    streak += 1;
  }

  return streak;
}
