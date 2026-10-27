import { useState } from "react";
import type { ReactNode } from "react";

interface SectionCardProps {
  title: string;
  hint?: string;
  defaultOpen?: boolean;
  badge?: ReactNode;
  children: ReactNode;
}

/** بخش جمع‌شونده پنل ورودی؛ باز/بسته محلی است و بر محاسبه effect ندارد. */
export function SectionCard({
  title,
  hint,
  defaultOpen = true,
  badge,
  children,
}: SectionCardProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="card overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex w-full cursor-pointer items-center gap-2 px-4 py-3 text-start transition-colors hover:bg-surface-subtle"
      >
        <svg
          viewBox="0 0 16 16"
          className={`size-3.5 shrink-0 text-ink-muted transition-transform duration-200 ${
            open ? "rotate-90 rtl:-rotate-90" : ""
          }`}
          aria-hidden
        >
          <path
            d="M6 3.5 10.5 8 6 12.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span className="card-title flex-1">{title}</span>
        {badge}
      </button>
      {open ? (
        <div className="border-t border-line px-4 py-3.5">
          {hint ? (
            <p className="mb-3 text-[11.5px] leading-relaxed text-ink-muted">{hint}</p>
          ) : null}
          {children}
        </div>
      ) : null}
    </section>
  );
}
