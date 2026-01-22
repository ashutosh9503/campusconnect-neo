-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- --- CLEANUP & RESET ---
-- Run this block to effectively reset policies and triggers to a clean state
do $$
declare
  pol record;
begin
  -- Drop all policies in public schema to avoid "already exists" errors
  for pol in select tablename, policyname from pg_policies where schemaname = 'public' loop
    execute format('drop policy if exists %I on public.%I', pol.policyname, pol.tablename);
  end loop;

  -- Drop known triggers if they exist
  drop trigger if exists on_profiles_updated on public.profiles;
  drop trigger if exists on_auth_user_created on auth.users;
end $$;

-- --- SCHEMA UPDATES (ROBUST) ---
-- Ensure columns exist even if table was already created
do $$
begin
  -- PROFILES columns
  alter table public.profiles add column if not exists full_name text;
  alter table public.profiles add column if not exists stream text;
  alter table public.profiles add column if not exists year text;
  alter table public.profiles add column if not exists bio text;
  alter table public.profiles add column if not exists avatar_url text;
end $$;

-- --- STORAGE SETUP ---
-- Create buckets if not exists
insert into storage.buckets (id, name, public)
values 
  ('avatars', 'avatars', true),
  ('posts-media', 'posts-media', true)
on conflict (id) do nothing;

-- Storage Policies (Drop first to avoid conflicts)
drop policy if exists "Avatar images are publicly accessible." on storage.objects;
drop policy if exists "Anyone can upload an avatar." on storage.objects;
drop policy if exists "Authenticated users can update their own avatar." on storage.objects;

-- Avatars Policies
create policy "Avatar images are publicly accessible." on storage.objects
  for select using (bucket_id = 'avatars');

create policy "Anyone can upload an avatar." on storage.objects
  for insert with check (bucket_id = 'avatars' and auth.role() = 'authenticated');

create policy "Authenticated users can update their own avatar." on storage.objects
  for update using (bucket_id = 'avatars' and auth.uid() = owner);

-- Posts Media Policies
drop policy if exists "Post media is publicly accessible." on storage.objects;
drop policy if exists "Authenticated users can upload post media." on storage.objects;
drop policy if exists "Users can update their own post media." on storage.objects;

create policy "Post media is publicly accessible." on storage.objects
  for select using (bucket_id = 'posts-media');

create policy "Authenticated users can upload post media." on storage.objects
  for insert with check (bucket_id = 'posts-media' and auth.role() = 'authenticated');

create policy "Users can update their own post media." on storage.objects
  for update using (bucket_id = 'posts-media' and auth.uid() = owner);


-- --- FUNCTIONS & TRIGGERS SETUP ---

-- 1. UPDATED_AT Trigger Function
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- 2. NEW USER HANDLER Trigger Function (SECURITY DEFINER)
create or replace function public.handle_new_user()
returns trigger
security definer set search_path = public
as $$
declare
  username_val text;
