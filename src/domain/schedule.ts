import type { ISODateString, RecurrenceFrequency } from "../types";

export const recurrenceOptions: Array<{ id: RecurrenceFrequency; label: string }> = [
  { id: "none", label: "No repeat" },
  { id: "daily", label: "Every day" },
  { id: "weekly", label: "Every week" },
  { id: "biweekly", label: "Every 2 weeks" },
  { id: "four_weekly", label: "Every 4 weeks" },
  { id: "monthly", label: "Every month" },
];

function dateFromKey(dateKey: ISODateString) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function diffDays(startDate: ISODateString, date: ISODateString) {
  const start = dateFromKey(startDate).getTime();
  const target = dateFromKey(date).getTime();
  return Math.floor((target - start) / 86_400_000);
}

export function getRecurrenceLabel(frequency: RecurrenceFrequency) {
  return recurrenceOptions.find((option) => option.id === frequency)?.label ?? "No repeat";
}

export function isScheduledOnDate(input: {
  startDate: ISODateString | null;
  endDate: ISODateString | null;
  repeat: RecurrenceFrequency;
  date: ISODateString;
}) {
  if (!input.startDate) {
    return false;
  }

  if (input.date < input.startDate) {
    return false;
  }

  if (input.endDate && input.date > input.endDate) {
    return false;
  }

  const distance = diffDays(input.startDate, input.date);

  if (input.repeat === "none") {
    return distance === 0;
  }

  if (input.repeat === "daily") {
    return distance >= 0;
  }

  if (input.repeat === "weekly") {
    return distance >= 0 && distance % 7 === 0;
  }

  if (input.repeat === "biweekly") {
    return distance >= 0 && distance % 14 === 0;
  }

  if (input.repeat === "four_weekly") {
    return distance >= 0 && distance % 28 === 0;
  }

  const start = dateFromKey(input.startDate);
  const target = dateFromKey(input.date);
  return start.getDate() === target.getDate();
}
