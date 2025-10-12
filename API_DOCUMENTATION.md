# Train Strong API Documentation

## Overview

The Train Strong API provides endpoints for managing fitness workouts, tracking scheduled workouts, and viewing workout statistics. The API is RESTful and returns JSON responses.

## Base URL

```
http://localhost:3000/api
```

## Response Format

All API responses follow this format:

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "count": 10  // Optional, for list endpoints
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message description"
}
```

## Authentication

The API uses JWT (JSON Web Token) based authentication. After registering or logging in, you'll receive a JWT token that must be included in the `Authorization` header for protected endpoints.

### Authentication Header
```
Authorization: Bearer <your-jwt-token>
```

### Protected Endpoints
The following endpoints require authentication:
- Dashboard endpoints (`/api/dashboard`)
- User-specific scheduled workout endpoints (`/api/scheduled-workouts`)
- Creating, updating, and deleting workouts (when they belong to the authenticated user)

---

## Authentication Endpoints

### Register User

#### POST /api/auth/register
Create a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "username": "johndoe",
  "password": "SecurePassword123",
  "first_name": "John",
  "last_name": "Doe",
  "date_of_birth": "1990-01-15"
}
```

**Required Fields:**
- `email`: Valid email address (must be unique)
- `username`: Username (must be unique)
- `password`: Password (minimum 8 characters)

**Optional Fields:**
- `first_name`: User's first name
- `last_name`: User's last name
- `date_of_birth`: Date in YYYY-MM-DD format

**Response:**
```json
{
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "username": "johndoe",
    "first_name": "John",
    "last_name": "Doe"
  }
}
```

### Login User

#### POST /api/auth/login
Authenticate a user and receive a JWT token.

**Request Body:**
```json
{
  "emailOrUsername": "user@example.com",
  "password": "SecurePassword123"
}
```

**Required Fields:**
- `emailOrUsername`: User's email address or username
- `password`: User's password

**Response:**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "username": "johndoe",
    "first_name": "John",
    "last_name": "Doe"
  }
}
```

### Logout User

#### POST /api/auth/logout
Logout the current user (client-side token removal).

**Headers:**
```
Authorization: Bearer <your-jwt-token>
```

**Response:**
```json
{
  "message": "Logout successful"
}
```

---

## Endpoints

### Health Check

#### GET /health
Check if the server is running.

**Response:**
```json
{
  "status": "ok"
}
```

---

## Workout Endpoints

### List Workouts

#### GET /api/workouts
Get a list of public workouts with optional filtering.

**Query Parameters:**
- `limit` (optional): Number of results to return (default: 100)
- `offset` (optional): Number of results to skip for pagination (default: 0)
- `search` (optional): Search term to filter workouts by name
- `category` (optional): Filter by workout category

**Example Requests:**
```
GET /api/workouts
GET /api/workouts?search=bench
GET /api/workouts?category=strength
GET /api/workouts?limit=20&offset=40
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Bench Press",
      "category": "strength",
      "equipment": "barbell",
      "description": "Chest workout",
      "instructions": "Lower bar to chest, press up",
      "workout_data": {
        "type": "strength",
        "sets": 3,
        "reps": 10,
        "weight_kg": 80,
        "rest_seconds": 90
      },
      "is_public": true,
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ],
  "count": 1
}
```

### Get Workout by ID

#### GET /api/workouts/:id
Get a specific workout by its ID.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Bench Press",
    "category": "strength",
    "equipment": "barbell",
    "description": "Chest workout",
    "instructions": "Lower bar to chest, press up",
    "workout_data": {
      "type": "strength",
      "sets": 3,
      "reps": 10,
      "weight_kg": 80,
      "rest_seconds": 90
    },
    "is_public": true,
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
}
```

### Create Workout

#### POST /api/workouts
Create a new workout.

**Request Body:**
```json
{
  "name": "Push-ups",
  "category": "strength",
  "equipment": "bodyweight",
  "description": "Bodyweight chest workout",
  "instructions": "Start in plank position, lower chest to ground, push back up",
  "workout_data": {
    "type": "strength",
    "sets": 3,
    "reps": 15,
    "weight_kg": 0,
    "rest_seconds": 60
  },
  "is_public": true
}
```

