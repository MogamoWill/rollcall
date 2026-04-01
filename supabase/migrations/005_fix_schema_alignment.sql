-- Fix 1: Add shoot_date to projects (app uses shoot_date, DB only has start_date)
alter table public.projects add column if not exists shoot_date date;

-- Fix 2: Change default status from 'planning' to 'draft' (matches app types)
alter table public.projects alter column status set default 'draft';
