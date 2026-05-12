import { useRef, useState, type ReactNode } from "react";
import {
  Cloud,
  Download,
  FileUp,
  LogIn,
  LogOut,
  Moon,
  Palette,
  RefreshCcw,
  RotateCcw,
  Smartphone,
  Sun,
} from "lucide-react";
import { useDaily } from "../../app/AppProvider";
import type { CalendarTheme, ThemeMode } from "../../types";

const themeOptions: Array<{ id: ThemeMode; label: string; Icon: typeof Moon }> = [
  { id: "dark", label: "Dark", Icon: Moon },
  { id: "light", label: "Light", Icon: Sun },
  { id: "system", label: "System", Icon: Smartphone },
];

const accentColors = ["#35f3c7", "#22d3ee", "#a7f3d0", "#f472b6", "#c084fc", "#facc15"];
const calendarThemes: Array<{ id: CalendarTheme; label: string }> = [
  { id: "mint", label: "Mint" },
  { id: "cyan", label: "Cyan" },
  { id: "violet", label: "Violet" },
  { id: "mono", label: "Mono" },
];

function SettingCard({ children }: { children: ReactNode }) {
  return <section className="rounded-[30px] border border-white/10 bg-white/[0.06] p-4 shadow-soft">{children}</section>;
}

function ToggleRow({
  label,
  caption,
  checked,
  onChange,
}: {
  label: string;
  caption: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button type="button" onClick={() => onChange(!checked)} className="flex w-full items-center justify-between gap-4 text-left">
      <span>
        <span className="block font-semibold">{label}</span>
        <span className="mt-1 block text-xs leading-5 text-daily-muted">{caption}</span>
      </span>
      <span className={`flex h-8 w-14 items-center rounded-full p-1 transition ${checked ? "bg-daily-mint" : "bg-white/[0.12]"}`}>
        <span className={`h-6 w-6 rounded-full bg-white transition ${checked ? "translate-x-6" : "translate-x-0"}`} />
      </span>
    </button>
  );
}

