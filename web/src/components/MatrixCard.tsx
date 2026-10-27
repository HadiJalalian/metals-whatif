import { useState } from "react";
import type { MatrixPayload } from "../lib/api";
import {
  AXIS_DECIMALS,
  formatCell,
  formatCompact,
  formatNumber,
  formatPercent,
  matrixToCsv,
} from "../lib/format";
import { scaleStops } from "../lib/colors";
import { finiteValues } from "../lib/matrixStats";
import { useLocale } from "../i18n/LocaleContext";
import { Heatmap } from "./Heatmap";
import { ProfileChart } from "./ProfileChart";

interface MatrixCardProps {
  title: string;
  subtitle: string;
  hint?: string;
  matrix: MatrixPayload;
  /** ماتریس کنارِ همین دارایی؛ برای جمله‌ی «چقدر از تابلو فاصله دارد». */
  companion: MatrixPayload | null;
  marketPrice: number;
  assetLabel: string;
  mode: "price" | "bubble";
  unit: string;
}

const NEAR_ZERO = 0.5;

function Legend({
  mode,
  matrix,
}: {
  mode: "price" | "bubble";
  matrix: MatrixPayload;
}) {
  const { t, intl } = useLocale();
  const stops = scaleStops(mode).join(", ");
  const finite = finiteValues(matrix);

  let low = "—";
  let high = "—";
  if (finite.length > 0) {
    if (mode === "bubble") {
      const magnitude = formatPercent(
        Math.max(...finite.map((value) => Math.abs(value))),
        intl,
        1
      );
      low = `−${magnitude} ٪`;
      high = `+${magnitude} ٪`;
    } else {
      low = formatCompact(Math.min(...finite), intl);
      high = formatCompact(Math.max(...finite), intl);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <span className="num text-[9.5px] text-ink-muted">{low}</span>
      <span
        className="h-2 w-28 rounded-full ring-1 ring-line rtl:-scale-x-100"
        style={{
          background: `linear-gradient(90deg, ${stops})`,
        }}
        title={mode === "bubble" ? t.results.bubbleLegend : t.results.priceLegend}
        aria-hidden
      />
      <span className="num text-[9.5px] text-ink-muted">{high}</span>
    </div>
  );
}

export function MatrixCard({
  title,
  subtitle,
  hint,
  matrix,
  companion,
  marketPrice,
  assetLabel,
  mode,
  unit,
}: MatrixCardProps) {
  const { t, intl } = useLocale();
  const [showTable, setShowTable] = useState(false);

  const decimals = AXIS_DECIMALS[matrix.row_axis];

  const readout = (row: number, col: number): string => {
    const parts = {
      asset: assetLabel,
      usd: formatNumber(matrix.col.values[col] ?? 0, intl, 0),
      axisName: t.axes[matrix.row_axis].name,
      axisValue: formatNumber(matrix.row.values[row] ?? 0, intl, decimals),
    };

    if (mode === "bubble") {
      const value = matrix.values[row]?.[col];
      if (value === null || value === undefined || !Number.isFinite(value)) {
        return t.results.noBoardPrice;
      }
      if (Math.abs(value) < NEAR_ZERO) {
        return t.results.bubbleEqual(parts);
      }
      return t.results.bubbleSummary({
        ...parts,
        value: `${formatPercent(Math.abs(value), intl, 1)} ٪`,
        direction: value > 0 ? t.results.directionAbove : t.results.directionBelow,
      });
    }

    const price = matrix.values[row]?.[col];
    const bubble = companion?.values[row]?.[col];
    const usable =
      marketPrice > 0 &&
      bubble !== null &&
      bubble !== undefined &&
      Number.isFinite(bubble);

    let compare: string | null = null;
    if (!usable) compare = t.results.noBoardPrice;
    else if (Math.abs(bubble as number) < NEAR_ZERO) compare = t.results.compareEqual;
    else {
      const magnitude = `${formatPercent(Math.abs(bubble as number), intl, 1)} ٪`;
      // حباب مثبت یعنی تابلو بالاتر از مدل؛ پس مدل پایین‌تر از تابلو است.
      compare =
        (bubble as number) > 0
          ? t.results.compareBelow(magnitude)
          : t.results.compareAbove(magnitude);
    }

    return t.results.summary({
      ...parts,
      axisUnit: t.axes[matrix.row_axis].unit,
      price:
        price === null || price === undefined
          ? "—"
          : formatNumber(price, intl, 0),
      unit,
      compare,
    });
  };

  const download = () => {
    const csv = matrixToCsv(
      matrix.row.values.map((value) =>
        formatNumber(value, "en-US", decimals)
      ),
      matrix.col.values.map((value) => formatNumber(value, "en-US", 0)),
      matrix.values
    );
    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8" })
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${mode}-matrix.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="card card-lift overflow-hidden">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-line px-4 py-3">
        <div className="min-w-0">
          <p className="eyebrow">
            {t.axes[matrix.row_axis].short} × {t.axes.usd.short}
          </p>
          <h3 className="text-[14px] leading-snug font-bold text-ink">
            {title}
            <span className="ms-2 text-[11px] font-medium text-ink-muted">
              {subtitle}
            </span>
          </h3>
        </div>

        {/* واترمارک: در هر اسکرین‌شات ماتریس می‌ماند، بدون افت خوانایی خانه‌ها. */}
        <span className="select-none text-[10.5px] font-medium text-ink-muted/80">
          @themohammadm
        </span>

        <div className="ms-auto flex flex-wrap items-center gap-2">
          <Legend mode={mode} matrix={matrix} />
          <button type="button" className="chip" onClick={download}>
            <svg viewBox="0 0 16 16" className="size-3" aria-hidden>
              <path
                d="M8 2v8m0 0 3-3M8 10 5 7M3 13h10"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {t.results.exportCsv}
          </button>
          <button
            type="button"
            className="chip"
            onClick={() => setShowTable((value) => !value)}
            aria-expanded={showTable}
          >
            {showTable ? t.results.hideTable : t.results.showTable}
          </button>
        </div>
      </div>

      {hint ? (
        <p className="border-b border-line bg-surface-subtle px-4 py-2 text-[11.5px] leading-relaxed text-ink-secondary">
          {hint}
        </p>
      ) : null}

      <div className="space-y-2.5 p-3">
        <Heatmap matrix={matrix} mode={mode} unit={unit} readout={readout} />
        <ProfileChart matrix={matrix} mode={mode} unit={unit} />
      </div>

      {showTable ? (
        <div className="max-h-[340px] animate-slide-in overflow-auto border-t border-line">
          <table className="w-full border-collapse text-[11px]">
            <thead className="sticky top-0 bg-surface">
              <tr>
                <th className="border-b border-line px-2 py-1.5 text-start font-semibold text-ink-muted">
                  {t.axes[matrix.row_axis].name}
                </th>
                {matrix.col.values.map((value) => (
                  <th
                    key={`h-${value}`}
                    className="num border-b border-line px-2 py-1.5 text-end font-semibold text-ink-muted whitespace-nowrap"
                  >
                    {formatNumber(value, intl, 0)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {matrix.row.values.map((rowValue, rowIndex) => (
                <tr key={`r-${rowValue}`} className="hover:bg-surface-subtle">
                  <th className="num px-2 py-1 text-start font-medium text-ink-secondary whitespace-nowrap">
                    {formatNumber(rowValue, intl, decimals)}
                  </th>
                  {matrix.col.values.map((colValue, colIndex) => {
                    const value = matrix.values[rowIndex]?.[colIndex];
                    return (
                      <td
                        key={`c-${rowValue}-${colValue}`}
                        className="num px-2 py-1 text-end text-ink whitespace-nowrap"
                      >
                        {value === null || value === undefined
                          ? "—"
                          : formatCell(value, mode, intl)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}
