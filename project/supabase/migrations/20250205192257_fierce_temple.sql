/*
  # Fix authentication schema and policies

  1. Changes
    - Ensure auth schema is properly configured
    - Add missing auth schema extensions
    - Update auth policies
*/

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Ensure auth schema exists
CREATE SCHEMA IF NOT EXISTS auth;

-- Update auth policies
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public users are viewable by everyone."
    ON auth.users FOR SELECT
    USING (true);

CREATE POLICY "Users can insert their own user data."
    ON auth.users FOR INSERT
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own user data."
    ON auth.users FOR UPDATE
    USING (auth.uid() = id);

-- Ensure profiles table has proper foreign key constraint
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_id_fkey,
  ADD CONSTRAINT profiles_id_fkey
    FOREIGN KEY (id)
    REFERENCES auth.users(id)
    ON DELETE CASCADE;

-- Update profiles policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);