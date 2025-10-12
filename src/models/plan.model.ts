import { query } from '../db.js';
import { Plan, CreatePlanInput } from '../types/database.types.js';

export class PlanModel {
  static async create(planData: CreatePlanInput): Promise<Plan> {
    const {
      name,
      description,
      duration_weeks,
      created_by,
      is_public = true
    } = planData;
    
    const result = await query(
      `INSERT INTO plans (name, description, duration_weeks, created_by, is_public)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [name, description, duration_weeks, created_by, is_public]
    );
    
    return result.rows[0];
  }

  static async findById(id: number): Promise<Plan | null> {
    const result = await query('SELECT * FROM plans WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  static async findPublicPlans(limit = 100, offset = 0): Promise<Plan[]> {
    const result = await query(
      'SELECT * FROM plans WHERE is_public = true ORDER BY created_at DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    );
    return result.rows;
  }

  static async findUserPlans(userId: number, limit = 100, offset = 0): Promise<Plan[]> {
    const result = await query(
      'SELECT * FROM plans WHERE created_by = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
      [userId, limit, offset]
    );
    return result.rows;
  }

  static async findUserSubscribedPlans(userId: number, limit = 100, offset = 0): Promise<Plan[]> {
    const result = await query(
      `SELECT p.* FROM plans p
       INNER JOIN user_plans up ON p.id = up.plan_id
       WHERE up.user_id = $1 AND up.status = 'active'
       ORDER BY up.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );
    return result.rows;
  }

  static async findAllUserAccessiblePlans(userId: number, limit = 100, offset = 0): Promise<Plan[]> {
    const result = await query(
      `SELECT DISTINCT p.* FROM plans p
       LEFT JOIN user_plans up ON p.id = up.plan_id AND up.user_id = $1
       WHERE p.is_public = true OR p.created_by = $1 OR up.id IS NOT NULL
       ORDER BY p.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );
    return result.rows;
  }

  static async update(id: number, updates: Partial<CreatePlanInput>): Promise<Plan | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    // Only allow updating certain fields
    const allowedFields = ['name', 'description', 'duration_weeks', 'is_public'];
    
    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined && allowedFields.includes(key)) {
        fields.push(`${key} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    });

    if (fields.length === 0) return null;

    values.push(id);
    const result = await query(
      `UPDATE plans SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    return result.rows[0] || null;
  }

  static async delete(id: number): Promise<boolean> {
    const result = await query('DELETE FROM plans WHERE id = $1', [id]);
    return (result.rowCount || 0) > 0;
  }

  static async isOwner(planId: number, userId: number): Promise<boolean> {
    const result = await query(
      'SELECT id FROM plans WHERE id = $1 AND created_by = $2',
      [planId, userId]
    );
    return result.rows.length > 0;
  }

  static async hasAccess(planId: number, userId: number): Promise<boolean> {
    const result = await query(
      `SELECT p.id FROM plans p
       LEFT JOIN user_plans up ON p.id = up.plan_id AND up.user_id = $2
       WHERE p.id = $1 AND (p.is_public = true OR p.created_by = $2 OR up.id IS NOT NULL)`,
      [planId, userId]
    );
    return result.rows.length > 0;
  }
}