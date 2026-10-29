import { Search, Crosshair, Activity } from "lucide-react";
import { StatusDot } from "@/components/AppShell";
import type { Filters, Topo } from "./useTopology";

export function Toolbar({ topo }: { topo: Topo }) {
  const { query, setQuery, filters, setFilters, traffic, setTraffic, focus, setFocus, nodes } = topo;
  const count = (k: keyof Filters) => nodes.filter((n) => n.status === k).length;
  return (
    <div className="panel flex flex-wrap items-center gap-2 p-2">
      <label className="flex min-w-[200px] flex-1 items-center gap-2 rounded-sm border border-input bg-background/60 px-2.5 py-1.5 focus-within:border-primary">
        <Search className="h-3.5 w-3.5 text-muted-foreground" />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search nodes, agents, tasks, clients…" className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
      </label>
      <div className="flex gap-1">
        {(Object.keys(filters) as (keyof Filters)[]).map((k) => (
          <button
            key={k}
            onClick={() => setFilters({ ...filters, [k]: !filters[k] })}
            className={`flex items-center gap-1.5 rounded-sm border px-2.5 py-1.5 font-mono text-[11px] transition-colors ${filters[k] ? "border-border bg-secondary text-foreground" : "border-transparent text-muted-foreground line-through"}`}
          >
            <StatusDot status={k} /> {k} <span className="text-muted-foreground">{count(k)}</span>
          </button>
        ))}
      </div>
      <div className="flex gap-1">
        <Toggle on={traffic} onClick={() => setTraffic(!traffic)} icon={Activity} label="Traffic" />
        <Toggle on={focus} onClick={() => setFocus(!focus)} icon={Crosshair} label="Focus" />
      </div>
    </div>
  );
}

function Toggle({ on, onClick, icon: Icon, label }: { on: boolean; onClick: () => void; icon: typeof Search; label: string }) {
  return (
    <button onClick={onClick} aria-pressed={on} className={`flex items-center gap-1.5 rounded-sm px-2.5 py-1.5 text-xs transition-colors ${on ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground hover:text-foreground"}`}>
      <Icon className="h-3.5 w-3.5" /> {label}
    </button>
  );
}
