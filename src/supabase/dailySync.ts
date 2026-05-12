import { normalizeData } from "../storage";
import type { DailyData } from "../types";
import { supabase } from "./client";

interface DailyUserDataRow {
  user_id: string;
  data: DailyData;
  updated_at: string;
}

function requireSupabase() {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  return supabase;
}

export async function fetchRemoteDailyData(userId: string) {
  const client = requireSupabase();
  const { data, error } = await client
    .from("daily_user_data")
    .select("user_id,data,updated_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  const row = data as DailyUserDataRow | null;

  if (!row) {
    return null;
  }

  return {
    ...row,
    data: normalizeData(row.data),
  };
}

export async function saveRemoteDailyData(userId: string, data: DailyData) {
  const client = requireSupabase();
  const normalized = normalizeData(data);
  const { error } = await client.from("daily_user_data").upsert(
    {
      user_id: userId,
      data: normalized,
      updated_at: normalized.updatedAt,
    },
    { onConflict: "user_id" },
  );

  if (error) {
    throw error;
  }
}
