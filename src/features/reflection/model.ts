import { addDays, getLocalDateKey } from "../../domain/date";

export type Kind = "day" | "week";
export type Fields = Record<string, string>;

export interface Entry {
  id: string;
  kind: Kind;
  date: string;
  revision: number;
  updatedAt: string;
  fields: Fields;
}

export const questions = {
  day: [
    ["choice", "선택", "오늘 무엇을 선택했고, 그 대신 무엇을 미뤘나?"],
    ["action", "실행", "그 선택을 위해 실제로 무엇을 했나? 눈에 보이게 남은 것은?"],
    ["direction", "방향", "오늘 한 일은 내가 원하는 삶에 가까워지는 데 도움이 됐나? 어떤 장면에서 그렇게 느꼈나?"],
    ["next", "다음 행동", "내일도 같은 선택을 할까? 내 마음을 확인할 작은 행동 하나는?"],
    ["body", "자유 일기", "질문 밖에 남겨두고 싶은 이야기"],
  ],
  week: [
    ["pattern", "반복", "이번 주에 반복한 선택은 무엇이고, 그 대가는 무엇이었나?"],
    ["evidence", "판단", "내가 원한 삶에 가까워졌다고 느낀 날은 언제였나? 반대였던 날과 무엇이 달랐나?"],
    ["experiment", "다음 주 실험", "다음 주에 한 번 바꿔 볼 행동은? 언제 해보고 무엇으로 판단할까?"],
  ],
} as const;

export function localNoon(key: string) {
  return new Date(key + "T12:00:00");
}

export function validDate(key: unknown): key is string {
  return typeof key === "string" && /^\d{4}-\d{2}-\d{2}$/.test(key)
    && getLocalDateKey(localNoon(key)) === key;
}

export function shiftDate(key: string, offset: number) {
  return getLocalDateKey(addDays(localNoon(key), offset));
}

export function monday(key: string) {
  return shiftDate(key, -((localNoon(key).getDay() + 6) % 7));
}

export function hasText(fields: Fields) {
  return Object.values(fields).some(text => text.trim().length > 0);
}

export function sameFields(kind: Kind, left: Fields, right: Fields) {
  return questions[kind].every(([key]) => (left[key] ?? "") === (right[key] ?? ""));
}

export function validFields(kind: Kind, fields: unknown): fields is Fields {
  if (!fields || typeof fields !== "object" || Array.isArray(fields)) return false;
  return Object.entries(fields).every(([id, value]) =>
    questions[kind].some(([key]) => key === id) && typeof value === "string");
}

export function readBackup(text: string): Entry[] {
  const value = JSON.parse(text);
  if (value?.format !== "daily.reflection" || value.version !== 1 || !Array.isArray(value.entries)) {
    throw new Error("성찰 백업 v1 파일을 선택해 주세요.");
  }
  const seen = new Set<string>();
  for (const entry of value.entries) {
    if (!entry || (entry.kind !== "day" && entry.kind !== "week") || !validDate(entry.date)
        || (entry.kind === "week" && monday(entry.date) !== entry.date)
        || entry.id !== entry.kind + "/" + entry.date || seen.has(entry.id)
        || !Number.isSafeInteger(entry.revision) || entry.revision < 1
        || typeof entry.updatedAt !== "string" || !Number.isFinite(Date.parse(entry.updatedAt))
        || !validFields(entry.kind, entry.fields)) {
      throw new Error("백업에 읽을 수 없는 기록이 있습니다. 복원하지 않았습니다.");
    }
    seen.add(entry.id);
  }
  return value.entries;
}
