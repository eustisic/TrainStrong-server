// Database table types
export interface User {
  id: number;
  email: string;
  username: string;
  password_hash: string;
  first_name?: string;
  last_name?: string;
  date_of_birth?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface Workout {
  id: number;
  name: string;
  category: string;
  equipment?: string;
  description?: string;
  instructions?: string;
  workout_data: WorkoutData;
  created_by?: number;
  is_public: boolean;
  created_at: Date;
  updated_at: Date;
}

export type CompletionState = 'complete' | 'incomplete' | 'pending';

export interface ScheduledWorkout {
  id: number;
  user_id: number;
  workout_id: number;
  completed_workout_data: CompletedWorkoutData;
  performed_at: Date;
  notes?: string;
  completion_state: CompletionState;
  plan_id?: number;
  user_plan_id?: number;
  plan_workout_id?: number;
  created_at: Date;
  updated_at: Date;
}

// Workout data types
export interface BaseWorkoutData {
  type: 'strength' | 'cardio' | 'flexibility' | 'custom';
}

export interface StrengthWorkoutData extends BaseWorkoutData {
  type: 'strength';
  sets?: number;
  reps?: number;
  weight_kg?: number;
  rest_seconds?: number;
}

export interface CardioWorkoutData extends BaseWorkoutData {
  type: 'cardio';
  duration_minutes?: number;
  distance_km?: number;
  target_heart_rate?: number;
  pace?: string;
}

export interface FlexibilityWorkoutData extends BaseWorkoutData {
  type: 'flexibility';
  duration_seconds?: number;
  hold_count?: number;
}

// Union type for all workout data
export type WorkoutData = StrengthWorkoutData | CardioWorkoutData | FlexibilityWorkoutData;

// Completed workout data includes all workout fields plus the actual performed data
export interface CompletedWorkoutData {
  name: string;
  category: string;
  equipment?: string;
  description?: string;
  instructions?: string;
  workout_data: WorkoutData;
  // Actual performed values can override the defaults
  performed_sets?: number;
  performed_reps?: number;
  performed_weight_kg?: number;
  performed_distance_km?: number;
  performed_duration_seconds?: number;
}

// Input types for creating/updating records
export interface CreateUserInput {
  email: string;
  username: string;
  password_hash: string;
  first_name?: string;
  last_name?: string;
  date_of_birth?: Date;
}

export interface CreateWorkoutInput {
  name: string;
  category: string;
  equipment?: string;
  description?: string;
  instructions?: string;
  workout_data: WorkoutData;
  created_by?: number;
  is_public?: boolean;
}

export interface CreateScheduledWorkoutInput {
  user_id: number;
  workout_id: number;
  completed_workout_data: CompletedWorkoutData;
  performed_at?: Date;
  notes?: string;
  completion_state?: CompletionState;
  plan_id?: number;
  user_plan_id?: number;
  plan_workout_id?: number;
}

// Plan types
export interface Plan {
  id: number;
  name: string;
  description?: string;
  duration_weeks: number;
  created_by?: number;
  is_public: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface PlanWorkout {
  id: number;
  plan_id: number;
  workout_id: number;
  week_day: number; // 0-6 (Sunday-Saturday)
  week_offset: number; // 0 for same week, 1 for next week, etc.
  workout_order: number;
  workout_data_override?: WorkoutData;
  created_at: Date;
  updated_at: Date;
}

export interface UserPlan {
  id: number;
  user_id: number;
  plan_id: number;
  start_date: Date;
  end_date: Date;
  status: 'active' | 'paused' | 'completed' | 'cancelled';
  created_at: Date;
  updated_at: Date;
}

// Plan input types
export interface CreatePlanInput {
  name: string;
  description?: string;
  duration_weeks: number;
  created_by?: number;
  is_public?: boolean;
  workouts?: CreatePlanWorkoutInput[];
}

export interface CreatePlanWorkoutInput {
  workout_id: number;
  week_day: number;
  week_offset: number;
  workout_order: number;
  workout_data_override?: WorkoutData;
}

export interface CreateUserPlanInput {
  user_id: number;
  plan_id: number;
  start_date: Date;
}

// Diet tracking types
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface NutritionGoal {
  id: number;
  user_id: number;
  daily_calories?: number;
  daily_protein_g?: number;
  daily_carbs_g?: number;
  daily_fat_g?: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface FoodEntry {
  id: number;
  user_id: number;
  fdc_id: number;
  food_name: string;
  data_type?: string;
  serving_size: number;
  serving_unit: string;
  calories?: number;
  protein_g?: number;
  carbs_g?: number;
  fat_g?: number;
  fiber_g?: number;
  consumed_at: Date;
  meal_type?: MealType;
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

export interface USDAFoodCache {
  id: number;
  fdc_id: number;
  food_data: any; // JSONB
  data_type?: string;
  last_fetched_at: Date;
  created_at: Date;
}

export interface UserRecentFood {
  id: number;
  user_id: number;
  fdc_id: number;
  food_name: string;
  times_used: number;
  last_used_at: Date;
  created_at: Date;
}

// Input types for creating/updating records
export interface CreateNutritionGoalInput {
  user_id: number;
  daily_calories?: number;
  daily_protein_g?: number;
  daily_carbs_g?: number;
  daily_fat_g?: number;
  is_active?: boolean;
}

export interface CreateFoodEntryInput {
  user_id: number;
  fdc_id: number;
  food_name: string;
  data_type?: string;
  serving_size: number;
  serving_unit: string;
  calories?: number;
  protein_g?: number;
  carbs_g?: number;
  fat_g?: number;
  fiber_g?: number;
  consumed_at?: Date;
  meal_type?: MealType;
  notes?: string;
}

// USDA API response types
export interface USDANutrient {
  nutrientId: number;
  nutrientName: string;
  nutrientNumber: string;
  unitName: string;
  value: number;
}

export interface USDAFoodNutrient {
  nutrientId: number;
  nutrientName: string;
  nutrientNumber: string;
  unitName: string;
  value: number;
  derivationCode?: string;
  derivationDescription?: string;
}

export interface USDAFoodPortion {
  id: number;
  amount: number;
  gramWeight: number;
  modifier?: string;
  measureUnit?: {
    id: number;
    name: string;
    abbreviation: string;
  };
}

export interface USDAAbridgedFood {
  fdcId: number;
  description: string;
  dataType: string;
  publicationDate: string;
  brandOwner?: string;
  brandName?: string;
  ingredients?: string;
  foodNutrients?: USDAFoodNutrient[];
}

export interface USDAFoodDetail {
  fdcId: number;
  description: string;
  dataType: string;
  publicationDate: string;
  brandOwner?: string;
  brandName?: string;
  ingredients?: string;
  servingSize?: number;
  servingSizeUnit?: string;
  householdServingFullText?: string;
  foodNutrients: USDAFoodNutrient[];
  foodPortions?: USDAFoodPortion[];
  foodCategory?: {
    id: number;
    code: string;
    description: string;
  };
}

export interface USDASearchResult {
  totalHits: number;
  currentPage: number;
  totalPages: number;
  pageList: number[];
  foods: USDAAbridgedFood[];
  foodSearchCriteria: {
    query: string;
    dataType?: string[];
    pageSize: number;
    pageNumber: number;
    sortBy?: string;
    sortOrder?: string;
  };
  aggregations?: any;
}