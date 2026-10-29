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
