import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowUp, Check, GitPullRequest, Paperclip, ShieldAlert, Sparkles, X } from "lucide-react";
import { SectionLabel, StatusDot } from "@/components/AppShell";

export const Route = createFileRoute("/factory")({
  head: () => ({
    meta: [
      { title: "Factory · Basalt Software Factory" },
      { name: "description", content: "Submit tasks, talk to the factory and review its feedback." },
      { property: "og:title", content: "Factory · Basalt Software Factory" },
      { property: "og:description", content: "Submit tasks, talk to the factory and review its feedback." },
    ],
  }),
  component: Factory,
});

type Msg =
  | { role: "user"; text: string }
  | { role: "system"; text: string; plan?: string[]; gate?: boolean; mr?: string };

const threads = [
  { id: "TCK-1042", title: "Fix auth retry storm", status: "running", repo: "platform/auth" },
  { id: "TCK-1051", title: "Bump dependencies", status: "running", repo: "web/portal" },
  { id: "MNT-77", title: "Nightly maintenance", status: "waiting", repo: "libs/*" },
  { id: "TCK-1029", title: "Structured logging", status: "done", repo: "platform/core" },
];

const initial: Msg[] = [
  { role: "user", text: "Login requests retry forever when the token service is down. Add backoff and a cap." },
  {
    role: "system",
    text: "Picked up TCK-1042. Policy for platform/auth (class: core) allows open models only and requires a human to merge.",
    plan: ["Reproduce with failing test", "Add exponential backoff (max 5)", "Run CI + reviewer agent", "Open merge request"],
  },
  { role: "system", text: "Tests green · reviewer agent approved with 1 note. Ready for your decision.", gate: true, mr: "!324" },
];

