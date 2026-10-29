import { Link } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { AlertTriangle, Clock3, Search } from "lucide-react";
import { install, sandbox, usage, work } from "@/lib/craton";
import { useSystemPulse } from "./topbar/useSystemPulse";
import { CommandPalette } from "./topbar/CommandPalette";
import { AlertsMenu } from "./topbar/AlertsMenu";

const tabs = [
  { to: "/", label: "Monitor", code: "01" },
  { to: "/factory", label: "Factory", code: "02" },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const pulse = useSystemPulse();
  const [paletteOpen, setPaletteOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const tickerItems = [...pulse.events].reverse();
  const tickerLine = tickerItems.map((e) => `${e.time}  ${e.source.toUpperCase()} · ${e.text}`);

  const counters = [
    ["run", work.running, "bg-primary"],
    ["blk", work.blocked, "bg-accent"],
    ["fail", work.failed, "bg-destructive"],
    ["que", work.queued, "bg-muted-foreground"],
    ["done", work.done, "bg-success"],
  ] as const;

  return (
    <div className="min-h-screen bg-background bg-grid">
      <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-12 max-w-[1680px] items-stretch px-5">
          {/* Brand */}
          <Link to="/" className="flex shrink-0 items-center gap-2.5 border-r border-border pr-5">
            <div className="hex grid h-6 w-7 place-items-center bg-primary/90">
              <div className="hex h-2.5 w-3 bg-background" />
            </div>
            <div className="flex items-baseline gap-2 leading-none">
              <span className="font-display text-[15px] font-bold tracking-[0.08em]">BASALT</span>
              <span className="hidden font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground sm:inline">/ factory</span>
            </div>
          </Link>

          {/* Tabs — full height, accent rail on active */}
          <nav className="flex items-stretch">
            {tabs.map((t) => (
              <Link
                key={t.to}
                to={t.to}
                activeOptions={{ exact: true, includeSearch: false }}
                className="group relative flex items-center gap-2 border-r border-border px-5 font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:bg-secondary/40 hover:text-foreground data-[status=active]:bg-secondary/50 data-[status=active]:text-foreground"
              >
                <span className="absolute inset-x-0 top-0 h-[2px] bg-primary opacity-0 transition-opacity group-data-[status=active]:opacity-100" />
                <span className="text-[9px] text-muted-foreground/60 group-data-[status=active]:text-primary">{t.code}</span>
                {t.label}
              </Link>
            ))}
          </nav>

          {/* Work counters — one compact gauge */}
          <div className="hidden items-center gap-3 border-r border-border px-5 font-mono text-[10px] uppercase tracking-wider lg:flex">
            {counters.map(([k, v, c]) => (
              <span key={k} className="flex items-center gap-1.5" title={k}>
                <span className={`h-1.5 w-1.5 ${v ? c : "border border-muted-foreground/60"}`} />
                <span className="text-foreground">{v}</span>
                <span className="text-muted-foreground/70">{k}</span>
              </span>
            ))}
          </div>

          <div className="ml-auto flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider">
            {usage.paused && (
              <span title={`${usage.window} · resumes ${usage.resumes} · ${usage.reason}`} className="hidden items-center gap-1.5 border border-accent/40 bg-accent/10 px-2 py-1 text-accent md:flex">
                <AlertTriangle className="h-3 w-3" /> paused · {usage.resumesIn}
              </span>
            )}
            <span className="hidden items-center gap-1.5 px-2 text-muted-foreground xl:flex">
              <Clock3 className="h-3 w-3 text-primary" />{pulse.clock}
            </span>
            <button onClick={() => setPaletteOpen(true)} aria-label="Search" className="flex h-7 items-center gap-2 border border-border px-2 text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground">
              <Search className="h-3 w-3" /><span className="hidden md:inline">⌘K</span>
            </button>
            <AlertsMenu events={pulse.events} />
            <span className="flex items-center gap-1.5 border border-success/30 bg-success/10 px-2 py-1 text-success">
              <span className="h-1.5 w-1.5 bg-success blink" /> hub
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1680px] px-5 pb-12 pt-5">{children}</main>

      <footer className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-7 max-w-[1680px] items-center gap-3 px-5 font-mono text-[10px] text-muted-foreground">
          <span className="shrink-0 text-foreground">{install.name}</span>
          <span className="hidden shrink-0 sm:inline">alma · sandbox {sandbox.waiting} waiting</span>
          <div className="relative min-w-0 flex-1 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_4%,black_96%,transparent)]">
            <div className="marquee flex w-max items-center gap-8 whitespace-nowrap">
              {[0, 1].map((copy) => (
                <span key={copy} className="flex items-center gap-8">
                  {tickerLine.map((line, i) => (
                    <span key={`${copy}-${i}`}><span className="text-primary">▸</span> {line}</span>
                  ))}
                </span>
              ))}
            </div>
          </div>
          <span className="flex shrink-0 items-center gap-1.5"><span className="h-1.5 w-1.5 bg-success blink" />live</span>
        </div>
      </footer>
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
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
