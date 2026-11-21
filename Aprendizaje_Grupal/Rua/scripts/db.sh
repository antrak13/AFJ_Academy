#!/usr/bin/env bash
# Aplica las migraciones y el seed a la base de Supabase indicada en SUPABASE_DB_URL (.env.local).
# Uso: npm run db:aplicar
set -euo pipefail
cd "$(dirname "$0")/.."

if [[ -f .env.local ]]; then
  set -a; source .env.local; set +a
fi
: "${SUPABASE_DB_URL:?Falta SUPABASE_DB_URL en .env.local (Supabase → Connect → Session pooler)}"

psql_() { psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -q "$@"; }

# Las migraciones crean tablas: solo se aplican las que aún no están.
psql_ -c "create table if not exists public._migraciones (nombre text primary key, aplicada timestamptz not null default now())"
for f in supabase/migrations/*.sql; do
  nombre=$(basename "$f")
  if [[ $(psql_ -tAc "select 1 from public._migraciones where nombre = '$nombre'") == "1" ]]; then
    echo "· $nombre (ya aplicada)"
    continue
  fi
  echo "→ $nombre"
  psql_ -1 -f "$f" -c "insert into public._migraciones (nombre) values ('$nombre')"
done
psql_ -c "alter table public._migraciones enable row level security"

echo "→ seed.sql"
psql_ -f supabase/seed.sql
echo "Listo."