function Factory() {
  const [active, setActive] = useState(threads[0]!.id);
  const [msgs, setMsgs] = useState<Msg[]>(initial);
  const [draft, setDraft] = useState("");
  const [thinking, setThinking] = useState(false);
  const [mode, setMode] = useState<"Task" | "Question" | "Review">("Task");
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => end.current?.scrollIntoView({ behavior: "smooth" }), [msgs, thinking]);

  const send = () => {
    if (!draft.trim()) return;
    setMsgs((m) => [...m, { role: "user", text: draft }]);
    setDraft("");
    setThinking(true);
    // UI-only stub: replace with your backend call.
    setTimeout(() => {
      setThinking(false);
      setMsgs((m) => [...m, { role: "system", text: `Received as ${mode.toLowerCase()}. Checking policy and queueing a workspace…`, plan: ["Policy check", "Allocate workspace", "Plan", "Execute"] }]);
    }, 1200);
  };

  const t = threads.find((x) => x.id === active)!;

  return (
    <div className="grid h-[calc(100vh-7rem)] gap-4 lg:grid-cols-[260px_1fr_300px]">
      <aside className="panel flex flex-col p-4">
        <SectionLabel>02 / Factory</SectionLabel>
        <button className="mt-3 rounded-sm bg-primary py-2 text-sm font-medium text-primary-foreground glow-primary hover:opacity-90">+ New task</button>
        <div className="mt-5"><SectionLabel>Your work</SectionLabel></div>
        <div className="mt-2 space-y-1">
          {threads.map((th) => (
            <button
              key={th.id}
              onClick={() => setActive(th.id)}
              className={`w-full rounded-sm px-3 py-2 text-left transition-colors ${active === th.id ? "bg-secondary" : "hover:bg-secondary/50"}`}
            >
              <div className="flex items-center gap-2">
                <StatusDot status={th.status} />
                <span className="font-mono text-[10px] text-muted-foreground">{th.id}</span>
              </div>
              <div className="mt-0.5 truncate text-sm">{th.title}</div>
            </button>
          ))}
        </div>
      </aside>

      <section className="panel flex min-h-0 flex-col">
        <div className="flex items-center gap-3 border-b border-border px-5 py-3">
          <StatusDot status={t.status} />
          <span className="font-medium">{t.title}</span>
          <span className="font-mono text-xs text-muted-foreground">{t.repo}</span>
        </div>
        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          {msgs.map((m, i) =>
            m.role === "user" ? (
              <div key={i} className="flex justify-end">
                <div className="max-w-[75%] rounded-md bg-secondary px-4 py-3 text-sm">{m.text}</div>
              </div>
            ) : (
              <div key={i} className="flex gap-3">
                <div className="grid h-7 w-7 shrink-0 place-items-center rounded-sm bg-primary/15 text-primary"><Sparkles className="h-4 w-4" /></div>
                <div className="max-w-[80%] space-y-3">
                  <p className="text-sm leading-relaxed">{m.text}</p>
                  {m.plan && (
                    <ol className="space-y-1.5 rounded-md border border-border bg-background/50 p-3">
                      {m.plan.map((p, j) => (
                        <li key={p} className="flex items-center gap-2 font-mono text-xs">
                          <span className="grid h-4 w-4 place-items-center rounded-full border border-success text-success"><Check className="h-2.5 w-2.5" /></span>
                          <span className="text-muted-foreground">{String(j + 1).padStart(2, "0")}</span> {p}
                        </li>
                      ))}
                    </ol>
                  )}
                  {m.gate && (
                    <div className="rounded-md border border-primary/50 bg-primary/5 p-4">
                      <div className="flex items-center gap-2 text-sm font-medium text-primary"><ShieldAlert className="h-4 w-4" /> Human gate · merge requires you</div>
                      <div className="mt-2 flex items-center gap-2 font-mono text-xs text-muted-foreground"><GitPullRequest className="h-3.5 w-3.5" /> MR {m.mr} · +84 −12 · 3 files · CI passed</div>
                      <div className="mt-3 flex gap-2">
                        <button className="flex items-center gap-1 rounded-sm bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"><Check className="h-3 w-3" /> Approve merge</button>
                        <button className="rounded-sm border border-border px-3 py-1.5 text-xs hover:border-primary">Request changes</button>
                        <button className="flex items-center gap-1 rounded-sm px-3 py-1.5 text-xs text-muted-foreground hover:text-destructive"><X className="h-3 w-3" /> Reject</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ),
          )}
          {thinking && (
            <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-primary blink" /> factory is thinking…
            </div>
          )}
          <div ref={end} />
        </div>
        <div className="border-t border-border p-4">
          <div className="mb-2 flex gap-1">
            {(["Task", "Question", "Review"] as const).map((x) => (
              <button key={x} onClick={() => setMode(x)} className={`rounded-sm px-2.5 py-1 font-mono text-[11px] ${mode === x ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                {x}
              </button>
            ))}
          </div>
          <div className="flex items-end gap-2 rounded-md border border-input bg-background/60 p-2 focus-within:border-primary">
            <button className="p-2 text-muted-foreground hover:text-foreground"><Paperclip className="h-4 w-4" /></button>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              rows={2}
              placeholder="Describe a task, ask a question, or request a review…"
              className="flex-1 resize-none bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            <button onClick={send} className="grid h-9 w-9 place-items-center rounded-sm bg-primary text-primary-foreground disabled:opacity-40" disabled={!draft.trim()}>
              <ArrowUp className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      <aside className="space-y-4 overflow-y-auto">
        <div className="panel p-4">
          <SectionLabel>Task status</SectionLabel>
          <div className="mt-3 space-y-2 font-mono text-xs">
            {[["Workspace", "node-a1"], ["Model", "open/qwen-coder-32b"], ["Tokens", "41.2k"], ["Elapsed", "18m 42s"]].map(([k, v]) => (
              <div key={k} className="flex justify-between"><span className="text-muted-foreground">{k}</span><span>{v}</span></div>
            ))}
          </div>
        </div>
        <div className="panel p-4">
          <SectionLabel>Policy for this repo</SectionLabel>
          <ul className="mt-3 space-y-2 text-xs">
            {[["Agent merges", false], ["Cloud models", false], ["Open models", true], ["git push to branch", true]].map(([k, ok]) => (
              <li key={k as string} className="flex items-center justify-between">
                {k as string}
                <span className={`rounded-sm px-1.5 py-0.5 font-mono text-[10px] ${ok ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"}`}>{ok ? "ALLOW" : "DENY"}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="panel p-4">
          <SectionLabel>Feedback & evidence</SectionLabel>
          <ul className="mt-3 space-y-2 text-xs text-muted-foreground">
            <li>✓ 214 tests passed</li>
            <li>✓ Reviewer agent score 0.91</li>
            <li>• Note: consider jitter on backoff</li>
            <li>↳ Improvement loop: same pattern in 2 repos</li>
          </ul>
        </div>
      </aside>
    </div>
  );
}
