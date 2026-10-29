import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { eventTemplates, layers, runs } from "@/lib/mock";
import { SystemGraph } from "@/components/SystemGraph";
import { SectionLabel, StatusDot } from "@/components/AppShell";

export const Route = createFileRoute("/operations")({
  head: () => ({
    meta: [
      { title: "Operations · Basalt Software Factory" },
      { name: "description", content: "Every moving part of the factory, live: workflows, policy checks, models and workspaces." },
      { property: "og:title", content: "Operations · Basalt Software Factory" },
      { property: "og:description", content: "Every moving part of the factory, live." },
    ],
  }),
  component: Operations,
});

type Ev = { id: number; t: string; src: string; msg: string };

const srcColor: Record<string, string> = {
  orchestration: "text-primary",
  policy: "text-destructive",
  credentials: "text-accent",
  gateway: "text-chart-5",
  workspace: "text-success",
  bridge: "text-accent",
  observability: "text-muted-foreground",
  improvement: "text-primary",
};

const componentToSrc: Record<string, string> = {
  Bridge: "bridge",
  Orchestration: "orchestration",
  "Policy engine": "policy",
  Credentials: "credentials",
  Observability: "observability",
  "Improvement loop": "improvement",
  "Workspace service": "workspace",
  "Agent workspaces": "workspace",
  "Model gateway": "gateway",
  "Open models": "gateway",
};

function Operations() {
  const [events, setEvents] = useState<Ev[]>([]);
  const [tick, setTick] = useState(0);
  const [spark, setSpark] = useState<number[]>(Array.from({ length: 40 }, (_, i) => 35 + 25 * Math.sin(i / 3) + (i % 5) * 4));

  useEffect(() => {
    const id = setInterval(() => {
      setTick((t) => t + 1);
      const [src, msg] = eventTemplates[Math.floor(Math.random() * eventTemplates.length)]!;
      const now = new Date().toLocaleTimeString("en-GB");
      setEvents((e) => [{ id: Date.now(), t: now, src, msg }, ...e].slice(0, 40));
      setSpark((s) => [...s.slice(1), 20 + Math.random() * 70]);
    }, 1400);
    return () => clearInterval(id);
  }, []);

  const activeSrc = events[0]?.src;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <SectionLabel>02 / Operations</SectionLabel>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">The factory in motion</h1>
        </div>
        <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
          <StatusDot status="running" /> streaming · tick {tick}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {[
          ["Runs in flight", "12", "+3 / h"],
          ["Tokens / min", `${(38 + (tick % 7)).toFixed(0)}k`, "open models 94%"],
          ["Policy checks", `${1204 + tick * 3}`, "7 denied today"],
          ["Human gates waiting", "2", "oldest 3h 12m"],
        ].map(([k, v, s]) => (
          <div key={k} className="panel p-4">
            <SectionLabel>{k}</SectionLabel>
            <div className="mt-2 font-mono text-3xl text-foreground">{v}</div>
            <div className="mt-1 text-xs text-muted-foreground">{s}</div>
          </div>
        ))}
      </div>

      <SystemGraph subtitle="System map" title="The whole factory, live" />

      <div className="grid gap-6 xl:grid-cols-[1fr_400px]">
        <div className="space-y-6">
          {/* Layer stack */}
          <div className="panel p-5">
            <div className="flex items-center justify-between">
              <SectionLabel>System layers · live activity</SectionLabel>
              <span className="font-mono text-[10px] text-muted-foreground">people → models</span>
            </div>
            <div className="mt-4 space-y-2">
              {layers.map((l, li) => (
                <div key={l.id} className="relative grid grid-cols-[150px_1fr] items-stretch gap-3">
                  <div className="rounded-sm bg-secondary p-3">
                    <div className="text-sm font-medium">{l.label}</div>
                    <div className="font-mono text-[10px] text-muted-foreground">{l.zone}</div>
                  </div>
                  <div className="flex flex-wrap gap-2 rounded-sm border border-dashed border-border p-2">
                    {l.items.map((it) => {
                      const hot = componentToSrc[it] === activeSrc;
                      return (
                        <div
                          key={it}
                          className={`flex items-center gap-2 rounded-sm border px-3 py-2 text-xs transition-all duration-300 ${
                            hot ? "border-primary bg-primary/10 text-primary glow-primary" : "border-border bg-card"
                          }`}
                        >
                          <StatusDot status={hot ? "busy" : it === "Cloud models" ? "idle" : "online"} />
                          {it}
                        </div>
                      );
                    })}
                  </div>
                  {li < layers.length - 1 && (
                    <div className="absolute -bottom-2 left-[75px] h-2 w-px overflow-visible bg-primary/30">
                      <span className="drop absolute -left-[2px] h-1.5 w-1.5 rounded-full bg-primary" style={{ animationDelay: `${li * 0.3}s` }} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Workflow runs */}
          <div className="panel p-5">
            <SectionLabel>Durable workflows</SectionLabel>
            <div className="mt-4 space-y-4">
              {runs.map((r) => (
                <div key={r.id}>
                  <div className="flex items-center gap-3 text-sm">
                    <StatusDot status={r.state} />
                    <span className="font-mono text-xs text-muted-foreground">{r.id}</span>
                    <span className="font-medium">{r.title}</span>
                    <span className="ml-auto font-mono text-[11px] text-muted-foreground">{r.repo}</span>
                  </div>
                  <div className="mt-2 grid grid-cols-8 gap-1">
                    {r.steps.map((s, i) => {
                      const done = i < r.step || r.state === "done";
                      const cur = i === r.step && r.state !== "done";
                      const cls = done
                        ? "bg-success/70"
                        : cur
                          ? r.state === "failed"
                            ? "bg-destructive"
                            : r.state === "waiting"
                              ? "bg-accent blink"
                              : "bg-primary blink"
                          : "bg-secondary";
                      return (
                        <div key={s}>
                          <div className={`h-1.5 rounded-full ${cls}`} />
                          <div className={`mt-1 truncate font-mono text-[9px] ${cur ? "text-foreground" : "text-muted-foreground"}`}>{s}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="panel p-5">
            <SectionLabel>Model gateway throughput</SectionLabel>
            <div className="mt-4 flex h-24 items-end gap-[3px]">
              {spark.map((v, i) => (
                <div key={i} className="flex-1 rounded-t-sm bg-primary/70 transition-all duration-500" style={{ height: `${v}%` }} />
              ))}
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 font-mono text-[11px]">
              <div><div className="text-muted-foreground">qwen-coder</div>62%</div>
              <div><div className="text-muted-foreground">llama-70b</div>32%</div>
              <div><div className="text-muted-foreground">cloud</div>6%</div>
            </div>
          </div>

          <div className="panel flex h-[560px] flex-col p-5">
            <div className="flex items-center justify-between">
              <SectionLabel>Event stream</SectionLabel>
              <span className="font-mono text-[10px] text-muted-foreground">{events.length} events</span>
            </div>
            <div className="mt-3 flex-1 space-y-1 overflow-hidden font-mono text-[11px]">
              {events.length === 0 && <div className="text-muted-foreground">waiting for events…</div>}
              {events.map((e, i) => (
                <div key={e.id} className={`flex gap-2 rounded-sm px-2 py-1 ${i === 0 ? "bg-secondary" : ""}`} style={{ opacity: 1 - i * 0.03 }}>
                  <span className="text-muted-foreground">{e.t}</span>
                  <span className={`w-24 shrink-0 ${srcColor[e.src]}`}>{e.src}</span>
                  <span className="text-foreground/90">{e.msg}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
