-- Estudio grupal: salas, sesiones, puntos de control, votos, zonas de fricción.
-- Las escrituras pasan siempre por las rutas /api (cliente con service role), que validan
-- las reglas de negocio. Desde el navegador solo se lee lo que no revela respuestas.

-- Salas ------------------------------------------------------------------------
create table public.rooms (
  id uuid primary key default gen_random_uuid(),
  anfitrion uuid not null references public.profiles (id),
  topic_id uuid not null references public.topics (id),
  video_id uuid not null references public.videos (id),
  codigo text not null unique check (codigo ~ '^[A-Z0-9]{6}$'),
  estado text not null default 'abierta' check (estado in ('abierta', 'cerrada')),
  creado timestamptz not null default now()
);

create table public.room_members (
  room_id uuid not null references public.rooms (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  rol text not null default 'integrante' check (rol in ('anfitrion', 'integrante')),
  unido_en timestamptz not null default now(),
  primary key (room_id, user_id)
);
create index on public.room_members (user_id);

-- Regla 2: máximo 5 integrantes. Se valida también en la base para evitar carreras
-- (dos personas entrando a la vez con 4 dentro).
create or replace function public.limitar_integrantes()
returns trigger
language plpgsql
as $$
begin
  perform 1 from public.rooms where id = new.room_id for update;
  if (select count(*) from public.room_members where room_id = new.room_id) >= 5 then
    raise exception 'SALA_LLENA' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

create trigger limite_integrantes
  before insert on public.room_members
  for each row execute function public.limitar_integrantes();

-- Sesiones (regla 3: una sola activa por sala) ---------------------------------
create table public.room_sessions (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms (id) on delete cascade,
  iniciada_en timestamptz not null default now(),
  cerrada_en timestamptz
);
create unique index una_sesion_activa on public.room_sessions (room_id) where cerrada_en is null;

-- Puntos de control (regla 17) ---------------------------------------------------
create table public.checkpoints (
  id uuid primary key default gen_random_uuid(),
  video_id uuid not null references public.videos (id) on delete cascade,
  concept_id uuid references public.concepts (id) on delete set null,
  segundo integer not null check (segundo >= 0), -- el "minuto" del diseño, en segundos
  pregunta text not null,
  opciones jsonb not null check (
    jsonb_typeof(opciones) = 'array'
    and jsonb_array_length(opciones) between 2 and 4
  ),
  correcta smallint not null check (correcta >= 0 and correcta < 4),
  explicacion text not null,
  generado_por_ia boolean not null default false,
  revisado boolean not null default false,
  creado timestamptz not null default now()
);
create index on public.checkpoints (video_id, segundo);

-- Ronda: el estado de un punto de control dentro de una sesión.
create table public.checkpoint_rounds (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.room_sessions (id) on delete cascade,
  room_id uuid not null references public.rooms (id) on delete cascade,
  checkpoint_id uuid not null references public.checkpoints (id) on delete cascade,
  fase text not null default 'votacion' check (fase in ('votacion', 'debate', 'cerrada')),
  primer_voto_en timestamptz,
  debate_hasta timestamptz,
  cerrada_en timestamptz,
  resultado text check (resultado in ('combo_perfecto', 'unanime_incorrecta', 'debate', 'sin_votos')),
  votos_divididos boolean not null default false,
  creado timestamptz not null default now(),
  unique (session_id, checkpoint_id)
);

create table public.votes (
  round_id uuid not null references public.checkpoint_rounds (id) on delete cascade,
  checkpoint_id uuid not null references public.checkpoints (id) on delete cascade,
  room_id uuid not null references public.rooms (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  voto_inicial smallint not null,
  voto_final smallint,
  creado timestamptz not null default now(),
  actualizado timestamptz not null default now(),
  primary key (round_id, user_id)
);

-- Zonas de fricción (reglas 10 a 12) ---------------------------------------------
create table public.rewind_events (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.room_sessions (id) on delete cascade,
  room_id uuid not null references public.rooms (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  desde real not null,
  hasta real not null,
  ventana_inicio integer not null,
  creado timestamptz not null default now(),
  check (desde - hasta >= 5)
);
create index on public.rewind_events (session_id, ventana_inicio);

create table public.friction_events (
  session_id uuid not null references public.room_sessions (id) on delete cascade,
  room_id uuid not null references public.rooms (id) on delete cascade,
  ventana_inicio integer not null,
  retrocesos integer not null default 0,
  integrantes integer not null default 0,
  es_zona boolean not null default false,
  actualizado timestamptz not null default now(),
  primary key (session_id, ventana_inicio)
);

-- Puente: conceptos con votos divididos, sugeridos en el panel individual -------
create table public.debate_flags (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms (id) on delete cascade,
  concept_id uuid not null references public.concepts (id) on delete cascade,
  checkpoint_id uuid not null references public.checkpoints (id) on delete cascade,
  creado timestamptz not null default now(),
  unique (room_id, checkpoint_id)
);

-- RLS ------------------------------------------------------------------------------
create or replace function public.es_miembro(sala uuid)
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from public.room_members where room_id = sala and user_id = auth.uid()
  );
$$;

alter table public.rooms enable row level security;
alter table public.room_members enable row level security;
alter table public.room_sessions enable row level security;
alter table public.checkpoints enable row level security;      -- sin políticas: contiene la respuesta
alter table public.checkpoint_rounds enable row level security;
alter table public.votes enable row level security;            -- sin políticas: votos a ciegas (regla 19)
alter table public.rewind_events enable row level security;
alter table public.friction_events enable row level security;
alter table public.debate_flags enable row level security;

create policy "miembros ven la sala" on public.rooms
  for select to authenticated using (public.es_miembro(id));
create policy "miembros ven integrantes" on public.room_members
  for select to authenticated using (public.es_miembro(room_id));
create policy "miembros ven sesiones" on public.room_sessions
  for select to authenticated using (public.es_miembro(room_id));
create policy "miembros ven rondas" on public.checkpoint_rounds
  for select to authenticated using (public.es_miembro(room_id));
create policy "miembros ven fricción" on public.friction_events
  for select to authenticated using (public.es_miembro(room_id));
create policy "miembros ven conceptos a debatir" on public.debate_flags
  for select to authenticated using (public.es_miembro(room_id));
