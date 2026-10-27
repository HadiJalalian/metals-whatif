import { memo, useCallback, useMemo, useState } from "react";
import type { MatrixPayload } from "../lib/api";
import { AXIS_DECIMALS, formatCell, formatNumber } from "../lib/format";
import { bubbleColor, priceColor, textOn } from "../lib/colors";
import { useLocale } from "../i18n/LocaleContext";

export interface HeatmapProps {
  matrix: MatrixPayload;
  mode: "price" | "bubble";
  /** واحد سمت راست inspector: تومان یا ٪ */
  unit: string;
}

interface Geometry {
  bgs: string[];
  fgs: string[];
  texts: string[];
}

const GAP = "2px";

function fontSizeFor(cols: number): number {
  if (cols <= 8) return 12.5;
  if (cols <= 11) return 11.5;
  if (cols <= 15) return 10.5;
  if (cols <= 21) return 9.5;
  return 9;
}

function isBase(value: number, base: number): boolean {
  return Math.abs(value - base) < 1e-9;
}

/**
 * گرید خانه‌ها memo است: state مکان‌نما فقط header و inspector را عوض می‌کند،
 * وگرنه یک ماتریس ۴۱×۴۱ با هر حرکت ماوس دوباره رندر می‌شد.
 */
const CellGrid = memo(function CellGrid({
  geometry,
  rowValues,
  colValues,
  onEnter,
}: {
  geometry: Geometry;
  rowValues: number[];
  colValues: number[];
  onEnter: (row: number, col: number) => void;
}) {
  const cols = colValues.length;
  return (
    <>
      {rowValues.map((rowValue, rowIndex) =>
        colValues.map((colValue, colIndex) => {
          const index = rowIndex * cols + colIndex;
          return (
            <div
              key={`${rowValue}x${colValue}`}
              role="gridcell"
              onMouseEnter={() => onEnter(rowIndex, colIndex)}
              className="num grid cursor-crosshair place-items-center rounded-[5px] py-1.5 transition-[box-shadow,transform] duration-75 hover:z-10 hover:scale-[1.06] hover:shadow-[0_0_0_2px_var(--color-ink)]"
              style={{
                gridColumn: colIndex + 2,
                gridRow: rowIndex + 2,
                background: geometry.bgs[index],
                color: geometry.fgs[index],
              }}
            >
              {geometry.texts[index]}
            </div>
          );
        })
      )}
    </>
  );
});

