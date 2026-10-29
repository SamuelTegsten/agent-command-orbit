// Mock data modelled on the real factory runtime (see docs/reference/*.png).
// Swap these exports for your backend calls — the UI only reads these shapes.

export type WorkCounts = { running: number; blocked: number; failed: number; queued: number; done: number };
export const work: WorkCounts = { running: 0, blocked: 0, failed: 33, queued: 1, done: 161 };

export const install = { name: "aitest", version: "2.3.1", commit: "8e59d7a4", uptime: "5h 40m" };

export const usage = {
  window: "seven_day",
  pct: 95,
  stopsAt: 95,
  paused: true,
  resumes: "18:01:00",
  resumesIn: "2h 45m",
  reason: "rate limit allowed_warning",
};

export type SetupCard = { key: string; label: string; value: string; sub: string; tone: "ok" | "warn" | "bad" | "info"; details: [string, string][] };
export const setup: SetupCard[] = [
  { key: "mainframe", label: "Mainframe", value: "alma", sub: "tracking mcp-probe · seen 6h 40m ago", tone: "info", details: [["user", "sate"], ["path", "/home/sate/.local/share/craton"], ["running", "0"], ["queued", "1"], ["busy", "0/9"]] },
  { key: "hub", label: "Hub", value: install.version, sub: `${install.name} · up ${install.uptime}`, tone: "ok", details: [["commit", install.commit], ["queued", "1"], ["done", "899"], ["failed", "94"]] },
  { key: "usage", label: "Usage", value: "Paused", sub: `${usage.window} · stops at ${usage.stopsAt}%`, tone: "bad", details: [["window", usage.window], ["used", `${usage.pct}%`], ["resumes", usage.resumes], ["reason", usage.reason]] },
  { key: "versions", label: "Versions", value: "In sync", sub: "craton-tools 2.3.1 · claude 2.1.312 · python 3.9.25", tone: "ok", details: [["craton-tools", "2.3.1"], ["claude", "2.1.312"], ["python", "3.9.25"]] },
  { key: "security", label: "Security", value: "Guarded", sub: "9/9 signed in · 9/9 isolated", tone: "ok", details: [["signed in", "9/9"], ["isolated", "9/9"], ["secrets", "broker only"]] },
  { key: "fleet", label: "Fleet", value: "9 nodes", sub: "c1.medium", tone: "ok", details: [["flavor", "c1.medium"], ["cores", "18"], ["ram", "36 GB"]] },
];

export type Role = "implementer" | "reviewer" | "supervisor" | "planner" | "conductor";
export type FleetNode = {
  id: string; cores: number; memGb: number; flavor: string;
  status: "idle" | "busy" | "offline";
  idleFor: string; lastIntent: string; lastRole: Role;
  load: number; mem: number; disk: number;
  ran: number; failed: number; recent: ("ok" | "fail" | "warn")[];
};
const lasts: [string, Role][] = [
  ["i0044: Merging this session into master", "implementer"],
  ["i0043: Merging this session into master", "implementer"],
  ["i0039: Review the fix", "reviewer"],
  ["i0046: conductor", "supervisor"],
  ["i0047: plan", "planner"],
  ["i0044: conductor", "supervisor"],
  ["i0045: conductor", "supervisor"],
  ["i0043: conductor", "supervisor"],
  ["i0039: conductor", "supervisor"],
];
const ran = [29, 46, 34, 13, 38, 6, 5, 6, 2];
const failedN = [0, 0, 6, 2, 7, 1, 0, 0, 0];
export const fleet: FleetNode[] = lasts.map(([l, r], i) => ({
  id: `n0${i + 1}`, cores: 2, memGb: 4, flavor: "c1.medium",
  status: i === 4 ? "busy" : "idle",
  idleFor: i === 2 || i === 8 ? "17.6h" : "17.3h",
  lastIntent: l, lastRole: r,
  load: i === 0 ? 0.01 : 0, mem: 12 + (i % 2), disk: [8.1, 7.2, 7.2, 7.2, 7.2, 8.1, 8.1, 8.1, 8.1][i]!,
  ran: ran[i]!, failed: failedN[i]!,
  recent: Array.from({ length: Math.min(6, ran[i]!) }, (_, k) => (k === 3 && failedN[i]! > 0 ? "fail" : k === 2 && i === 1 ? "warn" : "ok")),
}));

export const tokens = { total: "1.0G", in: "1.0G", out: "13M", cache: "912M", perMin: 0 };
export const sandbox = { active: 0, programs: 40, calls: 478, waiting: 0 };

export type SessionStatus = "open" | "working" | "done" | "failed" | "archived";
export type Stage = "Planning" | "Building" | "Landing" | "Publishing";
export type TimelineItem =
  | { kind: "instruction"; n: number; text: string; ago: string; mode: "instruction" | "quickfix" }
  | { kind: "event"; text: string; ago: string }
  | { kind: "plan"; text: string; ago: string }
  | { kind: "landed"; text: string; ago: string }
  | { kind: "failed"; text: string; ago: string }
  | { kind: "answer"; text: string; ago: string };
