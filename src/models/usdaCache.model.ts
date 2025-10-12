import { query } from '../db.js';
import { USDAFoodCache } from '../types/database.types.js';

export class USDACacheModel {
  /**
   * Get cached food data by FDC ID
   * Only returns if cache is less than 7 days old
   */
  static async getCached(fdcId: number): Promise<USDAFoodCache | null> {
    const result = await query(
      `SELECT * FROM usda_food_cache
       WHERE fdc_id = $1
       AND last_fetched_at > NOW() - INTERVAL '7 days'
       LIMIT 1`,
      [fdcId]
    );

    return result.rows[0] || null;
  }

  /**
   * Cache food data from USDA API
   */
  static async cache(fdcId: number, foodData: any, dataType?: string): Promise<USDAFoodCache> {
    const result = await query(
      `INSERT INTO usda_food_cache (fdc_id, food_data, data_type, last_fetched_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (fdc_id)
       DO UPDATE SET
         food_data = EXCLUDED.food_data,
         data_type = EXCLUDED.data_type,
         last_fetched_at = NOW()
       RETURNING *`,
      [fdcId, JSON.stringify(foodData), dataType]
    );

    return result.rows[0];
  }

  /**
   * Get multiple cached foods
   */
  static async getMultipleCached(fdcIds: number[]): Promise<USDAFoodCache[]> {
    if (fdcIds.length === 0) return [];

    const result = await query(
      `SELECT * FROM usda_food_cache
       WHERE fdc_id = ANY($1)
       AND last_fetched_at > NOW() - INTERVAL '7 days'`,
      [fdcIds]
    );

    return result.rows;
  }

  /**
   * Delete old cache entries (older than 7 days)
   */
  static async cleanOldCache(): Promise<number> {
    const result = await query(
      `DELETE FROM usda_food_cache
       WHERE last_fetched_at < NOW() - INTERVAL '7 days'`
    );

    return result.rowCount || 0;
  }

  /**
   * Get cache statistics
   */
  static async getCacheStats(): Promise<{
    total_cached: number;
    valid_cached: number;
    expired_cached: number;
  }> {
    const result = await query(`
      SELECT
        COUNT(*) as total_cached,
        COUNT(*) FILTER (WHERE last_fetched_at > NOW() - INTERVAL '7 days') as valid_cached,
        COUNT(*) FILTER (WHERE last_fetched_at <= NOW() - INTERVAL '7 days') as expired_cached
      FROM usda_food_cache
    `);

    return result.rows[0];
  }
}
