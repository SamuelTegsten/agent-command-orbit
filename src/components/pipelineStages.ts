import { Inbox, ShieldCheck, KeyRound, Cpu, Box, Radio, Workflow, TestTube2, Eye, UserCheck, GitMerge, Ticket } from "lucide-react";
import type { Stage } from "./InternalsPipeline";

export const hubStages: Stage[] = [
  { id: "intake", label: "Intake", detail: "client → bridge", icon: Inbox, log: "Request received from magnus-ws via Bridge" },
  { id: "orch", label: "Orchestrate", detail: "durable workflow", icon: Workflow, log: "Workflow started · checkpoint #0 saved" },
  { id: "policy", label: "Policy", detail: "rules per repo", icon: ShieldCheck, log: "Policy ok · class core · open models only" },
  { id: "cred", label: "Credentials", detail: "token per call", icon: KeyRound, log: "Short-lived token issued · ttl 90s · hidden from agent" },
  { id: "gateway", label: "Model gateway", detail: "pick model", icon: Cpu, log: "Gateway routed job → qwen-coder-32b on gpu-01" },
  { id: "dispatch", label: "Dispatch", detail: "warm pool VM", icon: Box, log: "Workspace node-a1 started from warm pool" },
  { id: "report", label: "Report back", detail: "bridge writes", icon: Radio, log: "Bridge posted status to ticket TCK-1042" },
];

export const lifecycleStages: Stage[] = [
  { id: "ticket", label: "Ticket", detail: "work enters", icon: Ticket, log: "TCK-1042 assigned to agent" },
  { id: "plan", label: "Plan", detail: "agent plans", icon: Workflow, log: "Plan drafted · 4 steps" },
  { id: "ws", label: "Workspace", detail: "isolated VM", icon: Box, log: "VM booted · repo cloned · 4.2s" },
  { id: "code", label: "Code", detail: "model calls", icon: Cpu, log: "12 model calls · 41k tokens" },
  { id: "verify", label: "Verify", detail: "tests + CI", icon: TestTube2, log: "214 tests passed · CI green" },
  { id: "review", label: "Agent review", detail: "second agent", icon: Eye, log: "Reviewer agent score 0.91 · 1 note" },
  { id: "gate", label: "Human gate", detail: "policy decides", icon: UserCheck, log: "Waiting for human approval" },
  { id: "merge", label: "Merge", detail: "via bridge", icon: GitMerge, log: "Merged !324 · ticket closed" },
];
