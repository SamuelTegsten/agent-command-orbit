// Mock data only — replace with real backend calls.
export type Status = "online" | "busy" | "idle" | "paused" | "error";

export const clients = [
  { id: "cl-01", name: "magnus-ws", kind: "Workstation", user: "Magnus L.", sessions: 2, status: "online" as Status },
  { id: "cl-02", name: "review-lt-07", kind: "Laptop", user: "Sara K.", sessions: 1, status: "online" as Status },
  { id: "cl-03", name: "ci-runner-a", kind: "Service", user: "CI pipeline", sessions: 4, status: "busy" as Status },
  { id: "cl-04", name: "ops-term-2", kind: "Terminal", user: "Ops on-call", sessions: 0, status: "idle" as Status },
];

export const nodes = [
  { id: "node-a1", host: "virt-host-01", agent: "coder-7b", task: "TCK-1042 · fix auth retry", status: "busy" as Status, cpu: 72, mem: 58, model: "open/qwen-coder-32b" },
  { id: "node-a2", host: "virt-host-01", agent: "reviewer", task: "MR !318 · review", status: "busy" as Status, cpu: 41, mem: 37, model: "open/llama-70b" },
  { id: "node-b1", host: "virt-host-02", agent: "coder-7b", task: "TCK-1051 · bump deps", status: "busy" as Status, cpu: 63, mem: 49, model: "open/qwen-coder-32b" },
  { id: "node-b2", host: "virt-host-02", agent: "maintainer", task: "Paused · awaiting human", status: "paused" as Status, cpu: 2, mem: 22, model: "—" },
  { id: "node-c1", host: "virt-host-03", agent: "warm pool", task: "Ready", status: "idle" as Status, cpu: 1, mem: 8, model: "—" },
  { id: "node-c2", host: "virt-host-03", agent: "coder-7b", task: "Crashed · resuming", status: "error" as Status, cpu: 0, mem: 31, model: "cloud/allowed" },
];

export const layers = [
  { id: "people", label: "People", zone: "Your tools", items: ["Engineers", "Reviewers"] },
  { id: "collab", label: "Collaboration", zone: "Container cluster", items: ["Chat", "Ticket tracking", "Code hosting & CI"] },
  { id: "control", label: "Control plane", zone: "Container cluster", items: ["Bridge", "Orchestration", "Policy engine", "Credentials", "Observability", "Improvement loop"] },
  { id: "exec", label: "Agent execution", zone: "Virtualisation hosts", items: ["Workspace service", "Agent workspaces"] },
  { id: "inference", label: "Inference", zone: "GPU servers", items: ["Model gateway", "Open models", "Cloud models"] },
];

export const runs = [
  { id: "run-8812", title: "TCK-1042 · fix auth retry", repo: "platform/auth", step: 3, steps: ["Intake", "Plan", "Workspace", "Code", "Verify", "Review", "Human gate", "Merge"], state: "running" },
  { id: "run-8810", title: "MR !318 · review", repo: "web/portal", step: 5, steps: ["Intake", "Plan", "Workspace", "Code", "Verify", "Review", "Human gate", "Merge"], state: "running" },
  { id: "run-8807", title: "Nightly maintenance", repo: "class: libs/*", step: 6, steps: ["Intake", "Plan", "Workspace", "Code", "Verify", "Review", "Human gate", "Merge"], state: "waiting" },
  { id: "run-8799", title: "TCK-1029 · logging", repo: "platform/core", step: 7, steps: ["Intake", "Plan", "Workspace", "Code", "Verify", "Review", "Human gate", "Merge"], state: "done" },
  { id: "run-8803", title: "TCK-1037 · flaky test", repo: "platform/auth", step: 4, steps: ["Intake", "Plan", "Workspace", "Code", "Verify", "Review", "Human gate", "Merge"], state: "failed" },
];

