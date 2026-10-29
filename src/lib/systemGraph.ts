// Mock system graph — every component from the architecture and how they talk.
import type { LucideIcon } from "lucide-react";
import { Users, UserCheck, MessageSquare, Ticket, GitBranch, Radio, Workflow, ShieldCheck, KeyRound, Eye, Sparkles, Boxes, Box, Cpu, Server, Cloud } from "lucide-react";

export type Zone = { id: string; label: string; runsOn: string; x: number; w: number };
export type GNode = { id: string; label: string; sub: string; icon: LucideIcon; zone: string; x: number; y: number; metric: string; desc: string; locked?: boolean };
export type Flow = "work" | "control" | "data" | "model" | "feedback";
export type GEdge = { id: string; from: string; to: string; flow: Flow; label: string; blocked?: boolean };

// Coordinates are in a 160 x 100 canvas.
export const zones: Zone[] = [
  { id: "people", label: "People", runsOn: "their usual tools", x: 1, w: 17 },
  { id: "collab", label: "Collaboration", runsOn: "container cluster", x: 20, w: 20 },
  { id: "control", label: "Hub · control plane", runsOn: "container cluster", x: 42, w: 60 },
  { id: "exec", label: "Agent execution", runsOn: "virtualisation hosts", x: 104, w: 25 },
  { id: "inference", label: "Inference", runsOn: "GPU servers", x: 131, w: 28 },
];

export const gnodes: GNode[] = [
  { id: "engineers", label: "Engineers", sub: "submit work", icon: Users, zone: "people", x: 9.5, y: 32, metric: "14 online", desc: "Engineers create tickets and ask questions in chat." },
  { id: "reviewers", label: "Reviewers", sub: "approve changes", icon: UserCheck, zone: "people", x: 9.5, y: 70, metric: "2 gates", desc: "People who approve merges where policy requires a human." },
  { id: "chat", label: "Chat", sub: "questions", icon: MessageSquare, zone: "collab", x: 30, y: 22, metric: "38 msg/h", desc: "Questions and notifications between people and agents." },
  { id: "tickets", label: "Ticket tracking", sub: "work items", icon: Ticket, zone: "collab", x: 30, y: 50, metric: "9 queued", desc: "Work items assigned to agents." },
  { id: "code", label: "Code hosting & CI", sub: "repos · MRs", icon: GitBranch, zone: "collab", x: 30, y: 78, metric: "5 open MRs", desc: "Repositories, merge requests and CI pipelines." },
  { id: "bridge", label: "Bridge", sub: "only writer", icon: Radio, zone: "control", x: 51, y: 50, metric: "64 writes", desc: "The only component allowed to write back into people's tools." },
  { id: "orch", label: "Orchestration", sub: "durable workflows", icon: Workflow, zone: "control", x: 70, y: 28, metric: "12 runs", desc: "Long-running workflows that drive each piece of work and survive restarts." },
  { id: "policy", label: "Policy engine", sub: "rules per repo", icon: ShieldCheck, zone: "control", x: 70, y: 56, metric: "1.2k checks", desc: "Holds the rules per repository or class: merges, models, tools." },
  { id: "creds", label: "Credentials", sub: "per tool call", icon: KeyRound, zone: "control", x: 70, y: 82, metric: "318 tokens", desc: "Issues short-lived credentials per tool call, hidden from agents." },
  { id: "obs", label: "Observability", sub: "run records", icon: Eye, zone: "control", x: 91, y: 36, metric: "eval 0.91", desc: "Records every run and evaluation result." },
  { id: "improve", label: "Improvement loop", sub: "finds patterns", icon: Sparkles, zone: "control", x: 91, y: 70, metric: "3 proposals", desc: "Finds token overuse and repeated problems; proposes changes." },
  { id: "wss", label: "Workspace service", sub: "warm pool", icon: Boxes, zone: "exec", x: 116.5, y: 28, metric: "3 warm", desc: "Starts, pauses and resumes workspaces from a warm pool." },
  { id: "ws", label: "Agent workspaces", sub: "1 VM per task", icon: Box, zone: "exec", x: 116.5, y: 62, metric: "5 running", desc: "One isolated virtual machine per task; volume kept on pause." },
  { id: "gateway", label: "Model gateway", sub: "picks a model", icon: Cpu, zone: "inference", x: 145, y: 36, metric: "41k tok/m", desc: "Chooses a model per job and applies the model policy." },
  { id: "open", label: "Open models", sub: "served locally", icon: Server, zone: "inference", x: 145, y: 64, metric: "gpu 62%", desc: "Open models served on local GPU servers." },
  { id: "cloud", label: "Cloud models", sub: "blocked · air-gapped", icon: Cloud, zone: "inference", x: 145, y: 88, metric: "off", desc: "Connected installations only, where the policy allows.", locked: true },
];

