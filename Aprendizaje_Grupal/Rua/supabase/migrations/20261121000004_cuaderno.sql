-- Cuaderno del squad (pantalla 05): bloques editables por todos los integrantes de la sala.
-- Cada bloque es una fila, así dos personas editando bloques distintos no se pisan.
-- Se escribe y se lee por /api (service role); los cambios en vivo viajan por Broadcast.
create table public.room_notebook_blocks (
  id uuid primary key,
  room_id uuid not null references public.rooms (id) on delete cascade,
  orden double precision not null,
  tipo text not null check (tipo in ('titulo', 'texto', 'codigo', 'fotograma')),
  html text not null default '' check (length(html) <= 20000),
  imagen text check (imagen is null or length(imagen) <= 400000),
  segundo real,
  autor uuid not null references public.profiles (id) on delete cascade,
  actualizado_por uuid not null references public.profiles (id) on delete cascade,
  creado timestamptz not null default now(),
  actualizado timestamptz not null default now()
);
create index on public.room_notebook_blocks (room_id, orden);

alter table public.room_notebook_blocks enable row level security; -- sin políticas: solo /api
grant select, insert, update, delete on public.room_notebook_blocks to service_role;