export function Heatmap({ matrix, mode, unit }: HeatmapProps) {
  const { t, intl } = useLocale();
  const [cursor, setCursor] = useState<{ row: number; col: number } | null>(null);

  const rowValues = matrix.row.values;
  const colValues = matrix.col.values;
  const rowDecimals = AXIS_DECIMALS[matrix.row_axis];

  const geometry = useMemo<Geometry>(() => {
    const flat = matrix.values.flat();
    const finite = flat.filter(
      (value): value is number => value !== null && Number.isFinite(value)
    );

    let min = 0;
    let span = 1;
    let maxAbs = 1;
    if (finite.length > 0) {
      if (mode === "bubble") {
        maxAbs = Math.max(...finite.map((value) => Math.abs(value)), 1e-9);
      } else {
        min = Math.min(...finite);
        span = Math.max(...finite) - min || 1;
      }
    }

    const bgs: string[] = [];
    const fgs: string[] = [];
    const texts: string[] = [];
    for (const value of flat) {
      if (value === null || !Number.isFinite(value)) {
        bgs.push("#f2f4f7");
        fgs.push("#98a2b3");
        texts.push("—");
        continue;
      }
      const bg =
        mode === "bubble"
          ? bubbleColor(value, maxAbs)
          : priceColor((value - min) / span);
      bgs.push(bg);
      fgs.push(textOn(bg));
      texts.push(formatCell(value, mode, intl));
    }
    return { bgs, fgs, texts };
  }, [matrix.values, mode, intl]);

  const onEnter = useCallback((row: number, col: number) => {
    setCursor((current) =>
      current?.row === row && current?.col === col ? current : { row, col }
    );
  }, []);

  const moveCursor = useCallback(
    (deltaRow: number, deltaCol: number) => {
      setCursor((current) => ({
        row: Math.max(
          0,
          Math.min(rowValues.length - 1, (current?.row ?? -1) + deltaRow)
        ),
        col: Math.max(
          0,
          Math.min(colValues.length - 1, (current?.col ?? -1) + deltaCol)
        ),
      }));
    },
    [rowValues.length, colValues.length]
  );

  const cellMinWidth = mode === "bubble" ? 58 : 78;

  return (
    <div className="space-y-2">
      <div className="overflow-x-auto rounded-lg border border-line bg-surface-subtle p-1">
        <div
          role="grid"
          aria-label={mode === "price" ? t.results.priceTitle : t.results.bubbleTitle}
          tabIndex={0}
          onMouseLeave={() => setCursor(null)}
          onKeyDown={(event) => {
            const steps: Record<string, [number, number]> = {
              ArrowUp: [-1, 0],
              ArrowDown: [1, 0],
              ArrowLeft: [0, -1],
              ArrowRight: [0, 1],
            };
            const step = steps[event.key];
            if (step) {
              event.preventDefault();
              moveCursor(step[0], step[1]);
            }
          }}
          className="grid min-w-max outline-none focus-visible:ring-2 focus-visible:ring-accent"
          style={{
            gridTemplateColumns: `max-content repeat(${colValues.length}, minmax(${cellMinWidth}px, 1fr))`,
            gridTemplateRows: `auto repeat(${rowValues.length}, minmax(30px, 1fr))`,
            gap: GAP,
            fontSize: fontSizeFor(colValues.length),
          }}
        >
          <div
            className="sticky top-0 start-0 z-40 grid place-items-center bg-surface-subtle px-2 py-1.5 text-[10px] font-semibold whitespace-nowrap text-ink-muted"
            style={{ gridColumn: 1, gridRow: 1 }}
          >
            {t.axes[matrix.row_axis].short} × {t.axes.usd.short}
          </div>

          {colValues.map((value, index) => (
            <div
              key={`col-${value}`}
              className={`sticky top-0 z-20 grid place-items-center rounded-[5px] px-1.5 py-1.5 text-[10.5px] font-medium whitespace-nowrap transition-colors ${
                cursor?.col === index
                  ? "bg-brand text-white"
                  : isBase(value, matrix.col.base)
                    ? "text-brand"
                    : "text-ink-secondary"
              }`}
              style={{ gridColumn: index + 2, gridRow: 1 }}
            >
              <span className="num">{formatNumber(value, intl, 0)}</span>
            </div>
          ))}

          {rowValues.map((value, index) => (
            <div
              key={`row-${value}`}
              className={`sticky start-0 z-30 grid place-items-end rounded-[5px] px-2 py-1 text-[10.5px] font-medium whitespace-nowrap transition-colors ${
                cursor?.row === index
                  ? "bg-brand text-white"
                  : isBase(value, matrix.row.base)
                    ? "text-brand"
                    : "text-ink-secondary"
              }`}
              style={{ gridColumn: 1, gridRow: index + 2 }}
            >
              <span className="num">{formatNumber(value, intl, rowDecimals)}</span>
            </div>
          ))}

          <CellGrid
            geometry={geometry}
            rowValues={rowValues}
            colValues={colValues}
            onEnter={onEnter}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 rounded-lg border border-line bg-surface px-3 py-2 text-[11.5px]">
        {cursor ? (
          <>
            <span className="text-ink-secondary">
              {t.axes[matrix.row_axis].name}:{" "}
              <span className="num font-semibold text-ink">
                {formatNumber(rowValues[cursor.row], intl, rowDecimals)}
              </span>{" "}
              {t.axes[matrix.row_axis].unit}
            </span>
            <span className="text-ink-muted">×</span>
            <span className="text-ink-secondary">
              {t.axes.usd.name}:{" "}
              <span className="num font-semibold text-ink">
                {formatNumber(colValues[cursor.col], intl, 0)}
              </span>{" "}
              {t.axes.usd.unit}
            </span>
            <span className="ms-auto">
              <span
                className={`num text-[13px] font-bold ${toneFor(
                  mode,
                  matrix.values[cursor.row]?.[cursor.col]
                )}`}
              >
                {formatActive(
                  matrix.values[cursor.row]?.[cursor.col],
                  mode,
                  intl
                )}
              </span>{" "}
              <span className="text-ink-muted">{unit}</span>
            </span>
          </>
        ) : (
          <span className="text-ink-muted">{t.results.inspector}</span>
        )}
      </div>
    </div>
  );
}

function formatActive(
  value: number | null | undefined,
  mode: "price" | "bubble",
  intl: "en-US" | "fa-IR"
): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";
  return formatNumber(value, intl, mode === "bubble" ? 2 : 0);
}

function toneFor(mode: "price" | "bubble", value: number | null | undefined): string {
  if (mode !== "bubble" || value === null || value === undefined) return "text-ink";
  if (!Number.isFinite(value)) return "text-ink-muted";
  if (value > 0.5) return "text-over";
  if (value < -0.5) return "text-under";
  return "text-ink";
}
