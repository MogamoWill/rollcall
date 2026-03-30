alter table public.equipment_items add column if not exists attributes jsonb default '{}';
