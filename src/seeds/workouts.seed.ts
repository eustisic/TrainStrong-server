import { WorkoutModel } from '../models/workout.model.ts';
import { CreateWorkoutInput } from '../types/database.types.ts';

const workoutsSeed: CreateWorkoutInput[] = [
  // Strength workouts
  {
    name: 'Bench Press',
    category: 'strength',
    equipment: 'barbell',
    description: 'Classic compound chest workout',
    instructions: 'Lie on bench, grip bar slightly wider than shoulders, lower to chest, press up',
    workout_data: {
      type: 'strength',
      sets: 3,
      reps: 10,
      weight_kg: 60,
      rest_seconds: 90
    },
    is_public: true
  },
  {
    name: 'Squat',
    category: 'strength',
    equipment: 'barbell',
    description: 'Fundamental lower body compound workout',
    instructions: 'Bar on upper back, feet shoulder-width, squat down until thighs parallel, stand up',
    workout_data: {
      type: 'strength',
      sets: 4,
      reps: 8,
      weight_kg: 80,
      rest_seconds: 120
    },
    is_public: true
  },
  {
    name: 'Deadlift',
    category: 'strength',
    equipment: 'barbell',
    description: 'Full body compound workout',
    instructions: 'Bar over mid-foot, grip outside legs, lift by extending hips and knees',
    workout_data: {
      type: 'strength',
      sets: 3,
      reps: 5,
      weight_kg: 100,
      rest_seconds: 180
    },
    is_public: true
  },
  {
    name: 'Pull-ups',
    category: 'strength',
    equipment: 'bodyweight',
    description: 'Upper body pulling workout',
    instructions: 'Hang from bar, pull up until chin over bar, lower with control',
    workout_data: {
      type: 'strength',
      sets: 3,
      reps: 8,
      rest_seconds: 90
    },
    is_public: true
  },
  {
    name: 'Push-ups',
    category: 'strength',
    equipment: 'bodyweight',
    description: 'Classic bodyweight chest workout',
    instructions: 'Plank position, lower chest to floor, push back up',
    workout_data: {
      type: 'strength',
      sets: 3,
      reps: 15,
      rest_seconds: 60
    },
    is_public: true
  },
  
  // Cardio workouts
  {
    name: 'Treadmill Run',
    category: 'cardio',
    equipment: 'treadmill',
    description: 'Indoor running workout',
    instructions: 'Set desired speed and incline, maintain steady pace',
    workout_data: {
      type: 'cardio',
      duration_minutes: 30,
      distance_km: 5,
      target_heart_rate: 140,
      pace: '6:00/km'
    },
    is_public: true
  },
  {
    name: 'Cycling',
    category: 'cardio',
    equipment: 'bike',
    description: 'Low-impact cardio workout',
    instructions: 'Maintain steady cadence, adjust resistance as needed',
    workout_data: {
      type: 'cardio',
      duration_minutes: 45,
      distance_km: 20,
      target_heart_rate: 130
    },
    is_public: true
  },
  {
    name: 'Rowing',
    category: 'cardio',
    equipment: 'rowing_machine',
    description: 'Full body cardio workout',
    instructions: 'Drive with legs, lean back, pull with arms, return in reverse order',
    workout_data: {
      type: 'cardio',
      duration_minutes: 20,
      distance_km: 5,
      pace: '2:00/500m'
    },
    is_public: true
  },
  
  // Flexibility workouts
  {
    name: 'Hamstring Stretch',
    category: 'flexibility',
    equipment: 'none',
    description: 'Stretch for back of thighs',
    instructions: 'Sit with one leg extended, reach for toes, hold stretch',
    workout_data: {
      type: 'flexibility',
      duration_seconds: 30,
      hold_count: 3
    },
    is_public: true
  },
  {
    name: 'Shoulder Stretch',
    category: 'flexibility',
    equipment: 'none',
    description: 'Stretch for shoulder mobility',
    instructions: 'Pull arm across body, hold with opposite arm',
    workout_data: {
      type: 'flexibility',
      duration_seconds: 30,
      hold_count: 2
    },
    is_public: true
  },
  {
    name: 'Cat-Cow Stretch',
    category: 'flexibility',
    equipment: 'none',
    description: 'Dynamic spine mobility workout',
    instructions: 'On hands and knees, alternate between arching and rounding back',
    workout_data: {
      type: 'flexibility',
      duration_seconds: 60,
      hold_count: 10
    },
    is_public: true
  }
];

export async function seedWorkouts(): Promise<void> {
  console.log('Seeding workouts...');
  
  for (const workout of workoutsSeed) {
    try {
      await WorkoutModel.create(workout);
      console.log(`✓ Created workout: ${workout.name}`);
    } catch (error) {
      console.error(`✗ Failed to create workout ${workout.name}:`, error);
    }
  }
  
  console.log('Workout seeding complete!');
}
