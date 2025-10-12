import { UserModel } from '../models/user.model.js';
import { CreateUserInput } from '../types/database.types.js';
import { hashPassword } from '../utils/auth.utils.js';

export async function seedUsers(): Promise<void> {
  console.log('Seeding users...');

  try {
    const hashedPassword = await hashPassword('Test123456');

    const userSeed: CreateUserInput = {
      email: 'test@example.com',
      username: 'testuser',
      password_hash: hashedPassword,
      first_name: 'Test',
      last_name: 'User',
      date_of_birth: new Date('1990-01-01')
    };

    const existingUser = await UserModel.findByEmail(userSeed.email);

    if (existingUser) {
      console.log(`User already exists: ${userSeed.username} (ID: ${existingUser.id})`);
    } else {
      const user = await UserModel.create(userSeed);
      console.log(`Created user: ${user.username} (ID: ${user.id})`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Password: Test123456`);
    }
  } catch (error) {
    console.error(`Failed to create user:`, error);
  }

  console.log('User seeding complete!');
}