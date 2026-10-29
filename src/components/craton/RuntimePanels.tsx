import { useState } from "react";
import { Cpu, Database, Plus, Minus, Server, Boxes } from "lucide-react";
import { fleet, sandbox, setup, tokens, type FleetNode, type SetupCard } from "@/lib/craton";

const toneDot: Record<SetupCard["tone"], string> = { ok: "bg-success", warn: "bg-accent", bad: "bg-destructive", info: "bg-primary" };

export function SetupGrid() {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <section className="panel p-4">
      <div className="mb-3 flex items-baseline gap-2">
        <h2 className="font-display text-base font-bold">Setup</h2>
        <span className="text-xs text-muted-foreground">install health at a glance</span>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {setup.map((c) => {
          const isOpen = open === c.key;
          return (
            <div key={c.key} className={`rounded-sm border bg-background/50 p-3 ${c.tone === "bad" ? "border-destructive/60" : "border-border"}`}>
              <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                <span className={`h-1.5 w-1.5 rounded-full ${toneDot[c.tone]}`} />{c.label}
              </div>
              <div className={`mt-1 font-display text-xl font-bold ${c.tone === "bad" ? "text-destructive" : ""}`}>{c.value}</div>
              <div className="truncate text-xs text-muted-foreground">{c.sub}</div>
              {isOpen && (
                <dl className="fade-in mt-2 space-y-1 border-t border-border/60 pt-2 font-mono text-[11px]">
                  {c.details.map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-3"><dt className="text-muted-foreground">{k}</dt><dd className="truncate">{v}</dd></div>
                  ))}
                </dl>
              )}
              <button onClick={() => setOpen(isOpen ? null : c.key)} className="mt-2 flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground hover:text-primary">
                {isOpen ? <Minus className="h-3 w-3" /> : <Plus className="h-3 w-3" />} details
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function Bar({ v, max = 100, warn = false }: { v: number; max?: number; warn?: boolean }) {
  return (
    <div className="mt-1 h-0.5 w-full rounded bg-border">
      <div className={`h-full rounded ${warn ? "bg-accent" : "bg-primary"}`} style={{ width: `${Math.max(4, Math.min(100, (v / max) * 100))}%` }} />
    </div>
  );
}

function NodeCard({ n }: { n: FleetNode }) {
  const busy = n.status === "busy";
  return (
    <div className={`rounded-sm border bg-background/50 p-3 ${busy ? "border-primary/60 glow-primary" : "border-border"}`}>
      <div className="flex items-start gap-2">
        <span className={`mt-0.5 grid h-6 w-6 place-items-center rounded-sm border ${busy ? "border-primary" : "border-success/50"}`}>
          <span className={`h-2.5 w-2.5 rounded-full ${busy ? "bg-primary blink" : "bg-success"}`} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="font-mono text-sm font-semibold">{n.id}</div>
          <div className="font-mono text-[10px] text-muted-foreground">{n.cores} cores · {n.memGb} GB · {n.flavor}</div>
        </div>
        <span className={`rounded-sm border px-2 py-0.5 font-mono text-[10px] ${busy ? "border-primary/40 text-primary" : "border-success/30 text-success"}`}>● {n.status}</span>
      </div>
      <div className="mt-2 rounded-sm border border-border/60 bg-secondary/30 px-2 py-1.5 text-[11px]">
        <div className="font-medium">{busy ? "Working" : `Idle ${n.idleFor}`}</div>
        <div className="truncate text-muted-foreground">last · {n.lastIntent}</div>
      </div>
      <div className="mt-2 grid grid-cols-3 gap-3 font-mono text-[10px]">
        <div><div className="text-muted-foreground">LOAD</div><div>{n.load.toFixed(2)}</div><Bar v={n.load} max={n.cores} /></div>
        <div><div className="text-muted-foreground">MEM</div><div>{n.mem}%</div><Bar v={n.mem} /></div>
        <div><div className="text-muted-foreground">DISK</div><div className={n.disk < 7.5 ? "text-accent" : ""}>{n.disk} GB</div><Bar v={20 - n.disk} max={20} warn={n.disk < 7.5} /></div>
      </div>
      <div className="mt-3 flex items-center justify-between font-mono text-[10px]">
        <span className="text-muted-foreground">ran {n.ran}{n.failed > 0 && <span className="text-destructive"> · {n.failed} failed</span>}</span>
        <span className="flex gap-0.5" title="recent results">
          {n.recent.map((r, i) => <span key={i} className={`h-1.5 w-1.5 rounded-full ${r === "fail" ? "bg-destructive" : r === "warn" ? "bg-accent" : "bg-success/80"}`} />)}
        </span>
      </div>
    </div>
  );
}

export function FleetPanel() {
  const busy = fleet.filter((n) => n.status === "busy").length;
  const cores = fleet.reduce((a, n) => a + n.cores, 0);
  const ram = fleet.reduce((a, n) => a + n.memGb, 0);
  const tiles = [
    { icon: Server, k: "Nodes", v: `${busy}`, s: `/ ${fleet.length} busy`, f: `${fleet.length} online · ${cores} cores · ${ram} GB RAM` },
    { icon: Database, k: "Tokens", v: tokens.total, s: `${tokens.perMin}/min`, f: `in ${tokens.in} · out ${tokens.out} · cache ${tokens.cache}` },
    { icon: Boxes, k: "Sandbox", v: String(sandbox.active), s: "running", f: `${sandbox.programs} programs · ${sandbox.calls} calls · ${sandbox.waiting} waiting` },
  ];
  return (
    <section className="panel p-4">
      <div className="mb-3 flex flex-wrap items-baseline gap-2">
        <h2 className="flex items-center gap-2 font-display text-base font-bold"><Cpu className="h-4 w-4 text-primary" /> Nodes</h2>
        <span className="text-xs text-muted-foreground">{fleet.length - busy} idle · {fleet.length} nodes · {cores} cores</span>
        <span className="ml-auto font-mono text-xs">fleet busy {Math.round((busy / fleet.length) * 100)}%</span>
      </div>
      <div className="mb-3 grid gap-3 md:grid-cols-3">
        {tiles.map((t) => (
          <div key={t.k} className="rounded-sm border border-border bg-background/50 p-3">
            <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground"><t.icon className="h-3 w-3 text-primary" />{t.k}</div>
            <div className="mt-1 flex items-baseline gap-1.5"><span className="font-display text-2xl font-bold">{t.v}</span><span className="text-xs text-muted-foreground">{t.s}</span></div>
            <div className="text-[11px] text-muted-foreground">{t.f}</div>
          </div>
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
        {fleet.map((n) => <NodeCard key={n.id} n={n} />)}
      </div>
    </section>
  );
}
