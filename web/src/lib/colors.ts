type Rgb = [number, number, number];

function hexToRgb(hex: string): Rgb {
  const value = parseInt(hex.slice(1), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function channelToHex(channel: number): string {
  return Math.round(Math.max(0, Math.min(255, channel)))
    .toString(16)
    .padStart(2, "0");
}

function mix(a: Rgb, b: Rgb, t: number): Rgb {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

/** نمونه‌بردی تکه‌تکه از یک ramp؛ t در [0,1]. */
function sample(stops: Rgb[], t: number): Rgb {
  const clamped = Math.max(0, Math.min(1, t));
  if (stops.length === 1) return stops[0];
  const position = clamped * (stops.length - 1);
  const index = Math.min(Math.floor(position), stops.length - 2);
  return mix(stops[index], stops[index + 1], position - index);
}

export function toHex(rgb: Rgb): string {
  return `#${channelToHex(rgb[0])}${channelToHex(rgb[1])}${channelToHex(rgb[2])}`;
}

function relativeLuminance(rgb: Rgb): number {
  const [r, g, b] = rgb.map((channel) => {
    const s = channel / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

const PRICE_STOPS = [
  "#eff4fa",
  "#cfe1f1",
  "#9cc2e0",
  "#659bc8",
  "#3872a8",
  "#1a4a78",
  "#0f2f52",
].map(hexToRgb);

// t ∈ [0,1] از منفی‌ترین حباب (سبز = ارزان‌تر از مدل) به مثبت‌ترین (قرمز = گران‌تر).
const BUBBLE_STOPS = [
  "#0f7a5b",
  "#2f9d76",
  "#9fd7c3",
  "#f8f9fa",
  "#f0a89c",
  "#d4483a",
  "#a8172b",
].map(hexToRgb);

export function priceColor(t: number): string {
  return toHex(sample(PRICE_STOPS, t));
}

/** حباب متقارن حول صفر: value/maxAbs ∈ [-1,1]؛ مثبت = بازار گران‌تر = قرمز. */
export function bubbleColor(value: number, maxAbs: number): string {
  if (maxAbs <= 0) return toHex(BUBBLE_STOPS[3]);
  const normalized = Math.max(-1, Math.min(1, value / maxAbs));
  return toHex(sample(BUBBLE_STOPS, (normalized + 1) / 2));
}

/** رنگ متن بر پایه روشنایی پس‌زمینه، برای کنتراست AA روی هر خانه. */
export function textOn(backgroundColor: string): string {
  return relativeLuminance(hexToRgb(backgroundColor)) > 0.42
    ? "#0b1220"
    : "#ffffff";
}

export function scaleStops(mode: "price" | "bubble"): string[] {
  const stops = mode === "price" ? PRICE_STOPS : BUBBLE_STOPS;
  return stops.map(toHex);
}
