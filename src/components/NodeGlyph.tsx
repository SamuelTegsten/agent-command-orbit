// Bespoke animated glyphs — one per system component, showing what it does.
// Drawn in a 32×32 box with theme colours; `live` speeds up / brightens them.

type P = { live?: boolean; locked?: boolean };
const S = "stroke-current";
const sw = { strokeWidth: 1.4, fill: "none", strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

function People({ live, count = 3 }: P & { count?: number }) {
  return (
    <g {...sw} className={S}>
      {Array.from({ length: count }, (_, i) => {
        const x = 9 + i * 7;
        return (
          <g key={i} opacity={i === 1 ? 1 : 0.6}>
            <circle cx={x} cy={12} r={3.2} />
            <path d={`M${x - 5} 24 q5 -8 10 0`} />
            {live && i === 1 && <circle cx={x} cy={12} r={3.2} className="fill-current"><animate attributeName="opacity" values="1;0.2;1" dur="1.2s" repeatCount="indefinite" /></circle>}
          </g>
        );
      })}
    </g>
  );
}

function Reviewer({ live }: P) {
  return (
    <g {...sw} className={S}>
      <circle cx={12} cy={11} r={3.4} />
      <path d="M6 24 q6 -9 12 0" />
      <circle cx={23} cy={20} r={5} opacity={0.5} />
      <path d="M20.5 20 l2 2 l3.5 -4" strokeWidth={1.8}>
        {live && <animate attributeName="stroke-dasharray" values="0 12;12 0" dur="0.8s" repeatCount="indefinite" />}
      </path>
    </g>
  );
}

function Chat({ live }: P) {
  return (
    <g {...sw} className={S}>
      <path d="M5 8 h18 a2 2 0 0 1 2 2 v8 a2 2 0 0 1 -2 2 h-11 l-5 4 v-4 h-2 a2 2 0 0 1 -2 -2 v-8 a2 2 0 0 1 2 -2 z" />
      {[10, 14, 18].map((x, i) => (
        <circle key={x} cx={x} cy={14} r={1.2} className="fill-current" stroke="none">
          <animate attributeName="opacity" values="0.2;1;0.2" dur={live ? "0.6s" : "1.4s"} begin={`${i * 0.2}s`} repeatCount="indefinite" />
        </circle>
      ))}
      <path d="M22 26 h6 v-6" opacity={0.4} />
    </g>
  );
}

function Tickets({ live }: P) {
  return (
    <g {...sw} className={S}>
      {[0, 1, 2].map((i) => (
        <rect key={i} x={6 + i * 2} y={7 + i * 4} width={18} height={9} rx={1} opacity={0.35 + i * 0.3} className={i === 2 ? "fill-background" : ""}>
          {i === 2 && live && <animate attributeName="y" values="15;13;15" dur="0.8s" repeatCount="indefinite" />}
        </rect>
      ))}
      <path d="M13 19.5 h8 M13 22 h5" />
    </g>
  );
}

function Code({ live }: P) {
  return (
    <g {...sw} className={S}>
      <path d="M8 5 v22" />
      <path d="M8 11 q0 6 10 6 h6" />
      <circle cx={8} cy={6} r={2} className="fill-background" />
      <circle cx={8} cy={26} r={2} className="fill-background" />
      <circle cx={24} cy={17} r={2.4} className="fill-current">
        {live && <animate attributeName="r" values="2.4;3.4;2.4" dur="0.9s" repeatCount="indefinite" />}
      </circle>
    </g>
  );
}

function Bridge({ live }: P) {
  return (
    <g {...sw} className={S}>
      <circle cx={16} cy={16} r={2.2} className="fill-current" />
      {[5, 9].map((r, i) => (
        <g key={r}>
          <path d={`M${16 - r} ${16 - r * 0.7} a${r} ${r} 0 0 0 0 ${r * 1.4}`} opacity={0.8 - i * 0.3} />
          <path d={`M${16 + r} ${16 - r * 0.7} a${r} ${r} 0 0 1 0 ${r * 1.4}`} opacity={0.8 - i * 0.3} />
        </g>
      ))}
      <circle cx={16} cy={16} r={4} opacity={0.6}>
        <animate attributeName="r" values="3;13" dur={live ? "0.9s" : "2.4s"} repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.7;0" dur={live ? "0.9s" : "2.4s"} repeatCount="indefinite" />
      </circle>
    </g>
  );
}

function Orchestration({ live }: P) {
  return (
    <g {...sw} className={S}>
      <circle cx={16} cy={16} r={10} opacity={0.3} />
      <circle cx={16} cy={16} r={10} strokeDasharray="10 52.8" strokeWidth={2.4}>
        <animateTransform attributeName="transform" type="rotate" from="0 16 16" to="360 16 16" dur={live ? "1.2s" : "4s"} repeatCount="indefinite" />
      </circle>
      {[0, 72, 144, 216, 288].map((a) => {
        const r = (a * Math.PI) / 180;
        return <circle key={a} cx={16 + Math.cos(r) * 10} cy={16 + Math.sin(r) * 10} r={1.4} className="fill-background" />;
      })}
      <path d="M13 12 l6 4 l-6 4 z" className="fill-current" stroke="none" />
    </g>
  );
}

function Policy({ live }: P) {
  return (
    <g {...sw} className={S}>
      <path d="M16 4 l9 3.5 v7 c0 6 -4 10 -9 12.5 c-5 -2.5 -9 -6.5 -9 -12.5 v-7 z" />
      <path d="M12 15.5 l3 3 l5.5 -6" strokeWidth={1.8} />
      <line x1={8} x2={24} y1={8} y2={8} opacity={0.6}>
        <animate attributeName="y1" values="7;25;7" dur={live ? "1s" : "3s"} repeatCount="indefinite" />
        <animate attributeName="y2" values="7;25;7" dur={live ? "1s" : "3s"} repeatCount="indefinite" />
      </line>
    </g>
  );
}

function Credentials({ live }: P) {
  return (
    <g {...sw} className={S}>
      <circle cx={10} cy={16} r={5} />
      <circle cx={10} cy={16} r={1.6} className="fill-current" />
      <path d="M15 16 h12 M22 16 v4 M26 16 v3" />
      <circle cx={10} cy={16} r={8} opacity={0.5} strokeDasharray="50.3" strokeDashoffset="0" transform="rotate(-90 10 16)">
        <animate attributeName="stroke-dashoffset" values="0;50.3" dur={live ? "1.5s" : "6s"} repeatCount="indefinite" />
      </circle>
    </g>
  );
}

function Observability({ live }: P) {
  return (
    <g {...sw} className={S}>
      <circle cx={16} cy={16} r={11} opacity={0.35} />
      <circle cx={16} cy={16} r={6} opacity={0.35} />
      <path d="M16 16 L16 5" strokeWidth={1.8}>
        <animateTransform attributeName="transform" type="rotate" from="0 16 16" to="360 16 16" dur={live ? "1s" : "3s"} repeatCount="indefinite" />
      </path>
      <circle cx={21} cy={11} r={1.3} className="fill-current"><animate attributeName="opacity" values="0;1;0" dur="1.5s" repeatCount="indefinite" /></circle>
      <circle cx={11} cy={20} r={1.1} className="fill-current"><animate attributeName="opacity" values="0;1;0" dur="1.5s" begin="0.7s" repeatCount="indefinite" /></circle>
    </g>
  );
}

function Improve({ live }: P) {
  return (
    <g {...sw} className={S}>
      <g>
        <path d="M7 16 a9 9 0 0 1 15.5 -6.2" />
        <path d="M22.5 5 v5 h-5" />
        <path d="M25 16 a9 9 0 0 1 -15.5 6.2" />
        <path d="M9.5 27 v-5 h5" />
        <animateTransform attributeName="transform" type="rotate" from="0 16 16" to="360 16 16" dur={live ? "1.4s" : "6s"} repeatCount="indefinite" />
      </g>
      <circle cx={16} cy={16} r={2} className="fill-current" />
    </g>
  );
}

function Pool({ live }: P) {
  return (
    <g {...sw} className={S}>
      {[6, 14, 22].map((x, i) => (
        <g key={x}>
          <ellipse cx={x + 2} cy={9} rx={3.5} ry={1.4} />
          <path d={`M${x - 1.5} 9 v13 a3.5 1.4 0 0 0 7 0 v-13`} />
          <rect x={x - 0.5} y={13} width={5} height={8} className="fill-current" stroke="none" opacity={0.5}>
            <animate attributeName="height" values="8;3;8" dur={live ? "0.9s" : "2.6s"} begin={`${i * 0.3}s`} repeatCount="indefinite" />
          </rect>
        </g>
      ))}
    </g>
  );
}

function Workspaces({ live }: P) {
  return (
    <g {...sw} className={S}>
      {[0, 1, 2, 3].map((i) => {
        const x = 6 + (i % 2) * 11, y = 6 + Math.floor(i / 2) * 11;
        return (
          <g key={i}>
            <rect x={x} y={y} width={9} height={9} rx={1} opacity={0.6} />
            <rect x={x + 2} y={y + 2} width={5} height={5} className="fill-current" stroke="none">
              <animate attributeName="opacity" values="1;0.15;1" dur={live ? "0.7s" : "2s"} begin={`${i * 0.35}s`} repeatCount="indefinite" />
            </rect>
          </g>
        );
      })}
    </g>
  );
}

function Gateway({ live }: P) {
  return (
    <g {...sw} className={S}>
      <path d="M4 16 h8" />
      <rect x={12} y={11} width={8} height={10} rx={1} />
      <path d="M20 14 l4 -6 h4 M20 18 l4 6 h4" opacity={0.7} />
      <circle r={1.3} className="fill-current" stroke="none">
        <animateMotion dur={live ? "0.8s" : "2s"} repeatCount="indefinite" path="M4 16 h12 l8 -8 h4" />
      </circle>
    </g>
  );
}

function Gpu({ live }: P) {
  return (
    <g className="fill-current">
      <rect x={4} y={6} width={24} height={20} rx={1.5} className={S} fill="none" strokeWidth={1.4} opacity={0.5} />
      {[7, 11, 15, 19, 23].map((x, i) => (
        <rect key={x} x={x} y={10} width={2.4} height={12}>
          <animate attributeName="height" values="12;4;10;6;12" dur={live ? "0.7s" : "1.6s"} begin={`${i * 0.15}s`} repeatCount="indefinite" />
          <animate attributeName="y" values="10;18;12;16;10" dur={live ? "0.7s" : "1.6s"} begin={`${i * 0.15}s`} repeatCount="indefinite" />
        </rect>
      ))}
    </g>
  );
}

function CloudOff() {
  return (
    <g {...sw} className={S}>
      <path d="M9 23 a5 5 0 0 1 0.5 -10 a7 7 0 0 1 13.5 1.5 a4.5 4.5 0 0 1 0 8.5 z" opacity={0.6} />
      <path d="M6 6 L26 26" strokeWidth={1.8} />
    </g>
  );
}

const map: Record<string, (p: P) => React.ReactElement> = {
  engineers: (p) => <People {...p} />, reviewers: Reviewer, chat: Chat, tickets: Tickets, code: Code,
  bridge: Bridge, orch: Orchestration, policy: Policy, creds: Credentials, obs: Observability, improve: Improve,
  wss: Pool, ws: Workspaces, gateway: Gateway, open: Gpu, cloud: CloudOff,
};

export function NodeGlyph({ id, live, locked, className = "" }: { id: string; live?: boolean; locked?: boolean | undefined; className?: string }) {
  const G = map[id] ?? Orchestration;
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <G live={live} locked={locked} />
    </svg>
  );
}
