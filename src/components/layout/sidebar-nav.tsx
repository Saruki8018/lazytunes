import { NavLink } from "react-router-dom";
import { Library, Settings, Music, ListMusic } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { to: "/", label: "Library", icon: Library },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function SidebarNav() {
  return (
    <aside className="hidden w-56 shrink-0 flex-col border-r border-border bg-card sm:flex">
      <div className="flex items-center gap-2 px-4 py-4">
        <Music size={24} className="text-primary" />
        <span className="text-lg font-bold">LazyTunes</span>
      </div>

      <nav className="flex flex-col gap-1 px-2">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors focus-visible:ring-2 focus-visible:ring-ring",
                isActive
                  ? "bg-accent font-medium text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
              )
            }
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Playlists section — full CRUD coming later */}
      <div className="mt-4 px-4">
        <div className="flex items-center gap-2 py-2">
          <ListMusic size={14} className="text-muted-foreground" />
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Playlists
          </span>
        </div>
        <p className="px-1 text-xs text-muted-foreground/60">Coming soon</p>
      </div>
    </aside>
  );
}
