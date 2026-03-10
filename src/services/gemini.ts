import { GoogleGenAI, Type } from '@google/genai';

// In Expo, public env vars start with EXPO_PUBLIC_
const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY || '';

const ai = new GoogleGenAI({ apiKey });

export interface NutritionInfo {
  foodName: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export async function analyzeMealImage(base64Image: string, mimeType: string): Promise<NutritionInfo> {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          inlineData: {
            data: base64Image,
            mimeType: mimeType,
          },
        },
        "Analyze this image of food. Estimate the macronutrients and calories. Provide a structured JSON response."
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            foodName: { type: Type.STRING, description: "Name of the food" },
            calories: { type: Type.NUMBER, description: "Estimated total calories" },
            protein: { type: Type.NUMBER, description: "Estimated protein in grams" },
            carbs: { type: Type.NUMBER, description: "Estimated carbohydrates in grams" },
            fat: { type: Type.NUMBER, description: "Estimated fat in grams" },
          },
          required: ["foodName", "calories", "protein", "carbs", "fat"]
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as NutritionInfo;
    }
    throw new Error("No response from Gemini");
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
}
