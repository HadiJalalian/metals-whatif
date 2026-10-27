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
  gold: "#c08a20",
  silver: "#8fa0b4",
  copper: "#c17a3f",
  zinc: "#5c7c92",
};

function Stepper({
  label,
  value,
  onChange,
  tone,
}: {
  label: string;
  value: number;
  onChange: (next: number) => void;
  tone: "up" | "down";
}) {
  const bump = (delta: number) => onChange(Math.max(0, Math.min(20, value + delta)));

  return (
    <div className="flex flex-1 items-center justify-between gap-1 rounded-[9px] border border-line bg-surface px-2 py-1">
      <span className="label truncate">{label}</span>
      <span className="flex items-center gap-0.5">
        <button
          type="button"
          onClick={() => bump(-1)}
          aria-label={`${label} −`}
          className="grid size-5 cursor-pointer place-items-center rounded-[6px] text-[13px] leading-none text-ink-secondary transition-colors hover:bg-over-soft hover:text-over active:scale-90"
        >
          −
        </button>
        <span
          className={`num w-5 text-center text-[12.5px] font-bold ${
            tone === "up" ? "text-under" : "text-over"
          }`}
        >
          {value}
        </span>
        <button
          type="button"
          onClick={() => bump(1)}
          aria-label={`${label} +`}
          className="grid size-5 cursor-pointer place-items-center rounded-[6px] text-[13px] leading-none text-ink-secondary transition-colors hover:bg-under-soft hover:text-under active:scale-90"
        >
          +
        </button>
      </span>
    </div>
  );
}

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
  const total = axis.steps_down + axis.steps_up + 1;
  const basePosition = ((axis.steps_down + 0.5) / total) * 100;

  const patch = (changes: Partial<AxisInput>) => onChange({ ...axis, ...changes });

  return (
    <div className="rounded-xl border border-line bg-surface-subtle p-3 transition-colors duration-200 hover:border-line-strong">
      <div className="mb-2 flex items-center gap-2">
        <span
          className="size-2 shrink-0 rounded-full"
          style={{ background: DOT_COLOR[name] }}
          aria-hidden
        />
        <h4 className="flex-1 truncate text-[13px] font-semibold text-ink">
          {meta.name}
        </h4>
        <span className="num rounded-full border border-line bg-surface px-2 py-0.5 text-[10px] font-semibold text-ink-secondary">
          {range.count} {t.common.scenarios}
        </span>
      </div>

      {/* ریل دامنه: هر تیک یک سناریو، تیک پررنگ = پایه. */}
      <div className="mb-2.5">
        <div className="relative h-4">
          <div className="absolute inset-x-0 top-1.5 flex h-1.5 gap-[1px]">
            {Array.from({ length: total }).map((_, index) => (
              <span
                key={index}
                className={`h-full flex-1 rounded-full transition-colors duration-200 ${
                  index === axis.steps_down ? "bg-brand" : "bg-line-strong/60"
                }`}
              />
            ))}
          </div>
          <span
            className="absolute top-0 h-4 w-0.5 rounded-full bg-brand-strong"
            style={{ insetInlineStart: `${basePosition}%`, marginInlineStart: "-1px" }}
            aria-hidden
          />
        </div>
        <div className="mt-1 flex justify-between text-[9px] text-ink-muted">
          <span className="num">
            {range.count ? formatNumber(range.min, intl, decimals) : "—"}
          </span>
          <span className="num">
            {range.count ? formatNumber(range.max, intl, decimals) : "—"}
          </span>
        </div>
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
      </div>

      <div className="mt-2.5 flex gap-2">
        <Stepper
          label={t.common.stepsDown}
          value={axis.steps_down}
          onChange={(steps_down) => patch({ steps_down })}
          tone="down"
        />
        <Stepper
          label={t.common.stepsUp}
          value={axis.steps_up}
          onChange={(steps_up) => patch({ steps_up })}
          tone="up"
        />
      </div>
    </div>
  );
}
