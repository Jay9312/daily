import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { appReducer } from "./appReducer";
import {
  exportDailyData,
  hasStoredDailyData,
  importDailyData,
  loadDailyData,
  saveDailyData,
} from "../storage";
import { fetchRemoteDailyData, saveRemoteDailyData } from "../supabase/dailySync";
import { isSupabaseConfigured, supabase } from "../supabase/client";
import type {
  AppSettings,
  DailyData,
  EntityId,
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
  ScheduleItemUpdateInput,
  TaskUpdateInput,
} from "../types";

interface UpsertHabitLogInput {
  habitId: EntityId;
  date: ISODateString;
  done: boolean;
  memo?: string;
  mood?: Mood | null;
}

type SyncStatus = "local" | "signed_out" | "syncing" | "synced" | "error";

interface SyncState {
  enabled: boolean;
  status: SyncStatus;
  email: string | null;
  message: string;
  lastSyncedAt: string | null;
}

interface DailyActions {
  addHabit: (input: NewHabitInput) => void;
  updateHabit: (id: EntityId, input: HabitUpdateInput) => void;
  archiveHabit: (id: EntityId, archived?: boolean) => void;
  deleteHabit: (id: EntityId) => void;
  upsertHabitLog: (input: UpsertHabitLogInput) => void;
  addTask: (input: NewTaskInput) => void;
  updateTask: (id: EntityId, input: TaskUpdateInput) => void;
  deleteTask: (id: EntityId) => void;
  addGoal: (input: NewGoalInput) => void;
  updateGoal: (id: EntityId, input: GoalUpdateInput) => void;
  deleteGoal: (id: EntityId) => void;
  addScheduleItem: (input: NewScheduleItemInput) => void;
  updateScheduleItem: (id: EntityId, input: ScheduleItemUpdateInput) => void;
  deleteScheduleItem: (id: EntityId) => void;
  updateSettings: (input: Partial<AppSettings>) => void;
  signInToSupabase: (email: string, password: string) => Promise<void>;
  signUpToSupabase: (email: string, password: string) => Promise<void>;
  signOutOfSupabase: () => Promise<void>;
  syncNow: () => Promise<void>;
  importData: (json: string) => void;
  exportData: () => string;
  resetData: () => void;
}

interface DailyContextValue {
  data: DailyData;
  activeHabits: Habit[];
  archivedHabits: Habit[];
  getLogsByDate: (date: ISODateString) => HabitLog[];
  sync: SyncState;
  actions: DailyActions;
}

const DailyContext = createContext<DailyContextValue | null>(null);

const initialSyncState: SyncState = {
  enabled: isSupabaseConfigured,
  status: isSupabaseConfigured ? "signed_out" : "local",
  email: null,
  message: isSupabaseConfigured ? "Sign in to sync with Supabase." : "Supabase is not configured.",
  lastSyncedAt: null,
};

function isRemoteNewer(remote: DailyData, local: DailyData) {
  return new Date(remote.updatedAt).getTime() > new Date(local.updatedAt).getTime();
}