begin
  -- Determine username with fallbacks
  username_val := coalesce(
    new.raw_user_meta_data->>'username',
    split_part(new.email, '@', 1)
  );
  
  insert into public.profiles (id, username, full_name, avatar_url)
  values (
    new.id,
    username_val,
    coalesce(new.raw_user_meta_data->>'full_name', username_val),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do update set
    username = excluded.username,
    full_name = excluded.full_name,
    avatar_url = excluded.avatar_url;
    
  return new;
exception
  when others then
    -- Log error safely
    raise warning 'Error in handle_new_user: %', SQLERRM;
    return new; 
end;
$$ language plpgsql;

-- 3. CHAT MEMBERSHIP CHECK (SECURITY DEFINER to avoid recursion)
create or replace function public.is_member_of(_conversation_id uuid)
returns boolean
security definer set search_path = public
as $$
begin
  return exists (
    select 1 from public.conversation_members
    where conversation_id = _conversation_id
    and user_id = auth.uid()
  );
end;
$$ language plpgsql;


-- --- TABLES ---

-- PROFILES
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  full_name text,
  avatar_url text,
  bio text,
  course text,
  year text,
  stream text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Re-attach Triggers
drop trigger if exists on_profiles_updated on public.profiles;
create trigger on_profiles_updated
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- POSTS
create table if not exists public.posts (
  id uuid default uuid_generate_v4() primary key,
  content text,
  image_url text, -- legacy support
  media_url text,
  media_type text,
  user_id uuid references public.profiles(id) on delete cascade not null,
  likes_count integer default 0,
  comments_count integer default 0,
  reactions_count jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- NOTICES
create table if not exists public.notices (
  id uuid default uuid_generate_v4() primary key,
  type text check (type in ('urgent', 'event', 'academic', 'general')),
  title text not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- COMMENTS
create table if not exists public.comments (
  id uuid default uuid_generate_v4() primary key,
  post_id uuid references public.posts(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- LIKES
create table if not exists public.likes (
  id uuid default uuid_generate_v4() primary key,
  post_id uuid references public.posts(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(post_id, user_id)
);

-- REACTIONS
create table if not exists public.reactions (
  id uuid default uuid_generate_v4() primary key,
  post_id uuid references public.posts(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  reaction_type text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(post_id, user_id)
);

-- SAVED POSTS
create table if not exists public.saved_posts (
  id uuid default uuid_generate_v4() primary key,
  post_id uuid references public.posts(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(post_id, user_id)
);

-- GROUPS
create table if not exists public.groups (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  description text,
  avatar_url text,
  is_private boolean default false,
  created_by uuid references public.profiles(id) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- GROUP MEMBERS
create table if not exists public.group_members (
  id uuid default uuid_generate_v4() primary key,
  group_id uuid references public.groups(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  role text default 'member' check (role in ('admin', 'moderator', 'member')),
  joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(group_id, user_id)
);

-- GROUP MESSAGES
create table if not exists public.group_messages (
  id uuid default uuid_generate_v4() primary key,
  group_id uuid references public.groups(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete set null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  media_url text,
  media_type text
);

-- EVENTS
create table if not exists public.events (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  description text,
  event_date timestamp with time zone not null,
  event_time time,
  location text,
  image_url text,
  type text,
  created_by uuid references public.profiles(id) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- EVENT REGISTRATIONS
create table if not exists public.event_registrations (
  id uuid default uuid_generate_v4() primary key,
  event_id uuid references public.events(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  registered_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(event_id, user_id)
);

-- FOLLOWS
create table if not exists public.follows (
  id uuid default uuid_generate_v4() primary key,
  follower_id uuid references public.profiles(id) on delete cascade not null,
  following_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(follower_id, following_id)
);

-- CHAT
create table if not exists public.conversations (
  id uuid default uuid_generate_v4() primary key,
  is_group boolean default false,
  name text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.conversation_members (
  id uuid default uuid_generate_v4() primary key,
  conversation_id uuid references public.conversations(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(conversation_id, user_id)
);

create table if not exists public.messages (
  id uuid default uuid_generate_v4() primary key,
  conversation_id uuid references public.conversations(id) on delete cascade not null,
  sender_id uuid references public.profiles(id) on delete set null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  read_at timestamp with time zone
);

create table if not exists public.notifications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  actor_id uuid references public.profiles(id) on delete cascade,
  type text not null,
  post_id uuid references public.posts(id) on delete cascade,
  is_read boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- INDEXES
create index if not exists idx_profiles_username on public.profiles(username);
create index if not exists idx_messages_conversation_id on public.messages(conversation_id);
create index if not exists idx_conversation_members_user on public.conversation_members(user_id);
create index if not exists idx_posts_user_id on public.posts(user_id);
create index if not exists idx_notifications_user_id on public.notifications(user_id);


-- --- RLS POLICIES ---

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.notices enable row level security;
alter table public.comments enable row level security;
alter table public.likes enable row level security;
alter table public.reactions enable row level security;
alter table public.saved_posts enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.group_messages enable row level security;
alter table public.events enable row level security;
alter table public.event_registrations enable row level security;
alter table public.follows enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_members enable row level security;
alter table public.messages enable row level security;
alter table public.notifications enable row level security;

-- PROFILES
create policy "Public profiles are viewable by everyone" on public.profiles for select using (true);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- POSTS
create policy "Posts viewable by everyone" on public.posts for select using (true);
create policy "Users can create posts" on public.posts for insert with check (auth.uid() = user_id);
create policy "Users can update own posts" on public.posts for update using (auth.uid() = user_id);
create policy "Users can delete own posts" on public.posts for delete using (auth.uid() = user_id);

-- NOTICES
create policy "Notices viewable by everyone" on public.notices for select using (true);
create policy "Only admins can manage notices" on public.notices for all using (false); -- Placeholder for admin logic

-- COMMENTS
create policy "Comments viewable by everyone" on public.comments for select using (true);
create policy "Users can create comments" on public.comments for insert with check (auth.uid() = user_id);
create policy "Users can delete own comments" on public.comments for delete using (auth.uid() = user_id);

-- LIKES/REACTIONS
create policy "Likes viewable by everyone" on public.likes for select using (true);
create policy "Users can toggle likes" on public.likes for all using (auth.uid() = user_id);
create policy "Reactions viewable by everyone" on public.reactions for select using (true);
create policy "Users can toggle reactions" on public.reactions for all using (auth.uid() = user_id);

-- SAVED POSTS
create policy "Users can view own saved posts" on public.saved_posts for select using (auth.uid() = user_id);
create policy "Users can save posts" on public.saved_posts for insert with check (auth.uid() = user_id);
create policy "Users can unsave posts" on public.saved_posts for delete using (auth.uid() = user_id);

-- GROUPS
create policy "Groups viewable by everyone" on public.groups for select using (true);
create policy "Authenticated users can create groups" on public.groups for insert with check (auth.role() = 'authenticated');
create policy "Creators can update groups" on public.groups for update using (auth.uid() = created_by);

-- GROUP MEMBERS
create policy "Group members viewable by everyone" on public.group_members for select using (true);
create policy "Users can join groups" on public.group_members for insert with check (auth.uid() = user_id);
create policy "Users can leave groups" on public.group_members for delete using (auth.uid() = user_id);

-- GROUP MESSAGES
create policy "Group messages viewable by members" on public.group_messages for select using (
  exists (select 1 from public.group_members where group_id = public.group_messages.group_id and user_id = auth.uid())
);
create policy "Members can send group messages" on public.group_messages for insert with check (
  exists (select 1 from public.group_members where group_id = public.group_messages.group_id and user_id = auth.uid())
);

-- EVENTS
create policy "Events viewable by everyone" on public.events for select using (true);
create policy "Authenticated users can monitor events" on public.events for insert with check (auth.role() = 'authenticated');

-- REGISTRATIONS
create policy "Registrations viewable" on public.event_registrations for select using (true);
create policy "Users can register" on public.event_registrations for insert with check (auth.uid() = user_id);
create policy "Users can unregister" on public.event_registrations for delete using (auth.uid() = user_id);

-- FOLLOWS
create policy "Follows viewable by everyone" on public.follows for select using (true);
create policy "Users can follow" on public.follows for insert with check (auth.uid() = follower_id);
create policy "Users can unfollow" on public.follows for delete using (auth.uid() = follower_id);

-- CHAT (FIXED RECURSION using SECURITY DEFINER function)
create policy "Users can view conversations they are part of" on public.conversations for select using (
  public.is_member_of(id)
);
create policy "Users can create conversations" on public.conversations for insert with check (auth.role() = 'authenticated');

create policy "Users can view members of their conversations" on public.conversation_members for select using (
  public.is_member_of(conversation_id)
);
create policy "Users can create members" on public.conversation_members for insert with check (auth.role() = 'authenticated');

create policy "Users can view messages in their conversations" on public.messages for select using (
  public.is_member_of(conversation_id)
);
create policy "Users can insert messages in their conversations" on public.messages for insert with check (
  public.is_member_of(conversation_id)
);

-- NOTIFICATIONS
create policy "Users view own notifications" on public.notifications for select using (auth.uid() = user_id);
create policy "System/Users can create notifications" on public.notifications for insert with check (auth.role() = 'authenticated');
create policy "Users can update/read notifications" on public.notifications for update using (auth.uid() = user_id);

-- --- MISSING TABLES & POLICIES ---

-- POST MEDIA (Found referenced in usePosts.ts but missing in schema)
create table if not exists public.post_media (
  id uuid default uuid_generate_v4() primary key,
  post_id uuid references public.posts(id) on delete cascade not null,
  url text not null,
  type text not null, -- 'image' or 'video'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.post_media enable row level security;

create policy "Post media viewable by everyone" on public.post_media for select using (true);
create policy "Users can add post media" on public.post_media for insert with check (
  exists (select 1 from public.posts where id = post_id and user_id = auth.uid())
);
create policy "Users can delete own post media" on public.post_media for delete using (
  exists (select 1 from public.posts where id = post_id and user_id = auth.uid())
);

-- STORAGE BUCKET: chat-media
insert into storage.buckets (id, name, public)
values ('chat-media', 'chat-media', true)
on conflict (id) do nothing;

drop policy if exists "Chat media is publicly accessible." on storage.objects;
drop policy if exists "Authenticated users can upload chat media." on storage.objects;

create policy "Chat media is publicly accessible." on storage.objects
  for select using (bucket_id = 'chat-media');

create policy "Authenticated users can upload chat media." on storage.objects
  for insert with check (bucket_id = 'chat-media' and auth.role() = 'authenticated');
