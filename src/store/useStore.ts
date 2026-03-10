import { create } from 'zustand';
import { supabase } from '../services/supabase';

export interface MealRecord {
  id: string;
  date: string;
  foodName: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  imageUrl?: string;
}

interface AppState {
  meals: MealRecord[];
  dailyGoal: number;
  isLoading: boolean;
  fetchMeals: () => Promise<void>;
  addMeal: (meal: Omit<MealRecord, 'id'>) => Promise<void>;
  removeMeal: (id: string) => Promise<void>;
}

export const useStore = create<AppState>((set, get) => ({
  meals: [],
  dailyGoal: 2000,
  isLoading: false,

  fetchMeals: async () => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase
        .from('meals')
        .select('*')
        .order('date', { ascending: false });
      
      if (error) {
        console.error('Error fetching meals:', error);
      } else if (data) {
        const formattedMeals = data.map(item => ({
          id: item.id,
          date: item.date,
          foodName: item.food_name,
          calories: item.calories,
          protein: item.protein,
          carbs: item.carbs,
          fat: item.fat,
          imageUrl: item.image_url,
        }));
        set({ meals: formattedMeals });
      }
    } catch (err) {
      console.error('Unexpected error fetching meals:', err);
    } finally {
      set({ isLoading: false });
    }
  },

  addMeal: async (meal) => {
    try {
      const { data, error } = await supabase
        .from('meals')
        .insert([
          {
            date: meal.date,
            food_name: meal.foodName,
            calories: meal.calories,
            protein: meal.protein,
            carbs: meal.carbs,
            fat: meal.fat,
            image_url: meal.imageUrl,
          }
        ])
        .select()
        .single();

      if (error) {
        console.error('Error adding meal:', error);
      } else if (data) {
        const newMeal: MealRecord = {
          id: data.id,
          date: data.date,
          foodName: data.food_name,
          calories: data.calories,
          protein: data.protein,
          carbs: data.carbs,
          fat: data.fat,
          imageUrl: data.image_url,
        };
        set((state) => ({ meals: [newMeal, ...state.meals] }));
      }
    } catch (err) {
      console.error('Unexpected error adding meal:', err);
    }
  },

  removeMeal: async (id) => {
    try {
      const { error } = await supabase
        .from('meals')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting meal:', error);
      } else {
        set((state) => ({ meals: state.meals.filter((m) => m.id !== id) }));
      }
    } catch (err) {
      console.error('Unexpected error deleting meal:', err);
    }
  },
}));
