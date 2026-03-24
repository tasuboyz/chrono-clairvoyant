-- Create watches table
CREATE TABLE public.watches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  reference TEXT,
  description TEXT,
  movement TEXT,
  case_size TEXT,
  case_material TEXT,
  crystal TEXT,
  water_resistance TEXT,
  bracelet TEXT,
  dial_color TEXT,
  complications TEXT[],
  price_range_min NUMERIC,
  price_range_max NUMERIC,
  image_url TEXT,
  official_url TEXT,
  chrono24_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create identifications log table
CREATE TABLE public.identifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  input_type TEXT NOT NULL CHECK (input_type IN ('image', 'text')),
  input_text TEXT,
  input_image_url TEXT,
  result_brand TEXT,
  result_model TEXT,
  result_reference TEXT,
  confidence NUMERIC,
  full_result JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.watches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.identifications ENABLE ROW LEVEL SECURITY;

-- Public read access for watches
CREATE POLICY "Anyone can read watches" ON public.watches FOR SELECT USING (true);

-- Allow inserts for watches
CREATE POLICY "Service can insert watches" ON public.watches FOR INSERT WITH CHECK (true);

-- Allow inserts for identifications
CREATE POLICY "Anyone can insert identifications" ON public.identifications FOR INSERT WITH CHECK (true);

-- Public read for identifications
CREATE POLICY "Anyone can read identifications" ON public.identifications FOR SELECT USING (true);