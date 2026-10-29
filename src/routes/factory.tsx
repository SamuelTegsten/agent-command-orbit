import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Activity, AlertTriangle, CircleDot, Clock, GitBranch, GitMerge, Hexagon, ListOrdered, Pencil, Plus, Power, Target, Workflow, Zap, Paperclip,
} from "lucide-react";
import { issues, performance, sessions as seed, stages, type Session, type TimelineItem } from "@/lib/craton";

type Search = { s?: string };

export const Route = createFileRoute("/factory")({
  validateSearch: (q: Record<string, unknown>): Search => (typeof q["s"] === "string" ? { s: q["s"] } : {}),
  head: () => ({
    meta: [
      { title: "Factory · Basalt Software Factory" },
      { name: "description", content: "Give the swarm a task, steer the session with new instructions and follow every step." },
      { property: "og:title", content: "Factory · Basalt Software Factory" },
      { property: "og:description", content: "Give the swarm a task, steer the session with new instructions and follow every step." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Factory,
});

const statusStyle: Record<Session["status"], string> = {
  open: "text-success", working: "text-primary", done: "text-success", failed: "text-destructive", archived: "text-muted-foreground",
};
const dot: Record<Session["status"], string> = {
  open: "bg-success", working: "bg-primary blink", done: "bg-success", failed: "bg-destructive", archived: "bg-muted-foreground",
};

function Factory() {
  const { s } = Route.useSearch();
  const [list, setList] = useState<Session[]>(seed);
  const current = list.find((x) => x.id === s);
  const update = (id: string, fn: (x: Session) => Session) => setList((l) => l.map((x) => (x.id === id ? fn(x) : x)));
  return current ? <SessionView session={current} update={update} /> : <Overview list={list} setList={setList} />;
}

function Overview({ list, setList }: { list: Session[]; setList: (fn: (l: Session[]) => Session[]) => void }) {
  const navigate = useNavigate();
  const [issueOpen, setIssueOpen] = useState(false);
  const [project, setProject] = useState("");
  const visible = list.filter((x) => x.status !== "archived");
  const working = list.filter((x) => x.status === "working").length;
  const instr = visible.reduce((a, x) => a + x.instructions.length, 0);

  const newSession = (title = "New session") => {
    const id = `s${String(11 + list.length).padStart(4, "0")}`;
    const sess: Session = { id, title, status: "open", branch: `factory/${id}`, commit: Math.random().toString(16).slice(2, 10), ago: "just now", scope: "not scoped yet", cost: "$0.00", instructions: [], timeline: [] };
    setList((l) => [sess, ...l]);
    navigate({ to: "/factory", search: { s: id } });
  };

  const kpis = [
    { icon: Hexagon, k: "Sessions", v: list.length, f: `${list.length - visible.length} archived` },
    { icon: Activity, k: "Working", v: working, f: "building now" },
    { icon: ListOrdered, k: "Instructions", v: instr, f: "across open sessions" },
    { icon: Power, k: "Daemon", v: "on", f: "publishes and scales" },
  ];

  return (
    <div className="mx-auto max-w-[1400px] space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Factory</h1>
          <p className="max-w-xl text-sm text-muted-foreground">The swarm builds the software. Give it a task, then keep steering the same session with new instructions; each builds on the last.</p>
        </div>
        <button onClick={() => newSession()} className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground glow-primary hover:opacity-90"><Plus className="h-4 w-4" /> New session</button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((t) => (
          <div key={t.k} className="panel p-4">
            <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground"><t.icon className="h-3 w-3 text-primary" />{t.k}</div>
            <div className="mt-1 font-display text-3xl font-bold">{t.v}</div>
            <div className="text-xs text-muted-foreground">{t.f}</div>
          </div>
        ))}
      </div>

      <section className="panel p-4">
        <div className="mb-3 flex items-baseline gap-2"><h2 className="flex items-center gap-2 font-display text-base font-bold"><Zap className="h-4 w-4 text-primary" />Performance</h2><span className="text-xs text-muted-foreground">last 7 days</span></div>
        <div className="grid gap-3 md:grid-cols-3">
          {[
            { icon: Clock, k: "Median lead time", v: performance.leadTime, f: `p90 ${performance.p90}` },
            { icon: GitMerge, k: "Merge success", v: performance.mergeSuccess, f: `${performance.merges} merges, ${performance.mergeFailed} failed` },
            { icon: AlertTriangle, k: "Failures", v: String(performance.failures), f: performance.failures ? "see sessions" : "none" },
          ].map((t) => (
            <div key={t.k} className="rounded-md border border-border border-t-success/50 bg-background/50 p-3">
              <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground"><t.icon className="h-3 w-3" />{t.k}</div>
              <div className="mt-1 font-display text-2xl font-bold">{t.v}</div>
              <div className="text-xs text-muted-foreground">{t.f}</div>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className="panel p-4">
          <div className="mb-3 flex items-baseline gap-2"><h2 className="font-display text-base font-bold">Sessions</h2><span className="text-xs text-muted-foreground">{visible.length} sessions · {working} working · {list.length - visible.length} archived</span></div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {visible.map((x) => (
              <Link key={x.id} to="/factory" search={{ s: x.id }} className={`group flex flex-col rounded-md border bg-background/50 p-3 transition-colors hover:border-primary/60 ${x.status === "working" ? "border-primary/60" : "border-border"}`}>
                <div className="flex items-start gap-2 text-sm font-semibold"><span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${dot[x.status]}`} /><span className="line-clamp-2">{x.title}</span></div>
                <div className="mt-2 flex flex-wrap gap-1.5 font-mono text-[10.5px]">
                  <span className={`rounded-full border border-border bg-secondary/50 px-2 py-0.5 ${statusStyle[x.status]}`}>● {x.status}</span>
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-primary">{x.id}</span>
                  <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-primary"><GitBranch className="h-3 w-3" />{x.commit}</span>
                </div>
                <div className="mt-auto flex justify-between border-t border-border/60 pt-2 text-[11px] text-muted-foreground" style={{ marginTop: 12 }}>
                  <span>{x.instructions.length} instruction{x.instructions.length === 1 ? "" : "s"}</span><span>{x.ago}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="panel p-4">
          <div className="mb-3 flex items-baseline gap-2"><h2 className="flex items-center gap-2 font-display text-base font-bold"><Target className="h-4 w-4 text-primary" />Issues</h2><span className="text-xs text-muted-foreground">this checkout's GitLab project</span></div>
          <div className="flex gap-2">
            <input value={project} onChange={(e) => setProject(e.target.value)} placeholder="group/project (optional)" className="min-w-0 flex-1 rounded-md border border-input bg-background/60 px-3 py-1.5 text-sm outline-none focus:border-primary" />
            <button onClick={() => setIssueOpen(true)} className="rounded-md border border-border px-3 text-xs hover:border-primary">Show open issues</button>
          </div>
          {issueOpen ? (
            <ul className="mt-3 space-y-2">
              {issues.map((i) => (
                <li key={i.iid} className="flex items-center gap-2 rounded-md border border-border bg-background/50 p-2 text-sm">
                  <span className="font-mono text-[11px] text-muted-foreground">#{i.iid}</span>
                  <span className="min-w-0 flex-1 truncate">{i.title}</span>
                  <button onClick={() => newSession(i.title)} className="rounded-sm bg-primary/15 px-2 py-0.5 text-[11px] text-primary hover:bg-primary/25">Adopt</button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-3 grid place-items-center gap-2 rounded-md border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
              <CircleDot className="h-4 w-4" />Show the open issues of a GitLab project and adopt one as a session.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

const tlIcon: Record<TimelineItem["kind"], { label: string; cls: string }> = {
  instruction: { label: "You", cls: "border-primary/50 bg-primary/10 text-primary" },
  event: { label: "Event", cls: "border-border bg-secondary/40" },
  plan: { label: "Plan", cls: "border-accent/50 bg-accent/10 text-accent" },
  landed: { label: "Landed", cls: "border-success/50 bg-success/10 text-success" },
  failed: { label: "Failed", cls: "border-destructive/60 bg-destructive/10 text-destructive" },
  answer: { label: "Claude", cls: "border-border bg-secondary/40" },
};

function SessionView({ session: x, update }: { session: Session; update: (id: string, fn: (x: Session) => Session) => void }) {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<"all" | "notes">("all");
  const [tab, setTab] = useState<"Progress" | "Changes" | "Links" | "Memory">("Progress");
  const [mode, setMode] = useState<"instruction" | "quickfix">("instruction");
  const [draft, setDraft] = useState("");
  const [ask, setAsk] = useState("");
  const end = useRef<HTMLDivElement>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  useEffect(() => end.current?.scrollIntoView({ block: "end" }), [x.timeline.length]);

  const items = filter === "all" ? x.timeline : x.timeline.filter((t) => t.kind !== "instruction");
  const counts = useMemo(() => ({
    running: x.instructions.filter((i) => i.status === "running").length,
    waiting: x.instructions.filter((i) => i.status === "waiting").length,
    done: x.instructions.filter((i) => i.status === "landed").length,
    failed: x.instructions.filter((i) => i.status === "failed").length,
  }), [x.instructions]);
  const stageIdx = x.stage ? stages.indexOf(x.stage) : -1;

  const push = (t: TimelineItem, patch?: Partial<Session>) => update(x.id, (s) => ({ ...s, ...patch, timeline: [...s.timeline, t] }));

  // UI-only simulation of the pipeline: replace with your backend's event stream.
  const send = () => {
    const text = draft.trim();
    if (!text) return;
    const n = x.instructions.length + 1;
    const intent = `i00${50 + n}`;
    update(x.id, (s) => ({
      ...s, status: "working", stage: "Planning", ago: "just now",
      instructions: [...s.instructions, { n, text, status: "running" }],
      timeline: [...s.timeline, { kind: "instruction", n, text, ago: "just now", mode }],
    }));
    setDraft("");
    const steps: [number, () => void][] = [
      [700, () => push({ kind: "event", text: `intent ${intent} scoped: ${mode === "quickfix" ? "small, change" : "unknown, change"}; suggests flow with 1 part(s)`, ago: "just now" })],
      [1500, () => push({ kind: "event", text: "Writing the plan…", ago: "just now" })],
      [2400, () => push({ kind: "plan", text: `Started on instruction #${n}`, ago: "just now" }, { stage: "Building" })],
      [3600, () => push({ kind: "event", text: `${intent}: implementer on n0${(n % 9) + 1} · reviewer queued`, ago: "just now" })],
      [4800, () => push({ kind: "event", text: "Merging into master…", ago: "just now" }, { stage: "Landing" })],
      [6000, () => {
        const commit = Math.random().toString(16).slice(2, 12);
        update(x.id, (s) => ({
          ...s, status: "open", stage: "Publishing", commit: commit.slice(0, 8),
          instructions: s.instructions.map((i) => (i.n === n ? { ...i, status: "landed", commit } : i)),
          timeline: [...s.timeline, { kind: "landed", text: `#${n} landed on master @ ${commit}`, ago: "just now" }],
        }));
        toast.success(`#${n} landed`);
      }],
    ];
    timers.current.push(...steps.map(([ms, fn]) => setTimeout(fn, ms)));
  };

  const askClaude = () => {
    if (!ask.trim()) return;
    const q = ask.trim();
    setAsk("");
    push({ kind: "answer", text: `Q: ${q}\n— This session has ${x.instructions.length} instruction(s); latest commit ${x.commit}. (Answer comes from your backend.)`, ago: "just now" });
  };

  const setStatus = (status: Session["status"], msg: string) => { update(x.id, (s) => ({ ...s, status })); toast(msg); };

  return (
    <div className="mx-auto max-w-[1400px] space-y-3">
      <div className="text-xs text-muted-foreground"><Link to="/factory" className="underline hover:text-foreground">Factory</Link> › {x.title}</div>
      <div className="flex flex-wrap items-center gap-2">
        <span className={`h-2.5 w-2.5 rounded-full ${dot[x.status]}`} />
        <h1 className="font-display text-xl font-bold">{x.title}</h1>
        <span className={`font-mono text-xs ${statusStyle[x.status]}`}>● {x.status}</span>
        <span className="rounded bg-secondary px-1.5 font-mono text-xs">{x.id}</span>
        <span className="flex items-center gap-1 rounded bg-secondary px-1.5 font-mono text-xs"><GitBranch className="h-3 w-3" />{x.branch} @ {x.commit}</span>
        <div className="ml-auto flex gap-2">
          <button onClick={() => setStatus(x.status === "working" ? "open" : x.status, "Session paused")} className="rounded-full border border-border px-3 py-1 text-xs hover:border-primary">Pause</button>
          <button disabled={counts.done === 0} onClick={() => toast.success("Publishing to production…")} className="rounded-full border border-border px-3 py-1 text-xs hover:border-primary disabled:opacity-40">Publish</button>
          <Link to="/" className="rounded-full border border-border px-3 py-1 text-xs hover:border-primary">Operations</Link>
          <button onClick={() => { setStatus("archived", "Session archived"); navigate({ to: "/factory", search: {} }); }} className="rounded-full border border-border px-3 py-1 text-xs hover:border-destructive">Archive</button>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_400px]">
        <section className="panel flex h-[calc(100vh-15rem)] min-h-[520px] flex-col">
          <div className="m-3 rounded-md border border-border bg-background/60 p-3">
            <div className="flex justify-between">
              <span className="flex items-center gap-2 text-sm font-semibold"><span className={`h-2 w-2 rounded-full ${dot[x.status]}`} />{x.status === "failed" ? "Cancelled" : x.status === "working" ? `Working · ${x.stage ?? ""}` : "Ready for instructions"}</span>
              <span className="font-mono text-xs text-muted-foreground">{x.cost}</span>
            </div>
            <div className="mt-1 text-xs text-muted-foreground">Scope: {x.scope}</div>
          </div>
          <div className="flex gap-1 border-b border-border px-3 pb-2 text-xs">
            {([["all", "Everything"], ["notes", "Conductor notes"]] as const).map(([k, l]) => (
              <button key={k} onClick={() => setFilter(k)} className={`rounded-full px-2.5 py-1 ${filter === k ? "border border-primary/60 text-primary" : "text-muted-foreground hover:text-foreground"}`}>{l}</button>
            ))}
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {items.length === 0 && <div className="grid h-full place-items-center text-sm text-muted-foreground">Tell the factory what to build. Each instruction builds on the last.</div>}
            {items.map((t, i) =>
              t.kind === "instruction" ? (
                <div key={i} className="ml-auto max-w-[85%] fade-in">
                  <div className="rounded-md border border-primary/50 bg-primary/5 px-3 py-2 text-sm">{t.text}</div>
                  <div className="mt-1 text-right font-mono text-[10px] text-muted-foreground">#{t.n} · {t.mode === "quickfix" ? "quick fix · " : ""}{t.ago}</div>
                </div>
              ) : (
                <div key={i} className="flex gap-3 fade-in">
                  <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border ${tlIcon[t.kind].cls}`}>
                    {t.kind === "plan" ? <Workflow className="h-3.5 w-3.5" /> : t.kind === "failed" ? <AlertTriangle className="h-3.5 w-3.5" /> : t.kind === "landed" ? <GitMerge className="h-3.5 w-3.5" /> : <CircleDot className="h-3.5 w-3.5" />}
                  </span>
                  <div className="min-w-0">
                    <span className={`rounded-sm px-1.5 py-0.5 font-mono text-[10px] ${tlIcon[t.kind].cls}`}>{tlIcon[t.kind].label}</span>
                    <div className={`mt-1 whitespace-pre-wrap rounded-md border px-3 py-1.5 text-sm ${t.kind === "failed" ? "border-destructive/60" : "border-border"} bg-background/50`}>{t.text}</div>
                    <div className="mt-0.5 font-mono text-[10px] text-muted-foreground">{t.ago}</div>
                  </div>
                </div>
              ),
            )}
            <div ref={end} />
          </div>
          <div className="space-y-2 border-t border-border p-3">
            <textarea value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); send(); } }} rows={2}
              placeholder="Tell the factory what to do next. It builds on everything this session has done."
              className="w-full resize-none rounded-md border border-input bg-background/60 px-3 py-2 text-sm outline-none focus:border-primary" />
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {([["instruction", "Instruction"], ["quickfix", "⚡ Quick fix"]] as const).map(([k, l]) => (
                <button key={k} onClick={() => setMode(k)} className={`rounded-full px-2.5 py-1 ${mode === k ? "border border-primary/60 text-primary" : "text-muted-foreground hover:text-foreground"}`}>{l}</button>
              ))}
              <button onClick={() => toast("Attachments go to your backend")} className="flex items-center gap-1 rounded-full border border-border px-2.5 py-1 hover:border-primary"><Paperclip className="h-3 w-3" />Attach</button>
              <span className="hidden text-muted-foreground md:inline">Ctrl+Enter sends</span>
              <button onClick={send} disabled={!draft.trim() || x.status === "working"} className="ml-auto rounded-full bg-primary px-4 py-1 font-medium text-primary-foreground disabled:opacity-40">Send</button>
            </div>
            <input value={ask} onChange={(e) => setAsk(e.target.value)} onKeyDown={(e) => e.key === "Enter" && askClaude()} placeholder="Ask Claude about this session…" className="w-full rounded-md border border-input bg-background/60 px-3 py-1.5 text-sm outline-none focus:border-primary" />
          </div>
        </section>

        <aside className="panel p-3">
          <div className="flex gap-1 border-b border-border text-xs">
            {(["Progress", "Changes", "Links", "Memory"] as const).map((k) => (
              <button key={k} onClick={() => setTab(k)} className={`px-2.5 py-2 ${tab === k ? "border-b-2 border-primary font-semibold" : "text-muted-foreground"}`}>{k}</button>
            ))}
          </div>
          {tab === "Progress" ? (
            <div className="space-y-4 pt-3">
              <div className="grid grid-cols-4 gap-2">
                {stages.map((st, i) => (
                  <div key={st}>
                    <div className={`h-1 rounded ${i < stageIdx ? "bg-success" : i === stageIdx ? "bg-primary blink" : "bg-border"}`} />
                    <div className={`mt-1 text-[11px] ${i === stageIdx ? "text-primary" : "text-muted-foreground"}`}>● {st}</div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-4 gap-2">
                {(Object.entries(counts) as [string, number][]).map(([k, v]) => (
                  <div key={k} className="rounded-md border border-border bg-background/50 p-2">
                    <div className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground">{k}</div>
                    <div className={`font-display text-xl font-bold ${k === "failed" && v ? "text-destructive" : ""}`}>{v}</div>
                  </div>
                ))}
              </div>
              <div>
                <div className="mb-2 font-display text-xs font-bold uppercase tracking-wider">Instructions</div>
                <ul className="divide-y divide-border/60">
                  {x.instructions.length === 0 && <li className="py-2 text-xs text-muted-foreground">No instructions yet.</li>}
                  {x.instructions.map((i) => (
                    <li key={i.n} className="flex items-center gap-2 py-2 text-xs">
                      <span className={`h-2 w-2 shrink-0 rounded-full ${i.status === "landed" ? "bg-success" : i.status === "failed" ? "bg-destructive" : "bg-primary blink"}`} />
                      <Pencil className="h-3 w-3 shrink-0 text-muted-foreground" />
                      <span className="min-w-0 flex-1 truncate">#{i.n} {i.text}</span>
                      <span className={`shrink-0 font-mono text-[10px] ${i.status === "failed" ? "text-destructive" : "text-muted-foreground"}`}>{i.status === "landed" ? `Landed ${i.commit}` : i.status}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <div className="pt-6 text-center text-xs text-muted-foreground">{tab} for {x.id} will be loaded from your backend.</div>
          )}
        </aside>
      </div>
    </div>
  );
}
