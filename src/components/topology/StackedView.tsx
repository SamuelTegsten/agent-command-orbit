import { Network, Lock, Cpu } from "lucide-react";
import { clients, hosts, models } from "@/lib/mock";
import { SectionLabel, StatusDot } from "@/components/AppShell";
import type { Selection, Topo } from "./useTopology";

// Small-screen layout: clients → hub → hosts, top to bottom.
export function StackedView({ topo, onPick }: { topo: Topo; onPick: (s: Selection) => void }) {
  const { nodes, matches } = topo;
  return (
    <div className="space-y-3">
      <SectionLabel>Clients</SectionLabel>
      <div className="grid gap-2 sm:grid-cols-2">
        {clients.map((c) => (
          <button key={c.id} onClick={() => onPick({ kind: "client", id: c.id })} className="panel flex items-center gap-2 p-3 text-left">
            <StatusDot status={c.status} />
            <span className="font-mono text-xs">{c.name}</span>
            <span className="ml-auto truncate text-[11px] text-muted-foreground">{c.user}</span>
          </button>
        ))}
      </div>
      <div className="mx-auto h-6 w-px bg-accent flow-dash" />
      <button onClick={() => onPick({ kind: "hub", id: "hub" })} className="panel flex w-full items-center gap-2 border-primary/60 p-4 text-left glow-primary">
        <Network className="h-5 w-5 text-primary" /> <span className="font-semibold">HUB</span>
        <span className="ml-auto font-mono text-[10px] text-success">● LIVE</span>
      </button>
      <div className="flex flex-wrap gap-2">
        {models.map((m) => (
          <button key={m.id} onClick={() => onPick({ kind: "model", id: m.id })} className="flex items-center gap-1.5 rounded-sm border border-border px-2 py-1 font-mono text-[10px]">
            {m.blocked ? <Lock className="h-3 w-3 text-destructive" /> : <Cpu className="h-3 w-3 text-chart-5" />} {m.label}
          </button>
        ))}
      </div>
      <div className="mx-auto h-6 w-px bg-primary" />
      {hosts.map((h) => (
        <div key={h.id} className="rounded-sm border border-border/70 bg-secondary/30 p-2">
          <div className="px-1 pb-1.5 font-mono text-[10px] text-muted-foreground">{h.id}</div>
          <div className="space-y-1.5">
            {nodes.filter((n) => n.host === h.id).map((n) => (
              <button key={n.id} onClick={() => onPick({ kind: "node", id: n.id })} className={`panel flex w-full items-center gap-2 px-3 py-2 text-left ${matches(n) ? "" : "opacity-20"}`}>
                <StatusDot status={n.status} />
                <span className="font-mono text-xs">{n.id}</span>
                <span className="truncate text-[11px] text-muted-foreground">{n.task}</span>
                <span className="ml-auto font-mono text-[10px] text-muted-foreground">{n.cpu}%</span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
