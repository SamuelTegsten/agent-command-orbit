import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  AlertTriangle, ArrowRight, Check, ChevronLeft, CircleDot, Clock, GitBranch, GitMerge, Pause, Paperclip, Play, RotateCcw, Search, Send, Target, Workflow, X, Zap, Archive, Rocket, Activity,
} from "lucide-react";
import { issues, performance, sessions as seed, stages, type Session, type TimelineItem } from "@/lib/craton";

type Search = { s?: string };

export const Route = createFileRoute("/factory")({
  validateSearch: (q: Record<string, unknown>): Search => (typeof q["s"] === "string" ? { s: q["s"] } : {}),
  head: () => ({
    meta: [
      { title: "Factory · craton ai" },
      { name: "description", content: "Give the swarm a task, steer the session with new instructions and follow every step." },
      { property: "og:title", content: "Factory · craton ai" },
      { property: "og:description", content: "Give the swarm a task, steer the session with new instructions and follow every step." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Factory,
});

const statusText: Record<Session["status"], string> = {
  open: "text-success", working: "text-primary", done: "text-muted-foreground", failed: "text-destructive", archived: "text-muted-foreground",
};
const dot: Record<Session["status"], string> = {
  open: "bg-success", working: "bg-primary blink", done: "bg-muted-foreground", failed: "bg-destructive", archived: "bg-muted-foreground",
};
const hash = () => Math.random().toString(16).slice(2, 12);

type Update = (id: string, fn: (x: Session) => Session) => void;

function Factory() {
  const { s } = Route.useSearch();
  const [list, setList] = useState<Session[]>(seed);
  const current = list.find((x) => x.id === s);
  const update: Update = (id, fn) => setList((l) => l.map((x) => (x.id === id ? fn(x) : x)));
  return current
    ? <SessionView key={current.id} session={current} update={update} />
    : <Overview list={list} setList={setList} />;
}

/* ─────────────────────────── Overview ─────────────────────────── */

type Filter = "all" | "working" | "open" | "failed" | "done";

function Overview({ list, setList }: { list: Session[]; setList: (fn: (l: Session[]) => Session[]) => void }) {
  const navigate = useNavigate();
  const [brief, setBrief] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const visible = list.filter((x) => x.status !== "archived");
  const failed = visible.filter((x) => x.status === "failed");
  const working = visible.filter((x) => x.status === "working");
  const adopted = new Set(list.map((x) => x.title));

  const create = (title: string, firstInstruction?: string) => {
    const id = `s${String(11 + list.length).padStart(4, "0")}`;
    const text = firstInstruction ?? "";
    const sess: Session = {
      id, title, status: "open", branch: `factory/${id}`, commit: hash().slice(0, 8), ago: "just now",
      scope: "not scoped yet", cost: "$0.00", instructions: [], timeline: [],
      ...(text ? { pending: text } : {}),
    } as Session;
    setList((l) => [sess, ...l]);
    navigate({ to: "/factory", search: { s: id } });
    if (text) sessionStorage.setItem(`craton:autostart:${id}`, text);
  };

  const start = () => {
    const t = brief.trim();
    if (!t) return;
    create(t.split("\n")[0]!.slice(0, 80), t);
  };

  const counts: Record<Filter, number> = {
    all: visible.length, working: working.length, open: visible.filter((x) => x.status === "open").length,
    failed: failed.length, done: visible.filter((x) => x.status === "done").length,
  };
  const shown = visible.filter((x) =>
    (filter === "all" || x.status === filter) &&
    (!query || `${x.title} ${x.id} ${x.commit}`.toLowerCase().includes(query.toLowerCase())));


  return (
    <div className="mx-auto max-w-[1400px] space-y-3">
      {/* Composer: the primary action */}
      <section className="panel overflow-hidden">
        <div className="p-4">
          <div className="mb-2 flex items-baseline gap-3">
            <h1 className="font-display text-lg font-bold">What should the factory build?</h1>
            <span className="ml-auto flex items-center gap-1.5 font-mono text-[10px] text-muted-foreground"><span className="h-1.5 w-1.5 rounded-full bg-success" />{working.length} working</span>
          </div>
          <div className="flex items-stretch gap-2 rounded-sm border border-input bg-background/60 focus-within:border-primary">
            <textarea
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); start(); } }}
              rows={2}
              placeholder="Describe a task — Ctrl+Enter to start"
              className="min-w-0 flex-1 resize-none bg-transparent px-3 py-2 text-sm outline-none"
            />
            <button onClick={start} disabled={!brief.trim()} className="m-1.5 flex items-center gap-1.5 self-end rounded-sm bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground disabled:opacity-40">
              Start <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </section>

      {failed.length > 0 && (
        <section className="panel border-destructive/40">
          <div className="flex items-center gap-2 border-b border-destructive/30 bg-destructive/10 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-destructive">
            <AlertTriangle className="h-3 w-3" /> Needs your attention
          </div>
          {failed.map((x) => {
            const last = [...x.timeline].reverse().find((t) => t.kind === "failed");
            return (
              <div key={x.id} className="flex flex-wrap items-center gap-3 px-3 py-2 text-sm">
                <span className="font-mono text-[11px] text-muted-foreground">{x.id}</span>
                <span className="font-medium">{x.title}</span>
                <span className="truncate font-mono text-[11px] text-destructive">{last?.text}</span>
                <Link to="/factory" search={{ s: x.id }} className="ml-auto flex items-center gap-1 rounded-sm border border-border px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider hover:border-primary hover:text-primary">
                  Resolve <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            );
          })}
        </section>
      )}

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section className="panel overflow-hidden">
          <div className="panel-head flex flex-wrap items-center gap-2 px-3 py-2">
            <h2 className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em]">Sessions</h2>
            <div className="flex flex-wrap gap-1">
              {(Object.keys(counts) as Filter[]).map((f) => (
                <button key={f} onClick={() => setFilter(f)} aria-pressed={filter === f}
                  className={`rounded-sm border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${filter === f ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground"}`}>
                  {f} <span className="opacity-60">{counts[f]}</span>
                </button>
              ))}
            </div>
            <label className="ml-auto flex h-7 items-center gap-1.5 rounded-sm border border-border bg-background/60 px-2 focus-within:border-primary">
              <Search className="h-3 w-3 text-muted-foreground" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="title, id, commit" className="w-32 bg-transparent font-mono text-[11px] outline-none" />
            </label>
          </div>
          {shown.length === 0 ? (
            <div className="py-10 text-center text-xs text-muted-foreground">No sessions match. <button onClick={() => { setQuery(""); setFilter("all"); }} className="text-primary underline">Clear filters</button></div>
          ) : (
            <ul className="divide-y divide-border/50">
              {shown.map((x) => {
                const landed = x.instructions.filter((i) => i.status === "landed").length;
                const total = Math.max(1, x.instructions.length);
                return (
                  <li key={x.id}>
                    <Link to="/factory" search={{ s: x.id }} className="group grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-3 py-2.5 hover:bg-secondary/30">
                      <span className={`h-2 w-2 rounded-full ${dot[x.status]}`} />
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium group-hover:text-primary">{x.title}</div>
                        <div className="mt-0.5 flex items-center gap-2 font-mono text-[10px] text-muted-foreground">
                          <span>{x.id}</span>
                          <span className="flex items-center gap-1"><GitBranch className="h-3 w-3" />{x.commit}</span>
                          <span className={statusText[x.status]}>{x.status === "working" ? `${x.stage?.toLowerCase() ?? "working"}…` : x.status}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="hidden w-28 sm:block">
                          <div className="flex justify-between font-mono text-[9px] text-muted-foreground"><span>{landed}/{x.instructions.length} landed</span></div>
                          <div className="mt-0.5 h-1 bg-border"><div className={`h-full ${x.status === "failed" ? "bg-destructive" : "bg-primary"}`} style={{ width: `${(landed / total) * 100}%` }} /></div>
                        </div>
                        <span className="w-14 text-right font-mono text-[10px] text-muted-foreground">{x.ago}</span>
                        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="panel self-start overflow-hidden">
          <div className="panel-head flex items-center gap-2 px-3 py-2">
            <h2 className="flex items-center gap-2 font-mono text-[11px] font-semibold uppercase tracking-[0.2em]"><Target className="h-3.5 w-3.5 text-primary" />Issues</h2>
            <span className="font-mono text-[10px] text-muted-foreground">GitLab · {issues.length} open</span>
          </div>
          <ul className="divide-y divide-border/50">
            {issues.map((i) => {
              const done = adopted.has(i.title);
              return (
                <li key={i.iid} className="flex items-start gap-2 px-3 py-2">
                  <span className="mt-0.5 font-mono text-[10px] text-muted-foreground">#{i.iid}</span>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm leading-snug">{i.title}</div>
                    <div className="mt-1 flex gap-1">{i.labels.map((l) => <span key={l} className="rounded-sm border border-border px-1.5 font-mono text-[9px] text-muted-foreground">{l}</span>)}</div>
                  </div>
                  <button disabled={done} onClick={() => create(i.title, `Resolve GitLab issue #${i.iid}: ${i.title}`)}
                    className="shrink-0 rounded-sm border border-primary/40 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-primary hover:bg-primary/10 disabled:border-border disabled:text-muted-foreground">
                    {done ? "Adopted" : "Adopt"}
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </div>
  );
}

/* ─────────────────────────── Session ─────────────────────────── */

function SessionView({ session: x, update }: { session: Session; update: Update }) {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<"all" | "notes">("all");
  const [mode, setMode] = useState<"instruction" | "quickfix">("instruction");
  const [draft, setDraft] = useState("");
  const [showEvents, setShowEvents] = useState(false);
  const [paused, setPaused] = useState(false);
  const end = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const latest = useRef(x);
  latest.current = x;

  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  useEffect(() => end.current?.scrollIntoView({ block: "end", behavior: "smooth" }), [x.timeline.length]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement?.tagName !== "TEXTAREA" && document.activeElement?.tagName !== "INPUT") { e.preventDefault(); input.current?.focus(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const push = (t: TimelineItem, patch?: Partial<Session>) => update(x.id, (s) => ({ ...s, ...patch, timeline: [...s.timeline, t] }));

  // UI-only simulation of the pipeline: replace with your backend's event stream.
  const run = (n: number, m: "instruction" | "quickfix") => {
    const intent = `i00${50 + n}`;
    update(x.id, (s) => ({ ...s, status: "working", stage: "Planning", ago: "just now", instructions: s.instructions.map((i) => (i.n === n ? { ...i, status: "running" } : i)) }));
    const steps: [number, () => void][] = [
      [600, () => push({ kind: "event", text: `intent ${intent} scoped: ${m === "quickfix" ? "small" : "unknown"}, change → flow with 1 part`, ago: "just now" }, { scope: `${m === "quickfix" ? "small" : "unknown"}, change → flow with 1 part` })],
      [1400, () => push({ kind: "plan", text: `Plan for #${n}: implementer → reviewer → merge`, ago: "just now" }, { stage: "Building" })],
      [2600, () => push({ kind: "event", text: `${intent}: implementer on n0${(n % 9) + 1} · reviewer queued`, ago: "just now" })],
      [3800, () => push({ kind: "event", text: `${intent}: review passed · merging into master`, ago: "just now" }, { stage: "Landing" })],
      [5000, () => {
        const commit = hash();
        update(x.id, (s) => ({
          ...s, status: "open", stage: "Publishing", commit: commit.slice(0, 8),
          cost: `$${(parseFloat(s.cost.slice(1)) + 0.14).toFixed(2)}`,
          instructions: s.instructions.map((i) => (i.n === n ? { ...i, status: "landed", commit } : i)),
          timeline: [...s.timeline, { kind: "landed", text: `#${n} landed on master @ ${commit}`, ago: "just now" }],
        }));
        toast.success(`#${n} landed`);
        // Start the next queued instruction, if any.
        setTimeout(() => {
          const next = latest.current.instructions.find((i) => i.status === "waiting");
          if (next) run(next.n, "instruction");
        }, 400);
      }],
    ];
    timers.current.push(...steps.map(([ms, fn]) => setTimeout(fn, ms)));
  };

  const submit = (text: string, m = mode) => {
    const t = text.trim();
    if (!t) return;
    const n = latest.current.instructions.length + 1;
    const busy = latest.current.status === "working" || paused;
    update(x.id, (s) => ({
      ...s,
      instructions: [...s.instructions, { n, text: t, status: busy ? "waiting" : "running" }],
      timeline: [...s.timeline, { kind: "instruction", n, text: t, ago: "just now", mode: m }],
    }));
    setDraft("");
    if (busy) toast(`#${n} queued — starts after the current one lands`);
    else setTimeout(() => run(n, m), 50);
  };

  // Auto-start a session created from the Overview composer.
  useEffect(() => {
    const k = `craton:autostart:${x.id}`;
    const t = sessionStorage.getItem(k);
    if (t) { sessionStorage.removeItem(k); submit(t, "instruction"); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const lastFailed = [...x.instructions].reverse().find((i) => i.status === "failed");
  const retry = () => {
    if (!lastFailed) return;
    update(x.id, (s) => ({ ...s, status: "open", timeline: [...s.timeline, { kind: "event", text: `Retrying #${lastFailed.n}`, ago: "just now" }] }));
    setTimeout(() => run(lastFailed.n, "quickfix"), 50);
  };

  const togglePause = () => {
    if (!paused) { timers.current.forEach(clearTimeout); timers.current = []; update(x.id, (s) => ({ ...s, status: s.status === "working" ? "open" : s.status, instructions: s.instructions.map((i) => (i.status === "running" ? { ...i, status: "waiting" } : i)) })); toast("Session paused — running work moved back to the queue"); }
    else { toast("Session resumed"); const next = latest.current.instructions.find((i) => i.status === "waiting"); if (next) setTimeout(() => run(next.n, "instruction"), 50); }
    setPaused(!paused);
  };

  const items = x.timeline
    .map((t, idx) => ({ t, idx }))
    .filter(({ t }) => (filter === "all" ? true : t.kind !== "instruction"))
    .filter(({ t }) => showEvents || t.kind !== "event");

  const counts = {
    running: x.instructions.filter((i) => i.status === "running").length,
    queued: x.instructions.filter((i) => i.status === "waiting").length,
    landed: x.instructions.filter((i) => i.status === "landed").length,
    failed: x.instructions.filter((i) => i.status === "failed").length,
  };
  const stageIdx = x.status === "working" && x.stage ? stages.indexOf(x.stage) : x.stage === "Publishing" ? 4 : -1;
  const working = x.status === "working";

  const jump = (n: number) => document.getElementById(`ins-${x.id}-${n}`)?.scrollIntoView({ behavior: "smooth", block: "center" });

  return (
    <div className="mx-auto grid max-w-[1600px] items-start gap-3 lg:grid-cols-[400px_minmax(0,1fr)]">
        {/* Timeline + composer */}
        <section className="panel sticky top-16 flex h-[calc(100vh-7rem)] min-h-[520px] flex-col overflow-hidden">
          <div className="panel-head flex flex-wrap items-center gap-2 px-3 py-2">
            <h2 className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em]">Chat</h2>
            <div className="flex rounded-sm border border-border">
              {([["all", "Everything"], ["notes", "Conductor"]] as const).map(([k, l]) => (
                <button key={k} onClick={() => setFilter(k)} className={`px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${filter === k ? "bg-secondary text-primary" : "text-muted-foreground hover:text-foreground"}`}>{l}</button>
              ))}
            </div>
            <label className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              <input type="checkbox" checked={showEvents} onChange={(e) => setShowEvents(e.target.checked)} className="accent-[var(--primary)]" /> events
            </label>
            
          </div>

          <div className="flex-1 space-y-2 overflow-y-auto p-4">
            {items.length === 0 && (
              <div className="grid h-full place-items-center text-center text-sm text-muted-foreground">
                <div><Workflow className="mx-auto mb-2 h-5 w-5 text-primary" />Tell the factory what to build.<br /><span className="text-xs">Each instruction builds on the last. Press <kbd className="rounded-sm border border-border px-1 font-mono">/</kbd> to type.</span></div>
              </div>
            )}
            {items.map(({ t, idx }) => <TimelineRow key={idx} t={t} sid={x.id} />)}
            {working && (
              <div className="flex items-center gap-2 pl-1 font-mono text-[11px] text-primary">
                <span className="flex gap-0.5">{[0, 1, 2].map((i) => <span key={i} className="h-1 w-1 rounded-full bg-primary blink" style={{ animationDelay: `${i * 0.2}s` }} />)}</span>
                {x.stage?.toLowerCase()}…
              </div>
            )}
            <div ref={end} />
          </div>

          <div className="border-t border-border bg-background/40 p-3">
            <div className="rounded-sm border border-input bg-background/70 focus-within:border-primary">
              <textarea ref={input} value={draft} onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); submit(draft); } }} rows={2}
                placeholder={working ? "Queue the next instruction — it starts when the current one lands." : "Tell the factory what to do next."}
                className="w-full resize-none bg-transparent px-3 py-2 text-sm outline-none" />
              <div className="flex flex-wrap items-center gap-2 border-t border-border/60 px-2 py-1.5">
                <div className="flex rounded-sm border border-border">
                  {([["instruction", "Instruction", Workflow], ["quickfix", "Quick fix", Zap]] as const).map(([k, l, I]) => (
                    <button key={k} onClick={() => setMode(k)} className={`flex items-center gap-1 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${mode === k ? "bg-secondary text-primary" : "text-muted-foreground hover:text-foreground"}`}><I className="h-3 w-3" />{l}</button>
                  ))}
                </div>
                <button onClick={() => toast("Attachments go to your backend")} className="grid h-6 w-6 place-items-center rounded-sm text-muted-foreground hover:text-primary" aria-label="Attach"><Paperclip className="h-3.5 w-3.5" /></button>
                <span className="hidden font-mono text-[10px] text-muted-foreground md:inline">{mode === "quickfix" ? "skips planning, small change" : "full plan → build → review"} · Ctrl+Enter</span>
                <button onClick={() => submit(draft)} disabled={!draft.trim()} className="ml-auto flex items-center gap-1.5 rounded-sm bg-primary px-3 py-1 text-xs font-medium text-primary-foreground disabled:opacity-40">
                  <Send className="h-3 w-3" />{working || paused ? "Queue" : "Send"}
                </button>
              </div>
            </div>
          </div>
        </section>
      <div className="min-w-0 space-y-3">
      {/* Header */}
      <section className="panel overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 px-3 py-2.5">
          <Link to="/factory" className="grid h-7 w-7 place-items-center rounded-sm border border-border text-muted-foreground hover:border-primary hover:text-primary" aria-label="Back to sessions"><ChevronLeft className="h-4 w-4" /></Link>
          <span className={`h-2.5 w-2.5 rounded-full ${paused ? "bg-accent" : dot[x.status]}`} />
          <div className="min-w-0">
            <h1 className="truncate font-display text-lg font-bold leading-tight">{x.title}</h1>
            <div className="flex flex-wrap items-center gap-2 font-mono text-[10px] text-muted-foreground">
              <span>{x.id}</span>
              <button onClick={() => { void navigator.clipboard?.writeText(`${x.branch}@${x.commit}`); toast("Branch copied"); }} className="flex items-center gap-1 hover:text-primary" title="Copy branch"><GitBranch className="h-3 w-3" />{x.branch} @ {x.commit}</button>
              <span>· {x.cost}</span>
            </div>
          </div>
          <div className="ml-auto flex gap-1.5">
            <HeadBtn onClick={togglePause} icon={paused ? Play : Pause}>{paused ? "Resume" : "Pause"}</HeadBtn>
            <HeadBtn disabled={counts.landed === 0 || working} onClick={() => toast.success(`Publishing ${x.commit} to production…`)} icon={Rocket} title={counts.landed === 0 ? "Nothing landed yet" : undefined}>Publish</HeadBtn>
            <HeadBtn onClick={() => { update(x.id, (s) => ({ ...s, status: "archived" })); toast("Session archived"); navigate({ to: "/factory", search: {} }); }} icon={Archive} danger>Archive</HeadBtn>
          </div>
        </div>
        {/* Stage rail */}
        <div className="grid grid-cols-4 border-t border-border/60">
          {stages.map((st, i) => {
            const state = i < stageIdx ? "done" : i === stageIdx ? "now" : "todo";
            return (
              <div key={st} className="relative px-3 py-1.5">
                <div className={`absolute inset-x-0 top-0 h-0.5 ${state === "done" ? "bg-success" : state === "now" ? "bg-primary blink" : "bg-border"}`} />
                <div className={`flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.16em] ${state === "now" ? "text-primary" : state === "done" ? "text-success" : "text-muted-foreground"}`}>
                  {state === "done" ? <Check className="h-3 w-3" /> : <span className="w-3 text-center">{i + 1}</span>}{st}
                </div>
              </div>
            );
          })}
        </div>
      </section>
      {x.status === "failed" && lastFailed && (
        <div className="flex flex-wrap items-center gap-3 rounded-sm border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          <span><b>#{lastFailed.n} failed.</b> <span className="text-muted-foreground">{lastFailed.text.slice(0, 90)}…</span></span>
          <div className="ml-auto flex gap-1.5">
            <button onClick={retry} className="flex items-center gap-1.5 rounded-sm bg-primary px-3 py-1 text-xs font-medium text-primary-foreground"><RotateCcw className="h-3 w-3" />Retry</button>
            <button onClick={() => { setDraft(`Follow-up on #${lastFailed.n}: `); input.current?.focus(); }} className="rounded-sm border border-border px-3 py-1 text-xs hover:border-primary">Write follow-up</button>
          </div>
        </div>
      )}
        {/* Side: instruction queue */}
        <aside className="panel overflow-hidden">
          <div className="panel-head flex items-center gap-3 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            Instructions
            <span className="ml-auto normal-case tracking-normal">
              {counts.landed} landed{counts.running ? ` · ${counts.running} running` : ""}{counts.queued ? ` · ${counts.queued} queued` : ""}{counts.failed ? <span className="text-destructive"> · {counts.failed} failed</span> : ""}
            </span>
          </div>
          <ul className="divide-y divide-border/50">
            {x.instructions.length === 0 && <li className="px-3 py-6 text-center text-xs text-muted-foreground">Nothing yet — start in the chat.</li>}
            {x.instructions.map((i) => (
              <li key={i.n}>
                <button onClick={() => jump(i.n)} className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm hover:bg-secondary/30">
                  <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${i.status === "landed" ? "bg-success" : i.status === "failed" ? "bg-destructive" : i.status === "waiting" ? "bg-muted-foreground" : "bg-primary blink"}`} />
                  <span className="w-6 shrink-0 font-mono text-[11px] text-muted-foreground">#{i.n}</span>
                  <span className="min-w-0 flex-1 truncate">{i.text}</span>
                  <span className={`shrink-0 font-mono text-[10px] ${i.status === "failed" ? "text-destructive" : i.status === "running" ? "text-primary" : "text-muted-foreground"}`}>
                    {i.status === "landed" ? i.commit?.slice(0, 7) : i.status === "waiting" ? "queued" : i.status}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  );
}

function HeadBtn({ children, icon: I, onClick, disabled, danger, title }: { children: React.ReactNode; icon: typeof Pause; onClick: () => void; disabled?: boolean; danger?: boolean; title?: string | undefined }) {
  return (
    <button onClick={onClick} disabled={disabled} title={title}
      className={`flex items-center gap-1.5 rounded-sm border border-border px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider disabled:opacity-40 ${danger ? "hover:border-destructive hover:text-destructive" : "hover:border-primary hover:text-primary"}`}>
      <I className="h-3 w-3" />{children}
    </button>
  );
}

function TimelineRow({ t, sid }: { t: TimelineItem; sid: string }) {
  if (t.kind === "instruction") {
    return (
      <div id={`ins-${sid}-${t.n}`} className="fade-in ml-auto max-w-[85%] pt-2">
        <div className="mb-1 flex justify-end gap-2 font-mono text-[10px] text-muted-foreground">
          <span>#{t.n}</span>{t.mode === "quickfix" && <span className="text-accent">⚡ quick fix</span>}<span>{t.ago}</span>
        </div>
        <div className="rounded-sm border border-primary/50 bg-primary/5 px-3 py-2 text-sm">{t.text}</div>
      </div>
    );
  }
  if (t.kind === "event") {
    return (
      <div className="fade-in flex items-center gap-2 pl-1 font-mono text-[11px] text-muted-foreground">
        <CircleDot className="h-3 w-3 shrink-0" /><span className="min-w-0 flex-1 truncate" title={t.text}>{t.text}</span><span className="text-[10px]">{t.ago}</span>
      </div>
    );
  }
  const map = {
    plan: { I: Workflow, cls: "border-accent/50 text-accent", label: "Plan" },
    landed: { I: GitMerge, cls: "border-success/50 text-success", label: "Landed" },
    failed: { I: X, cls: "border-destructive/60 text-destructive", label: "Failed" },
    answer: { I: CircleDot, cls: "border-border text-foreground", label: "Answer" },
  }[t.kind];
  return (
    <div className={`fade-in flex items-start gap-2.5 rounded-sm border-l-2 bg-background/40 px-3 py-2 ${map.cls}`}>
      <map.I className="mt-0.5 h-3.5 w-3.5 shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="font-mono text-[9px] uppercase tracking-[0.18em]">{map.label}</div>
        <div className="whitespace-pre-wrap text-sm text-foreground">{t.text}</div>
      </div>
      <span className="font-mono text-[10px] text-muted-foreground">{t.ago}</span>
    </div>
  );
}
