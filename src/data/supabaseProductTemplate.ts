/**
 * ============================================================================
 * GIRIRAJ POWER - SUPABASE UNIVERSAL PRODUCT TEMPLATE & SCHEMA GUIDE
 * ============================================================================
 * 
 * You can add, edit, or delete any product directly inside your Supabase Dashboard
 * (Table Editor -> `products` table) or via Supabase SQL Editor.
 * 
 * The app supports BOTH snake_case (standard PostgreSQL) and camelCase columns
 * and gracefully provides defaults for any optional fields.
 */

export interface SupabaseProductTemplate {
  // 1. PRIMARY IDENTIFIER
  id: string; // Unique string/UUID (e.g. 'p101', 'wire_polycab_1sqmm', or UUID)

  // 2. MAIN DETAILS
  name: string; // Product title (e.g. 'Havells Life Line Plus S3 1.5 Sqmm Wire (90m)')
  brand: string; // Brand name (e.g. 'Polycab', 'Havells', 'RR Kabel', 'Anchor', 'UltraTech')
  category: 'electrical' | 'construction' | 'hardware' | 'wiring' | string; // Category key (lowercase recommended)
  subcategory?: string; // Subcategory (e.g. 'Wire', 'Switches', 'MCB', 'Fans', 'Pipes', 'Cement')

  // 3. PRICING & INVENTORY
  price: number; // Selling price in INR (e.g. 1850)
  mrp?: number; // Maximum Retail Price in INR (e.g. 2100) (or original_price)
  discount_percent?: number; // Discount % (e.g. 12) - auto calculated if mrp > price
  unit?: string; // Unit string (e.g. '1 Coil', '1 pc', '50 kg Bag', 'Box of 10')
  stock_quantity?: number; // Available inventory count (default: 50)
  in_stock?: boolean; // In stock flag (default: true)

  // 4. VISUALS & RATINGS
  image_urls?: string[]; // Array of image URLs or single string in `image` column
  rating_avg?: number; // Average user rating 1.0 - 5.0 (default: 4.8)
  rating_count?: number; // Number of reviews (default: 35)
  delivery_minutes?: number; // Express dispatch time in minutes (default: 30 or 60)

  // 5. RICH METADATA & SPECIFICATIONS
  description?: string; // Product marketing / technical description
  specifications?: Record<string, any>; // Nested JSON object or key-value dictionary
  tags?: string[]; // Search keyword tags (e.g. ['wire', 'copper', 'frls', 'havells'])
  is_emergency?: boolean; // Fast emergency repair item flag
  is_best_seller?: boolean; // Featured best-seller flag
}

/**
 * COMPLETE SUPABASE TABLE CREATION & ALTER SCRIPT (Run this in SQL Editor)
 */
export const SUPABASE_SETUP_SQL = `
-- 1. Ensure the products table has all columns required
CREATE TABLE IF NOT EXISTS public.products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  brand TEXT NOT NULL,
  category TEXT DEFAULT 'electrical',
  subcategory TEXT DEFAULT 'General',
  price NUMERIC NOT NULL,
  mrp NUMERIC,
  discount_percent NUMERIC DEFAULT 0,
  unit TEXT DEFAULT '1 pc',
  stock_quantity INTEGER DEFAULT 100,
  in_stock BOOLEAN DEFAULT true,
  image_urls TEXT[] DEFAULT ARRAY[]::TEXT[],
  rating_avg NUMERIC DEFAULT 4.8,
  rating_count INTEGER DEFAULT 50,
  delivery_minutes INTEGER DEFAULT 30,
  description TEXT,
  specifications JSONB DEFAULT '{}'::jsonb,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  is_emergency BOOLEAN DEFAULT false,
  is_best_seller BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. In case the table already existed with missing columns, safely add them:
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS delivery_minutes INTEGER DEFAULT 30;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS rating_avg NUMERIC DEFAULT 4.8;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS rating_count INTEGER DEFAULT 50;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS mrp NUMERIC;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS discount_percent NUMERIC DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS unit TEXT DEFAULT '1 pc';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS stock_quantity INTEGER DEFAULT 100;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS in_stock BOOLEAN DEFAULT true;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS image_urls TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS specifications JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_emergency BOOLEAN DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_best_seller BOOLEAN DEFAULT false;

-- 3. Enable RLS and public read policy
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'products' AND policyname = 'Allow public read access'
  ) THEN
    CREATE POLICY "Allow public read access" ON public.products FOR SELECT USING (true);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'products' AND policyname = 'Allow service_role full access'
  ) THEN
    CREATE POLICY "Allow service_role full access" ON public.products FOR ALL USING (true);
  END IF;
END $$;
`;

/**
 * SAMPLE SQL INSERT STATEMENTS FOR DIRECT SUPABASE USE
 */
export const SAMPLE_SUPABASE_SQL_TEMPLATE = `
-- Step 1: Run table alterations to ensure all columns exist
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS delivery_minutes INTEGER DEFAULT 30;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS rating_avg NUMERIC DEFAULT 4.8;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS rating_count INTEGER DEFAULT 50;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS mrp NUMERIC;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS discount_percent NUMERIC DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS unit TEXT DEFAULT '1 pc';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS stock_quantity INTEGER DEFAULT 100;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS in_stock BOOLEAN DEFAULT true;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS image_urls TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS specifications JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Step 2: Insert product catalog
INSERT INTO products (
  id,
  name,
  brand,
  category,
  subcategory,
  price,
  mrp,
  discount_percent,
  unit,
  stock_quantity,
  image_urls,
  rating_avg,
  rating_count,
  delivery_minutes,
  description
) VALUES (
  'p1',
  'RR Kabel Wire FR LS 0.75 Sqmm, 200 MTR',
  'RR Kabel',
  'electrical',
  'Wire',
  3065,
  3200,
  4,
  '1 Coil',
  50,
  ARRAY['https://images.unsplash.com/photo-1558223616-e5d79faebdd6?q=80&w=800&auto=format&fit=crop'],
  4.8,
  124,
  30,
  'High conductivity electrolytic copper wire with flame retardant low smoke insulation.'
) ON CONFLICT (id) DO UPDATE SET
  price = EXCLUDED.price,
  stock_quantity = EXCLUDED.stock_quantity;
`;

