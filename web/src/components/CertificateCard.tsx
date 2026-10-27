import type { CertificateParams } from "../lib/api";
import { useLocale } from "../i18n/LocaleContext";
import { NumberField } from "./NumberField";

interface CertificateCardProps {
  name: "copper" | "zinc" | "silver_cert";
  params: CertificateParams;
  onChange: (params: CertificateParams) => void;
}

export function CertificateCard({ name, params, onChange }: CertificateCardProps) {
  const { t } = useLocale();
  const copy = t.certificates[name];
  const patch = (changes: Partial<CertificateParams>) =>
    onChange({ ...params, ...changes });

  return (
    <div className="space-y-3">
      <NumberField
        label={t.common.premium}
        value={params.premium_pct}
        onChange={(premium_pct) => patch({ premium_pct })}
        step={0.5}
        min={-40}
        max={40}
        decimals={2}
        suffix="٪"
        help={copy.premiumHelp}
      />

      <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-line bg-surface-subtle px-3 py-2 transition-colors hover:border-line-strong">
        <input
          type="checkbox"
          checked={params.include_costs}
          onChange={(event) => patch({ include_costs: event.target.checked })}
          className="peer sr-only"
        />
        <span
          className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-200 peer-focus-visible:ring-2 peer-focus-visible:ring-accent-soft ${
            params.include_costs ? "bg-accent" : "bg-line-strong"
          }`}
          aria-hidden
        >
          <span
            className={`absolute h-4 w-4 rounded-full bg-surface shadow-sm transition-[inset-inline-start] duration-200 ease-spring ${
              params.include_costs ? "start-[18px]" : "start-0.5"
            }`}
          />
        </span>
        <span className="text-[12.5px] font-medium text-ink-secondary">
          {t.common.includeCosts}
        </span>
      </label>

      {params.include_costs ? (
        <div className="grid animate-slide-in grid-cols-2 gap-2.5 border-s-2 border-accent-soft ps-3">
          <NumberField
            label={t.common.vat}
            value={params.vat_pct}
            onChange={(vat_pct) => patch({ vat_pct })}
            step={0.5}
            min={0}
            max={100}
            decimals={2}
            compact
          />
          <NumberField
            label={t.common.fee}
            value={params.fee_pct}
            onChange={(fee_pct) => patch({ fee_pct })}
            step={0.01}
            min={0}
            max={100}
            decimals={2}
            compact
          />
        </div>
      ) : null}

      {copy.caption ? (
        <p className="text-[11px] leading-relaxed text-ink-muted">{copy.caption}</p>
      ) : null}
    </div>
  );
}
