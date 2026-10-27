import { useState } from "react";
import type { MatrixPayload } from "../lib/api";
import { AXIS_DECIMALS, formatCell, formatNumber, matrixToCsv } from "../lib/format";
import { scaleStops } from "../lib/colors";
import { useLocale } from "../i18n/LocaleContext";
import { Heatmap } from "./Heatmap";

interface MatrixCardProps {
  title: string;
  hint?: string;
  matrix: MatrixPayload;
  mode: "price" | "bubble";
  unit: string;
}

function Legend({ mode }: { mode: "price" | "bubble" }) {
  const { t } = useLocale();
  const stops = scaleStops(mode).join(", ");
  const caption =
    mode === "bubble" ? t.results.bubbleLegend : t.results.priceLegend;

  return (
    <div className="flex items-center gap-2" title={caption}>
      <span
        className="h-2 w-24 rounded-full ring-1 ring-line"
        style={{ background: `linear-gradient(90deg, ${stops})` }}
        aria-hidden
      />
      <span className="hidden text-[10.5px] text-ink-muted sm:inline">{caption}</span>
    </div>
  );
}

export function MatrixCard({ title, hint, matrix, mode, unit }: MatrixCardProps) {
  const { t, intl } = useLocale();
  const [showTable, setShowTable] = useState(false);

  const download = () => {
    const csv = matrixToCsv(
      matrix.row.values.map((value) =>
        formatNumber(value, "en-US", AXIS_DECIMALS[matrix.row_axis])
      ),
      matrix.col.values.map((value) => formatNumber(value, "en-US", 0)),
      matrix.values
    );
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${mode}-matrix.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="card overflow-hidden">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-line px-4 py-3">
        <h3 className="text-[13.5px] font-semibold text-ink">{title}</h3>
        {/* واترمارک: در هر اسکرین‌شات ماتریس می‌ماند، بدون افت خوانایی خانه‌ها. */}
        <span className="select-none text-[10.5px] font-medium text-ink-muted/80">
          @themohammadm
        </span>
        <span className="ms-auto">
          <Legend mode={mode} />
        </span>
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
        <button type="button" className="chip" onClick={() => setShowTable((v) => !v)}>
          {showTable ? t.results.hideTable : t.results.showTable}
        </button>
      </div>

      {hint ? (
        <p className="border-b border-line bg-surface-subtle px-4 py-2 text-[11.5px] leading-relaxed text-ink-secondary">
          {hint}
        </p>
      ) : null}

      <div className="p-3">
        <Heatmap matrix={matrix} mode={mode} unit={unit} />
      </div>

      {showTable ? (
        <div className="max-h-[340px] overflow-auto border-t border-line">
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
                    {formatNumber(rowValue, intl, AXIS_DECIMALS[matrix.row_axis])}
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
