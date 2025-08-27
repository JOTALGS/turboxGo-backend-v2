import { Router, Request, Response } from 'express';
import { healthService } from '../services/healthService';
import { ApiResponse, HealthStatus } from '../types';

const router = Router();

router.get('/', (req: Request, res: Response<ApiResponse<HealthStatus>>) => {
  try {
    const healthStatus = healthService.getHealthStatus();
    res.json({
      success: true,
      data: healthStatus,
      message: 'Health check successful'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Health check failed'
    });
  }
});

export { router as healthRoutes };