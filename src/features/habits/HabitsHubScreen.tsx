import { useState } from "react";
import { HabitsScreen } from "./HabitsScreen";
import { TodayScreen } from "../today/TodayScreen";

type HabitsMode = "today" | "manage";

const modes: Array<{ id: HabitsMode; label: string }> = [
  { id: "today", label: "Today" },
  { id: "manage", label: "Manage" },
];

export function HabitsHubScreen() {
  const [mode, setMode] = useState<HabitsMode>("today");

  return (
    <section className="space-y-4">
      <div className="grid grid-cols-2 rounded-full border border-white/10 bg-white/[0.06] p-1">
        {modes.map((item) => {
          const isActive = mode === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setMode(item.id)}
              className={`min-h-11 rounded-full text-sm font-semibold transition ${
                isActive ? "bg-daily-mint text-daily-bg" : "text-daily-muted"
              }`}
              aria-pressed={isActive}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {mode === "today" ? <TodayScreen /> : <HabitsScreen />}
    </section>
  );
}
