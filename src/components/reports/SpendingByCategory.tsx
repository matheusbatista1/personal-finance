import { formatBRL } from "@/lib/format";

export interface CategorySlice {
  categoryId: string | null;
  name: string;
  iconName: string | null;
  amountCents: number;
  shareCents: number;
}

interface Props {
  slices: CategorySlice[];
  totalCents: number;
}

const PALETTE = [
  "#8a2be2",
  "#d2bbff",
  "#ffb873",
  "#ffb4ab",
  "#7ad9b6",
  "#7eb8ff",
  "#ffd166",
  "#ef476f",
  "#06d6a0",
  "#c0c0ff",
];

function colorFor(index: number): string {
  return PALETTE[index % PALETTE.length] ?? "#8a2be2";
}

function polar(cx: number, cy: number, r: number, angle: number) {
  const rad = (angle - 90) * (Math.PI / 180);
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arcPath(
  cx: number,
  cy: number,
  rOuter: number,
  rInner: number,
  start: number,
  end: number,
) {
  const largeArc = end - start > 180 ? 1 : 0;
  const startOuter = polar(cx, cy, rOuter, start);
  const endOuter = polar(cx, cy, rOuter, end);
  const startInner = polar(cx, cy, rInner, end);
  const endInner = polar(cx, cy, rInner, start);
  return [
    `M ${startOuter.x} ${startOuter.y}`,
    `A ${rOuter} ${rOuter} 0 ${largeArc} 1 ${endOuter.x} ${endOuter.y}`,
    `L ${startInner.x} ${startInner.y}`,
    `A ${rInner} ${rInner} 0 ${largeArc} 0 ${endInner.x} ${endInner.y}`,
    "Z",
  ].join(" ");
}

export function SpendingByCategory({ slices, totalCents }: Props) {
  if (slices.length === 0 || totalCents === 0) {
    return (
      <section className="glass-panel p-md md:p-lg rounded-2xl">
        <header className="mb-md">
          <h3 className="text-headline-md text-on-surface font-sans font-semibold">
            Gastos por categoria
          </h3>
          <p className="text-label-sm text-on-surface-variant font-mono">
            Distribuição percentual no mês.
          </p>
        </header>
        <p className="text-body-md text-on-surface-variant font-sans">
          Nenhum gasto registrado neste período.
        </p>
      </section>
    );
  }

  const SIZE = 200;
  const CX = SIZE / 2;
  const CY = SIZE / 2;
  const R_OUTER = 90;
  const R_INNER = 60;

  let currentAngle = 0;
  const segments = slices.map((slice, idx) => {
    const ratio = slice.amountCents / totalCents;
    const angle = ratio * 360;
    const start = currentAngle;
    const end = currentAngle + angle;
    currentAngle = end;
    return {
      slice,
      idx,
      ratio,
      d: arcPath(CX, CY, R_OUTER, R_INNER, start, Math.max(end, start + 0.0001)),
      color: colorFor(idx),
    };
  });

  return (
    <section className="glass-panel p-md md:p-lg rounded-2xl">
      <header className="mb-md">
        <h3 className="text-headline-md text-on-surface font-sans font-semibold">
          Gastos por categoria
        </h3>
        <p className="text-label-sm text-on-surface-variant font-mono">
          Distribuição percentual no mês.
        </p>
      </header>

      <div className="gap-md flex flex-col md:flex-row md:items-center">
        <div className="flex justify-center md:flex-none">
          <svg
            viewBox={`0 0 ${SIZE} ${SIZE}`}
            width={200}
            height={200}
            role="img"
            aria-label="Distribuição percentual de gastos por categoria"
          >
            {segments.map(({ slice, d, color }) => (
              <path key={slice.categoryId ?? slice.name} d={d} fill={color} opacity={0.9} />
            ))}
            <text
              x={CX}
              y={CY - 6}
              textAnchor="middle"
              className="fill-on-surface-variant"
              style={{ fontSize: 10, fontFamily: "var(--font-mono)" }}
            >
              TOTAL
            </text>
            <text
              x={CX}
              y={CY + 12}
              textAnchor="middle"
              className="fill-on-surface"
              style={{ fontSize: 14, fontFamily: "var(--font-sans)", fontWeight: 600 }}
            >
              {formatBRL(totalCents)}
            </text>
          </svg>
        </div>

        <ul className="space-y-base flex-1">
          {segments.map(({ slice, ratio, color }) => (
            <li
              key={slice.categoryId ?? slice.name}
              className="border-outline-variant/10 pb-base flex items-center justify-between border-b last:border-0 last:pb-0"
            >
              <div className="gap-sm flex items-center">
                <span
                  aria-hidden
                  className="inline-block h-3 w-3 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <div>
                  <p className="text-body-md text-on-surface font-sans font-medium">{slice.name}</p>
                  <p className="text-label-sm text-on-surface-variant font-mono">
                    Sua parte: {formatBRL(slice.shareCents)}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-body-md text-on-surface font-sans font-semibold">
                  {formatBRL(slice.amountCents)}
                </p>
                <p className="text-label-sm text-on-surface-variant font-mono">
                  {(ratio * 100).toFixed(1)}%
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
