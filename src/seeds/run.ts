import pool from '../db.ts';
import { seedUsers } from './users.seed.ts';
import { seedWorkouts } from './workouts.seed.ts';

async function main() {
  try {
    console.log('Starting database seeding...');
    
    // Check if users already exist
    const userResult = await pool.query('SELECT COUNT(*) FROM users');
    const userCount = parseInt(userResult.rows[0].count);
    
    if (userCount === 0) {
      // Seed users first as workouts can be created by users
      await seedUsers();
    } else {
      console.log(`Database already contains ${userCount} users.`);
    }
    
    // Check if workouts already exist
    const workoutsResult = await pool.query('SELECT COUNT(*) FROM workouts');
    const workoutsCount = parseInt(workoutsResult.rows[0].count);
    
    if (workoutsCount === 0) {
      // Seed workouts first as plans depend on them
      await seedWorkouts();
    } else {
      console.log(`Database already contains ${workoutsCount} workouts.`);
    }
    
    console.log('Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

main();