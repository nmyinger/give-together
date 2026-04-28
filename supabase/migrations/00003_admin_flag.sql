-- Add is_admin column to users
ALTER TABLE public.users ADD COLUMN is_admin boolean NOT NULL DEFAULT false;

-- Grant Nikolai admin access
UPDATE public.users SET is_admin = true WHERE id = '50f03e6f-73e9-4630-9f71-b678929384b7';
