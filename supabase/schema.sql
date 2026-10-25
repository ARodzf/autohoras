-- Esquema para Supabase (PostgreSQL)
-- Copia y pega este script en el SQL Editor de tu proyecto en Supabase (https://supabase.com)

-- 1. Habilitar extensión para búsquedas difusas/trigramas
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2. Tabla Principal de Registros de Horas
CREATE TABLE IF NOT EXISTS public.time_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_plate VARCHAR(20) NOT NULL,
    order_number VARCHAR(40),
    duration_hours NUMERIC(5, 2) NOT NULL CHECK (duration_hours > 0),
    parts TEXT[] DEFAULT '{}',
    description TEXT,
    logged_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- 3. Índices de Alto Rendimiento
CREATE INDEX IF NOT EXISTS idx_time_logs_plate_trgm ON public.time_logs USING gin (vehicle_plate gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_time_logs_plate ON public.time_logs(vehicle_plate);
CREATE INDEX IF NOT EXISTS idx_time_logs_logged_at ON public.time_logs(logged_at DESC);
CREATE INDEX IF NOT EXISTS idx_time_logs_order ON public.time_logs(order_number);
CREATE INDEX IF NOT EXISTS idx_time_logs_parts ON public.time_logs USING gin(parts);

-- 4. Seguridad a Nivel de Filas (Row Level Security - RLS)
ALTER TABLE public.time_logs ENABLE ROW LEVEL SECURITY;

-- Política para permitir acceso público/anónimo durante desarrollo o uso en taller con tableta local
CREATE POLICY "Permitir lectura para todos" 
ON public.time_logs 
FOR SELECT 
USING (true);

CREATE POLICY "Permitir insercion para todos" 
ON public.time_logs 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Permitir eliminacion para todos" 
ON public.time_logs 
FOR DELETE 
USING (true);

CREATE POLICY "Permitir actualizacion para todos" 
ON public.time_logs 
FOR UPDATE 
USING (true);

-- 5. Datos de prueba (Semilla opcional para validar la interfaz de inmediato)
INSERT INTO public.time_logs (vehicle_plate, order_number, duration_hours, parts, description, logged_at)
VALUES 
  ('ABC-123', 'ORD-501', 2.50, ARRAY['Frenos', 'Suspensión'], 'Cambio de pastillas y amortiguadores delanteros', NOW() - INTERVAL '2 hours'),
  ('XYZ-789', 'ORD-502', 1.00, ARRAY['Motor', 'Mantenimiento'], 'Cambio de aceite, filtro y bujías', NOW() - INTERVAL '1 day'),
  ('MNP-456', 'ORD-503', 4.00, ARRAY['Transmisión'], 'Bajada de caja y cambio de kit de embrague', NOW() - INTERVAL '2 days'),
  ('ABC-123', 'ORD-504', 0.50, ARRAY['Diagnóstico'], 'Escaneo computarizado por luz de Check Engine', NOW());
