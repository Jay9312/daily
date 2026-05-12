export type ISODateString = string;
export type ISODateTimeString = string;
export type EntityId = string;

export type PriorityQuadrant =
  | "do_first"
  | "schedule"
  | "delegate"
  | "eliminate";

export type ThemeMode = "dark" | "light" | "system";
export type CalendarTheme = "mint" | "cyan" | "violet" | "mono";
export type Mood = "great" | "good" | "neutral" | "tired" | "bad";
export type RecurrenceFrequency = "none" | "daily" | "weekly" | "biweekly" | "four_weekly" | "monthly";
export type ScheduleSource = "local" | "apple_calendar" | "apple_reminders";

export interface Habit {
  id: EntityId;
  name: string;
  icon: string;
  color: string;
  goal: string;
  startDate: ISODateString | null;
  endDate: ISODateString | null;
  repeat: RecurrenceFrequency;
  reminderTime: string | null;
  priorityQuadrant: PriorityQuadrant;
  order: number;
  archived: boolean;
  detailMemo: string;
  createdAt: ISODateTimeString;
  updatedAt: ISODateTimeString;
}

export interface HabitLog {
  id: EntityId;
  habitId: EntityId;
  date: ISODateString;
  done: boolean;
  memo: string;
  completedAt: ISODateTimeString | null;
  mood: Mood | null;
  createdAt: ISODateTimeString;
  updatedAt: ISODateTimeString;
}

export interface Task {
  id: EntityId;
  title: string;
  quadrant: PriorityQuadrant;
  done: boolean;
  startDate: ISODateString | null;
  endDate: ISODateString | null;
  repeat: RecurrenceFrequency;
  dueDate: ISODateString | null;
  memo: string;
  createdAt: ISODateTimeString;
  updatedAt: ISODateTimeString;
}

export interface Goal {
  id: EntityId;
  title: string;
  color: string;
  startDate: ISODateString | null;
  endDate: ISODateString | null;
  repeat: RecurrenceFrequency;
  done: boolean;
  memo: string;
  createdAt: ISODateTimeString;
  updatedAt: ISODateTimeString;
}

export interface ScheduleItem {
  id: EntityId;
  title: string;
  source: ScheduleSource;
  externalId: string | null;
  startDate: ISODateString;
  endDate: ISODateString | null;
  startTime: string | null;
  endTime: string | null;
  repeat: RecurrenceFrequency;
  memo: string;
  createdAt: ISODateTimeString;
  updatedAt: ISODateTimeString;
}

export interface AppSettings {
  theme: ThemeMode;
  accentColor: string;
  calendarTheme: CalendarTheme;
  widgetQuote: string;
  lifeBirthDate: ISODateString | null;
  compactMode: boolean;
  swipeEnabled: boolean;
}

export interface DailyData {
  schemaVersion: number;
  habits: Habit[];
  habitLogs: HabitLog[];
  tasks: Task[];
  goals: Goal[];
  scheduleItems: ScheduleItem[];
  settings: AppSettings;
  createdAt: ISODateTimeString;
  updatedAt: ISODateTimeString;
}

export type NewHabitInput = Pick<
  Habit,
  "name" | "icon" | "color" | "goal" | "reminderTime" | "priorityQuadrant" | "detailMemo"
> &
  Partial<Pick<Habit, "startDate" | "endDate" | "repeat">>;

export type HabitUpdateInput = Partial<
  Pick<
    Habit,
    | "name"
    | "icon"
    | "color"
    | "goal"
    | "startDate"
    | "endDate"
    | "repeat"
    | "reminderTime"
    | "priorityQuadrant"
    | "order"
    | "archived"
    | "detailMemo"
  >
>;

export type NewTaskInput = Pick<Task, "title" | "quadrant" | "dueDate" | "memo"> &
  Partial<Pick<Task, "startDate" | "endDate" | "repeat">>;
export type TaskUpdateInput = Partial<
  Pick<Task, "title" | "quadrant" | "done" | "startDate" | "endDate" | "repeat" | "dueDate" | "memo">
>;

export type NewGoalInput = Pick<Goal, "title" | "color" | "startDate" | "endDate" | "repeat" | "memo">;
export type GoalUpdateInput = Partial<
  Pick<Goal, "title" | "color" | "startDate" | "endDate" | "repeat" | "done" | "memo">
>;

export type NewScheduleItemInput = Pick<
  ScheduleItem,
  "title" | "source" | "startDate" | "endDate" | "startTime" | "endTime" | "repeat" | "memo"
> &
  Partial<Pick<ScheduleItem, "externalId">>;
export type ScheduleItemUpdateInput = Partial<
  Pick<
    ScheduleItem,
    | "title"
    | "source"
    | "externalId"
    | "startDate"
    | "endDate"
    | "startTime"
    | "endTime"
    | "repeat"
    | "memo"
  >
>;
