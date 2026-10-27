import type { AssetKey, AssetResult } from "../lib/api";
import { formatCompact, formatNumber, formatSignedPercent } from "../lib/format";
import { cellAt, indexOfBase, summarize } from "../lib/matrixStats";
import { useLocale } from "../i18n/LocaleContext";

interface CardProps {
  label: string;
  value: string;
  hint?: string;
  tone?: "ink" | "over" | "under" | "muted";
}

const TONE_CLASS: Record<NonNullable<CardProps["tone"]>, string> = {
  ink: "text-ink",
  over: "text-over",
  under: "text-under",
  muted: "text-ink-muted",
};

function Kpi({ label, value, hint, tone = "ink" }: CardProps) {
  return (
    <div className="card card-pad min-w-0 flex-1">
      <p className="label truncate">{label}</p>
      <p className={`num mt-1 text-[19px] leading-tight font-bold ${TONE_CLASS[tone]}`}>
        {value}
      </p>
      {hint ? (
        <p className="mt-0.5 truncate text-[10.5px] text-ink-muted">{hint}</p>
      ) : null}
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
  const tone =
    bubbleAtBase === null || !Number.isFinite(bubbleAtBase)
      ? "muted"
      : bubbleAtBase > 0.5
        ? "over"
        : bubbleAtBase < -0.5
          ? "under"
          : "ink";

  return (
    <div className="flex flex-wrap gap-2.5">
      <Kpi
        label={t.results.fairAtBase}
        value={
          price.atBase === null
            ? "—"
            : `${formatCompact(price.atBase, intl)} ${toman}`
        }
        hint={
          price.atBase === null
            ? undefined
            : formatNumber(price.atBase, intl, 0)
        }
      />
      <Kpi
        label={t.results.marketPrice}
        value={hasMarket ? `${formatCompact(result.market_price, intl)} ${toman}` : "—"}
        hint={asset.bubbleLabel}
        tone={hasMarket ? "ink" : "muted"}
      />
      <Kpi
        label={t.results.bubbleAtBase}
        value={
          bubbleAtBase === null || !Number.isFinite(bubbleAtBase)
            ? t.common.noBubble
            : `${formatSignedPercent(bubbleAtBase, intl)} ٪`
        }
        hint={
          bubbleAtBase === null || !Number.isFinite(bubbleAtBase)
            ? undefined
            : bubbleAtBase > 0
              ? t.common.overpriced
              : bubbleAtBase < 0
                ? t.common.underpriced
                : t.common.balanced
        }
        tone={tone}
      />
      <Kpi
        label={t.results.range}
        value={`${formatCompact(price.min, intl)} – ${formatCompact(price.max, intl)}`}
        hint={`${toman} · ${asset.unitLabel}`}
      />
    </div>
  );
}
