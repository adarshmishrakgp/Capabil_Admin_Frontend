/**
 * Dependency-free SVG charts. Colours come from the brand ramp so the panel
 * reads as one system; swap for Recharts if richer interaction is ever needed.
 */

export function AreaChart({
  data,
  height = 180,
  label,
}: {
  data: number[];
  height?: number;
  label?: string;
}) {
  const w = 600;
  const h = height;
  const pad = 8;
  const max = Math.max(...data) * 1.15;
  const step = (w - pad * 2) / (data.length - 1);
  const points = data.map((v, i) => [pad + i * step, h - pad - (v / max) * (h - pad * 2)] as const);
  const line = points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const area = `${line} L${w - pad},${h - pad} L${pad},${h - pad} Z`;
  const last = points[points.length - 1];

  return (
    <figure>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full" role="img" aria-label={label ?? 'Trend chart'}>
        <defs>
          <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6d4ac8" stopOpacity="0.26" />
            <stop offset="100%" stopColor="#b94a9c" stopOpacity="0.02" />
          </linearGradient>
          <linearGradient id="areaLine" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#6d4ac8" />
            <stop offset="100%" stopColor="#b94a9c" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((f) => (
          <line key={f} x1={pad} x2={w - pad} y1={h * f} y2={h * f} stroke="#eeeef3" strokeWidth="1" />
        ))}
        <path d={area} fill="url(#areaFill)" />
        <path d={line} fill="none" stroke="url(#areaLine)" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx={last[0]} cy={last[1]} r="4" fill="#b94a9c" stroke="#fff" strokeWidth="2" />
      </svg>
    </figure>
  );
}

export function BarList({
  items,
  suffix = '',
}: {
  items: { label: string; value: number }[];
  suffix?: string;
}) {
  const max = Math.max(...items.map((i) => i.value), 1);
  return (
    <ul className="space-y-3.5">
      {items.map((item) => (
        <li key={item.label}>
          <div className="mb-1.5 flex items-center justify-between text-[15px]">
            <span className="truncate pr-3 text-ink-700">{item.label}</span>
            <span className="font-medium tabular-nums text-ink-900">
              {item.value}
              {suffix}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-ink-100">
            <div
              className="h-full rounded-full bg-brand-600"
              style={{ width: `${Math.max((item.value / max) * 100, 4)}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function Funnel({ stages }: { stages: { stage: string; count: number }[] }) {
  const max = Math.max(...stages.map((s) => s.count), 1);
  return (
    <ol className="space-y-2">
      {stages.map((s, i) => {
        const pct = (s.count / max) * 100;
        return (
          <li key={s.stage} className="flex items-center gap-3">
            <span className="w-28 shrink-0 text-[13px] font-medium text-ink-600">{s.stage}</span>
            <div className="h-8 flex-1 overflow-hidden rounded-lg bg-ink-100">
              <div
                className="flex h-full items-center justify-end rounded-lg pr-2.5 text-xs font-semibold text-white"
                style={{
                  width: `${Math.max(pct, 8)}%`,
                  background: '#6d4ac8',
                }}
              >
                {s.count}
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
