import { Router, Response } from 'express';
import { authenticateToken, AuthenticatedRequest } from '@/middleware/auth';
import { ZKProofService } from '@/services/ZKProofService';

const router = Router();
const zkService = new ZKProofService();

// Store globally for other services
(global as any).__zkProofService = zkService;

// POST /api/privacy/zk/proof-of-knowledge - Generate a proof of knowledge
router.post('/zk/proof-of-knowledge', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { secret } = req.body;
    if (!secret) {
      res.status(400).json({ success: false, message: 'Secret is required' });
      return;
    }

    const proof = zkService.generateProofOfKnowledge(secret);
    res.json({
      success: true,
      data: {
        proofId: proof.proofId,
        commitment: proof.commitment,
        challenge: proof.challenge,
        response: proof.response,
        publicInput: proof.publicInput,
        proofType: proof.proofType,
        timestamp: proof.timestamp,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/privacy/zk/range-proof - Prove value is in range without revealing it
router.post('/zk/range-proof', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { value, min, max } = req.body;
    if (value === undefined || min === undefined || max === undefined) {
      res.status(400).json({ success: false, message: 'value, min, and max are required' });
      return;
    }

    const proof = zkService.generateRangeProof({ value, min, max });
    res.json({
      success: true,
      data: {
        proofId: proof.proofId,
        verified: proof.verified,
        proofType: proof.proofType,
        commitment: proof.commitment,
        timestamp: proof.timestamp,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/privacy/zk/membership-proof - Prove membership in a set
router.post('/zk/membership-proof', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { element, set } = req.body;
    if (!element || !set || !Array.isArray(set)) {
      res.status(400).json({ success: false, message: 'element and set (array) are required' });
      return;
    }

    const proof = zkService.generateMembershipProof(element, set);
    res.json({
      success: true,
      data: {
        proofId: proof.proofId,
        verified: proof.verified,
        proofType: proof.proofType,
        commitment: proof.commitment,
        timestamp: proof.timestamp,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/privacy/zk/integrity-proof - Prove data integrity
router.post('/zk/integrity-proof', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { data } = req.body;
    if (!data) {
      res.status(400).json({ success: false, message: 'data is required' });
      return;
    }

    const proof = zkService.generateIntegrityProof(typeof data === 'string' ? data : JSON.stringify(data));
    res.json({
      success: true,
      data: {
        proofId: proof.proofId,
        verified: proof.verified,
        proofType: proof.proofType,
        publicInput: proof.publicInput,
        timestamp: proof.timestamp,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/privacy/zk/verify/:proofId - Verify a proof
router.get('/zk/verify/:proofId', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = zkService.verifyProof(req.params.proofId);
    if (!result) {
      res.status(404).json({ success: false, message: 'Proof not found' });
      return;
    }

    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/privacy/zk/proofs - List all proofs
router.get('/zk/proofs', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  try {
    const proofs = zkService.getAllProofs();
    res.json({ success: true, data: { proofs, total: proofs.length } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
