-- Ejecutar en el SQL Editor de Supabase (proyecto nuevo, plan free)

create table leads_brandie (
  id uuid default gen_random_uuid() primary key,
  nombre text,
  negocio text,
  rubro text,
  contacto text,
  plan_sugerido text,
  funcionalidad_pendiente text,
  precio_estimado text,
  created_at timestamptz default now()
);
