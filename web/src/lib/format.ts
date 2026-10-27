import type { AxisName } from "./api";
import type { LocaleTag } from "../i18n/LocaleContext";

/** decimals هر محور سناریو، همان دقتی که UI استریم‌لیت نمایش می‌داد. */
export const AXIS_DECIMALS: Record<AxisName, number> = {
  usd: 0,
  gold: 0,
  silver: 2,
  copper: 0,
  zinc: 0,
};

const cache = new Map<string, Intl.NumberFormat>();

function formatter(locale: LocaleTag, options: Intl.NumberFormatOptions) {
  const key = `${locale}|${JSON.stringify(options)}`;
  let instance = cache.get(key);
  if (!instance) {
    instance = new Intl.NumberFormat(locale, options);
    cache.set(key, instance);
  }
  return instance;
}

export function formatNumber(
  value: number,
  locale: LocaleTag,
  decimals = 0
): string {
  return formatter(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function formatCompact(value: number, locale: LocaleTag): string {
  return formatter(locale, {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

export function formatPercent(value: number, locale: LocaleTag, decimals = 2): string {
  return formatter(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/** عدد خوانا در خانه ماتریس؛ حباب یک اعشا و قیمت بدون اعشا. */
export function formatCell(
  value: number,
  mode: "price" | "bubble",
  locale: LocaleTag
): string {
  return formatNumber(value, locale, mode === "bubble" ? 1 : 0);
}

export function formatSignedPercent(
  value: number,
  locale: LocaleTag
): string {
  const sign = value > 0 ? "+" : value < 0 ? "−" : "";
  return `${sign}${formatPercent(Math.abs(value), locale, 2)}`;
}

export function matrixToCsv(
  rowLabels: string[],
  colLabels: string[],
  values: (number | null)[][]
): string {
  const header = ["", ...colLabels].join(",");
  const body = values.map((row, index) =>
    [rowLabels[index] ?? "", ...row.map((cell) => cell ?? "")].join(",")
  );
  return [`\ufeff${header}`, ...body].join("\r\n");
}
