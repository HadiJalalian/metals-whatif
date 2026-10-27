import { useCallback, useEffect, useRef, useState } from "react";

const REDUCED = "(prefers-reduced-motion: reduce)";

function prefersReducedMotion(): boolean {
  return window.matchMedia(REDUCED).matches;
}

/** شمارش نرم اعداد KPI؛ مقدار را tween می‌کند و قالب‌بندی locale روی نتیجه انجام می‌شود. */
export function useTween(target: number, durationMs = 450): number {
  const [shown, setShown] = useState(target);
  const shownRef = useRef(target);

  useEffect(() => {
    if (!Number.isFinite(target)) {
      shownRef.current = 0;
      setShown(0);
      return;
    }
    if (prefersReducedMotion()) {
      shownRef.current = target;
      setShown(target);
      return;
    }

    const origin = shownRef.current;
    if (Math.abs(origin - target) < 1e-9) return;

    const started = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const progress = Math.min(1, (now - started) / durationMs);
      const eased = 1 - (1 - progress) ** 3;
      const next = origin + (target - origin) * eased;
      shownRef.current = next;
      setShown(next);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(frame);
  }, [target, durationMs]);

  return shown;
}

export function useCopy(): (text: string) => boolean {
  return useCallback((text: string) => {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).catch(() => undefined);
      return true;
    }
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(area);
    return ok;
  }, []);
}

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(
    () => window.matchMedia(query).matches
  );

  useEffect(() => {
    const list = window.matchMedia(query);
    const onChange = (event: MediaQueryListEvent) => setMatches(event.matches);
    list.addEventListener("change", onChange);
    setMatches(list.matches);
    return () => list.removeEventListener("change", onChange);
  }, [query]);

  return matches;
}

/** فقط برای سایه/وضعیت هدر؛ listener را روی یک boolean قفل می‌کند تا re-render نبینیم. */
export function useScrolled(offset = 8): boolean {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > offset);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [offset]);

  return scrolled;
}
