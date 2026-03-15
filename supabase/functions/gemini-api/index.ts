import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { GoogleGenerativeAI, Type, FunctionDeclaration } from "npm:@google/genai"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
      servings: { type: Type.NUMBER, description: "Number of servings or quantity (default 1)." },
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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { action, payload } = await req.json()

    const apiKey = Deno.env.get('GEMINI_API_KEY')
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not set')
    }

    const ai = new GoogleGenerativeAI({ apiKey });

    if (action === 'analyzeMealImage') {
      const { base64Image, mimeType, goal, extraDetails } = payload;
      const goalPrompt = goal ? ` The user's goal is ${goal.replace('_', ' ')}. Provide advice if this meal fits their goal.` : '';
      const detailsPrompt = extraDetails ? ` Additional details from user: "${extraDetails}". Please take this into account when estimating.` : '';
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [
          {
            inlineData: {
              data: base64Image,
              mimeType: mimeType,
            },
          },
          `Analyze this image of food. Estimate the macronutrients and calories. Provide a structured JSON response.${goalPrompt}${detailsPrompt}`
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

      return new Response(
        JSON.stringify({ result: JSON.parse(response.text || '{}') }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    } else if (action === 'chatWithAI') {
      const { message } = payload;
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

      return new Response(
        JSON.stringify({ 
          result: {
            text: response.text,
            functionCalls: response.functionCalls
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    } else {
      throw new Error('Invalid action');
    }
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
