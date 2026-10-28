import type { MatrixPayload } from "./api";
import { bubbleColor, priceColor, textOn } from "./colors";
import { formatCompact, formatPercent } from "./format";
import type { LocaleTag } from "../i18n/LocaleContext";

/** لبه‌های legends؛ همان عدد روی نوار رنگی کارت و در تصویر PNG. */
export function legendEdges(
  matrix: MatrixPayload,
  mode: "price" | "bubble",
  intl: LocaleTag
): { low: string; high: string } {
  const finite = finiteValues(matrix);
  if (finite.length === 0) return { low: "—", high: "—" };
  if (mode === "bubble") {
    const magnitude = formatPercent(
      Math.max(...finite.map((value) => Math.abs(value))),
      intl,
      1
    );
    return { low: `−${magnitude} ٪`, high: `+${magnitude} ٪` };
  }
  return {
    low: formatCompact(Math.min(...finite), intl),
    high: formatCompact(Math.max(...finite), intl),
  };
}

/** خانه خالی/غیرمتناهی: همان رنگی که روی صفحه نمایش داده می‌شود. */
export const EMPTY_CELL = { bg: "#f1f4f8", fg: "#98a2b3" };

export interface ColorDomain {
  min: number;
  span: number;
  maxAbs: number;
}

export function colorDomain(
  matrix: MatrixPayload,
  mode: "price" | "bubble"
): ColorDomain {
  const finite = finiteValues(matrix);
  if (finite.length === 0) return { min: 0, span: 1, maxAbs: 1 };
  if (mode === "bubble") {
    return {
      min: 0,
      span: 1,
      maxAbs: Math.max(...finite.map((value) => Math.abs(value)), 1e-9),
    };
  }
  const min = Math.min(...finite);
  return { min, span: Math.max(...finite) - min || 1, maxAbs: 1 };
}

/** مقیاس رنگ یک خانه؛ هم heatmap و هم خروجی PNG از همین تابع استفاده می‌کنند. */
export function cellColors(
  value: number | null,
  mode: "price" | "bubble",
  domain: ColorDomain
): { bg: string; fg: string } {
  if (value === null || !Number.isFinite(value)) return EMPTY_CELL;
  const bg =
    mode === "bubble"
      ? bubbleColor(value, domain.maxAbs)
      : priceColor((value - domain.min) / domain.span);
  return { bg, fg: textOn(bg) };
}

export function finiteValues(matrix: MatrixPayload): number[] {
  const out: number[] = [];
  for (const row of matrix.values) {
    for (const value of row) {
      if (value !== null && Number.isFinite(value)) out.push(value);
    }
  }
  return out;
}

/** نماینده «سناریوی پایه»: دقیقاً base، وگرنه نزدیک‌ترین مقدار موجود روی محور. */
export function indexOfBase(values: number[], base: number): number {
  if (values.length === 0) return -1;
  const exact = values.findIndex((value) => Math.abs(value - base) < 1e-9);
  if (exact >= 0) return exact;
  let best = 0;
  let bestGap = Math.abs(values[0] - base);
  values.forEach((value, index) => {
    const gap = Math.abs(value - base);
    if (gap < bestGap) {
      bestGap = gap;
      best = index;
    }
  });
  return best;
}

export function cellAt(
  matrix: MatrixPayload,
  row: number,
  col: number
): number | null {
  const value = matrix.values[row]?.[col];
  return value === undefined ? null : value;
}

export interface MatrixSummary {
  min: number;
  max: number;
  atBase: number | null;
}

export function summarize(matrix: MatrixPayload): MatrixSummary {
  const finite = finiteValues(matrix);
  const row = indexOfBase(matrix.row.values, matrix.row.base);
  const col = indexOfBase(matrix.col.values, matrix.col.base);
  return {
    min: finite.length ? Math.min(...finite) : 0,
    max: finite.length ? Math.max(...finite) : 0,
    atBase: row >= 0 && col >= 0 ? cellAt(matrix, row, col) : null,
  };
}
