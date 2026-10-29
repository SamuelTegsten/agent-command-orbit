import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

const tabs = [
  { to: "/", label: "Monitor", code: "01" },
  { to: "/factory", label: "Factory", code: "02" },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background bg-grid">
      <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-[1680px] items-center gap-8 px-6">
          <div className="flex items-center gap-3">
            <div className="hex grid h-8 w-9 place-items-center bg-accent">
              <div className="hex h-4 w-[18px] bg-primary" />
            </div>
            <div className="leading-tight">
              <div className="font-display text-base font-bold tracking-wide">
                Basalt <span className="font-sans text-xs font-normal text-muted-foreground">Software Factory</span>
              </div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Experter på systemintegration</div>
            </div>
          </div>
          <nav className="flex gap-1">
            {tabs.map((t) => (
              <Link
                key={t.to}
                to={t.to}
                activeOptions={{ exact: true }}
                className="group flex items-center gap-2 rounded-sm px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground data-[status=active]:bg-secondary data-[status=active]:text-foreground"
              >
                <span className="font-mono text-[10px] text-primary">{t.code}</span>
                {t.label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-4 font-mono text-xs text-muted-foreground">
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-success blink" /> HUB ONLINE
            </span>
            <span className="hidden md:inline">install: craton-01</span>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-[1680px] px-5 py-5">{children}</main>
    </div>
  );
}

export function StatusDot({ status }: { status: string }) {
  const map: Record<string, string> = {
    online: "bg-success",
    busy: "bg-primary blink",
    running: "bg-primary blink",
    idle: "bg-muted-foreground",
    paused: "bg-accent",
    waiting: "bg-accent blink",
    done: "bg-success",
    error: "bg-destructive blink",
    failed: "bg-destructive",
    transition: "bg-foreground blink",
  };
  return <span className={`inline-block h-2 w-2 shrink-0 rounded-full ${map[status] ?? "bg-muted"}`} />;
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{children}</div>;
}
