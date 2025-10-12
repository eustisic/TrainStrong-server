import { Router } from 'express';
import * as workoutController from '../controllers/scheduled-workouts.controller.ts';
import { validateRequired, validateId, validateUserId, validatePagination } from '../middleware/validation.ts';
import { asyncHandler } from '../middleware/errorHandler.ts';

const router = Router();

// GET /api/workouts - Get user's workouts
router.get('/', 
  validateUserId,
  validatePagination,
  asyncHandler(workoutController.getAllScheduled)
);

// GET /api/workouts/:id - Get specific workout
router.get('/:id', 
  validateId(),
  asyncHandler(workoutController.getScheduled)
);

// POST /api/workouts - Create new workout
router.post('/', 
  validateRequired(['user_id', 'workout_id']),
  asyncHandler(workoutController.addScheduledWorkout)
);

// POST /api/workouts/update - Update workout
router.post('/update', 
  validateRequired(['id']),
  asyncHandler(workoutController.updateScheduledWorkout)
);

// POST /api/workouts/delete - Delete workout
router.post('/delete', 
  validateRequired(['id']),
  asyncHandler(workoutController.deleteScheduled)
);

export default router;