import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { supabase } from '../services/supabase';
import { Session, User } from '@supabase/supabase-js';
import { decode } from 'base64-arraybuffer';

export interface MealRecord {
  id: string;
  date: string;
  foodName: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servings: number;
  imageUrl?: string;
  mealType?: 'breakfast' | 'lunch' | 'dinner' | 'snack';
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
}

export interface UserProfile {
  id: string;
  email: string;
  goal: 'muscle_gain' | 'fat_loss' | 'health';
  gender: 'male' | 'female' | 'other';
  age: number;
  weight: number;
  height: number;
  activity_level: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  daily_calories_goal: number;
  protein_goal: number;
  carbs_goal: number;
  fat_goal: number;
  onboarding_completed: boolean;
}

export type ThemePreference = 'system' | 'light' | 'dark';

interface AppState {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  meals: MealRecord[];
  messages: ChatMessage[];
  water: number;
  isLoading: boolean;
  themePreference: ThemePreference;
  setUser: (user: User | null, session: Session | null) => void;
  fetchProfile: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  fetchMeals: () => Promise<void>;
  fetchWater: () => Promise<void>;
  addMeal: (meal: Omit<MealRecord, 'id'>) => Promise<void>;
  removeMeal: (id: string) => Promise<void>;
  uploadImage: (base64: string) => Promise<string | null>;
  addWater: (amount: number) => Promise<void>;
  resetWater: () => Promise<void>;
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  setThemePreference: (theme: ThemePreference) => void;
  signOut: () => Promise<void>;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      user: null,
      session: null,
      profile: null,
      meals: [],
      messages: [],
      water: 0,
      isLoading: false,
      themePreference: 'system',

      setUser: (user, session) => {
        set({ user, session });
        if (user) {
          get().fetchProfile();
          get().fetchMeals();
          get().fetchWater();
        } else {
          set({ profile: null, meals: [], messages: [], water: 0 });
        }
      },

