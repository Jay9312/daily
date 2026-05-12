import { createSeedData, DAILY_SCHEMA_VERSION, defaultSettings } from "./seedData";
import type {
  AppSettings,
  DailyData,
  EntityId,
  Goal,
  GoalUpdateInput,
  Habit,
  HabitLog,
  HabitUpdateInput,
  ISODateString,
  Mood,
  NewGoalInput,
  NewHabitInput,
  NewScheduleItemInput,
  NewTaskInput,
  ScheduleItem,
  ScheduleItemUpdateInput,
  Task,
  TaskUpdateInput,
} from "./types";

const STORAGE_KEY = "daily.app.v1";

type DataUpdater = (current: DailyData) => DailyData;

function now() {
  return new Date().toISOString();
}

function createId(prefix: string) {
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);

  return `${prefix}-${id}`;
}

function cloneData(data: DailyData): DailyData {
  return JSON.parse(JSON.stringify(data)) as DailyData;
}

function getStorage() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function hasStoredDailyData() {
  const storage = getStorage();
  return Boolean(storage?.getItem(STORAGE_KEY));
}

function sortHabits(habits: Habit[]) {
  return [...habits].sort((a, b) => a.order - b.order || a.createdAt.localeCompare(b.createdAt));
}

function normalizeHabit(habit: Habit): Habit {
  return {
    ...habit,
    startDate: habit.startDate ?? habit.createdAt.slice(0, 10),
    endDate: habit.endDate ?? null,
    repeat: habit.repeat ?? "daily",
  };
}

function normalizeTask(task: Task): Task {
  return {
    ...task,
    startDate: task.startDate ?? task.dueDate ?? task.createdAt.slice(0, 10),
    endDate: task.endDate ?? null,
    repeat: task.repeat ?? "none",
  };
}

function normalizeGoal(goal: Goal): Goal {
  return {
    ...goal,
    startDate: goal.startDate ?? goal.createdAt.slice(0, 10),
    endDate: goal.endDate ?? null,
    repeat: goal.repeat ?? "none",
    done: goal.done ?? false,
  };
}

function normalizeScheduleItem(item: ScheduleItem): ScheduleItem {
  return {
    ...item,
    source: item.source ?? "local",
    externalId: item.externalId ?? null,
    endDate: item.endDate ?? null,
    startTime: item.startTime ?? null,
    endTime: item.endTime ?? null,
    repeat: item.repeat ?? "none",
  };
}

export function normalizeData(data: Partial<DailyData>): DailyData {
  const seed = createSeedData();
  const normalized: DailyData = {
    schemaVersion: DAILY_SCHEMA_VERSION,
    habits: Array.isArray(data.habits) ? sortHabits(data.habits.map(normalizeHabit)) : seed.habits,
    habitLogs: Array.isArray(data.habitLogs) ? data.habitLogs : seed.habitLogs,
    tasks: Array.isArray(data.tasks) ? data.tasks.map(normalizeTask) : seed.tasks,
    goals: Array.isArray(data.goals) ? data.goals.map(normalizeGoal) : seed.goals,
    scheduleItems: Array.isArray(data.scheduleItems)
      ? data.scheduleItems.map(normalizeScheduleItem)
      : seed.scheduleItems,
    settings: {
      ...defaultSettings,
      ...(data.settings ?? {}),
    },
    createdAt: data.createdAt ?? seed.createdAt,
    updatedAt: data.updatedAt ?? now(),
  };

  return normalized;
}

export function loadDailyData(): DailyData {
  const storage = getStorage();

  if (!storage) {
    return createSeedData();
  }

  const raw = storage.getItem(STORAGE_KEY);
  if (!raw) {
    const seed = createSeedData();
    saveDailyData(seed);
    return seed;
  }

  try {
    return normalizeData(JSON.parse(raw) as Partial<DailyData>);
  } catch {
    const seed = createSeedData();
    saveDailyData(seed);
    return seed;
  }
}

