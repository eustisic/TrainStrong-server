import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/auth.utils.js';
import { UserModel } from '../models/user.model.js';

export interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    username: string;
  };
}

export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ')
      ? authHeader.substring(7)
      : null;

    if (!token) {
      res.status(401).json({ error: 'Access token is required' });
      return;
    }

    const decoded = verifyToken(token);
    const user = await UserModel.findById(decoded.userId);

    if (!user) {
      res.status(401).json({ error: 'User not found' });
      return;
    }

    req.user = {
      id: user.id,
      email: user.email,
      username: user.username,
    };

    next();
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Token has expired') {
        res.status(401).json({ error: 'Token has expired' });
        return;
      }
      if (error.message === 'Invalid token') {
        res.status(401).json({ error: 'Invalid token' });
        return;
      }
    }
    res.status(500).json({ error: 'Authentication failed' });
  }
};

export const requireAuth = authenticateToken;

export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.substring(7)
    : null;

  if (!token) {
    next();
    return;
  }

  try {
    const decoded = verifyToken(token);
    const user = await UserModel.findById(decoded.userId);

    if (user) {
      req.user = {
        id: user.id,
        email: user.email,
        username: user.username,
      };
    }
  } catch {
  }

  next();
};