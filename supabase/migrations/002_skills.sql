-- Skill packaging: additions to public.prompts
-- Safe to run against a database that already has 001_prompts.sql applied.

alter table public.prompts
  add column if not exists manifest jsonb,
  add column if not exists package_path text,
  add column if not exists entry_content text;

-- Skills always carry a manifest + a stored zip; other types must not.
alter table public.prompts
  drop constraint if exists prompts_skill_shape;
alter table public.prompts
  add constraint prompts_skill_shape check (
    (type = 'skill' and manifest is not null and package_path is not null)
    or (type <> 'skill' and manifest is null and package_path is null and entry_content is null)
  );
