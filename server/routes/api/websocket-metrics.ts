import { Router } from 'express';
import { realtimeServer } from '../../websocket-server';
import { adminLoginRequired } from '../../middleware/auth';

const router = Router();

/**
 * Get WebSocket connection metrics
 * GET /api/v1/websocket/metrics
 */
router.get('/metrics', adminLoginRequired, async (req, res) => {
  try {
    const metrics = realtimeServer.getMetrics();
    
    res.json({
      success: true,
      data: metrics,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting WebSocket metrics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get WebSocket metrics',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Force batch processing
 * POST /api/v1/websocket/process-batch
 */
router.post('/process-batch', adminLoginRequired, async (req, res) => {
  try {
    realtimeServer.processBatchNow();
    
    res.json({
      success: true,
      message: 'Batch processing triggered',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error processing batch:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process batch',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Broadcast test message
 * POST /api/v1/websocket/broadcast
 */
router.post('/broadcast', adminLoginRequired, async (req, res) => {
  try {
    const { type, data, priority = 'medium', portalType, userId } = req.body;
    
    if (!type || !data) {
      return res.status(400).json({
        success: false,
        message: 'Type and data are required'
      });
    }

    const message = { type, data };

    if (portalType) {
      realtimeServer.broadcastToPortal(portalType, message);
    } else if (userId) {
      realtimeServer.broadcastToUser(userId, message);
    } else {
      realtimeServer.broadcast(message, priority);
    }
    
    res.json({
      success: true,
      message: 'Message broadcasted successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error broadcasting message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to broadcast message',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