export function SettingsScreen() {
  const { data, sync, actions } = useDaily();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [importStatus, setImportStatus] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState("");

  const downloadExport = () => {
    const blob = new Blob([actions.exportData()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `daily-export-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const importFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        actions.importData(String(reader.result));
        setImportStatus("Import complete.");
      } catch {
        setImportStatus("Import failed. Check that the file is a Daily JSON export.");
      }
    };
    reader.readAsText(file);
  };

  const resetData = () => {
    if (window.confirm("Reset all local Daily data to the starter data? Current records will be lost.")) {
      actions.resetData();
      setImportStatus("Data reset.");
    }
  };

  const runAuth = async (mode: "sign-in" | "sign-up") => {
    setAuthBusy(true);
    setAuthError("");

    try {
      if (mode === "sign-in") {
        await actions.signInToSupabase(authEmail.trim(), authPassword);
      } else {
        await actions.signUpToSupabase(authEmail.trim(), authPassword);
      }
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Supabase authentication failed.");
    } finally {
      setAuthBusy(false);
    }
  };

  return (
    <section className="space-y-5">
      <SettingCard>
        <div className="mb-4 flex items-center gap-2">
          <Cloud className="h-5 w-5 text-daily-mint" />
          <h2 className="text-lg font-semibold">Supabase Sync</h2>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
          <p className="text-sm font-semibold">
            {sync.email ? sync.email : sync.enabled ? "Not signed in" : "Local only"}
          </p>
          <p className="mt-1 text-xs leading-5 text-daily-muted">{sync.message}</p>
          {sync.lastSyncedAt && (
            <p className="mt-1 text-[11px] text-daily-muted">
              Last synced {new Date(sync.lastSyncedAt).toLocaleString()}
            </p>
          )}
        </div>

        {!sync.email ? (
          <div className="mt-3 space-y-2">
            <input
              type="email"
              value={authEmail}
              onChange={(event) => setAuthEmail(event.target.value)}
              placeholder="Email"
              className="min-h-12 w-full rounded-2xl border border-white/10 bg-black/20 px-4 text-sm outline-none placeholder:text-daily-muted focus:border-daily-mint/60"
            />
            <input
              type="password"
              value={authPassword}
              onChange={(event) => setAuthPassword(event.target.value)}
              placeholder="Password"
              className="min-h-12 w-full rounded-2xl border border-white/10 bg-black/20 px-4 text-sm outline-none placeholder:text-daily-muted focus:border-daily-mint/60"
            />
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={authBusy || !authEmail || authPassword.length < 6}
                onClick={() => void runAuth("sign-in")}
                className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-daily-mint text-sm font-semibold text-daily-bg disabled:opacity-40"
              >
                <LogIn className="h-4 w-4" />
                Sign in
              </button>
              <button
                type="button"
                disabled={authBusy || !authEmail || authPassword.length < 6}
                onClick={() => void runAuth("sign-up")}
                className="min-h-12 rounded-2xl border border-white/10 bg-white/5 text-sm font-semibold disabled:opacity-40"
              >
                Sign up
              </button>
            </div>
            {authError && <p className="text-xs leading-5 text-red-200">{authError}</p>}
          </div>
        ) : (
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => void actions.syncNow()}
              className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-daily-mint text-sm font-semibold text-daily-bg"
            >
              <RefreshCcw className="h-4 w-4" />
              Sync now
            </button>
            <button
              type="button"
              onClick={() => void actions.signOutOfSupabase()}
              className="flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 text-sm font-semibold"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        )}
      </SettingCard>

      <SettingCard>
        <div className="mb-4 flex items-center gap-2">
          <Palette className="h-5 w-5 text-daily-mint" />
          <h2 className="text-lg font-semibold">Appearance</h2>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {themeOptions.map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => actions.updateSettings({ theme: id })}
              className={`min-h-20 rounded-2xl border p-3 text-sm font-semibold ${
                data.settings.theme === id ? "border-daily-mint bg-daily-mint/15 text-daily-mint" : "border-white/10 bg-black/15 text-daily-muted"
              }`}
            >
              <Icon className="mx-auto mb-2 h-5 w-5" />
              {label}
            </button>
          ))}
        </div>

        <div className="mt-5">
          <p className="mb-3 text-sm font-semibold">Accent color</p>
          <div className="flex flex-wrap gap-2">
            {accentColors.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => actions.updateSettings({ accentColor: color })}
                className={`h-10 w-10 rounded-full border-2 ${data.settings.accentColor === color ? "border-white" : "border-transparent"}`}
                style={{ backgroundColor: color }}
                aria-label={`${color} accent color`}
              />
            ))}
          </div>
        </div>

        <div className="mt-5">
          <p className="mb-3 text-sm font-semibold">Calendar theme</p>
          <div className="grid grid-cols-4 gap-2">
            {calendarThemes.map((theme) => (
              <button
                key={theme.id}
                type="button"
                onClick={() => actions.updateSettings({ calendarTheme: theme.id })}
                className={`min-h-12 rounded-2xl border text-xs font-semibold ${
                  data.settings.calendarTheme === theme.id ? "border-daily-cyan bg-daily-cyan/15 text-daily-cyan" : "border-white/10 bg-black/15 text-daily-muted"
                }`}
              >
                {theme.label}
              </button>
            ))}
          </div>
        </div>
      </SettingCard>

      <SettingCard>
        <div className="space-y-4">
          <ToggleRow
            label="Compact mode"
            caption="Use tighter spacing for repeated daily views."
            checked={data.settings.compactMode}
            onChange={(compactMode) => actions.updateSettings({ compactMode })}
          />
          <ToggleRow
            label="Swipe quick complete"
            caption="Keep swipe gestures enabled on the Today screen."
            checked={data.settings.swipeEnabled}
            onChange={(swipeEnabled) => actions.updateSettings({ swipeEnabled })}
          />
        </div>
      </SettingCard>

      <SettingCard>
        <p className="mb-3 text-lg font-semibold">Widget quote</p>
        <textarea
          value={data.settings.widgetQuote}
          onChange={(event) => actions.updateSettings({ widgetQuote: event.target.value })}
          className="min-h-24 w-full resize-none rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm leading-6 outline-none focus:border-daily-mint/60"
        />
      </SettingCard>

      <SettingCard>
        <p className="mb-4 text-lg font-semibold">Data</p>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={downloadExport}
            className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-daily-mint text-sm font-semibold text-daily-bg"
          >
            <Download className="h-4 w-4" />
            Export
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 text-sm font-semibold"
          >
            <FileUp className="h-4 w-4" />
            Import
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) {
              importFile(file);
            }
            event.target.value = "";
          }}
        />
        {importStatus && <p className="mt-3 text-sm text-daily-muted">{importStatus}</p>}
        <button
          type="button"
          onClick={resetData}
          className="mt-3 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-red-400/20 bg-red-500/10 text-sm font-semibold text-red-200"
        >
          <RefreshCcw className="h-4 w-4" />
          Reset all data
        </button>
      </SettingCard>

      <SettingCard>
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-daily-cyan/15 text-daily-cyan">
            <RotateCcw className="h-5 w-5" />
          </span>
          <div>
            <p className="font-semibold">Native roadmap</p>
            <p className="mt-2 text-sm leading-6 text-daily-muted">
              iOS widgets, Shortcuts automation, native notifications, and EventKit integration stay reserved for the
              future SwiftUI version.
            </p>
          </div>
        </div>
      </SettingCard>

      <p className="px-1 text-center text-xs text-daily-muted">Daily 0.1.0 - PWA + Supabase optional sync</p>
    </section>
  );
}
