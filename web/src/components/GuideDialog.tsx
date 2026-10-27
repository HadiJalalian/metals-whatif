import { useEffect, useRef } from "react";
import { useLocale } from "../i18n/LocaleContext";

export function GuideDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useLocale();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] grid place-items-center bg-ink/35 p-4 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t.guide.title}
        onClick={(event) => event.stopPropagation()}
        className="card w-full max-w-[560px] animate-pop p-5 shadow-lift"
      >
        <div className="flex items-start gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[linear-gradient(160deg,#17456f,#0a2138_70%)] text-white">
            <svg viewBox="0 0 20 20" className="size-5" aria-hidden>
              <path
                d="M3 15V5.5C3 4.7 3.7 4.2 4.4 4.5L10 7l5.6-2.5c.7-.3 1.4.2 1.4 1V15"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path d="M10 7v8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-[15px] font-bold text-ink">{t.guide.title}</h2>
            <p className="mt-1 text-[12.5px] leading-relaxed text-ink-secondary">
              {t.guide.lead}
            </p>
          </div>
        </div>

        <ol className="mt-4 space-y-3">
          {t.guide.steps.map((step, index) => (
            <li
              key={step.title}
              className="flex gap-3 rounded-xl border border-line bg-surface-subtle p-3"
              style={{ animation: `pop 0.34s var(--ease-spring) both`, animationDelay: `${index * 70}ms` }}
            >
              <span className="num grid size-6 shrink-0 place-items-center rounded-full bg-brand text-[11px] font-bold text-white">
                {index + 1}
              </span>
              <div className="min-w-0">
                <h3 className="text-[12.5px] font-bold text-ink">{step.title}</h3>
                <p className="mt-0.5 text-[11.5px] leading-relaxed text-ink-secondary">
                  {step.body}
                </p>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-4 flex justify-end">
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="chip chip-active cursor-pointer"
          >
            {t.common.gotIt}
          </button>
        </div>
      </div>
    </div>
  );
}
