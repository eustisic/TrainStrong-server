import { query } from '../db.js';
import { UserPlan, CreateUserPlanInput, CreateScheduledWorkoutInput } from '../types/database.types.js';
import { PlanWorkoutModel } from './planWorkout.model.js';
import { WorkoutModel } from './workout.model.js';

export class UserPlanModel {
  static async subscribe(input: CreateUserPlanInput): Promise<UserPlan> {
    const { user_id, plan_id, start_date } = input;

    await query('BEGIN');

    try {
      // Get plan details to calculate end date
      const planResult = await query('SELECT duration_weeks FROM plans WHERE id = $1', [plan_id]);
      if (!planResult.rows[0]) {
        throw new Error('Plan not found');
      }

      const durationWeeks = planResult.rows[0].duration_weeks;
      const endDate = new Date(start_date);
      endDate.setDate(endDate.getDate() + (durationWeeks * 7));

      // Create user plan
      const userPlanResult = await query(
        `INSERT INTO user_plans (user_id, plan_id, start_date, end_date, status)
         VALUES ($1, $2, $3, $4, 'active')
         RETURNING *`,
        [user_id, plan_id, start_date, endDate]
      );

      const userPlan = userPlanResult.rows[0];

      // Generate workouts for the plan
      await this.generateWorkouts(userPlan);

      await query('COMMIT');
      return userPlan;
    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }
  }

  static async unsubscribe(userPlanId: number, userId: number): Promise<boolean> {
    // First delete all associated scheduled workouts
    await query('DELETE FROM scheduled_workouts WHERE user_plan_id = $1 AND user_id = $2', [userPlanId, userId]);
    
    // Then delete the user plan
    const result = await query(
      'DELETE FROM user_plans WHERE id = $1 AND user_id = $2',
      [userPlanId, userId]
    );
    
    return (result.rowCount || 0) > 0;
  }

  static async updateStatus(userPlanId: number, userId: number, status: UserPlan['status']): Promise<UserPlan | null> {
    const result = await query(
      `UPDATE user_plans 
       SET status = $1
       WHERE id = $2 AND user_id = $3
       RETURNING *`,
      [status, userPlanId, userId]
    );
    
    return result.rows[0] || null;
  }

