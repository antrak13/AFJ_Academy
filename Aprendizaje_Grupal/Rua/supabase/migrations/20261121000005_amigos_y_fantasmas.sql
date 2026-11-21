-- Amigos, invitaciones a ver una clase en vivo y sesiones fantasma (ver una clase en diferido
-- con el recorrido, el chat, el cuaderno, los votos y la voz de los amigos que ya la vieron).
--
-- Modelo de plataforma: topics = cursos, videos = clases del curso (con su orden),
-- checkpoints = preguntas que define la plataforma. Cada vez que alguien abre una clase se
-- crea una sesión (rooms + room_sessions); invitar amigos los suma a esa misma sesión.

alter table public.videos add column if not exists orden integer not null default 0;

-- Regla 35 ampliada: la voz solo se guarda con aceptación explícita y aparte de la telemetría.
alter table public.profiles add column if not exists grabar_voz boolean not null default false;

-- Amistades -------------------------------------------------------------------------
create table public.friendships (
  solicitante uuid not null references public.profiles (id) on delete cascade,
  destinatario uuid not null references public.profiles (id) on delete cascade,
  estado text not null default 'pendiente' check (estado in ('pendiente', 'aceptada')),
  creado timestamptz not null default now(),
  primary key (solicitante, destinatario),
  check (solicitante <> destinatario)
);
create index on public.friendships (destinatario);
-- Una sola relación por par, sin importar quién la pidió.
create unique index amistad_unica on public.friendships (least(solicitante, destinatario), greatest(solicitante, destinatario));

create or replace function public.son_amigos(a uuid, b uuid)
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from public.friendships
    where estado = 'aceptada'
      and ((solicitante = a and destinatario = b) or (solicitante = b and destinatario = a))
  );
$$;

-- Invitaciones a una sesión en vivo -------------------------------------------------
create table public.room_invites (
  room_id uuid not null references public.rooms (id) on delete cascade,
  invitado uuid not null references public.profiles (id) on delete cascade,
  invitado_por uuid not null references public.profiles (id) on delete cascade,
  estado text not null default 'pendiente' check (estado in ('pendiente', 'aceptada', 'rechazada')),
  creado timestamptz not null default now(),
  primary key (room_id, invitado)
);
create index on public.room_invites (invitado, estado);

-- Recorrido de cada persona en una sesión: muestras [ms desde que empezó, posición, estado].
create table public.session_tracks (
  session_id uuid not null references public.room_sessions (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  room_id uuid not null references public.rooms (id) on delete cascade,
  video_id uuid not null references public.videos (id) on delete cascade,
  iniciado timestamptz not null,
  muestras jsonb not null default '[]' check (jsonb_typeof(muestras) = 'array'),
  actualizado timestamptz not null default now(),
  primary key (session_id, user_id)
);
create index on public.session_tracks (video_id);

-- Agrega muestras de forma atómica (cada cliente envía lotes cada pocos segundos). Si la
-- persona vuelve a entrar a la misma sesión, sus tiempos se corren a la línea de tiempo original.
create or replace function public.agregar_muestras(
  p_session uuid, p_user uuid, p_room uuid, p_video uuid, p_iniciado timestamptz, p_muestras jsonb
) returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_inicio timestamptz;
  v_desfase bigint;
  v_muestras jsonb;
begin
  select iniciado into v_inicio from public.session_tracks where session_id = p_session and user_id = p_user;
  if v_inicio is null then
    insert into public.session_tracks (session_id, user_id, room_id, video_id, iniciado, muestras)
    values (p_session, p_user, p_room, p_video, p_iniciado, p_muestras)
    on conflict (session_id, user_id) do update set muestras = public.session_tracks.muestras || excluded.muestras, actualizado = now();
    return;
  end if;
  v_desfase := (extract(epoch from (p_iniciado - v_inicio)) * 1000)::bigint;
  select coalesce(jsonb_agg(jsonb_build_array((e ->> 0)::bigint + v_desfase, e -> 1, e -> 2)), '[]'::jsonb)
    into v_muestras from jsonb_array_elements(p_muestras) e;
  update public.session_tracks
     set muestras = case when jsonb_array_length(muestras) > 20000 then muestras else muestras || v_muestras end,
         actualizado = now()
   where session_id = p_session and user_id = p_user;
end;
$$;

-- Chat de la sesión (en diferido aparece al llegar a la misma posición del video).
create table public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.room_sessions (id) on delete cascade,
  room_id uuid not null references public.rooms (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  texto text not null check (length(texto) between 1 and 500),
  posicion real not null default 0,
  creado timestamptz not null default now()
);
create index on public.chat_messages (session_id, creado);

-- Clips de voz de las discusiones (solo de quien aceptó grabar_voz).
create table public.voice_clips (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.room_sessions (id) on delete cascade,
  room_id uuid not null references public.rooms (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  video_id uuid not null references public.videos (id) on delete cascade,
  checkpoint_id uuid references public.checkpoints (id) on delete set null,
  posicion real not null,
  inicio timestamptz not null,
  duracion_ms integer not null check (duracion_ms between 300 and 600000),
  ruta text not null unique,
  creado timestamptz not null default now()
);
create index on public.voice_clips (session_id, inicio);

alter table public.friendships enable row level security;
alter table public.room_invites enable row level security;
alter table public.session_tracks enable row level security;
alter table public.chat_messages enable row level security;
alter table public.voice_clips enable row level security;
-- Sin políticas para el navegador: todo pasa por /api, que valida amistad y pertenencia.

grant select, insert, update, delete on public.friendships, public.room_invites, public.session_tracks,
  public.chat_messages, public.voice_clips to service_role;
revoke execute on function public.agregar_muestras(uuid, uuid, uuid, uuid, timestamptz, jsonb) from public, anon, authenticated;
grant execute on function public.agregar_muestras(uuid, uuid, uuid, uuid, timestamptz, jsonb) to service_role;
revoke execute on function public.son_amigos(uuid, uuid) from public, anon, authenticated;
grant execute on function public.son_amigos(uuid, uuid) to service_role;

-- Audio de las discusiones: privado; se sube y se escucha con URLs firmadas que da /api.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('grabaciones', 'grabaciones', false, 10485760, array['audio/webm', 'audio/ogg', 'audio/mp4'])
on conflict (id) do nothing;
grant update (grabar_voz) on public.profiles to authenticated;

-- Agregar amigos por correo: solo /api (service role) puede buscar en auth.users.
create or replace function public.perfil_por_correo(p_correo text)
returns uuid
language sql
stable
security definer set search_path = public, auth
as $$
  select id from auth.users where lower(email) = lower(trim(p_correo)) limit 1;
$$;
revoke execute on function public.perfil_por_correo(text) from public, anon, authenticated;
grant execute on function public.perfil_por_correo(text) to service_role;
