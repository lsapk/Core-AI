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
      const servingsQty = data.product.serving_quantity ? parseFloat(data.product.serving_quantity) : 100;
      const ratio = servingsQty / 100;

      return {
        foodName: data.product.product_name || "Unknown Product",
        calories: Math.round((nutriments['energy-kcal_100g'] || 0) * ratio),
        protein: Math.round((nutriments.proteins_100g || 0) * ratio * 10) / 10,
        carbs: Math.round((nutriments.carbohydrates_100g || 0) * ratio * 10) / 10,
        fat: Math.round((nutriments.fat_100g || 0) * ratio * 10) / 10,
      };
    }
    throw new Error("Product not found");
  } catch (error) {
    console.error("Error fetching barcode:", error);
    throw error;
  }
}