  static async findById(id: number): Promise<UserPlan | null> {
    const result = await query('SELECT * FROM user_plans WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  static async findByUserId(userId: number, status?: UserPlan['status']): Promise<UserPlan[]> {
    let queryText = 'SELECT * FROM user_plans WHERE user_id = $1';
    const params: any[] = [userId];
    
    if (status) {
      queryText += ' AND status = $2';
      params.push(status);
    }
    
    queryText += ' ORDER BY created_at DESC';
    
    const result = await query(queryText, params);
    return result.rows;
  }

  static async findActiveByUserAndPlan(userId: number, planId: number): Promise<UserPlan | null> {
    const result = await query(
      `SELECT * FROM user_plans 
       WHERE user_id = $1 AND plan_id = $2 AND status = 'active'
       ORDER BY created_at DESC
       LIMIT 1`,
      [userId, planId]
    );
    return result.rows[0] || null;
  }

  private static async generateWorkouts(userPlan: UserPlan): Promise<void> {
    // Get all workouts for the plan
    const planWorkouts = await PlanWorkoutModel.findByPlanId(userPlan.plan_id);

    const scheduledWorkoutsToCreate: CreateScheduledWorkoutInput[] = [];

    for (const planWorkout of planWorkouts) {
      // Calculate the actual date for this workout
      const workoutDate = new Date(userPlan.start_date);

      // Add weeks offset
      workoutDate.setDate(workoutDate.getDate() + (planWorkout.week_offset * 7));

      // Set to the correct day of week
      const currentDayOfWeek = workoutDate.getDay();
      const daysToAdd = planWorkout.week_day - currentDayOfWeek;
      workoutDate.setDate(workoutDate.getDate() + daysToAdd);

      // Get workout details
      const workout = await WorkoutModel.findById(planWorkout.workout_id);
      if (!workout) continue;

      // Merge workout data with any overrides
      const workoutData = planWorkout.workout_data_override || workout.workout_data;

      // Create scheduled workout input
      scheduledWorkoutsToCreate.push({
        user_id: userPlan.user_id,
        workout_id: planWorkout.workout_id,
        completed_workout_data: {
          name: workout.name,
          category: workout.category,
          equipment: workout.equipment,
          description: workout.description,
          instructions: workout.instructions,
          workout_data: workoutData
        },
        performed_at: workoutDate,
        plan_id: userPlan.plan_id,
        user_plan_id: userPlan.id,
        plan_workout_id: planWorkout.id
      });
    }

    // Bulk create scheduled workouts in a single query
    if (scheduledWorkoutsToCreate.length > 0) {
      const values: any[] = [];
      const placeholders: string[] = [];
      let paramCount = 1;

      scheduledWorkoutsToCreate.forEach((workout) => {
        placeholders.push(
          `($${paramCount}, $${paramCount + 1}, $${paramCount + 2}, $${paramCount + 3}, $${paramCount + 4}, $${paramCount + 5}, $${paramCount + 6}, $${paramCount + 7})`
        );
        values.push(
          workout.user_id,
          workout.workout_id,
          JSON.stringify(workout.completed_workout_data),
          workout.performed_at,
          workout.notes || null,
          workout.plan_id,
          workout.user_plan_id,
          workout.plan_workout_id
        );
        paramCount += 8;
      });

      await query(
        `INSERT INTO scheduled_workouts
          (user_id, workout_id, completed_workout_data, performed_at, notes, plan_id, user_plan_id, plan_workout_id)
         VALUES ${placeholders.join(', ')}
         ON CONFLICT (user_id, user_plan_id, plan_workout_id, performed_at) DO NOTHING`,
        values
      );
    }
  }

  static async regenerateWorkouts(userPlanId: number, userId: number): Promise<void> {
    // Get user plan
    const userPlan = await this.findById(userPlanId);
    if (!userPlan || userPlan.user_id !== userId) {
      throw new Error('User plan not found or unauthorized');
    }

    await query('BEGIN');

    try {
      // Delete existing scheduled workouts
      await query('DELETE FROM scheduled_workouts WHERE user_plan_id = $1 AND user_id = $2', [userPlanId, userId]);

      // Generate new workouts
      await this.generateWorkouts(userPlan);

      await query('COMMIT');
    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }
  }

  static async reschedule(userPlanId: number, userId: number, newStartDate: Date): Promise<UserPlan> {
    await query('BEGIN');

    try {
      // Get user plan
      const userPlan = await this.findById(userPlanId);
      if (!userPlan || userPlan.user_id !== userId) {
        throw new Error('User plan not found or unauthorized');
      }

      // Get plan details to calculate new end date
      const planResult = await query('SELECT duration_weeks FROM plans WHERE id = $1', [userPlan.plan_id]);
      if (!planResult.rows[0]) {
        throw new Error('Plan not found');
      }

      const durationWeeks = planResult.rows[0].duration_weeks;
      const newEndDate = new Date(newStartDate);
      newEndDate.setDate(newEndDate.getDate() + (durationWeeks * 7));

      // Update user plan with new dates
      const updateResult = await query(
        `UPDATE user_plans
         SET start_date = $1, end_date = $2
         WHERE id = $3 AND user_id = $4
         RETURNING *`,
        [newStartDate, newEndDate, userPlanId, userId]
      );

      const updatedUserPlan = updateResult.rows[0];

      // Delete existing scheduled workouts
      await query('DELETE FROM scheduled_workouts WHERE user_plan_id = $1 AND user_id = $2', [userPlanId, userId]);

      // Generate new workouts with updated dates
      await this.generateWorkouts(updatedUserPlan);

      await query('COMMIT');
      return updatedUserPlan;
    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }
  }
}