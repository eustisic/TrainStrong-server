import { query } from '../db.js';
import { UserRecentFood } from '../types/database.types.js';

export class UserRecentFoodsModel {
  /**
   * Track when a user adds a food (for recent foods list)
   */
  static async trackFood(userId: number, fdcId: number, foodName: string): Promise<UserRecentFood> {
    const result = await query(
      `INSERT INTO user_recent_foods (user_id, fdc_id, food_name, times_used, last_used_at)
       VALUES ($1, $2, $3, 1, NOW())
       ON CONFLICT (user_id, fdc_id)
       DO UPDATE SET
         times_used = user_recent_foods.times_used + 1,
         last_used_at = NOW()
       RETURNING *`,
      [userId, fdcId, foodName]
    );

    return result.rows[0];
  }

  /**
   * Get user's recent foods, sorted by last used
   */
  static async getRecentFoods(userId: number, limit: number = 20): Promise<UserRecentFood[]> {
    const result = await query(
      `SELECT * FROM user_recent_foods
       WHERE user_id = $1
       ORDER BY last_used_at DESC
       LIMIT $2`,
      [userId, limit]
    );

    return result.rows;
  }

  /**
   * Get user's most frequently used foods
   */
  static async getFrequentFoods(userId: number, limit: number = 20): Promise<UserRecentFood[]> {
    const result = await query(
      `SELECT * FROM user_recent_foods
       WHERE user_id = $1
       ORDER BY times_used DESC, last_used_at DESC
       LIMIT $2`,
      [userId, limit]
    );

    return result.rows;
  }

  /**
   * Clear a user's recent foods history
   */
  static async clearUserHistory(userId: number): Promise<number> {
    const result = await query(
      'DELETE FROM user_recent_foods WHERE user_id = $1',
      [userId]
    );

    return result.rowCount || 0;
  }

  /**
   * Remove a specific food from user's recent list
   */
  static async removeFood(userId: number, fdcId: number): Promise<boolean> {
    const result = await query(
      'DELETE FROM user_recent_foods WHERE user_id = $1 AND fdc_id = $2',
      [userId, fdcId]
    );

    return (result.rowCount || 0) > 0;
  }

  /**
   * Get statistics for a user's food tracking
   */
  static async getUserStats(userId: number): Promise<{
    total_unique_foods: number;
    total_logs: number;
    most_logged_food: string | null;
  }> {
    const result = await query(
      `SELECT
         COUNT(*) as total_unique_foods,
         SUM(times_used) as total_logs,
         (SELECT food_name FROM user_recent_foods
          WHERE user_id = $1
          ORDER BY times_used DESC
          LIMIT 1) as most_logged_food
       FROM user_recent_foods
       WHERE user_id = $1`,
      [userId]
    );

    return result.rows[0];
  }
}
