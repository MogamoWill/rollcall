-- ============================================
-- Fix 1: Boards table (boardStore needs it)
-- ============================================
create table public.boards (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  created_at timestamptz default now()
);

alter table public.boards enable row level security;
create policy "Users can manage own boards" on public.boards for all using (auth.uid() = user_id);

-- Add board_id to board_columns (was missing parent ref)
alter table public.board_columns add column if not exists board_id uuid references public.boards(id) on delete cascade;

-- ============================================
-- Fix 2: Add universe column to equipment_items
-- (app uses universe directly, not category_id)
-- ============================================
alter table public.equipment_items
  add column if not exists universe text not null default 'accessory',
  alter column category_id drop not null;

-- ============================================
-- Fix 3: RLS for boards/columns/cards
-- ============================================
drop policy if exists "Users can manage own columns" on public.board_columns;
create policy "Users can manage own columns" on public.board_columns
  for all using (
    board_id in (select id from public.boards where user_id = auth.uid())
    or user_id = auth.uid()
  );
