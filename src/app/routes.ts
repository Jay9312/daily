import {
  BarChart3,
  CalendarDays,
  Grid2X2,
  Grid3X3,
  ListChecks,
  MoreHorizontal,
  Settings,
  Smartphone,
  type LucideIcon,
} from "lucide-react";

export type RouteId =
  | "today"
  | "habits"
  | "calendar"
  | "matrix"
  | "analytics"
  | "heatmaps"
  | "widgets"
  | "settings"
  | "more";

export interface RouteDefinition {
  id: RouteId;
  path: string;
  label: string;
  subtitle: string;
  icon: LucideIcon;
}

export const routes: RouteDefinition[] = [
  {
    id: "today",
    path: "/today",
    label: "Today",
    subtitle: "Todos, habits, goals",
    icon: CalendarDays,
  },
  {
    id: "habits",
    path: "/habits",
    label: "Habits",
    subtitle: "Today routine and habit management",
    icon: ListChecks,
  },
  {
    id: "calendar",
    path: "/calendar",
    label: "Today",
    subtitle: "Todos, habits, goals",
    icon: CalendarDays,
  },
  {
    id: "matrix",
    path: "/matrix",
    label: "Matrix",
    subtitle: "Do, Schedule, Delegate, Delete",
    icon: Grid2X2,
  },
  {
    id: "analytics",
    path: "/analytics",
    label: "Analytics",
    subtitle: "Completion, streaks, patterns",
    icon: BarChart3,
  },
  {
    id: "heatmaps",
    path: "/heatmaps",
    label: "Heatmaps",
    subtitle: "Year, month, and habit heatmaps",
    icon: Grid3X3,
  },
  {
    id: "widgets",
    path: "/widgets",
    label: "Widgets",
    subtitle: "Native widget preview spec",
    icon: Smartphone,
  },
  {
    id: "settings",
    path: "/settings",
    label: "Settings",
    subtitle: "Theme, data, native roadmap",
    icon: Settings,
  },
  {
    id: "more",
    path: "/more",
    label: "More",
    subtitle: "Analytics, heatmaps, settings",
    icon: MoreHorizontal,
  },
];

export const primaryTabs = routes.filter((route) =>
  ["today", "habits", "matrix", "more"].includes(route.id),
);

export const moreRoutes = routes.filter((route) =>
  ["analytics", "heatmaps", "settings"].includes(route.id),
);

export function normalizePath(path: string) {
  const cleanPath = path.replace(/^#/, "") || "/today";
  return cleanPath.startsWith("/") ? cleanPath : `/${cleanPath}`;
}

export function findRoute(path: string) {
  const normalized = normalizePath(path);
  return routes.find((route) => route.path === normalized) ?? routes[0];
}

export function getPrimaryTabId(routeId: RouteId): RouteId {
  if (routeId === "calendar") {
    return "today";
  }

  return ["analytics", "heatmaps", "widgets", "settings"].includes(routeId) ? "more" : routeId;
}
