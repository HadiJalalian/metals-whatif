import { useLocale } from "../i18n/LocaleContext";
import type { Lang } from "../i18n/messages";
import { useScrolled } from "../lib/hooks";

const LANGS: { code: Lang; label: string }[] = [
  { code: "en", label: "EN" },
  { code: "fa", label: "فارسی" },
];

function Mark() {
  return (
    <span
      className="grid size-10 shrink-0 place-items-center rounded-xl bg-[linear-gradient(160deg,#17456f,#0a2138_70%)] shadow-[inset_0_1px_0_rgb(255_255_255_/_0.18),0_8px_20px_-12px_rgb(10_33_56_/_0.9)]"
      aria-hidden
    >
      <svg viewBox="0 0 32 32" className="size-6">
        <defs>
          <linearGradient id="mc-gold" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#a8721a" />
            <stop offset="100%" stopColor="#f0c260" />
          </linearGradient>
          <linearGradient id="mc-silver" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#7c8b9e" />
            <stop offset="100%" stopColor="#dbe3ec" />
          </linearGradient>
          <linearGradient id="mc-copper" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#9c5a2a" />
            <stop offset="100%" stopColor="#e0a168" />
          </linearGradient>
        </defs>
        <rect x="6" y="18" width="4.6" height="8" rx="1.6" fill="url(#mc-gold)" />
        <rect x="13.7" y="12" width="4.6" height="14" rx="1.6" fill="url(#mc-silver)" />
        <rect x="21.4" y="6" width="4.6" height="20" rx="1.6" fill="url(#mc-copper)" />
      </svg>
    </span>
  );
}

export function Header({
  busy,
  onReset,
  onGuide,
}: {
  busy: boolean;
  onReset: () => void;
  onGuide: () => void;
}) {
  const { t, lang, setLang } = useLocale();
  const scrolled = useScrolled(4);

  return (
    <header
      className={`sticky top-0 z-50 border-b bg-surface/80 backdrop-blur-xl transition-shadow duration-300 ${
        scrolled ? "border-line shadow-[0_10px_30px_-24px_rgb(10_18_32_/_0.45)]" : "border-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-[1680px] items-center gap-3 px-4 py-3 lg:px-6">
        <Mark />

        <div className="min-w-0 flex-1">
          <h1 className="flex items-baseline gap-2 truncate text-[17px] leading-tight font-extrabold tracking-tight text-ink">
            {t.brand.title}
            <span className="hidden rounded-md bg-gold-soft px-1.5 py-0.5 text-[9.5px] font-bold tracking-wide text-gold sm:inline">
              BETA
            </span>
          </h1>
          <p className="truncate text-[11.5px] text-ink-muted">{t.brand.subtitle}</p>
        </div>

        <span
          role="status"
          aria-live="polite"
          className={`chip hidden border-none bg-transparent text-[11px] md:inline-flex ${
            busy ? "text-accent" : "text-ink-muted"
          }`}
        >
          <span
            className={`size-1.5 rounded-full ${
              busy ? "animate-live bg-accent" : "bg-under"
            }`}
            aria-hidden
          />
          {busy ? t.common.live : t.common.ready}
        </span>

        <button type="button" className="chip" onClick={onGuide}>
          <svg viewBox="0 0 16 16" className="size-3.5" aria-hidden>
            <circle cx="8" cy="8" r="6.4" fill="none" stroke="currentColor" strokeWidth="1.3" />
            <path
              d="M6.3 6.2a1.8 1.8 0 0 1 3.5.6c0 1.2-1.7 1.5-1.7 2.6M8 11.6h.01"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinecap="round"
            />
          </svg>
          <span className="hidden sm:inline">{t.common.guide}</span>
        </button>

        <button type="button" className="chip" onClick={onReset}>
          <svg viewBox="0 0 16 16" className="size-3.5" aria-hidden>
            <path
              d="M13 8a5 5 0 1 1-1.6-3.7M13 2.4V5h-2.6"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="hidden sm:inline">{t.common.reset}</span>
        </button>

        <div className="segmented" role="group" aria-label={t.common.language}>
          {LANGS.map((option) => (
            <button
              key={option.code}
              type="button"
              onClick={() => setLang(option.code)}
              aria-pressed={lang === option.code}
              className={`segment cursor-pointer ${lang === option.code ? "segment-on" : ""}`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}
