// Live-feeling mock vitals for the topbar — swap for real backend streams later.
import { useEffect, useRef, useState } from "react";
import { eventTemplates, topoNodes } from "@/lib/mock";

export type PulseEvent = { id: number; time: string; source: string; text: string; tone: "ok" | "warn" | "info" };

export type Pulse = {
  clock: string;
  uptime: string;
  activeRuns: number;
  queue: number;
  latencyMs: number;
  tokPerMin: number;
  nodesBusy: number;
  nodesTotal: number;
  events: PulseEvent[];
};

const START = Date.now() - 1000 * 60 * 60 * 26 - 1000 * 60 * 14; // ~26h14m uptime
let nextId = 1;

function stamp(d: Date) {
  return d.toISOString().slice(11, 19);
}

function makeEvent(): PulseEvent {
  const [source, text] = eventTemplates[Math.floor(Math.random() * eventTemplates.length)]!;
  const tone: PulseEvent["tone"] = /denied|blocked/i.test(text) ? "warn" : /allowed|saved|issued|replenished/i.test(text) ? "ok" : "info";
  return { id: nextId++, time: stamp(new Date()), source, text, tone };
}

const seed: PulseEvent[] = Array.from({ length: 8 }, () => makeEvent()).map((e, i) => ({
  ...e,
  time: stamp(new Date(Date.now() - (8 - i) * 2400)),
}));

export function useSystemPulse(): Pulse {
  const [tick, setTick] = useState(0);
  const eventsRef = useRef<PulseEvent[]>(seed);
  const vitalsRef = useRef({ activeRuns: 4, queue: 2, latencyMs: 214, tokPerMin: 41.2 });

  useEffect(() => {
    const id = setInterval(() => {
      const v = vitalsRef.current;
      const walk = (x: number, lo: number, hi: number, step: number) =>
        Math.min(hi, Math.max(lo, x + (Math.random() - 0.5) * step));
      v.activeRuns = Math.round(walk(v.activeRuns, 2, 6, 1.4));
      v.queue = Math.round(walk(v.queue, 0, 7, 1.6));
      v.latencyMs = Math.round(walk(v.latencyMs, 160, 340, 40));
      v.tokPerMin = Math.round(walk(v.tokPerMin, 34, 48, 3) * 10) / 10;
      if (Math.random() < 0.45) {
        eventsRef.current = [...eventsRef.current.slice(-11), makeEvent()];
      }
      setTick((t) => t + 1);
    }, 1000);
    return () => clearInterval(id);
  }, []);

  void tick;
  const now = new Date();
  const up = Date.now() - START;
  const upH = Math.floor(up / 3_600_000);
  const upM = Math.floor((up % 3_600_000) / 60_000);

  return {
    clock: stamp(now) + " UTC",
    uptime: `${upH}h ${String(upM).padStart(2, "0")}m`,
    ...vitalsRef.current,
    nodesBusy: topoNodes.filter((n) => n.status === "busy").length,
    nodesTotal: topoNodes.length,
    events: eventsRef.current,
  };
}
