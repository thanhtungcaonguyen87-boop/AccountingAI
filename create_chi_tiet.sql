-- Migration script to create table `chi_tiet`

-- Drop the table if it already exists to recreate it
DROP TABLE IF EXISTS public.chi_tiet CASCADE;

-- Create the table according to the implementation plan
CREATE TABLE public.chi_tiet (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ngay         DATE NOT NULL DEFAULT CURRENT_DATE,
  khach_hang   TEXT NOT NULL,
  san_pham     TEXT,
  dvt          TEXT,
  so_luong     NUMERIC,
  don_gia      NUMERIC,
  thanh_tien   NUMERIC GENERATED ALWAYS AS (so_luong * don_gia) STORED,
  ghi_chu      TEXT,
  id_thanh_toan TEXT,        -- NULL = chưa thanh toán
  nhap_lieu    TEXT,         -- raw user input
  user_id      UUID REFERENCES auth.users(id),
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.chi_tiet ENABLE ROW LEVEL SECURITY;

-- Create policies (User only sees their own data)
CREATE POLICY "Users can view their own chi_tiet records" ON public.chi_tiet
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own chi_tiet records" ON public.chi_tiet
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own chi_tiet records" ON public.chi_tiet
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own chi_tiet records" ON public.chi_tiet
  FOR DELETE USING (auth.uid() = user_id);
