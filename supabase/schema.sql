-- Esquema actualizado para Supabase (PostgreSQL)
-- Copia y pega este script en el SQL Editor de tu proyecto en Supabase (https://supabase.com)

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Tabla Principal de Registros de Horas
CREATE TABLE IF NOT EXISTS public.time_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_plate VARCHAR(30),                          -- Placa (opcional si hay orden)
    order_number VARCHAR(40),                           -- Nº de Orden (opcional si hay placa)
    category VARCHAR(30) DEFAULT 'exterior',            -- 'mecanica', 'interior', 'exterior'
    duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0), -- Guardado en minutos exactos
    duration_hours NUMERIC(5, 2) GENERATED ALWAYS AS (ROUND(duration_minutes / 60.0, 2)) STORED,
    parts TEXT[] DEFAULT '{}',
    description TEXT,
    technician_name VARCHAR(80),
    logged_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    CONSTRAINT check_vehicle_identification CHECK (
        (vehicle_plate IS NOT NULL AND length(trim(vehicle_plate)) > 0) OR
        (order_number IS NOT NULL AND length(trim(order_number)) > 0)
    )
);

-- Índices de Alto Rendimiento
CREATE INDEX IF NOT EXISTS idx_time_logs_plate ON public.time_logs(vehicle_plate);
CREATE INDEX IF NOT EXISTS idx_time_logs_order ON public.time_logs(order_number);
CREATE INDEX IF NOT EXISTS idx_time_logs_logged_at ON public.time_logs(logged_at DESC);
CREATE INDEX IF NOT EXISTS idx_time_logs_category ON public.time_logs(category);
CREATE INDEX IF NOT EXISTS idx_time_logs_parts ON public.time_logs USING gin(parts);

-- Seguridad a Nivel de Filas (Row Level Security - RLS)
ALTER TABLE public.time_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir lectura para todos" 
ON public.time_logs FOR SELECT USING (true);

CREATE POLICY "Permitir insercion para todos" 
ON public.time_logs FOR INSERT WITH CHECK (true);

CREATE POLICY "Permitir eliminacion para todos" 
ON public.time_logs FOR DELETE USING (true);

CREATE POLICY "Permitir actualizacion para todos" 
ON public.time_logs FOR UPDATE USING (true);
