-- Profiles (extends Supabase auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Equipment categories (univers)
create table public.equipment_categories (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null, -- "Objectifs", "Boîtiers", "Câbles", "Multiprises", "Color Checker", etc.
  icon text,
  sort_order int default 0,
  created_at timestamptz default now()
);

-- Equipment items
create table public.equipment_items (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  category_id uuid references public.equipment_categories(id) on delete cascade not null,
  name text not null,
  brand text,
  model text,
  serial_number text,
  qr_code text, -- only for high-value items
  is_high_value boolean default false,
  notes text,
  condition text default 'good', -- good, fair, needs_repair
  image_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Projects
create table public.projects (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  client text,
  description text,
  status text default 'planning', -- planning, pre_prod, shooting, post_prod, delivered, archived
  start_date date,
  end_date date,
  location text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Shot list
create table public.shots (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,
  number int,
  description text not null,
  shot_type text, -- wide, medium, close_up, detail, drone, etc.
  priority text default 'normal', -- must_have, normal, nice_to_have
  is_completed boolean default false,
  notes text,
  sort_order int default 0,
  created_at timestamptz default now()
);

-- Equipment kits (template checklists)
create table public.equipment_kits (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null, -- "Kit Interview", "Kit Drone", "Kit Studio"
  description text,
  created_at timestamptz default now()
);

-- Kit items (many-to-many: kits <-> equipment)
create table public.kit_items (
  id uuid default gen_random_uuid() primary key,
  kit_id uuid references public.equipment_kits(id) on delete cascade not null,
  item_id uuid references public.equipment_items(id) on delete cascade not null,
  quantity int default 1,
  unique(kit_id, item_id)
);

-- Project checklists (pre/during/post)
create table public.project_checklists (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,
  phase text not null, -- pre_prod, production, post_prod
  title text not null,
  is_completed boolean default false,
  sort_order int default 0,
  created_at timestamptz default now()
);

-- Board columns (Monday-like Kanban)
create table public.board_columns (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  project_id uuid references public.projects(id) on delete cascade,
  name text not null,
  color text default '#1a6bff',
  sort_order int default 0,
  created_at timestamptz default now()
);

-- Board cards
create table public.board_cards (
  id uuid default gen_random_uuid() primary key,
  column_id uuid references public.board_columns(id) on delete cascade not null,
  title text not null,
  description text,
  due_date date,
  priority text default 'normal',
  labels text[], -- array of label strings
  sort_order int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Field notes (jour J)
create table public.field_notes (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,
  content text not null,
  type text default 'text', -- text, audio, photo
  media_url text,
  created_at timestamptz default now()
);

-- RLS policies
alter table public.profiles enable row level security;
alter table public.equipment_categories enable row level security;
alter table public.equipment_items enable row level security;
alter table public.projects enable row level security;
alter table public.shots enable row level security;
alter table public.equipment_kits enable row level security;
alter table public.kit_items enable row level security;
alter table public.project_checklists enable row level security;
alter table public.board_columns enable row level security;
alter table public.board_cards enable row level security;
alter table public.field_notes enable row level security;

-- RLS: Users can only access their own data
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);

create policy "Users can manage own categories" on public.equipment_categories for all using (auth.uid() = user_id);
create policy "Users can manage own items" on public.equipment_items for all using (auth.uid() = user_id);
create policy "Users can manage own projects" on public.projects for all using (auth.uid() = user_id);
create policy "Users can manage own shots" on public.shots for all using (project_id in (select id from public.projects where user_id = auth.uid()));
create policy "Users can manage own kits" on public.equipment_kits for all using (auth.uid() = user_id);
create policy "Users can manage kit items" on public.kit_items for all using (kit_id in (select id from public.equipment_kits where user_id = auth.uid()));
create policy "Users can manage own checklists" on public.project_checklists for all using (project_id in (select id from public.projects where user_id = auth.uid()));
create policy "Users can manage own columns" on public.board_columns for all using (auth.uid() = user_id);
create policy "Users can manage own cards" on public.board_cards for all using (column_id in (select id from public.board_columns where user_id = auth.uid()));
create policy "Users can manage own notes" on public.field_notes for all using (project_id in (select id from public.projects where user_id = auth.uid()));

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
