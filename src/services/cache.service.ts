import { LRUCache } from 'lru-cache'
import { USDAService } from './usda.service.js';
import { UserRecentFoodsModel } from '../models/userRecentFoods.model.js';
import { USDAFoodDetail, USDASearchResult } from '../types/database.types.js';

// Initialize LRU cache for food data
// Cache up to 1000 foods, expire after 7 days, refresh TTL on access
const foodCache = new LRUCache<number, USDAFoodDetail>({
  max: 100,
  ttl: 1000 * 60 * 60 * 24 * 7, // 7 days in milliseconds
  updateAgeOnGet: true, // Refresh TTL when accessed
  updateAgeOnHas: false,
});

export class CacheService {
  /**
   * Get food details with caching
   * Checks cache first, falls back to USDA API if not cached or expired
   */
  static async getFoodWithCache(fdcId: number): Promise<USDAFoodDetail> {
    // Check cache first
    const cached = foodCache.get(fdcId);

    if (cached) {
      console.log(`Cache hit for food ${fdcId}`);
      return cached;
    }

    // Cache miss - fetch from USDA API
    console.log(`Cache miss for food ${fdcId}, fetching from USDA API`);
    const foodData = await USDAService.getFoodDetails(fdcId);

    // Cache the result
    foodCache.set(fdcId, foodData);

    return foodData;
  }

  /**
   * Get multiple foods with caching
   * Fetches cached foods and only calls API for missing ones
   */
  static async getMultipleFoodsWithCache(fdcIds: number[]): Promise<USDAFoodDetail[]> {
    if (fdcIds.length === 0) return [];

    const cachedFoods: USDAFoodDetail[] = [];
    const missingFdcIds: number[] = [];

    // Check cache for each food
    for (const fdcId of fdcIds) {
      const cached = foodCache.get(fdcId);
      if (cached) {
        cachedFoods.push(cached);
      } else {
        missingFdcIds.push(fdcId);
      }
    }

    let freshFoods: USDAFoodDetail[] = [];

    // Fetch missing foods from API
    if (missingFdcIds.length > 0) {
      console.log(`Fetching ${missingFdcIds.length} foods from USDA API`);
      freshFoods = await USDAService.getMultipleFoods(missingFdcIds);

      // Cache the fresh foods
      for (const food of freshFoods) {
        foodCache.set(food.fdcId, food);
      }
    }

    // Combine cached and fresh foods
    return [...cachedFoods, ...freshFoods];
  }

  /**
   * Search foods (not cached, always fresh from API)
   * Search results change frequently, so we don't cache them
   */
  static async searchFoods(
    query: string,
    dataType?: string[],
    pageSize?: number,
    pageNumber?: number
  ): Promise<USDASearchResult> {
    return USDAService.searchFoods(query, dataType, pageSize, pageNumber);
  }

  /**
   * Track user's food usage and get user's recent foods
   */
  static async trackUserFood(userId: number, fdcId: number, foodName: string): Promise<void> {
    await UserRecentFoodsModel.trackFood(userId, fdcId, foodName);
  }

  /**
   * Get user's recently used foods
   */
  static async getUserRecentFoods(userId: number, limit: number = 20) {
    return UserRecentFoodsModel.getRecentFoods(userId, limit);
  }

  /**
   * Get user's most frequently logged foods
   */
  static async getUserFrequentFoods(userId: number, limit: number = 20) {
    return UserRecentFoodsModel.getFrequentFoods(userId, limit);
  }

  /**
   * Clear all cache entries
   * LRU cache handles expiration automatically, but this allows manual clearing
   */
  static clearCache(): void {
    foodCache.clear();
    console.log('Food cache cleared');
  }

  /**
   * Get cache statistics
   */
  static getCacheStats() {
    return {
      size: foodCache.size,
      max: foodCache.max,
      ttl: foodCache.ttl,
    };
  }
}
