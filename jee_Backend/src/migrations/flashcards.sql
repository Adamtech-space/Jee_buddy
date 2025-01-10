-- Create flashcards table
create table if not exists public.flashcards (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid not null,
  subject text not null,
  topic text not null,
  content text not null,
  source text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Add RLS (Row Level Security) policies
alter table public.flashcards enable row level security;

-- Create policy to allow users to see only their own flashcards
create policy "Users can view their own flashcards"
  on public.flashcards for select
  using (auth.uid() = user_id);

-- Create policy to allow users to insert their own flashcards
create policy "Users can create their own flashcards"
  on public.flashcards for insert
  with check (auth.uid() = user_id);

-- Create policy to allow users to update their own flashcards
create policy "Users can update their own flashcards"
  on public.flashcards for update
  using (auth.uid() = user_id);

-- Create policy to allow users to delete their own flashcards
create policy "Users can delete their own flashcards"
  on public.flashcards for delete
  using (auth.uid() = user_id);

-- Create indexes for better performance
create index if not exists flashcards_user_id_idx on public.flashcards(user_id);
create index if not exists flashcards_subject_idx on public.flashcards(subject);
create index if not exists flashcards_topic_idx on public.flashcards(topic); 