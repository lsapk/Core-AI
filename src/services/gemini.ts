import { GoogleGenAI, Type, FunctionDeclaration } from '@google/genai';

const apiKey = process.env.GEMINI_API_KEY || process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';
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

export async function analyzeMealText(text: string): Promise<NutritionInfo> {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: [{ role: 'user', parts: [{ text: `Analyze this food description and estimate the macronutrients and calories for the given quantity: "${text}". Provide a structured JSON response.` }] }],
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

export async function analyzeMealImage(base64Image: string, mimeType: string, goal?: string, extraDetails?: string): Promise<NutritionInfo> {
  try {
    const goalPrompt = goal ? ` The user's goal is ${goal.replace('_', ' ')}. Provide advice if this meal fits their goal.` : '';
    const detailsPrompt = extraDetails ? ` Additional details from user: "${extraDetails}". Please take this into account when estimating.` : '';
    
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Image,
              mimeType: mimeType,
            },
          },
          {
            text: `Analyze this image of food. Estimate the macronutrients and calories. Provide a structured JSON response.${goalPrompt}${detailsPrompt}`
          }
        ]
      },
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

export const chatWithAI = async (message: string, history: any[], dailyContext: string, todayDate: string) => {
  try {
    const systemInstruction = `Tu es un Expert en Nutrition et Diététique spécialisé dans l'analyse quantitative des données alimentaires. Ton approche est strictement factuelle, précise et analytique.

# MISSION
Ton objectif est d'assister l'utilisateur dans le suivi quotidien de son apport nutritionnel. Tu dois extraire les calories et macronutriments (Protéines, Glucides, Lipides) et tenir à jour un bilan journalier.

# MÉTHODOLOGIE D'ANALYSE
1. Analyse de l'entrée : Identifie les aliments via le texte.
2. Estimation des quantités : Si précisé, calcul exact. Sinon, utilise des portions moyennes standards françaises.
3. Calcul des Macros : Calcule systématiquement Calories (kcal), Protéines (g), Glucides (g), Lipides (g).

# STRUCTURE DE RÉPONSE (FORMAT OBLIGATOIRE)
Chaque réponse doit suivre scrupuleusement ce plan:

1. **DATE ET MOMENT** : "Date : ${todayDate} | Repas : [Préciser le repas]"
2. **TABLEAU DES MACROS** : Un tableau Markdown structuré:
| Aliment | Quantité (est.) | Calories | Protéines | Glucides | Lipides |
| :--- | :--- | :--- | :--- | :--- | :--- |
| [Nom] | [Poids/Portion] | [X] kcal | [X] g | [X] g | [X] g |
| **TOTAL REPAS** | **-** | **[Somme]** | **[Somme]** | **[Somme]** | **[Somme]** |

3. **BILAN JOURNALIER CUMULÉ** : 
[IMPORTANT: Voici les totaux de l'utilisateur AVANT ce repas : ${dailyContext}. Additionne strictement les macros de ton 'TOTAL REPAS' à ces chiffres pour afficher le vrai cumul actuel].

# CONTRAINTES ET STYLE
- Ton : Purement factuel, sans jugement ni adjectifs superflus (pas de "super", "attention").
- Précision : Si flou, demande poliment une précision avant de calculer.
- Clôture : Termine par une seule petite phrase en gras et italique résumant factuellement l'état des besoins restants.

# DIRECTIVE TECHNIQUE ABSOLUE
Tu DOIS utiliser l'outil 'add_meal' pour enregistrer CHAQUE repas analysé. Fais-le de manière invisible pour l'utilisateur, tout en lui fournissant la réponse texte formatée ci-dessus.`;

    const contents = [];
    if (history && Array.isArray(history)) {
      history.forEach((msg: any) => {
        contents.push({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.text }]
        });
      });
    }
    contents.push({ role: 'user', parts: [{ text: message }] });

    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
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