**Required Fields:**
- `name`: Workout name
- `category`: Workout category
- `workout_data`: Workout-specific data (see Workout Data Types below)

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 2,
    "name": "Push-ups",
    ...
  }
}
```

### Delete Workout

#### POST /api/workouts/delete
Delete an workout by ID.

**Request Body:**
```json
{
  "id": 1
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Workout deleted successfully"
  }
}
```

---

## Scheduled Workout Endpoints

### List Scheduled Workouts

#### GET /api/scheduled-workouts
Get scheduled workouts for the authenticated user.

**Headers:**
```
Authorization: Bearer <your-jwt-token>
```

**Query Parameters:**
- `limit` (optional): Number of results to return (default: 100)
- `offset` (optional): Number of results to skip for pagination (default: 0)
- `start_date` (optional): Filter workouts from this date (YYYY-MM-DD)
- `end_date` (optional): Filter workouts until this date (YYYY-MM-DD)

**Example Requests:**
```
GET /api/scheduled-workouts
GET /api/scheduled-workouts?start_date=2024-01-01&end_date=2024-12-31
GET /api/scheduled-workouts?limit=10&offset=0
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "user_id": 1,
      "workout_id": 1,
      "completed_workout_data": {
        "name": "Bench Press",
        "category": "strength",
        "equipment": "barbell",
        "description": "Chest workout",
        "instructions": "Lower bar to chest, press up",
        "workout_data": {
          "type": "strength",
          "sets": 3,
          "reps": 10,
          "weight_kg": 80,
          "rest_seconds": 90
        },
        "performed_sets": 3,
        "performed_reps": 10,
        "performed_weight_kg": 75
      },
      "performed_at": "2024-01-15T10:30:00Z",
      "notes": "Felt strong today",
      "created_at": "2024-01-15T10:35:00Z",
      "updated_at": "2024-01-15T10:35:00Z"
    }
  ],
  "count": 1
}
```

### Get Scheduled Workout by ID

#### GET /api/scheduled-workouts/:id
Get a specific scheduled workout by its ID.

**Headers:**
```
Authorization: Bearer <your-jwt-token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "user_id": 1,
    "workout_id": 1,
    "completed_schedule_data": { ... },
    "performed_at": "2024-01-15T10:30:00Z",
    "notes": "Felt strong today",
    "created_at": "2024-01-15T10:35:00Z",
    "updated_at": "2024-01-15T10:35:00Z"
  }
}
```

### Create Scheduled Workout

#### POST /api/scheduled-workouts
Create a new scheduled workout. Can be created in two ways:

**Headers:**
```
Authorization: Bearer <your-jwt-token>
```

**Option 1: From Existing Workout (Automatic)**
```json
{
  "workout_id": 1,
  "notes": "Good workout session"
}
```

**Option 2: With Custom Data**
```json
{
  "workout_id": 1,
  "completed_workout_data": {
    "name": "Bench Press",
    "category": "strength",
    "equipment": "barbell",
    "description": "Chest workout",
    "instructions": "Lower bar to chest, press up",
    "workout_data": {
      "type": "strength",
      "sets": 3,
      "reps": 10,
      "weight_kg": 80,
      "rest_seconds": 90
    },
    "performed_sets": 3,
    "performed_reps": 8,
    "performed_weight_kg": 75
  },
  "notes": "Reduced weight and reps today"
}
```

**Required Fields:**
- `workout_id`: Reference to the workout

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 2,
    "user_id": 1,
    "workout_id": 1,
    ...
  }
}
```

### Update Scheduled Workout

#### POST /api/scheduled-workouts/update
Update an existing scheduled workout.

**Headers:**
```
Authorization: Bearer <your-jwt-token>
```

**Request Body:**
```json
{
  "id": 1,
  "completed_workout_data": {
    "name": "Bench Press",
    "category": "strength",
    "equipment": "barbell",
    "description": "Chest workout",
    "instructions": "Lower bar to chest, press up",
    "workout_data": {
      "type": "strength",
      "sets": 3,
      "reps": 8,
      "weight_kg": 85,
      "rest_seconds": 90
    },
    "performed_sets": 3,
    "performed_reps": 8,
    "performed_weight_kg": 85
  },
  "notes": "Increased weight today",
  "performed_at": "2024-01-16T10:30:00Z"
}
```

