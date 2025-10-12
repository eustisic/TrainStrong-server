import { query } from '../db.js';
import { User, CreateUserInput } from '../types/database.types.js';

export class UserModel {
  static async create(userData: CreateUserInput): Promise<User> {
    const { email, username, password_hash, first_name, last_name, date_of_birth } = userData;
    
    const result = await query(
      `INSERT INTO users (email, username, password_hash, first_name, last_name, date_of_birth)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [email, username, password_hash, first_name, last_name, date_of_birth]
    );
    
    return result.rows[0];
  }

  static async findById(id: number): Promise<User | null> {
    const result = await query('SELECT * FROM users WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  static async findByEmail(email: string): Promise<User | null> {
    const result = await query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows[0] || null;
  }

  static async findByUsername(username: string): Promise<User | null> {
    const result = await query('SELECT * FROM users WHERE username = $1', [username]);
    return result.rows[0] || null;
  }

  static async update(id: number, updates: Partial<CreateUserInput>): Promise<User | null> {
    const fields: any[] = [];
    const values = [];
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
      `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    return result.rows[0] || null;
  }

  static async delete(id: number): Promise<boolean> {
    const result = await query('DELETE FROM users WHERE id = $1', [id]);
    return (result.rowCount || 0) > 0;
  }

  static async listAll(limit = 100, offset = 0): Promise<User[]> {
    const result = await query(
      'SELECT * FROM users ORDER BY created_at DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    );
    return result.rows;
  }
}