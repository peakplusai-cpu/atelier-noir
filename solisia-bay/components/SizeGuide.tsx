"use client";

import { useState } from "react";
import { t, type MessageKey } from "@/lib/i18n";
import { SIZE_CHARTS, formatHeight, formatRange, formatWeight, type Unit } from "@/lib/sizes";
import type { ChartKey, ModelRef } from "@/lib/types";
import { useMarket } from "./MarketProvider";

const COLUMN: Record<string, MessageKey> = { Bust: "bust", Chest: "chest", Waist: "waist", Hip: "hip" };

export function UnitToggle({ unit, onChange }: { unit: Unit; onChange: (u: Unit) => void }) {
  const { lang } = useMarket();
  return (
    <div className="unit-toggle" role="group" aria-label={t(lang, "unit")}>
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
  const { lang } = useMarket();
  return (
    <ul className="model-list">
      {models.map((m) => (
        <li key={m.label}>
          <strong>{models.length > 1 ? `${m.label}: ` : `${t(lang, "model")}: `}</strong>
          {formatHeight(m.heightCm, unit)} / {formatWeight(m.weightKg, unit)}, {t(lang, "wearing")} <strong>{m.wears}</strong>
        </li>
      ))}
    </ul>
  );
}

export function SizeChartTable({ chartKey, unit, highlight }: { chartKey: ChartKey; unit: Unit; highlight?: string }) {
  const { lang } = useMarket();
  const chart = SIZE_CHARTS[chartKey];
  const title = chartKey === "men" ? t(lang, "men") : t(lang, "women");
  return (
    <div className="chart">
      <h4>{title}</h4>
      <div className="chart-scroll">
        <table>
          <thead>
            <tr>
              <th scope="col">{t(lang, "size")}</th>
              {chart.columns.map((c) => (
                <th scope="col" key={c}>
                  {COLUMN[c] ? t(lang, COLUMN[c]) : c} ({unit === "cm" ? "cm" : "in"})
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
      <p className="fine">{t(lang, "measureNote")}</p>
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
  const { lang } = useMarket();
  const [tab, setTab] = useState(0);
  const key = charts[Math.min(tab, charts.length - 1)];
  return (
    <div className="size-guide">
      <div className="size-guide-head">
        <p className="eyebrow">{t(lang, "unit")}</p>
        <UnitToggle unit={unit} onChange={onUnit} />
      </div>
      {models && models.length > 0 && <ModelInfo models={models} unit={unit} />}
      {charts.length > 1 && (
        <div className="tabs tabs-small" role="tablist">
          {charts.map((c, i) => (
            <button key={c} type="button" role="tab" aria-selected={i === tab} data-active={i === tab} onClick={() => setTab(i)}>
              {c === "men" ? t(lang, "men") : t(lang, "women")}
            </button>
          ))}
        </div>
      )}
      <SizeChartTable chartKey={key} unit={unit} highlight={highlight} />
      <p className="fine">
        {t(lang, "measureNote")}
      </p>
    </div>
  );
}

export function StandaloneSizeGuide() {
  const { lang } = useMarket();
  const [unit, setUnit] = useState<Unit>("cm");
  const keys = Object.keys(SIZE_CHARTS) as ChartKey[];
  return (
    <div className="size-guide">
      <div className="size-guide-head">
        <p className="eyebrow">{t(lang, "unit")}</p>
        <UnitToggle unit={unit} onChange={setUnit} />
      </div>
      {keys.map((k) => (
        <SizeChartTable key={k} chartKey={k} unit={unit} />
      ))}
    </div>
  );
}
