/*
  # Update profiles table RLS policies

  1. Changes
    - Add policy to allow authenticated users to create their own profile
    - Add policy to allow authenticated users to update their own profile
    - Keep existing policy for viewing profiles

  2. Security
    - Maintains RLS on profiles table
    - Ensures users can only create/update their own profile
    - Preserves public read access for all profiles
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Create new policies
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