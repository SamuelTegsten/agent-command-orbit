import { Link } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { Activity, AlertTriangle, Clock3, Layers, Search, Timer, Zap } from "lucide-react";
import { layers } from "@/lib/mock";
import { install, sandbox, usage, work } from "@/lib/craton";
import { useSystemPulse } from "./topbar/useSystemPulse";
import { CommandPalette } from "./topbar/CommandPalette";
import { AlertsMenu } from "./topbar/AlertsMenu";

const tabs = [
  { to: "/", label: "Monitor", code: "01" },
  { to: "/factory", label: "Factory", code: "02" },
] as const;

function Vital({ icon: Icon, label, value, title }: { icon: typeof Zap; label: string; value: string; title: string }) {
  return (
    <div title={title} className="flex items-center gap-1.5 border-l border-border/70 pl-3 first:border-0 first:pl-0">
      <Icon className="h-3 w-3 text-primary" />
      <span className="text-muted-foreground/70">{label}</span>
      <span className="text-foreground">{value}</span>
    </div>
  );
}

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

  return (
    <div className="min-h-screen bg-background bg-grid">
      <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur">
        {/* Main bar */}
        <div className="mx-auto flex h-14 max-w-[1680px] items-center gap-4 px-5">
          <Link to="/" className="flex shrink-0 items-center gap-2.5">
            <div className="hex grid h-8 w-9 place-items-center bg-accent shadow-[0_0_18px_hsl(var(--accent)/0.35)]">
              <div className="hex h-3.5 w-4 bg-primary" />
            </div>
            <div className="leading-tight">
              <div className="font-display text-base font-bold tracking-wide">
                Basalt<span className="text-primary">.</span>
                <span className="ml-2 hidden font-sans text-[11px] font-normal uppercase tracking-[0.14em] text-muted-foreground sm:inline">
                  Software Factory
                </span>
              </div>
              <div className="hidden text-[9px] uppercase tracking-[0.22em] text-muted-foreground/80 md:block">
                Experter på systemintegration
              </div>
            </div>
          </Link>

          <nav className="flex items-center gap-1 rounded-md border border-border bg-secondary/40 p-1">
            {tabs.map((t) => (
              <Link
                key={t.to}
                to={t.to}
                activeOptions={{ exact: true }}
                className="flex items-center gap-2 rounded-sm px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground data-[status=active]:bg-background data-[status=active]:text-foreground data-[status=active]:shadow-[inset_0_0_0_1px_hsl(var(--border))]"
              >
                <span className="font-mono text-[10px] text-primary">{t.code}</span>
                {t.label}
              </Link>
            ))}
          </nav>

          {/* Search / command palette trigger */}
          <button
            onClick={() => setPaletteOpen(true)}
            className="hidden h-8 flex-1 items-center gap-2.5 rounded-md border border-border bg-secondary/40 px-3 font-mono text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground lg:flex lg:max-w-xs"
          >
            <Search className="h-3.5 w-3.5 text-primary" />
            <span className="flex-1 text-left">Jump to…</span>
            <kbd className="rounded border border-border bg-background px-1.5 py-0.5 text-[10px]">⌘K</kbd>
          </button>
          <button
            onClick={() => setPaletteOpen(true)}
            aria-label="Search"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-md border border-border bg-secondary/40 text-muted-foreground transition-colors hover:text-foreground lg:hidden"
          >
            <Search className="h-3.5 w-3.5" />
          </button>

          <div className="ml-auto flex items-center gap-3 font-mono text-xs lg:ml-0">
            {/* Live vitals */}
            <div className="hidden items-center gap-3 text-[11px] xl:flex">
              <Vital icon={Activity} label="runs" value={String(pulse.activeRuns)} title="Active workflow runs" />
              <Vital icon={Layers} label="queue" value={String(pulse.queue)} title="Tasks waiting for a workspace" />
              <Vital icon={Zap} label="gw" value={`${pulse.latencyMs}ms`} title="Model gateway latency" />
              <Vital icon={Timer} label="up" value={pulse.uptime} title="Hub uptime" />
            </div>

            {/* Clock */}
            <span className="hidden items-center gap-1.5 rounded-md border border-border bg-secondary/40 px-2.5 py-1.5 text-[11px] text-muted-foreground md:flex">
              <Clock3 className="h-3 w-3 text-primary" />
              {pulse.clock}
            </span>

            <AlertsMenu events={pulse.events} />

            <span className="flex items-center gap-2 rounded-full border border-success/30 bg-success/10 px-3 py-1 text-success">
              <span className="h-1.5 w-1.5 rounded-full bg-success blink" /> HUB ONLINE
            </span>
          </div>
        </div>

        {/* Status strip: layer health + live event ticker */}
        <div className="border-t border-border/60 bg-secondary/25">
          <div className="mx-auto flex h-7 max-w-[1680px] items-center gap-4 px-5">
            <div className="hidden shrink-0 items-center gap-3 md:flex">
              {layers.map((l) => (
                <span key={l.id} className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground/80" title={l.zone}>
                  <span className={`h-1 w-1 rounded-full ${l.id === "exec" ? "bg-accent blink" : "bg-success"}`} />
                  {l.label}
                </span>
              ))}
            </div>
            <div className="relative min-w-0 flex-1 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_4%,black_96%,transparent)]">
              <div className="marquee flex w-max items-center gap-8 whitespace-nowrap font-mono text-[10px] text-muted-foreground">
                {[0, 1].map((copy) => (
                  <span key={copy} className="flex items-center gap-8">
                    {tickerLine.map((line, i) => (
                      <span key={`${copy}-${i}`} className="flex items-center gap-2">
                        <span className="text-primary">▸</span>
                        {line}
                      </span>
                    ))}
                  </span>
                ))}
              </div>
            </div>
            <span className="hidden shrink-0 font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground/60 sm:inline">
              install: <span className="text-foreground/80">craton-01</span>
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1680px] px-5 pb-12 pt-5">
        {/* Global work counters + usage pause */}
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="flex flex-wrap items-center gap-3 rounded-full border border-border bg-secondary/40 px-3 py-1 font-mono text-[11px]">
            {([
              ["running", work.running, "bg-primary"],
              ["blocked", work.blocked, "bg-accent"],
              ["failed", work.failed, "bg-destructive"],
              ["queued", work.queued, "bg-muted-foreground"],
              ["done", work.done, "bg-success"],
            ] as const).map(([k, v, c]) => (
              <span key={k} className="flex items-center gap-1.5">
                <span className={`h-1.5 w-1.5 rounded-full ${v ? c : "border border-muted-foreground"}`} />
                <span className="font-semibold text-foreground">{v}</span>
                <span className="text-muted-foreground">{k}</span>
              </span>
            ))}
          </div>
          {usage.paused && (
            <div className="flex items-center gap-2 rounded-md border border-accent/40 border-l-4 border-l-accent bg-accent/10 px-3 py-1 text-xs">
              <AlertTriangle className="h-3.5 w-3.5 text-accent" />
              <span className="font-semibold text-accent">Usage pause</span>
              <span className="font-mono text-muted-foreground">{usage.window} · resumes {usage.resumes} · {usage.reason}</span>
              <span className="font-mono font-semibold">in {usage.resumesIn}</span>
            </div>
          )}
        </div>
        {children}
      </main>
      <footer className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-7 max-w-[1680px] items-center gap-2 px-5 font-mono text-[10.5px] text-muted-foreground">
          <span className="text-foreground">{install.name}</span>·<span>mcp-probe</span>·<span>alma</span>·
          <span className="text-primary">sandbox</span>·<span>{work.running} running</span>·<span>{sandbox.waiting} waiting</span>·
          <span>polled just now</span>
          <span className="ml-auto flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-success blink" />
            <kbd className="rounded border border-border px-1">⌘K</kbd> search
          </span>
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
