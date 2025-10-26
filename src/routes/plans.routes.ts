import { Router, Request, Response } from 'express';
import { PlanModel } from '../models/plan.model.js';
import { PlanWorkoutModel } from '../models/planWorkout.model.ts';
import { UserPlanModel } from '../models/userPlan.model.js';
import { CreatePlanInput } from '../types/database.types.js';
import { authenticateToken, optionalAuth } from '../middleware/auth.js';

const router = Router();

// GET /plans - List plans with optional filters
router.get('/', optionalAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { subscribed, created_by_me, limit = 100, offset = 0 } = req.query;

    let plans;

    if (subscribed === 'true' && userId) {
      plans = await PlanModel.findUserSubscribedPlans(userId, Number(limit), Number(offset));
    } else if (created_by_me === 'true' && userId) {
      plans = await PlanModel.findUserPlans(userId, Number(limit), Number(offset));
    } else if (userId) {
      plans = await PlanModel.findAllUserAccessiblePlans(userId, Number(limit), Number(offset));
    } else {
      plans = await PlanModel.findPublicPlans(Number(limit), Number(offset));
    }

    return res.json({
      success: true,
      data: plans,
      count: plans.length
    });
  } catch (error) {
    console.error('Error fetching plans:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch plans' });
  }
});

// GET /plans/:id - Get plan details with workouts
router.get('/:id', optionalAuth, async (req: Request, res: Response) => {
  try {
    const planId = parseInt(req.params.id);
    const userId = (req as any).user?.id;

    // Check access
    if (userId) {
      const hasAccess = await PlanModel.hasAccess(planId, userId);
      if (!hasAccess) {
        return res.status(403).json({ success: false, error: 'Access denied' });
      }
    }

    const plan = await PlanModel.findById(planId);
    if (!plan) {
      return res.status(404).json({ success: false, error: 'Plan not found' });
    }

    // Only show private plans to authenticated users with access
    if (!plan.is_public && !userId) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const workouts = await PlanWorkoutModel.findByPlanId(planId);

    return res.json({
      success: true,
      data: { ...plan, workouts }
    });
  } catch (error) {
    console.error('Error fetching plan:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch plan' });
  }
});

// POST /plans - Create new plan
router.post('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const { workouts, ...planData }: CreatePlanInput = req.body;

    // Create plan
    const plan = await PlanModel.create({
      ...planData,
      created_by: userId
    });

    // Add workouts if provided
    if (workouts && workouts.length > 0) {
      await PlanWorkoutModel.bulkUpsert(plan.id, workouts);
    }

    // Fetch the complete plan with workouts
    const planWorkouts = await PlanWorkoutModel.findByPlanId(plan.id);

    return res.status(201).json({
      success: true,
      data: { ...plan, workouts: planWorkouts }
    });
  } catch (error) {
    console.error('Error creating plan:', error);
    return res.status(500).json({ success: false, error: 'Failed to create plan' });
  }
});

// PUT /plans/:id - Update plan including workouts
router.put('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const planId = parseInt(req.params.id);

    // Check ownership
    const isOwner = await PlanModel.isOwner(planId, userId);
    if (!isOwner) {
      return res.status(403).json({ success: false, error: 'Only plan owner can update' });
    }

    const { workouts, ...planData } = req.body;

    // Update plan details
    const updatedPlan = await PlanModel.update(planId, planData);
    if (!updatedPlan) {
      return res.status(404).json({ success: false, error: 'Plan not found' });
    }

    // Update workouts if provided
    if (workouts !== undefined) {
      await PlanWorkoutModel.bulkUpsert(planId, workouts);
    }

    // Fetch the complete plan with workouts
    const planWorkouts = await PlanWorkoutModel.findByPlanId(planId);

    return res.json({
      success: true,
      data: { ...updatedPlan, workouts: planWorkouts }
    });
  } catch (error) {
    console.error('Error updating plan:', error);
    return res.status(500).json({ success: false, error: 'Failed to update plan' });
  }
});

