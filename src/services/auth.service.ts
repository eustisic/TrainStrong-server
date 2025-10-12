import { UserModel } from '../models/user.model.js';
import { CreateUserInput } from '../types/database.types.js';
import { hashPassword, verifyPassword, generateToken } from '../utils/auth.utils.js';

interface RegisterInput {
  email: string;
  username: string;
  password: string;
  first_name?: string;
  last_name?: string;
  date_of_birth?: Date;
}

interface LoginResponse {
  token: string;
  user: {
    id: number;
    email: string;
    username: string;
    first_name?: string;
    last_name?: string;
  };
}

export class AuthService {
  static async register(userData: RegisterInput): Promise<LoginResponse> {
    const existingUserByEmail = await UserModel.findByEmail(userData.email);
    if (existingUserByEmail) {
      throw new Error('A user with this email already exists');
    }

    const existingUserByUsername = await UserModel.findByUsername(userData.username);
    if (existingUserByUsername) {
      throw new Error('A user with this username already exists');
    }

    const password_hash = await hashPassword(userData.password);

    const createUserInput: CreateUserInput = {
      email: userData.email,
      username: userData.username,
      password_hash,
      first_name: userData.first_name,
      last_name: userData.last_name,
      date_of_birth: userData.date_of_birth,
    };

    const newUser = await UserModel.create(createUserInput);

    const token = generateToken(newUser.id);

    return {
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        username: newUser.username,
        first_name: newUser.first_name || undefined,
        last_name: newUser.last_name || undefined,
      },
    };
  }

  static async login(emailOrUsername: string, password: string): Promise<LoginResponse> {
    let user = await UserModel.findByEmail(emailOrUsername);

    if (!user) {
      user = await UserModel.findByUsername(emailOrUsername);
    }

    if (!user) {
      throw new Error('Invalid credentials');
    }

    const isPasswordValid = await verifyPassword(password, user.password_hash);

    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    const token = generateToken(user.id);

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        first_name: user.first_name || undefined,
        last_name: user.last_name || undefined,
      },
    };
  }

  static async validateUser(emailOrUsername: string, password: string): Promise<boolean> {
    try {
      await this.login(emailOrUsername, password);
      return true;
    } catch {
      return false;
    }
  }
}