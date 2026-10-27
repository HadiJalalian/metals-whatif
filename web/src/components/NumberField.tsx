import { useEffect, useId, useState } from "react";

interface NumberFieldProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  step?: number;
  min?: number;
  max?: number;
  /** ارقام اعشار در نمایش؛ برای ورودی‌های صحیح ۰ */
  decimals?: number;
  suffix?: string;
  help?: string;
  compact?: boolean;
}

function clamp(value: number, min?: number, max?: number): number {
  let next = value;
  if (min !== undefined && next < min) next = min;
  if (max !== undefined && next > max) next = max;
  return next;
}

function display(value: number, decimals: number): string {
  return decimals > 0 ? value.toFixed(decimals).replace(/\.0+$/, "") : String(value);
}

/** ورودی عددی با استپر؛ متن محلی اجازه می‌دهد کاربر حین تایپ مقدار خالی ببیند. */
export function NumberField({
  label,
  value,
  onChange,
  step = 1,
  min,
  max,
  decimals = 0,
  suffix,
  help,
  compact = false,
}: NumberFieldProps) {
  const id = useId();
  const [text, setText] = useState(() => display(value, decimals));
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (!isFocused) setText(display(value, decimals));
  }, [value, decimals, isFocused]);

  const commit = (raw: string) => {
    const parsed = Number(raw.replace(/[^\d.eE+-]/g, ""));
    if (Number.isFinite(parsed)) onChange(clamp(parsed, min, max));
    else setText(display(value, decimals));
  };

  const nudge = (direction: 1 | -1) => {
    const next = clamp(value + direction * step, min, max);
    onChange(next);
    setText(display(next, decimals));
  };

  return (
    <div className={compact ? "space-y-1" : "space-y-1.5"}>
      <label htmlFor={id} className="label block truncate" title={help}>
        {label}
      </label>
      <div
        className="flex items-stretch overflow-hidden rounded-[9px] border border-line bg-surface transition-colors focus-within:border-accent focus-within:ring-[3px] focus-within:ring-accent-soft hover:border-line-strong"
      >
        <input
          id={id}
          type="text"
          inputMode="decimal"
          value={text}
          onFocus={() => setIsFocused(true)}
          onBlur={(event) => {
            setIsFocused(false);
            commit(event.target.value);
          }}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") (event.target as HTMLInputElement).blur();
            if (event.key === "ArrowUp") {
              event.preventDefault();
              nudge(1);
            }
            if (event.key === "ArrowDown") {
              event.preventDefault();
              nudge(-1);
            }
          }}
          className="num min-w-0 flex-1 bg-transparent px-2.5 py-1.5 text-[13px] text-ink outline-none"
          aria-describedby={help ? `${id}-help` : undefined}
        />
        {suffix ? (
          <span className="grid place-items-center pe-2 text-[11px] text-ink-muted">
            {suffix}
          </span>
        ) : null}
        <div className="flex flex-col border-s border-line">
          <button
            type="button"
            tabIndex={-1}
            onClick={() => nudge(1)}
            aria-label={`${label} +`}
            className="flex-1 cursor-pointer bg-surface-subtle px-2 text-[10px] leading-none text-ink-secondary transition-colors hover:bg-accent-soft hover:text-accent active:bg-accent active:text-white"
          >
            ▲
          </button>
          <span className="h-px bg-line" />
          <button
            type="button"
            tabIndex={-1}
            onClick={() => nudge(-1)}
            aria-label={`${label} −`}
            className="flex-1 cursor-pointer bg-surface-subtle px-2 text-[10px] leading-none text-ink-secondary transition-colors hover:bg-accent-soft hover:text-accent active:bg-accent active:text-white"
          >
            ▼
          </button>
        </div>
      </div>
      {help ? (
        <p id={`${id}-help`} className="text-[11px] leading-snug text-ink-muted">
          {help}
        </p>
      ) : null}
    </div>
  );
}
