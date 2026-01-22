-- Migration for Group Chat Media & Post Media

-- 1. Add columns to group_messages
alter table public.group_messages 
add column if not exists media_url text,
add column if not exists media_type text;

-- 2. Create post_media table
create table if not exists public.post_media (
  id uuid default uuid_generate_v4() primary key,
  post_id uuid references public.posts(id) on delete cascade not null,
  url text not null,
  type text not null, -- 'image' or 'video'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.post_media enable row level security;

drop policy if exists "Post media viewable by everyone" on public.post_media;
create policy "Post media viewable by everyone" on public.post_media for select using (true);

drop policy if exists "Users can add post media" on public.post_media;
create policy "Users can add post media" on public.post_media for insert with check (
  exists (select 1 from public.posts where id = post_id and user_id = auth.uid())
);

drop policy if exists "Users can delete own post media" on public.post_media;
create policy "Users can delete own post media" on public.post_media for delete using (
  exists (select 1 from public.posts where id = post_id and user_id = auth.uid())
);

-- 3. Storage Bucket: chat-media
insert into storage.buckets (id, name, public)
values ('chat-media', 'chat-media', true)
on conflict (id) do nothing;

-- Drop existing policies if any to avoid conflicts during manual run
drop policy if exists "Chat media is publicly accessible." on storage.objects;
drop policy if exists "Authenticated users can upload chat media." on storage.objects;

create policy "Chat media is publicly accessible." on storage.objects
  for select using (bucket_id = 'chat-media');

create policy "Authenticated users can upload chat media." on storage.objects
  for insert with check (bucket_id = 'chat-media' and auth.role() = 'authenticated');

-- 4. Add media_type to stories
alter table public.stories 
add column if not exists media_type text default 'image';
