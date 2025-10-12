import { Request, Response } from 'express';
import { WorkoutModel } from '../models/workout.model.ts';
import { CreateWorkoutInput } from '../types/database.types.ts';

// GET /api/workouts
export async function getWorkouts(req: Request, res: Response) {
  try {
    const limit = parseInt(req.query.limit as string) || 100;
    const offset = parseInt(req.query.offset as string) || 0;
    const category = req.query.category as string;
    const search = req.query.search as string;

    let workouts;

    if (search) {
      workouts = await WorkoutModel.search(search, limit);
    } else if (category) {
      workouts = await WorkoutModel.findByCategory(category);
    } else {
      workouts = await WorkoutModel.findPublicWorkouts(limit, offset);
    }

    return res.json({
      success: true,
      data: workouts,
      count: workouts.length
    });
  } catch (error) {
    console.error('Error getting workouts:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch workouts'
    });
  }
}

// GET /api/workouts/:id
export async function getWorkout(req: Request, res: Response) {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid workout ID'
      });
    }

    const workout = await WorkoutModel.findById(id);

    if (!workout) {
      return res.status(404).json({
        success: false,
        error: 'Workout not found'
      });
    }

    return res.json({
      success: true,
      data: workout
    });
  } catch (error) {
    console.error('Error getting workout:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch workout'
    });
  }
}

// POST /api/workouts
export async function createWorkout(req: Request, res: Response) {
  try {
    const workoutData: CreateWorkoutInput = req.body;

    // Basic validation
    if (!workoutData.name || !workoutData.category || !workoutData.workout_data) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name, category, workout_data'
      });
    }

    // Validate name length
    if (workoutData.name.length > 255) {
      return res.status(400).json({
        success: false,
        error: 'Workout name is too long (max 255 characters)'
      });
    }

    const workout = await WorkoutModel.create(workoutData);

    return res.status(201).json({
      success: true,
      data: workout,
      message: 'Workout created successfully'
    });
  } catch (error) {
    console.error('Error creating workout:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to create workout'
    });
  }
}

// PUT /api/workouts/:id
export async function updateWorkout(req: Request, res: Response) {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid workout ID'
      });
    }

    // Validate workout_data if provided
    if (req.body.workout_data && typeof req.body.workout_data !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'Invalid workout_data format'
      });
    }

    const updated = await WorkoutModel.update(id, req.body);

    if (!updated) {
      return res.status(404).json({
        success: false,
        error: 'Workout not found'
      });
    }

    return res.json({
      success: true,
      data: updated
    });
  } catch (error) {
    console.error('Error updating workout:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update workout'
    });
  }
}

// DELETE /api/workouts/:id
export async function deleteWorkout(req: Request, res: Response) {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid workout ID'
      });
    }

    const deleted = await WorkoutModel.delete(id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Workout not found'
      });
    }

    return res.json({
      success: true,
      message: 'Workout deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting workout:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete workout'
    });
  }
}