**Required Fields:**
- `id`: The scheduled workout ID to update

**Optional Fields:**
- `completed_workout_data`: Updated workout performance data
- `notes`: Updated notes
- `performed_at`: Updated performance timestamp
- Any other valid scheduled workout fields

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "user_id": 1,
    "workout_id": 1,
    "completed_workout_data": { ... },
    "performed_at": "2024-01-16T10:30:00Z",
    "notes": "Increased weight today",
    "created_at": "2024-01-15T10:35:00Z",
    "updated_at": "2024-01-16T11:00:00Z"
  },
  "message": "Workout updated successfully"
}
```

### Delete Scheduled Workout

#### POST /api/scheduled-workouts/delete
Delete a scheduled workout by ID.

**Headers:**
```
Authorization: Bearer <your-jwt-token>
```

**Request Body:**
```json
{
  "id": 1
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Workout deleted successfully"
  }
}
```

---

## Dashboard Endpoint

### Get Dashboard Statistics

#### GET /api/dashboard
Get workout statistics and summary for the authenticated user.

**Headers:**
```
Authorization: Bearer <your-jwt-token>
```

**Query Parameters:**
- `days` (optional): Number of days to look back (default: 30)

**Example Requests:**
```
GET /api/dashboard
GET /api/dashboard?days=7
GET /api/dashboard?days=90
```

**Response:**
```json
{
  "success": true,
  "data": {
    "period_days": 30,
    "stats": {
      "total_workouts": 15,
      "workout_days": 12,
      "unique_workouts": 8,
      "workout_frequency_percent": 40.0,
      "available_workouts": 25
    },
    "recent_workouts": [
      {
        "id": 15,
        "user_id": 1,
        "workout_id": 3,
        "performed_at": "2024-01-30T09:00:00Z",
        ...
      }
    ],
    "summary": {
      "message": "In the last 30 days, you completed 15 workouts across 12 days.",
      "avg_workouts_per_day": "0.50"
    }
  }
}
```

---

## Data Types

### Workout Categories
- `strength`: Strength training workouts
- `cardio`: Cardiovascular workouts
- `flexibility`: Stretching and flexibility workouts
- `custom`: Custom workout types

### Workout Data Types

#### Strength Workout
```json
{
  "type": "strength",
  "sets": 3,
  "reps": 10,
  "weight_kg": 50,
  "rest_seconds": 90
}
```

#### Cardio Workout
```json
{
  "type": "cardio",
  "duration_minutes": 30,
  "distance_km": 5,
  "target_heart_rate": 150,
  "pace": "5:30/km"
}
```

#### Flexibility Workout
```json
{
  "type": "flexibility",
  "duration_seconds": 30,
  "hold_count": 3
}
```

### Completed Workout Data

When recording a scheduled workout, the `completed_workout_data` includes:
- All fields from the original workout
- Actual performed values (e.g., `performed_sets`, `performed_reps`, `performed_weight_kg`)

---

## Error Handling

The API returns standard HTTP status codes:

- `200 OK`: Successful request
- `400 Bad Request`: Invalid request parameters
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

Example error response:
```json
{
  "success": false,
  "error": "Workout not found"
}
```

---

## Pagination

List endpoints support pagination using `limit` and `offset` parameters:

```
GET /api/workouts?limit=20&offset=0   # First 20 items
GET /api/workouts?limit=20&offset=20  # Items 21-40
GET /api/workouts?limit=20&offset=40  # Items 41-60
```

---

## Plan Endpoints

### List Plans

#### GET /api/plans
Get a list of workout plans with optional filtering.

**Headers (optional):**
```
Authorization: Bearer <your-jwt-token>
```

**Query Parameters:**
- `limit` (optional): Number of results to return (default: 100)
- `offset` (optional): Number of results to skip for pagination (default: 0)
- `subscribed` (optional): Filter to user's subscribed plans (default: false, requires auth)
- `created_by_me` (optional): Filter to user's created plans (default: false, requires auth)

**Example Requests:**
```
GET /api/plans
GET /api/plans?subscribed=true
GET /api/plans?created_by_me=true
GET /api/plans?limit=20&offset=0
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "12-Week Strength Builder",
      "description": "Progressive strength training program",
      "duration_weeks": 12,
      "created_by": 1,
      "is_public": true,
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### Get Plan by ID

