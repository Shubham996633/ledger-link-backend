import { Router, Response } from 'express';
import { authenticateToken, AuthenticatedRequest } from '@/middleware/auth';
import { SupplyChainService } from '@/services/SupplyChainService';
import { AuditService } from '@/services/AuditService';
import { DatabaseService } from '@/services/DatabaseService';

const router = Router();

function getServices() {
  const ds = DatabaseService.getInstance().getDataSource();
  return {
    supplyService: new SupplyChainService(ds),
    auditService: new AuditService(ds),
  };
}

// POST /api/supply-chain/items - Register a new item
router.post('/items', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { supplyService, auditService } = getServices();
    const { name, description, originLocation, metadata } = req.body;

    if (!name || !originLocation) {
      res.status(400).json({ success: false, message: 'name and originLocation are required' });
      return;
    }

    const item = await supplyService.createItem({
      name,
      description,
      ownerId: req.user!.userId,
      originLocation,
      metadata,
    });

    await auditService.log({
      userId: req.user!.userId,
      action: 'create',
      entityType: 'supply_chain',
      entityId: item.id,
      description: `Created item: ${name} (${item.trackingId})`,
    });

    res.status(201).json({ success: true, data: item });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/supply-chain/items/:trackingId - Get item by tracking ID
router.get('/items/:trackingId', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { supplyService } = getServices();
    const item = await supplyService.getItem(req.params.trackingId);

    if (!item) {
      res.status(404).json({ success: false, message: 'Item not found' });
      return;
    }

    res.json({ success: true, data: item });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/supply-chain/my-items - Get items owned by current user
router.get('/my-items', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { supplyService } = getServices();
    const items = await supplyService.getUserItems(req.user!.userId);
    res.json({ success: true, data: items });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/supply-chain/items/:trackingId/transfer - Transfer item
router.post('/items/:trackingId/transfer', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { supplyService, auditService } = getServices();
    const { toUserId, location } = req.body;

    if (!toUserId || !location) {
      res.status(400).json({ success: false, message: 'toUserId and location are required' });
      return;
    }

    const item = await supplyService.transferItem({
      trackingId: req.params.trackingId,
      fromUserId: req.user!.userId,
      toUserId,
      location,
    });

    if (!item) {
      res.status(403).json({ success: false, message: 'Transfer failed - not owner or item not found' });
      return;
    }

    await auditService.log({
      userId: req.user!.userId,
      action: 'transfer',
      entityType: 'supply_chain',
      entityId: item.id,
      description: `Transferred ${item.trackingId} to ${toUserId} at ${location}`,
    });

    res.json({ success: true, data: item });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/supply-chain/items/:trackingId/checkpoint - Update checkpoint
router.post('/items/:trackingId/checkpoint', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { supplyService, auditService } = getServices();
    const { location, status, temperature, humidity, notes } = req.body;

    if (!location || !status) {
      res.status(400).json({ success: false, message: 'location and status are required' });
      return;
    }

    const item = await supplyService.updateCheckpoint({
      trackingId: req.params.trackingId,
      userId: req.user!.userId,
      location,
      status,
      temperature,
      humidity,
      notes,
    });

    if (!item) {
      res.status(404).json({ success: false, message: 'Item not found' });
      return;
    }

    await auditService.log({
      userId: req.user!.userId,
      action: 'update',
      entityType: 'supply_chain',
      entityId: item.id,
      description: `Checkpoint: ${status} at ${location}`,
    });

    res.json({ success: true, data: item });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/supply-chain/items/:trackingId/verify - Verify integrity
router.get('/items/:trackingId/verify', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { supplyService } = getServices();
    const result = await supplyService.verifyIntegrity(req.params.trackingId);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/supply-chain/stats - Supply chain statistics
router.get('/stats', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { supplyService } = getServices();
    const stats = await supplyService.getStats();
    res.json({ success: true, data: stats });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