export type Instruction = { n: number; text: string; status: "landed" | "failed" | "running" | "waiting"; commit?: string };
export type Session = {
  id: string; title: string; status: SessionStatus; branch: string; commit: string; ago: string;
  scope: string; cost: string; intent?: string; stage?: Stage;
  instructions: Instruction[]; timeline: TimelineItem[];
};

const mk = (id: string, title: string, status: SessionStatus, commit: string, ago: string, count: number, intent?: string): Session => ({
  id, title, status, commit, ago, branch: `factory/${id}`, intent,
  scope: "unknown, visual, change → flow with 1 part (board)", cost: "$0.00",
  stage: status === "working" ? "Building" : undefined,
  instructions: Array.from({ length: count }, (_, k) => ({ n: k + 1, text: `Instruction #${k + 1} for ${title}`, status: status === "working" && k === count - 1 ? "running" : "landed", commit: status === "working" && k === count - 1 ? undefined : `${commit.slice(0, 7)}${k}` })),
  timeline: [
    { kind: "instruction", n: 1, mode: "instruction", text: `${title}.`, ago },
    { kind: "event", text: `intent scoped: unknown, visual, change; suggests flow with 1 part(s)`, ago },
    { kind: "plan", text: "Started on instruction #1", ago },
    ...(status === "working" ? [{ kind: "event" as const, text: `${intent ?? "i0047"}: building on n05…`, ago: "now" }] : [{ kind: "landed" as const, text: `#1 landed on master @ ${commit}`, ago }]),
  ],
});

export const sessions: Session[] = [
  {
    ...mk("s0005", "Filtrera konduktörens anteckningar", "failed", "a4e2b255", "7 h ago", 2),
    instructions: [
      { n: 1, text: "On the Factory session page, the conductor's notes are mixed into the timeline. Add a filter.", status: "landed", commit: "a4e2b255c7" },
      { n: 2, text: "Merging this session into master failed: it conflicts with master 001803a3. Resolve it.", status: "failed" },
    ],
    timeline: [
      { kind: "instruction", n: 1, mode: "instruction", text: "On the Factory session page, the conductor's notes are mixed into the timeline. Add a filter: Everything / Conductor notes.", ago: "7 h ago" },
      { kind: "landed", text: "#1 landed on master @ a4e2b255c7", ago: "7 h ago" },
      { kind: "instruction", n: 2, mode: "quickfix", text: "Merging into master failed: conflicts in src/craton_tools/ai/board/js/87-factory.js. Run `git fetch hub base/001803a3178a && git merge FETCH_HEAD`, resolve every conflict so both changes survive, run the tests of the files you resolved, and commit the merge. Change nothing else.", ago: "7 h ago" },
      { kind: "event", text: "intent i0050 scoped: unknown, visual, change; suggests flow with 1 part(s)", ago: "7 h ago" },
      { kind: "event", text: "Writing the plan…", ago: "7 h ago" },
      { kind: "plan", text: "Started on instruction #2", ago: "7 h ago" },
      { kind: "event", text: "intent i0050 cancelled", ago: "7 h ago" },
      { kind: "failed", text: "#2 failed: intent i0050 cancelled", ago: "7 h ago" },
    ],
  },
  mk("s0004", "Uppgradera Operations", "open", "f90cedfc", "7 h ago", 4),
  mk("s0001", "UI/UX: sync Operations and Factory with Home", "open", "e22c1b9c", "7 h ago", 11),
  mk("s0008", "Factory page: a campaign panel with the epic and its issues", "open", "001803a3", "16 h ago", 4),
  mk("s0007", "Självförbättring", "working", "893c200c", "17 h ago", 15, "i0047"),
  mk("s0009", "craton ai factory report SID: one readable report of a session", "open", "cd682ea0", "17 h ago", 4),
  mk("s0010", "craton ai factory stats: how the factory performs over time", "open", "cbc4727f", "17 h ago", 2),
  mk("s0006", "Rätta en kvarlämnad brist i CLI:n", "open", "877bf613", "23 h ago", 3),
  mk("s0003", "Tydligare tomma lägen på tavlan", "done", "6fd834b3", "1 d ago", 1),
  mk("s0002", "Ta bort notisen om ohämtade resultat", "done", "af5d8b4c", "1 d ago", 2),
  mk("s10001", "Docs: list craton ai do", "open", "e4b0dc70", "2 d ago", 4),
];

export const performance = { leadTime: "1.8 h", p90: "5.9 h", mergeSuccess: "100%", merges: 7, mergeFailed: 0, failures: 0 };
export const stages: Stage[] = ["Planning", "Building", "Landing", "Publishing"];

export const issues = [
  { iid: 412, title: "Board: empty states unclear on small screens", labels: ["ux"] },
  { iid: 409, title: "CLI: `craton status` ignores --json", labels: ["bug", "cli"] },
  { iid: 401, title: "Report per session (SID)", labels: ["feature"] },
];
