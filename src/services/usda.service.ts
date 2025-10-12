import axios from 'axios';
import { USDASearchResult, USDAFoodDetail, USDAFoodNutrient } from '../types/database.types.js';

const USDA_API_BASE_URL = 'https://api.nal.usda.gov/fdc/v1';
const USDA_API_KEY = process.env.USDA_KEY;

if (!USDA_API_KEY) {
  console.warn('WARNING: USDA_KEY not found in environment variables. USDA API calls will fail.');
}

export class USDAService {
  /**
   * Search for foods in the USDA database
   */
  static async searchFoods(
    query: string,
    dataType?: string[],
    pageSize: number = 25,
    pageNumber: number = 1,
    sortBy?: string,
    sortOrder?: 'asc' | 'desc'
  ): Promise<USDASearchResult> {
    try {
      const params: any = {
        api_key: USDA_API_KEY,
        query,
        pageSize,
        pageNumber
      };

      if (dataType && dataType.length > 0) {
        params.dataType = dataType;
      }

      if (sortBy) {
        params.sortBy = sortBy;
      }

      if (sortOrder) {
        params.sortOrder = sortOrder;
      }

      const response = await axios.get(`${USDA_API_BASE_URL}/foods/search`, { params });
      return response.data;
    } catch (error: any) {
      console.error('USDA API search error:', error.response?.data || error.message);
      throw new Error(`Failed to search USDA foods: ${error.message}`);
    }
  }

  /**
   * Get details for a single food by FDC ID
   */
  static async getFoodDetails(fdcId: number): Promise<USDAFoodDetail> {
    try {
      const response = await axios.get(`${USDA_API_BASE_URL}/food/${fdcId}`, {
        params: {
          api_key: USDA_API_KEY
        }
      });
      return response.data;
    } catch (error: any) {
      console.error('USDA API food details error:', error.response?.data || error.message);
      throw new Error(`Failed to fetch food details: ${error.message}`);
    }
  }

  /**
   * Get details for multiple foods by FDC IDs
   */
  static async getMultipleFoods(fdcIds: number[]): Promise<USDAFoodDetail[]> {
    try {
      const response = await axios.post(
        `${USDA_API_BASE_URL}/foods`,
        { fdcIds },
        {
          params: {
            api_key: USDA_API_KEY
          },
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      return response.data;
    } catch (error: any) {
      console.error('USDA API multiple foods error:', error.response?.data || error.message);
      throw new Error(`Failed to fetch multiple foods: ${error.message}`);
    }
  }

  /**
   * Extract nutrition data from USDA food nutrients
   * Returns calories, protein, carbs, fat, and fiber
   */
  static extractNutrients(foodNutrients: USDAFoodNutrient[]): {
    calories?: number;
    protein_g?: number;
    carbs_g?: number;
    fat_g?: number;
    fiber_g?: number;
  } {
    const nutrients: any = {};

    // Nutrient IDs from USDA database
    const NUTRIENT_IDS = {
      ENERGY_KCAL: 1008,        // Energy (kcal)
      PROTEIN: 1003,            // Protein
      CARBOHYDRATE: 1005,       // Carbohydrate, by difference
      TOTAL_FAT: 1004,          // Total lipid (fat)
      FIBER: 1079               // Fiber, total dietary
    };

    for (const nutrient of foodNutrients) {
      switch (nutrient.nutrientId) {
        case NUTRIENT_IDS.ENERGY_KCAL:
          nutrients.calories = nutrient.value;
          break;
        case NUTRIENT_IDS.PROTEIN:
          nutrients.protein_g = nutrient.value;
          break;
        case NUTRIENT_IDS.CARBOHYDRATE:
          nutrients.carbs_g = nutrient.value;
          break;
        case NUTRIENT_IDS.TOTAL_FAT:
          nutrients.fat_g = nutrient.value;
          break;
        case NUTRIENT_IDS.FIBER:
          nutrients.fiber_g = nutrient.value;
          break;
      }
    }

    return nutrients;
  }

  /**
   * Get serving size from food data
   */
  static getServingInfo(food: USDAFoodDetail): { size: number; unit: string } {
    // Try to get serving size from the food data
    if (food.servingSize && food.servingSizeUnit) {
      return {
        size: food.servingSize,
        unit: food.servingSizeUnit
      };
    }

    // Try household serving full text
    if (food.householdServingFullText) {
      return {
        size: 1,
        unit: food.householdServingFullText
      };
    }

    // Try first portion if available
    if (food.foodPortions && food.foodPortions.length > 0) {
      const portion = food.foodPortions[0];
      return {
        size: portion.amount,
        unit: portion.measureUnit?.name || 'serving'
      };
    }

    // Default to 100g
    return {
      size: 100,
      unit: 'g'
    };
  }
}
