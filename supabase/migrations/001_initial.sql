-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Entries table: raw captures throughout the day
create table entries (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  content text,
  photo_url text,
  moods text[] default '{}',
  entry_type text default 'text' check (entry_type in ('text', 'voice', 'photo')),
  created_at timestamptz default now()
);

-- Summaries table: weekly, monthly, yearly
create table summaries (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  period_type text not null check (period_type in ('weekly', 'monthly', 'yearly')),
  period_start date not null,
  period_end date not null,
  ai_narrative text,
  mood_counts jsonb default '{}',
  highlights jsonb default '[]',
  accomplishments jsonb default '[]',
  highs jsonb default '[]',
  lows jsonb default '[]',
  trips jsonb default '[]',
  entry_count int default 0,
  days_captured int default 0,
  user_note text,
  generated_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Row level security
alter table entries enable row level security;
alter table summaries enable row level security;

-- Only the owner can see their own data
create policy "Users see own entries" on entries
  for all using (auth.uid() = user_id);

create policy "Users see own summaries" on summaries
  for all using (auth.uid() = user_id);

-- Storage bucket for photos (run this in Supabase dashboard)
-- insert into storage.buckets (id, name, public) values ('photos', 'photos', false);

-- Storage policy: users can only access their own folder
-- create policy "Users access own photos" on storage.objects
--   for all using (auth.uid()::text = (storage.foldername(name))[1]);
