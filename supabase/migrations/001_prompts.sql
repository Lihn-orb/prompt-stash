create table if not exists public.prompts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  title text not null check (char_length(trim(title)) between 1 and 200),
  description text not null default '' check (char_length(description) <= 1000),
  content text not null check (char_length(trim(content)) > 0 and char_length(content) <= 100000),
  type text not null default 'prompt' check (type in ('prompt', 'template', 'skill')),
  category text not null default 'Other'
    check (category in ('Design', 'Research', 'Coding', 'Writing', 'Image', 'Productivity', 'Other')),
  tags text[] not null default '{}' check (cardinality(tags) <= 12),
  status text not null default 'inbox' check (status in ('inbox', 'library', 'tested', 'archived')),
  source text not null default 'manual' check (source in ('manual', 'chatgpt', 'claude', 'web', 'other')),
  source_url text check (source_url is null or source_url ~* '^https?://'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists prompts_owner_created_idx on public.prompts(user_id, created_at desc);
create index if not exists prompts_owner_status_idx on public.prompts(user_id, status);

create or replace function public.set_prompt_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists prompts_updated_at on public.prompts;
create trigger prompts_updated_at
before update on public.prompts
for each row execute function public.set_prompt_updated_at();

-- No public policies: only the server-held service role can access this table.
alter table public.prompts enable row level security;
revoke all on public.prompts from anon, authenticated;
grant select, insert, update, delete on public.prompts to service_role;
