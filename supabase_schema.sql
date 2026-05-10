-- Nettoyage complet (Optionnel : à n'utiliser que pour une réinitialisation totale)
-- DROP TABLE IF EXISTS public.meals CASCADE;
-- DROP TABLE IF EXISTS public.water_logs CASCADE;
-- DROP TABLE IF EXISTS public.profiles CASCADE;

-- 1. Création de la table des profils (profiles)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  goal TEXT DEFAULT 'health',
  gender TEXT DEFAULT 'other',
  age INTEGER DEFAULT 0,
  birth_date DATE,
  weight NUMERIC DEFAULT 0,
  height NUMERIC DEFAULT 0,
  activity_level TEXT DEFAULT 'moderate',
  daily_calories_goal INTEGER DEFAULT 2000,
  protein_goal INTEGER DEFAULT 150,
  carbs_goal INTEGER DEFAULT 200,
  fat_goal INTEGER DEFAULT 65,
  water_goal INTEGER DEFAULT 2500,
  onboarding_completed BOOLEAN DEFAULT false,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Création de la table des repas (meals)
CREATE TABLE IF NOT EXISTS public.meals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  food_name TEXT NOT NULL,
  calories INTEGER NOT NULL,
  protein INTEGER NOT NULL,
  carbs INTEGER NOT NULL,
  fat INTEGER NOT NULL,
  servings INTEGER DEFAULT 1,
  image_url TEXT,
  meal_type TEXT
);

-- 3. Création de la table d'hydratation (water_logs)
CREATE TABLE IF NOT EXISTS public.water_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  amount INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, date)
);

-- 4. Activer la sécurité au niveau des lignes (Row Level Security - RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.water_logs ENABLE ROW LEVEL SECURITY;

-- 5. Création des politiques d'accès (Policies)
-- On utilise DROP POLICY IF EXISTS pour éviter les erreurs si elles existent déjà

-- Profiles policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Meals policies
DROP POLICY IF EXISTS "Users can view own meals" ON public.meals;
CREATE POLICY "Users can view own meals" ON public.meals FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own meals" ON public.meals;
CREATE POLICY "Users can insert own meals" ON public.meals FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own meals" ON public.meals;
CREATE POLICY "Users can update own meals" ON public.meals FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own meals" ON public.meals;
CREATE POLICY "Users can delete own meals" ON public.meals FOR DELETE USING (auth.uid() = user_id);

-- Water logs policies
DROP POLICY IF EXISTS "Users can view own water logs" ON public.water_logs;
CREATE POLICY "Users can view own water logs" ON public.water_logs FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own water logs" ON public.water_logs;
CREATE POLICY "Users can insert own water logs" ON public.water_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own water logs" ON public.water_logs;
CREATE POLICY "Users can update own water logs" ON public.water_logs FOR UPDATE USING (auth.uid() = user_id);

-- 6. Création du bucket de stockage pour les photos de repas
INSERT INTO storage.buckets (id, name, public) 
VALUES ('meal-photos', 'meal-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
DROP POLICY IF EXISTS "Anyone can view meal photos" ON storage.objects;
CREATE POLICY "Anyone can view meal photos" ON storage.objects FOR SELECT USING (bucket_id = 'meal-photos');

DROP POLICY IF EXISTS "Authenticated users can upload meal photos" ON storage.objects;
CREATE POLICY "Authenticated users can upload meal photos" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'meal-photos' AND 
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Users can update own meal photos" ON storage.objects;
CREATE POLICY "Users can update own meal photos" ON storage.objects FOR UPDATE USING (
  bucket_id = 'meal-photos' AND 
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Users can delete own meal photos" ON storage.objects;
CREATE POLICY "Users can delete own meal photos" ON storage.objects FOR DELETE USING (
  bucket_id = 'meal-photos' AND 
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
