import type { AssetKey } from "../lib/api";
import { ASSET_KEYS } from "../lib/api";
import { useLocale } from "../i18n/LocaleContext";

export const ASSET_COLOR: Record<AssetKey, string> = {
  gold_18k: "#b8862b",
  mazaneh: "#d4a12f",
  silver_999: "#94a3b8",
  silver_cert: "#c3ccd6",
  copper: "#c17a3f",
  zinc: "#5c7c92",
};

export function AssetTabs({
  active,
  onChange,
}: {
  active: AssetKey;
  onChange: (key: AssetKey) => void;
}) {
  const { t } = useLocale();

  return (
    <div
      role="tablist"
      className="flex flex-wrap gap-1.5 rounded-xl border border-line bg-surface p-1.5"
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
            className={`flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-[12.5px] font-medium transition-all duration-150 ${
              selected
                ? "bg-brand text-white shadow-sm"
                : "text-ink-secondary hover:bg-surface-subtle hover:text-ink"
            }`}
          >
            <span
              className="size-2 shrink-0 rounded-full ring-2"
              style={{
                background: ASSET_COLOR[key],
                // در حالت انتخاب حلقه سفید رنگ را از پس‌زمینه تیره جدا می‌کند.
                "--tw-ring-color": selected ? "rgb(255 255 255 / .35)" : "transparent",
              } as React.CSSProperties}
              aria-hidden
            />
            {t.assets[key].tab}
          </button>
        );
      })}
    </div>
  );
}
