import { query } from '../db.js';
import { NutritionGoal, CreateNutritionGoalInput } from '../types/database.types.js';

export class NutritionGoalModel {
  /**
   * Create a new nutrition goal
   * Automatically deactivates any existing active goals for the user
   */
  static async create(goalData: CreateNutritionGoalInput): Promise<NutritionGoal> {
    const {
      user_id,
      daily_calories,
      daily_protein_g,
      daily_carbs_g,
      daily_fat_g,
      is_active = true
    } = goalData;

    await query('BEGIN');

    try {
      // Deactivate existing active goals if this one is active
      if (is_active) {
        await query(
          'UPDATE nutrition_goals SET is_active = false WHERE user_id = $1 AND is_active = true',
          [user_id]
        );
      }

      // Create new goal
      const result = await query(
        `INSERT INTO nutrition_goals (
          user_id, daily_calories, daily_protein_g, daily_carbs_g, daily_fat_g, is_active
        )
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [user_id, daily_calories, daily_protein_g, daily_carbs_g, daily_fat_g, is_active]
      );

      await query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }
  }

  /**
   * Find nutrition goal by ID
   */
  static async findById(id: number): Promise<NutritionGoal | null> {
    const result = await query('SELECT * FROM nutrition_goals WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  /**
   * Get active nutrition goal for a user
   */
  static async getActiveGoal(userId: number): Promise<NutritionGoal | null> {
    const result = await query(
      'SELECT * FROM nutrition_goals WHERE user_id = $1 AND is_active = true LIMIT 1',
      [userId]
    );

    return result.rows[0] || null;
  }

  /**
   * Get all nutrition goals for a user (active and inactive)
   */
  static async getAllUserGoals(userId: number): Promise<NutritionGoal[]> {
    const result = await query(
      'SELECT * FROM nutrition_goals WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );

    return result.rows;
  }

  /**
   * Update a nutrition goal
   */
  static async update(id: number, updates: Partial<CreateNutritionGoalInput>): Promise<NutritionGoal | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        fields.push(`${key} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    });

    if (fields.length === 0) return null;

    values.push(id);
    const result = await query(
      `UPDATE nutrition_goals SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    return result.rows[0] || null;
  }

  /**
   * Set a goal as active (deactivates others)
   */
  static async setActive(id: number, userId: number): Promise<NutritionGoal | null> {
    await query('BEGIN');

    try {
      // Deactivate all goals for user
      await query(
        'UPDATE nutrition_goals SET is_active = false WHERE user_id = $1',
        [userId]
      );

      // Activate the specified goal
      const result = await query(
        'UPDATE nutrition_goals SET is_active = true WHERE id = $1 AND user_id = $2 RETURNING *',
        [id, userId]
      );

      await query('COMMIT');
      return result.rows[0] || null;
    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }
  }

  /**
   * Delete a nutrition goal
   */
  static async delete(id: number): Promise<boolean> {
    const result = await query('DELETE FROM nutrition_goals WHERE id = $1', [id]);
    return (result.rowCount || 0) > 0;
  }

  /**
   * Check if user has an active goal
   */
  static async hasActiveGoal(userId: number): Promise<boolean> {
    const result = await query(
      'SELECT id FROM nutrition_goals WHERE user_id = $1 AND is_active = true LIMIT 1',
      [userId]
    );

    return result.rows.length > 0;
  }
}
