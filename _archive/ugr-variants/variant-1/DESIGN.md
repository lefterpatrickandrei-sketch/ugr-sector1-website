# Design System: UGR Filiala Sector 1 — Variant 1 (Tech-Precision Grid — Emerald Edition)

## 1. Visual Theme & Atmosphere
A clean, mathematically precise technical dashboard interface layout. The atmosphere is clinical, professional, and high-fidelity — reflecting the exact engineering standards of geodesy, topography, and mapping. Spatial grid patterns (40px mesh) combined with a dark-tinted 3D interactive globe build a feeling of spatial-structural intelligence. 

- **Density:** Technical Balanced (5/10)
- **Variance:** Restrained Clean (6/10)
- **Motion:** Heavy spring physics and viewport transitions (5/10)

## 2. Color Palette & Roles
- **Canvas White** (#F1F5F9) — Base color for text layout, avoiding stark pure white to minimize eye strain.
- **Deep Space Obsidian** (#070B12) — Primary institutional brand background color.
- **Gunmetal Slate Card** (#0E1624) — Secondary background for select dropdowns, cards, modals, and navigation drawers.
- **Vibrant Laser Emerald** (#10B981) — Primary high-contrast technical accent color for active links, buttons, borders, and state indicators.
- **Mint Green** (#34D399) — Brand auxiliary accent color, indicating active status and satellite arcs.

## 3. Typography Rules
- **Display Headlines:** `Space Grotesk` — Geo-humanist geometric display face. Track-tight (`tracking-tight`), weight-driven hierarchy, and clamp-scaled (`clamp(32px, 4vw, 52px)`).
- **Body & Description:** `Plus Jakarta Sans` — Premium geo-humanist sans-serif for relaxed reading, replacing standard default fonts like Inter.
- **Technical Mono:** `IBM Plex Mono` — For ID displays, coordinate inputs, system parameters, and time stamps.

## 4. Component Stylings
- **Buttons (Button-in-Button architecture):**
  - Fully rounded pills (`rounded-full`) with a nested trailing icon circle.
  - Interactive: `-1px translate` on hover, and `scale-[0.97]` on click for tactile push feedback.
- **Card Containers (Double-Bezel nested architecture):**
  - Outer Shell: `bg-white/[0.02] rounded-[2rem] border border-white/[0.06] shadow-2xl`
  - Inner Core: `bg-ink-soft/40 rounded-[calc(2rem-0.625rem)] border border-white/[0.04] p-5`
- **Badges:** Micro-pills with 15% opacity tint (`bg-contour/15 text-contour` or `bg-brass/5 text-brass-light`) and a mono bullet indicator (`● Activ`).

## 5. Layout Principles
- **Macro-Whitespace:** Generous spacing (`py-20`) to allow data blocks to breathe.
- **Responsive Architecture:** Multi-column layouts collapse to a clean single column (`grid-cols-1`) on mobile viewports (< 768px). 
- **Bento Badges:** Grid columns replace spreadsheet lines to show information chunk summaries without long borders.

## 6. Motion & Interaction
- Custom cubic-bezier animation transitions (`cubic-bezier(0.16, 1, 0.3, 1)`) for element entry reveals.
- Hover-physics: nested button icons translate horizontally/diagonally (`group-hover:translate-x-1`) to simulate physical movement.

## 7. Anti-Patterns (Banned)
- No `Inter` or standard browser system fonts for display elements.
- No harsh, pure-black shadows (`rgba(0,0,0,0.3)`) — shadows must be soft, light-tinted overlays.
- No generic Lucide icons.
- No simple spreadsheet lines (`border-b`) for spec lists.
- No excessive use of uppercase eyebrows.
