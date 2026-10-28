import { memo, useCallback, useMemo, useState } from "react";
import type { MatrixPayload } from "../lib/api";
import { AXIS_DECIMALS, formatCell, formatNumber } from "../lib/format";
import { cellColors, colorDomain } from "../lib/matrixStats";
import { useLocale } from "../i18n/LocaleContext";
import type { LocaleTag } from "../i18n/LocaleContext";

export interface HeatmapProps {
  matrix: MatrixPayload;
  mode: "price" | "bubble";
  /** واحد خانه فعال: تومان یا ٪ */
  unit: string;
  /** جمله‌ی خواندن سناریو، از کارت مادر ساخته می‌شود. */
  readout: (row: number, col: number) => string;
}

interface Geometry {
  bgs: string[];
  fgs: string[];
  texts: string[];
}

interface Position {
  row: number;
  col: number;
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
 * گرید خانه‌ها memo است: state مکان‌نما فقط overlay و inspector را عوض می‌کند،
 * وگرنه یک ماتریس ۴۱×۴۱ با هر حرکت ماوس دوباره رندر می‌شد.
 */
const CellGrid = memo(function CellGrid({
  geometry,
  rowValues,
  colValues,
  onEnter,
  onPin,
}: {
  geometry: Geometry;
  rowValues: number[];
  colValues: number[];
  onEnter: (row: number, col: number) => void;
  onPin: (row: number, col: number) => void;
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
              onClick={() => onPin(rowIndex, colIndex)}
              className="num grid cursor-pointer select-none place-items-center rounded-[6px] py-1.5 transition-[box-shadow,transform,filter] duration-100 hover:z-10 hover:scale-[1.08] hover:brightness-110 hover:shadow-[0_0_0_2px_var(--color-ink),0_10px_22px_-12px_rgb(10_18_32_/_0.6)]"
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

export function Heatmap({ matrix, mode, unit, readout }: HeatmapProps) {
  const { t, intl } = useLocale();
  const [hover, setHover] = useState<Position | null>(null);
  const [pinned, setPinned] = useState<Position | null>(null);

  const rowValues = matrix.row.values;
  const colValues = matrix.col.values;
  const rowDecimals = AXIS_DECIMALS[matrix.row_axis];
  const active = hover ?? pinned;

  const geometry = useMemo<Geometry>(() => {
    const domain = colorDomain(matrix, mode);
    const flat = matrix.values.flat();

    const bgs: string[] = [];
    const fgs: string[] = [];
    const texts: string[] = [];
    for (const value of flat) {
      const { bg, fg } = cellColors(value, mode, domain);
      bgs.push(bg);
      fgs.push(fg);
      texts.push(
        value === null || !Number.isFinite(value) ? "—" : formatCell(value, mode, intl)
      );
    }
    return { bgs, fgs, texts };
  }, [matrix, mode, intl]);

  const basePosition = useMemo<Position | null>(() => {
    const row = rowValues.findIndex((value) => isBase(value, matrix.row.base));
    const col = colValues.findIndex((value) => isBase(value, matrix.col.base));
    return row >= 0 && col >= 0 ? { row, col } : null;
  }, [rowValues, colValues, matrix.row.base, matrix.col.base]);

  const onEnter = useCallback((row: number, col: number) => {
    setHover((current) =>
      current?.row === row && current?.col === col ? current : { row, col }
    );
  }, []);

  const onPin = useCallback((row: number, col: number) => {
    setPinned((current) =>
      current?.row === row && current?.col === col ? null : { row, col }
    );
  }, []);

  const moveCursor = useCallback(
    (deltaRow: number, deltaCol: number) => {
      setHover((current) => {
        const start = current ?? { row: deltaRow < 0 ? rowValues.length - 1 : 0, col: 0 };
        return {
          row: Math.max(
            0,
            Math.min(rowValues.length - 1, start.row + deltaRow)
          ),
          col: Math.max(
            0,
            Math.min(colValues.length - 1, start.col + deltaCol)
          ),
        };
      });
    },
    [rowValues.length, colValues.length]
  );

  const cellMinWidth = mode === "bubble" ? 60 : 80;
  const activeValue = active
    ? matrix.values[active.row]?.[active.col]
    : undefined;

  return (
    <div className="space-y-2">
      <div className="overflow-x-auto rounded-xl border border-line bg-surface-subtle p-1.5">
        <div
          role="grid"
          aria-label={mode === "price" ? t.results.priceTitle : t.results.bubbleTitle}
          tabIndex={0}
          onMouseLeave={() => setHover(null)}
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
              return;
            }
            if (event.key === "Enter" && hover) {
              event.preventDefault();
              onPin(hover.row, hover.col);
            }
            if (event.key === "Escape") setPinned(null);
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
              className={`sticky top-0 z-20 grid place-items-center rounded-[6px] px-1.5 py-1.5 text-[10.5px] font-semibold whitespace-nowrap transition-colors duration-150 ${
                active?.col === index
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
              className={`sticky start-0 z-30 grid place-items-end rounded-[6px] px-2 py-1 text-[10.5px] font-semibold whitespace-nowrap transition-colors duration-150 ${
                active?.row === index
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

          {pinned ? (
            <>
              <div
                className="pointer-events-none z-[4] bg-brand/10"
                style={{ gridColumn: "2 / -1", gridRow: pinned.row + 2 }}
                aria-hidden
              />
              <div
                className="pointer-events-none z-[4] bg-brand/10"
                style={{ gridColumn: pinned.col + 2, gridRow: "2 / -1" }}
                aria-hidden
              />
            </>
          ) : null}

          {hover ? (
            <>
              <div
                className="pointer-events-none z-[5]"
                style={{
                  gridColumn: "2 / -1",
                  gridRow: hover.row + 2,
                  background: "rgb(47 111 237 / .10)",
                }}
                aria-hidden
              />
              <div
                className="pointer-events-none z-[5]"
                style={{
                  gridColumn: hover.col + 2,
                  gridRow: "2 / -1",
                  background: "rgb(47 111 237 / .10)",
                }}
                aria-hidden
              />
            </>
          ) : null}

          {basePosition ? (
            <div
              className="pointer-events-none z-[6] rounded-[7px] ring-2 ring-brand/45 ring-offset-1 ring-offset-surface-subtle"
              style={{
                gridColumn: basePosition.col + 2,
                gridRow: basePosition.row + 2,
              }}
              title={t.common.base}
              aria-hidden
            />
          ) : null}

          {pinned ? (
            <div
              className="pointer-events-none z-[7] grid place-items-start rounded-[7px] ring-2 ring-accent"
              style={{
                gridColumn: pinned.col + 2,
                gridRow: pinned.row + 2,
              }}
              aria-hidden
            >
              <span className="ms-1 mt-1 size-1.5 rounded-full bg-accent" />
            </div>
          ) : null}

          <CellGrid
            geometry={geometry}
            rowValues={rowValues}
            colValues={colValues}
            onEnter={onEnter}
            onPin={onPin}
          />
        </div>
      </div>

      <div className="card space-y-1.5 px-3 py-2.5">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11.5px]">
          {active ? (
            <>
              <span className="text-ink-secondary">
                {t.axes[matrix.row_axis].name}:{" "}
                <span className="num font-bold text-ink">
                  {formatNumber(rowValues[active.row], intl, rowDecimals)}
                </span>{" "}
                <span className="text-ink-muted">{t.axes[matrix.row_axis].unit}</span>
              </span>
              <span className="text-ink-muted">×</span>
              <span className="text-ink-secondary">
                {t.axes.usd.name}:{" "}
                <span className="num font-bold text-ink">
                  {formatNumber(colValues[active.col], intl, 0)}
                </span>{" "}
                <span className="text-ink-muted">{t.axes.usd.unit}</span>
              </span>
              <span className="ms-auto flex items-center gap-2">
                {pinned ? (
                  <button
                    type="button"
                    className="chip py-0.5! text-[10.5px]"
                    onClick={() => setPinned(null)}
                  >
                    {t.common.unpin}
                  </button>
                ) : null}
                <span
                  className={`num text-[14px] font-extrabold ${toneFor(
                    mode,
                    activeValue
                  )}`}
                >
                  {formatActive(activeValue, mode, intl)}
                </span>{" "}
                <span className="text-ink-muted">{unit}</span>
              </span>
            </>
          ) : (
            <span className="text-ink-muted">{t.results.inspector}</span>
          )}
        </div>

        {active ? (
          <p
            aria-live="polite"
            className="text-[12px] leading-relaxed text-ink-secondary"
          >
            {readout(active.row, active.col)}
          </p>
        ) : (
          <p className="text-[11.5px] text-ink-muted">{t.common.pin}</p>
        )}
      </div>
    </div>
  );
}

function formatActive(
  value: number | null | undefined,
  mode: "price" | "bubble",
  intl: LocaleTag
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
