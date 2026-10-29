import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Monitor, Laptop, Server, Terminal, Cpu, ShieldCheck, Workflow, KeyRound, Network } from "lucide-react";
import { clients, nodes } from "@/lib/mock";
import { SectionLabel, StatusDot } from "@/components/AppShell";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Topology · Software Factory" },
      { name: "description", content: "Live map of client machines, the central hub and agent nodes." },
      { property: "og:title", content: "Topology · Software Factory" },
      { property: "og:description", content: "Live map of client machines, the central hub and agent nodes." },
    ],
  }),
  component: Topology,
});

const kindIcon = { Workstation: Monitor, Laptop, Service: Server, Terminal } as const;

// Positions in % of the canvas
const clientPos = clients.map((_, i) => ({ x: 13, y: 14 + i * 24 }));
const hub = { x: 48, y: 50 };
const nodePos = nodes.map((_, i) => ({ x: 82, y: 9 + i * 16.5 }));

function Topology() {
  const [selected, setSelected] = useState<string>(nodes[0].id);
  const node = nodes.find((n) => n.id === selected)!;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <SectionLabel>01 / Topology</SectionLabel>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Clients → Hub → Nodes</h1>
        </div>
        <div className="flex gap-3">
          {[
            ["Clients", clients.length],
            ["Nodes", nodes.length],
            ["Active agents", nodes.filter((n) => n.status === "busy").length],
            ["Warm pool", nodes.filter((n) => n.status === "idle").length],
          ].map(([k, v]) => (
            <div key={k} className="panel px-4 py-2">
              <div className="font-mono text-2xl text-primary">{v}</div>
              <div className="text-xs text-muted-foreground">{k}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <div className="panel relative aspect-[16/10] min-h-[560px] overflow-hidden">
          <div className="absolute left-4 top-3 font-mono text-[10px] text-muted-foreground">CLIENTS</div>
          <div className="absolute left-1/2 top-3 -translate-x-1/2 font-mono text-[10px] text-muted-foreground">HUB · CONTROL PLANE</div>
          <div className="absolute right-4 top-3 font-mono text-[10px] text-muted-foreground">NODES · AGENT WORKSPACES</div>

          <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            {clientPos.map((p, i) => (
              <path
                key={i}
                d={`M ${p.x + 9} ${p.y} C ${p.x + 22} ${p.y}, ${hub.x - 16} ${hub.y}, ${hub.x - 8} ${hub.y}`}
                fill="none"
                vectorEffect="non-scaling-stroke"
                className={clients[i].status === "idle" ? "stroke-border" : "stroke-accent flow-dash"}
                strokeWidth={1.5}
              />
            ))}
            {nodePos.map((p, i) => {
              const n = nodes[i];
              const cls =
                n.status === "busy" ? "stroke-primary flow-dash" : n.status === "error" ? "stroke-destructive flow-dash" : n.status === "paused" ? "stroke-accent" : "stroke-border";
              return (
                <path
                  key={n.id}
                  d={`M ${hub.x + 8} ${hub.y} C ${hub.x + 18} ${hub.y}, ${p.x - 18} ${p.y}, ${p.x - 9} ${p.y}`}
                  fill="none"
                  vectorEffect="non-scaling-stroke"
                  className={cls}
                  strokeWidth={selected === n.id ? 2.5 : 1.5}
                />
              );
            })}
          </svg>

          {clients.map((c, i) => {
            const Icon = kindIcon[c.kind as keyof typeof kindIcon];
            return (
              <div key={c.id} className="absolute w-[17%] -translate-x-1/2 -translate-y-1/2" style={{ left: `${clientPos[i].x}%`, top: `${clientPos[i].y}%` }}>
                <div className="panel flex items-center gap-3 p-3">
                  <Icon className="h-5 w-5 text-accent" />
                  <div className="min-w-0">
                    <div className="truncate font-mono text-xs">{c.name}</div>
                    <div className="truncate text-[11px] text-muted-foreground">{c.user} · {c.sessions} sess</div>
                  </div>
                  <span className="ml-auto"><StatusDot status={c.status} /></span>
                </div>
              </div>
            );
          })}

          {/* HUB */}
          <div className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${hub.x}%`, top: `${hub.y}%` }}>
            <div className="relative">
              <div className="absolute -inset-6 rounded-full border border-primary/30 blink" />
              <div className="absolute -inset-12 rounded-full border border-primary/10" />
              <div className="panel relative w-56 border-primary/60 p-4 glow-primary">
                <div className="flex items-center gap-2">
                  <Network className="h-5 w-5 text-primary" />
                  <span className="font-semibold tracking-wide">HUB</span>
                  <span className="ml-auto font-mono text-[10px] text-success">● LIVE</span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {[
                    [Workflow, "Orchestration"],
                    [ShieldCheck, "Policy"],
                    [KeyRound, "Credentials"],
                    [Cpu, "Model gateway"],
                  ].map(([I, l]) => {
                    const Ico = I as typeof Cpu;
                    return (
                      <div key={l as string} className="flex items-center gap-1.5 rounded-sm bg-secondary px-2 py-1.5 text-[11px]">
                        <Ico className="h-3 w-3 text-primary" />
                        {l as string}
                      </div>
                    );
                  })}
                </div>
                <div className="relative mt-3 h-1 overflow-hidden rounded-full bg-secondary">
                  <div className="absolute inset-y-0 w-1/4 bg-primary scan" />
                </div>
              </div>
            </div>
          </div>

          {nodes.map((n, i) => (
            <button
              key={n.id}
              onClick={() => setSelected(n.id)}
              className="absolute w-[17%] -translate-x-1/2 -translate-y-1/2 text-left"
              style={{ left: `${nodePos[i].x}%`, top: `${nodePos[i].y}%` }}
            >
              <div className={`panel p-2.5 transition-all ${selected === n.id ? "border-primary glow-primary" : "hover:border-muted-foreground"}`}>
                <div className="flex items-center gap-2">
                  <StatusDot status={n.status} />
                  <span className="font-mono text-xs">{n.id}</span>
                  <span className="ml-auto font-mono text-[10px] text-muted-foreground">{n.agent}</span>
                </div>
                <div className="mt-1 truncate text-[11px] text-muted-foreground">{n.task}</div>
              </div>
            </button>
          ))}
        </div>

        <aside className="space-y-4">
          <div className="panel p-5">
            <SectionLabel>Selected node</SectionLabel>
            <div className="mt-2 flex items-center gap-2">
              <StatusDot status={node.status} />
              <span className="font-mono text-lg">{node.id}</span>
              <span className="ml-auto rounded-sm bg-secondary px-2 py-0.5 font-mono text-[10px] uppercase">{node.status}</span>
            </div>
            <dl className="mt-4 space-y-2 text-sm">
              {[
                ["Host", node.host],
                ["Agent", node.agent],
                ["Task", node.task],
                ["Model", node.model],
                ["Isolation", "1 VM per task"],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 border-b border-border/60 pb-2">
                  <dt className="text-muted-foreground">{k}</dt>
                  <dd className="truncate text-right font-mono text-xs">{v}</dd>
                </div>
              ))}
            </dl>
            {[
              ["CPU", node.cpu],
              ["Memory", node.mem],
            ].map(([k, v]) => (
              <div key={k} className="mt-4">
                <div className="flex justify-between font-mono text-[11px] text-muted-foreground">
                  <span>{k}</span>
                  <span>{v}%</span>
                </div>
                <div className="mt-1 h-1.5 rounded-full bg-secondary">
                  <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${v}%` }} />
                </div>
              </div>
            ))}
            <div className="mt-5 grid grid-cols-3 gap-2">
              {["Pause", "Resume", "Recycle"].map((a) => (
                <button key={a} className="rounded-sm border border-border py-1.5 text-xs hover:border-primary hover:text-primary">
                  {a}
                </button>
              ))}
            </div>
          </div>
          <div className="panel p-5">
            <SectionLabel>Legend</SectionLabel>
            <ul className="mt-3 space-y-2 text-sm">
              {[
                ["busy", "Agent working"],
                ["paused", "Paused · volume kept"],
                ["idle", "Warm pool, ready"],
                ["error", "Failed · orchestration resuming"],
              ].map((pair) => pair as [string, string]).map(([s, l]) => (
                <li key={s} className="flex items-center gap-2"><StatusDot status={s} /> {l}</li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
