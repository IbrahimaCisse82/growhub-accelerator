/*
  # Create app_role enum type
  
  1. New Types
    - `app_role` ENUM with roles: super_admin, coordinator, mentor, entrepreneur
  
  2. Purpose
    - Define user roles for the application's role-based access control
*/

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM ('super_admin', 'coordinator', 'mentor', 'entrepreneur');
  END IF;
END $$;
