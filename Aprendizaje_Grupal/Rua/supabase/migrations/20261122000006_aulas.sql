-- Vista docente de Aprendines: aulas, alumnos y el avance de cada aprendín.
-- Todo se lee y escribe desde las rutas /api/aulas y /api/avance con service_role, que
-- comprueban quién es dueño de cada aula. El navegador no tiene políticas sobre estas tablas.

-- Aulas -------------------------------------------------------------------------
create table public.aulas (
  id uuid primary key default gen_random_uuid(),
  docente_id uuid not null references public.profiles (id) on delete cascade,
  nombre text not null check (char_length(nombre) between 1 and 60),
  curso text not null default '',
  tema text not null default '',            -- tema asignado por el docente (se precarga en el taller)
  codigo text not null unique check (codigo ~ '^[A-Z2-9]{6}$'),
  creado timestamptz not null default now()
);
create index on public.aulas (docente_id);

-- Alumnos de cada aula. `usuario` solo existe si el docente creó la cuenta (entra con usuario y PIN).
create table public.aula_alumnos (
  aula_id uuid not null references public.aulas (id) on delete cascade,
  alumno_id uuid not null references public.profiles (id) on delete cascade,
  usuario text,
  creado timestamptz not null default now(),
  primary key (aula_id, alumno_id)
);
create index on public.aula_alumnos (alumno_id);

-- Avance de cada aprendín de un alumno: lo que midió la IA en la clase y el resultado de la prueba.
create table public.aprendin_avance (
  alumno_id uuid not null references public.profiles (id) on delete cascade,
  aprendin_id text not null check (char_length(aprendin_id) between 1 and 80),
  nombre text not null default '',
  tema text not null default '',
  conceptos text[] not null default '{}',
  paso integer not null default 1 check (paso between 1 and 5),   -- 5 = terminó los 4 pasos
  mensajes integer not null default 0,
  medicion jsonb not null default '{}',   -- { "1": [{ "estado": "error", "nota": "…" }, …], … }
  prueba jsonb,                           -- { intento, puntaje, n, aprobado, salvadas, fallosPorPaso }
  actualizado timestamptz not null default now(),
  primary key (alumno_id, aprendin_id)
);

-- RLS sin políticas: solo el servidor (service_role) accede.
alter table public.aulas enable row level security;
alter table public.aula_alumnos enable row level security;
alter table public.aprendin_avance enable row level security;

grant select, insert, update, delete on public.aulas, public.aula_alumnos, public.aprendin_avance to service_role;
