export function Sparkline({ data, className = "stroke-primary", height = 24 }: { data: number[]; className?: string; height?: number }) {
  if (data.length < 2) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * 100},${height - ((v - min) / (max - min || 1)) * (height - 2) - 1}`).join(" ");
  return (
    <svg viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" className="h-6 w-full">
      <polyline points={pts} fill="none" strokeWidth={1.5} vectorEffect="non-scaling-stroke" className={className} />
    </svg>
  );
}
