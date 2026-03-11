import { GoogleGenAI, Type, FunctionDeclaration } from '@google/genai';

const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export interface NutritionInfo {
  foodName: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

// Outil pour ajouter un repas
const addMealTool: FunctionDeclaration = {
  name: "add_meal",
  parameters: {
    type: Type.OBJECT,
    description: "Add a meal or food item consumed by the user.",
    properties: {
      foodName: { type: Type.STRING, description: "Name of the food or meal." },
      calories: { type: Type.NUMBER, description: "Estimated number of calories." },
      protein: { type: Type.NUMBER, description: "Grams of protein." },
      carbs: { type: Type.NUMBER, description: "Grams of carbohydrates." },
      fat: { type: Type.NUMBER, description: "Grams of fat." },
    },
    required: ["foodName", "calories"],
  },
};

// Outil pour ajouter de l'eau
const addWaterTool: FunctionDeclaration = {
  name: "add_water",
  parameters: {
    type: Type.OBJECT,
    description: "Add an amount of water drunk by the user.",
    properties: {
      amountMl: { type: Type.NUMBER, description: "Amount of water in milliliters (e.g., 250)." },
    },
    required: ["amountMl"],
  },
};

export async function analyzeMealImage(base64Image: string, mimeType: string, goal?: string): Promise<NutritionInfo> {
  try {
    const goalPrompt = goal ? ` The user's goal is ${goal.replace('_', ' ')}. Provide advice if this meal fits their goal.` : '';
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [
        {
          inlineData: {
            data: base64Image,
            mimeType: mimeType,
          },
        },
        `Analyze this image of food. Estimate the macronutrients and calories. Provide a structured JSON response.${goalPrompt}`
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

export const chatWithAI = async (message: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: message,
      config: {
        systemInstruction: `You are Core AI, an expert and motivating nutritional assistant. 
        You help the user track their diet and hydration.
        You can add meals or water using the tools provided.
        Be concise, friendly, and use emojis.`,
        tools: [{ functionDeclarations: [addMealTool, addWaterTool] }],
      },
    });

    return {
      text: response.text,
      functionCalls: response.functionCalls
    };
  } catch (error) {
    console.error("Chat with AI Error:", error);
    throw error;
  }
};
