import { query } from '../db.js';
import { FoodEntry, CreateFoodEntryInput, MealType } from '../types/database.types.js';

export class FoodEntryModel {
  /**
   * Create a new food entry
   */
  static async create(entryData: CreateFoodEntryInput): Promise<FoodEntry> {
    const {
      user_id,
      fdc_id,
      food_name,
      data_type,
      serving_size,
      serving_unit,
      calories,
      protein_g,
      carbs_g,
      fat_g,
      fiber_g,
      consumed_at,
      meal_type,
      notes
    } = entryData;

    const result = await query(
      `INSERT INTO food_entries (
        user_id, fdc_id, food_name, data_type, serving_size, serving_unit,
        calories, protein_g, carbs_g, fat_g, fiber_g,
        consumed_at, meal_type, notes
      )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
       RETURNING *`,
      [
        user_id,
        fdc_id,
        food_name,
        data_type,
        serving_size,
        serving_unit,
        calories,
        protein_g,
        carbs_g,
        fat_g,
        fiber_g,
        consumed_at || new Date(),
        meal_type,
        notes
      ]
    );

    return result.rows[0];
  }

  /**
   * Find food entry by ID
   */
  static async findById(id: number): Promise<FoodEntry | null> {
    const result = await query('SELECT * FROM food_entries WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  /**
   * Find all food entries for a user
   */
  static async findByUserId(userId: number, limit: number = 100, offset: number = 0): Promise<FoodEntry[]> {
    const result = await query(
      `SELECT * FROM food_entries
       WHERE user_id = $1
       ORDER BY consumed_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    return result.rows;
  }

  /**
   * Find food entries by date range
   */
  static async findByDateRange(
    userId: number,
    startDate: Date,
    endDate: Date
  ): Promise<FoodEntry[]> {
    const result = await query(
      `SELECT * FROM food_entries
       WHERE user_id = $1
       AND consumed_at >= $2
       AND consumed_at <= $3
       ORDER BY consumed_at DESC`,
      [userId, startDate, endDate]
    );

    return result.rows;
  }

  /**
   * Find food entries for a specific date
   */
  static async findByDate(userId: number, date: Date): Promise<FoodEntry[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return this.findByDateRange(userId, startOfDay, endOfDay);
  }

  /**
   * Find food entries by meal type
   */
  static async findByMealType(
    userId: number,
    mealType: MealType,
    limit: number = 100,
    offset: number = 0
  ): Promise<FoodEntry[]> {
    const result = await query(
      `SELECT * FROM food_entries
       WHERE user_id = $1 AND meal_type = $2
       ORDER BY consumed_at DESC
       LIMIT $3 OFFSET $4`,
      [userId, mealType, limit, offset]
    );

    return result.rows;
  }

  /**
   * Find food entries with filters
   */
  static async findWithFilters(filters: {
    userId: number;
    date?: Date;
    startDate?: Date;
    endDate?: Date;
    mealType?: MealType;
    limit?: number;
    offset?: number;
  }): Promise<FoodEntry[]> {
    const conditions: string[] = ['user_id = $1'];
    const params: any[] = [filters.userId];
    let paramCount = 2;

    // Handle single date
    if (filters.date) {
      const startOfDay = new Date(filters.date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(filters.date);
      endOfDay.setHours(23, 59, 59, 999);

      conditions.push(`consumed_at >= $${paramCount}`);
      params.push(startOfDay);
      paramCount++;

      conditions.push(`consumed_at <= $${paramCount}`);
      params.push(endOfDay);
      paramCount++;
    }
    // Handle date range
    else if (filters.startDate || filters.endDate) {
      if (filters.startDate) {
        conditions.push(`consumed_at >= $${paramCount}`);
        params.push(filters.startDate);
        paramCount++;
      }
      if (filters.endDate) {
        conditions.push(`consumed_at <= $${paramCount}`);
        params.push(filters.endDate);
        paramCount++;
      }
    }

    if (filters.mealType) {
      conditions.push(`meal_type = $${paramCount}`);
      params.push(filters.mealType);
      paramCount++;
    }

    let queryText = `SELECT * FROM food_entries WHERE ${conditions.join(' AND ')} ORDER BY consumed_at DESC`;

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

  /**
   * Update a food entry
   */
  static async update(id: number, updates: Partial<CreateFoodEntryInput>): Promise<FoodEntry | null> {
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
      `UPDATE food_entries SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    return result.rows[0] || null;
  }

  /**
   * Delete a food entry
   */
  static async delete(id: number): Promise<boolean> {
    const result = await query('DELETE FROM food_entries WHERE id = $1', [id]);
    return (result.rowCount || 0) > 0;
  }

  /**
   * Get daily nutrition summary for a user
   */
  static async getDailySummary(userId: number, date: Date): Promise<{
    total_calories: number;
    total_protein_g: number;
    total_carbs_g: number;
    total_fat_g: number;
    total_fiber_g: number;
    entry_count: number;
    meals: {
      breakfast: number;
      lunch: number;
      dinner: number;
      snack: number;
    };
  }> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const result = await query(
      `SELECT
         COALESCE(SUM(calories), 0) as total_calories,
         COALESCE(SUM(protein_g), 0) as total_protein_g,
         COALESCE(SUM(carbs_g), 0) as total_carbs_g,
         COALESCE(SUM(fat_g), 0) as total_fat_g,
         COALESCE(SUM(fiber_g), 0) as total_fiber_g,
         COUNT(*) as entry_count,
         COUNT(*) FILTER (WHERE meal_type = 'breakfast') as breakfast,
         COUNT(*) FILTER (WHERE meal_type = 'lunch') as lunch,
         COUNT(*) FILTER (WHERE meal_type = 'dinner') as dinner,
         COUNT(*) FILTER (WHERE meal_type = 'snack') as snack
       FROM food_entries
       WHERE user_id = $1
       AND consumed_at >= $2
       AND consumed_at <= $3`,
      [userId, startOfDay, endOfDay]
    );

    const row = result.rows[0];
    return {
      total_calories: parseFloat(row.total_calories),
      total_protein_g: parseFloat(row.total_protein_g),
      total_carbs_g: parseFloat(row.total_carbs_g),
      total_fat_g: parseFloat(row.total_fat_g),
      total_fiber_g: parseFloat(row.total_fiber_g),
      entry_count: parseInt(row.entry_count),
      meals: {
        breakfast: parseInt(row.breakfast),
        lunch: parseInt(row.lunch),
        dinner: parseInt(row.dinner),
        snack: parseInt(row.snack)
      }
    };
  }
}
