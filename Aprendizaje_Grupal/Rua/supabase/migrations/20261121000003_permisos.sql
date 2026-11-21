-- Permisos de la Data API. Los proyectos nuevos de Supabase ya no los conceden solos a las
-- tablas creadas en public: hay que darlos explícitamente. RLS sigue filtrando las filas.

-- El servidor (/api) usa service_role: acceso completo.
grant usage on schema public to service_role, authenticated;
grant select, insert, update, delete on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to service_role;

-- Navegador con sesión: solo lo que tiene política (las respuestas y votos no se exponen).
grant select on public.profiles, public.topics, public.concepts, public.videos,
  public.learning_events, public.mastery,
  public.rooms, public.room_members, public.room_sessions, public.checkpoint_rounds,
  public.friction_events, public.debate_flags
  to authenticated;
grant update (nombre, avatar, telemetria) on public.profiles to authenticated;
grant delete on public.learning_events, public.mastery to authenticated;

grant execute on function public.es_miembro(uuid) to authenticated;

-- Avisos del linter de Supabase.
alter function public.limitar_integrantes() set search_path = public;
revoke execute on function public.crear_perfil() from public, anon, authenticated;
revoke execute on function public.es_miembro(uuid) from public, anon;
