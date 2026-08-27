-- Ejecutar en el SQL Editor de Supabase (mismo proyecto de Brandie o uno nuevo)

create table prospectos (
  id uuid default gen_random_uuid() primary key,
  nombre_negocio text,
  telefono text,
  direccion text,
  rubro text,
  ciudad text,
  website text,
  rating numeric,
  mensaje_sugerido text,
  estado text default 'nuevo',  -- nuevo | contactado | descartado
  created_at timestamptz default now()
);

create index idx_prospectos_estado on prospectos(estado);
