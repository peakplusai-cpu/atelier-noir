"use client";

import { useState } from "react";
import { SIZE_CHARTS, formatHeight, formatRange, formatWeight, type Unit } from "@/lib/sizes";
import type { ChartKey, ModelRef } from "@/lib/types";

export function UnitToggle({ unit, onChange }: { unit: Unit; onChange: (u: Unit) => void }) {
  return (
    <div className="unit-toggle" role="group" aria-label="Measurement unit">
      <button type="button" data-active={unit === "cm"} aria-pressed={unit === "cm"} onClick={() => onChange("cm")}>
        cm
      </button>
      <button type="button" data-active={unit === "in"} aria-pressed={unit === "in"} onClick={() => onChange("in")}>
        inch
      </button>
    </div>
  );
}

export function ModelInfo({ models, unit }: { models: ModelRef[]; unit: Unit }) {
  return (
    <ul className="model-list">
      {models.map((m) => (
        <li key={m.label}>
          <strong>{models.length > 1 ? `${m.label}: ` : "Model: "}</strong>
          {formatHeight(m.heightCm, unit)} / {formatWeight(m.weightKg, unit)}, wearing size <strong>{m.wears}</strong>
        </li>
      ))}
    </ul>
  );
}

export function SizeChartTable({ chartKey, unit, highlight }: { chartKey: ChartKey; unit: Unit; highlight?: string }) {
  const chart = SIZE_CHARTS[chartKey];
  return (
    <div className="chart">
      <h4>{chart.title}</h4>
      <div className="chart-scroll">
        <table>
          <thead>
            <tr>
              <th scope="col">Size</th>
              {chart.columns.map((c) => (
                <th scope="col" key={c}>
                  {c} ({unit === "cm" ? "cm" : "in"})
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {chart.rows.map((row) => (
              <tr key={row.size} data-active={row.size === highlight}>
                <th scope="row">{row.size}</th>
                {row.values.map((v, i) => (
                  <td key={i}>{formatRange(v, unit)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="fine">{chart.note}</p>
    </div>
  );
}

export function SizeGuidePanel({
  charts,
  models,
  unit,
  onUnit,
  highlight,
}: {
  charts: ChartKey[];
  models?: ModelRef[];
  unit: Unit;
  onUnit: (u: Unit) => void;
  highlight?: string;
}) {
  const [tab, setTab] = useState(0);
  const key = charts[Math.min(tab, charts.length - 1)];
  return (
    <div className="size-guide">
      <div className="size-guide-head">
        <p className="eyebrow">Unit</p>
        <UnitToggle unit={unit} onChange={onUnit} />
      </div>
      {models && models.length > 0 && <ModelInfo models={models} unit={unit} />}
      {charts.length > 1 && (
        <div className="tabs tabs-small" role="tablist">
          {charts.map((c, i) => (
            <button key={c} type="button" role="tab" aria-selected={i === tab} data-active={i === tab} onClick={() => setTab(i)}>
              {SIZE_CHARTS[c].title}
            </button>
          ))}
        </div>
      )}
      <SizeChartTable chartKey={key} unit={unit} highlight={highlight} />
      <p className="fine">
        Measure without pulling the tape tight. Between sizes, choose the larger size.
      </p>
    </div>
  );
}

export function StandaloneSizeGuide() {
  const [unit, setUnit] = useState<Unit>("cm");
  const keys = Object.keys(SIZE_CHARTS) as ChartKey[];
  return (
    <div className="size-guide">
      <div className="size-guide-head">
        <p className="eyebrow">Unit</p>
        <UnitToggle unit={unit} onChange={setUnit} />
      </div>
      {keys.map((k) => (
        <SizeChartTable key={k} chartKey={k} unit={unit} />
      ))}
    </div>
  );
}
