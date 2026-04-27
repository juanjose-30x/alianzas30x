# 30X · Design & Stack Context

Referencia de diseño y arquitectura del proyecto `alianzas30x`.
Usa este documento como punto de partida para cualquier nuevo proyecto dentro del ecosistema 30X.

---

## Stack técnico

| Capa | Tecnología |
|---|---|
| Framework | Next.js 15 App Router (`src/app/`) |
| Styling | Tailwind CSS v4 + CSS custom properties (no utility-first puro) |
| Animaciones | Framer Motion + variantes centralizadas en `src/lib/motion.ts` |
| Iconos | `lucide-react` — strokeWidth 1.75 (default) / 2 (activo) / 2.5 (CTA) |
| Fuentes | Geist (sans), Geist Mono (números), Inter Tight, Figtree — via `next/font/google` |
| Backend / DB | Supabase (Postgres + Auth + RLS) |
| IA | Anthropic Claude via AI SDK (`ai` + `@ai-sdk/anthropic`) |
| Auth | Cookie-based con middleware Next.js (`src/middleware.ts`) |

---

## Paleta de colores

```css
/* Fundamentos */
--bg:         #f3f2ee;   /* Fondo principal — crema cálido */
--bg-card:    #ffffff;   /* Superficie de cards */
--fg:         #0c0c09;   /* Texto principal — casi negro cálido */
--accent:     #E9FF7B;   /* Lima 30X — solo para highlights, CTAs, focus */
--accent-sat: #d4f000;   /* Versión saturada del acento */

/* Texto jerárquico */
--t-muted:  #5c5b56;    /* Texto secundario */
--t-subtle: #8c8a83;    /* Texto terciario */
--t-faint:  #b3b0a8;    /* Placeholder, metadata menor */
--t-ghost:  #d6d3cb;    /* Divisores tipográficos, labels ultra-light */

/* Bordes */
--br:     rgba(12,12,9,0.09);   /* Default */
--br-mid: rgba(12,12,9,0.15);   /* Hover / énfasis */
--br-str: rgba(12,12,9,0.24);   /* Strong / focus */

/* Superficies (overlays sobre --bg) */
--surface-1: rgba(12,12,9,0.03);
--surface-2: rgba(12,12,9,0.05);
--surface-3: rgba(12,12,9,0.08);
--surface-4: rgba(12,12,9,0.11);

/* Semánticos */
--c-success: #15803d;   /* Verde */
--c-danger:  #b91c1c;   /* Rojo */
--c-purple:  #6d28d9;   /* Violeta */
--c-info:    #1d4ed8;   /* Azul */
--c-warning: #b45309;   /* Naranja */

/* Acento — sistema completo */
--accent-surface:      rgba(212,240,0,0.10);
--accent-border:       rgba(212,240,0,0.32);
--accent-border-focus: rgba(212,240,0,0.65);
--accent-focus-ring:   rgba(212,240,0,0.18);
--accent-glow:         rgba(212,240,0,0.40);
--accent-selection:    rgba(233,255,123,0.45);  /* ::selection */
```

**Regla clave:** el acento `#E9FF7B` nunca va en texto sobre fondo blanco — solo como background, border, o glow. El texto siempre es `--fg` o escala de grises.

---

## Tipografía

### Fuente principal: Geist
```tsx
// layout.tsx
import { Geist, Geist_Mono } from 'next/font/google'
// Variables: --font-geist, --font-geist-mono

body { font-family: var(--font-geist), system-ui, sans-serif; }
```

### Escala de tamaños (CSS variables)
```
11px · 12px · 13px · 14px · 15px · 16px · 18px · 20px · 24px · 32px · 44px
```

### Clases utilitarias de tipografía
```css
/* Títulos grandes — display numbers / KPIs */
.text-display {
  font-weight: 800;
  letter-spacing: -0.055em;
  line-height: 0.9;
  font-feature-settings: "tnum" 1;  /* números tabulares */
}

/* Labels de sección — caps pequeños */
.label-caps {
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--t-faint);
}
```

### Patrones de tracking
- Títulos / headings: `letter-spacing: -0.02em` a `-0.055em`
- Cuerpo / botones: `letter-spacing: -0.01em`
- Labels caps: `letter-spacing: 0.10em` a `0.14em`
- Números / monospace: `letter-spacing: -0.025em`, siempre `tabular-nums`

---

## Sistema de animación

### Easings (CSS + Framer Motion)
```css
/* CSS variables */
--ease-out:    cubic-bezier(0.23, 1, 0.32, 1);    /* Movimientos generales */
--ease-expo:   cubic-bezier(0.16, 1, 0.3, 1);     /* Entradas de contenido */
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1); /* Micro-interacciones */
--ease-drawer: cubic-bezier(0.32, 0.72, 0, 1);    /* Paneles / drawers */
--ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);   /* Transiciones página */
```