export function AppProvider({ children }: { children: ReactNode }) {
  const hadLocalDataAtStart = useRef(hasStoredDailyData());
  const [data, dispatch] = useReducer(appReducer, undefined, loadDailyData);
  const [sync, setSync] = useState<SyncState>(initialSyncState);
  const isFirstPersist = useRef(true);
  const isApplyingRemote = useRef(false);
  const dataRef = useRef(data);
  const userIdRef = useRef<string | null>(null);
  const saveTimerRef = useRef<number | null>(null);

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  const pushRemote = useCallback(async (nextData: DailyData) => {
    const userId = userIdRef.current;

    if (!userId || !supabase) {
      return;
    }

    setSync((current) => ({ ...current, status: "syncing", message: "Syncing to Supabase..." }));

    try {
      await saveRemoteDailyData(userId, nextData);
      setSync((current) => ({
        ...current,
        status: "synced",
        message: "Synced with Supabase.",
        lastSyncedAt: new Date().toISOString(),
      }));
    } catch (error) {
      setSync((current) => ({
        ...current,
        status: "error",
        message: error instanceof Error ? error.message : "Supabase sync failed.",
      }));
    }
  }, []);

  const queueRemoteSave = useCallback(
    (nextData: DailyData) => {
      if (!userIdRef.current || !supabase) {
        return;
      }

      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current);
      }

      saveTimerRef.current = window.setTimeout(() => {
        void pushRemote(nextData);
      }, 800);
    },
    [pushRemote],
  );

  const reconcileRemote = useCallback(
    async (userId: string, email: string | null, forcePush = false) => {
      if (!supabase) {
        return;
      }

      userIdRef.current = userId;
      setSync((current) => ({
        ...current,
        status: "syncing",
        email,
        message: "Loading Supabase data...",
      }));

      try {
        const remoteRow = await fetchRemoteDailyData(userId);
        const localData = dataRef.current;

        if (!forcePush && remoteRow?.data && (!hadLocalDataAtStart.current || isRemoteNewer(remoteRow.data, localData))) {
          isApplyingRemote.current = true;
          dispatch({ type: "data/replace", data: remoteRow.data });
        } else {
          await saveRemoteDailyData(userId, localData);
        }

        hadLocalDataAtStart.current = true;
        setSync({
          enabled: true,
          status: "synced",
          email,
          message: "Synced with Supabase.",
          lastSyncedAt: new Date().toISOString(),
        });
      } catch (error) {
        setSync((current) => ({
          ...current,
          status: "error",
          email,
          message: error instanceof Error ? error.message : "Supabase sync failed.",
        }));
      }
    },
    [],
  );

  useEffect(() => {
    if (!supabase) {
      return undefined;
    }

    let mounted = true;

    supabase.auth.getSession().then(({ data: authData }) => {
      if (!mounted) {
        return;
      }

      const session = authData.session;
      if (!session?.user) {
        setSync((current) => ({
          ...current,
          status: "signed_out",
          email: null,
          message: "Sign in to sync with Supabase.",
        }));
        return;
      }

      void reconcileRemote(session.user.id, session.user.email ?? null);
    });

    const { data: subscriptionData } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        userIdRef.current = null;
        setSync((current) => ({
          ...current,
          status: "signed_out",
          email: null,
          message: "Signed out. Data is local on this device.",
        }));
        return;
      }

      void reconcileRemote(session.user.id, session.user.email ?? null);
    });

    return () => {
      mounted = false;
      subscriptionData.subscription.unsubscribe();
    };
  }, [reconcileRemote]);

  useEffect(() => {
    if (isFirstPersist.current) {
      isFirstPersist.current = false;
      return;
    }

    saveDailyData(data);

    if (isApplyingRemote.current) {
      isApplyingRemote.current = false;
      return;
    }

    queueRemoteSave(data);
  }, [data, queueRemoteSave]);

  const activeHabits = useMemo(
    () => data.habits.filter((habit) => !habit.archived),
    [data.habits],
  );

  const archivedHabits = useMemo(
    () => data.habits.filter((habit) => habit.archived),
    [data.habits],
  );

  const getLogsByDate = useCallback(
    (date: ISODateString) => data.habitLogs.filter((log) => log.date === date),
    [data.habitLogs],
  );

  const actions = useMemo<DailyActions>(
    () => ({
      addHabit: (input) => dispatch({ type: "habit/add", input }),
      updateHabit: (id, input) => dispatch({ type: "habit/update", id, input }),
      archiveHabit: (id, archived = true) => dispatch({ type: "habit/archive", id, archived }),
      deleteHabit: (id) => dispatch({ type: "habit/delete", id }),
      upsertHabitLog: (input) => dispatch({ type: "habitLog/upsert", input }),
      addTask: (input) => dispatch({ type: "task/add", input }),
      updateTask: (id, input) => dispatch({ type: "task/update", id, input }),
      deleteTask: (id) => dispatch({ type: "task/delete", id }),
      addGoal: (input) => dispatch({ type: "goal/add", input }),
      updateGoal: (id, input) => dispatch({ type: "goal/update", id, input }),
      deleteGoal: (id) => dispatch({ type: "goal/delete", id }),
      addScheduleItem: (input) => dispatch({ type: "schedule/add", input }),
      updateScheduleItem: (id, input) => dispatch({ type: "schedule/update", id, input }),
      deleteScheduleItem: (id) => dispatch({ type: "schedule/delete", id }),
      updateSettings: (input) => dispatch({ type: "settings/update", input }),
      signInToSupabase: async (email, password) => {
        if (!supabase) {
          throw new Error("Supabase is not configured.");
        }

        setSync((current) => ({ ...current, status: "syncing", message: "Signing in..." }));
        const { data: authData, error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
          setSync((current) => ({ ...current, status: "error", message: error.message }));
          throw error;
        }

        if (authData.user) {
          await reconcileRemote(authData.user.id, authData.user.email ?? email);
        }
      },
      signUpToSupabase: async (email, password) => {
        if (!supabase) {
          throw new Error("Supabase is not configured.");
        }

        setSync((current) => ({ ...current, status: "syncing", message: "Creating account..." }));
        const { data: authData, error } = await supabase.auth.signUp({ email, password });

        if (error) {
          setSync((current) => ({ ...current, status: "error", message: error.message }));
          throw error;
        }

        if (authData.session?.user) {
          await reconcileRemote(authData.session.user.id, authData.session.user.email ?? email, true);
          return;
        }

        setSync((current) => ({
          ...current,
          status: "signed_out",
          email,
          message: "Account created. Check your email if confirmation is required, then sign in.",
        }));
      },
      signOutOfSupabase: async () => {
        if (!supabase) {
          return;
        }

        await supabase.auth.signOut();
        userIdRef.current = null;
        setSync((current) => ({
          ...current,
          status: "signed_out",
          email: null,
          message: "Signed out. Data is local on this device.",
        }));
      },
      syncNow: async () => {
        if (!userIdRef.current) {
          setSync((current) => ({ ...current, message: "Sign in before syncing." }));
          return;
        }

        await reconcileRemote(userIdRef.current, sync.email, true);
      },
      importData: (json) => dispatch({ type: "data/replace", data: importDailyData(json) }),
      exportData: () => exportDailyData(data),
      resetData: () => dispatch({ type: "data/reset" }),
    }),
    [data, reconcileRemote, sync.email],
  );

  const value = useMemo<DailyContextValue>(
    () => ({
      data,
      activeHabits,
      archivedHabits,
      getLogsByDate,
      sync,
      actions,
    }),
    [actions, activeHabits, archivedHabits, data, getLogsByDate, sync],
  );

  return <DailyContext.Provider value={value}>{children}</DailyContext.Provider>;
}

export function useDaily() {
  const context = useContext(DailyContext);

  if (!context) {
    throw new Error("useDaily must be used inside AppProvider.");
  }

  return context;
}
