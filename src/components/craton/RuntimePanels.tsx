import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Boxes, ChevronRight, Copy, Cpu, Database, LayoutGrid, Rows3, Server, X, Power, RotateCcw, ScrollText } from "lucide-react";
import { toast } from "sonner";
import { fleet as fleetSeed, sandbox, setup, tokens, usage, type FleetNode, type SetupCard } from "@/lib/craton";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

const toneDot: Record<SetupCard["tone"], string> = { ok: "bg-success", warn: "bg-accent", bad: "bg-destructive", info: "bg-primary" };
const toneRank: Record<SetupCard["tone"], number> = { bad: 0, warn: 1, info: 2, ok: 3 };
const LOW_DISK = 7.5;

/* ───────────────────────── Setup: health strip ───────────────────────── */

export function SetupGrid() {
  const cards = useMemo(() => [...setup].sort((a, b) => toneRank[a.tone] - toneRank[b.tone]), []);
  const issues = cards.filter((c) => c.tone === "bad" || c.tone === "warn");
  const [open, setOpen] = useState<string | null>(null);
  const sel = cards.find((c) => c.key === open);

  return (
    <section className="panel overflow-hidden">
      <header className="panel-head flex items-center gap-3 px-3 py-2">
        <h2 className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em]">Setup</h2>
        <span className="font-mono text-[10px] text-muted-foreground">
          {cards.length - issues.length}/{cards.length} healthy
        </span>
        <div className="ml-auto flex h-1 w-32 overflow-hidden rounded-sm bg-border">
          {cards.map((c) => <span key={c.key} className={`h-full flex-1 border-r border-background ${toneDot[c.tone]}`} />)}
        </div>
      </header>

      {issues.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 border-b border-destructive/30 bg-destructive/10 px-3 py-2 text-xs">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-destructive" />
          <span className="font-medium">Usage window {usage.window} at {usage.pct}% — new work is paused.</span>
          <span className="font-mono text-[11px] text-muted-foreground">resumes {usage.resumes} · in {usage.resumesIn}</span>
          <button
            onClick={() => toast.success("You'll be notified when work resumes")}
            className="ml-auto rounded-sm border border-border bg-background/60 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider hover:border-primary hover:text-primary"
          >Notify on resume</button>
        </div>
      )}

      <div className="grid grid-cols-2 divide-x divide-y divide-border/60 md:grid-cols-3 xl:grid-cols-6 xl:divide-y-0">
        {cards.map((c) => {
          const active = open === c.key;
          return (
            <button
              key={c.key}
              onClick={() => setOpen(active ? null : c.key)}
              aria-expanded={active}
              className={`group relative px-3 py-2.5 text-left transition-colors hover:bg-secondary/40 ${active ? "bg-secondary/50" : ""}`}
            >
              {active && <span className="absolute inset-x-0 top-0 h-0.5 bg-primary" />}
              <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                <span className={`h-1.5 w-1.5 rounded-full ${toneDot[c.tone]} ${c.tone === "bad" ? "blink" : ""}`} />
                {c.label}
                <ChevronRight className={`ml-auto h-3 w-3 transition-transform ${active ? "rotate-90 text-primary" : "opacity-0 group-hover:opacity-100"}`} />
              </div>
              <div className={`mt-0.5 font-display text-base font-bold ${c.tone === "bad" ? "text-destructive" : ""}`}>{c.value}</div>
              <div className="truncate text-[11px] text-muted-foreground">{c.sub}</div>
            </button>
          );
        })}
      </div>

      {sel && (
        <div className="fade-in border-t border-border/60 bg-background/40 px-3 py-2.5">
          <div className="mb-1.5 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            {sel.label} details
            <button onClick={() => setOpen(null)} className="ml-auto hover:text-foreground" aria-label="Close details"><X className="h-3 w-3" /></button>
          </div>
          <dl className="grid gap-x-6 gap-y-1 font-mono text-[11px] sm:grid-cols-2 lg:grid-cols-3">
            {sel.details.map(([k, v]) => (
              <div key={k} className="group flex items-center justify-between gap-3 border-b border-border/40 py-0.5">
                <dt className="text-muted-foreground">{k}</dt>
                <dd className="flex min-w-0 items-center gap-1.5">
                  <span className="truncate">{v}</span>
                  <button
                    onClick={() => { void navigator.clipboard?.writeText(v); toast(`Copied ${k}`); }}
                    className="opacity-0 transition-opacity hover:text-primary group-hover:opacity-100"
                    aria-label={`Copy ${k}`}
                  ><Copy className="h-3 w-3" /></button>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </section>
  );
}

/* ───────────────────────── Fleet ───────────────────────── */

type Filter = "all" | "busy" | "idle" | "attention";
type Sort = "id" | "failed" | "ran" | "disk";

const needsAttention = (n: FleetNode) => n.disk < LOW_DISK || (n.ran > 0 && n.failed / n.ran > 0.1) || n.status === "offline";
const failRate = (n: FleetNode) => (n.ran ? Math.round((n.failed / n.ran) * 100) : 0);

function useLiveFleet() {
  const [nodes, setNodes] = useState<FleetNode[]>(fleetSeed);
  useEffect(() => {
    const t = setInterval(() => {
      setNodes((ns) => ns.map((n) => {
        if (n.status === "busy") return { ...n, load: +(1.2 + Math.random() * 0.7).toFixed(2), mem: Math.round(40 + Math.random() * 25) };
        if (n.status === "idle") return { ...n, load: +(Math.random() * 0.04).toFixed(2), mem: Math.round(11 + Math.random() * 3) };
        return n;
      }));
    }, 2000);
    return () => clearInterval(t);
  }, []);
  const update = (id: string, patch: Partial<FleetNode>) => setNodes((ns) => ns.map((n) => (n.id === id ? { ...n, ...patch } : n)));
  return { nodes, update };
}

function Meter({ v, max = 100, warn = false, label, value }: { v: number; max?: number; warn?: boolean; label: string; value: string }) {
  const pct = Math.max(3, Math.min(100, (v / max) * 100));
  return (
    <div className="min-w-0">
      <div className="flex justify-between font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
        <span>{label}</span><span className={warn ? "text-accent" : "text-foreground"}>{value}</span>
      </div>
      <div className="mt-0.5 flex h-1 gap-px">
        {Array.from({ length: 10 }, (_, i) => (
          <span key={i} className={`flex-1 transition-colors duration-500 ${i < Math.round(pct / 10) ? (warn ? "bg-accent" : "bg-primary") : "bg-border"}`} />
        ))}
      </div>
    </div>
  );
}

function Recent({ n }: { n: FleetNode }) {
  return (
    <span className="flex gap-0.5" title="Last results, oldest → newest">
      {n.recent.map((r, i) => <span key={i} className={`h-2 w-1 ${r === "fail" ? "bg-destructive" : r === "warn" ? "bg-accent" : "bg-success/70"}`} />)}
    </span>
  );
}

function NodeTile({ n, onOpen }: { n: FleetNode; onOpen: () => void }) {
  const busy = n.status === "busy";
  const lowDisk = n.disk < LOW_DISK;
  return (
    <button onClick={onOpen} className={`group relative rounded-sm border bg-background/50 p-2.5 text-left transition-colors hover:border-primary/70 hover:bg-secondary/30 ${busy ? "border-primary/60" : "border-border"}`}>
      {busy && <span className="scan pointer-events-none absolute inset-0 overflow-hidden" />}
      <div className="flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${busy ? "bg-primary blink" : n.status === "offline" ? "bg-muted-foreground" : "bg-success"}`} />
        <span className="font-mono text-sm font-semibold">{n.id}</span>
        <span className="font-mono text-[10px] text-muted-foreground">{n.lastRole}</span>
        {needsAttention(n) && <AlertTriangle className="ml-auto h-3 w-3 text-accent" aria-label="Needs attention" />}
      </div>
      <div className="mt-1 truncate text-[11px] text-muted-foreground">
        {busy ? <span className="text-primary">working · </span> : <span>idle {n.idleFor} · </span>}{n.lastIntent}
      </div>
      <div className="mt-2 grid grid-cols-3 gap-2">
        <Meter label="load" v={n.load} max={n.cores} value={n.load.toFixed(2)} />
        <Meter label="mem" v={n.mem} value={`${n.mem}%`} />
        <Meter label="disk" v={20 - n.disk} max={20} warn={lowDisk} value={`${n.disk}G`} />
      </div>
      <div className="mt-2 flex items-center justify-between font-mono text-[10px] text-muted-foreground">
        <span>ran {n.ran}{n.failed > 0 && <span className="text-destructive"> · {n.failed} failed</span>}</span>
        <Recent n={n} />
      </div>
    </button>
  );
}

function NodeRow({ n, onOpen }: { n: FleetNode; onOpen: () => void }) {
  const busy = n.status === "busy";
  return (
    <tr onClick={onOpen} className="cursor-pointer border-b border-border/40 font-mono text-[11px] hover:bg-secondary/30">
      <td className="py-1.5 pl-2"><span className={`mr-2 inline-block h-1.5 w-1.5 rounded-full ${busy ? "bg-primary blink" : "bg-success"}`} />{n.id}</td>
      <td className={busy ? "text-primary" : "text-muted-foreground"}>{busy ? "working" : `idle ${n.idleFor}`}</td>
      <td className="text-muted-foreground">{n.lastRole}</td>
      <td className="max-w-[16rem] truncate">{n.lastIntent}</td>
      <td className="tabular-nums">{n.load.toFixed(2)}</td>
      <td className="tabular-nums">{n.mem}%</td>
      <td className={`tabular-nums ${n.disk < LOW_DISK ? "text-accent" : ""}`}>{n.disk}G</td>
      <td className="tabular-nums">{n.ran}</td>
      <td className={`tabular-nums ${failRate(n) > 10 ? "text-destructive" : "text-muted-foreground"}`}>{failRate(n)}%</td>
      <td className="pr-2"><Recent n={n} /></td>
    </tr>
  );
}

export function FleetPanel() {
  const { nodes, update } = useLiveFleet();
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<Sort>("id");
  const [view, setView] = useState<"grid" | "table">("grid");
  const [openId, setOpenId] = useState<string | null>(null);

  const busy = nodes.filter((n) => n.status === "busy").length;
  const attention = nodes.filter(needsAttention).length;
  const cores = nodes.reduce((a, n) => a + n.cores, 0);
  const ram = nodes.reduce((a, n) => a + n.memGb, 0);
  const totalRan = nodes.reduce((a, n) => a + n.ran, 0);
  const totalFailed = nodes.reduce((a, n) => a + n.failed, 0);

  const shown = useMemo(() => {
    const f = nodes.filter((n) =>
      filter === "all" ? true : filter === "attention" ? needsAttention(n) : n.status === filter);
    const by: Record<Sort, (a: FleetNode, b: FleetNode) => number> = {
      id: (a, b) => a.id.localeCompare(b.id),
      failed: (a, b) => b.failed - a.failed,
      ran: (a, b) => b.ran - a.ran,
      disk: (a, b) => a.disk - b.disk,
    };
    return [...f].sort(by[sort]);
  }, [nodes, filter, sort]);

  const openNode = nodes.find((n) => n.id === openId);

  const filters: { k: Filter; label: string; count: number }[] = [
    { k: "all", label: "All", count: nodes.length },
    { k: "busy", label: "Busy", count: busy },
    { k: "idle", label: "Idle", count: nodes.filter((n) => n.status === "idle").length },
    { k: "attention", label: "Attention", count: attention },
  ];

  const stats = [
    { icon: Server, k: "Utilisation", v: `${Math.round((busy / nodes.length) * 100)}%`, s: `${busy}/${nodes.length} busy · ${cores} cores · ${ram} GB` },
    { icon: Database, k: "Tokens", v: tokens.total, s: `in ${tokens.in} · out ${tokens.out} · cache ${tokens.cache}` },
    { icon: Boxes, k: "Sandbox", v: String(sandbox.active), s: `${sandbox.programs} programs · ${sandbox.waiting} waiting` },
    { icon: AlertTriangle, k: "Failure rate", v: `${Math.round((totalFailed / Math.max(1, totalRan)) * 100)}%`, s: `${totalFailed} of ${totalRan} runs` },
  ];

  return (
    <section className="panel overflow-hidden">
      <header className="panel-head flex flex-wrap items-center gap-3 px-3 py-2">
        <h2 className="flex items-center gap-2 font-mono text-[11px] font-semibold uppercase tracking-[0.2em]"><Cpu className="h-3.5 w-3.5 text-primary" /> Fleet</h2>
        <div className="flex h-1.5 w-40 gap-px" title="One block per node">
          {nodes.map((n) => <span key={n.id} className={`flex-1 ${n.status === "busy" ? "bg-primary" : needsAttention(n) ? "bg-accent/70" : "bg-success/50"}`} />)}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} aria-label="Sort nodes"
            className="h-7 rounded-sm border border-border bg-background px-2 font-mono text-[10px] uppercase tracking-wider">
            <option value="id">Sort: id</option><option value="failed">Sort: most failed</option>
            <option value="ran">Sort: most runs</option><option value="disk">Sort: lowest disk</option>
          </select>
          <div className="flex rounded-sm border border-border">
            {(["grid", "table"] as const).map((v) => (
              <button key={v} onClick={() => setView(v)} aria-label={`${v} view`} aria-pressed={view === v}
                className={`grid h-7 w-7 place-items-center ${view === v ? "bg-secondary text-primary" : "text-muted-foreground hover:text-foreground"}`}>
                {v === "grid" ? <LayoutGrid className="h-3.5 w-3.5" /> : <Rows3 className="h-3.5 w-3.5" />}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="grid grid-cols-2 divide-x divide-border/60 border-b border-border/60 lg:grid-cols-4">
        {stats.map((t) => (
          <div key={t.k} className="px-3 py-2">
            <div className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground"><t.icon className="h-3 w-3 text-primary" />{t.k}</div>
            <div className="font-display text-lg font-bold leading-tight">{t.v}</div>
            <div className="truncate text-[10px] text-muted-foreground">{t.s}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-1 px-3 pt-2.5">
        {filters.map((f) => (
          <button key={f.k} onClick={() => setFilter(f.k)} aria-pressed={filter === f.k}
            className={`rounded-sm border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider transition-colors ${filter === f.k ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground"}`}>
            {f.label} <span className="opacity-60">{f.count}</span>
          </button>
        ))}
      </div>

      <div className="p-3">
        {shown.length === 0 ? (
          <div className="py-8 text-center text-xs text-muted-foreground">No nodes match this filter.</div>
        ) : view === "grid" ? (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
            {shown.map((n) => <NodeTile key={n.id} n={n} onOpen={() => setOpenId(n.id)} />)}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                <tr className="border-b border-border">{["node", "state", "role", "last intent", "load", "mem", "disk", "ran", "fail", "recent"].map((h) => <th key={h} className="py-1.5 first:pl-2 font-normal">{h}</th>)}</tr>
              </thead>
              <tbody>{shown.map((n) => <NodeRow key={n.id} n={n} onOpen={() => setOpenId(n.id)} />)}</tbody>
            </table>
          </div>
        )}
      </div>

      <Sheet open={!!openNode} onOpenChange={(o) => !o && setOpenId(null)}>
        <SheetContent className="w-full sm:max-w-md">
          {openNode && <NodeDetail n={openNode} update={update} />}
        </SheetContent>
      </Sheet>
    </section>
  );
}

function NodeDetail({ n, update }: { n: FleetNode; update: (id: string, p: Partial<FleetNode>) => void }) {
  const warnings = [
    n.disk < LOW_DISK && `Disk low: ${n.disk} GB free (threshold ${LOW_DISK} GB)`,
    failRate(n) > 10 && `Failure rate ${failRate(n)}% over ${n.ran} runs`,
    n.status === "offline" && "Node is drained — not accepting work",
  ].filter(Boolean) as string[];
  return (
    <div className="space-y-4">
      <SheetHeader>
        <SheetTitle className="flex items-center gap-2 font-mono">
          <span className={`h-2 w-2 rounded-full ${n.status === "busy" ? "bg-primary blink" : n.status === "offline" ? "bg-muted-foreground" : "bg-success"}`} />
          {n.id} <span className="text-xs font-normal text-muted-foreground">{n.status}</span>
        </SheetTitle>
        <p className="font-mono text-[11px] text-muted-foreground">{n.cores} cores · {n.memGb} GB · {n.flavor}</p>
      </SheetHeader>

      {warnings.length > 0 && (
        <ul className="space-y-1">
          {warnings.map((w) => <li key={w} className="flex items-start gap-2 rounded-sm border border-accent/40 bg-accent/10 px-2 py-1.5 text-xs"><AlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-accent" />{w}</li>)}
        </ul>
      )}

      <div className="grid grid-cols-3 gap-3 rounded-sm border border-border p-3">
        <Meter label="load" v={n.load} max={n.cores} value={n.load.toFixed(2)} />
        <Meter label="mem" v={n.mem} value={`${n.mem}%`} />
        <Meter label="disk" v={20 - n.disk} max={20} warn={n.disk < LOW_DISK} value={`${n.disk}G`} />
      </div>

      <dl className="space-y-1 font-mono text-[11px]">
        {[["last role", n.lastRole], ["last intent", n.lastIntent], ["idle for", n.status === "busy" ? "—" : n.idleFor], ["runs", `${n.ran} (${n.failed} failed · ${failRate(n)}%)`]].map(([k, v]) => (
          <div key={k} className="flex justify-between gap-4 border-b border-border/40 py-1"><dt className="text-muted-foreground">{k}</dt><dd className="text-right">{v}</dd></div>
        ))}
      </dl>

      <div>
        <div className="mb-1 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Recent results</div>
        <Recent n={n} />
      </div>

      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={() => { const off = n.status !== "offline"; update(n.id, { status: off ? "offline" : "idle" }); toast(off ? `${n.id} drained` : `${n.id} back in rotation`); }}
          className="flex items-center justify-center gap-1.5 rounded-sm border border-border px-2 py-1.5 font-mono text-[10px] uppercase tracking-wider hover:border-primary hover:text-primary">
          <Power className="h-3 w-3" />{n.status === "offline" ? "Undrain" : "Drain"}
        </button>
        <button
          onClick={() => { update(n.id, { disk: 18.4, status: "idle", idleFor: "0s" }); toast.success(`${n.id} recycled — fresh workspace`); }}
          className="flex items-center justify-center gap-1.5 rounded-sm border border-border px-2 py-1.5 font-mono text-[10px] uppercase tracking-wider hover:border-primary hover:text-primary">
          <RotateCcw className="h-3 w-3" />Recycle
        </button>
        <button
          onClick={() => toast(`Log stream for ${n.id} is not wired up yet`)}
          className="flex items-center justify-center gap-1.5 rounded-sm border border-border px-2 py-1.5 font-mono text-[10px] uppercase tracking-wider hover:border-primary hover:text-primary">
          <ScrollText className="h-3 w-3" />Logs
        </button>
      </div>
    </div>
  );
}
