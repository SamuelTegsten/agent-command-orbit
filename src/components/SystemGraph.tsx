import { useEffect, useMemo, useRef, useState } from "react";
import { Lock, Pause, Play } from "lucide-react";
import { gedges, gnodes, scenario, zones, type Flow, type GEdge } from "@/lib/systemGraph";
import { SectionLabel } from "@/components/AppShell";

const W = 160;
const H = 100;
const NW = 17; // node width (canvas units)
const NH = 9;

const flowStroke: Record<Flow, string> = {
  work: "stroke-primary",
  control: "stroke-accent",
  data: "stroke-chart-5",
  model: "stroke-success",
  feedback: "stroke-foreground",
};
const flowFill: Record<Flow, string> = {
  work: "fill-primary",
  control: "fill-accent",
  data: "fill-chart-5",
  model: "fill-success",
  feedback: "fill-foreground",
};
const flowLabel: Record<Flow, string> = { work: "Work", control: "Control / policy", data: "Telemetry", model: "Inference", feedback: "Feedback to people" };

const byId = Object.fromEntries(gnodes.map((n) => [n.id, n]));

// Orthogonal "rail" routing: straight segments with softly rounded corners.
function ortho(pts: [number, number][], r = 1.6) {
  let d = `M ${pts[0]![0]} ${pts[0]![1]}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const [px, py] = pts[i - 1]!; const [cx, cy] = pts[i]!; const [nx, ny] = pts[i + 1]!;
    const l1 = Math.hypot(cx - px, cy - py), l2 = Math.hypot(nx - cx, ny - cy);
    const rr = Math.min(r, l1 / 2, l2 / 2);
    if (rr < 0.05) { d += ` L ${cx} ${cy}`; continue; }
    const ax = cx - ((cx - px) / l1) * rr, ay = cy - ((cy - py) / l1) * rr;
    const bx = cx + ((nx - cx) / l2) * rr, by = cy + ((ny - cy) / l2) * rr;
    d += ` L ${ax} ${ay} Q ${cx} ${cy} ${bx} ${by}`;
  }
  const last = pts[pts.length - 1]!;
  return d + ` L ${last[0]} ${last[1]}`;
}

function edgeGeom(e: GEdge, idx: number) {
  const a = byId[e.from]!;
  const b = byId[e.to]!;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lane = ((idx % 3) - 1) * 0.9; // spread parallel rails apart
  if (Math.abs(dx) >= NW) {
    const sx = a.x + Math.sign(dx) * (NW / 2);
    const tx = b.x - Math.sign(dx) * (NW / 2);
    const mx = (sx + tx) / 2 + lane;
    const sy = a.y + lane * 0.6, ty = b.y + lane * 0.6;
    return { d: ortho([[sx, sy], [mx, sy], [mx, ty], [tx, ty]]), s: [sx, sy] as const, t: [tx, ty] as const };
  }
  const sy = a.y + Math.sign(dy || 1) * (NH / 2);
  const ty = b.y - Math.sign(dy || 1) * (NH / 2);
  const my = (sy + ty) / 2 + lane;
  const sx = a.x + lane * 2, tx = b.x + lane * 2;
  return { d: ortho([[sx, sy], [sx, my], [tx, my], [tx, ty]]), s: [sx, sy] as const, t: [tx, ty] as const };
}

export function SystemGraph({ title = "", subtitle = "", compact = false, onSelect, onStep }: { title?: string; subtitle?: string; compact?: boolean; onSelect?: (id: string) => void; onStep?: (step: number) => void }) {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [hover, setHover] = useState<string | null>(null);
  const [selected, setSelected] = useState<string>("orch");
  const [log, setLog] = useState<{ k: number; t: string; msg: string }[]>([]);
  const [visible, setVisible] = useState<Record<Flow, boolean>>({ work: true, control: true, data: true, model: true, feedback: true });
  const geoms = useMemo(() => Object.fromEntries(gedges.map((e, i) => [e.id, edgeGeom(e, i)])), []);
  const paths = useMemo(() => Object.fromEntries(gedges.map((e) => [e.id, geoms[e.id]!.d])), [geoms]);
  const [hoverEdge, setHoverEdge] = useState<string | null>(null);
  const [view, setView] = useState({ z: 1, x: 0, y: 0 });
  const viewRef = useRef(view);
  viewRef.current = view;
  const stageRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; y: number; ox: number; oy: number; moved: boolean } | null>(null);
  const zoomAt = (next: number, px: number, py: number) => {
    setView((v) => {
      const z = Math.min(4, Math.max(0.5, next));
      const k = z / v.z;
      return { z, x: px - (px - v.x) * k, y: py - (py - v.y) * k };
    });
  };
  const zoomCenter = (f: number) => {
    const r = stageRef.current?.getBoundingClientRect();
    if (r) zoomAt(viewRef.current.z * f, r.width / 2, r.height / 2);
  };
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const dy = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 100 : 1);
      const r = el.getBoundingClientRect();
      zoomAt(viewRef.current.z * Math.exp(-dy * 0.0018), e.clientX - r.left, e.clientY - r.top);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => setStep((s) => (s + 1) % scenario.length), 1300);
    return () => clearInterval(id);
  }, [playing]);

  useEffect(() => {
    const s = scenario[step];
    if (!s) return;
    onStep?.(step);
    setLog((l) => [{ k: Date.now(), t: new Date().toLocaleTimeString("en-GB"), msg: s.log }, ...l].slice(0, 7));
  }, [step]);

  useEffect(() => {
    onSelect?.(selected);
  }, [selected, onSelect]);

  const activeEdge = gedges.find((e) => e.id === scenario[step]?.edge);
  const trail = new Set(scenario.slice(Math.max(0, step - 3), step).map((s) => s.edge));
  const hE = hoverEdge ? gedges.find((e) => e.id === hoverEdge) : undefined;
  const focus = hover ?? null;
  const connected = (eid: GEdge) => (hE ? eid.id === hE.id : !focus || eid.from === focus || eid.to === focus);
  const nodeLit = (id: string) => activeEdge && (activeEdge.from === id || activeEdge.to === id);
  const sel = byId[selected]!;
  const selEdges = gedges.filter((e) => e.from === selected || e.to === selected);

  return (
    <div className={compact ? "relative" : "panel overflow-hidden"}>
      <div className={compact ? "absolute bottom-3 left-3 z-20 flex flex-wrap items-center gap-1.5 rounded-md border border-border bg-background/80 p-1.5 backdrop-blur" : "flex flex-wrap items-end justify-between gap-3 border-b border-border px-5 py-4"}>
        {!compact && (
          <div>
            <SectionLabel>{subtitle}</SectionLabel>
            <h2 className="mt-1 text-xl font-semibold">{title}</h2>
          </div>
        )}
        <div className="flex flex-wrap items-center gap-1.5">
          {(Object.keys(flowLabel) as Flow[]).map((f) => (
            <button
              key={f}
              onClick={() => setVisible({ ...visible, [f]: !visible[f] })}
              className={`flex items-center gap-1.5 rounded-sm border px-2 py-1 font-mono text-[10px] transition-opacity ${visible[f] ? "border-border" : "border-transparent opacity-40"}`}
            >
              <svg width="14" height="4"><line x1="0" y1="2" x2="14" y2="2" strokeWidth="2" className={flowStroke[f]} /></svg>
              {flowLabel[f]}
            </button>
          ))}
          <button onClick={() => setPlaying(!playing)} className="ml-2 flex items-center gap-1.5 rounded-sm bg-primary px-2.5 py-1 text-xs text-primary-foreground">
            {playing ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />} {playing ? "Pause" : "Play"}
          </button>
        </div>
      </div>

      <div
        ref={stageRef}
        className="relative aspect-[16/10] w-full touch-none overflow-hidden bg-grid cursor-grab active:cursor-grabbing select-none"
        onPointerDown={(e) => { drag.current = { x: e.clientX, y: e.clientY, ox: view.x, oy: view.y, moved: false }; }}
        onPointerMove={(e) => {
          const d = drag.current; if (!d) return;
          const mx = e.clientX - d.x, my = e.clientY - d.y;
          if (!d.moved && Math.hypot(mx, my) > 4) { d.moved = true; (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); }
          if (d.moved) setView((v) => ({ ...v, x: d.ox + mx, y: d.oy + my }));
        }}
        onPointerUp={() => { setTimeout(() => { drag.current = null; }, 0); }}
        onClickCapture={(e) => { if (drag.current?.moved) { e.stopPropagation(); e.preventDefault(); } }}
      >
        {/* zoom controls */}
        <div className="absolute right-3 top-3 z-30 flex flex-col overflow-hidden rounded-md border border-border bg-background/85 backdrop-blur" onPointerDown={(e) => e.stopPropagation()}>
          <button onClick={() => zoomCenter(1.25)} className="px-2.5 py-1.5 text-sm hover:bg-secondary" aria-label="Zoom in">+</button>
          <button onClick={() => zoomCenter(0.8)} className="border-t border-border px-2.5 py-1.5 text-sm hover:bg-secondary" aria-label="Zoom out">−</button>
          <button onClick={() => setView({ z: 1, x: 0, y: 0 })} className="border-t border-border px-1 py-1.5 font-mono text-[9px] hover:bg-secondary" aria-label="Reset view">{Math.round(view.z * 100)}%</button>
        </div>
        {hE && (
          <div className="pointer-events-none absolute left-3 top-3 z-30 rounded-md border border-primary/50 bg-background/90 px-2.5 py-1.5 font-mono text-[10px]">
            <span className="text-primary">{byId[hE.from]!.label}</span> → <span className="text-primary">{byId[hE.to]!.label}</span>
            <div className="text-muted-foreground">{hE.label} · {flowLabel[hE.flow]}</div>
          </div>
        )}
        {/* docked "now happening" card — stays put while the flow moves */}
        {activeEdge && (
          <div className="pointer-events-none absolute bottom-3 right-3 z-30 w-[230px] overflow-hidden rounded-md border border-border bg-background/90 shadow-lg backdrop-blur">
            <div className="flex items-center justify-between border-b border-border px-2.5 py-1.5">
              <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">Now happening</span>
              <span className="font-mono text-[9px] text-muted-foreground">{step + 1}/{scenario.length}</span>
            </div>
            <div key={`c-${step}`} className="fade-in space-y-1 px-2.5 py-2 text-[11px]">
              <div className="flex items-center gap-1.5 font-medium">
                <span className="truncate">{byId[activeEdge.from]!.label}</span>
                <span className={activeEdge.blocked ? "text-destructive" : "text-primary"}>→</span>
                <span className="truncate">{byId[activeEdge.to]!.label}</span>
              </div>
              <div className="font-mono text-[10px] text-muted-foreground line-clamp-2">{scenario[step]?.log}</div>
            </div>
            <div className="h-0.5 bg-secondary"><div key={`p-${step}`} className="h-full bg-primary transition-all duration-500" style={{ width: `${((step + 1) / scenario.length) * 100}%` }} /></div>
          </div>
        )}
        <div className="absolute inset-0 origin-top-left" style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.z})` }}>
        <svg className="absolute inset-0 h-full w-full" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
          <defs>
            <filter id="sg-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="0.7" />
              <feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            {(Object.keys(flowStroke) as Flow[]).map((f) => (
              <marker key={f} id={`arrow-${f}`} viewBox="0 0 6 6" refX="4.6" refY="3" markerWidth="1.6" markerHeight="1.6" markerUnits="userSpaceOnUse" orient="auto">
                 <path d="M0,0 L6,3 L0,6 z" className={flowFill[f]} />
              </marker>
            ))}
          </defs>

          {/* zones */}
          {zones.map((z) => (
            <g key={z.id}>
              <rect x={z.x} y={3} width={z.w} height={95} rx={1.2} className="fill-secondary/25 stroke-border" strokeWidth={0.15} strokeDasharray="0.8 0.8" />
            </g>
          ))}

          {/* edges */}
          {gedges.map((e) => {
            if (!visible[e.flow]) return null;
            const isActive = activeEdge?.id === e.id;
            const inTrail = trail.has(e.id);
            const dim = !connected(e);
            return (
              <g key={e.id} className="transition-opacity duration-300" opacity={dim ? 0.12 : 1}>
                <path id={`sg-${e.id}`} d={paths[e.id]} fill="none" vectorEffect="non-scaling-stroke" strokeWidth={hoverEdge === e.id ? 3.5 : isActive ? 3 : inTrail ? 2 : 1.4}
                  strokeOpacity={hoverEdge === e.id || isActive ? 1 : inTrail ? 0.8 : 0.5}
                  strokeDasharray={e.blocked ? "3 4" : undefined}
                  className={`${e.blocked ? "stroke-destructive" : flowStroke[e.flow]} ${!e.blocked ? "flow-dash" : ""}`}
                  markerEnd={`url(#arrow-${e.flow})`}
                />
                {/* connector pips at both ends */}
                {[geoms[e.id]!.s, geoms[e.id]!.t].map(([px, py], k) => (
                  <rect key={k} x={px - 0.45} y={py - 0.7} width={0.9} height={1.4} rx={0.2} className={`${e.blocked ? "fill-destructive" : flowFill[e.flow]}`} opacity={0.9} />
                ))}
                {/* wide invisible hit area so lines are easy to find */}
                <path d={paths[e.id]} fill="none" stroke="transparent" strokeWidth={12} vectorEffect="non-scaling-stroke" pointerEvents="stroke" className="cursor-pointer"
                  onMouseEnter={() => setHoverEdge(e.id)} onMouseLeave={() => setHoverEdge(null)} onClick={() => setSelected(e.to)} />
                {/* ambient flow */}
                {!e.blocked && [0, 1].map((k) => (
                  <circle key={k} r={0.45} className={flowFill[e.flow]} opacity={0.7}>
                    <animateMotion dur={`${3 + (e.id.length % 3)}s`} begin={`${k * 1.6 + (Number(e.id.slice(1)) % 5) * 0.3}s`} repeatCount="indefinite">
                      <mpath href={`#sg-${e.id}`} />
                    </animateMotion>
                  </circle>
                ))}
              </g>
            );
          })}

          {/* scenario burst on the active edge */}
          {activeEdge && visible[activeEdge.flow] && <Burst key={`${step}-${activeEdge.id}`} d={paths[activeEdge.id]!} cls={activeEdge.blocked ? "fill-destructive" : flowFill[activeEdge.flow]} blocked={activeEdge.blocked} />}
        </svg>

        {/* zone labels */}
        {zones.map((z) => (
          <div key={z.id} className="pointer-events-none absolute" style={{ left: `${((z.x + 1) / W) * 100}%`, top: "4.5%" }}>
            <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-foreground/80">{z.label}</div>
            <div className="font-mono text-[8px] text-muted-foreground">{z.runsOn}</div>
          </div>
        ))}

        {/* small tag pinned above the receiving node */}
        {activeEdge && (() => {
          const n = byId[activeEdge.to]!;
          return (
            <div key={`t-${step}`} className="fade-in pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-full" style={{ left: `${(n.x / W) * 100}%`, top: `${((n.y - NH / 2 - 0.8) / H) * 100}%` }}>
              <div className={`whitespace-nowrap rounded-sm px-1.5 py-0.5 font-mono text-[9px] font-semibold shadow ${activeEdge.blocked ? "bg-destructive text-destructive-foreground" : "bg-primary text-primary-foreground"}`}>
                {activeEdge.blocked ? "✕ blocked" : `↓ ${activeEdge.label}`}
              </div>
            </div>
          );
        })()}

        {/* nodes */}
        {gnodes.map((n) => {
          const Icon = n.icon;
          const lit = nodeLit(n.id);
          const isSel = selected === n.id;
          const dim = focus && focus !== n.id && !gedges.some((e) => (e.from === focus && e.to === n.id) || (e.to === focus && e.from === n.id));
          return (
            <button
              key={n.id}
              onClick={() => setSelected(n.id)}
              onMouseEnter={() => setHover(n.id)}
              onMouseLeave={() => setHover(null)}
              className={`absolute -translate-x-1/2 -translate-y-1/2 text-left transition-all duration-300 ${dim ? "opacity-25" : ""}`}
              style={{ left: `${(n.x / W) * 100}%`, top: `${(n.y / H) * 100}%`, width: `${(NW / W) * 100}%`, height: `${(NH / H) * 100}%` }}
            >
              {lit && <span className="pointer-events-none absolute -inset-1.5 rounded-md border border-primary/60 ping-soft" />}
              <div
                className={`relative flex h-full items-center gap-2 rounded-md border px-2 backdrop-blur transition-all duration-300 ${
                  n.locked ? "border-destructive/40 bg-destructive/5" : lit ? "border-primary bg-primary/15 glow-primary" : isSel ? "border-accent bg-card glow-accent" : "border-border bg-card/90 hover:border-muted-foreground"
                }`}
              >
                <div className={`hex grid h-7 w-8 shrink-0 place-items-center ${n.locked ? "bg-destructive/20 text-destructive" : lit ? "bg-primary text-primary-foreground" : "bg-secondary text-accent"}`}>
                  {n.locked ? <Lock className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
                </div>
                <div className="min-w-0">
                  <div className="line-clamp-2 text-[10.5px] font-medium leading-tight">{n.label}</div>
                  <div className="truncate font-mono text-[9px] text-muted-foreground">{lit ? "● active" : n.metric}</div>
                </div>
              </div>
            </button>
          );
        })}

        {/* workspaces mini VMs */}
        <div className="pointer-events-none absolute flex gap-1" style={{ left: `${((116.5 - 6.5) / W) * 100}%`, top: `${((62 + 6.5) / H) * 100}%` }}>
          {["busy", "busy", "busy", "paused", "idle", "busy"].map((s, i) => (
            <span key={i} className={`hex h-3 w-3.5 ${s === "busy" ? "bg-primary/80 blink" : s === "paused" ? "bg-accent/70" : "bg-border"}`} style={{ animationDelay: `${i * 0.25}s` }} />
          ))}
        </div>
        {/* GPU meter */}
        <div className="pointer-events-none absolute flex h-4 items-end gap-0.5" style={{ left: `${((145 - 6) / W) * 100}%`, top: `${((64 + 6) / H) * 100}%` }}>
          {Array.from({ length: 10 }).map((_, i) => (
            <span key={i} className="eq w-1 origin-bottom rounded-sm bg-success/80" style={{ height: "100%", animationDelay: `${i * 0.09}s` }} />
          ))}
        </div>
        </div>
      </div>

      {!compact && <div className="grid gap-0 border-t border-border md:grid-cols-[1fr_1.2fr]">
        <div className="border-b border-border p-4 md:border-b-0 md:border-r">
          <SectionLabel>Selected · {zones.find((z) => z.id === sel.zone)?.label}</SectionLabel>
          <div className="mt-1.5 flex items-center gap-2">
            <span className="font-semibold">{sel.label}</span>
            <span className="ml-auto font-mono text-[11px] text-muted-foreground">{sel.metric}</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{sel.desc}</p>
          <div className="mt-3 flex flex-wrap gap-1">
            {selEdges.map((e) => {
              const other = e.from === selected ? byId[e.to]! : byId[e.from]!;
              return (
                <button key={e.id} onClick={() => setSelected(other.id)} className="rounded-sm border border-border px-1.5 py-0.5 font-mono text-[10px] hover:border-primary">
                  {e.from === selected ? "→" : "←"} {other.label} · <span className="text-muted-foreground">{e.label}</span>
                </button>
              );
            })}
          </div>
        </div>
        <div className="h-[150px] overflow-hidden p-4 font-mono text-[11px]">
          <div className="mb-1.5 flex items-center justify-between">
            <SectionLabel>Live trace · run-8812</SectionLabel>
            <span className="text-muted-foreground">step {step + 1}/{scenario.length}</span>
          </div>
          {log.map((l, i) => (
            <div key={l.k} className={`fade-in truncate ${i === 0 ? "text-primary" : "text-muted-foreground"}`} style={{ opacity: 1 - i * 0.12 }}>
              <span className="text-muted-foreground">{l.t}</span> › {l.msg}
            </div>
          ))}
        </div>
      </div>}
    </div>
  );
}

