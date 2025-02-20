import express from 'express';
import { getMetrics, clearMetrics } from '../middleware/performance.js';
import { authenticateToken } from '../middleware/auth.js';
import monitoringService from '../services/monitoring.js';
import os from 'os';
import v8 from 'v8';

const router = express.Router();

/**
 * @swagger
 * /api/monitoring/metrics:
 *   get:
 *     summary: Get application performance metrics
 *     tags: [Monitoring]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Performance metrics retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/metrics', authenticateToken, async (req, res) => {
  try {
    const metrics = getMetrics();
    
    // Add system metrics
    const systemMetrics = {
      uptime: process.uptime(),
      memory: {
        total: os.totalmem(),
        free: os.freemem(),
        heapTotal: process.memoryUsage().heapTotal,
        heapUsed: process.memoryUsage().heapUsed,
        external: process.memoryUsage().external
      },
      cpu: {
        load: os.loadavg(),
        cores: os.cpus().length
      },
      v8: {
        heapStats: v8.getHeapStatistics(),
        heapSpaceStats: v8.getHeapSpaceStatistics()
      }
    };
    
    // Check for alerts
    const alerts = await monitoringService.checkMetrics();
    
    res.json({
      success: true,
      applicationMetrics: metrics,
      systemMetrics,
      alerts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve metrics',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/monitoring/alerts:
 *   get:
 *     summary: Get recent monitoring alerts
 *     tags: [Monitoring]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *         description: Number of days of alerts to retrieve
 *     responses:
 *       200:
 *         description: Alerts retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/alerts', authenticateToken, async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const alerts = await monitoringService.getRecentAlerts(days);
    
    res.json({
      success: true,
      alerts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve alerts',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/monitoring/metrics:
 *   delete:
 *     summary: Clear performance metrics
 *     tags: [Monitoring]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Metrics cleared successfully
 *       401:
 *         description: Unauthorized
 */
router.delete('/metrics', authenticateToken, (req, res) => {
  try {
    clearMetrics();
    res.json({
      success: true,
      message: 'Metrics cleared successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to clear metrics',
      error: error.message
    });
  }
});

export default router;
