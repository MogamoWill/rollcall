-- ============================================
-- RollCall - Initial Database Schema
-- ============================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================
-- EQUIPMENT
-- ============================================

create table equipment (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  universe text not null check (universe in ('camera', 'lens', 'lighting', 'audio', 'cable', 'power', 'grip', 'monitoring', 'storage', 'accessory')),
  brand text,
  model text,
  serial_number text,
  qr_code text unique,
  is_high_value boolean default false,
  notes text,
  image_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_equipment_user on equipment(user_id);
create index idx_equipment_universe on equipment(universe);

-- Equipment Kits
create table equipment_kits (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  description text,
  created_at timestamptz default now()
);

create table kit_items (
  id uuid primary key default uuid_generate_v4(),
  kit_id uuid references equipment_kits(id) on delete cascade not null,
  equipment_id uuid references equipment(id) on delete cascade not null,
  quantity integer default 1
);

-- ============================================
-- PROJECTS
-- ============================================

create table projects (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  client text,
  status text not null default 'draft' check (status in ('draft', 'pre_prod', 'production', 'post_prod', 'delivered', 'archived')),
  description text,
  shoot_date date,
  location text,
  kit_id uuid references equipment_kits(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_projects_user on projects(user_id);
create index idx_projects_status on projects(status);

-- ============================================
-- SHOT LIST
-- ============================================

create table shots (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid references projects(id) on delete cascade not null,
  description text not null,
  shot_type text not null default 'other' check (shot_type in ('wide', 'medium', 'close_up', 'detail', 'drone', 'tracking', 'static', 'other')),
  priority text not null default 'must_have' check (priority in ('must_have', 'nice_to_have', 'optional')),
  is_completed boolean default false,
  notes text,
  "order" integer default 0
);

create index idx_shots_project on shots(project_id);

-- ============================================
-- CHECKLISTS
-- ============================================

create table checklists (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  project_id uuid references projects(id) on delete cascade,
  name text not null,
  phase text not null check (phase in ('pre_prod', 'production', 'post_prod')),
  is_template boolean default false,
  created_at timestamptz default now()
);

create table checklist_items (
  id uuid primary key default uuid_generate_v4(),
  checklist_id uuid references checklists(id) on delete cascade not null,
  label text not null,
  is_checked boolean default false,
  "order" integer default 0
);

create index idx_checklists_project on checklists(project_id);
create index idx_checklist_items_checklist on checklist_items(checklist_id);

-- ============================================
-- KANBAN BOARDS
-- ============================================

create table boards (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  created_at timestamptz default now()
);

create table board_columns (
  id uuid primary key default uuid_generate_v4(),
  board_id uuid references boards(id) on delete cascade not null,
  name text not null,
  color text not null default '#94A3B8',
  "order" integer default 0
);

create table board_cards (
  id uuid primary key default uuid_generate_v4(),
  column_id uuid references board_columns(id) on delete cascade not null,
  project_id uuid references projects(id) on delete set null,
  title text not null,
  description text,
  due_date date,
  labels text[] default '{}',
  "order" integer default 0
);

create index idx_board_columns_board on board_columns(board_id);
create index idx_board_cards_column on board_cards(column_id);

-- ============================================
-- FIELD NOTES
-- ============================================

create table field_notes (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid references projects(id) on delete cascade not null,
  content text not null,
  type text not null default 'text' check (type in ('text', 'audio')),
  audio_url text,
  created_at timestamptz default now()
);

create index idx_field_notes_project on field_notes(project_id);

-- ============================================
-- USER SETTINGS (integrations)
-- ============================================

create table user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  monday_api_key text,
  microsoft_token text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

alter table equipment enable row level security;
alter table equipment_kits enable row level security;
alter table kit_items enable row level security;
alter table projects enable row level security;
alter table shots enable row level security;
alter table checklists enable row level security;
alter table checklist_items enable row level security;
alter table boards enable row level security;
alter table board_columns enable row level security;
alter table board_cards enable row level security;
alter table field_notes enable row level security;
alter table user_settings enable row level security;

-- Equipment policies
create policy "Users can view own equipment" on equipment for select using (auth.uid() = user_id);
create policy "Users can insert own equipment" on equipment for insert with check (auth.uid() = user_id);
create policy "Users can update own equipment" on equipment for update using (auth.uid() = user_id);
create policy "Users can delete own equipment" on equipment for delete using (auth.uid() = user_id);

-- Equipment kits policies
create policy "Users can view own kits" on equipment_kits for select using (auth.uid() = user_id);
create policy "Users can insert own kits" on equipment_kits for insert with check (auth.uid() = user_id);
create policy "Users can update own kits" on equipment_kits for update using (auth.uid() = user_id);
create policy "Users can delete own kits" on equipment_kits for delete using (auth.uid() = user_id);

-- Kit items policies (via kit ownership)
create policy "Users can view own kit items" on kit_items for select using (
  exists (select 1 from equipment_kits where id = kit_items.kit_id and user_id = auth.uid())
);
create policy "Users can insert own kit items" on kit_items for insert with check (
  exists (select 1 from equipment_kits where id = kit_items.kit_id and user_id = auth.uid())
);
create policy "Users can delete own kit items" on kit_items for delete using (
  exists (select 1 from equipment_kits where id = kit_items.kit_id and user_id = auth.uid())
);

-- Projects policies
create policy "Users can view own projects" on projects for select using (auth.uid() = user_id);
create policy "Users can insert own projects" on projects for insert with check (auth.uid() = user_id);
create policy "Users can update own projects" on projects for update using (auth.uid() = user_id);
create policy "Users can delete own projects" on projects for delete using (auth.uid() = user_id);

-- Shots policies (via project ownership)
create policy "Users can view own shots" on shots for select using (
  exists (select 1 from projects where id = shots.project_id and user_id = auth.uid())
);
create policy "Users can insert own shots" on shots for insert with check (
  exists (select 1 from projects where id = shots.project_id and user_id = auth.uid())
);
create policy "Users can update own shots" on shots for update using (
  exists (select 1 from projects where id = shots.project_id and user_id = auth.uid())
);
create policy "Users can delete own shots" on shots for delete using (
  exists (select 1 from projects where id = shots.project_id and user_id = auth.uid())
);

-- Checklists policies
create policy "Users can view own checklists" on checklists for select using (auth.uid() = user_id);
create policy "Users can insert own checklists" on checklists for insert with check (auth.uid() = user_id);
create policy "Users can update own checklists" on checklists for update using (auth.uid() = user_id);
create policy "Users can delete own checklists" on checklists for delete using (auth.uid() = user_id);

-- Checklist items policies (via checklist ownership)
create policy "Users can view own checklist items" on checklist_items for select using (
  exists (select 1 from checklists where id = checklist_items.checklist_id and user_id = auth.uid())
);
create policy "Users can insert own checklist items" on checklist_items for insert with check (
  exists (select 1 from checklists where id = checklist_items.checklist_id and user_id = auth.uid())
);
create policy "Users can update own checklist items" on checklist_items for update using (
  exists (select 1 from checklists where id = checklist_items.checklist_id and user_id = auth.uid())
);
create policy "Users can delete own checklist items" on checklist_items for delete using (
  exists (select 1 from checklists where id = checklist_items.checklist_id and user_id = auth.uid())
);

-- Boards policies
create policy "Users can view own boards" on boards for select using (auth.uid() = user_id);
create policy "Users can insert own boards" on boards for insert with check (auth.uid() = user_id);
create policy "Users can update own boards" on boards for update using (auth.uid() = user_id);
create policy "Users can delete own boards" on boards for delete using (auth.uid() = user_id);

-- Board columns policies (via board ownership)
create policy "Users can view own board columns" on board_columns for select using (
  exists (select 1 from boards where id = board_columns.board_id and user_id = auth.uid())
);
create policy "Users can insert own board columns" on board_columns for insert with check (
  exists (select 1 from boards where id = board_columns.board_id and user_id = auth.uid())
);
create policy "Users can update own board columns" on board_columns for update using (
  exists (select 1 from boards where id = board_columns.board_id and user_id = auth.uid())
);
create policy "Users can delete own board columns" on board_columns for delete using (
  exists (select 1 from boards where id = board_columns.board_id and user_id = auth.uid())
);

-- Board cards policies (via column → board ownership)
create policy "Users can view own board cards" on board_cards for select using (
  exists (
    select 1 from board_columns bc
    join boards b on b.id = bc.board_id
    where bc.id = board_cards.column_id and b.user_id = auth.uid()
  )
);
create policy "Users can insert own board cards" on board_cards for insert with check (
  exists (
    select 1 from board_columns bc
    join boards b on b.id = bc.board_id
    where bc.id = board_cards.column_id and b.user_id = auth.uid()
  )
);
create policy "Users can update own board cards" on board_cards for update using (
  exists (
    select 1 from board_columns bc
    join boards b on b.id = bc.board_id
    where bc.id = board_cards.column_id and b.user_id = auth.uid()
  )
);
create policy "Users can delete own board cards" on board_cards for delete using (
  exists (
    select 1 from board_columns bc
    join boards b on b.id = bc.board_id
    where bc.id = board_cards.column_id and b.user_id = auth.uid()
  )
);

-- Field notes policies (via project ownership)
create policy "Users can view own field notes" on field_notes for select using (
  exists (select 1 from projects where id = field_notes.project_id and user_id = auth.uid())
);
create policy "Users can insert own field notes" on field_notes for insert with check (
  exists (select 1 from projects where id = field_notes.project_id and user_id = auth.uid())
);
create policy "Users can delete own field notes" on field_notes for delete using (
  exists (select 1 from projects where id = field_notes.project_id and user_id = auth.uid())
);

-- User settings policies
create policy "Users can view own settings" on user_settings for select using (auth.uid() = user_id);
create policy "Users can upsert own settings" on user_settings for insert with check (auth.uid() = user_id);
create policy "Users can update own settings" on user_settings for update using (auth.uid() = user_id);

-- ============================================
-- DEFAULT CHECKLIST TEMPLATES (seed data via function)
-- ============================================

create or replace function create_default_checklists(p_user_id uuid)
returns void as $$
begin
  -- Pre-prod checklist
  insert into checklists (user_id, name, phase, is_template) values
    (p_user_id, 'Pré-production', 'pre_prod', true);

  insert into checklist_items (checklist_id, label, "order")
  select c.id, item.label, item.ord
  from checklists c,
  (values
    ('Brief client validé', 0),
    ('Repérage effectué', 1),
    ('Shot list créée', 2),
    ('Kit matériel sélectionné', 3),
    ('Batteries chargées', 4),
    ('Cartes mémoire formatées', 5),
    ('Autorisations de tournage', 6),
    ('Transport réservé', 7),
    ('Contact client confirmé', 8)
  ) as item(label, ord)
  where c.user_id = p_user_id and c.name = 'Pré-production' and c.is_template = true;

  -- Production checklist
  insert into checklists (user_id, name, phase, is_template) values
    (p_user_id, 'Jour de tournage', 'production', true);

  insert into checklist_items (checklist_id, label, "order")
  select c.id, item.label, item.ord
  from checklists c,
  (values
    ('Tout le matos est là', 0),
    ('Batteries de rechange', 1),
    ('Color checker / mire', 2),
    ('Balance des blancs', 3),
    ('Test audio', 4),
    ('Shot list imprimée / accessible', 5),
    ('Backup en cours de journée', 6),
    ('Rien oublié sur le lieu', 7)
  ) as item(label, ord)
  where c.user_id = p_user_id and c.name = 'Jour de tournage' and c.is_template = true;

  -- Post-prod checklist
  insert into checklists (user_id, name, phase, is_template) values
    (p_user_id, 'Post-production', 'post_prod', true);

  insert into checklist_items (checklist_id, label, "order")
  select c.id, item.label, item.ord
  from checklists c,
  (values
    ('Cartes déchargées et vérifiées', 0),
    ('Double backup effectué', 1),
    ('Fichiers renommés et organisés', 2),
    ('Dérushage terminé', 3),
    ('Montage', 4),
    ('Étalonnage', 5),
    ('Sound design / mixage', 6),
    ('Export final', 7),
    ('Livraison client', 8),
    ('Archivage projet', 9)
  ) as item(label, ord)
  where c.user_id = p_user_id and c.name = 'Post-production' and c.is_template = true;
end;
$$ language plpgsql;