export const eventTemplates = [
  ["orchestration", "Checkpoint saved for run-8812 · step Code"],
  ["policy", "Allowed: tool git.push on platform/auth (class: core)"],
  ["credentials", "Issued short-lived token · scope repo:read · ttl 90s"],
  ["gateway", "Routed job to open/qwen-coder-32b · 4.1k tokens"],
  ["workspace", "Resumed node-c2 from paused volume"],
  ["bridge", "Posted comment on MR !318"],
  ["policy", "Denied: agent merge on web/portal · human gate required"],
  ["observability", "Eval score 0.91 recorded for reviewer agent"],
  ["improvement", "Pattern found: duplicate retry logic in 3 repos"],
  ["gateway", "Cloud model blocked by policy · air-gapped repo"],
  ["workspace", "Warm pool replenished · 3 ready"],
  ["bridge", "Ticket TCK-1042 moved to In review"],
] as const;

// ---------- Topology ----------
export type WorkType = "task" | "review" | "maintenance";
export type NodeStatus = Status | "transition";

export type TopoNode = {
  id: string;
  host: string;
  agent: string;
  task: string;
  status: NodeStatus;
  cpu: number;
  mem: number;
  model: string; // model id or ""
  client: string; // client id or ""
  type: WorkType;
  uptime: string;
};

export const hosts = [
  { id: "virt-host-01", slots: 3, zone: "rack A · hypervisor" },
  { id: "virt-host-02", slots: 3, zone: "rack A · hypervisor" },
  { id: "virt-host-03", slots: 3, zone: "rack B · hypervisor" },
];

export const topoNodes: TopoNode[] = [
  { id: "node-a1", host: "virt-host-01", agent: "coder", task: "TCK-1042 · fix auth retry", status: "busy", cpu: 72, mem: 58, model: "qwen", client: "cl-01", type: "task", uptime: "18m" },
  { id: "node-a2", host: "virt-host-01", agent: "reviewer", task: "MR !318 · review", status: "busy", cpu: 41, mem: 37, model: "llama", client: "cl-02", type: "review", uptime: "6m" },
  { id: "node-b1", host: "virt-host-02", agent: "coder", task: "TCK-1051 · bump deps", status: "busy", cpu: 63, mem: 49, model: "qwen", client: "cl-03", type: "task", uptime: "41m" },
  { id: "node-b2", host: "virt-host-02", agent: "maintainer", task: "Paused · awaiting human", status: "paused", cpu: 2, mem: 22, model: "", client: "cl-03", type: "maintenance", uptime: "3h 12m" },
  { id: "node-b3", host: "virt-host-02", agent: "reviewer", task: "MR !322 · review", status: "busy", cpu: 35, mem: 30, model: "llama", client: "cl-03", type: "review", uptime: "2m" },
  { id: "node-c1", host: "virt-host-03", agent: "warm pool", task: "Ready", status: "idle", cpu: 1, mem: 8, model: "", client: "", type: "task", uptime: "—" },
  { id: "node-c2", host: "virt-host-03", agent: "coder", task: "Crashed · resuming", status: "error", cpu: 0, mem: 31, model: "qwen", client: "cl-01", type: "task", uptime: "0m" },
];

export const hubParts = [
  { id: "orchestration", label: "Orchestration", desc: "Durable workflows that resume after failure.", stat: "12 runs" },
  { id: "policy", label: "Policy engine", desc: "Rules per repository or class: merges, models, tools.", stat: "7 denies" },
  { id: "credentials", label: "Credentials", desc: "Short-lived tokens per tool call, hidden from agents.", stat: "318 issued" },
  { id: "gateway", label: "Model gateway", desc: "Chooses a model per job and applies model policy.", stat: "41k tok/m" },
  { id: "bridge", label: "Bridge", desc: "The only component that writes to people's tools.", stat: "64 writes" },
  { id: "observability", label: "Observability", desc: "Run records and evaluation results.", stat: "eval 0.91" },
];

export const models = [
  { id: "qwen", label: "qwen-coder-32b", kind: "open", gpu: "gpu-01", load: 62, blocked: false },
  { id: "llama", label: "llama-70b", kind: "open", gpu: "gpu-02", load: 32, blocked: false },
  { id: "cloud", label: "Cloud models", kind: "cloud", gpu: "external", load: 0, blocked: true },
];

export const tickerTemplates = [
  "{node} checkpoint saved",
  "Policy allowed git.push for {node}",
  "Token issued to {node} · ttl 90s",
  "{node} routed to open model",
  "Bridge posted update from {node}",
  "Warm pool replenished on virt-host-03",
  "Cloud model request blocked · air-gapped",
];
