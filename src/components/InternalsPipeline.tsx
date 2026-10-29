import { useEffect, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { SectionLabel } from "@/components/AppShell";

export type Stage = { id: string; label: string; detail: string; icon: LucideIcon; log: string };

// Animated "life of a request" through internal stages. Purely visual.
export function InternalsPipeline({ title, subtitle, stages, speed = 1100 }: { title: string; subtitle: string; stages: Stage[]; speed?: number }) {
  const [step, setStep] = useState(-1);
  const [runId, setRunId] = useState(8812);
  const [log, setLog] = useState<string[]>([]);

  useEffect(() => {
    const id = setInterval(() => {
      setStep((s) => {
        const next = s + 1 >= stages.length + 1 ? -1 : s + 1;
        if (next === -1) setRunId((r) => r + 1);
        return next;
      });
    }, speed);
    return () => clearInterval(id);
  }, [stages.length, speed]);

  useEffect(() => {
    if (step < 0) return setLog([]);
    const st = stages[step];
    if (st) setLog((l) => [...l, st.log].slice(-5));
  }, [step, stages]);

  const progress = step < 0 ? 0 : Math.min(1, (step + 0.5) / stages.length);

  return (
    <div className="panel overflow-hidden p-5">
      <div className="flex items-end justify-between gap-4">
        <div>
          <SectionLabel>{subtitle}</SectionLabel>
          <h2 className="mt-1 text-lg font-semibold">{title}</h2>
        </div>
        <span className="font-mono text-[11px] text-muted-foreground">
          run-{runId} · {step < 0 ? "queued" : step >= stages.length ? "complete" : stages[step]?.label}
        </span>
      </div>

      <div className="relative mt-6">
        {/* rail */}
        <div className="absolute left-[5%] right-[5%] top-7 h-0.5 bg-border" />
        <div className="absolute left-[5%] top-7 h-0.5 bg-primary transition-all duration-700 ease-out" style={{ width: `${progress * 90}%` }} />
        {/* token */}
        <div
          className="absolute top-7 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rotate-45 bg-primary glow-primary transition-all duration-700 ease-out"
          style={{ left: `${5 + progress * 90}%`, opacity: step < 0 || step >= stages.length ? 0 : 1 }}
        />

        <div className="relative grid" style={{ gridTemplateColumns: `repeat(${stages.length}, minmax(0, 1fr))` }}>
          {stages.map((s, i) => {
            const state = i < step ? "done" : i === step ? "active" : "idle";
            const Icon = s.icon;
            return (
              <div key={s.id} className="flex flex-col items-center px-1 text-center">
                <div
                  className={`hex relative grid h-14 w-16 place-items-center transition-all duration-500 ${
                    state === "active" ? "bg-primary text-primary-foreground scale-110" : state === "done" ? "bg-accent/80 text-accent-foreground" : "bg-secondary text-muted-foreground"
                  }`}
                >
                  <Icon className={`h-5 w-5 ${state === "active" ? "spin-slow" : ""}`} />
                </div>
                <div className={`mt-2 text-xs font-medium ${state === "idle" ? "text-muted-foreground" : "text-foreground"}`}>{s.label}</div>
                <div className="mt-0.5 hidden font-mono text-[9px] leading-tight text-muted-foreground md:block">{s.detail}</div>
                {/* internal activity meter */}
                <div className="mt-2 flex h-4 items-end gap-0.5">
                  {[0, 1, 2, 3, 4].map((b) => (
                    <span
                      key={b}
                      className={`w-1 rounded-sm ${state === "active" ? "bg-primary eq" : state === "done" ? "bg-accent/60" : "bg-border"}`}
                      style={{ height: state === "idle" ? "20%" : state === "done" ? "45%" : "100%", animationDelay: `${b * 0.12}s` }}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-5 h-[92px] overflow-hidden rounded-sm border border-border bg-background/50 p-2.5 font-mono text-[11px]">
        {log.length === 0 && <div className="text-muted-foreground">› waiting for next request…</div>}
        {log.map((l, i) => (
          <div key={`${runId}-${i}`} className={`fade-in ${i === log.length - 1 ? "text-primary" : "text-muted-foreground"}`}>
            › {l}
          </div>
        ))}
      </div>
    </div>
  );
}
