import { useCallback, useRef } from "react";
import type { AssetKey } from "../lib/api";
import { ASSET_KEYS } from "../lib/api";
import { useLocale } from "../i18n/LocaleContext";
import { formatPercent } from "../lib/format";

export const ASSET_COLOR: Record<AssetKey, string> = {
  gold_18k: "#c08a20",
  mazaneh: "#dcae42",
  silver_999: "#8fa0b4",
  silver_cert: "#b6c2d0",
  copper: "#c17a3f",
  zinc: "#5c7c92",
};

interface AssetTabsProps {
  active: AssetKey;
  onChange: (key: AssetKey) => void;
  /** حباب سناریوی پایه هر دارایی؛ null یعنی قیمت تابلو وارد نشده. */
  bubbles: Partial<Record<AssetKey, number | null>>;
}

/** ریزنقش کنار تب: جهت و اندازه فاصله بازار از مدل، در یک نگاه. */
function BubblePip({ value }: { value: number | null }) {
  const { intl } = useLocale();
  if (value === null || !Number.isFinite(value)) return null;

  const tone =
    value > 0.5 ? "text-over" : value < -0.5 ? "text-under" : "text-ink-muted";
  const glyph = value > 0.5 ? "▲" : value < -0.5 ? "▼" : "•";

  return (
    <span className={`num text-[9.5px] font-bold ${tone}`} aria-hidden>
      {glyph}
      {Math.abs(value) > 0.5 ? formatPercent(Math.abs(value), intl, 1) : ""}
    </span>
  );
}

export function AssetTabs({ active, onChange, bubbles }: AssetTabsProps) {
  const { t } = useLocale();
  const listRef = useRef<HTMLDivElement>(null);

  const move = useCallback(
    (delta: number) => {
      const index = ASSET_KEYS.indexOf(active);
      const next = ASSET_KEYS[(index + delta + ASSET_KEYS.length) % ASSET_KEYS.length];
      onChange(next);
      requestAnimationFrame(() => listRef.current?.focus({ preventScroll: true }));
    },
    [active, onChange]
  );

  return (
    <div
      ref={listRef}
      role="tablist"
      tabIndex={-1}
      onKeyDown={(event) => {
        if (event.key === "ArrowRight" || event.key === "ArrowDown") {
          event.preventDefault();
          move(1);
        }
        if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
          event.preventDefault();
          move(-1);
        }
      }}
      className="fade-edge card flex gap-1 overflow-x-auto p-1.5 outline-none focus-visible:ring-2 focus-visible:ring-accent"
    >
      {ASSET_KEYS.map((key) => {
        const selected = key === active;
        return (
          <button
            key={key}
            role="tab"
            type="button"
            aria-selected={selected}
            onClick={() => onChange(key)}
            className={`group relative flex shrink-0 cursor-pointer items-center gap-2 rounded-[11px] px-3 py-2 text-[12.5px] font-medium transition-all duration-200 ease-spring active:scale-[0.97] ${
              selected
                ? "bg-[linear-gradient(150deg,#17456f,#0d2c4b)] text-white shadow-[0_10px_22px_-14px_rgb(13_44_75_/_0.95)]"
                : "text-ink-secondary hover:bg-surface-hover hover:text-ink"
            }`}
          >
            <span
              className="size-2 shrink-0 rounded-full transition-transform duration-200 group-hover:scale-125"
              style={{
                background: ASSET_COLOR[key],
                boxShadow: selected ? "0 0 0 2px rgb(255 255 255 / .4)" : undefined,
              }}
              aria-hidden
            />
            {t.assets[key].tab}
            {selected ? null : <BubblePip value={bubbles[key] ?? null} />}
          </button>
        );
      })}
    </div>
  );
}
