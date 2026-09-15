/**
 * Demand and price prediction.
 *
 * The rule this file exists to enforce: a fitted model is only shown when it
 * beats a naive baseline on a chronological holdout. Otherwise the baseline is
 * shown instead and labelled as such. There is no decorative model.
 */

export type Fit = {
  /** Point predictions for the requested horizon. */
  predictions: number[];
  /** Residual-quantile band around each prediction. */
  lo: number[];
  hi: number[];
  modelMape: number;
  baselineMape: number;
  /** "ridge" when the model beat the baseline, "seasonal-naive" when it did not. */
  chosen: "ridge" | "seasonal-naive";
  sampleSize: number;
  /** False when there is too little history to test anything honestly. */
  usable: boolean;
};

const LAGS = [1, 2, 3, 4, 52];
const MIN_HISTORY = 20;

function features(series: number[], t: number, period: number): number[] {
  const f = [1];
  for (const lag of LAGS) f.push(series[t - lag] ?? series[Math.max(0, t - 1)] ?? 0);
  const phase = (2 * Math.PI * (t % period)) / period;
  f.push(Math.sin(phase), Math.cos(phase), t / series.length);
  return f;
}

/** Ridge regression by normal equations with a small ridge term for stability. */
function ridge(X: number[][], y: number[], lambda = 1e-2): number[] {
  const n = X[0].length;
  const A: number[][] = Array.from({ length: n }, () => Array(n + 1).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      let s = 0;
      for (let r = 0; r < X.length; r++) s += X[r][i] * X[r][j];
      A[i][j] = s + (i === j ? lambda : 0);
    }
    let s = 0;
    for (let r = 0; r < X.length; r++) s += X[r][i] * y[r];
    A[i][n] = s;
  }
  // Gaussian elimination with partial pivoting.
  for (let c = 0; c < n; c++) {
    let p = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(A[r][c]) > Math.abs(A[p][c])) p = r;
    [A[c], A[p]] = [A[p], A[c]];
    if (Math.abs(A[c][c]) < 1e-12) continue;
    for (let r = 0; r < n; r++) {
      if (r === c) continue;
      const k = A[r][c] / A[c][c];
      for (let j = c; j <= n; j++) A[r][j] -= k * A[c][j];
    }
  }
  return A.map((row, i) => (Math.abs(row[i]) < 1e-12 ? 0 : row[n] / row[i]));
}

const mape = (actual: number[], pred: number[]) => {
  const pairs = actual.map((a, i) => [a, pred[i]] as const).filter(([a]) => a > 0);
  if (!pairs.length) return Number.POSITIVE_INFINITY;
  return (100 * pairs.reduce((s, [a, p]) => s + Math.abs(a - p) / a, 0)) / pairs.length;
};

/**
 * @param series chronological observations, oldest first
 * @param horizon how many future periods to predict
 * @param period seasonal period of the series (52 for weekly data)
 */
export function fitAndForecast(series: number[], horizon: number, period = 52): Fit {
  const empty: Fit = {
    predictions: Array(horizon).fill(series.at(-1) ?? 0),
    lo: Array(horizon).fill(0),
    hi: Array(horizon).fill(0),
    modelMape: Number.POSITIVE_INFINITY,
    baselineMape: Number.POSITIVE_INFINITY,
    chosen: "seasonal-naive",
    sampleSize: series.length,
    usable: false,
  };
  if (series.length < MIN_HISTORY) return empty;

  const start = Math.max(...LAGS.filter((l) => l < series.length / 2), 4);
  const split = Math.floor(series.length * 0.8);

  const rows: number[][] = [];
  const ys: number[] = [];
  for (let t = start; t < split; t++) {
    rows.push(features(series, t, period));
    ys.push(series[t]);
  }
  if (rows.length < 8) return empty;

  const w = ridge(rows, ys);
  const predict = (t: number) => features(series, t, period).reduce((s, x, i) => s + x * w[i], 0);

  const holdoutActual: number[] = [];
  const holdoutModel: number[] = [];
  const holdoutBaseline: number[] = [];
  for (let t = split; t < series.length; t++) {
    holdoutActual.push(series[t]);
    holdoutModel.push(predict(t));
    // Baseline: the median of the previous four periods. Simple, and hard to beat.
    const window = series.slice(Math.max(0, t - 4), t).sort((a, b) => a - b);
    holdoutBaseline.push(window[Math.floor(window.length / 2)] ?? series[t - 1]);
  }

  const modelMape = mape(holdoutActual, holdoutModel);
  const baselineMape = mape(holdoutActual, holdoutBaseline);
  const chosen: Fit["chosen"] = modelMape < baselineMape ? "ridge" : "seasonal-naive";

  const residuals = holdoutActual
    .map((a, i) => Math.abs(a - (chosen === "ridge" ? holdoutModel[i] : holdoutBaseline[i])))
    .sort((a, b) => a - b);
  const band = residuals[Math.floor(residuals.length * 0.8)] ?? 0;

  const extended = [...series];
  const predictions: number[] = [];
  for (let h = 0; h < horizon; h++) {
    const t = extended.length;
    let next: number;
    if (chosen === "ridge") {
      next = features(extended, t, period).reduce((s, x, i) => s + x * w[i], 0);
    } else {
      const window = extended.slice(-4).sort((a, b) => a - b);
      next = window[Math.floor(window.length / 2)] ?? extended.at(-1)!;
    }
    next = Math.max(0, next);
    predictions.push(next);
    extended.push(next);
  }

  return {
    predictions,
    lo: predictions.map((p) => Math.max(0, p - band)),
    hi: predictions.map((p) => p + band),
    modelMape,
    baselineMape,
    chosen,
    sampleSize: series.length,
    usable: true,
  };
}

/**
 * Ranks commodities by how attractive they look for the coming window.
 * Demand growth and price direction are combined into one score so the farmer
 * sees an ordered shortlist rather than a wall of separate charts.
 */
export function opportunityScore(opts: {
  demandChangePct: number;
  priceChangePct: number;
  /** Confirmed demand divided by listed supply. Above 1 means unmet demand. */
  demandSupplyRatio: number;
}) {
  const { demandChangePct, priceChangePct, demandSupplyRatio } = opts;
  const scarcity = Math.max(0, Math.min(2, demandSupplyRatio)) - 1;
  return Math.round(demandChangePct * 0.4 + priceChangePct * 0.4 + scarcity * 100 * 0.2);
}
