import { Router, Response } from 'express';
import { authenticateToken, requireRole, AuthenticatedRequest } from '@/middleware/auth';
import { AuditService } from '@/services/AuditService';
import { DatabaseService } from '@/services/DatabaseService';

const router = Router();

function getAuditService(): AuditService {
  const ds = DatabaseService.getInstance().getDataSource();
  return new AuditService(ds);
}

// GET /api/audit/logs - Get audit logs (admin or own logs)
router.get('/logs', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const service = getAuditService();
    const isAdmin = req.user?.role === 'admin';
    const filters = {
      userId: isAdmin ? (req.query.userId as string) : req.user?.userId,
      action: req.query.action as string,
      entityType: req.query.entityType as string,
      entityId: req.query.entityId as string,
      limit: parseInt(req.query.limit as string) || 50,
      offset: parseInt(req.query.offset as string) || 0,
    };

    const result = await service.getLogs(filters);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/audit/verify - Verify audit chain integrity (admin only)
router.get('/verify', authenticateToken, requireRole(['admin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const service = getAuditService();
    const result = await service.verifyIntegrity();
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/audit/stats - Audit statistics
router.get('/stats', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const service = getAuditService();
    const stats = await service.getStats();
    res.json({ success: true, data: stats });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
