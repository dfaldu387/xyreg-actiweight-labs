-- CRITICAL SECURITY FIX: Enable RLS on variant tables that already have policies
-- This prevents cross-company data leaks by activating existing security policies

-- Enable RLS on product variation dimensions table
ALTER TABLE product_variation_dimensions ENABLE ROW LEVEL SECURITY;

-- Enable RLS on product variation options table  
ALTER TABLE product_variation_options ENABLE ROW LEVEL SECURITY;