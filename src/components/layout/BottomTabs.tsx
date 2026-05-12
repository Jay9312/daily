import { getPrimaryTabId, primaryTabs, type RouteDefinition } from "../../app/routes";

interface BottomTabsProps {
  activeRoute: RouteDefinition;
}

export function BottomTabs({ activeRoute }: BottomTabsProps) {
  const activeTabId = getPrimaryTabId(activeRoute.id);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-white/10 bg-daily-bg/90 px-3 pb-[calc(env(safe-area-inset-bottom)+10px)] pt-2 backdrop-blur-xl">
      <div
        className="mx-auto grid max-w-md gap-1"
        style={{ gridTemplateColumns: `repeat(${primaryTabs.length}, minmax(0, 1fr))` }}
      >
        {primaryTabs.map((route) => {
          const Icon = route.icon;
          const isActive = route.id === activeTabId;

          return (
            <a
              key={route.id}
              href={`#${route.path}`}
              className={`flex min-h-14 flex-col items-center justify-center rounded-2xl px-2 text-[11px] font-medium transition ${
                isActive
                  ? "bg-daily-mint/15 text-daily-mint"
                  : "text-daily-muted hover:bg-white/5 hover:text-daily-ink"
              }`}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon className="mb-1 h-5 w-5" strokeWidth={2.2} />
              <span>{route.label}</span>
            </a>
          );
        })}
      </div>
    </nav>
  );
}