```ts
// src/lib/motion.ts — importar siempre desde aquí
export const EASE_EXPO   = [0.16, 1, 0.3, 1] as const
export const EASE_OUT    = [0.23, 1, 0.32, 1] as const
export const EASE_DRAWER = [0.32, 0.72, 0, 1] as const
export const EASE_SPRING = { type: 'spring', stiffness: 420, damping: 32 }

export const fadeUp   = (delay = 0) => ({ ... })  // entrada con Y offset
export const fadeIn   = (delay = 0) => ({ ... })  // fade puro
export const scaleIn  = { ... }                   // escala desde 0.96
export const slideInRight = { ... }               // panel desde derecha
export const listContainer / listItem             // stagger 35ms entre items
```

### Clases de animación CSS (sin JS)
```css
.animate-fade-up    /* fadeUp 0.4s ease-expo */
.animate-fade-in    /* fadeIn 0.3s ease */
.animate-scale-in   /* scaleIn 0.3s ease-expo */
.animate-slide-up   /* fadeUp 0.45s ease-expo */

/* Delays escalonados */
.delay-0  /* 0ms */
.delay-1  /* 60ms */
.delay-2  /* 120ms */
.delay-3  /* 180ms */
.delay-4  /* 240ms */
.delay-5  /* 300ms */
.delay-6  /* 360ms */
```

### Duraciones estándar
| Tipo | Duración |
|---|---|
| Micro-interacción (hover, press) | 150ms |
| Transición de estado | 200ms |
| Entrada de elemento | 300–380ms |
| Entrada de panel / drawer | 380ms |
| Stagger entre items de lista | 35ms |

---

## Componentes base

### Card
```css
.card {
  background: var(--bg-card);
  border: 1px solid var(--br);
  box-shadow: 0 1px 3px rgba(12,12,9,0.06), 0 1px 2px rgba(12,12,9,0.04);
  border-radius: 12px;
}
.card:hover {
  border-color: var(--br-mid);
  box-shadow: 0 4px 16px rgba(12,12,9,0.08), 0 2px 6px rgba(12,12,9,0.05);
}
.card-selected {
  background: var(--accent-surface);
  border-color: var(--accent-border-mid);
}
```

### Botones
```css
/* Primario — fondo negro, texto blanco */
.btn-primary {
  background: var(--fg);      /* #0c0c09 */
  color: #ffffff;
  font-weight: 600;
  font-size: 13px;
  letter-spacing: -0.01em;
  border-radius: 8px;
  padding: 9px 18px;
  transition: transform 150ms ease-out, box-shadow 150ms ease-out;
}
.btn-primary:hover  { background: #1a1a16; box-shadow: 0 4px 14px rgba(12,12,9,0.20); }
.btn-primary:active { transform: scale(0.97); }

/* Secundario — fondo blanco, borde */
.btn-secondary {
  background: var(--bg-card);
  border: 1px solid var(--br-mid);
  font-weight: 500;
  font-size: 13px;
}
```

**Nunca usar el acento `#E9FF7B` como background de botón** — es demasiado brillante para texto oscuro en interacción. Se usa solo como indicador, badge, o focus ring.

### Inputs
```css
.input-field {
  background: var(--bg-card);
  border: 1px solid var(--br-mid);
  border-radius: 12px;
  padding: 13px 16px;
  font-size: 15px;
}
.input-field:focus {
  border-color: var(--accent-border-focus);
  box-shadow: 0 0 0 3px var(--accent-focus-ring);  /* glow lima suave */
}
```

### Status Badge (para estados semánticos)
```tsx
// Color con 12% opacidad de fondo, 22% de borde
<span style={{
  background: `${color}12`,
  color,
  border: `1px solid ${color}22`,
  fontWeight: 500,
  letterSpacing: '-0.01em',
  borderRadius: 6,
  padding: '2px 8px',
  fontSize: 12,
}} />
```

### StatBlock (KPIs / métricas)
```tsx
// Número grande con label caps debajo
<div>
  <div style={{ fontFamily: 'var(--font-geist-mono)', fontSize: 20, fontWeight: 700,
                letterSpacing: '-0.025em', color }}>
    {value}
  </div>
  <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.12em',
                color: 'var(--text-ghost)', marginTop: 6 }}>
    {label}
  </div>
</div>
```

### Sticky nav con glassmorphism
```tsx
// Patrón para navbars que scrollean
<div style={{
  position: 'sticky', top: 0, zIndex: 40,
  background: 'rgba(243,242,238,0.88)',
  backdropFilter: 'blur(20px)',
  borderBottom: '1px solid rgba(12,12,9,0.09)',
}} />
```

