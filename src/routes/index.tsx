import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { clients, runs } from "@/lib/mock";
import { gnodes, scenario, zones } from "@/lib/systemGraph";
import { SectionLabel, StatusDot } from "@/components/AppShell";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useTopology, type Selection } from "@/components/topology/useTopology";
import { TopologyCanvas } from "@/components/topology/TopologyCanvas";
import { DetailPanel } from "@/components/topology/DetailPanel";
import { Toolbar } from "@/components/topology/Toolbar";
import { StackedView } from "@/components/topology/StackedView";
import { Sparkline } from "@/components/topology/Sparkline";
import { SystemGraph } from "@/components/SystemGraph";

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

const scenes = [
  { id: "system", label: "System map" },
  { id: "topology", label: "Hub & nodes" },
] as const;
type Scene = (typeof scenes)[number]["id"];

function Monitor() {
  const topo = useTopology();
  const [scene, setScene] = useState<Scene>("system");
  const [graphSel, setGraphSel] = useState("orch");
  const [trace, setTrace] = useState<{ k: number; t: string; msg: string }[]>([]);
  const [sheet, setSheet] = useState(false);
  const [clock, setClock] = useState("");
  const { nodes, health } = topo;
  const last = (a: number[]) => a[a.length - 1] ?? 0;

  useEffect(() => {
    const tick = () => setClock(new Date().toLocaleString("en-GB", { weekday: "short", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const onStep = useCallback((i: number) => {
    const s = scenario[i];
    if (s) setTrace((t) => [{ k: Date.now(), t: new Date().toLocaleTimeString("en-GB"), msg: s.log }, ...t].slice(0, 6));
  }, []);
  const onSelect = useCallback((id: string) => setGraphSel(id), []);

  const kpis = [
    { k: "Runs in flight", v: "12", unit: "runs", d: health.tasks, c: "stroke-primary" },
    { k: "Agents busy", v: `${nodes.filter((n) => n.status === "busy").length}/${nodes.length}`, unit: "nodes", d: null, c: "" },
    { k: "Tokens", v: `${Math.round(last(health.tokens))}k`, unit: "/ min", d: health.tokens, c: "stroke-success" },
    { k: "Hub latency", v: `${Math.round(last(health.latency))}`, unit: "ms", d: health.latency, c: "stroke-accent" },
    { k: "Policy denials", v: `${Math.round(last(health.denials))}`, unit: "today", d: health.denials, c: "stroke-destructive" },
    { k: "Clients", v: String(clients.length), unit: "connected", d: null, c: "" },
  ];

  const sel = gnodes.find((n) => n.id === graphSel);
  const pickMobile = (s: Selection) => {
    topo.setSelection(s);
    setSheet(true);
  };

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_330px] 2xl:grid-cols-[230px_minmax(0,1fr)_330px]">
      {/* Left: data overview */}
      <aside className="space-y-3 xl:col-span-2 2xl:col-span-1">
        <div className="hidden 2xl:block">
          <h1 className="text-[28px] font-bold leading-[1.05] tracking-tight">
            Factory
            <br />
            Monitor
          </h1>
          <div className="mt-2 font-mono text-[11px] text-muted-foreground">{clock || "—"}</div>
        </div>
        <div className="panel overflow-hidden">
          <div className="bg-secondary px-3 py-2 text-xs font-semibold tracking-wide">Data overview</div>
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 2xl:grid-cols-1">
            {kpis.map((x) => (
              <div key={x.k} className="border-t border-border px-3 py-3 xl:border-l 2xl:border-l-0">
                <div className="flex items-baseline gap-1.5">
                  <span className="font-mono text-2xl font-semibold">{x.v}</span>
                  <span className="text-[11px] text-muted-foreground">{x.unit}</span>
                </div>
                <div className="text-[11px] text-muted-foreground">{x.k}</div>
                {x.d && <div className="mt-1"><Sparkline data={x.d} className={x.c} /></div>}
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* Center: scene */}
      <section className="min-w-0 space-y-3">
        <div className="panel relative overflow-hidden">
          {scene === "system" ? (
            <SystemGraph compact onSelect={onSelect} onStep={onStep} />
          ) : (
            <div className="space-y-3 p-3">
              <Toolbar topo={topo} />
              <div className="hidden lg:block"><TopologyCanvas topo={topo} /></div>
              <div className="lg:hidden"><StackedView topo={topo} onPick={pickMobile} /></div>
            </div>
          )}
        </div>
        {/* scene switcher */}
        <div className="flex items-center justify-center gap-1 font-mono text-xs">
          <button onClick={() => setScene(scene === "system" ? "topology" : "system")} className="p-1.5 text-primary" aria-label="Previous scene"><ChevronLeft className="h-4 w-4" /></button>
          {scenes.map((s) => (
            <button key={s.id} onClick={() => setScene(s.id)} className={`rounded-sm px-4 py-1.5 transition-colors ${scene === s.id ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
              {s.label}
            </button>
          ))}
          <button onClick={() => setScene(scene === "system" ? "topology" : "system")} className="p-1.5 text-primary" aria-label="Next scene"><ChevronRight className="h-4 w-4" /></button>
        </div>
      </section>

      {/* Right: details, workflow list, curve */}
      <aside className="space-y-3">
        <div className="panel overflow-hidden">
          <div className="bg-secondary px-4 py-2 text-xs font-semibold tracking-wide">{scene === "system" ? "Component" : "Selection"}</div>
          <div className="p-4">
            {scene === "system" && sel ? (
              <div>
                <SectionLabel>{zones.find((z) => z.id === sel.zone)?.label}</SectionLabel>
                <div className="mt-1 flex items-center gap-2">
                  <span className="font-semibold">{sel.label}</span>
                  <span className="ml-auto font-mono text-[11px] text-primary">{sel.metric}</span>
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{sel.desc}</p>
              </div>
            ) : (
              <DetailPanel topo={topo} />
            )}
          </div>
        </div>

        <div className="panel overflow-hidden">
          <div className="bg-secondary px-4 py-2 text-xs font-semibold tracking-wide">Workflow list</div>
          <table className="w-full text-[11px]">
            <thead>
              <tr className="font-mono text-[10px] uppercase text-muted-foreground">
                <th className="px-4 py-2 text-left font-normal">Run</th>
                <th className="py-2 text-left font-normal">Step</th>
                <th className="px-4 py-2 text-right font-normal">State</th>
              </tr>
            </thead>
            <tbody>
              {runs.map((r) => (
                <tr key={r.id} className="border-t border-border/60">
                  <td className="px-4 py-2">
                    <div className="font-mono">{r.id}</div>
                    <div className="max-w-[120px] truncate text-muted-foreground">{r.title}</div>
                  </td>
                  <td className="py-2 font-mono text-muted-foreground">{r.steps[r.step]}</td>
                  <td className="px-4 py-2 text-right">
                    <span className="inline-flex items-center gap-1.5 font-mono uppercase">
                      <StatusDot status={r.state} />
                      <span className={r.state === "done" ? "text-success" : r.state === "failed" ? "text-destructive" : r.state === "waiting" ? "text-accent" : "text-primary"}>{r.state}</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="panel overflow-hidden">
          <div className="bg-secondary px-4 py-2 text-xs font-semibold tracking-wide">Throughput · 24 samples</div>
          <div className="p-4">
            <AreaCurve data={health.tasks} />
          </div>
        </div>

        <div className="panel overflow-hidden">
          <div className="bg-secondary px-4 py-2 text-xs font-semibold tracking-wide">Live trace</div>
          <div className="h-[132px] space-y-1 overflow-hidden p-3 font-mono text-[10.5px]">
            {trace.length === 0 && <div className="text-muted-foreground">listening…</div>}
            {trace.map((l, i) => (
              <div key={l.k} className={`fade-in truncate ${i === 0 ? "text-primary" : "text-muted-foreground"}`}>
                <span className="text-muted-foreground">{l.t}</span> › {l.msg}
              </div>
            ))}
          </div>
        </div>
      </aside>

      <Sheet open={sheet} onOpenChange={setSheet}>
        <SheetContent className="w-[340px] overflow-y-auto border-border bg-card">
          <SheetTitle className="sr-only">Details</SheetTitle>
          <div className="pt-6"><DetailPanel topo={topo} /></div>
        </SheetContent>
      </Sheet>
    </div>
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
