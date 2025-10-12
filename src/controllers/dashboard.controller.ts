import { Request, Response } from 'express';
import { WorkoutModel } from '../models/workout.model.js';
import { ScheduledWorkoutModel } from '../models/scheduledWorkout.model.ts';

// GET /api/dashboard
export async function getDashboard(req: Request, res: Response) {
  try {
    const userId = parseInt(req.query.user_id as string);
    const days = parseInt(req.query.days as string) || 30;

    // For now, require user_id to be provided
    // TODO: In real app, this would come from authentication
    if (!userId || isNaN(userId)) {
      return res.status(400).json({
        success: false,
        error: 'user_id is required'
      });
    }

    // Get workout statistics
    const workoutStats = await ScheduledWorkoutModel.getWorkoutStats(userId, days);

    // Get recent workouts
    const recentWorkouts = await ScheduledWorkoutModel.findByUserId(userId, 10, 0);

    // Get total workout count (public workouts available)
    const totalWorkouts = await WorkoutModel.findPublicWorkouts(1000, 0);

    // Calculate workout frequency
    const workoutFrequency = days > 0 ? 
      (parseInt(workoutStats.workout_days) / days * 100).toFixed(1) : 0;

    return res.json({
      success: true,
      data: {
        period_days: days,
        stats: {
          total_workouts: parseInt(workoutStats.total_workouts),
          workout_days: parseInt(workoutStats.workout_days),
          unique_workouts: parseInt(workoutStats.unique_workouts),
          workout_frequency_percent: parseFloat(workoutFrequency as string),
          available_workouts: totalWorkouts.length
        },
        recent_workouts: recentWorkouts.slice(0, 5), // Last 5 workouts
        summary: {
          message: `In the last ${days} days, you completed ${workoutStats.total_workouts} workouts across ${workoutStats.workout_days} days.`,
          avg_workouts_per_day: days > 0 ? 
            (parseInt(workoutStats.total_workouts) / days).toFixed(2) : 0
        }
      }
    });
  } catch (error) {
    console.error('Error getting dashboard data:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard data'
    });
  }
}