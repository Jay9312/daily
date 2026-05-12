import { getLocalDateKey } from "./domain/date";
import type { AppSettings, DailyData, Goal, Habit, ScheduleItem, Task } from "./types";

export const DAILY_SCHEMA_VERSION = 2;

export const defaultSettings: AppSettings = {
  theme: "dark",
  accentColor: "#35f3c7",
  calendarTheme: "mint",
  widgetQuote: "오늘의 점들이 모여 후회 없는 내일이 되도록",
  lifeBirthDate: null,
  compactMode: false,
  swipeEnabled: true,
};

const timestamp = (offsetMinutes = 0) =>
  new Date(Date.now() + offsetMinutes * 60_000).toISOString();

export function createSeedData(): DailyData {
  const createdAt = timestamp(-90);
  const now = timestamp();
  const today = getLocalDateKey();

  const habits: Habit[] = [
    {
      id: "habit-morning-water",
      name: "아침 물 한 잔",
      icon: "Droplets",
      color: "#35f3c7",
      goal: "일어나서 바로 물 마시기",
      startDate: today,
      endDate: null,
      repeat: "daily",
      reminderTime: "07:30",
      priorityQuadrant: "do_first",
      order: 1,
      archived: false,
      detailMemo: "컨디션을 깨우는 가장 작은 시작점.",
      createdAt,
      updatedAt: now,
    },
    {
      id: "habit-reading",
      name: "독서",
      icon: "BookOpen",
      color: "#22d3ee",
      goal: "하루 15분 읽기",
      startDate: today,
      endDate: null,
      repeat: "daily",
      reminderTime: "22:00",
      priorityQuadrant: "schedule",
      order: 2,
      archived: false,
      detailMemo: "짧게라도 매일 이어가는 것을 우선한다.",
      createdAt,
      updatedAt: now,
    },
    {
      id: "habit-workout",
      name: "운동",
      icon: "Dumbbell",
      color: "#a7f3d0",
      goal: "가볍게라도 몸 움직이기",
      startDate: today,
      endDate: null,
      repeat: "weekly",
      reminderTime: "19:00",
      priorityQuadrant: "do_first",
      order: 3,
      archived: false,
      detailMemo: "완벽한 루틴보다 빠지지 않는 리듬.",
      createdAt,
      updatedAt: now,
    },
  ];

  const tasks: Task[] = [
    {
      id: "task-review-week",
      title: "이번 주 루틴 점검",
      quadrant: "schedule",
      done: false,
      startDate: today,
      endDate: null,
      repeat: "none",
      dueDate: today,
      memo: "분석 화면에서 실패 패턴을 확인한다.",
      createdAt,
      updatedAt: now,
    },
  ];

  const goals: Goal[] = [
    {
      id: "goal-year-dots",
      title: "2026년 점들을 꾸준히 채우기",
      color: "#35f3c7",
      startDate: today,
      endDate: null,
      repeat: "weekly",
      done: false,
      memo: "주마다 기록 흐름을 점검한다.",
      createdAt,
      updatedAt: now,
    },
  ];

  const scheduleItems: ScheduleItem[] = [
    {
      id: "schedule-native-placeholder",
      title: "Apple Calendar / Reminders 연동 준비",
      source: "apple_calendar",
      externalId: null,
      startDate: today,
      endDate: null,
      startTime: null,
      endTime: null,
      repeat: "none",
      memo: "PWA에서는 직접 연동이 불가능하며 SwiftUI 전환 시 EventKit으로 연결합니다.",
      createdAt,
      updatedAt: now,
    },
  ];

  return {
    schemaVersion: DAILY_SCHEMA_VERSION,
    habits,
    habitLogs: [],
    tasks,
    goals,
    scheduleItems,
    settings: defaultSettings,
    createdAt,
    updatedAt: now,
  };
}
