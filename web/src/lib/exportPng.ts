import type { MatrixPayload } from "./api";
import { scaleStops } from "./colors";
import { formatCell, formatCompact, formatNumber } from "./format";
import { cellColors, colorDomain, indexOfBase, legendEdges } from "./matrixStats";
import type { LocaleTag } from "../i18n/LocaleContext";

const INK = "#0a1220";
const INK_SECONDARY = "#4b5866";
const INK_MUTED = "#8895a5";
const BRAND = "#10304f";
const LINE = "#e3e8ee";
const GAP = 3;
const PAD = 26;
const SCALE = 2;

export interface MatrixImageSpec {
  matrix: MatrixPayload;
  mode: "price" | "bubble";
  title: string;
  subtitle: string;
  /** سرتیر کوچک بالای کارت، مثل «XAU × USD». */
  eyebrow: string;
  footer: string;
  intl: LocaleTag;
  rtl: boolean;
  rowDecimals: number;
}

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

/**
 * ماتریس را روی canvas می‌کشد و PNG تحویل می‌دهد.
 * رنگ و عدد هر خانه از همان توابع heatmap می‌آید، پس تصویر با صفحه یکی است.
 */
export async function renderMatrixPng(
  canvas: HTMLCanvasElement,
  spec: MatrixImageSpec
): Promise<Blob | null> {
  try {
    await document.fonts.ready;
  } catch {
    /* مرورگرهای قدیمی بدون FontFaceSet */
  }

  const { matrix, mode, intl, rtl } = spec;
  const rowCount = matrix.row.values.length;
  const colCount = matrix.col.values.length;
  if (rowCount === 0 || colCount === 0) return null;

  const probe = canvas.getContext("2d");
  if (!probe) return null;
  const family = rtl ? '"Vazirmatn","Inter",sans-serif' : '"Inter","Vazirmatn",sans-serif';
  const font = (size: number, weight = 500) => `${weight} ${size}px ${family}`;

  probe.font = font(10, 700);
  const gutter = Math.max(
    54,
    Math.min(
      150,
      ...matrix.row.values.map(
        (value) =>
          probe.measureText(formatNumber(value, intl, spec.rowDecimals)).width + 20
      )
    )
  );

  const budget = 1480 - PAD * 2 - gutter - GAP * (colCount - 1);
  const minCell = mode === "bubble" ? 50 : 46;
  const idealCell = mode === "bubble" ? 76 : 106;
  let cellW = Math.max(minCell, Math.min(idealCell, Math.floor(budget / colCount)));

  const domain = colorDomain(matrix, mode);
  const cellText = (value: number | null): string => {
    if (value === null || !Number.isFinite(value)) return "—";
    return mode === "bubble" || !compact
      ? formatCell(value, mode, intl)
      : formatCompact(value, intl);
  };

  const fullWidth = Math.max(
    ...matrix.values
      .flat()
      .map((value) =>
        value === null || !Number.isFinite(value)
          ? 0
          : probe.measureText(formatCell(value, mode, intl)).width
      )
  );
  let cellFont = cellW >= 96 ? 12.5 : cellW >= 82 ? 11.5 : cellW >= 70 ? 10.5 : 9.5;
  const compact = fullWidth > cellW - 12;
  const measureWidest = (): number => {
    probe.font = font(cellFont, 600);
    return Math.max(
      ...matrix.values.flat().map((value) => probe.measureText(cellText(value)).width)
    );
  };
  let widest = measureWidest();
  while (cellFont > 8 && widest > cellW - 10) {
    cellFont -= 0.5;
    widest = measureWidest();
  }
  // به‌جای ریز کردن عدد تا زیر حد خوانایی، خانه را عریض می‌کنیم («۷٫۲ میلیون» فارسی نمونه‌اش است).
  cellW = Math.min(idealCell, Math.max(cellW, widest + 10));
  const cellH = Math.max(24, Math.min(34, Math.round(cellW * 0.3)));

  const gridW = colCount * cellW + (colCount - 1) * GAP;
  const gridH = rowCount * cellH + (rowCount - 1) * GAP;
  const tableW = gutter + 8 + gridW;
  const headH = 62;
  const labelRowH = 24;
  const footH = 26;
  const width = PAD * 2 + tableW;
  const height = PAD + headH + labelRowH + gridH + footH + PAD;

  // سقف پیکسل بوم: Safari/iOS بوم بزرگ‌تر از ~۱۶M پیکسل را بی‌صدا به null می‌رساند.
  const maxPixels = 15_500_000;
  const scale = Math.min(
    SCALE,
    Math.max(1, Math.sqrt(maxPixels / (width * height)))
  );
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.scale(scale, scale);
  ctx.direction = rtl ? "rtl" : "ltr";

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 1;
  ctx.strokeRect(0.5, 0.5, width - 1, height - 1);

  const headX = rtl ? width - PAD : PAD;
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = rtl ? "right" : "left";
  ctx.fillStyle = INK_MUTED;
  ctx.font = font(9.5, 700);
  ctx.fillText(spec.eyebrow.toUpperCase(), headX, PAD + 12);
  ctx.fillStyle = INK;
  ctx.font = font(16, 800);
  ctx.fillText(spec.title, headX, PAD + 32);
  ctx.fillStyle = INK_SECONDARY;
  ctx.font = font(11, 500);
  ctx.fillText(spec.subtitle, headX, PAD + 48);

  // نوار رنگ: در RTL برعکس چیده می‌شود تا با legend روی صفحه یکی بماند.
  const edges = legendEdges(matrix, mode, intl);
  ctx.font = font(9.5, 600);
  const barW = Math.min(150, width * 0.2);
  const lowW = ctx.measureText(edges.low).width;
  const highW = ctx.measureText(edges.high).width;
  const groupW = lowW + highW + barW + 16;
  const groupX = rtl ? PAD : width - PAD - groupW;
  const barX = rtl ? groupX + highW + 8 : groupX + lowW + 8;
  const legendY = PAD + 34;
  ctx.fillStyle = INK_MUTED;
  ctx.textAlign = "left";
  ctx.fillText(rtl ? edges.high : edges.low, groupX, legendY);
  const stops = scaleStops(mode);
  const gradient = ctx.createLinearGradient(barX, 0, barX + barW, 0);
  stops.forEach((stop, index) => {
    const position = index / (stops.length - 1);
    gradient.addColorStop(rtl ? 1 - position : position, stop);
  });
  ctx.fillStyle = gradient;
  roundedRect(ctx, barX, legendY - 8, barW, 8, 4);
  ctx.fill();
  ctx.fillStyle = INK_MUTED;
  ctx.fillText(rtl ? edges.low : edges.high, barX + barW + 8, legendY);

  const tableX = rtl ? width - PAD - tableW : PAD;
  const gridLeft = rtl ? tableX : tableX + gutter + 8;
  const gridRight = gridLeft + gridW;
  const gridY = PAD + headH + labelRowH;
  const cellX = (col: number) =>
    rtl ? gridRight - col * (cellW + GAP) - cellW : gridLeft + col * (cellW + GAP);
  const labelEdge = rtl ? gridRight + 12 : tableX + gutter - 4;
  const baseRow = indexOfBase(matrix.row.values, matrix.row.base);
  const baseCol = indexOfBase(matrix.col.values, matrix.col.base);

  ctx.font = font(10, 700);
  ctx.textAlign = "center";
  matrix.col.values.forEach((value, col) => {
    ctx.fillStyle = col === baseCol ? BRAND : INK_SECONDARY;
    ctx.fillText(
      formatNumber(value, intl, 0),
      cellX(col) + cellW / 2,
      gridY - 9
    );
  });

  ctx.textAlign = rtl ? "left" : "right";
  matrix.row.values.forEach((value, row) => {
    ctx.fillStyle = row === baseRow ? BRAND : INK_SECONDARY;
    ctx.fillText(
      formatNumber(value, intl, spec.rowDecimals),
      labelEdge,
      gridY + row * (cellH + GAP) + cellH / 2 + 3.5
    );
  });

  ctx.font = font(cellFont, 600);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  matrix.values.forEach((rowValues, row) => {
    rowValues.forEach((value, col) => {
      const x = cellX(col);
      const y = gridY + row * (cellH + GAP);
      const { bg, fg } = cellColors(value, mode, domain);
      ctx.fillStyle = bg;
      roundedRect(ctx, x, y, cellW, cellH, 5);
      ctx.fill();
      ctx.fillStyle = fg;
      ctx.fillText(cellText(value), x + cellW / 2, y + cellH / 2 + 0.5);
    });
  });

  if (baseRow >= 0 && baseCol >= 0) {
    ctx.strokeStyle = "rgba(16,48,79,0.55)";
    ctx.lineWidth = 2;
    roundedRect(
      ctx,
      cellX(baseCol) - 1,
      gridY + baseRow * (cellH + GAP) - 1,
      cellW + 2,
      cellH + 2,
      6
    );
    ctx.stroke();
  }

  ctx.save();
  roundedRect(ctx, tableX, gridY, tableW, gridH, 8);
  ctx.clip();
  ctx.translate(tableX + tableW / 2, gridY + gridH / 2);
  ctx.rotate((rtl ? 30 : -30) * (Math.PI / 180));
  ctx.font = font(Math.min(74, gridW / 9), 800);
  ctx.fillStyle = "rgba(10,18,32,0.055)";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("@themohammadm", 0, 0);
  ctx.restore();

  ctx.font = font(10.5, 500);
  ctx.fillStyle = INK_MUTED;
  ctx.textAlign = rtl ? "right" : "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(spec.footer, headX, height - PAD);

  return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob), "image/png"));
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  // لغو زودهنگام URL در Safari دانلود را بی‌اثر می‌کند.
  window.setTimeout(() => URL.revokeObjectURL(url), 2000);
}