#### GET /api/plans/:id
Get a specific plan with all its workouts.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "12-Week Strength Builder",
    "description": "Progressive strength training program",
    "duration_weeks": 12,
    "created_by": 1,
    "is_public": true,
    "workouts": [
      {
        "id": 1,
        "plan_id": 1,
        "workout_id": 5,
        "week_day": 1,
        "week_offset": 0,
        "workout_order": 1,
        "workout_name": "Bench Press",
        "category": "strength",
        "workout_data_override": null
      }
    ]
  }
}
```

### Create Plan

#### POST /api/plans
Create a new workout plan.

**Headers:**
```
Authorization: Bearer <your-jwt-token>
```

**Request Body:**
```json
{
  "name": "12-Week Strength Builder",
  "description": "Progressive strength training program",
  "duration_weeks": 12,
  "is_public": true,
  "workouts": [
    {
      "workout_id": 5,
      "week_day": 1,
      "week_offset": 0,
      "workout_order": 1,
      "workout_data_override": {
        "type": "strength",
        "sets": 4,
        "reps": 8,
        "weight_kg": 60
      }
    }
  ]
}
```

**Required Fields:**
- `name`: Plan name
- `duration_weeks`: Duration in weeks (must be > 0)

**Optional Fields:**
- `description`: Plan description
- `is_public`: Whether plan is publicly accessible (default: true)
- `workouts`: Array of workout assignments

**Workout Assignment Fields:**
- `workout_id`: Reference to workout
- `week_day`: Day of week (0-6, Sunday-Saturday)
- `week_offset`: Which week in the plan (0 for first week, 1 for second, etc.)
- `workout_order`: Order for multiple workouts on same day (default: 1)
- `workout_data_override`: Optional override of workout default values

### Update Plan

#### PUT /api/plans/:id
Update an existing plan (owner only).

**Headers:**
```
Authorization: Bearer <your-jwt-token>
```

**Request Body:**
```json
{
  "name": "Updated Plan Name",
  "description": "Updated description",
  "workouts": [...]
}
```

### Delete Plan

#### DELETE /api/plans/:id
Delete a plan (owner only).

**Headers:**
```
Authorization: Bearer <your-jwt-token>
```

**Response:**
```
204 No Content
```

### Subscribe to Plan

#### POST /api/plans/:id/subscribe
Subscribe to a plan and generate scheduled workouts.

**Headers:**
```
Authorization: Bearer <your-jwt-token>
```

**Request Body:**
```json
{
  "start_date": "2025-01-15"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "user_id": 1,
    "plan_id": 1,
    "start_date": "2025-01-15",
    "end_date": "2025-04-08",
    "status": "active",
    "created_at": "2025-01-10T00:00:00Z"
  }
}
```

**Notes:**
- Creates a `user_plan` entry
- Generates all scheduled workouts based on plan structure
- Transactional operation - all or nothing

### Unsubscribe from Plan

#### POST /api/plans/:id/unsubscribe
Cancel active subscription to a plan.

**Headers:**
```
Authorization: Bearer <your-jwt-token>
```

**Response:**
```
204 No Content
```

**Notes:**
- Deletes all pending scheduled workouts for the plan
- Sets subscription status to cancelled

### Update Subscription Status

#### PUT /api/plans/subscriptions/:userPlanId
Update subscription status (active, paused, completed, cancelled).

**Headers:**
```
Authorization: Bearer <your-jwt-token>
```

**Request Body:**
```json
{
  "status": "paused"
}
```

**Valid Status Values:**
- `active`: Plan is currently active
- `paused`: Plan temporarily paused
- `completed`: Plan finished
- `cancelled`: Plan cancelled

### Reschedule Plan

#### PUT /api/plans/subscriptions/:userPlanId/reschedule
Update plan start date and regenerate all scheduled workouts.

**Headers:**
```
Authorization: Bearer <your-jwt-token>
```

**Request Body:**
```json
{
  "start_date": "2025-02-01"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "user_id": 1,
    "plan_id": 1,
    "start_date": "2025-02-01",
    "end_date": "2025-04-25",
    "status": "active"
  }
}
```

**Notes:**
- Deletes existing scheduled workouts
- Regenerates all workouts based on new start date
- Transactional operation

### Delete Subscription

#### DELETE /api/plans/subscriptions/:userPlanId
Delete a user plan subscription and all associated scheduled workouts.

**Headers:**
```
Authorization: Bearer <your-jwt-token>
```

**Response:**
```
204 No Content
```

**Notes:**
- Permanently deletes the subscription
- Cascades to delete all associated scheduled workouts

---

## Diet Tracking Endpoints

The diet tracking feature integrates with the USDA FoodData Central API to provide food search, nutrition tracking, and goal management.

### Search Foods

#### GET /api/diet/search
Search the USDA food database.

**Query Parameters:**
- `query` (required): Search term (e.g., "chicken breast")
- `dataType` (optional): Filter by data type (Branded, Survey, Foundation, SR Legacy)
- `pageSize` (optional): Results per page (default: 25)
- `pageNumber` (optional): Page number (default: 1)

**Example Requests:**
```
GET /api/diet/search?query=chicken%20breast
GET /api/diet/search?query=cheddar&dataType=Branded&pageSize=10
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalHits": 150,
    "currentPage": 1,
    "totalPages": 6,
    "foods": [
      {
        "fdcId": 171705,
        "description": "Chicken breast, grilled",
        "dataType": "Survey (FNDDS)",
        "brandOwner": null,
        "foodNutrients": [
          {
            "nutrientId": 1008,
            "nutrientName": "Energy",
            "value": 165
          }
        ]
      }
    ]
  }
}
```

### Get Food Details

#### GET /api/diet/food/:fdcId
Get detailed information for a specific food (uses cache when available).

**Response:**
```json
{
  "success": true,
  "data": {
    "fdcId": 171705,
    "description": "Chicken breast, grilled",
    "dataType": "Survey (FNDDS)",
    "servingSize": 100,
    "servingSizeUnit": "g",
    "foodNutrients": [...],
    "extractedNutrients": {
      "calories": 165,
      "protein_g": 31,
      "carbs_g": 0,
      "fat_g": 3.6,
      "fiber_g": 0
    },
    "servingInfo": {
      "size": 100,
      "unit": "g"
    }
  }
}
```

### Get Recent Foods

#### GET /api/diet/recent
Get user's recently used or frequently logged foods.

**Headers:**
```
Authorization: Bearer <your-jwt-token>
```

**Query Parameters:**
- `limit` (optional): Number of results (default: 20)
- `sortBy` (optional): Sort by "recent" or "frequent" (default: recent)

**Example Requests:**
```
GET /api/diet/recent
GET /api/diet/recent?sortBy=frequent&limit=10
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "user_id": 1,
      "fdc_id": 171705,
      "food_name": "Chicken breast, grilled",
      "times_used": 15,
      "last_used_at": "2025-01-15T10:30:00Z"
    }
  ],
  "count": 1
}
```

### Log Food Entry

#### POST /api/diet/entries
Log a food consumed by the user.

**Headers:**
```
Authorization: Bearer <your-jwt-token>
```

**Request Body:**
```json
{
  "fdc_id": 171705,
  "food_name": "Chicken breast, grilled",
  "data_type": "Survey (FNDDS)",
  "serving_size": 150,
  "serving_unit": "g",
  "calories": 247.5,
  "protein_g": 46.5,
  "carbs_g": 0,
  "fat_g": 5.4,
  "fiber_g": 0,
  "meal_type": "lunch",
  "consumed_at": "2025-01-15T12:30:00Z",
  "notes": "Post-workout meal"
}
```

**Required Fields:**
- `fdc_id`: USDA FoodData Central ID
- `food_name`: Name of the food
- `serving_size`: Amount consumed
- `serving_unit`: Unit of measurement

**Optional Fields:**
- `data_type`: USDA data type
- `calories`, `protein_g`, `carbs_g`, `fat_g`, `fiber_g`: Nutrition values
- `meal_type`: "breakfast", "lunch", "dinner", or "snack"
- `consumed_at`: Timestamp (defaults to now)
- `notes`: Additional notes

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "user_id": 1,
    "fdc_id": 171705,
    "food_name": "Chicken breast, grilled",
    "serving_size": 150,
    "serving_unit": "g",
    "calories": 247.5,
    "protein_g": 46.5,
    "carbs_g": 0,
    "fat_g": 5.4,
    "fiber_g": 0,
    "meal_type": "lunch",
    "consumed_at": "2025-01-15T12:30:00Z",
    "notes": "Post-workout meal",
    "created_at": "2025-01-15T12:35:00Z",
    "updated_at": "2025-01-15T12:35:00Z"
  }
}
```

