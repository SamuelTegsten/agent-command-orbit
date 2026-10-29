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
        <div className="mx-auto flex h-16 max-w-[1680px] items-center gap-6 px-6">
          <Link to="/" className="flex shrink-0 items-center gap-3">
            <div className="hex grid h-9 w-10 place-items-center bg-accent shadow-[0_0_18px_hsl(var(--accent)/0.35)]">
              <div className="hex h-4 w-[18px] bg-primary" />
            </div>
            <div className="leading-tight">
              <div className="font-display text-lg font-bold tracking-wide">
                Basalt<span className="text-primary">.</span>
                <span className="ml-2 font-sans text-xs font-normal uppercase tracking-[0.14em] text-muted-foreground">Software Factory</span>
              </div>
              <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground/80">Experter på systemintegration</div>
            </div>
          </Link>
          <nav className="flex items-center gap-1 rounded-md border border-border bg-secondary/40 p-1">
            {tabs.map((t) => (
              <Link
                key={t.to}
                to={t.to}
                activeOptions={{ exact: true }}
                className="flex items-center gap-2 rounded-sm px-3.5 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground data-[status=active]:bg-background data-[status=active]:text-foreground data-[status=active]:shadow-[inset_0_0_0_1px_hsl(var(--border))]"
              >
                <span className="font-mono text-[10px] text-primary">{t.code}</span>
                {t.label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-3 font-mono text-xs">
            <span className="flex items-center gap-2 rounded-full border border-success/30 bg-success/10 px-3 py-1 text-success">
              <span className="h-1.5 w-1.5 rounded-full bg-success blink" /> HUB ONLINE
            </span>
            <span className="hidden rounded-full border border-border bg-secondary/40 px-3 py-1 text-muted-foreground md:inline">
              install: <span className="text-foreground">craton-01</span>
            </span>
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
