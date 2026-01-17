-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- --- CLEANUP (Use with CAUTION) ---
-- do $$ 
-- declare 
--   r record; 
-- begin 
--   for r in (select tablename from pg_tables where schemaname = 'public') loop 
--     execute 'drop table if exists ' || quote_ident(r.tablename) || ' cascade'; 
--   end loop; 
-- end $$;

-- --- 1. PROFILES ---
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  full_name text,
  avatar_url text,
  bio text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- --- 2. POSTS ---
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  content text,
  media_url text,
  media_type text check (media_type in ('image', 'video')),
  likes_count integer default 0,
  comments_count integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- --- 3. COMMENTS ---
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references public.posts(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- --- 4. LIKES ---
create table if not exists public.likes (
  user_id uuid references public.profiles(id) on delete cascade not null,
  post_id uuid references public.posts(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (user_id, post_id)
);

-- --- 5. SAVED POSTS ---
create table if not exists public.saved_posts (
  user_id uuid references public.profiles(id) on delete cascade not null,
  post_id uuid references public.posts(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (user_id, post_id)
);

-- --- 6. GROUPS ---
create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  is_private boolean default false,
  avatar_url text,
  created_by uuid references public.profiles(id) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- --- 7. GROUP MEMBERS ---
create table if not exists public.group_members (
  group_id uuid references public.groups(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  role text default 'member',
  joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (group_id, user_id)
);

-- --- 8. GROUP MESSAGES ---
create table if not exists public.group_messages (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references public.groups(id) on delete cascade not null,
  sender_id uuid references public.profiles(id) on delete set null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- --- 9. EVENTS ---
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  date timestamp with time zone not null,
  location text,
  image_url text,
  created_by uuid references public.profiles(id) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- --- 10. CONVERSATIONS ---
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  is_group boolean default false,
  name text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- --- 11. CONVERSATION MEMBERS ---
create table if not exists public.conversation_members (
  conversation_id uuid references public.conversations(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (conversation_id, user_id)
);

-- --- 12. MESSAGES ---
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references public.conversations(id) on delete cascade not null,
  sender_id uuid references public.profiles(id) on delete set null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  deleted boolean default false,
  seen boolean default false
);

-- --- STORAGE BUCKETS ---
insert into storage.buckets (id, name, public)
values 
  ('avatars', 'avatars', true),
  ('posts-media', 'posts-media', true),
  ('stories', 'stories', true)
on conflict (id) do nothing;

-- --- SECURITY & RLS ---

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.comments enable row level security;
alter table public.likes enable row level security;
alter table public.saved_posts enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.group_messages enable row level security;
alter table public.events enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_members enable row level security;
alter table public.messages enable row level security;

-- HELPER FUNCTIONS
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

-- POLICIES

-- Profiles
drop policy if exists "Public profiles" on public.profiles;
create policy "Public profiles" on public.profiles for select using (true);

drop policy if exists "Update own profile" on public.profiles;
create policy "Update own profile" on public.profiles for update using (auth.uid() = id);

drop policy if exists "Insert own profile" on public.profiles;
create policy "Insert own profile" on public.profiles for insert with check (auth.uid() = id);

-- Posts
drop policy if exists "Public posts" on public.posts;
create policy "Public posts" on public.posts for select using (true);

drop policy if exists "Create posts" on public.posts;
create policy "Create posts" on public.posts for insert with check (auth.uid() = user_id);

drop policy if exists "Update own posts" on public.posts;
create policy "Update own posts" on public.posts for update using (auth.uid() = user_id);

drop policy if exists "Delete own posts" on public.posts;
create policy "Delete own posts" on public.posts for delete using (auth.uid() = user_id);

-- Comments
drop policy if exists "Public comments" on public.comments;
create policy "Public comments" on public.comments for select using (true);

drop policy if exists "Create comments" on public.comments;
create policy "Create comments" on public.comments for insert with check (auth.uid() = user_id);

drop policy if exists "Delete own comments" on public.comments;
create policy "Delete own comments" on public.comments for delete using (auth.uid() = user_id);

-- Likes
drop policy if exists "Public likes" on public.likes;
create policy "Public likes" on public.likes for select using (true);

drop policy if exists "Toggle likes" on public.likes;
create policy "Toggle likes" on public.likes for all using (auth.uid() = user_id);

-- Saved Posts
drop policy if exists "View own saved" on public.saved_posts;
create policy "View own saved" on public.saved_posts for select using (auth.uid() = user_id);

drop policy if exists "Manage saved" on public.saved_posts;
create policy "Manage saved" on public.saved_posts for all using (auth.uid() = user_id);

-- Groups
drop policy if exists "Public groups" on public.groups;
create policy "Public groups" on public.groups for select using (true);

drop policy if exists "Create groups" on public.groups;
create policy "Create groups" on public.groups for insert with check (auth.role() = 'authenticated');

drop policy if exists "Update owned groups" on public.groups;
create policy "Update owned groups" on public.groups for update using (auth.uid() = created_by);

-- Group Members
drop policy if exists "Public group members" on public.group_members;
create policy "Public group members" on public.group_members for select using (true);

drop policy if exists "Join groups" on public.group_members;
create policy "Join groups" on public.group_members for insert with check (auth.uid() = user_id);

drop policy if exists "Leave groups" on public.group_members;
create policy "Leave groups" on public.group_members for delete using (auth.uid() = user_id);

-- Group Messages
drop policy if exists "Group messages viewable by members" on public.group_messages;
create policy "Group messages viewable by members" on public.group_messages for select using (
  exists (select 1 from public.group_members where group_id = public.group_messages.group_id and user_id = auth.uid())
);

drop policy if exists "Members can send group messages" on public.group_messages;
create policy "Members can send group messages" on public.group_messages for insert with check (
  exists (select 1 from public.group_members where group_id = public.group_messages.group_id and user_id = auth.uid())
);

-- Events
drop policy if exists "Public events" on public.events;
create policy "Public events" on public.events for select using (true);

drop policy if exists "Create events" on public.events;
create policy "Create events" on public.events for insert with check (auth.role() = 'authenticated');

-- Chat (Conversations)
drop policy if exists "View my conversations" on public.conversations;
create policy "View my conversations" on public.conversations for select using (
  public.is_member_of(id)
);

drop policy if exists "Create conversation" on public.conversations;
create policy "Create conversation" on public.conversations for insert with check (auth.role() = 'authenticated');

-- Chat (Members)
drop policy if exists "View my conversation members" on public.conversation_members;
create policy "View my conversation members" on public.conversation_members for select using (
  public.is_member_of(conversation_id)
);

drop policy if exists "Join conversation" on public.conversation_members;
create policy "Join conversation" on public.conversation_members for insert with check (auth.role() = 'authenticated');

-- Chat (Messages)
drop policy if exists "View my messages" on public.messages;
create policy "View my messages" on public.messages for select using (
  public.is_member_of(conversation_id)
);

drop policy if exists "Send message" on public.messages;
create policy "Send message" on public.messages for insert with check (
  public.is_member_of(conversation_id)
);

drop policy if exists "Update own messages" on public.messages;
create policy "Update own messages" on public.messages for update using (auth.uid() = sender_id);

-- Storage Policies
drop policy if exists "Avatars public" on storage.objects;
create policy "Avatars public" on storage.objects for select using (bucket_id = 'avatars');

drop policy if exists "Avatars upload" on storage.objects;
create policy "Avatars upload" on storage.objects for insert with check (bucket_id = 'avatars' and auth.role() = 'authenticated');

drop policy if exists "Media public" on storage.objects;
create policy "Media public" on storage.objects for select using (bucket_id = 'posts-media');

drop policy if exists "Media upload" on storage.objects;
create policy "Media upload" on storage.objects for insert with check (bucket_id = 'posts-media' and auth.role() = 'authenticated');

drop policy if exists "Stories public" on storage.objects;
create policy "Stories public" on storage.objects for select using (bucket_id = 'stories');

drop policy if exists "Stories upload" on storage.objects;
create policy "Stories upload" on storage.objects for insert with check (bucket_id = 'stories' and auth.role() = 'authenticated');

-- HANDLERS

-- New User Handler
create or replace function public.handle_new_user()
returns trigger
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'username'),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql;

-- Trigger
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

