import { useState } from "react";
import type { MatrixPayload } from "../lib/api";
import { AXIS_DECIMALS, formatNumber } from "../lib/format";
import { bubbleColor, priceColor } from "../lib/colors";
import { indexOfBase } from "../lib/matrixStats";
import { useLocale } from "../i18n/LocaleContext";

interface ProfileChartProps {
  matrix: MatrixPayload;
  mode: "price" | "bubble";
  unit: string;
}

function finiteOnly(cells: (number | null)[]): (number | null)[] {
  return cells.map((value) => (value !== null && Number.isFinite(value) ? value : null));
}

/** نمای یک‌بعدی اثر دلار: همان مقیاس رنگی ماتریس، با ستون‌های هم‌جهت شبکه. */
export function ProfileChart({ matrix, mode, unit }: ProfileChartProps) {
  const { t, intl } = useLocale();
  const [hover, setHover] = useState<number | null>(null);

  const rowIndex = indexOfBase(matrix.row.values, matrix.row.base);
  const cols = matrix.col.values;
  if (rowIndex < 0 || cols.length < 2) return null;

  const cells = finiteOnly(matrix.values[rowIndex] ?? []);
  const finite = cells.filter((value): value is number => value !== null);
  if (finite.length < 2) return null;

  const min = Math.min(...finite);
  const max = Math.max(...finite);
  const span = max - min || 1;
  const maxAbs = Math.max(...finite.map((value) => Math.abs(value)), 1e-9);
  const baseIndex = rowIndex >= 0 ? indexOfBase(cols, matrix.col.base) : -1;
  const shown = hover ?? baseIndex;
  const decimals = AXIS_DECIMALS[matrix.row_axis];

  const heightFor = (value: number | null): number => {
    if (value === null) return 0;
    if (mode === "bubble") return (Math.abs(value) / maxAbs) * 44;
    return 10 + ((value - min) / span) * 74;
  };

  const colorFor = (value: number | null): string => {
    if (value === null) return "var(--color-surface-hover)";
    return mode === "bubble"
      ? bubbleColor(value, maxAbs)
      : priceColor((value - min) / span);
  };

  return (
    <div className="rounded-xl border border-line bg-surface px-3 pt-2.5 pb-2">
      <div className="flex flex-wrap items-baseline gap-x-2 text-[11px]">
        <h4 className="card-title">{t.results.profileTitle}</h4>
        <span className="text-ink-muted">{t.results.profileHint}</span>
        {shown >= 0 && shown < cols.length ? (
          <span className="ms-auto flex items-baseline gap-1.5">
            <span className="text-ink-muted">
              {formatNumber(cols[shown], intl, 0)} {t.axes.usd.unit} ×{" "}
              {formatNumber(matrix.row.values[rowIndex], intl, decimals)}
            </span>
            <span
              className={`num text-[12.5px] font-bold ${
                cells[shown] === null
                  ? "text-ink-muted"
                  : mode === "bubble" && (cells[shown] as number) > 0.5
                    ? "text-over"
                    : mode === "bubble" && (cells[shown] as number) < -0.5
                      ? "text-under"
                      : "text-ink"
              }`}
            >
              {cells[shown] === null
                ? "—"
                : formatNumber(cells[shown] as number, intl, mode === "bubble" ? 2 : 0)}
            </span>
            <span className="text-ink-muted">{unit}</span>
          </span>
        ) : null}
      </div>

      <div
        className={`relative mt-2 flex h-24 gap-[3px] ${
          mode === "bubble" ? "items-center" : "items-end"
        }`}
        onMouseLeave={() => setHover(null)}
      >
        {mode === "bubble" ? (
          <span
            className="pointer-events-none absolute inset-x-0 top-1/2 h-px bg-line-strong"
            aria-hidden
          />
        ) : null}

        {cells.map((value, index) => {
          const active = index === shown;
          const below = mode === "bubble" && value !== null && value < 0;
          return (
            <button
              key={cols[index]}
              type="button"
              onMouseEnter={() => setHover(index)}
              onFocus={() => setHover(index)}
              aria-label={`${formatNumber(cols[index], intl, 0)} ${t.axes.usd.unit}`}
              className={`group relative flex-1 ${
                mode === "bubble" ? "self-center" : "self-end"
              } cursor-default outline-none`}
              style={{ height: "100%" }}
            >
              <span
                className={`absolute start-0 w-full rounded-[4px] transition-all duration-500 ease-spring ${
                  mode === "bubble"
                    ? below
                      ? "top-1/2"
                      : "bottom-1/2"
                    : "bottom-0"
                } ${active ? "opacity-100 ring-2 ring-ink/25" : "opacity-90"}`}
                style={{
                  height: `${heightFor(value)}%`,
                  background: colorFor(value),
                }}
                aria-hidden
              />
              {index === baseIndex ? (
                <span
                  className="absolute -bottom-1 start-0 end-0 mx-auto h-1.5 w-1.5 rounded-full bg-brand"
                  aria-hidden
                />
              ) : null}
            </button>
          );
        })}
      </div>

      <div className="mt-1.5 flex justify-between text-[9.5px] text-ink-muted">
        <span className="num">
          {formatNumber(cols[0], intl, 0)} {t.axes.usd.unit}
        </span>
        <span className="num">
          {formatNumber(cols[cols.length - 1], intl, 0)} {t.axes.usd.unit}
        </span>
      </div>
    </div>
  );
}
