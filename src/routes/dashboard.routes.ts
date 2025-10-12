import { Router } from 'express';
import * as dashboardController from '../controllers/dashboard.controller.js';
import { validateUserId } from '../middleware/validation.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();

// GET /api/dashboard - Get dashboard data/stats
router.get('/', 
  validateUserId,
  asyncHandler(dashboardController.getDashboard)
);

export default router;