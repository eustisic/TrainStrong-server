import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service.js';

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, username, password, first_name, last_name, date_of_birth } = req.body;

      if (!email || !username || !password) {
        res.status(400).json({
          error: 'Email, username, and password are required'
        });
        return;
      }

      if (password.length < 8) {
        res.status(400).json({
          error: 'Password must be at least 8 characters long'
        });
        return;
      }

      const result = await AuthService.register({
        email,
        username,
        password,
        first_name,
        last_name,
        date_of_birth: date_of_birth ? new Date(date_of_birth) : undefined,
      });

      res.status(201).json({
        message: 'User registered successfully',
        token: result.token,
        user: result.user,
      });
    } catch (error) {
      next(error);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { emailOrUsername, password } = req.body;

      if (!emailOrUsername || !password) {
        res.status(400).json({
          error: 'Email/username and password are required'
        });
        return;
      }

      const result = await AuthService.login(emailOrUsername, password);

      res.status(200).json({
        message: 'Login successful',
        token: result.token,
        user: result.user,
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Invalid credentials') {
        res.status(401).json({ error: 'Invalid credentials' });
        return;
      }
      next(error);
    }
  }

  static async logout(req: Request, res: Response): Promise<void> {
    res.status(200).json({
      message: 'Logout successful',
    });
  }
}