### Sidebar
- Ancho fijo: `220px`
- `height: 100dvh`, `position: sticky`, `top: 0`
- Logo 72px, filter `brightness(0)` para versión negra
- Indicador de item activo: barra izquierda `3px` con `motion.div` `layoutId="sidebar-active"`
- Font size links: `13px`, activo `fontWeight: 600`, inactivo `var(--t-subtle)`

---

## Layout y espaciado

```css
/* Espaciado — siempre múltiplos de 4 */
4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48 · 64 · 80 · 96

/* Radios */
--radius-sm:   4px
--radius-md:   8px
--radius-lg:  12px   ← cards, inputs
--radius-xl:  16px
--radius-2xl: 20px
--radius-full: 9999px ← pills, badges
```

### Anchos de contenido
```tsx
maxWidth: '56rem'   // Detalle de lead / página de contenido
maxWidth: '72rem'   // Tablas / listados amplios
padding: '0 2.5rem' // Horizontal estándar
```

---

## Principios de diseño

### Lo que SÍ hacer
- Fondo crema `#f3f2ee` — nunca blanco puro como fondo de página
- Jerarquía tipográfica agresiva: mucha diferencia entre display y body
- Números siempre en Geist Mono, `tabular-nums`, tracking negativo
- Hover states sutiles: `rgba(12,12,9,0.03–0.05)` de tinte sobre bg
- Transiciones en `border-color` y `box-shadow`, no en `background` (más rápido)
- `press` class en cualquier elemento clickeable: `transform: scale(0.97)` en `:active`
- Stagger de 35ms en listas para sensación de vida
- El acento lima en: focus rings, selection, indicadores de estado activo, highlights

### Lo que NO hacer
- Sin emojis en ningún elemento de UI
- Sin colores saturados de fondo (gradientes, fondos de colores) — el acento va solo en detalles
- Sin sombras grandes en elementos pequeños — escalar: `sh-sm` para cards, `sh-md` en hover, `sh-lg` para modales
- Sin `font-weight: 400` en labels — mínimo `500`
- Sin borders en texto — solo en contenedores
- Sin `transition: all` — listar propiedades específicas

---

## Estructura de archivos (referencia)

```
src/
├── app/
│   ├── layout.tsx          # Root layout, fuentes, metadata
│   ├── globals.css         # Design tokens, clases base, animaciones
│   ├── pipeline/
│   │   ├── layout.tsx      # Shell con Sidebar
│   │   ├── page.tsx        # Server component → PipelineClient
│   │   ├── PipelineClient.tsx  # 'use client' — tabla interactiva
│   │   └── [slug]/         # Detalle de lead
│   └── api/b2b/            # Route handlers
├── components/
│   ├── Sidebar.tsx
│   └── ui/
│       ├── StatusBadge.tsx
│       ├── StatBlock.tsx
│       ├── EmptyState.tsx
│       ├── FilterChip.tsx
│       └── SectionLabel.tsx
└── lib/
    ├── motion.ts           # Variantes Framer Motion centralizadas
    ├── b2b-types.ts        # Tipos TypeScript del dominio
    ├── b2b-supabase.ts     # Queries Supabase
    └── session.ts          # Auth helpers
```

---

## Skills de diseño a invocar

Para trabajar en este ecosistema, invocar en este orden de prioridad:

1. **`/taste-skill`** — criterio de UI/UX senior, valida decisiones antes de implementar
2. **`/top-design`** — calidad de diseño premium, estética ganadora
3. **`/layout`** — spacing, grid, composición visual
4. **`/typeset`** — tipografía: tamaño, tracking, jerarquía
5. **`/animate`** — micro-interacciones con los easings y duraciones del sistema
6. **`/polish`** — revisión final antes de entregar, detecta inconsistencias
7. **`/colorize`** — solo si se introduce color nuevo — validar contra la paleta existente
8. **`/distill`** — si algo se siente recargado, simplificar al mínimo expresivo
9. **`/bolder`** — si algo se siente plano o seguro de más
10. **`/harden`** — producción: estados vacíos, loading, errores, edge cases

---

## Reglas de oro para nuevos proyectos

```
1. Fondo: #f3f2ee — siempre
2. Acento: #E9FF7B — solo en detalles, nunca como color dominante
3. Fuente: Geist sans para texto, Geist Mono para números
4. Sin emojis. Nunca.
5. Animaciones desde motion.ts — no inventar easings nuevos
6. Hover = opacity/border shift suave. Active = scale(0.97).
7. Cards blancas sobre fondo crema, borde rgba tenue, sombra pequeña
8. Labels siempre en caps con tracking amplio y color var(--t-faint)
9. Server components por defecto, 'use client' solo donde hay interactividad
10. Iconos lucide-react — consistencia strokeWidth
```
