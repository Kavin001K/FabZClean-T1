import type { NextFunction, Request, Response } from 'express';

type SloBucket = {
  total: number;
  success: number;
  clientError: number;
  serverError: number;
  durationsMs: number[];
};

const WINDOW_MS = 5 * 60 * 1000;
const MAX_SAMPLES = 5000;

const bucket: SloBucket = {
  total: 0,
  success: 0,
  clientError: 0,
  serverError: 0,
  durationsMs: [],
};

let windowStartedAt = Date.now();

function resetIfExpired() {
  if (Date.now() - windowStartedAt >= WINDOW_MS) {
    bucket.total = 0;
    bucket.success = 0;
    bucket.clientError = 0;
    bucket.serverError = 0;
    bucket.durationsMs = [];
    windowStartedAt = Date.now();
  }
}

function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[index];
}

export function sloTrackingMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.path.startsWith('/api/')) return next();

    const startedAt = Date.now();
    res.on('finish', () => {
      resetIfExpired();
      const durationMs = Date.now() - startedAt;
      bucket.total += 1;
      if (res.statusCode >= 500) bucket.serverError += 1;
      else if (res.statusCode >= 400) bucket.clientError += 1;
      else bucket.success += 1;

      bucket.durationsMs.push(durationMs);
      if (bucket.durationsMs.length > MAX_SAMPLES) {
        bucket.durationsMs.shift();
      }
    });

    next();
  };
}

export function getSloSnapshot() {
  resetIfExpired();
  const availability = bucket.total > 0
    ? Number(((bucket.success / bucket.total) * 100).toFixed(2))
    : 100;
  const errorRate = bucket.total > 0
    ? Number((((bucket.serverError + bucket.clientError) / bucket.total) * 100).toFixed(2))
    : 0;

  return {
    windowMs: WINDOW_MS,
    windowStartedAt: new Date(windowStartedAt).toISOString(),
    requests: bucket.total,
    success: bucket.success,
    clientError: bucket.clientError,
    serverError: bucket.serverError,
    availabilityPercent: availability,
    errorRatePercent: errorRate,
    latencyMs: {
      p50: percentile(bucket.durationsMs, 50),
      p95: percentile(bucket.durationsMs, 95),
      p99: percentile(bucket.durationsMs, 99),
    },
    sloTargets: {
      availabilityPercent: 99.5,
      p95LatencyMs: 1200,
      maxErrorRatePercent: 1,
    },
  };
}
