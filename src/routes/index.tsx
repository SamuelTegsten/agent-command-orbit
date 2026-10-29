import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useState } from "react";
import { runs } from "@/lib/mock";
import { gnodes, scenario } from "@/lib/systemGraph";
import { useTopology } from "@/components/topology/useTopology";
import { Sparkline } from "@/components/topology/Sparkline";
import { SystemGraph } from "@/components/SystemGraph";
import { FleetPanel, SetupGrid } from "@/components/craton/RuntimePanels";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Monitor · Basalt Software Factory" },
      { name: "description", content: "Live monitor of the Software Factory: system map, hub, nodes and every running workflow." },
      { property: "og:title", content: "Monitor · Basalt Software Factory" },
      { property: "og:description", content: "Live monitor of the Software Factory: system map, hub, nodes and workflows." },
    ],
  }),
  component: Monitor,
});


function Monitor() {
  const topo = useTopology();
  const [graphSel, setGraphSel] = useState("orch");
  const [trace, setTrace] = useState<{ k: number; t: string; msg: string }[]>([]);
  const { nodes, health } = topo;
  const last = (a: number[]) => a[a.length - 1] ?? 0;


  const onStep = useCallback((i: number) => {
    const s = scenario[i];
    if (s) setTrace((t) => [{ k: Date.now(), t: new Date().toLocaleTimeString("en-GB"), msg: s.log }, ...t].slice(0, 6));
  }, []);
  const onSelect = useCallback((id: string) => setGraphSel(id), []);


  const sel = gnodes.find((n) => n.id === graphSel);

  const busy = nodes.filter((n) => n.status === "busy").length;
  const tiles = [
    { k: "Runs", v: "12", pct: 12 / 20, d: health.tasks, tone: "primary" },
    { k: "Agents busy", v: `${busy}/${nodes.length}`, pct: busy / Math.max(1, nodes.length), d: null, tone: "primary" },
    { k: "Tokens / min", v: `${Math.round(last(health.tokens))}k`, pct: last(health.tokens) / 60, d: health.tokens, tone: "success" },
    { k: "Latency ms", v: `${Math.round(last(health.latency))}`, pct: last(health.latency) / 100, d: health.latency, tone: "accent" },
  ] as const;

  return (
    <div className="space-y-6">
      {/* KPI gauges */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {tiles.map((t) => (
          <div key={t.k} className="panel flex items-center gap-4 p-4">
            <Ring pct={t.pct} tone={t.tone} />
            <div className="min-w-0 flex-1">
              <div className="font-display text-2xl font-bold leading-none">{t.v}</div>
              <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{t.k}</div>
              {t.d && <div className="mt-2 opacity-70"><Sparkline data={t.d} className={t.tone === "success" ? "stroke-success" : t.tone === "accent" ? "stroke-accent" : "stroke-primary"} /></div>}
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
        <section className="min-w-0 space-y-2">
          <div className="flex h-8 items-center gap-3">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-foreground">System map</span>
            <span className="font-mono text-[10px] text-muted-foreground">people · hub · nodes · models</span>
            {sel && (
              <span className="ml-auto truncate font-mono text-[11px] text-muted-foreground">
                <span className="text-foreground">{sel.label}</span> · <span className="text-primary">{sel.metric}</span>
              </span>
            )}
          </div>
          <div className="panel relative overflow-hidden">
            <SystemGraph compact onSelect={onSelect} onStep={onStep} />
          </div>
        </section>

        <aside className="space-y-4 xl:pt-9">
          <div className="panel p-4">
            <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Workflows</div>
            <ul className="space-y-3">
              {runs.map((r) => {
                const tone = r.state === "done" ? "bg-success" : r.state === "failed" ? "bg-destructive" : r.state === "waiting" ? "bg-accent" : "bg-primary";
                return (
                  <li key={r.id} title={`${r.title} · ${r.steps[r.step]}`}>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="min-w-0 flex-1 truncate">{r.title}</span>
                      <span className="font-mono text-[10px] text-muted-foreground">{r.steps[r.step]}</span>
                    </div>
                    <div className="mt-1.5 flex gap-0.5">
                      {r.steps.map((_, i) => (
                        <span key={i} className={`h-1 flex-1 ${i < r.step ? tone : i === r.step ? `${tone} ${r.state === "running" ? "blink" : ""}` : "bg-border"}`} />
                      ))}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
          <div className="panel p-4">
            <div className="mb-2 flex items-baseline justify-between font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Throughput <span className="text-foreground">{Math.round(last(health.tasks))}/h</span>
            </div>
            <AreaCurve data={health.tasks} />
            {trace[0] && <div key={trace[0].k} className="fade-in mt-2 truncate font-mono text-[10px] text-primary">› {trace[0].msg}</div>}
          </div>
        </aside>
      </div>

      <SetupGrid />
      <FleetPanel />

    </div>
  );
}

function Ring({ pct, tone }: { pct: number; tone: "primary" | "success" | "accent" }) {
  const r = 18, c = 2 * Math.PI * r, p = Math.max(0.04, Math.min(1, pct));
  const cls = tone === "success" ? "stroke-success" : tone === "accent" ? "stroke-accent" : "stroke-primary";
  return (
    <svg viewBox="0 0 44 44" className="h-12 w-12 shrink-0 -rotate-90">
      <circle cx="22" cy="22" r={r} fill="none" className="stroke-border" strokeWidth="4" />
      <circle cx="22" cy="22" r={r} fill="none" className={`${cls} transition-all duration-700`} strokeWidth="4" strokeDasharray={`${c * p} ${c}`} />
    </svg>
  );
}

function AreaCurve({ data }: { data: number[] }) {
  const h = 90;
  const max = Math.max(...data, 1);
  const pts = data.map((v, i) => [(i / (data.length - 1)) * 100, h - (v / max) * (h - 10) - 4] as const);
  const line = pts.map(([x, y], i) => (i ? "L" : "M") + `${x} ${y}`).join(" ");
  return (
    <svg viewBox={`0 0 100 ${h}`} preserveAspectRatio="none" className="h-28 w-full">
      <defs>
        <linearGradient id="area" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" className="[stop-color:var(--primary)]" stopOpacity="0.45" />
          <stop offset="100%" className="[stop-color:var(--primary)]" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map((g) => (
        <line key={g} x1="0" x2="100" y1={h * g} y2={h * g} className="stroke-border" strokeWidth="0.5" vectorEffect="non-scaling-stroke" />
      ))}
      <path d={`${line} L100 ${h} L0 ${h} Z`} fill="url(#area)" />
      <path d={line} fill="none" className="stroke-primary" strokeWidth="2" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
