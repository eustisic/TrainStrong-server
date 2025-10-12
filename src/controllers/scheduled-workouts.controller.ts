import { Request, Response } from 'express';
import { ScheduledWorkoutModel } from '../models/scheduledWorkout.model.ts';
import { CreateScheduledWorkoutInput } from '../types/database.types.ts';

// GET /api/workouts
export async function getAllScheduled(req: Request, res: Response) {
  try {
    const limit = parseInt(req.query.limit as string) || 100;
    const offset = parseInt(req.query.offset as string) || 0;
    const userId = parseInt(req.query.user_id as string);
    const workoutId = parseInt(req.query.workout_id as string);
    const userPlanId = parseInt(req.query.user_plan_id as string);
    const planId = parseInt(req.query.plan_id as string);
    const startDate = req.query.start_date as string;
    const endDate = req.query.end_date as string;

    // For now, require user_id to be provided
    // TODO: In real app, this would come from authentication
    if (!userId || isNaN(userId)) {
      return res.status(400).json({
        success: false,
        error: 'user_id is required'
      });
    }

    let workouts;

    // Use the new findWithFilters method for more flexible querying
    workouts = await ScheduledWorkoutModel.findWithFilters({
      userId,
      userPlanId: userPlanId || undefined,
      planId: planId || undefined,
      workoutId: workoutId || undefined,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      limit,
      offset
    });

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
export async function getScheduled(req: Request, res: Response) {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid workout ID'
      });
    }

    const workout = await ScheduledWorkoutModel.findById(id);

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
export async function addScheduledWorkout(req: Request, res: Response) {
  try {
    const workoutData: CreateScheduledWorkoutInput = req.body;

    // Basic validation
    if (!workoutData.user_id || !workoutData.workout_id) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: user_id, workout_id'
      });
    }

    let workout;

    // If completed_workout_data is provided, use it directly
    if (workoutData.completed_workout_data) {
      workout = await ScheduledWorkoutModel.create(workoutData);
    } else {
      // Otherwise, create workout from workout template
      workout = await ScheduledWorkoutModel.createFromWorkout(
        workoutData.user_id,
        workoutData.workout_id,
        workoutData.notes
      );
    }

    if (!workout) {
      return res.status(400).json({
        success: false,
        error: 'Workout not found or failed to create workout'
      });
    }

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

// POST /api/workouts/update
export async function updateScheduledWorkout(req: Request, res: Response) {
  try {
    const { id, ...updateData } = req.body;

    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        error: 'Invalid workout ID'
      });
    }

    const updatedWorkout = await ScheduledWorkoutModel.update(parseInt(id), updateData);

    if (!updatedWorkout) {
      return res.status(404).json({
        success: false,
        error: 'Workout not found or no changes made'
      });
    }

    return res.json({
      success: true,
      data: updatedWorkout,
      message: 'Workout updated successfully'
    });
  } catch (error) {
    console.error('Error updating workout:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update workout'
    });
  }
}

// POST /api/workouts/delete
export async function deleteScheduled(req: Request, res: Response) {
  try {
    const { id } = req.body;

    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        error: 'Invalid workout ID'
      });
    }

    const deleted = await ScheduledWorkoutModel.delete(parseInt(id));

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