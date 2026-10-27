import type { ReactNode } from "react";
import type { AssetKey, AssetResult, MatrixPayload } from "../lib/api";
import {
  formatCompact,
  formatNumber,
  formatSignedPercent,
} from "../lib/format";
import { cellAt, indexOfBase, summarize } from "../lib/matrixStats";
import { useTween } from "../lib/hooks";
import { useLocale } from "../i18n/LocaleContext";
import { ASSET_COLOR } from "./AssetTabs";

const TONE: Record<string, string> = {
  ink: "text-ink",
  over: "text-over",
  under: "text-under",
  muted: "text-ink-muted",
};

/** خانه‌های KPI نرم به مقدار جدید می‌رسند؛ حس «زنده بودن» بدون پرش عدد. */
function Money({
  value,
  kind,
}: {
  value: number | null;
  kind: "compact" | "exact" | "percent";
}) {
  const { intl } = useLocale();
  const shown = useTween(value ?? 0);
  if (value === null || !Number.isFinite(value)) return <>—</>;
  if (kind === "compact") return <>{formatCompact(shown, intl)}</>;
  if (kind === "percent") return <>{formatSignedPercent(shown, intl)}</>;
  return <>{formatNumber(shown, intl, 0)}</>;
}

/** مسیر کوچک USD در سطر پایه؛ در فارسی قرینه می‌شود تا با شبکه هم‌جهت بماند. */
function Sparkline({ matrix, color }: { matrix: MatrixPayload; color: string }) {
  const row = indexOfBase(matrix.row.values, matrix.row.base);
  const line = row >= 0 ? matrix.values[row] : undefined;
  if (!line) return null;

  const points = line.filter((value): value is number => value !== null);
  if (points.length < 2) return null;

  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min || 1;
  const step = 100 / (line.length - 1);
  const path = line
    .map((value, index) => {
      if (value === null) return "";
      const y = 26 - ((value - min) / span) * 22;
      return `${index === 0 ? "M" : "L"}${(index * step).toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ")
    .trim();
  if (!path) return null;

  return (
    <svg
      viewBox="0 0 100 30"
      preserveAspectRatio="none"
      className="mt-2 h-8 w-full overflow-visible rtl:-scale-x-100"
      aria-hidden
    >
      <path d={`${path} L100 30 L0 30 Z`} fill={color} opacity="0.10" />
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

interface KpiProps {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  tone?: keyof typeof TONE;
  accent?: string;
  children?: ReactNode;
}

function Kpi({ label, value, hint, tone = "ink", accent, children }: KpiProps) {
  return (
    <div className="card card-lift card-pad min-w-0 flex-1 basis-[170px]">
      <div className="flex items-center gap-1.5">
        {accent ? (
          <span
            className="size-1.5 rounded-full"
            style={{ background: accent }}
            aria-hidden
          />
        ) : null}
        <p className="label truncate">{label}</p>
      </div>
      <p className={`num mt-1 text-[20px] leading-tight font-extrabold ${TONE[tone]}`}>
        {value}
      </p>
      {hint ? (
        <p className="mt-0.5 truncate text-[10.5px] text-ink-muted">{hint}</p>
      ) : null}
      {children}
    </div>
  );
}

export function KpiCards({
  assetKey,
  result,
}: {
  assetKey: AssetKey;
  result: AssetResult;
}) {
  const { t, intl } = useLocale();
  const asset = t.assets[assetKey];
  const toman = t.common.toman;

  const price = summarize(result.price);
  const row = indexOfBase(result.price.row.values, result.price.row.base);
  const col = indexOfBase(result.price.col.values, result.price.col.base);
  const bubbleAtBase =
    result.bubble && row >= 0 && col >= 0 ? cellAt(result.bubble, row, col) : null;

  const hasMarket = result.market_price > 0;
  const known = bubbleAtBase !== null && Number.isFinite(bubbleAtBase);
  const tone: keyof typeof TONE = !known
    ? "muted"
    : (bubbleAtBase as number) > 0.5
      ? "over"
      : (bubbleAtBase as number) < -0.5
        ? "under"
        : "ink";

  const spread = price.max - price.min;
  const basePosition =
    price.atBase === null || spread <= 0
      ? 50
      : Math.min(100, Math.max(0, ((price.atBase - price.min) / spread) * 100));

  return (
    <div className="flex flex-wrap gap-2.5">
      <Kpi
        label={t.results.fairAtBase}
        accent={ASSET_COLOR[assetKey]}
        value={
          price.atBase === null ? (
            "—"
          ) : (
            <>
              <Money value={price.atBase} kind="compact" /> {toman}
            </>
          )
        }
        hint={price.atBase === null ? undefined : <Money value={price.atBase} kind="exact" />}
      >
        <Sparkline matrix={result.price} color={ASSET_COLOR[assetKey]} />
      </Kpi>

      <Kpi
        label={t.results.marketPrice}
        value={
          hasMarket ? (
            <>
              <Money value={result.market_price} kind="compact" /> {toman}
            </>
          ) : (
            "—"
          )
        }
        hint={hasMarket ? asset.bubbleLabel : t.results.noBoardPrice}
        tone={hasMarket ? "ink" : "muted"}
      />

      <Kpi
        label={t.results.bubbleAtBase}
        value={
          !known ? (
            t.common.noBubble
          ) : (
            <>
              <Money value={bubbleAtBase} kind="percent" /> ٪
            </>
          )
        }
        hint={
          !known
            ? undefined
            : (bubbleAtBase as number) > 0
              ? t.common.overpriced
              : (bubbleAtBase as number) < 0
                ? t.common.underpriced
                : t.common.balanced
        }
        tone={tone}
      />

      <Kpi
        label={t.results.range}
        value={
          <>
            <Money value={price.min} kind="compact" /> – <Money value={price.max} kind="compact" />
          </>
        }
        hint={`${toman} · ${asset.unitLabel}`}
      >
        <div className="mt-2.5">
          <div className="relative h-1.5 rounded-full bg-surface-hover">
            <span
              className="absolute top-1/2 h-2.5 w-2.5 rounded-full border-2 border-surface bg-brand shadow-sm transition-[inset-inline-start] duration-500 ease-spring"
              style={{
                insetInlineStart: `${basePosition}%`,
                marginInlineStart: "-5px",
                marginTop: "-5px",
              }}
              title={t.results.fairAtBase}
            />
          </div>
          <div className="mt-1 flex justify-between text-[9.5px] text-ink-muted">
            <span className="num">{formatCompact(price.min, intl)}</span>
            <span className="num">{formatCompact(price.max, intl)}</span>
          </div>
        </div>
      </Kpi>
    </div>
  );
}
