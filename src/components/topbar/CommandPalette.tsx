import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ArrowRight, CornerDownLeft, Monitor, Search, Workflow } from "lucide-react";
import { gnodes } from "@/lib/systemGraph";

type Item = { id: string; group: string; label: string; hint: string; to: string };

const pages: Item[] = [
  { id: "p-monitor", group: "Pages", label: "Monitor — system map & topology", hint: "01", to: "/" },
  { id: "p-factory", group: "Pages", label: "Factory — work with the system", hint: "02", to: "/factory" },
];

const components: Item[] = gnodes.map((n) => ({
  id: `c-${n.id}`,
  group: "System components",
  label: n.label,
  hint: n.zone,
  to: "/",
}));

const all = [...pages, ...components];

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [q, setQ] = useState("");
  const [idx, setIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return all;
    return all.filter((i) => `${i.label} ${i.hint} ${i.group}`.toLowerCase().includes(s));
  }, [q]);

  useEffect(() => {
    if (open) {
      setQ("");
      setIdx(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  useEffect(() => setIdx(0), [q]);

  if (!open) return null;

  const go = (item: Item | undefined) => {
    if (!item) return;
    onClose();
    navigate({ to: item.to });
  };

  let lastGroup = "";

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[14vh]" onMouseDown={onClose}>
      <div className="absolute inset-0 bg-background/70 backdrop-blur-sm" />
      <div
        className="panel fade-in relative w-[min(560px,92vw)] overflow-hidden shadow-2xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-border px-4 py-3">
          <Search className="h-4 w-4 text-primary" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") { e.preventDefault(); setIdx((i) => Math.min(i + 1, results.length - 1)); }
              if (e.key === "ArrowUp") { e.preventDefault(); setIdx((i) => Math.max(i - 1, 0)); }
              if (e.key === "Enter") go(results[idx]);
              if (e.key === "Escape") onClose();
            }}
            placeholder="Jump to a page or component…"
            className="w-full bg-transparent font-mono text-sm text-foreground outline-none placeholder:text-muted-foreground/60"
          />
          <kbd className="rounded border border-border bg-secondary/60 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">esc</kbd>
        </div>
        <div className="max-h-[46vh] overflow-y-auto p-1.5">
          {results.length === 0 && (
            <div className="px-3 py-6 text-center font-mono text-xs text-muted-foreground">No matches for “{q}”</div>
          )}
          {results.map((item, i) => {
            const header = item.group !== lastGroup ? item.group : null;
            lastGroup = item.group;
            return (
              <div key={item.id}>
                {header && (
                  <div className="px-3 pb-1 pt-2.5 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70">
                    {header}
                  </div>
                )}
                <button
                  onMouseEnter={() => setIdx(i)}
                  onClick={() => go(item)}
                  className={`flex w-full items-center gap-3 rounded-sm px-3 py-2 text-left text-sm transition-colors ${
                    i === idx ? "bg-primary/10 text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {item.group === "Pages" ? (
                    item.to === "/" ? <Monitor className="h-3.5 w-3.5 text-primary" /> : <Workflow className="h-3.5 w-3.5 text-primary" />
                  ) : (
                    <span className="hex h-2.5 w-3 bg-primary/70" />
                  )}
                  <span className="flex-1 truncate">{item.label}</span>
                  <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground/60">{item.hint}</span>
                  {i === idx ? <CornerDownLeft className="h-3.5 w-3.5 text-primary" /> : <ArrowRight className="h-3.5 w-3.5 opacity-0" />}
                </button>
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-4 border-t border-border px-4 py-2 font-mono text-[10px] text-muted-foreground/70">
          <span>↑↓ move</span>
          <span>↵ open</span>
          <span className="ml-auto">{results.length} results</span>
        </div>
      </div>
    </div>
  );
}
