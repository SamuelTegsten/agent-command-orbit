import { Lock, Pause, Play, RotateCcw } from "lucide-react";
import { clients, hubParts, models } from "@/lib/mock";
import { SectionLabel, StatusDot } from "@/components/AppShell";
import { Sparkline } from "./Sparkline";
import type { Topo } from "./useTopology";

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-border/60 py-2 text-sm">
      <dt className="text-muted-foreground">{k}</dt>
      <dd className="truncate text-right font-mono text-xs">{v}</dd>
    </div>
  );
}

export function DetailPanel({ topo }: { topo: Topo }) {
  const { selection: s, nodes, history, act, setSelection } = topo;

  if (s.kind === "node") {
    const n = nodes.find((x) => x.id === s.id);
    if (!n) return null;
    const h = history[n.id];
    const client = clients.find((c) => c.id === n.client);
    const model = models.find((m) => m.id === n.model);
    const busy = n.status === "transition";
    return (
      <div className="space-y-4">
        <Header label="Node · agent workspace" title={n.id} status={n.status} />
        <dl>
          <Row k="Host" v={n.host} />
          <Row k="Agent" v={n.agent} />
          <Row k="Task" v={n.task} />
          <Row k="Work type" v={n.type} />
          <Row k="Requested by" v={client?.name ?? "—"} />
          <Row k="Model" v={model?.label ?? "—"} />
          <Row k="Uptime" v={n.uptime} />
          <Row k="Isolation" v="1 VM per task" />
        </dl>
        {[["CPU", n.cpu, h?.cpu, "stroke-primary"], ["Memory", n.mem, h?.mem, "stroke-accent"]].map(([k, v, d, c]) => (
          <div key={k as string}>
            <div className="flex justify-between font-mono text-[11px] text-muted-foreground"><span>{k as string}</span><span>{v as number}%</span></div>
            <Sparkline data={(d as number[]) ?? []} className={c as string} />
          </div>
        ))}
        <div className="grid grid-cols-3 gap-2">
          <ActionBtn icon={Pause} label="Pause" disabled={busy || n.status !== "busy"} onClick={() => act(n.id, "pause")} />
          <ActionBtn icon={Play} label="Resume" disabled={busy || !(n.status === "paused" || n.status === "error")} onClick={() => act(n.id, "resume")} />
          <ActionBtn icon={RotateCcw} label="Recycle" disabled={busy || n.status === "idle"} onClick={() => act(n.id, "recycle")} />
        </div>
      </div>
    );
  }

  if (s.kind === "client") {
    const c = clients.find((x) => x.id === s.id)!;
    const ns = nodes.filter((n) => n.client === c.id);
    return (
      <div className="space-y-4">
        <Header label={`Client · ${c.kind}`} title={c.name} status={c.status} />
        <dl>
          <Row k="User" v={c.user} />
          <Row k="Sessions" v={String(c.sessions)} />
          <Row k="Link" v="TLS · via Bridge" />
        </dl>
        <div>
          <SectionLabel>Driving {ns.length} nodes</SectionLabel>
          <ul className="mt-2 space-y-1">
            {ns.map((n) => (
              <li key={n.id}>
                <button onClick={() => setSelection({ kind: "node", id: n.id })} className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-xs hover:bg-secondary">
                  <StatusDot status={n.status} /> <span className="font-mono">{n.id}</span>
                  <span className="truncate text-muted-foreground">{n.task}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  if (s.kind === "model") {
    const m = models.find((x) => x.id === s.id)!;
    const ns = nodes.filter((n) => n.model === m.id);
    return (
      <div className="space-y-4">
        <Header label={m.kind === "cloud" ? "Cloud model" : "Open model · served locally"} title={m.label} status={m.blocked ? "error" : "online"} />
        {m.blocked && (
          <div className="flex gap-2 rounded-sm border border-destructive/40 bg-destructive/10 p-3 text-xs">
            <Lock className="h-4 w-4 shrink-0 text-destructive" /> Blocked by policy. This installation is air-gapped; cloud models are off for all repositories.
          </div>
        )}
        <dl>
          <Row k="Runs on" v={m.gpu} />
          <Row k="Load" v={`${m.load}%`} />
          <Row k="Used by" v={`${ns.length} nodes`} />
        </dl>
      </div>
    );
  }

  if (s.kind === "part") {
    const p = hubParts.find((x) => x.id === s.id)!;
    return (
      <div className="space-y-4">
        <Header label="Hub component" title={p.label} status="online" />
        <p className="text-sm text-muted-foreground">{p.desc}</p>
        <dl>
          <Row k="Now" v={p.stat} />
          <Row k="Runs on" v="container cluster" />
          <Row k="Replicas" v="3 / 3 healthy" />
        </dl>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Header label="Central managing unit" title="Hub" status="online" />
      <p className="text-sm text-muted-foreground">Receives work from clients, checks policy, issues credentials and dispatches each task to an isolated node.</p>
      <dl>
        <Row k="Clients connected" v={String(clients.length)} />
        <Row k="Nodes" v={`${nodes.length} (${nodes.filter((n) => n.status === "busy").length} busy)`} />
        <Row k="Mode" v="air-gapped" />
      </dl>
      <div className="grid grid-cols-2 gap-1.5">
        {hubParts.map((p) => (
          <button key={p.id} onClick={() => setSelection({ kind: "part", id: p.id })} className="rounded-sm bg-secondary px-2 py-1.5 text-left text-[11px] hover:bg-muted">
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function Header({ label, title, status }: { label: string; title: string; status: string }) {
  return (
    <div>
      <SectionLabel>{label}</SectionLabel>
      <div className="mt-2 flex items-center gap-2">
        <StatusDot status={status} />
        <span className="truncate font-mono text-lg">{title}</span>
        <span className="ml-auto rounded-sm bg-secondary px-2 py-0.5 font-mono text-[10px] uppercase">{status}</span>
      </div>
    </div>
  );
}

function ActionBtn({ icon: Icon, label, onClick, disabled }: { icon: typeof Pause; label: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled} className="flex items-center justify-center gap-1.5 rounded-sm border border-border py-1.5 text-xs transition-colors hover:border-primary hover:text-primary disabled:pointer-events-none disabled:opacity-35">
      <Icon className="h-3 w-3" /> {label}
    </button>
  );
}
