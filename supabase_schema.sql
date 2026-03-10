-- Exécutez ce code dans l'éditeur SQL de votre projet Supabase (SQL Editor)

-- 1. Création de la table des repas (meals)
CREATE TABLE public.meals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  food_name TEXT NOT NULL,
  calories INTEGER NOT NULL,
  protein INTEGER NOT NULL,
  carbs INTEGER NOT NULL,
  fat INTEGER NOT NULL,
  image_url TEXT
);

-- 2. Activer la sécurité au niveau des lignes (Row Level Security - RLS)
ALTER TABLE public.meals ENABLE ROW LEVEL SECURITY;

-- 3. Création des politiques d'accès (Policies)
-- Pour simplifier le développement initial, nous autorisons l'accès anonyme.
-- En production, vous devriez restreindre cela aux utilisateurs authentifiés (auth.uid() = user_id).

CREATE POLICY "Enable read access for all users" 
ON public.meals FOR SELECT 
USING (true);

CREATE POLICY "Enable insert for all users" 
ON public.meals FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Enable delete for all users" 
ON public.meals FOR DELETE 
USING (true);

CREATE POLICY "Enable update for all users" 
ON public.meals FOR UPDATE 
USING (true);
