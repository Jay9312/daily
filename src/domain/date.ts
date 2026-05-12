import type { ISODateString } from "../types";

export function getLocalDateKey(date = new Date()): ISODateString {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function formatKoreanFullDate(date = new Date()) {
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "full",
  }).format(date);
}
