import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { AnalysisResponse, AssetKey } from "./lib/api";
import { AnalysisError, DEFAULT_REQUEST, fetchAnalysis } from "./lib/api";
import type { AnalysisRequest } from "./lib/api";
import { formatNumber } from "./lib/format";
import { cellAt, indexOfBase } from "./lib/matrixStats";
import { readRequestFromLocation, shareUrl } from "./lib/share";
import { useCopy, useMediaQuery } from "./lib/hooks";
import { useLocale } from "./i18n/LocaleContext";
import { AssetTabs } from "./components/AssetTabs";
import { GuideDialog } from "./components/GuideDialog";
import { Header } from "./components/Header";
import { InputPanel } from "./components/InputPanel";
import { KpiCards } from "./components/KpiCards";
import { MatrixCard } from "./components/MatrixCard";

const INPUTS_KEY = "mwi.inputs";
const ASSET_KEY = "mwi.asset";
const GUIDE_KEY = "mwi.guide";
const DEBOUNCE_MS = 300;

const GUIDE_SEEN = "1";

function loadInputs(): AnalysisRequest {
  let stored: Partial<AnalysisRequest> | null = null;
  try {
    const raw = localStorage.getItem(INPUTS_KEY);
    if (raw) stored = JSON.parse(raw) as Partial<AnalysisRequest>;
  } catch {
    stored = null;
  }
  // لینک اشتراک بر تنظیمات محلی اولویت دارد تا دکمه «کپی لینک» گم نشود.
  return { ...DEFAULT_REQUEST, ...(stored ?? {}), ...(readRequestFromLocation() ?? {}) };
}

function loadAsset(): AssetKey {
  try {
    return (localStorage.getItem(ASSET_KEY) as AssetKey) || "gold_18k";
  } catch {
    return "gold_18k";
  }
}

function Skeleton() {
  return (
    <div className="space-y-3">
      <div className="flex gap-2.5">
        {[0, 1, 2, 3].map((index) => (
          <div key={index} className="card card-pad flex-1 basis-[170px]">
            <div className="skeleton h-3 w-20" />
            <div className="skeleton mt-2 h-6 w-28" />
          </div>
        ))}
      </div>
      <div className="card p-4">
        <div className="skeleton h-4 w-40" />
        <div className="skeleton mt-3 h-[280px] w-full" />
      </div>
    </div>
  );
}

