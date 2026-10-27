export type AssetKey =
  | "gold_18k"
  | "mazaneh"
  | "silver_999"
  | "silver_cert"
  | "copper"
  | "zinc";

export type AxisName = "usd" | "gold" | "silver" | "copper" | "zinc";

export const ASSET_KEYS: AssetKey[] = [
  "gold_18k",
  "mazaneh",
  "silver_999",
  "silver_cert",
  "copper",
  "zinc",
];

export interface AxisInput {
  base: number;
  step: number;
  steps_up: number;
  steps_down: number;
}

export interface CertificateParams {
  premium_pct: number;
  include_costs: boolean;
  vat_pct: number;
  fee_pct: number;
}

export interface MarketPrices {
  gold_18k: number;
  mazaneh: number;
  silver_999: number;
  silver_cert: number;
  copper: number;
  zinc: number;
}

export interface AnalysisRequest {
  usd: AxisInput;
  gold: AxisInput;
  silver: AxisInput;
  copper: AxisInput;
  zinc: AxisInput;
  bubble_pct: number;
  market_prices: MarketPrices;
  copper_params: CertificateParams;
  zinc_params: CertificateParams;
  silver_cert_params: CertificateParams;
}

export interface AxisValues {
  values: number[];
  base: number;
}

export interface MatrixPayload {
  row_axis: AxisName;
  row: AxisValues;
  col: AxisValues;
  /** values[i][j] ↔ row.values[i] × col.values[j]؛ خانه غیرمتناهی = null */
  values: (number | null)[][];
}

export interface AssetResult {
  price: MatrixPayload;
  bubble: MatrixPayload | null;
  market_price: number;
}

export type AnalysisResponse = Record<AssetKey, AssetResult>;

export type AnalysisErrorKind = "empty_axes" | "validation" | "network" | "http";

export class AnalysisError extends Error {
  readonly kind: AnalysisErrorKind;
  readonly axes: string[];

  constructor(kind: AnalysisErrorKind, axes: string[] = [], message?: string) {
    super(message ?? kind);
    this.kind = kind;
    this.axes = axes;
  }
}

/** یک ورودی پیش‌فرض که سناریوی پیش‌فرض UI استریم‌لیت را بازتولید می‌کند. */
export const DEFAULT_REQUEST: AnalysisRequest = {
  usd: { base: 200_000, step: 5_000, steps_up: 4, steps_down: 4 },
  gold: { base: 4_000, step: 50, steps_up: 4, steps_down: 4 },
  silver: { base: 50, step: 10, steps_up: 4, steps_down: 4 },
  copper: { base: 14_000, step: 250, steps_up: 4, steps_down: 4 },
  zinc: { base: 3_000, step: 100, steps_up: 6, steps_down: 5 },
  bubble_pct: 0,
  market_prices: {
    gold_18k: 0,
    mazaneh: 0,
    silver_999: 0,
    silver_cert: 0,
    copper: 0,
    zinc: 0,
  },
  copper_params: {
    premium_pct: 0,
    include_costs: false,
    vat_pct: 10,
    fee_pct: 0.24,
  },
  zinc_params: {
    premium_pct: 0,
    include_costs: false,
    vat_pct: 10,
    fee_pct: 0.24,
  },
  silver_cert_params: {
    premium_pct: 0,
    include_costs: false,
    vat_pct: 0,
    fee_pct: 0.24,
  },
};

export async function fetchAnalysis(
  request: AnalysisRequest,
  signal?: AbortSignal,
  baseUrl = "/api/analysis"
): Promise<AnalysisResponse> {
  let response: Response;
  try {
    response = await fetch(baseUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
      signal,
    });
  } catch (error) {
    if ((error as Error).name === "AbortError") throw error;
    throw new AnalysisError("network");
  }

  if (response.ok) return (await response.json()) as AnalysisResponse;

  let detail: unknown;
  try {
    detail = (await response.json()).detail;
  } catch {
    throw new AnalysisError("http");
  }

  if (
    typeof detail === "object" &&
    detail !== null &&
    (detail as { code?: string }).code === "empty_axes"
  ) {
    const axes = (detail as { axes?: string[] }).axes ?? [];
    throw new AnalysisError("empty_axes", axes);
  }
  throw new AnalysisError("validation");
}
