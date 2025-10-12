import { Router } from 'express';
import * as workoutController from '../controllers/workouts.controller.ts';
import { validateRequired, validateWorkoutData, validateId, validatePagination } from '../middleware/validation.ts';
import { asyncHandler } from '../middleware/errorHandler.ts';

const router = Router();

// GET /api/workouts - List all public workouts
router.get('/', 
  validatePagination,
  asyncHandler(workoutController.getWorkouts)
);

// GET /api/workouts/:id - Get specific workout
router.get('/:id', 
  validateId(),
  asyncHandler(workoutController.getWorkout)
);

// POST /api/workouts - Create new workout
router.post('/', 
  validateRequired(['name', 'category', 'workout_data']),
  validateWorkoutData,
  asyncHandler(workoutController.createWorkout)
);

// PUT /api/workouts/:id - Update workout
router.put('/:id',
  validateId(),
  asyncHandler(workoutController.updateWorkout)
);

// DELETE /api/workouts/:id - Delete workout
router.delete('/:id', 
  validateId(),
  asyncHandler(workoutController.deleteWorkout)
);

export default router;