export function saveDailyData(data: DailyData): DailyData {
  const storage = getStorage();
  const next = normalizeData({
    ...data,
    updatedAt: now(),
  });

  if (storage) {
    storage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  return cloneData(next);
}

export function updateDailyData(updater: DataUpdater): DailyData {
  const current = loadDailyData();
  const next = updater(cloneData(current));
  return saveDailyData(next);
}

export function resetDailyData(): DailyData {
  const seed = createSeedData();
  return saveDailyData(seed);
}

export function exportDailyData(data = loadDailyData()): string {
  return JSON.stringify(normalizeData(data), null, 2);
}

export function importDailyData(json: string): DailyData {
  const parsed = JSON.parse(json) as Partial<DailyData>;
  return saveDailyData(normalizeData(parsed));
}

export function addHabit(input: NewHabitInput): Habit {
  const createdAt = now();
  let createdHabit!: Habit;

  updateDailyData((current) => {
    const maxOrder = current.habits.reduce((max, habit) => Math.max(max, habit.order), 0);
    createdHabit = {
      ...input,
      startDate: input.startDate ?? createdAt.slice(0, 10),
      endDate: input.endDate ?? null,
      repeat: input.repeat ?? "daily",
      id: createId("habit"),
      order: maxOrder + 1,
      archived: false,
      createdAt,
      updatedAt: createdAt,
    };

    return {
      ...current,
      habits: sortHabits([...current.habits, createdHabit]),
    };
  });

  return createdHabit;
}

export function updateHabit(id: EntityId, input: HabitUpdateInput): Habit | null {
  let updatedHabit: Habit | null = null;

  updateDailyData((current) => {
    const habits = current.habits.map((habit) => {
      if (habit.id !== id) {
        return habit;
      }

      updatedHabit = {
        ...habit,
        ...input,
        updatedAt: now(),
      };

      return updatedHabit;
    });

    return {
      ...current,
      habits: sortHabits(habits),
    };
  });

  return updatedHabit;
}

export function archiveHabit(id: EntityId, archived = true): Habit | null {
  return updateHabit(id, { archived });
}

export function deleteHabit(id: EntityId): DailyData {
  return updateDailyData((current) => ({
    ...current,
    habits: current.habits.filter((habit) => habit.id !== id),
    habitLogs: current.habitLogs.filter((log) => log.habitId !== id),
  }));
}

export function upsertHabitLog(input: {
  habitId: EntityId;
  date: ISODateString;
  done: boolean;
  memo?: string;
  mood?: Mood | null;
}): HabitLog {
  const updatedAt = now();
  let nextLog!: HabitLog;

  updateDailyData((current) => {
    const existing = current.habitLogs.find(
      (log) => log.habitId === input.habitId && log.date === input.date,
    );

    if (existing) {
      nextLog = {
        ...existing,
        done: input.done,
        memo: input.memo ?? existing.memo,
        mood: input.mood ?? existing.mood,
        completedAt: input.done ? existing.completedAt ?? updatedAt : null,
        updatedAt,
      };

      return {
        ...current,
        habitLogs: current.habitLogs.map((log) => (log.id === existing.id ? nextLog! : log)),
      };
    }

    nextLog = {
      id: createId("log"),
      habitId: input.habitId,
      date: input.date,
      done: input.done,
      memo: input.memo ?? "",
      completedAt: input.done ? updatedAt : null,
      mood: input.mood ?? null,
      createdAt: updatedAt,
      updatedAt,
    };

    return {
      ...current,
      habitLogs: [...current.habitLogs, nextLog],
    };
  });

  return nextLog;
}

export function addTask(input: NewTaskInput): Task {
  const createdAt = now();
  let createdTask!: Task;

  updateDailyData((current) => {
    createdTask = {
      ...input,
      id: createId("task"),
      done: false,
      startDate: input.startDate ?? input.dueDate ?? createdAt.slice(0, 10),
      endDate: input.endDate ?? null,
      repeat: input.repeat ?? "none",
      createdAt,
      updatedAt: createdAt,
    };

    return {
      ...current,
      tasks: [...current.tasks, createdTask],
    };
  });

  return createdTask;
}

export function updateTask(id: EntityId, input: TaskUpdateInput): Task | null {
  let updatedTask: Task | null = null;

  updateDailyData((current) => ({
    ...current,
    tasks: current.tasks.map((task) => {
      if (task.id !== id) {
        return task;
      }

      updatedTask = {
        ...task,
        ...input,
        updatedAt: now(),
      };

      return updatedTask;
    }),
  }));

  return updatedTask;
}

export function deleteTask(id: EntityId): DailyData {
  return updateDailyData((current) => ({
    ...current,
    tasks: current.tasks.filter((task) => task.id !== id),
  }));
}

export function addGoal(input: NewGoalInput): Goal {
  const createdAt = now();
  let createdGoal!: Goal;

  updateDailyData((current) => {
    createdGoal = {
      ...input,
      id: createId("goal"),
      done: false,
      createdAt,
      updatedAt: createdAt,
    };

    return {
      ...current,
      goals: [...current.goals, createdGoal],
    };
  });

  return createdGoal;
}

export function updateGoal(id: EntityId, input: GoalUpdateInput): Goal | null {
  let updatedGoal: Goal | null = null;

  updateDailyData((current) => ({
    ...current,
    goals: current.goals.map((goal) => {
      if (goal.id !== id) {
        return goal;
      }

      updatedGoal = {
        ...goal,
        ...input,
        updatedAt: now(),
      };

      return updatedGoal;
    }),
  }));

  return updatedGoal;
}

export function deleteGoal(id: EntityId): DailyData {
  return updateDailyData((current) => ({
    ...current,
    goals: current.goals.filter((goal) => goal.id !== id),
  }));
}

export function addScheduleItem(input: NewScheduleItemInput): ScheduleItem {
  const createdAt = now();
  let createdItem!: ScheduleItem;

  updateDailyData((current) => {
    createdItem = {
      ...input,
      id: createId("schedule"),
      externalId: input.externalId ?? null,
      createdAt,
      updatedAt: createdAt,
    };

    return {
      ...current,
      scheduleItems: [...current.scheduleItems, createdItem],
    };
  });

  return createdItem;
}

export function updateScheduleItem(id: EntityId, input: ScheduleItemUpdateInput): ScheduleItem | null {
  let updatedItem: ScheduleItem | null = null;

  updateDailyData((current) => ({
    ...current,
    scheduleItems: current.scheduleItems.map((item) => {
      if (item.id !== id) {
        return item;
      }

      updatedItem = {
        ...item,
        ...input,
        updatedAt: now(),
      };

      return updatedItem;
    }),
  }));

  return updatedItem;
}

export function deleteScheduleItem(id: EntityId): DailyData {
  return updateDailyData((current) => ({
    ...current,
    scheduleItems: current.scheduleItems.filter((item) => item.id !== id),
  }));
}

export function updateSettings(input: Partial<AppSettings>): AppSettings {
  let settings!: AppSettings;

  updateDailyData((current) => {
    settings = {
      ...current.settings,
      ...input,
    };

    return {
      ...current,
      settings,
    };
  });

  return settings;
}
