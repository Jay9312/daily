import { useEffect, useMemo, useState } from "react";
import { BottomTabs } from "../components/layout/BottomTabs";
import { AnalyticsScreen } from "../features/analytics/AnalyticsScreen";
import { HabitsHubScreen } from "../features/habits/HabitsHubScreen";
import { HeatmapsScreen } from "../features/heatmaps/HeatmapsScreen";
import { LifeCalendarScreen } from "../features/life-calendar/LifeCalendarScreen";
import { MatrixScreen } from "../features/matrix/MatrixScreen";
import { SettingsScreen } from "../features/settings/SettingsScreen";
import { WidgetPreviewScreen } from "../features/widgets/WidgetPreviewScreen";
import { AppProvider, useDaily } from "./AppProvider";
import { findRoute, moreRoutes, normalizePath, type RouteDefinition } from "./routes";

function getHashPath() {
  return normalizePath(window.location.hash.replace(/^#/, ""));
}

function useHashRoute() {
  const [path, setPath] = useState(() => getHashPath());

  useEffect(() => {
    const handleHashChange = () => setPath(getHashPath());
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  return useMemo(() => findRoute(path), [path]);
}

function hexToRgb(hex: string) {
  const clean = hex.replace("#", "");

  if (clean.length !== 6) {
    return "53 243 199";
  }

  const red = Number.parseInt(clean.slice(0, 2), 16);
  const green = Number.parseInt(clean.slice(2, 4), 16);
  const blue = Number.parseInt(clean.slice(4, 6), 16);

  return `${red} ${green} ${blue}`;
}

function resolveTheme(theme: "dark" | "light" | "system") {
  if (theme !== "system") {
    return theme;
  }

  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

function useThemeSync() {
  const { data } = useDaily();

  useEffect(() => {
    const root = document.documentElement;
    const themeMeta = document.querySelector('meta[name="theme-color"]');

    const applyTheme = () => {
      const resolvedTheme = resolveTheme(data.settings.theme);
      const themeColor = resolvedTheme === "light" ? "#eff6f4" : "#071312";

      root.dataset.theme = resolvedTheme;
      root.style.setProperty("--daily-mint", hexToRgb(data.settings.accentColor));
      themeMeta?.setAttribute("content", themeColor);
    };

    applyTheme();

    if (data.settings.theme !== "system") {
      return undefined;
    }

    const query = window.matchMedia("(prefers-color-scheme: light)");
    query.addEventListener("change", applyTheme);
    return () => query.removeEventListener("change", applyTheme);
  }, [data.settings.accentColor, data.settings.theme]);
}

function MoreScreen() {
  return (
    <section className="space-y-3">
      {moreRoutes.map((item) => {
        const Icon = item.icon;

        return (
          <a
            key={item.id}
            href={`#${item.path}`}
            className="flex items-center gap-4 rounded-[28px] border border-white/10 bg-white/[0.06] p-4 shadow-soft"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-daily-mint/15 text-daily-mint">
              <Icon className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-base font-semibold">{item.label}</span>
              <span className="mt-1 block text-sm text-daily-muted">{item.subtitle}</span>
            </span>
          </a>
        );
      })}
    </section>
  );
}

function ScreenContent({ route }: { route: RouteDefinition }) {
  if (route.id === "today" || route.id === "calendar") {
    return <LifeCalendarScreen />;
  }

  if (route.id === "habits") {
    return <HabitsHubScreen />;
  }

  if (route.id === "matrix") {
    return <MatrixScreen />;
  }

  if (route.id === "analytics") {
    return <AnalyticsScreen />;
  }

  if (route.id === "heatmaps") {
    return <HeatmapsScreen />;
  }

  if (route.id === "widgets") {
    return <WidgetPreviewScreen />;
  }

  if (route.id === "settings") {
    return <SettingsScreen />;
  }

  return <MoreScreen />;
}

function DailyShell() {
  const route = useHashRoute();
  const { data } = useDaily();
  useThemeSync();

  return (
    <div className="min-h-screen bg-daily-bg text-daily-ink">
      <main
        className={`mx-auto min-h-screen max-w-md px-5 pb-[calc(env(safe-area-inset-bottom)+92px)] pt-[calc(env(safe-area-inset-top)+28px)] ${
          data.settings.compactMode ? "space-y-3" : ""
        }`}
      >
        <header className="mb-6">
          <p className="text-sm font-medium text-daily-mint">Daily</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-normal">{route.label}</h1>
          <p className="mt-2 text-sm leading-6 text-daily-muted">{route.subtitle}</p>
        </header>
        <ScreenContent route={route} />
      </main>
      <BottomTabs activeRoute={route} />
    </div>
  );
}

export function App() {
  return (
    <AppProvider>
      <DailyShell />
    </AppProvider>
  );
}
