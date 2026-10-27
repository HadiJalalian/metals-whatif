import { useState } from "react";
import type { ReactNode } from "react";

interface SectionCardProps {
  title: string;
  hint?: string;
  defaultOpen?: boolean;
  badge?: ReactNode;
  icon?: ReactNode;
  children: ReactNode;
}

/** بخش جمع‌شونده پنل ورودی؛ باز/بسته محلی است و بر محاسبه effect ندارد. */
export function SectionCard({
  title,
  hint,
  defaultOpen = true,
  badge,
  icon,
  children,
}: SectionCardProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="card card-lift overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex w-full cursor-pointer items-center gap-2.5 px-4 py-3 text-start transition-colors hover:bg-surface-subtle"
      >
        <span
          className={`grid size-7 shrink-0 place-items-center rounded-[9px] transition-colors duration-200 ${
            open ? "bg-brand-soft text-brand" : "bg-surface-subtle text-ink-muted"
          }`}
          aria-hidden
        >
          {icon}
        </span>
        <span className="card-title flex-1 truncate">{title}</span>
        {badge}
        <svg
          viewBox="0 0 16 16"
          className={`size-3.5 shrink-0 text-ink-muted transition-transform duration-300 ease-spring ${
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
      </button>

      <div
        className={`grid transition-[grid-template-rows,opacity] duration-300 ease-soft ${
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <div className="border-t border-line px-4 py-3.5">
            {hint ? (
              <p className="mb-3 text-[11.5px] leading-relaxed text-ink-muted">{hint}</p>
            ) : null}
            {children}
          </div>
        </div>
      </div>
    </section>
  );
}
