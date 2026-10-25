# AutoHoras - MVP de Registro Rápido de Horas para Taller Mecánico

Aplicación web con arquitectura **PWA-first** diseñada para mecánicos y técnicos. Enfoque de cero fricción: botones táctiles gigantes, selectores rápidos, chips de un toque y exportación de comprobantes en PDF/CSV.

---

## 🛠 Stack Tecnológico

- **Framework:** Next.js (App Router) + TypeScript
- **Estilos:** Tailwind CSS v4 (Modo oscuro de alto contraste y ergonomía táctil)
- **Base de Datos & Backend:** Supabase (PostgreSQL con RLS e índices Trigram)
- **Generación de Comprobantes:** jsPDF + jspdf-autotable
- **Iconografía:** Lucide React
- **Arquitectura PWA:** Manifest, metadatos móviles y viewport táctil anti-zoom accidental.

---

## 🚀 Inicio Rápido

### 1. Clonar e Instalar Dependencias
```bash
npm install
```

### 2. Iniciar Servidor de Desarrollo
```bash
npm run dev
```
Abre en tu navegador: [http://localhost:3000](http://localhost:3000)

> 💡 **Nota sobre funcionamiento inicial:** Si no has configurado Supabase aún, la aplicación activa automáticamente el **Modo Local / Offline** con datos de prueba preinstalados para que puedas probar todas las funciones de inmediato.

---

## 🗄 Conexión con Supabase

1. Crea un proyecto gratuito en [supabase.com](https://supabase.com).
2. Ve al **SQL Editor** de tu proyecto y ejecuta el script ubicado en:
   [`supabase/schema.sql`](./supabase/schema.sql)
3. Ve a **Project Settings -> API** y copia tu URL y Clave Anónima (`anon public`).
4. Edita el archivo `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-clave-anon-aqui
```
5. Reinicia el servidor con `npm run dev`. La barra superior indicará **Supabase Activo**.

---

## 📱 Funcionalidades Clave

1. **Pantalla Principal (Registro Rápido):**
   - Entrada de placa grande con autocompletado en mayúsculas de vehículos previos.
   - Selector de horas con stepper táctil gigante (`-0.5h` / `+0.5h`) y botones rápidos (`0.5h`, `1h`, `1.5h`, `2h`, `3h`, `4h`).
   - Cronómetro integrado para medir tiempo en vivo si el técnico lo prefiere.
   - Chips de un solo clic para sistemas trabajados (Motor, Transmisión, Frenos, Suspensión, Eléctrico, etc.).
   - Toast con feedback háptico (vibración en teléfonos compatibles).

2. **Módulo de Bitácora (Historial):**
   - Buscador universal instantáneo por placa, orden, sistema o notas.
   - Filtros por periodo: "Hoy", "Esta Semana", "Este Mes", "Todo".
   - Totalizador en tiempo real de registros, vehículos atendidos y horas acumuladas.
   - Tarjetas de vehículos con diseño de matrícula y opción de eliminar.

3. **Módulo de Reportes & Exportación:**
   - Botón de 1 clic: **Reporte Diario (PDF)** listo para imprimir o enviar por WhatsApp.
   - Botón de 1 clic: **Reporte Mensual (PDF)** para liquidación y cobro de mano de obra.
   - Exportación de histórico completo a **CSV / Excel**.
   - Tabla resumida de horas acumuladas agrupada por vehículo y órdenes.