export default function App() {
  const { t, intl } = useLocale();
  const [inputs, setInputs] = useState<AnalysisRequest>(loadInputs);
  const [active, setActive] = useState<AssetKey>(loadAsset);
  const [response, setResponse] = useState<AnalysisResponse | null>(null);
  const [error, setError] = useState<AnalysisError | null>(null);
  const [busy, setBusy] = useState(false);
  const [guideOpen, setGuideOpen] = useState(() => {
    try {
      return localStorage.getItem(GUIDE_KEY) !== GUIDE_SEEN;
    } catch {
      return false;
    }
  });
  const [sheetOpen, setSheetOpen] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const copy = useCopy();
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const requestSeq = useRef(0);

  useEffect(() => {
    try {
      localStorage.setItem(INPUTS_KEY, JSON.stringify(inputs));
      localStorage.setItem(ASSET_KEY, active);
    } catch {
      /* حالت خصوصی مرورگر */
    }
  }, [inputs, active]);

  useEffect(() => {
    const controller = new AbortController();
    const sequence = ++requestSeq.current;
    setBusy(true);

    const timer = window.setTimeout(async () => {
      try {
        const result = await fetchAnalysis(inputs, controller.signal);
        if (sequence === requestSeq.current) {
          setResponse(result);
          setError(null);
        }
      } catch (caught) {
        if ((caught as Error).name === "AbortError") return;
        if (sequence === requestSeq.current) {
          setError(
            caught instanceof AnalysisError ? caught : new AnalysisError("http")
          );
        }
      } finally {
        if (sequence === requestSeq.current) setBusy(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [inputs]);

  const closeGuide = useCallback(() => {
    setGuideOpen(false);
    try {
      localStorage.setItem(GUIDE_KEY, GUIDE_SEEN);
    } catch {
      /* حالت خصوصی مرورگر */
    }
  }, []);

  const retry = useCallback(() => setInputs((current) => ({ ...current })), []);

  const shareScenario = useCallback(() => {
    if (copy(shareUrl(inputs))) {
      setLinkCopied(true);
      window.setTimeout(() => setLinkCopied(false), 1800);
    }
  }, [copy, inputs]);

  const result = response?.[active] ?? null;
  const asset = t.assets[active];

  const bubbles = useMemo(() => {
    const out: Partial<Record<AssetKey, number | null>> = {};
    if (!response) return out;
    (Object.keys(response) as AssetKey[]).forEach((key) => {
      const matrix = response[key].bubble;
      if (!matrix) {
        out[key] = null;
        return;
      }
      const row = indexOfBase(matrix.row.values, matrix.row.base);
      const col = indexOfBase(matrix.col.values, matrix.col.base);
      out[key] = row >= 0 && col >= 0 ? cellAt(matrix, row, col) : null;
    });
    return out;
  }, [response]);

  const errorMessage = useMemo(() => {
    if (!error) return null;
    if (error.kind === "empty_axes") {
      const names = error.axes.map((key) => {
        const known = t.axes[key as keyof typeof t.axes];
        return known ? known.name : key;
      });
      return t.errors.emptyAxes(names);
    }
    if (error.kind === "validation") return t.errors.validation;
    if (error.kind === "network") return t.errors.network;
    return t.errors.http;
  }, [error, t]);

  const panel = <InputPanel value={inputs} onChange={setInputs} />;

  return (
    <div className="min-h-screen">
      <Header busy={busy} onReset={() => setInputs(DEFAULT_REQUEST)} onGuide={() => setGuideOpen(true)} />

      <main className="mx-auto grid max-w-[1680px] gap-4 p-4 lg:grid-cols-[356px_minmax(0,1fr)] lg:px-6">
        {isDesktop ? (
          <aside className="min-w-0 lg:sticky lg:top-[76px] lg:max-h-[calc(100vh-92px)] lg:overflow-y-auto lg:pe-1.5">
            {panel}
          </aside>
        ) : null}

        <div className="min-w-0 space-y-3">
          <AssetTabs active={active} onChange={setActive} bubbles={bubbles} />

          <div className="flex flex-wrap items-center gap-2 px-1">
            <button
              type="button"
              className="chip"
              onClick={shareScenario}
              title={t.common.copyLink}
            >
              <svg viewBox="0 0 16 16" className="size-3.5" aria-hidden>
                <path
                  d="M6.6 9.4a2.6 2.6 0 0 0 3.7 0l2-2a2.6 2.6 0 0 0-3.7-3.7l-.7.7M9.4 6.6a2.6 2.6 0 0 0-3.7 0l-2 2a2.6 2.6 0 0 0 3.7 3.7l.7-.7"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.3"
                  strokeLinecap="round"
                />
              </svg>
              {linkCopied ? t.common.linkCopied : t.common.copyLink}
            </button>
            {busy ? (
              <span className="h-[3px] flex-1 overflow-hidden rounded-full bg-surface-hover">
                <span className="block h-full w-1/3 animate-progress rounded-full bg-accent/70 rtl:-scale-x-100" />
              </span>
            ) : null}
          </div>

          <section
            key={active}
            className="card card-pad animate-fade-up space-y-2"
          >
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h2 className="text-[15px] font-bold text-ink">{asset.sub}</h2>
              <code className="num ms-auto rounded-md bg-surface-subtle px-2 py-1 text-[10.5px] text-ink-secondary ring-1 ring-line">
                {asset.formula}
              </code>
            </div>
            <p className="text-[12.5px] leading-relaxed text-ink-secondary">
              {asset.caption}
            </p>
          </section>

          {errorMessage ? (
            <div className="card animate-pop border-over/30 bg-over-soft p-4">
              <div className="flex flex-wrap items-center gap-3">
                <p className="flex-1 text-[12.5px] leading-relaxed text-over">
                  {errorMessage}
                </p>
                {error?.kind !== "empty_axes" ? (
                  <button type="button" className="chip" onClick={retry}>
                    {t.common.retry}
                  </button>
                ) : null}
              </div>
            </div>
          ) : null}

          {!result && !errorMessage ? <Skeleton /> : null}

          {result ? (
            <div className="space-y-3 animate-fade-in">
              <KpiCards assetKey={active} result={result} />

              <MatrixCard
                title={t.results.priceTitle}
                subtitle={t.results.priceSub}
                matrix={result.price}
                companion={result.bubble}
                marketPrice={result.market_price}
                assetLabel={asset.bubbleLabel}
                mode="price"
                unit={t.common.toman}
              />

              {result.bubble ? (
                <MatrixCard
                  title={t.results.bubbleTitle}
                  subtitle={t.results.bubbleSub}
                  hint={t.results.bubbleHint}
                  matrix={result.bubble}
                  companion={result.price}
                  marketPrice={result.market_price}
                  assetLabel={asset.bubbleLabel}
                  mode="bubble"
                  unit="٪"
                />
              ) : (
                <div className="card border-dashed p-5 text-center">
                  <p className="text-[12.5px] text-ink-secondary">{t.sections.marketHint}</p>
                  <p className="mt-1 text-[11.5px] text-ink-muted">
                    {asset.bubbleLabel}:{" "}
                    <span className="num">{formatNumber(0, intl, 0)}</span> {t.common.notSet}
                  </p>
                  <button
                    type="button"
                    className="chip chip-active mx-auto mt-3 cursor-pointer"
                    onClick={() => setSheetOpen(true)}
                  >
                    {t.common.inputs}
                  </button>
                </div>
              )}
            </div>
          ) : null}

          <footer className="px-1 pb-24 pt-1 text-center text-[11px] leading-relaxed text-ink-muted lg:pb-6">
            {t.brand.disclaimer}
            <span className="mx-2 select-none opacity-60">·</span>
            {t.brand.madeBy}
          </footer>
        </div>
      </main>

      {!isDesktop ? (
        <>
          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            className="chip chip-active fixed bottom-4 z-50 cursor-pointer px-4 py-2.5 shadow-lift"
            style={{ insetInlineStart: "1rem" }}
          >
            <svg viewBox="0 0 16 16" className="size-3.5" aria-hidden>
              <path
                d="M3 6h7M13 6h.5M3 12h.5M7 12h6M10 3.5v5M5 11.5v1.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
            </svg>
            {t.common.inputs}
          </button>

          {sheetOpen ? (
            <div
              className="fixed inset-0 z-[55] flex animate-fade-in bg-ink/35 backdrop-blur-sm"
              onClick={() => setSheetOpen(false)}
              role="presentation"
            >
              <div
                role="dialog"
                aria-modal="true"
                aria-label={t.common.inputs}
                onClick={(event) => event.stopPropagation()}
                className="mt-auto max-h-[82vh] w-full animate-slide-in overflow-y-auto rounded-t-2xl bg-canvas p-3 shadow-lift"
              >
                <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-line-strong" />
                {panel}
                <button
                  type="button"
                  className="chip chip-active mx-auto mt-3 block cursor-pointer"
                  onClick={() => setSheetOpen(false)}
                >
                  {t.common.close}
                </button>
              </div>
            </div>
          ) : null}
        </>
      ) : null}

      <GuideDialog open={guideOpen} onClose={closeGuide} />
    </div>
  );
}
