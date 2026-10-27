import { useLocale } from "../i18n/LocaleContext";

export function Header({
  onReset,
  busy,
}: {
  onReset: () => void;
  busy: boolean;
}) {
  const { t, lang, toggle } = useLocale();

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-surface/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1600px] items-center gap-3 px-4 py-3 lg:px-6">
        <span
          className="grid size-9 shrink-0 place-items-center rounded-[10px] bg-brand"
          aria-hidden
        >
          <svg viewBox="0 0 32 32" className="size-5">
            <rect x="7" y="17" width="4" height="8" rx="1.5" fill="#F0B429" />
            <rect x="14" y="12" width="4" height="13" rx="1.5" fill="#94A3B8" />
            <rect x="21" y="7" width="4" height="18" rx="1.5" fill="#38BDF8" />
          </svg>
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-[15px] leading-tight font-bold text-ink">
            {t.brand.title}
          </h1>
          <p className="truncate text-[11.5px] text-ink-muted">{t.brand.subtitle}</p>
        </div>

        {busy ? (
          <span
            className="size-3.5 shrink-0 animate-spin rounded-full border-2 border-line-strong border-t-accent"
            aria-label={t.common.loading}
          />
        ) : null}

        <button type="button" className="chip" onClick={onReset}>
          {t.common.reset}
        </button>
        <button
          type="button"
          className="chip chip-active"
          onClick={toggle}
          aria-label="Switch language"
        >
          <svg viewBox="0 0 16 16" className="size-3.5" aria-hidden>
            <circle
              cx="8"
              cy="8"
              r="6.4"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.3"
            />
            <path
              d="M1.6 8h12.8M8 1.6c1.8 2 2.7 4.1 2.7 6.4S9.8 12.4 8 14.4C6.2 12.4 5.3 10.3 5.3 8s.9-4.4 2.7-6.4Z"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.3"
            />
          </svg>
          {t.common.languageName}
        </button>
        <span className="hidden text-[11px] text-ink-muted lg:inline">
          {lang === "fa" ? "فارسی" : "English"}
        </span>
      </div>
    </header>
  );
}
