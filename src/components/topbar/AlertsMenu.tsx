import { useEffect, useRef, useState } from "react";
import { Bell, CheckCheck } from "lucide-react";
import type { PulseEvent } from "./useSystemPulse";

const toneDot: Record<PulseEvent["tone"], string> = {
  ok: "bg-success",
  warn: "bg-accent",
  info: "bg-primary",
};

export function AlertsMenu({ events }: { events: PulseEvent[] }) {
  const [open, setOpen] = useState(false);
  const [seenId, setSeenId] = useState(() => events[events.length - 1]?.id ?? 0);
  const ref = useRef<HTMLDivElement>(null);

  const unread = events.filter((e) => e.id > seenId).length;

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="System alerts"
        className={`relative grid h-8 w-8 place-items-center rounded-sm border transition-colors ${
          open ? "border-primary/50 bg-primary/10 text-primary" : "border-border bg-secondary/40 text-muted-foreground hover:text-foreground"
        }`}
      >
        <Bell className="h-3.5 w-3.5" />
        {unread > 0 && (
          <span className="absolute -right-1.5 -top-1.5 grid h-4 min-w-4 place-items-center rounded-sm bg-primary px-1 font-mono text-[9px] font-bold text-primary-foreground">
            {unread}
          </span>
        )}
      </button>
      {open && (
        <div className="panel fade-in absolute right-0 top-10 w-[340px] overflow-hidden shadow-2xl">
          <div className="flex items-center justify-between border-b border-border px-3.5 py-2.5">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">System events</span>
            <button
              onClick={() => setSeenId(events[events.length - 1]?.id ?? 0)}
              className="flex items-center gap-1.5 font-mono text-[10px] text-muted-foreground transition-colors hover:text-primary"
            >
              <CheckCheck className="h-3 w-3" /> mark read
            </button>
          </div>
          <div className="max-h-[320px] overflow-y-auto">
            {[...events].reverse().map((e) => (
              <div
                key={e.id}
                className={`flex items-start gap-2.5 border-b border-border/50 px-3.5 py-2.5 last:border-0 ${
                  e.id > seenId ? "bg-primary/5" : ""
                }`}
              >
                <span className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${toneDot[e.tone]}`} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-xs text-foreground">{e.text}</div>
                  <div className="font-mono text-[10px] text-muted-foreground/70">
                    {e.source} · {e.time}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
