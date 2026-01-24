import { useMemo, useRef, useState } from "react";
import type { PointerEvent } from "react";

type Point = {
  label: string;
  value: number;
  bench?: number;
};

type Props = {
  title?: string;
  subtitle?: string;
  showTabs?: boolean;
  data?: Point[];
  benchmark?: Point[];
};

const defaultData: Point[] = [
  { label: "Pzt", value: 114, bench: 108 },
  { label: "Sal", value: 122, bench: 112 },
  { label: "Car", value: 118, bench: 115 },
  { label: "Per", value: 132, bench: 120 },
  { label: "Cum", value: 128, bench: 122 },
  { label: "Cmt", value: 140, bench: 126 },
  { label: "Paz", value: 148, bench: 130 }
];

export default function PerformanceChart({
  title = "Haftalik performans",
  subtitle = "Son 7 gun ozet",
  showTabs = true,
  data = defaultData,
  benchmark
}: Props) {
  const [activeIndex, setActiveIndex] = useState(data.length - 1);
  const frameRef = useRef<HTMLDivElement | null>(null);

  const { pathPrimary, pathBench, points, minValue, maxValue, hasBenchmark } =
    useMemo(() => {
      const width = 320;
    const height = 140;
    const paddingX = 10;
    const paddingY = 10;
    const hasBench = Boolean(benchmark && benchmark.length);
    const merged = data.map((item, index) => ({
      label: item.label,
      value: item.value,
      bench: hasBench ? benchmark?.[index]?.value : undefined
    }));
    const values = merged.flatMap((item) =>
      item.bench !== undefined ? [item.value, item.bench] : [item.value]
    );
    const min = Math.min(...values) - 4;
    const max = Math.max(...values) + 4;
    const scaleY = (value: number) =>
      height - paddingY - ((value - min) / (max - min)) * (height - paddingY * 2);
    const stepX =
      data.length > 1 ? (width - paddingX * 2) / (data.length - 1) : 0;

    const buildPath = (key: "value" | "bench") =>
      merged
        .map((item, index) => {
          const x = paddingX + index * stepX;
          const target = key === "value" ? item.value : item.bench ?? item.value;
          const y = scaleY(target);
          return `${index === 0 ? "M" : "L"}${x} ${y}`;
        })
        .join(" ");

    const pointsLocal = merged.map((item, index) => ({
      x: paddingX + index * stepX,
      y: scaleY(item.value),
      benchY: item.bench !== undefined ? scaleY(item.bench) : undefined,
      label: item.label,
      value: item.value,
      bench: item.bench
    }));

    return {
      pathPrimary: buildPath("value"),
      pathBench: hasBench ? buildPath("bench") : "",
      points: pointsLocal,
      minValue: min,
      maxValue: max,
      hasBenchmark: hasBench
    };
  }, [data, benchmark]);

  const activePoint = points[activeIndex] ?? points[points.length - 1];

  const handlePointer = (event: PointerEvent<HTMLDivElement>) => {
    if (!frameRef.current) {
      return;
    }
    const bounds = frameRef.current.getBoundingClientRect();
    const x = event.clientX - bounds.left;
    const ratio = Math.min(Math.max(x / bounds.width, 0), 1);
    const index = Math.round(ratio * (points.length - 1));
    setActiveIndex(index);
  };

  return (
    <div className="chart">
      <div className="chart__title">
        <div>
          <p className="eyebrow">Grafik</p>
          <h3>{title}</h3>
          <p className="muted">{subtitle}</p>
        </div>
        <button className="chip">Akilli filtre</button>
      </div>
      <div className="chart__legend">
        <span className="legend legend--primary">Portfoy</span>
        {hasBenchmark ? (
          <span className="legend legend--accent">BIST 100</span>
        ) : null}
      </div>
      <div
        className="chart__frame"
        ref={frameRef}
        onPointerMove={handlePointer}
        onPointerLeave={() => setActiveIndex(points.length - 1)}
      >
        <svg viewBox="0 0 320 160" role="img" aria-label="Performans grafigi">
          <defs>
            <linearGradient id="lineGradient" x1="0" x2="1">
              <stop offset="0%" stopColor="var(--orange-200)" />
              <stop offset="100%" stopColor="var(--pink-200)" />
            </linearGradient>
          </defs>
          <path
            d={pathPrimary}
            fill="none"
            stroke="url(#lineGradient)"
            strokeWidth="4"
            strokeLinecap="round"
          />
          {hasBenchmark ? (
            <path
              d={pathBench}
              fill="none"
              stroke="var(--blue-200)"
              strokeOpacity="0.45"
              strokeWidth="3"
              strokeLinecap="round"
            />
          ) : null}
          {activePoint ? (
            <>
              <circle
                cx={activePoint.x}
                cy={activePoint.y}
                r="6"
                fill="var(--orange-200)"
              />
              {hasBenchmark && activePoint.benchY ? (
                <circle
                  cx={activePoint.x}
                  cy={activePoint.benchY}
                  r="4"
                  fill="var(--blue-200)"
                />
              ) : null}
            </>
          ) : null}
        </svg>
        <div className="chart__grid" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <div className="chart__pulse" aria-hidden="true" />
        {activePoint ? (
          <div
            className="chart__tooltip"
            style={{
              left: `${(activeIndex / Math.max(points.length - 1, 1)) * 100}%`
            }}
          >
            <p>{activePoint.label}</p>
            <strong>₺{activePoint.value}</strong>
            {hasBenchmark && activePoint.bench ? (
              <span>BIST {activePoint.bench}</span>
            ) : null}
          </div>
        ) : null}
        <div className="chart__axis">
          <span>₺{Math.round(maxValue)}</span>
          <span>₺{Math.round((maxValue + minValue) / 2)}</span>
          <span>₺{Math.round(minValue)}</span>
        </div>
      </div>
      {showTabs ? (
        <div className="chart__tabs">
          <button className="tab active">1H</button>
          <button className="tab">1A</button>
          <button className="tab">3A</button>
          <button className="tab">1Y</button>
        </div>
      ) : null}
    </div>
  );
}
