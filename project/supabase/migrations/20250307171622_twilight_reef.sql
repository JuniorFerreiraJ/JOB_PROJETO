/*
  # Update Profiles and Clients Schema

  1. Updates
    - Add age and location fields to profiles
    - Update client management fields
    - Add recruitment fields
*/

-- Add new columns to profiles table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'age') THEN
    ALTER TABLE profiles ADD COLUMN age integer;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'residence_location') THEN
    ALTER TABLE profiles ADD COLUMN residence_location text;
  END IF;
END $$;