// A comet of particles racing along one path, driven by rAF.
function Burst({ d, cls, blocked }: { d: string; cls: string; blocked?: boolean | undefined }) {
  const pathRef = useRef<SVGPathElement>(null);
  const dots = useRef<(SVGCircleElement | null)[]>([]);
  useEffect(() => {
    const p = pathRef.current;
    if (!p) return;
    const len = p.getTotalLength();
    const stop = blocked ? 0.55 : 1;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = (now - start) / 1100;
      dots.current.forEach((c, i) => {
        if (!c) return;
        const tt = Math.min(stop, Math.max(0, t - i * 0.06));
        const pt = p.getPointAtLength(tt * len);
        c.setAttribute("cx", String(pt.x));
        c.setAttribute("cy", String(pt.y));
        c.setAttribute("opacity", t - i * 0.06 < 0 ? "0" : t > 1.3 ? "0" : String(1 - i * 0.15));
      });
      if (t < 1.4) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [blocked]);
  return (
    <g filter="url(#sg-glow)">
      <path ref={pathRef} d={d} fill="none" stroke="none" />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <circle key={i} ref={(el) => { dots.current[i] = el; }} r={i === 0 ? 1.1 : 0.8 - i * 0.1} className={cls} opacity={0} />
      ))}
    </g>
  );
}