**Notes:**
- Automatically tracks food in user's recent foods list
- All nutrition values are optional but recommended

### Get Food Log

#### GET /api/diet/entries
Get user's food log with optional filters.

**Headers:**
```
Authorization: Bearer <your-jwt-token>
```

**Query Parameters:**
- `date` (optional): Specific date (YYYY-MM-DD)
- `startDate` (optional): Start of date range
- `endDate` (optional): End of date range
- `mealType` (optional): Filter by meal type
- `limit` (optional): Results per page (default: 100)
- `offset` (optional): Pagination offset (default: 0)

**Example Requests:**
```
GET /api/diet/entries
GET /api/diet/entries?date=2025-01-15
GET /api/diet/entries?startDate=2025-01-01&endDate=2025-01-31
GET /api/diet/entries?mealType=lunch
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "user_id": 1,
      "fdc_id": 171705,
      "food_name": "Chicken breast, grilled",
      "serving_size": 150,
      "calories": 247.5,
      "protein_g": 46.5,
      "meal_type": "lunch",
      "consumed_at": "2025-01-15T12:30:00Z"
    }
  ],
  "count": 1
}
```

### Get Food Entry by ID

#### GET /api/diet/entries/:id
Get a specific food entry.

**Headers:**
```
Authorization: Bearer <your-jwt-token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "user_id": 1,
    "fdc_id": 171705,
    "food_name": "Chicken breast, grilled",
    "serving_size": 150,
    "calories": 247.5,
    "consumed_at": "2025-01-15T12:30:00Z"
  }
}
```

