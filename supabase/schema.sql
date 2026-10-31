-- Esquema Simplificado y Optimizado para Supabase (PostgreSQL)
-- Copia y pega este script en el SQL Editor de tu proyecto en Supabase (https://supabase.com)

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 1. Tabla de Usuarios / Técnicos con Contraseña (para login directo sin depender de verificación de email)
CREATE TABLE IF NOT EXISTS public.workshop_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(120) NOT NULL,
    password VARCHAR(100) NOT NULL,
    role VARCHAR(20) DEFAULT 'tecnico',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.workshop_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir lectura y registro en workshop_users" 
ON public.workshop_users FOR ALL 
USING (true) WITH CHECK (true);

-- 2. Tabla Principal de Registros de Horas (Simple y Limpia)
CREATE TABLE IF NOT EXISTS public.time_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_plate VARCHAR(30),                          -- Placa
    order_number VARCHAR(40),                           -- Nº de Orden
    duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0), -- Minutos trabajados
    duration_hours NUMERIC(5, 2) GENERATED ALWAYS AS (ROUND(duration_minutes / 60.0, 2)) STORED,
    description TEXT,                                   -- Notas opcionales
    technician_name VARCHAR(100),                       -- Nombre del mecánico que registró
    category VARCHAR(30) DEFAULT 'general',
    parts TEXT[] DEFAULT '{}',
    logged_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    CONSTRAINT check_vehicle_id CHECK (
        (vehicle_plate IS NOT NULL AND length(trim(vehicle_plate)) > 0) OR
        (order_number IS NOT NULL AND length(trim(order_number)) > 0)
    )
);

CREATE INDEX IF NOT EXISTS idx_time_logs_plate ON public.time_logs(vehicle_plate);
CREATE INDEX IF NOT EXISTS idx_time_logs_order ON public.time_logs(order_number);
CREATE INDEX IF NOT EXISTS idx_time_logs_logged_at ON public.time_logs(logged_at DESC);

ALTER TABLE public.time_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir todo en time_logs" 
ON public.time_logs FOR ALL 
USING (true) WITH CHECK (true);
