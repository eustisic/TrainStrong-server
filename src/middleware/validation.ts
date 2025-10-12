import { Request, Response, NextFunction } from 'express';

// Validation helper functions
export function validateRequired(fields: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const missing = fields.filter(field => {
      const value = req.body[field];
      return value === undefined || value === null || value === '';
    });

    if (missing.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Missing required fields: ${missing.join(', ')}`
      });
    }

    return next();
  };
}

export function validateWorkoutData(req: Request, res: Response, next: NextFunction) {
  const { workout_data } = req.body;

  if (!workout_data || typeof workout_data !== 'object') {
    return res.status(400).json({
      success: false,
      error: 'workout_data must be a valid object'
    });
  }

  const validTypes = ['strength', 'cardio', 'flexibility', 'custom'];
  if (!workout_data.type || !validTypes.includes(workout_data.type)) {
    return res.status(400).json({
      success: false,
      error: `workout_data.type must be one of: ${validTypes.join(', ')}`
    });
  }

  return next();
}

export function validateId(paramName: string = 'id') {
  return (req: Request, res: Response, next: NextFunction) => {
    const id = parseInt(req.params[paramName]);
    
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        error: `Invalid ${paramName}`
      });
    }

    return next();
  };
}

export function validateUserId(req: Request, res: Response, next: NextFunction) {
  const userId = parseInt(req.query.user_id as string);
  
  if (isNaN(userId) || userId <= 0) {
    return res.status(400).json({
      success: false,
      error: 'Valid user_id is required'
    });
  }

  return next();
}

export function validatePagination(req: Request, res: Response, next: NextFunction) {
  const limit = parseInt(req.query.limit as string);
  const offset = parseInt(req.query.offset as string);

  // Set defaults if not provided
  if (isNaN(limit)) {
    req.query.limit = '100';
  } else if (limit > 1000) {
    return res.status(400).json({
      success: false,
      error: 'limit cannot exceed 1000'
    });
  }

  if (isNaN(offset)) {
    req.query.offset = '0';
  } else if (offset < 0) {
    return res.status(400).json({
      success: false,
      error: 'offset cannot be negative'
    });
  }

  return next();
}