import { Router, Response } from 'express';
import { authenticateToken, requireRole, AuthenticatedRequest } from '@/middleware/auth';
import { HealthRecordService } from '@/services/HealthRecordService';
import { AuditService } from '@/services/AuditService';
import { DatabaseService } from '@/services/DatabaseService';

const router = Router();

function getServices() {
  const ds = DatabaseService.getInstance().getDataSource();
  return {
    healthService: new HealthRecordService(ds),
    auditService: new AuditService(ds),
  };
}

// POST /api/health-records - Create a health record (provider only)
router.post('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { healthService, auditService } = getServices();
    const { patientId, recordType, data, metadata } = req.body;

    if (!patientId || !recordType || !data) {
      res.status(400).json({ success: false, message: 'patientId, recordType, and data are required' });
      return;
    }

    const record = await healthService.createRecord({
      patientId,
      providerId: req.user!.userId,
      recordType,
      data,
      metadata,
    });

    await auditService.log({
      userId: req.user!.userId,
      action: 'create',
      entityType: 'health_record',
      entityId: record.id,
      description: `Created ${recordType} record for patient`,
    });

    res.status(201).json({
      success: true,
      data: {
        id: record.id,
        recordType: record.recordType,
        dataHash: record.dataHash,
        blockNumber: record.blockNumber,
        zkProofId: record.zkProofId,
        status: record.status,
        createdAt: record.createdAt,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/health-records/:id - Get a specific record (with decrypted data)
router.get('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { healthService, auditService } = getServices();
    const result = await healthService.getRecord(req.params.id, req.user!.userId);

    if (!result) {
      res.status(404).json({ success: false, message: 'Record not found or access denied' });
      return;
    }

    await auditService.log({
      userId: req.user!.userId,
      action: 'read',
      entityType: 'health_record',
      entityId: req.params.id,
    });

    res.json({
      success: true,
      data: {
        id: result.record.id,
        recordType: result.record.recordType,
        data: result.decryptedData,
        dataHash: result.record.dataHash,
        blockNumber: result.record.blockNumber,
        zkProofId: result.record.zkProofId,
        accessControl: result.record.accessControl,
        status: result.record.status,
        createdAt: result.record.createdAt,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/health-records/patient/:patientId - Get patient records
router.get('/patient/:patientId', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { healthService } = getServices();
    const records = await healthService.getPatientRecords(req.params.patientId, req.user!.userId);

    res.json({
      success: true,
      data: records.map(r => ({
        id: r.id,
        recordType: r.recordType,
        dataHash: r.dataHash,
        blockNumber: r.blockNumber,
        status: r.status,
        createdAt: r.createdAt,
      })),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/health-records/:id/grant-access - Grant access to a record
router.post('/:id/grant-access', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { healthService, auditService } = getServices();
    const { targetUserId, role } = req.body;

    if (!targetUserId || !role) {
      res.status(400).json({ success: false, message: 'targetUserId and role are required' });
      return;
    }

    const success = await healthService.grantAccess(req.params.id, req.user!.userId, targetUserId, role);
    if (!success) {
      res.status(403).json({ success: false, message: 'Cannot grant access' });
      return;
    }

    await auditService.log({
      userId: req.user!.userId,
      action: 'update',
      entityType: 'health_record',
      entityId: req.params.id,
      description: `Granted ${role} access to ${targetUserId}`,
    });

    res.json({ success: true, message: 'Access granted' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/health-records/:id/revoke-access - Revoke access
router.post('/:id/revoke-access', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { healthService, auditService } = getServices();
    const { targetUserId } = req.body;

    if (!targetUserId) {
      res.status(400).json({ success: false, message: 'targetUserId is required' });
      return;
    }

    const success = await healthService.revokeAccess(req.params.id, req.user!.userId, targetUserId);
    if (!success) {
      res.status(403).json({ success: false, message: 'Cannot revoke access' });
      return;
    }

    await auditService.log({
      userId: req.user!.userId,
      action: 'update',
      entityType: 'health_record',
      entityId: req.params.id,
      description: `Revoked access for ${targetUserId}`,
    });

    res.json({ success: true, message: 'Access revoked' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/health-records/:id/verify - Verify record integrity
router.get('/:id/verify', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { healthService } = getServices();
    const result = await healthService.verifyIntegrity(req.params.id, req.user!.userId);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/health-records/stats/overview - Health record statistics
router.get('/stats/overview', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { healthService } = getServices();
    const stats = await healthService.getStats();
    res.json({ success: true, data: stats });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