export const gedges: GEdge[] = [
  { id: "e1", from: "engineers", to: "tickets", flow: "work", label: "new ticket" },
  { id: "e2", from: "engineers", to: "chat", flow: "work", label: "question" },
  { id: "e3", from: "reviewers", to: "code", flow: "feedback", label: "approve MR" },
  { id: "e4", from: "tickets", to: "bridge", flow: "work", label: "assigned to agent" },
  { id: "e5", from: "chat", to: "bridge", flow: "work", label: "message" },
  { id: "e6", from: "code", to: "bridge", flow: "feedback", label: "review event" },
  { id: "e7", from: "bridge", to: "orch", flow: "work", label: "start workflow" },
  { id: "e8", from: "orch", to: "policy", flow: "control", label: "check step" },
  { id: "e9", from: "orch", to: "creds", flow: "control", label: "request token" },
  { id: "e10", from: "orch", to: "wss", flow: "work", label: "allocate VM" },
  { id: "e11", from: "wss", to: "ws", flow: "work", label: "boot from pool" },
  { id: "e12", from: "creds", to: "ws", flow: "control", label: "scoped token" },
  { id: "e13", from: "ws", to: "gateway", flow: "model", label: "inference call" },
  { id: "e14", from: "policy", to: "gateway", flow: "control", label: "model policy" },
  { id: "e15", from: "gateway", to: "open", flow: "model", label: "route job" },
  { id: "e16", from: "gateway", to: "cloud", flow: "model", label: "blocked", blocked: true },
  { id: "e17", from: "ws", to: "obs", flow: "data", label: "run record" },
  { id: "e18", from: "orch", to: "obs", flow: "data", label: "checkpoint" },
  { id: "e19", from: "obs", to: "improve", flow: "data", label: "patterns" },
  { id: "e20", from: "improve", to: "bridge", flow: "feedback", label: "proposal" },
  { id: "e21", from: "bridge", to: "code", flow: "feedback", label: "open MR" },
  { id: "e22", from: "bridge", to: "chat", flow: "feedback", label: "notify" },
];

// A task walking through the system, edge by edge.
export const scenario: { edge: string; log: string }[] = [
  { edge: "e1", log: "Engineer filed TCK-1042 · fix auth retry" },
  { edge: "e4", log: "Ticket assigned to agent → Bridge" },
  { edge: "e7", log: "Orchestration started run-8812" },
  { edge: "e8", log: "Policy: class core · open models only · human merge" },
  { edge: "e9", log: "Credentials: token scope repo:write · ttl 90s" },
  { edge: "e10", log: "Workspace service allocating VM" },
  { edge: "e11", log: "node-a1 booted from warm pool · 4.2s" },
  { edge: "e12", log: "Scoped token injected (agent can't see it)" },
  { edge: "e13", log: "Agent calls model gateway · 4.1k tokens" },
  { edge: "e14", log: "Model policy applied" },
  { edge: "e15", log: "Routed to qwen-coder-32b on gpu-01" },
  { edge: "e16", log: "Cloud fallback denied · air-gapped" },
  { edge: "e17", log: "Run record: 214 tests passed" },
  { edge: "e21", log: "Bridge opened MR !324" },
  { edge: "e22", log: "Chat: 'MR ready for your review'" },
  { edge: "e3", log: "Reviewer approved MR !324" },
  { edge: "e6", log: "Approval event → Bridge → merge" },
  { edge: "e19", log: "Improvement loop: retry logic duplicated in 3 repos" },
  { edge: "e20", log: "Proposal sent as ticket via Bridge" },
];