// DELETE /plans/:id - Delete plan
router.delete('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const planId = parseInt(req.params.id);

    // Check ownership
    const isOwner = await PlanModel.isOwner(planId, userId);
    if (!isOwner) {
      return res.status(403).json({ success: false, error: 'Only plan owner can delete' });
    }

    const deleted = await PlanModel.delete(planId);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Plan not found' });
    }

    return res.status(204).send();
  } catch (error) {
    console.error('Error deleting plan:', error);
    return res.status(500).json({ success: false, error: 'Failed to delete plan' });
  }
});

// POST /plans/:id/subscribe - Subscribe to a plan
router.post('/:id/subscribe', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const planId = parseInt(req.params.id);
    const { start_date = new Date() } = req.body;

    // Check if plan exists and user has access
    const hasAccess = await PlanModel.hasAccess(planId, userId);
    if (!hasAccess) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    // Check if already subscribed
    const existingSubscription = await UserPlanModel.findActiveByUserAndPlan(userId, planId);
    if (existingSubscription) {
      return res.status(400).json({ success: false, error: 'Already subscribed to this plan' });
    }

    const userPlan = await UserPlanModel.subscribe({
      user_id: userId,
      plan_id: planId,
      start_date: new Date(start_date)
    });

    return res.status(201).json({
      success: true,
      data: userPlan
    });
  } catch (error) {
    console.error('Error subscribing to plan:', error);
    return res.status(500).json({ success: false, error: 'Failed to subscribe to plan' });
  }
});

// POST /plans/:id/unsubscribe - Unsubscribe from a plan
router.post('/:id/unsubscribe', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const planId = parseInt(req.params.id);

    // Find active subscription
    const userPlan = await UserPlanModel.findActiveByUserAndPlan(userId, planId);
    if (!userPlan) {
      return res.status(404).json({ success: false, error: 'No active subscription found' });
    }

    await UserPlanModel.unsubscribe(userPlan.id, userId);

    return res.status(204).send();
  } catch (error) {
    console.error('Error unsubscribing from plan:', error);
    return res.status(500).json({ success: false, error: 'Failed to unsubscribe from plan' });
  }
});

// PUT /plans/subscriptions/:userPlanId - Update subscription status
router.put('/subscriptions/:userPlanId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const userPlanId = parseInt(req.params.userPlanId);
    const { status } = req.body;

    if (!['active', 'paused', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status' });
    }

    const updatedUserPlan = await UserPlanModel.updateStatus(userPlanId, userId, status);
    if (!updatedUserPlan) {
      return res.status(404).json({ success: false, error: 'Subscription not found' });
    }

    return res.json({
      success: true,
      data: updatedUserPlan
    });
  } catch (error) {
    console.error('Error updating subscription:', error);
    return res.status(500).json({ success: false, error: 'Failed to update subscription' });
  }
});

// PUT /plans/subscriptions/:userPlanId/reschedule - Reschedule a plan with a new start date
router.put('/subscriptions/:userPlanId/reschedule', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const userPlanId = parseInt(req.params.userPlanId);
    const { start_date } = req.body;

    if (!start_date) {
      return res.status(400).json({ success: false, error: 'start_date is required' });
    }

    const updatedUserPlan = await UserPlanModel.reschedule(userPlanId, userId, new Date(start_date));

    return res.json({
      success: true,
      data: updatedUserPlan
    });
  } catch (error) {
    console.error('Error rescheduling plan:', error);
    return res.status(500).json({ success: false, error: 'Failed to reschedule plan' });
  }
});

// DELETE /plans/subscriptions/:userPlanId - Delete a user plan subscription
router.delete('/subscriptions/:userPlanId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const userPlanId = parseInt(req.params.userPlanId);

    const deleted = await UserPlanModel.unsubscribe(userPlanId, userId);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Subscription not found' });
    }

    return res.status(204).send();
  } catch (error) {
    console.error('Error deleting subscription:', error);
    return res.status(500).json({ success: false, error: 'Failed to delete subscription' });
  }
});

export default router;