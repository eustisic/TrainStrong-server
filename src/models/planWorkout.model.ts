import { query } from '../db.js';
import { PlanWorkout, CreatePlanWorkoutInput } from '../types/database.types.js';

export class PlanWorkoutModel {
  static async create(planId: number, workoutData: CreatePlanWorkoutInput): Promise<PlanWorkout> {
    const {
      workout_id,
      week_day,
      week_offset,
      workout_order,
      workout_data_override
    } = workoutData;
    
    const result = await query(
      `INSERT INTO plan_workouts (plan_id, workout_id, week_day, week_offset, workout_order, workout_data_override)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [planId, workout_id, week_day, week_offset, workout_order, workout_data_override ? JSON.stringify(workout_data_override) : null]
    );
    
    return result.rows[0];
  }

  static async findByPlanId(planId: number): Promise<PlanWorkout[]> {
    const result = await query(
      `SELECT pw.*, w.name as workout_name, w.category, w.equipment, w.description, w.instructions, w.workout_data
       FROM plan_workouts pw
       INNER JOIN workouts w ON pw.workout_id = w.id
       WHERE pw.plan_id = $1
       ORDER BY pw.week_offset, pw.week_day, pw.workout_order`,
      [planId]
    );
    return result.rows;
  }

  static async findById(id: number): Promise<PlanWorkout | null> {
    const result = await query('SELECT * FROM plan_workouts WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  static async update(id: number, updates: Partial<CreatePlanWorkoutInput>): Promise<PlanWorkout | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        if (key === 'workout_data_override') {
          fields.push(`${key} = $${paramCount}`);
          values.push(value ? JSON.stringify(value) : null);
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
      `UPDATE plan_workouts SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    return result.rows[0] || null;
  }

  static async delete(id: number): Promise<boolean> {
    const result = await query('DELETE FROM plan_workouts WHERE id = $1', [id]);
    return (result.rowCount || 0) > 0;
  }

  static async deleteByPlanId(planId: number): Promise<boolean> {
    const result = await query('DELETE FROM plan_workouts WHERE plan_id = $1', [planId]);
    return (result.rowCount || 0) > 0;
  }

  static async bulkUpsert(planId: number, workouts: CreatePlanWorkoutInput[]): Promise<PlanWorkout[]> {
    // Start a transaction
    await query('BEGIN');
    
    try {
      // Delete existing workouts for the plan
      await query('DELETE FROM plan_workouts WHERE plan_id = $1', [planId]);
      
      // Insert new workouts
      const insertedWorkouts: PlanWorkout[] = [];
      
      for (const workout of workouts) {
        const result = await query(
          `INSERT INTO plan_workouts (plan_id, workout_id, week_day, week_offset, workout_order, workout_data_override)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING *`,
          [
            planId,
            workout.workout_id,
            workout.week_day,
            workout.week_offset,
            workout.workout_order,
            workout.workout_data_override ? JSON.stringify(workout.workout_data_override) : null
          ]
        );
        insertedWorkouts.push(result.rows[0]);
      }
      
      await query('COMMIT');
      return insertedWorkouts;
    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }
  }

  static async reorderWorkouts(planId: number, reorderedIds: number[]): Promise<boolean> {
    await query('BEGIN');
    
    try {
      for (let i = 0; i < reorderedIds.length; i++) {
        await query(
          'UPDATE plan_workouts SET workout_order = $1 WHERE id = $2 AND plan_id = $3',
          [i + 1, reorderedIds[i], planId]
        );
      }
      
      await query('COMMIT');
      return true;
    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }
  }
}