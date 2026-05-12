import { createSeedData } from "../seedData";
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
} from "../types";

export type DailyAction =
  | { type: "habit/add"; input: NewHabitInput }
  | { type: "habit/update"; id: EntityId; input: HabitUpdateInput }
  | { type: "habit/archive"; id: EntityId; archived: boolean }
  | { type: "habit/delete"; id: EntityId }
  | {
      type: "habitLog/upsert";
      input: {
        habitId: EntityId;
        date: ISODateString;
        done: boolean;
        memo?: string;
        mood?: Mood | null;
      };
    }
  | { type: "task/add"; input: NewTaskInput }
  | { type: "task/update"; id: EntityId; input: TaskUpdateInput }
  | { type: "task/delete"; id: EntityId }
  | { type: "goal/add"; input: NewGoalInput }
  | { type: "goal/update"; id: EntityId; input: GoalUpdateInput }
  | { type: "goal/delete"; id: EntityId }
  | { type: "schedule/add"; input: NewScheduleItemInput }
  | { type: "schedule/update"; id: EntityId; input: ScheduleItemUpdateInput }
  | { type: "schedule/delete"; id: EntityId }
  | { type: "settings/update"; input: Partial<AppSettings> }
  | { type: "data/replace"; data: DailyData }
  | { type: "data/reset" };

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

function sortHabits(habits: Habit[]) {
  return [...habits].sort((a, b) => a.order - b.order || a.createdAt.localeCompare(b.createdAt));
}

function touch(data: DailyData): DailyData {
  return {
    ...data,
    updatedAt: now(),
  };
}

function upsertLog(logs: HabitLog[], input: Extract<DailyAction, { type: "habitLog/upsert" }>["input"]) {
  const updatedAt = now();
  const existing = logs.find((log) => log.habitId === input.habitId && log.date === input.date);

  if (existing) {
    return logs.map((log) =>
      log.id === existing.id
        ? {
            ...existing,
            done: input.done,
            memo: input.memo ?? existing.memo,
            mood: input.mood ?? existing.mood,
            completedAt: input.done ? existing.completedAt ?? updatedAt : null,
            updatedAt,
          }
        : log,
    );
  }

  return [
    ...logs,
    {
      id: createId("log"),
      habitId: input.habitId,
      date: input.date,
      done: input.done,
      memo: input.memo ?? "",
      completedAt: input.done ? updatedAt : null,
      mood: input.mood ?? null,
      createdAt: updatedAt,
      updatedAt,
    },
  ];
}

export function appReducer(state: DailyData, action: DailyAction): DailyData {
  switch (action.type) {
    case "habit/add": {
      const createdAt = now();
      const maxOrder = state.habits.reduce((max, habit) => Math.max(max, habit.order), 0);
      const habit: Habit = {
        ...action.input,
        id: createId("habit"),
        startDate: action.input.startDate ?? createdAt.slice(0, 10),
        endDate: action.input.endDate ?? null,
        repeat: action.input.repeat ?? "daily",
        order: maxOrder + 1,
        archived: false,
        createdAt,
        updatedAt: createdAt,
      };

      return touch({
        ...state,
        habits: sortHabits([...state.habits, habit]),
      });
    }

    case "habit/update":
      return touch({
        ...state,
        habits: sortHabits(
          state.habits.map((habit) =>
            habit.id === action.id ? { ...habit, ...action.input, updatedAt: now() } : habit,
          ),
        ),
      });

    case "habit/archive":
      return appReducer(state, {
        type: "habit/update",
        id: action.id,
        input: { archived: action.archived },
      });

    case "habit/delete":
      return touch({
        ...state,
        habits: state.habits.filter((habit) => habit.id !== action.id),
        habitLogs: state.habitLogs.filter((log) => log.habitId !== action.id),
      });

    case "habitLog/upsert":
      return touch({
        ...state,
        habitLogs: upsertLog(state.habitLogs, action.input),
      });

    case "task/add": {
      const createdAt = now();
      const task: Task = {
        ...action.input,
        id: createId("task"),
        done: false,
        startDate: action.input.startDate ?? action.input.dueDate ?? createdAt.slice(0, 10),
        endDate: action.input.endDate ?? null,
        repeat: action.input.repeat ?? "none",
        createdAt,
        updatedAt: createdAt,
      };

      return touch({
        ...state,
        tasks: [...state.tasks, task],
      });
    }

    case "task/update":
      return touch({
        ...state,
        tasks: state.tasks.map((task) =>
          task.id === action.id ? { ...task, ...action.input, updatedAt: now() } : task,
        ),
      });

    case "task/delete":
      return touch({
        ...state,
        tasks: state.tasks.filter((task) => task.id !== action.id),
      });

    case "goal/add": {
      const createdAt = now();
      const goal: Goal = {
        ...action.input,
        id: createId("goal"),
        done: false,
        createdAt,
        updatedAt: createdAt,
      };

      return touch({
        ...state,
        goals: [...state.goals, goal],
      });
    }

    case "goal/update":
      return touch({
        ...state,
        goals: state.goals.map((goal) =>
          goal.id === action.id ? { ...goal, ...action.input, updatedAt: now() } : goal,
        ),
      });

    case "goal/delete":
      return touch({
        ...state,
        goals: state.goals.filter((goal) => goal.id !== action.id),
      });

    case "schedule/add": {
      const createdAt = now();
      const scheduleItem: ScheduleItem = {
        ...action.input,
        id: createId("schedule"),
        externalId: action.input.externalId ?? null,
        createdAt,
        updatedAt: createdAt,
      };

      return touch({
        ...state,
        scheduleItems: [...state.scheduleItems, scheduleItem],
      });
    }

    case "schedule/update":
      return touch({
        ...state,
        scheduleItems: state.scheduleItems.map((item) =>
          item.id === action.id ? { ...item, ...action.input, updatedAt: now() } : item,
        ),
      });

    case "schedule/delete":
      return touch({
        ...state,
        scheduleItems: state.scheduleItems.filter((item) => item.id !== action.id),
      });

    case "settings/update":
      return touch({
        ...state,
        settings: {
          ...state.settings,
          ...action.input,
        },
      });

    case "data/replace":
      return action.data;

    case "data/reset":
      return createSeedData();

    default:
      return state;
  }
}
