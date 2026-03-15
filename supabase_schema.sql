-- Exécutez ce code dans l'éditeur SQL de votre projet Supabase (SQL Editor)

-- 1. Création de la table des profils (profiles)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  goal TEXT DEFAULT 'health',
  gender TEXT DEFAULT 'other',
  age INTEGER DEFAULT 0,
  weight NUMERIC DEFAULT 0,
  height NUMERIC DEFAULT 0,
  activity_level TEXT DEFAULT 'moderate',
  daily_calories_goal INTEGER DEFAULT 2000,
  protein_goal INTEGER DEFAULT 150,
  carbs_goal INTEGER DEFAULT 200,
  fat_goal INTEGER DEFAULT 65,
  onboarding_completed BOOLEAN DEFAULT false,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Création de la table des repas (meals)
CREATE TABLE public.meals (
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
  image_url TEXT
);

-- 3. Création de la table d'hydratation (water_logs)
CREATE TABLE public.water_logs (
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

-- 5. Création des politiques d'accès (Policies) strictes basées sur l'utilisateur

-- Profiles policies
CREATE POLICY "Users can view own profile" 
ON public.profiles FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id);

-- Meals policies
CREATE POLICY "Users can view own meals" 
ON public.meals FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own meals" 
ON public.meals FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own meals" 
ON public.meals FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own meals" 
ON public.meals FOR DELETE 
USING (auth.uid() = user_id);

-- Water logs policies
CREATE POLICY "Users can view own water logs" 
ON public.water_logs FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own water logs" 
ON public.water_logs FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own water logs" 
ON public.water_logs FOR UPDATE 
USING (auth.uid() = user_id);

-- 6. Création du bucket de stockage pour les photos de repas
INSERT INTO storage.buckets (id, name, public) 
VALUES ('meal-photos', 'meal-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Anyone can view meal photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'meal-photos');

CREATE POLICY "Authenticated users can upload meal photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'meal-photos' AND 
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update own meal photos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'meal-photos' AND 
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete own meal photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'meal-photos' AND 
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
