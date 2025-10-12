import { query } from '../db.js';
import { Workout, CreateWorkoutInput } from '../types/database.types.js';

export class WorkoutModel {
  static async create(workoutData: CreateWorkoutInput): Promise<Workout> {
    const {
      name,
      category,
      equipment,
      description,
      instructions,
      workout_data,
      created_by,
      is_public = true
    } = workoutData;
    
    const result = await query(
      `INSERT INTO workouts (name, category, equipment, description, instructions, workout_data, created_by, is_public)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [name, category, equipment, description, instructions, JSON.stringify(workout_data), created_by, is_public]
    );
    
    return result.rows[0];
  }

  static async findById(id: number): Promise<Workout | null> {
    const result = await query('SELECT * FROM workouts WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  static async findByCategory(category: string): Promise<Workout[]> {
    const result = await query(
      'SELECT * FROM workouts WHERE category = $1 AND is_public = true ORDER BY name ASC',
      [category]
    );
    return result.rows;
  }

  static async findPublicWorkouts(limit = 100, offset = 0): Promise<Workout[]> {
    const result = await query(
      'SELECT * FROM workouts WHERE is_public = true ORDER BY name ASC LIMIT $1 OFFSET $2',
      [limit, offset]
    );
    return result.rows;
  }

  static async findUserWorkouts(userId: number, limit = 100, offset = 0): Promise<Workout[]> {
    const result = await query(
      'SELECT * FROM workouts WHERE created_by = $1 OR is_public = true ORDER BY name ASC LIMIT $2 OFFSET $3',
      [userId, limit, offset]
    );
    return result.rows;
  }

  static async update(id: number, updates: Partial<CreateWorkoutInput>): Promise<Workout | null> {
    const fields: any[] = [];
    const values = [];
    let paramCount = 1;

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        if (key === 'workout_data') {
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
      `UPDATE workouts SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    return result.rows[0] || null;
  }

  static async delete(id: number): Promise<boolean> {
    const result = await query('DELETE FROM workouts WHERE id = $1', [id]);
    return (result.rowCount || 0) > 0;
  }

  static async search(searchTerm: string, limit = 50): Promise<Workout[]> {
    const result = await query(
      `SELECT * FROM workouts 
       WHERE (name ILIKE $1 OR description ILIKE $1)
       AND is_public = true
       ORDER BY name ASC
       LIMIT $2`,
      [`%${searchTerm}%`, limit]
    );
    return result.rows;
  }
}