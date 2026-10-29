import { Monitor, Laptop, Server, Terminal, Network, Lock, Cpu, Plus } from "lucide-react";
import { clients, hosts, hubParts, models, type TopoNode, type WorkType } from "@/lib/mock";
import { StatusDot } from "@/components/AppShell";
import type { Selection, Topo } from "./useTopology";

const kindIcon = { Workstation: Monitor, Laptop, Service: Server, Terminal } as const;

// Layout in % of an exact 16:10 canvas. SVG uses viewBox 160x100, so x * 1.6.
const X = 1.6;
const HUB = { x: 44, y: 40, left: 33, right: 55, bottom: 60 };
const clientY = (i: number) => 14 + i * 22;
const zoneTop = (i: number) => 4 + i * 32;
const slotY = (hi: number, si: number) => zoneTop(hi) + 9 + si * 7.4;
const modelX = (i: number) => 32 + i * 12;
const MODEL_Y = 88;

const typeColor: Record<WorkType, string> = { task: "fill-primary", review: "fill-accent", maintenance: "fill-success" };

function curve(x1: number, y1: number, x2: number, y2: number) {
  const dx = (x2 - x1) * 0.5;
  return `M ${x1 * X} ${y1} C ${(x1 + dx) * X} ${y1}, ${(x2 - dx) * X} ${y2}, ${x2 * X} ${y2}`;
}
function vcurve(x1: number, y1: number, x2: number, y2: number) {
  const dy = (y2 - y1) * 0.5;
  return `M ${x1 * X} ${y1} C ${x1 * X} ${y1 + dy}, ${x2 * X} ${y2 - dy}, ${x2 * X} ${y2}`;
}

function lineClass(status: string) {
  if (status === "busy") return "stroke-primary";
  if (status === "error") return "stroke-destructive";
  if (status === "paused") return "stroke-accent";
  if (status === "transition") return "stroke-foreground";
  return "stroke-border";
}

