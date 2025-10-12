import { query } from '../db.js';
import { ScheduledWorkout, CreateScheduledWorkoutInput, CompletedWorkoutData } from '../types/database.types.js';
import { WorkoutModel } from './workout.model.js';

export class ScheduledWorkoutModel {
  static async create(scheduledWorkoutData: CreateScheduledWorkoutInput): Promise<ScheduledWorkout> {
    const { 
      user_id, 
      workout_id, 
      completed_workout_data, 
      performed_at, 
      notes,
      plan_id,
      user_plan_id,
      plan_workout_id
    } = scheduledWorkoutData;
    
    const result = await query(
      `INSERT INTO scheduled_workouts (user_id, workout_id, completed_workout_data, performed_at, notes, plan_id, user_plan_id, plan_workout_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        user_id,
        workout_id,
        JSON.stringify(completed_workout_data),
        performed_at || new Date(),
        notes,
        plan_id,
        user_plan_id,
        plan_workout_id
      ]
    );
    
    return result.rows[0];
  }

  static async createFromWorkout(userId: number, workoutId: number, notes?: string): Promise<ScheduledWorkout | null> {
    // Fetch the workout to get its current data
    const workout = await WorkoutModel.findById(workoutId);
    if (!workout) return null;

    // Create completed workout data from the workout
    const completedWorkoutData: CompletedWorkoutData = {
      name: workout.name,
      category: workout.category,
      equipment: workout.equipment,
      description: workout.description,
      instructions: workout.instructions,
      workout_data: workout.workout_data
    };

    return this.create({
      user_id: userId,
      workout_id: workoutId,
      completed_workout_data: completedWorkoutData,
      notes
    });
  }

  static async findById(id: number): Promise<ScheduledWorkout | null> {
    const result = await query('SELECT * FROM scheduled_workouts WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  static async findByUserId(userId: number, limit = 100, offset = 0): Promise<ScheduledWorkout[]> {
    const result = await query(
      'SELECT * FROM scheduled_workouts WHERE user_id = $1 ORDER BY performed_at DESC LIMIT $2 OFFSET $3',
      [userId, limit, offset]
    );
    return result.rows;
  }

  static async findByWorkoutId(workoutId: number, limit = 100, offset = 0): Promise<ScheduledWorkout[]> {
    const result = await query(
      'SELECT * FROM scheduled_workouts WHERE workout_id = $1 ORDER BY performed_at DESC LIMIT $2 OFFSET $3',
      [workoutId, limit, offset]
    );
    return result.rows;
  }

  static async findByUserAndDateRange(
    userId: number,
    startDate: Date,
    endDate: Date
  ): Promise<ScheduledWorkout[]> {
    const result = await query(
      `SELECT * FROM scheduled_workouts 
       WHERE user_id = $1 AND performed_at >= $2 AND performed_at <= $3
       ORDER BY performed_at DESC`,
      [userId, startDate, endDate]
    );
    return result.rows;
  }

  static async update(id: number, updates: Partial<CreateScheduledWorkoutInput>): Promise<ScheduledWorkout | null> {
    const fields: any[] = [];
    const values = [];
    let paramCount = 1;

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        if (key === 'completed_workout_data') {
          fields.push(`${key} = $${paramCount}`);
          values.push(JSON.stringify(value));
        } else {
          fields.push(`${key} = $${paramCount}`);
          values.push(value);
        }
        paramCount++;
      }
    });

    if (fields.length === 0) return null;

    values.push(id);
    const result = await query(
      `UPDATE scheduled_workouts SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    return result.rows[0] || null;
  }

  static async delete(id: number): Promise<boolean> {
    const result = await query('DELETE FROM scheduled_workouts WHERE id = $1', [id]);
    return (result.rowCount || 0) > 0;
  }

  static async getWorkoutStats(userId: number, days = 30): Promise<any> {
    const result = await query(
      `SELECT 
        COUNT(*) as total_workouts,
        COUNT(DISTINCT DATE(performed_at)) as workout_days,
        COUNT(DISTINCT workout_id) as unique_workouts
       FROM scheduled_workouts 
       WHERE user_id = $1 AND performed_at >= NOW() - INTERVAL '${days} days'`,
      [userId]
    );
    return result.rows[0];
  }

  static async getWorkoutHistory(userId: number, workoutId: number, limit = 10): Promise<ScheduledWorkout[]> {
    const result = await query(
      `SELECT * FROM scheduled_workouts 
       WHERE user_id = $1 AND workout_id = $2
       ORDER BY performed_at DESC
       LIMIT $3`,
      [userId, workoutId, limit]
    );
    return result.rows;
  }

  static async findByUserPlanId(userPlanId: number, limit = 100, offset = 0): Promise<ScheduledWorkout[]> {
    const result = await query(
      'SELECT * FROM scheduled_workouts WHERE user_plan_id = $1 ORDER BY performed_at ASC LIMIT $2 OFFSET $3',
      [userPlanId, limit, offset]
    );
    return result.rows;
  }

  static async bulkDeleteByUserPlanId(userPlanId: number, userId: number): Promise<number> {
    const result = await query(
      'DELETE FROM scheduled_workouts WHERE user_plan_id = $1 AND user_id = $2',
      [userPlanId, userId]
    );
    return result.rowCount || 0;
  }

  static async findWithFilters(filters: {
    userId?: number;
    userPlanId?: number;
    planId?: number;
    workoutId?: number;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }): Promise<ScheduledWorkout[]> {
    const conditions: string[] = [];
    const params: any[] = [];
    let paramCount = 1;

    if (filters.userId) {
      conditions.push(`user_id = $${paramCount}`);
      params.push(filters.userId);
      paramCount++;
    }

    if (filters.userPlanId) {
      conditions.push(`user_plan_id = $${paramCount}`);
      params.push(filters.userPlanId);
      paramCount++;
    }

    if (filters.planId) {
      conditions.push(`plan_id = $${paramCount}`);
      params.push(filters.planId);
      paramCount++;
    }

    if (filters.workoutId) {
      conditions.push(`workout_id = $${paramCount}`);
      params.push(filters.workoutId);
      paramCount++;
    }

    if (filters.startDate) {
      conditions.push(`performed_at >= $${paramCount}`);
      params.push(filters.startDate);
      paramCount++;
    }

    if (filters.endDate) {
      conditions.push(`performed_at <= $${paramCount}`);
      params.push(filters.endDate);
      paramCount++;
    }

    let queryText = 'SELECT * FROM scheduled_workouts';
    if (conditions.length > 0) {
      queryText += ' WHERE ' + conditions.join(' AND ');
    }
    queryText += ' ORDER BY performed_at DESC';

    if (filters.limit) {
      queryText += ` LIMIT $${paramCount}`;
      params.push(filters.limit);
      paramCount++;
    }

    if (filters.offset) {
      queryText += ` OFFSET $${paramCount}`;
      params.push(filters.offset);
    }

    const result = await query(queryText, params);
    return result.rows;
  }
}