import type { AnalysisRequest, AssetKey, AxisName } from "../lib/api";
import { useLocale } from "../i18n/LocaleContext";
import { AxisCard } from "./AxisCard";
import { CertificateCard } from "./CertificateCard";
import { NumberField } from "./NumberField";
import { SectionCard } from "./SectionCard";

const AXES: AxisName[] = ["usd", "gold", "silver", "copper", "zinc"];

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

interface InputPanelProps {
  value: AnalysisRequest;
  onChange: (next: AnalysisRequest) => void;
}

export function InputPanel({ value, onChange }: InputPanelProps) {
  const { t } = useLocale();
  const patch = (changes: Partial<AnalysisRequest>) =>
    onChange({ ...value, ...changes });

  return (
    <div className="space-y-3">
      <SectionCard title={t.sections.scenarios} hint={t.sections.scenariosHint}>
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

      <SectionCard title={t.sections.bubble} hint={t.sections.bubbleHint}>
        <NumberField
          label={t.inputs.bubblePct}
          value={value.bubble_pct}
          onChange={(bubble_pct) => patch({ bubble_pct })}
          step={0.5}
          min={-20}
          max={40}
          decimals={2}
          suffix="٪"
        />
      </SectionCard>

      <SectionCard title={t.sections.market} hint={t.sections.marketHint}>
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
      </SectionCard>

      <SectionCard
        title={t.certificates.copper.title}
        hint={t.sections.certificateHint}
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
