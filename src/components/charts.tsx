/**
 * Dependency-free SVG charts. Colours come from the brand ramp so the panel
 * reads as one system; swap for Recharts if richer interaction is ever needed.
 */

/**
 * Pick round axis values. Application counts are small integers, so a scale of
 * 0/1.5/3/4.5 would be nonsense — the step is forced to a whole number until
 * the range is large enough for 2s, 5s and 10s to read naturally.
 */
function niceScale(max: number): { top: number; step: number } {
  if (max <= 4) return { top: Math.max(max, 1), step: 1 };
  const rough = max / 4;
  const magnitude = 10 ** Math.floor(Math.log10(rough));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * magnitude).find((candidate) => candidate >= rough) ?? magnitude * 10;
  return { top: Math.ceil(max / step) * step, step };
}

export function AreaChart({
  points,
  height = 210,
  label,
  valueLabel = 'Applications',
}: {
  /** One entry per bucket, in order. `label` is the x-axis value (a date). */
  points: { label: string; value: number }[];
  height?: number;
  label?: string;
  /** What the y axis counts — named on the axis and in each tooltip. */
  valueLabel?: string;
}) {
  const w = 640;
  const h = height;
  // Gutters for the axis labels. Without them the plot would sit under its own
  // numbers, which is why the chart previously had no room for any.
  const left = 34;
  const right = 10;
  const top = 12;
  const bottom = 26;

  // A quiet period is a flat line along the bottom, not a divide-by-zero: with
  // no data, or every day at zero, the scale would otherwise be 0/Infinity and
  // every coordinate would come out NaN.
  const series = points.length > 1 ? points : [...points, { label: '', value: 0 }];
  const { top: scaleTop, step } = niceScale(Math.max(...series.map((p) => p.value), 0));

  const plotW = w - left - right;
  const plotH = h - top - bottom;
  const stepX = plotW / (series.length - 1);
  const x = (i: number) => left + i * stepX;
  const y = (value: number) => top + plotH - (value / scaleTop) * plotH;

  const coords = series.map((point, i) => [x(i), y(point.value)] as const);
  const line = coords.map(([cx, cy], i) => `${i === 0 ? 'M' : 'L'}${cx.toFixed(1)},${cy.toFixed(1)}`).join(' ');
  const area = `${line} L${x(series.length - 1)},${top + plotH} L${left},${top + plotH} Z`;
  const last = coords[coords.length - 1];

  const ticks: number[] = [];
  for (let value = 0; value <= scaleTop + 1e-9; value += step) ticks.push(Number(value.toFixed(2)));

  /** Day-month, so a 30-point axis stays readable. */
  const shortDate = (value: string) =>
    value ? new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '';

  // Roughly six labels, whatever the series length — 30 dates would collide.
  const labelEvery = Math.max(1, Math.ceil(series.length / 6));

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

        {/* y axis: a gridline and a number for every tick */}
        {ticks.map((tick) => (
          <g key={tick}>
            <line x1={left} x2={w - right} y1={y(tick)} y2={y(tick)} stroke="#eeeef3" strokeWidth="1" />
            <text
              x={left - 7}
              y={y(tick)}
              textAnchor="end"
              dominantBaseline="middle"
              fontSize="10"
              fill="#9797ab"
              className="tabular-nums"
            >
              {tick}
            </text>
          </g>
        ))}

        <path d={area} fill="url(#areaFill)" />
        <path d={line} fill="none" stroke="url(#areaLine)" strokeWidth="2.5" strokeLinecap="round" />

        {/* x axis: a date every few buckets, so 30 days do not overlap */}
        {series.map((point, i) =>
          i % labelEvery === 0 || i === series.length - 1 ? (
            <text
              key={`${point.label}-${i}`}
              x={x(i)}
              y={h - 8}
              textAnchor={i === 0 ? 'start' : i === series.length - 1 ? 'end' : 'middle'}
              fontSize="10"
              fill="#9797ab"
            >
              {shortDate(point.label)}
            </text>
          ) : null,
        )}

        {/* A dot on every day that had activity, so single spikes are readable */}
        {series.map((point, i) =>
          point.value > 0 ? <circle key={`dot-${i}`} cx={x(i)} cy={y(point.value)} r="2.5" fill="#b94a9c" /> : null,
        )}
        <circle cx={last[0]} cy={last[1]} r="4" fill="#b94a9c" stroke="#fff" strokeWidth="2" />

        {/*
          Hover targets. A full-height transparent band per bucket with a <title>
          gives a native tooltip on every point — including the zero days, which
          have no dot to aim at — and needs no client-side JavaScript.
        */}
        {series.map((point, i) => (
          <rect
            key={`hit-${i}`}
            x={x(i) - stepX / 2}
            y={top}
            width={stepX}
            height={plotH}
            fill="transparent"
          >
            <title>{`${shortDate(point.label)}: ${point.value} ${valueLabel.toLowerCase()}`}</title>
          </rect>
        ))}
      </svg>

      <figcaption className="mt-2 flex items-center justify-between text-[13px] text-ink-400">
        <span>{valueLabel} per day</span>
        <span>Hover a day for its exact count</span>
      </figcaption>
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
