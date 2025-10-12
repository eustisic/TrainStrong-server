import { Router, Request, Response } from 'express';
import { CacheService } from '../services/cache.service.js';
import { FoodEntryModel } from '../models/foodEntry.model.js';
import { NutritionGoalModel } from '../models/nutritionGoal.model.js';
import { USDAService } from '../services/usda.service.js';
import { CreateFoodEntryInput } from '../types/database.types.js';

const router = Router();

// ============================================================================
// USDA Food Search & Details
// ============================================================================

// GET /diet/search - Search USDA foods
router.get('/search', async (req: Request, res: Response) => {
  try {
    const { query, dataType, pageSize = 25, pageNumber = 1 } = req.query;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Query parameter is required'
      });
    }

    const dataTypeArray = dataType
      ? (Array.isArray(dataType) ? dataType : [dataType])
      : undefined;

    const results = await CacheService.searchFoods(
      query,
      dataTypeArray as string[] | undefined,
      Number(pageSize),
      Number(pageNumber)
    );

    return res.json({
      success: true,
      data: results
    });
  } catch (error: any) {
    console.error('Error searching foods:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to search foods'
    });
  }
});

// GET /diet/food/:fdcId - Get food details (cache-first)
router.get('/food/:fdcId', async (req: Request, res: Response) => {
  try {
    const fdcId = parseInt(req.params.fdcId);

    if (isNaN(fdcId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid FDC ID'
      });
    }

    const food = await CacheService.getFoodWithCache(fdcId);

    // Extract nutrients for convenience
    const nutrients = USDAService.extractNutrients(food.foodNutrients);
    const serving = USDAService.getServingInfo(food);

    return res.json({
      success: true,
      data: {
        ...food,
        extractedNutrients: nutrients,
        servingInfo: serving
      }
    });
  } catch (error: any) {
    console.error('Error fetching food details:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch food details'
    });
  }
});

// GET /diet/recent - Get user's recently used foods
router.get('/recent', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const { limit = 20, sortBy = 'recent' } = req.query;

    let recentFoods;
    if (sortBy === 'frequent') {
      recentFoods = await CacheService.getUserFrequentFoods(userId, Number(limit));
    } else {
      recentFoods = await CacheService.getUserRecentFoods(userId, Number(limit));
    }

    return res.json({
      success: true,
      data: recentFoods,
      count: recentFoods.length
    });
  } catch (error: any) {
    console.error('Error fetching recent foods:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch recent foods'
    });
  }
});

// ============================================================================
// Food Entries (Logging)
// ============================================================================

// POST /diet/entries - Log food consumed
router.post('/entries', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const entryData: CreateFoodEntryInput = {
      ...req.body,
      user_id: userId
    };

    // Validate required fields
    if (!entryData.fdc_id || !entryData.food_name || !entryData.serving_size || !entryData.serving_unit) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: fdc_id, food_name, serving_size, serving_unit'
      });
    }

    const entry = await FoodEntryModel.create(entryData);

    // Track this food for user's recent foods
    await CacheService.trackUserFood(userId, entryData.fdc_id, entryData.food_name);

    return res.status(201).json({
      success: true,
      data: entry
    });
  } catch (error: any) {
    console.error('Error creating food entry:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to create food entry'
    });
  }
});

// GET /diet/entries - Get user's food log
router.get('/entries', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const {
      date,
      startDate,
      endDate,
      mealType,
      limit = 100,
      offset = 0
    } = req.query;

    let entries;

    if (date || startDate || endDate || mealType) {
      entries = await FoodEntryModel.findWithFilters({
        userId,
        date: date ? new Date(date as string) : undefined,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        mealType: mealType as any,
        limit: Number(limit),
        offset: Number(offset)
      });
    } else {
      entries = await FoodEntryModel.findByUserId(userId, Number(limit), Number(offset));
    }

    return res.json({
      success: true,
      data: entries,
      count: entries.length
    });
  } catch (error: any) {
    console.error('Error fetching food entries:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch food entries'
    });
  }
});

// GET /diet/entries/:id - Get specific food entry
router.get('/entries/:id', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const entryId = parseInt(req.params.id);
    const entry = await FoodEntryModel.findById(entryId);

    if (!entry) {
      return res.status(404).json({
        success: false,
        error: 'Food entry not found'
      });
    }

    if (entry.user_id !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    return res.json({
      success: true,
      data: entry
    });
  } catch (error: any) {
    console.error('Error fetching food entry:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch food entry'
    });
  }
});

// PUT /diet/entries/:id - Update food entry
router.put('/entries/:id', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const entryId = parseInt(req.params.id);
    const entry = await FoodEntryModel.findById(entryId);

    if (!entry) {
      return res.status(404).json({
        success: false,
        error: 'Food entry not found'
      });
    }

    if (entry.user_id !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    const updatedEntry = await FoodEntryModel.update(entryId, req.body);

    return res.json({
      success: true,
      data: updatedEntry
    });
  } catch (error: any) {
    console.error('Error updating food entry:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update food entry'
    });
  }
});

// DELETE /diet/entries/:id - Delete food entry
router.delete('/entries/:id', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const entryId = parseInt(req.params.id);
    const entry = await FoodEntryModel.findById(entryId);

    if (!entry) {
      return res.status(404).json({
        success: false,
        error: 'Food entry not found'
      });
    }

    if (entry.user_id !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    await FoodEntryModel.delete(entryId);

    return res.status(204).send();
  } catch (error: any) {
    console.error('Error deleting food entry:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete food entry'
    });
  }
});

// GET /diet/summary - Daily nutrition summary
router.get('/summary', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const date = req.query.date ? new Date(req.query.date as string) : new Date();

    const summary = await FoodEntryModel.getDailySummary(userId, date);
    const goal = await NutritionGoalModel.getActiveGoal(userId);

    return res.json({
      success: true,
      data: {
        date: date.toISOString().split('T')[0],
        summary,
        goal: goal || null,
        progress: goal ? {
          calories: goal.daily_calories ? (summary.total_calories / goal.daily_calories) * 100 : null,
          protein: goal.daily_protein_g ? (summary.total_protein_g / goal.daily_protein_g) * 100 : null,
          carbs: goal.daily_carbs_g ? (summary.total_carbs_g / goal.daily_carbs_g) * 100 : null,
          fat: goal.daily_fat_g ? (summary.total_fat_g / goal.daily_fat_g) * 100 : null
        } : null
      }
    });
  } catch (error: any) {
    console.error('Error fetching nutrition summary:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch nutrition summary'
    });
  }
});

export default router;
