-- Base común mínima: lo que el estudio grupal necesita para funcionar y para alimentar
-- el perfil individual (puente). Las tablas propias del estudio individual
-- (learner_profile, materials, material_chunks, cards, format_stats) van en su propia migración.

create extension if not exists "pgcrypto";

-- Perfiles (1 a 1 con auth.users) -------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nombre text not null default '',
  avatar text,
  -- Regla 35: la telemetría requiere aceptación explícita.
  telemetria boolean not null default false,
  creado timestamptz not null default now()
);

create or replace function public.crear_perfil()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, nombre, avatar)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', ''),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger al_crear_usuario
  after insert on auth.users
  for each row execute function public.crear_perfil();

-- Temas y conceptos ------------------------------------------------------------
create table public.topics (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  descripcion text not null default '',
  creado timestamptz not null default now()
);

create table public.concepts (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references public.topics (id) on delete cascade,
  nombre text not null,
  requisitos uuid[] not null default '{}',
  unique (topic_id, nombre)
);

-- Videos (catálogo propio o con licencia libre) ---------------------------------
create table public.videos (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid references public.topics (id) on delete set null,
  url text not null,
  titulo text not null,
  duracion integer not null check (duracion > 0), -- segundos
  licencia text,
  creado timestamptz not null default now()
);

-- Telemetría y dominio (compartidos con el estudio individual) ----------------
create table public.learning_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  concept_id uuid references public.concepts (id) on delete set null,
  card_id uuid, -- sin FK aquí: la tabla cards la crea la migración del estudio individual
  origen text not null default 'individual' check (origen in ('individual', 'grupal')),
  tipo text not null,
  valor jsonb not null default '{}',
  creado timestamptz not null default now()
);
create index on public.learning_events (user_id, creado desc);

create table public.mastery (
  user_id uuid not null references public.profiles (id) on delete cascade,
  concept_id uuid not null references public.concepts (id) on delete cascade,
  valor real not null check (valor between 0 and 1),
  actualizado timestamptz not null default now(),
  primary key (user_id, concept_id)
);

-- RLS --------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.topics enable row level security;
alter table public.concepts enable row level security;
alter table public.videos enable row level security;
alter table public.learning_events enable row level security;
alter table public.mastery enable row level security;

create policy "perfiles visibles para usuarios" on public.profiles
  for select to authenticated using (true);
create policy "cada quien edita su perfil" on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create policy "temas visibles" on public.topics for select to authenticated using (true);
create policy "conceptos visibles" on public.concepts for select to authenticated using (true);
create policy "videos visibles" on public.videos for select to authenticated using (true);

-- Regla 31: la persona ve (y puede borrar) su propio perfil de aprendizaje.
create policy "ver mis eventos" on public.learning_events
  for select to authenticated using (user_id = auth.uid());
create policy "borrar mis eventos" on public.learning_events
  for delete to authenticated using (user_id = auth.uid());
create policy "ver mi dominio" on public.mastery
  for select to authenticated using (user_id = auth.uid());
create policy "borrar mi dominio" on public.mastery
  for delete to authenticated using (user_id = auth.uid());
