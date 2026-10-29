import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { clients } from "@/lib/mock";
import { SectionLabel } from "@/components/AppShell";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useTopology, type Selection } from "@/components/topology/useTopology";
import { TopologyCanvas } from "@/components/topology/TopologyCanvas";
import { DetailPanel } from "@/components/topology/DetailPanel";
import { Toolbar } from "@/components/topology/Toolbar";
import { StackedView } from "@/components/topology/StackedView";
import { Sparkline } from "@/components/topology/Sparkline";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Topology · Software Factory" },
      { name: "description", content: "Live map of client machines, the central hub, agent nodes and models." },
      { property: "og:title", content: "Topology · Software Factory" },
      { property: "og:description", content: "Live map of client machines, the central hub, agent nodes and models." },
    ],
  }),
  component: Topology,
});

function Topology() {
  const topo = useTopology();
  const [sheet, setSheet] = useState(false);
  const { nodes, health, ticker } = topo;
  const last = (a: number[]) => a[a.length - 1] ?? 0;

  const tiles = [
    { k: "Clients", v: String(clients.length), d: null, c: "" },
    { k: "Agents busy", v: `${nodes.filter((n) => n.status === "busy").length}/${nodes.length}`, d: null, c: "" },
    { k: "Hub latency", v: `${Math.round(last(health.latency))} ms`, d: health.latency, c: "stroke-accent" },
    { k: "Tasks / hour", v: String(Math.round(last(health.tasks))), d: health.tasks, c: "stroke-primary" },
    { k: "Tokens / min", v: `${Math.round(last(health.tokens))}k`, d: health.tokens, c: "stroke-chart-5" },
    { k: "Policy denials", v: String(Math.round(last(health.denials))), d: health.denials, c: "stroke-destructive" },
  ];

  const pickMobile = (s: Selection) => {
    topo.setSelection(s);
    setSheet(true);
  };

  return (
    <div className="space-y-5">
      <div>
        <SectionLabel>01 / Topology</SectionLabel>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Clients → Hub → Nodes</h1>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {tiles.map((t) => (
          <div key={t.k} className="panel px-3 py-2.5">
            <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{t.k}</div>
            <div className="mt-1 flex items-end gap-2">
              <span className="font-mono text-xl text-foreground">{t.v}</span>
              {t.d && <div className="flex-1"><Sparkline data={t.d} className={t.c} /></div>}
            </div>
          </div>
        ))}
      </div>

      <Toolbar topo={topo} />

      <div className="hidden gap-5 min-[1100px]:grid min-[1100px]:grid-cols-[1fr_320px]">
        <div className="space-y-3">
          <TopologyCanvas topo={topo} />
          <Ticker items={ticker} />
        </div>
        <aside className="panel h-fit p-5">
          <DetailPanel topo={topo} />
        </aside>
      </div>

      <div className="min-[1100px]:hidden">
        <StackedView topo={topo} onPick={pickMobile} />
        <div className="mt-3"><Ticker items={ticker} /></div>
        <Sheet open={sheet} onOpenChange={setSheet}>
          <SheetContent className="w-[340px] overflow-y-auto border-border bg-card">
            <SheetTitle className="sr-only">Details</SheetTitle>
            <div className="pt-6"><DetailPanel topo={topo} /></div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}

function Ticker({ items }: { items: { id: number; t: string; msg: string }[] }) {
  return (
    <div className="panel flex items-center gap-4 overflow-hidden px-4 py-2 font-mono text-[11px]">
      <span className="flex shrink-0 items-center gap-2 text-primary"><span className="h-1.5 w-1.5 rounded-full bg-primary blink" /> ACTIVITY</span>
      <div className="flex min-w-0 gap-6 overflow-hidden whitespace-nowrap">
        {items.length === 0 && <span className="text-muted-foreground">listening…</span>}
        {items.map((e, i) => (
          <span key={e.id} className={i === 0 ? "text-foreground" : "text-muted-foreground"} style={{ opacity: 1 - i * 0.15 }}>
            <span className="text-muted-foreground">{e.t}</span> {e.msg}
          </span>
        ))}
      </div>
    </div>
  );
}
