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

function Chevron({ up }: { up: boolean }) {
  return (
    <svg viewBox="0 0 12 12" className="size-3" aria-hidden>
      <path
        d={up ? "M3 7.5 6 4.5 9 7.5" : "M3 4.5 6 7.5 9 4.5"}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
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
      <label htmlFor={id} className="label flex items-center gap-1 truncate">
        <span className="truncate" title={help}>
          {label}
        </span>
        {help ? (
          <span
            className="grid size-3.5 shrink-0 cursor-help place-items-center rounded-full border border-line text-[8px] font-bold text-ink-muted transition-colors hover:border-accent hover:text-accent"
            title={help}
          >
            ?
          </span>
        ) : null}
      </label>

      <div className="group flex items-stretch overflow-hidden rounded-[11px] border border-line bg-surface transition-all duration-150 focus-within:border-accent focus-within:shadow-[0_0_0_3px_var(--color-accent-soft)] hover:border-line-strong">
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
          className="num min-w-0 flex-1 bg-transparent px-2.5 py-1.5 text-[13px] font-medium text-ink outline-none"
          aria-describedby={help ? `${id}-help` : undefined}
        />
        {suffix ? (
          <span className="grid place-items-center pe-2 text-[10.5px] whitespace-nowrap text-ink-muted">
            {suffix}
          </span>
        ) : null}
        <div className="flex flex-col border-s border-line bg-surface-subtle">
          <button
            type="button"
            tabIndex={-1}
            onClick={() => nudge(1)}
            aria-label={`${label} +`}
            className="flex flex-1 cursor-pointer items-center justify-center text-ink-muted transition-colors hover:bg-accent hover:text-white active:bg-brand"
          >
            <Chevron up />
          </button>
          <span className="h-px bg-line" />
          <button
            type="button"
            tabIndex={-1}
            onClick={() => nudge(-1)}
            aria-label={`${label} −`}
            className="flex flex-1 cursor-pointer items-center justify-center text-ink-muted transition-colors hover:bg-accent hover:text-white active:bg-brand"
          >
            <Chevron up={false} />
          </button>
        </div>
      </div>

      {help ? (
        <p
          id={`${id}-help`}
          className="animate-fade-in text-[11px] leading-snug text-ink-muted"
        >
          {help}
        </p>
      ) : null}
    </div>
  );
}