      fetchProfile: async () => {
        const { user } = get();
        if (!user) return;

        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

          if (error && error.code !== 'PGRST116') {
            console.error('Error fetching profile:', error);
            Alert.alert("Erreur de connexion", "Impossible de récupérer votre profil. Vous êtes en mode hors-ligne ou une erreur s'est produite.");
            // Fallback to default profile if table doesn't exist or other error
            set({ 
              profile: {
                id: user.id,
                email: user.email || '',
                goal: 'health',
                gender: 'other',
                age: 0,
                weight: 0,
                height: 0,
                activity_level: 'moderate',
                daily_calories_goal: 2000,
                protein_goal: 150,
                carbs_goal: 200,
                fat_goal: 65,
                onboarding_completed: false
              } 
            });
          } else if (data) {
            set({ profile: data });
          } else {
            // Profile doesn't exist yet, set a default one so onboarding can start
            set({ 
              profile: {
                id: user.id,
                email: user.email || '',
                goal: 'health',
                gender: 'other',
                age: 0,
                weight: 0,
                height: 0,
                activity_level: 'moderate',
                daily_calories_goal: 2000,
                protein_goal: 150,
                carbs_goal: 200,
                fat_goal: 65,
                onboarding_completed: false
              } 
            });
          }
        } catch (err) {
          console.error('Unexpected error fetching profile:', err);
          set({ 
            profile: {
              id: user.id,
              email: user.email || '',
              goal: 'health',
              gender: 'other',
              age: 0,
              weight: 0,
              height: 0,
              activity_level: 'moderate',
              daily_calories_goal: 2000,
              protein_goal: 150,
              carbs_goal: 200,
              fat_goal: 65,
              onboarding_completed: false
            } 
          });
        }
      },

      updateProfile: async (updates) => {
        const { user, profile } = get();
        if (!user) return;

        try {
          const { data, error } = await supabase
            .from('profiles')
            .upsert({ id: user.id, ...updates })
            .select()
            .single();

          if (error) {
            console.error('Error updating profile in Supabase:', error);
            // Update local state anyway so the app doesn't block
            set({ profile: { ...profile, ...updates } as UserProfile });
          } else {
            set({ profile: data });
          }
        } catch (err) {
          console.error('Unexpected error updating profile:', err);
          set({ profile: { ...profile, ...updates } as UserProfile });
        }
      },

      fetchMeals: async () => {
        const { user } = get();
        if (!user) return;

        set({ isLoading: true });
        try {
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

          const { data, error } = await supabase
            .from('meals')
            .select('*')
            .eq('user_id', user.id)
            .gte('date', thirtyDaysAgo.toISOString())
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
              servings: item.servings || 1,
              imageUrl: item.image_url,
              mealType: item.meal_type,
            }));
            set({ meals: formattedMeals });
          }
        } catch (err) {
          console.error('Unexpected error fetching meals:', err);
        } finally {
          set({ isLoading: false });
        }
      },

      uploadImage: async (base64) => {
        const { user } = get();
        if (!user) return null;

        const fileName = `${user.id}/${Date.now()}.jpg`;
        const { data, error } = await supabase.storage
          .from('meal-photos')
          .upload(fileName, decode(base64), {
            contentType: 'image/jpeg',
            upsert: true
          });

        if (error) {
          console.error('Error uploading image:', error);
          return null;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('meal-photos')
          .getPublicUrl(fileName);

        return publicUrl;
      },

      addMeal: async (meal) => {
        const { user } = get();
        if (!user) return;

        try {
          const { data, error } = await supabase
            .from('meals')
            .insert([
              {
                user_id: user.id,
                date: meal.date,
                food_name: meal.foodName,
                calories: meal.calories,
                protein: meal.protein,
                carbs: meal.carbs,
                fat: meal.fat,
                servings: meal.servings || 1,
                image_url: meal.imageUrl,
                meal_type: meal.mealType,
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
              servings: data.servings || 1,
              imageUrl: data.image_url,
              mealType: data.meal_type,
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

      fetchWater: async () => {
        const { user } = get();
        if (!user) return;

        try {
          const today = new Date().toISOString().split('T')[0];
          const { data, error } = await supabase
            .from('water_logs')
            .select('amount')
            .eq('user_id', user.id)
            .eq('date', today)
            .single();

          if (error && error.code !== 'PGRST116') {
            console.error('Error fetching water:', error);
          } else if (data) {
            set({ water: data.amount });
          } else {
            set({ water: 0 });
          }
        } catch (err) {
          console.error('Unexpected error fetching water:', err);
        }
      },

      addWater: async (amount) => {
        const { user, water } = get();
        const newAmount = water + amount;
        set({ water: newAmount }); // Optimistic update

        if (user) {
          try {
            const today = new Date().toISOString().split('T')[0];
            await supabase
              .from('water_logs')
              .upsert({ 
                user_id: user.id, 
                date: today, 
                amount: newAmount,
                updated_at: new Date().toISOString()
              }, { onConflict: 'user_id,date' });
          } catch (err) {
            console.error('Error saving water:', err);
          }
        }
      },

      resetWater: async () => {
        const { user } = get();
        set({ water: 0 }); // Optimistic update

        if (user) {
          try {
            const today = new Date().toISOString().split('T')[0];
            await supabase
              .from('water_logs')
              .upsert({ 
                user_id: user.id, 
                date: today, 
                amount: 0,
                updated_at: new Date().toISOString()
              }, { onConflict: 'user_id,date' });
          } catch (err) {
            console.error('Error resetting water:', err);
          }
        }
      },

      addMessage: (message) => {
        const newMessage: ChatMessage = {
          ...message,
          id: Math.random().toString(36).substring(7),
          timestamp: new Date().toISOString(),
        };
        set((state) => ({ messages: [...state.messages, newMessage] }));
      },

      setThemePreference: (theme) => {
        set({ themePreference: theme });
      },

      signOut: async () => {
        await supabase.auth.signOut();
        set({ user: null, session: null, profile: null, meals: [], messages: [], water: 0 });
      },
    }),
    {
      name: 'core-ai-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ 
        themePreference: state.themePreference,
        water: state.water,
        messages: state.messages
      }),
    }
  )
);
