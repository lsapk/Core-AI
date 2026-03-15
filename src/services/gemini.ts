import { supabase } from './supabase';

export interface NutritionInfo {
  foodName: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export async function analyzeMealImage(base64Image: string, mimeType: string, goal?: string, extraDetails?: string): Promise<NutritionInfo> {
  try {
    const { data, error } = await supabase.functions.invoke('gemini-api', {
      body: { 
        action: 'analyzeMealImage',
        payload: {
          base64Image,
          mimeType,
          goal,
          extraDetails
        }
      }
    });

    if (error) {
      console.error('Supabase Edge Function Error:', error);
      throw new Error('Failed to analyze image via Edge Function');
    }

    if (!data || !data.result) {
      throw new Error('No result returned from Edge Function');
    }

    return data.result as NutritionInfo;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
}

export const chatWithAI = async (message: string) => {
  try {
    const { data, error } = await supabase.functions.invoke('gemini-api', {
      body: { 
        action: 'chatWithAI',
        payload: {
          message
        }
      }
    });

    if (error) {
      console.error('Supabase Edge Function Error:', error);
      throw new Error('Failed to generate chat response via Edge Function');
    }

    if (!data || !data.result) {
      throw new Error('No result returned from Edge Function');
    }

    return data.result;
  } catch (error) {
    console.error("Chat with AI Error:", error);
    throw error;
  }
};
