import express from 'express';
import { getDatabaseHealth, pingDatabase } from '../db-utils';
import { getPerformanceStats } from '../performance-optimizer';
import { getSloSnapshot } from '../middleware/slo-tracker';
import { createSuccessResponse } from '../services/serialization';

const router = express.Router();
const startedAt = Date.now();

router.get('/', (_req, res) => {
  res.json({
    status: 'healthy',
    service: 'fabzclean-api',
    uptimeSeconds: Math.floor((Date.now() - startedAt) / 1000),
    timestamp: new Date().toISOString(),
  });
});

router.get('/live', (_req, res) => {
  res.json({ status: 'live', timestamp: new Date().toISOString() });
});

router.get('/ready', async (_req, res) => {
  try {
    const db = await pingDatabase();
    if (!db?.success) {
      return res.status(503).json({
        status: 'not_ready',
        checks: { database: 'unhealthy' },
        timestamp: new Date().toISOString(),
      });
    }

    res.json({
      status: 'ready',
      checks: { database: 'healthy' },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(503).json({
      status: 'not_ready',
      checks: { database: 'unhealthy' },
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

router.get('/database', async (_req, res) => {
  try {
    const health = await getDatabaseHealth();
    res.json(health);
  } catch (error: any) {
    console.error('Database health check failed:', error);
    res.status(500).json({
      status: 'unhealthy',
      error: error.message,
    });
  }
});

router.get('/ping', async (_req, res) => {
  try {
    const ping = await pingDatabase();
    res.json(ping);
  } catch (error: any) {
    console.error('Database ping failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

router.get('/metrics', (_req, res) => {
  res.json(createSuccessResponse({
    performance: getPerformanceStats(),
    slo: getSloSnapshot(),
  }, 'Operational metrics'));
});

router.get('/slo', (_req, res) => {
  res.json(getSloSnapshot());
});

export default router;
