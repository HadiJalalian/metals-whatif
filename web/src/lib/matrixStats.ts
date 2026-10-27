import type { MatrixPayload } from "./api";

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