### Update Food Entry

#### PUT /api/diet/entries/:id
Update an existing food entry.

**Headers:**
```
Authorization: Bearer <your-jwt-token>
```

**Request Body:**
```json
{
  "serving_size": 200,
  "calories": 330,
  "protein_g": 62,
  "notes": "Updated serving size"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "serving_size": 200,
    "calories": 330,
    "protein_g": 62,
    "notes": "Updated serving size",
    "updated_at": "2025-01-15T13:00:00Z"
  }
}
```

### Delete Food Entry

#### DELETE /api/diet/entries/:id
Delete a food entry.

**Headers:**
```
Authorization: Bearer <your-jwt-token>
```

**Response:**
```
204 No Content
```

## USDA API Integration

The diet tracking feature uses the USDA FoodData Central API with the following optimizations:

### Caching
- Food details are cached for 7 days to minimize API calls
- Cache is automatically checked before making API requests
- Reduces load on USDA API and improves response times

### Recent Foods
- User's recently logged foods are automatically tracked
- Provides quick access to frequently consumed items
- Sorted by most recent or most frequent usage

### Rate Limits
- USDA API limit: 1,000 requests/hour per IP
- Caching strategy significantly reduces API usage
- API key configured via `USDA_KEY` environment variable

### Data Types
- **Branded Foods**: Commercial food products
- **Survey (FNDDS)**: Foods from food surveys
- **Foundation Foods**: Minimally processed foods
- **SR Legacy**: Standard Reference legacy data


## Testing

Use the provided `tests/api.http` file with VS Code REST Client extension to test all endpoints. The file includes examples for all available operations.