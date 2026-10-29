import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { clients, hubParts, models, tickerTemplates, topoNodes, type NodeStatus, type TopoNode } from "@/lib/mock";

export type Selection =
  | { kind: "client"; id: string }
  | { kind: "hub"; id: "hub" }
  | { kind: "part"; id: string }
  | { kind: "node"; id: string }
  | { kind: "model"; id: string };

export type Filters = Record<"busy" | "paused" | "idle" | "error", boolean>;

const seedHistory = (base: number) => Array.from({ length: 24 }, (_, i) => Math.max(0, base + Math.sin(i / 2) * 8 + (i % 3) * 2));

export function useTopology() {
  const [nodes, setNodes] = useState<TopoNode[]>(topoNodes);
  const [history, setHistory] = useState<Record<string, { cpu: number[]; mem: number[] }>>(() =>
    Object.fromEntries(topoNodes.map((n) => [n.id, { cpu: seedHistory(n.cpu), mem: seedHistory(n.mem) }])),
  );
  const [health, setHealth] = useState({
    latency: seedHistory(42),
    tasks: seedHistory(18),
    denials: seedHistory(4),
    tokens: seedHistory(40),
  });
  const [ticker, setTicker] = useState<{ id: number; t: string; msg: string }[]>([]);
  const [selection, setSelection] = useState<Selection>({ kind: "node", id: "node-a1" });
  const [hover, setHover] = useState<Selection | null>(null);
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<Filters>({ busy: true, paused: true, idle: true, error: true });
  const [traffic, setTraffic] = useState(true);
  const [focus, setFocus] = useState(false);
  const nodesRef = useRef(nodes);
  nodesRef.current = nodes;

  // Live metrics — client-only so SSR markup is deterministic.
  useEffect(() => {
    const id = setInterval(() => {
      setNodes((ns) =>
        ns.map((n) => {
          if (n.status !== "busy") return n;
          const j = (v: number) => Math.min(98, Math.max(5, v + (Math.random() - 0.5) * 12));
          return { ...n, cpu: Math.round(j(n.cpu)), mem: Math.round(j(n.mem) * 0.3 + n.mem * 0.7) };
        }),
      );
      setHistory((h) => {
        const next = { ...h };
        for (const n of nodesRef.current) {
          const cur = h[n.id] ?? { cpu: [], mem: [] };
          next[n.id] = { cpu: [...cur.cpu.slice(-23), n.cpu], mem: [...cur.mem.slice(-23), n.mem] };
        }
        return next;
      });
      setHealth((h) => ({
        latency: [...h.latency.slice(1), 30 + Math.random() * 30],
        tasks: [...h.tasks.slice(1), 12 + Math.random() * 14],
        denials: [...h.denials.slice(1), Math.random() * 8],
        tokens: [...h.tokens.slice(1), 30 + Math.random() * 20],
      }));
      const live = nodesRef.current.filter((n) => n.status === "busy");
      const node = live[Math.floor(Math.random() * live.length)]?.id ?? "node-c1";
      const tpl = tickerTemplates[Math.floor(Math.random() * tickerTemplates.length)]!;
      setTicker((t) => [{ id: Date.now(), t: new Date().toLocaleTimeString("en-GB"), msg: tpl.replace("{node}", node) }, ...t].slice(0, 6));
    }, 2000);
    return () => clearInterval(id);
  }, []);

  const setStatus = (id: string, patch: Partial<TopoNode>) => setNodes((ns) => ns.map((n) => (n.id === id ? { ...n, ...patch } : n)));

  // UI-only node actions — replace with backend calls.
  const act = useCallback((id: string, action: "pause" | "resume" | "recycle") => {
    const target: Record<typeof action, { status: NodeStatus; patch: Partial<TopoNode>; msg: string }> = {
      pause: { status: "paused", patch: { cpu: 2, task: "Paused · volume kept" }, msg: "paused · volume kept" },
      resume: { status: "busy", patch: { cpu: 40, task: "Resumed · continuing run" }, msg: "resumed from checkpoint" },
      recycle: { status: "idle", patch: { cpu: 1, mem: 8, task: "Ready", agent: "warm pool", client: "", model: "" }, msg: "recycled to warm pool" },
    };
    const t = target[action];
    setStatus(id, { status: "transition" });
    setTimeout(() => {
      setStatus(id, { status: t.status, ...t.patch });
      toast.success(`${id} ${t.msg}`);
      setTicker((tk) => [{ id: Date.now(), t: new Date().toLocaleTimeString("en-GB"), msg: `${id} ${t.msg}` }, ...tk].slice(0, 6));
    }, 1200);
  }, []);

  // Which ids are connected to a selection (for highlight/focus).
  const related = useCallback(
    (s: Selection | null): Set<string> | null => {
      if (!s) return null;
      const set = new Set<string>([s.id]);
      if (s.kind === "hub" || s.kind === "part") {
        set.add("hub");
        clients.forEach((c) => set.add(c.id));
        nodes.forEach((n) => set.add(n.id));
        models.forEach((m) => set.add(m.id));
        hubParts.forEach((p) => set.add(p.id));
      } else if (s.kind === "node") {
        const n = nodes.find((x) => x.id === s.id);
        set.add("hub");
        if (n?.client) set.add(n.client);
        if (n?.model) set.add(n.model);
      } else if (s.kind === "client") {
        set.add("hub");
        nodes.filter((n) => n.client === s.id).forEach((n) => {
          set.add(n.id);
          if (n.model) set.add(n.model);
        });
      } else if (s.kind === "model") {
        set.add("hub");
        nodes.filter((n) => n.model === s.id).forEach((n) => set.add(n.id));
      }
      return set;
    },
    [nodes],
  );

  const highlight = useMemo(() => related(hover) ?? (focus ? related(selection) : null), [hover, focus, selection, related]);

  const matches = useCallback(
    (n: TopoNode) => {
      const st = n.status === "transition" ? "busy" : n.status;
      if (st in filters && !filters[st as keyof Filters]) return false;
      if (!query) return true;
      const q = query.toLowerCase();
      const c = clients.find((x) => x.id === n.client);
      return [n.id, n.agent, n.task, n.host, c?.name ?? ""].some((v) => v.toLowerCase().includes(q));
    },
    [filters, query],
  );

  return { nodes, history, health, ticker, selection, setSelection, hover, setHover, query, setQuery, filters, setFilters, traffic, setTraffic, focus, setFocus, act, highlight, matches };
}

export type Topo = ReturnType<typeof useTopology>;
