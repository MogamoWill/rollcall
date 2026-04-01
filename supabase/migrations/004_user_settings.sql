-- User settings for integrations (Monday.com, Microsoft)
create table if not exists public.user_settings (
  user_id uuid references public.profiles(id) on delete cascade primary key,
  monday_api_key text,
  microsoft_token text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.user_settings enable row level security;
create policy "Users can manage own settings" on public.user_settings for all using (auth.uid() = user_id);
