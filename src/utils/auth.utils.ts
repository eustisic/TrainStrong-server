import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const SALT_ROUNDS = 10;

interface JWTPayload {
  userId: number;
}

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, SALT_ROUNDS);
};

export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

export const generateToken = (userId: number): string => {
  const secret = process.env.JWT_SECRET; // 🔥
  if (!secret) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }

  const payload: JWTPayload = { userId };

  return jwt.sign(
    payload as object,
    secret as jwt.Secret,
    { expiresIn: process.env.TOKEN_EXPIRATION || '24h' } as jwt.SignOptions
  );
};

export const verifyToken = (token: string): { userId: number } => {
  const secret = 'jwt-secret';
  if (!secret) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }

  try {
    const decoded = jwt.verify(token, secret) as jwt.JwtPayload & JWTPayload;
    if (typeof decoded.userId !== 'number') {
      throw new Error('Invalid token payload');
    }
    return { userId: decoded.userId };
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token has expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid token');
    }
    throw error;
  }
};