import { Router } from 'express';
import { DashboardAnalyticsService } from '../services/dashboard-analytics';

const router = Router();
const dashboardService = DashboardAnalyticsService.getInstance();

// Get real-time dashboard metrics
router.get('/metrics', async (req, res) => {
  try {
    const metrics = await dashboardService.getDashboardMetrics();
    res.json(metrics);
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard metrics' });
  }
});

// Get revenue chart data
router.get('/revenue-chart', async (req, res) => {
  try {
    const { period = '7d' } = req.query;
    const chartData = await dashboardService.getRevenueChartData(period as string);
    res.json(chartData);
  } catch (error) {
    console.error('Error fetching revenue chart data:', error);
    res.status(500).json({ error: 'Failed to fetch revenue chart data' });
  }
});

// Get orders distribution data
router.get('/orders-distribution', async (req, res) => {
  try {
    const distribution = await dashboardService.getOrdersDistribution();
    res.json(distribution);
  } catch (error) {
    console.error('Error fetching orders distribution:', error);
    res.status(500).json({ error: 'Failed to fetch orders distribution' });
  }
});

// Get equipment status
router.get('/equipment-status', async (req, res) => {
  try {
    const status = await dashboardService.getEquipmentStatus();
    res.json(status);
  } catch (error) {
    console.error('Error fetching equipment status:', error);
    res.status(500).json({ error: 'Failed to fetch equipment status' });
  }
});

// Get delivery schedule for next 7 days
router.get('/delivery-schedule', async (req, res) => {
  try {
    const schedule = await dashboardService.getDeliverySchedule();
    res.json(schedule);
  } catch (error) {
    console.error('Error fetching delivery schedule:', error);
    res.status(500).json({ error: 'Failed to fetch delivery schedule' });
  }
});

// Get production metrics
router.get('/production-metrics', async (req, res) => {
  try {
    const metrics = await dashboardService.getProductionMetrics();
    res.json(metrics);
  } catch (error) {
    console.error('Error fetching production metrics:', error);
    res.status(500).json({ error: 'Failed to fetch production metrics' });
  }
});

// Get quality metrics
router.get('/quality-metrics', async (req, res) => {
  try {
    const metrics = await dashboardService.getQualityMetrics();
    res.json(metrics);
  } catch (error) {
    console.error('Error fetching quality metrics:', error);
    res.status(500).json({ error: 'Failed to fetch quality metrics' });
  }
});

// Get financial summary
router.get('/financial-summary', async (req, res) => {
  try {
    const summary = await dashboardService.getFinancialSummary();
    res.json(summary);
  } catch (error) {
    console.error('Error fetching financial summary:', error);
    res.status(500).json({ error: 'Failed to fetch financial summary' });
  }
});

// Get recent activities
router.get('/recent-activities', async (req, res) => {
  try {
    const activities = await dashboardService.getRecentActivities();
    res.json(activities);
  } catch (error) {
    console.error('Error fetching recent activities:', error);
    res.status(500).json({ error: 'Failed to fetch recent activities' });
  }
});

export default router;