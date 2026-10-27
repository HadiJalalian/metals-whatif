import type { AxisInput, AxisName } from "../lib/api";
import { AXIS_DECIMALS, formatNumber } from "../lib/format";
import { useLocale } from "../i18n/LocaleContext";
import { NumberField } from "./NumberField";

/** بازتاب ScenarioAxis.values() در سمت کلاینت، فقط برای پیش‌نمایش دامنه. */
function positiveRange(axis: AxisInput) {
  const values: number[] = [];
  for (let i = -axis.steps_down; i <= axis.steps_up; i += 1) {
    const value = axis.base + i * axis.step;
    if (value > 0) values.push(value);
  }
  return {
    count: values.length,
    min: values.length ? Math.min(...values) : 0,
    max: values.length ? Math.max(...values) : 0,
  };
}

const DOT_COLOR: Record<AxisName, string> = {
  usd: "#2f6fed",
  gold: "#b8862b",
  silver: "#8c97a3",
  copper: "#c17a3f",
  zinc: "#5c7c92",
};

interface AxisCardProps {
  name: AxisName;
  axis: AxisInput;
  onChange: (axis: AxisInput) => void;
}

export function AxisCard({ name, axis, onChange }: AxisCardProps) {
  const { t, intl } = useLocale();
  const meta = t.axes[name];
  const decimals = AXIS_DECIMALS[name];
  const range = positiveRange(axis);
  const isUsd = name === "usd";

  const patch = (changes: Partial<AxisInput>) => onChange({ ...axis, ...changes });

  return (
    <div className="rounded-xl border border-line bg-surface-subtle p-3">
      <div className="mb-2.5 flex items-center gap-2">
        <span
          className="size-2 shrink-0 rounded-full"
          style={{ background: DOT_COLOR[name] }}
          aria-hidden
        />
        <h4 className="flex-1 text-[13px] font-semibold text-ink">
          {isUsd ? `${meta.name} · ${t.common.base}` : meta.name}
        </h4>
        <span className="num rounded-full border border-line bg-surface px-2 py-0.5 text-[10.5px] text-ink-muted">
          {range.count > 0
            ? `${formatNumber(range.min, intl, decimals)} – ${formatNumber(
                range.max,
                intl,
                decimals
              )}`
            : "—"}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <NumberField
          label={t.common.base}
          value={axis.base}
          onChange={(base) => patch({ base })}
          step={name === "usd" ? 1_000 : decimals > 0 ? 10 ** -decimals * 5 : 50}
          min={0}
          decimals={decimals}
          suffix={meta.unit}
          compact
        />
        <NumberField
          label={t.common.step}
          value={axis.step}
          onChange={(step) => patch({ step })}
          step={decimals > 0 ? 0.5 : 50}
          min={decimals > 0 ? 0.01 : 1}
          decimals={decimals}
          suffix={meta.unit}
          compact
        />
        <NumberField
          label={t.common.stepsUp}
          value={axis.steps_up}
          onChange={(steps_up) => patch({ steps_up })}
          min={0}
          max={20}
        />
        <NumberField
          label={t.common.stepsDown}
          value={axis.steps_down}
          onChange={(steps_down) => patch({ steps_down })}
          min={0}
          max={20}
        />
      </div>

      <p className="mt-2 text-[11px] text-ink-muted">
        <span className="num font-medium text-ink-secondary">{range.count}</span>{" "}
        {t.common.scenarios}
      </p>
    </div>
  );
}
