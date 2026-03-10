export interface OpenFoodFactsProduct {
  foodName: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export async function fetchProductByBarcode(barcode: string): Promise<OpenFoodFactsProduct> {
  try {
    const response = await fetch(`https://world.openfoodfacts.org/api/v2/product/${barcode}.json`);
    const data = await response.json();
    
    if (data.status === 1 && data.product) {
      const nutriments = data.product.nutriments;
      return {
        foodName: data.product.product_name || "Unknown Product",
        calories: nutriments['energy-kcal_100g'] || 0, // Note: this is per 100g, might need serving size logic
        protein: nutriments.proteins_100g || 0,
        carbs: nutriments.carbohydrates_100g || 0,
        fat: nutriments.fat_100g || 0,
      };
    }
    throw new Error("Product not found");
  } catch (error) {
    console.error("Error fetching barcode:", error);
    throw error;
  }
}
