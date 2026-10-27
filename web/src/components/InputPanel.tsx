import type { AnalysisRequest, AssetKey, AxisName } from "../lib/api";
import { formatNumber } from "../lib/format";
import { useLocale } from "../i18n/LocaleContext";
import { AxisCard } from "./AxisCard";
import { CertificateCard } from "./CertificateCard";
import { NumberField } from "./NumberField";
import { SectionCard } from "./SectionCard";

const AXES: AxisName[] = ["usd", "gold", "silver", "copper", "zinc"];

const DENSITIES = [
  { key: "quick", steps: 2 },
  { key: "standard", steps: 4 },
  { key: "fine", steps: 8 },
] as const;

type DensityKey = (typeof DENSITIES)[number]["key"];

// گام‌ها mirrors _MARKET_PRICE_FIELDS در UI استریم‌لیت.
const MARKET_FIELDS: {
  key: AssetKey;
  step: number;
  rialHelp?: boolean;
}[] = [
  { key: "gold_18k", step: 10_000 },
  { key: "mazaneh", step: 50_000 },
  { key: "silver_999", step: 1_000 },
  { key: "silver_cert", step: 100, rialHelp: true },
  { key: "copper", step: 1_000 },
  { key: "zinc", step: 1_000, rialHelp: true },
];

function Icon({ path }: { path: string }) {
  return (
    <svg viewBox="0 0 20 20" className="size-4" aria-hidden>
      <path
        d={path}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const ICONS = {
  axes: "M3 6h8M15 6h2M3 14h2M9 14h8M13 3.5v5M5 11.5v5",
  bubble: "M10 3.2c2.6 3 4 4.9 4 6.8a4 4 0 1 1-8 0c0-1.9 1.4-3.8 4-6.8Z",
  market: "M3 14.5 7 9l3 2.5L16 5M12 5h4v4",
  costs: "M5 3.5h10v13l-2.5-1.6-2.5 1.6-2.5-1.6L5 16.5Z",
};

interface InputPanelProps {
  value: AnalysisRequest;
  onChange: (next: AnalysisRequest) => void;
}

export function InputPanel({ value, onChange }: InputPanelProps) {
  const { t, intl } = useLocale();
  const patch = (changes: Partial<AnalysisRequest>) =>
    onChange({ ...value, ...changes });

  const density = DENSITIES.find(
    (option) =>
      AXES.every(
        (name) =>
          value[name].steps_up === option.steps &&
          value[name].steps_down === option.steps
      )
  )?.key;

  const applyDensity = (steps: number) =>
    onChange({
      ...value,
      ...Object.fromEntries(
        AXES.map((name) => [
          name,
          { ...value[name], steps_up: steps, steps_down: steps },
        ])
      ),
    });

  const bubbleBounds = { min: -20, max: 40 };

  return (
    <div className="space-y-3">
      <SectionCard
        title={t.sections.scenarios}
        hint={t.sections.scenariosHint}
        icon={<Icon path={ICONS.axes} />}
      >
        <div className="mb-3 rounded-xl border border-line bg-surface-subtle p-2.5">
          <p className="label mb-2">{t.presets.label}</p>
          <div className="flex gap-1.5">
            {DENSITIES.map((option) => (
              <button
                key={option.key}
                type="button"
                onClick={() => applyDensity(option.steps)}
                aria-pressed={density === option.key}
                className={`flex-1 cursor-pointer rounded-[9px] border px-2 py-1.5 text-[11.5px] font-semibold transition-all duration-200 ease-spring active:scale-[0.97] ${
                  density === option.key
                    ? "border-brand bg-brand text-white shadow-[0_8px_18px_-12px_rgb(16_48_79_/_0.9)]"
                    : "border-line bg-surface text-ink-secondary hover:border-line-strong hover:text-ink"
                }`}
              >
                {t.presets[option.key as DensityKey].name}
              </button>
            ))}
          </div>
          {density ? (
            <p className="mt-1.5 text-center text-[10.5px] text-ink-muted">
              {t.presets[density].hint}
            </p>
          ) : null}
        </div>

        <div className="space-y-2.5">
          {AXES.map((name) => (
            <AxisCard
              key={name}
              name={name}
              axis={value[name]}
              onChange={(axis) => patch({ [name]: axis } as Partial<AnalysisRequest>)}
            />
          ))}
        </div>
      </SectionCard>

      <SectionCard
        title={t.sections.bubble}
        hint={t.sections.bubbleHint}
        icon={<Icon path={ICONS.bubble} />}
      >
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <input
              type="range"
              min={bubbleBounds.min}
              max={bubbleBounds.max}
              step={0.5}
              value={Math.min(
                bubbleBounds.max,
                Math.max(bubbleBounds.min, value.bubble_pct)
              )}
              onChange={(event) => patch({ bubble_pct: Number(event.target.value) })}
              aria-label={t.inputs.bubblePct}
              className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-[linear-gradient(90deg,var(--color-under),var(--color-line-strong)_45%,var(--color-over))] accent-[var(--color-accent)]"
            />
          </div>
          <div className="w-[120px] shrink-0">
            <NumberField
              label={t.inputs.bubblePct}
              value={value.bubble_pct}
              onChange={(bubble_pct) => patch({ bubble_pct })}
              step={0.5}
              min={bubbleBounds.min}
              max={bubbleBounds.max}
              decimals={2}
              suffix="٪"
              compact
            />
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title={t.sections.market}
        hint={t.sections.marketHint}
        icon={<Icon path={ICONS.market} />}
      >
        <div className="grid grid-cols-2 gap-2.5">
          {MARKET_FIELDS.map((field) => (
            <NumberField
              key={field.key}
              label={t.inputs.market[field.key]}
              value={value.market_prices[field.key]}
              onChange={(price) =>
                patch({
                  market_prices: { ...value.market_prices, [field.key]: price },
                })
              }
              step={field.step}
              min={0}
              suffix={t.common.toman}
              help={field.rialHelp ? t.inputs.rialHelp : undefined}
              compact
            />
          ))}
        </div>
        <p className="mt-2.5 text-[10.5px] leading-relaxed text-ink-muted">
          {t.inputs.boardFilled(
            formatNumber(
              MARKET_FIELDS.filter((field) => value.market_prices[field.key] > 0).length,
              intl,
              0
            ),
            formatNumber(MARKET_FIELDS.length, intl, 0)
          )}
        </p>
      </SectionCard>

      <SectionCard
        title={t.certificates.copper.title}
        hint={t.sections.certificateHint}
        icon={<Icon path={ICONS.costs} />}
        defaultOpen={false}
      >
        <CertificateCard
          name="copper"
          params={value.copper_params}
          onChange={(copper_params) => patch({ copper_params })}
        />
      </SectionCard>

      <SectionCard
        title={t.certificates.zinc.title}
        icon={<Icon path={ICONS.costs} />}
        defaultOpen={false}
      >
        <CertificateCard
          name="zinc"
          params={value.zinc_params}
          onChange={(zinc_params) => patch({ zinc_params })}
        />
      </SectionCard>

      <SectionCard
        title={t.certificates.silver_cert.title}
        icon={<Icon path={ICONS.costs} />}
        defaultOpen={false}
      >
        <CertificateCard
          name="silver_cert"
          params={value.silver_cert_params}
          onChange={(silver_cert_params) => patch({ silver_cert_params })}
        />
      </SectionCard>
    </div>
  );
}