export function TopologyCanvas({ topo }: { topo: Topo }) {
  const { nodes, selection, setSelection, setHover, highlight, matches, traffic } = topo;
  const dim = (id: string) => (highlight && !highlight.has(id) ? "opacity-20" : "opacity-100");
  const isSel = (s: Selection) => selection.kind === s.kind && selection.id === s.id;
  const bind = (s: Selection) => ({
    onClick: () => setSelection(s),
    onMouseEnter: () => setHover(s),
    onMouseLeave: () => setHover(null),
  });

  // node positions by host + slot
  const placed = hosts.flatMap((h, hi) => {
    const list = nodes.filter((n) => n.host === h.id);
    return Array.from({ length: h.slots }, (_, si) => ({ host: h, hi, si, node: list[si] as TopoNode | undefined }));
  });

  const linkActive = (cid: string) => nodes.some((n) => n.client === cid && (n.status === "busy" || n.status === "transition"));

  return (
    <div className="panel relative aspect-[16/10] w-full overflow-hidden select-none">
      <div className="absolute left-4 top-2.5 font-mono text-[10px] tracking-widest text-muted-foreground">CLIENTS</div>
      <div className="absolute top-2.5 -translate-x-1/2 font-mono text-[10px] tracking-widest text-muted-foreground" style={{ left: `${HUB.x}%` }}>HUB · CONTROL PLANE</div>

      <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 160 100" preserveAspectRatio="none">
        <defs>
          <filter id="glow"><feGaussianBlur stdDeviation="0.6" /><feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        </defs>
        {/* client → hub */}
        {clients.map((c, i) => {
          const active = linkActive(c.id) || c.status !== "idle";
          const d = curve(20, clientY(i), HUB.left, HUB.y + (i - 1.5) * 3);
          return (
            <g key={c.id} className={`transition-opacity duration-300 ${dim(c.id)}`}>
              <path id={`p-${c.id}`} d={d} fill="none" vectorEffect="non-scaling-stroke" strokeWidth={1.5} className={active ? "stroke-accent flow-dash" : "stroke-border"} />
              {traffic && active && <Packet path={`p-${c.id}`} cls="fill-accent" dur={2.6} offset={i * 0.6} />}
            </g>
          );
        })}
        {/* hub → nodes */}
        {placed.map(({ node, hi, si }) => {
          if (!node) return null;
          const d = curve(HUB.right, HUB.y + (hi - 1) * 4, 68, slotY(hi, si));
          const live = node.status === "busy";
          const sel = selection.id === node.id;
          return (
            <g key={node.id} className={`transition-opacity duration-300 ${dim(node.id)}`}>
              <path id={`p-${node.id}`} d={d} fill="none" vectorEffect="non-scaling-stroke" strokeWidth={sel ? 2.5 : 1.5} className={`${lineClass(node.status)} ${live || node.status === "error" ? "flow-dash" : ""}`} />
              {traffic && live && (
                <>
                  <Packet path={`p-${node.id}`} cls={typeColor[node.type]} dur={2.2} offset={si * 0.5 + hi * 0.3} />
                  <Packet path={`p-${node.id}`} cls="fill-foreground" dur={3} offset={1.4 + si * 0.4} reverse />
                </>
              )}
            </g>
          );
        })}
        {/* hub → models */}
        {models.map((m, i) => {
          const d = vcurve(HUB.x + (i - 1) * 6, HUB.bottom, modelX(i), MODEL_Y - 4);
          const used = nodes.some((n) => n.model === m.id && n.status === "busy");
          return (
            <g key={m.id} className={`transition-opacity duration-300 ${dim(m.id)}`}>
              <path id={`p-${m.id}`} d={d} fill="none" vectorEffect="non-scaling-stroke" strokeWidth={1.5} strokeDasharray={m.blocked ? "2 4" : undefined} className={m.blocked ? "stroke-destructive/50" : used ? "stroke-chart-5 flow-dash" : "stroke-border"} />
              {traffic && used && <Packet path={`p-${m.id}`} cls="fill-chart-5" dur={1.8} offset={i * 0.7} />}
            </g>
          );
        })}
      </svg>

      {/* Clients */}
      {clients.map((c, i) => {
        const Icon = kindIcon[c.kind as keyof typeof kindIcon];
        const s: Selection = { kind: "client", id: c.id };
        const count = nodes.filter((n) => n.client === c.id).length;
        return (
          <button key={c.id} {...bind(s)} className={`absolute w-[18%] -translate-x-1/2 -translate-y-1/2 text-left transition-opacity duration-300 ${dim(c.id)}`} style={{ left: "11%", top: `${clientY(i)}%` }}>
            <div className={`panel flex items-center gap-3 p-3 transition-all ${isSel(s) ? "border-accent glow-accent" : "hover:border-muted-foreground"}`}>
              <Icon className="h-5 w-5 shrink-0 text-accent" />
              <div className="min-w-0">
                <div className="truncate font-mono text-xs">{c.name}</div>
                <div className="truncate text-[11px] text-muted-foreground">{c.user}</div>
              </div>
              <div className="ml-auto flex flex-col items-end gap-1">
                <StatusDot status={c.status} />
                <span className="font-mono text-[9px] text-muted-foreground">{count}↗</span>
              </div>
            </div>
          </button>
        );
      })}

      {/* Hub */}
      <div className={`absolute -translate-x-1/2 -translate-y-1/2 transition-opacity duration-300 ${dim("hub")}`} style={{ left: `${HUB.x}%`, top: `${HUB.y}%`, width: "22%" }}>
        <div className="pointer-events-none absolute -inset-5 rounded-full border border-primary/25 blink" />
        <div className={`panel relative p-3 transition-all ${selection.kind === "hub" ? "border-primary glow-primary" : "border-primary/50"}`}>
          <button {...bind({ kind: "hub", id: "hub" })} className="flex w-full items-center gap-2 text-left">
            <Network className="h-5 w-5 text-primary" />
            <span className="font-semibold tracking-wide">HUB</span>
            <span className="ml-auto font-mono text-[10px] text-success">● LIVE</span>
          </button>
          <div className="mt-2.5 grid grid-cols-2 gap-1.5">
            {hubParts.map((p) => {
              const s: Selection = { kind: "part", id: p.id };
              return (
                <button key={p.id} {...bind(s)} className={`rounded-sm border px-2 py-1.5 text-left transition-colors ${isSel(s) ? "border-primary bg-primary/10" : "border-transparent bg-secondary hover:border-border"}`}>
                  <div className="truncate text-[11px]">{p.label}</div>
                  <div className="truncate font-mono text-[9px] text-muted-foreground">{p.stat}</div>
                </button>
              );
            })}
          </div>
          <div className="relative mt-2.5 h-1 overflow-hidden rounded-full bg-secondary">
            <div className="absolute inset-y-0 w-1/4 bg-primary scan" />
          </div>
        </div>
      </div>

      {/* Inference lane */}
      <div className="absolute -translate-x-1/2 -translate-y-1/2 rounded-sm border border-dashed border-border px-2 pb-1 pt-4" style={{ left: `${modelX(1)}%`, top: `${MODEL_Y + 2}%`, width: "40%" }}>
        <div className="absolute left-2 top-0.5 font-mono text-[9px] tracking-widest text-muted-foreground">INFERENCE · GPU SERVERS</div>
      </div>
      {models.map((m, i) => {
        const s: Selection = { kind: "model", id: m.id };
        return (
          <button key={m.id} {...bind(s)} className={`absolute w-[11%] -translate-x-1/2 -translate-y-1/2 transition-opacity duration-300 ${dim(m.id)}`} style={{ left: `${modelX(i)}%`, top: `${MODEL_Y + 2.5}%` }}>
            <div className={`flex items-center gap-1.5 rounded-sm border px-2 py-1.5 text-left ${m.blocked ? "border-destructive/40 bg-destructive/5 text-muted-foreground" : "border-border bg-card"} ${isSel(s) ? "border-chart-5 glow-accent" : ""}`}>
              {m.blocked ? <Lock className="h-3 w-3 shrink-0 text-destructive" /> : <Cpu className="h-3 w-3 shrink-0 text-chart-5" />}
              <span className="truncate font-mono text-[10px]">{m.label}</span>
            </div>
          </button>
        );
      })}

      {/* Host zones + nodes */}
      {hosts.map((h, hi) => {
        const hn = nodes.filter((n) => n.host === h.id);
        const load = Math.round(hn.reduce((a, n) => a + n.cpu, 0) / h.slots);
        return (
          <div key={h.id} className="absolute rounded-md border border-border/70 bg-secondary/30" style={{ left: "67%", width: "31%", top: `${zoneTop(hi)}%`, height: "29%" }}>
            <div className="flex items-center gap-2 px-2.5 pt-1.5 font-mono text-[10px]">
              <Server className="h-3 w-3 text-muted-foreground" />
              <span>{h.id}</span>
              <span className="text-muted-foreground">· {h.zone}</span>
              <span className="ml-auto text-muted-foreground">load {load}%</span>
            </div>
            <div className="mx-2.5 mt-1 h-0.5 rounded-full bg-secondary">
              <div className="h-full rounded-full bg-primary/70 transition-all duration-700" style={{ width: `${load}%` }} />
            </div>
          </div>
        );
      })}
      {placed.map(({ node, hi, si, host }) => {
        const style = { left: "82.5%", top: `${slotY(hi, si)}%`, width: "29%" };
        if (!node)
          return (
            <div key={`${host.id}-${si}`} className="absolute flex h-[6.4%] -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-sm border border-dashed border-border px-2.5 font-mono text-[10px] text-muted-foreground" style={style}>
              <Plus className="h-3 w-3" /> empty slot
            </div>
          );
        const s: Selection = { kind: "node", id: node.id };
        const ok = matches(node);
        return (
          <button key={node.id} {...bind(s)} className={`absolute h-[6.4%] -translate-x-1/2 -translate-y-1/2 text-left transition-opacity duration-300 ${ok ? dim(node.id) : "opacity-15"}`} style={style}>
            <div className={`panel flex h-full items-center gap-2 px-2.5 transition-all ${isSel(s) ? "border-primary glow-primary" : "hover:border-muted-foreground"} ${node.status === "transition" ? "animate-pulse" : ""}`}>
              <StatusDot status={node.status} />
              <span className="font-mono text-[11px]">{node.id}</span>
              <span className="min-w-0 flex-1 truncate text-[10px] text-muted-foreground">{node.task}</span>
              <span className="w-8 text-right font-mono text-[10px] text-muted-foreground">{node.cpu}%</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function Packet({ path, cls, dur, offset, reverse }: { path: string; cls: string; dur: number; offset: number; reverse?: boolean }) {
  return (
    <circle r={0.9} className={cls} filter="url(#glow)">
      <animateMotion dur={`${dur}s`} begin={`${offset}s`} repeatCount="indefinite" keyPoints={reverse ? "1;0" : "0;1"} keyTimes="0;1" calcMode="linear">
        <mpath href={`#${path}`} />
      </animateMotion>
    </circle>
  );
}
