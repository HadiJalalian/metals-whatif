import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { AnalysisResponse, AssetKey } from "./lib/api";
import { AnalysisError, DEFAULT_REQUEST, fetchAnalysis } from "./lib/api";
import type { AnalysisRequest } from "./lib/api";
import { formatNumber } from "./lib/format";
import { useLocale } from "./i18n/LocaleContext";
import { AssetTabs } from "./components/AssetTabs";
import { Header } from "./components/Header";
import { InputPanel } from "./components/InputPanel";
import { KpiCards } from "./components/KpiCards";
import { MatrixCard } from "./components/MatrixCard";

const INPUTS_KEY = "mwi.inputs";
const ASSET_KEY = "mwi.asset";
const DEBOUNCE_MS = 300;

function loadInputs(): AnalysisRequest {
  try {
    const raw = localStorage.getItem(INPUTS_KEY);
    if (!raw) return DEFAULT_REQUEST;
    return { ...DEFAULT_REQUEST, ...(JSON.parse(raw) as AnalysisRequest) };
  } catch {
    return DEFAULT_REQUEST;
  }
}

function loadAsset(): AssetKey {
  try {
    return (localStorage.getItem(ASSET_KEY) as AssetKey) || "gold_18k";
  } catch {
    return "gold_18k";
  }
}

export default function App() {
  const { t, intl } = useLocale();
  const [inputs, setInputs] = useState<AnalysisRequest>(loadInputs);
  const [active, setActive] = useState<AssetKey>(loadAsset);
  const [response, setResponse] = useState<AnalysisResponse | null>(null);
  const [error, setError] = useState<AnalysisError | null>(null);
  const [busy, setBusy] = useState(false);
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

  const retry = useCallback(() => setInputs((current) => ({ ...current })), []);

  const result = response?.[active] ?? null;
  const asset = t.assets[active];

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

  return (
    <div className="min-h-screen bg-canvas">
      <Header onReset={() => setInputs(DEFAULT_REQUEST)} busy={busy} />

      <main className="mx-auto grid max-w-[1600px] gap-4 p-4 lg:grid-cols-[350px_minmax(0,1fr)] lg:px-6">
        <aside className="min-w-0 lg:sticky lg:top-[69px] lg:max-h-[calc(100vh-85px)] lg:overflow-y-auto lg:pe-1">
          <InputPanel value={inputs} onChange={setInputs} />
        </aside>

        <div className="min-w-0 space-y-3">
          <AssetTabs active={active} onChange={setActive} />

          <div className="card card-pad space-y-2">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h2 className="text-[15px] font-bold text-ink">{asset.sub}</h2>
              <code className="num ms-auto rounded-md bg-surface-subtle px-2 py-1 text-[10.5px] text-ink-secondary ring-1 ring-line">
                {asset.formula}
              </code>
            </div>
            <p className="text-[12px] leading-relaxed text-ink-secondary">
              {asset.caption}
            </p>
          </div>

          {errorMessage ? (
            <div className="card border-over/30 bg-over/5 p-4">
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

          {result ? (
            <>
              <KpiCards assetKey={active} result={result} />

              <MatrixCard
                title={t.results.priceTitle}
                matrix={result.price}
                mode="price"
                unit={t.common.toman}
              />

              {result.bubble ? (
                <MatrixCard
                  title={t.results.bubbleTitle}
                  hint={t.results.bubbleHint}
                  matrix={result.bubble}
                  mode="bubble"
                  unit="٪"
                />
              ) : (
                <div className="card border-dashed p-4 text-center">
                  <p className="text-[12.5px] text-ink-secondary">
                    {t.sections.marketHint}
                  </p>
                  <p className="mt-1 text-[11.5px] text-ink-muted">
                    {asset.bubbleLabel}:{" "}
                    <span className="num">{formatNumber(0, intl, 0)}</span>{" "}
                    {t.common.notSet}
                  </p>
                </div>
              )}
            </>
          ) : !errorMessage ? (
            <div className="card grid h-64 place-items-center">
              <span className="flex items-center gap-2.5 text-[13px] text-ink-muted">
                <span className="size-4 animate-spin rounded-full border-2 border-line-strong border-t-accent" />
                {t.common.loading}
              </span>
            </div>
          ) : null}

          <p className="px-1 pb-2 text-center text-[11px] text-ink-muted">
            {t.brand.disclaimer}
            <span className="mx-2 select-none opacity-70">@themohammadm</span>
          </p>
        </div>
      </main>
    </div>
  );
}
