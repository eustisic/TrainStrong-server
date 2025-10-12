import { Router } from 'express';
import authRoutes from './auth.routes.js';
import workoutRoutes from './workouts.routes.ts';
import scheduledWorkoutRoutes from './scheduled-workouts.ts';
import dashboardRoutes from './dashboard.routes.js';
import planRoutes from './plans.routes.js';
import dietRoutes from './diet.routes.js';

const router = Router();

// API routes
router.use('/auth', authRoutes);
router.use('/workouts', workoutRoutes);
router.use('/scheduled-workouts', scheduledWorkoutRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/plans', planRoutes);
router.use('/diet', dietRoutes);

export default router;