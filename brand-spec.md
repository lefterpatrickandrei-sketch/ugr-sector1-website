# UGR Brand Specification (Sector 1)

This document contains the verified brand assets, color tokens, typography rules, and design guidelines for the UGR (Uniunea Geodezilor din România) Sector 1 platform.

## Color Tokens

The colors were extracted directly from the official UGR logo (`logo_geodez.png`) using pixel frequency analysis:

| Token Name | CSS Variable | Hex Value | Role & Usage |
| :--- | :--- | :--- | :--- |
| **UGR Navy** (30%) | `--ugr-navy` | `#0B2E4E` | Primary brand blue, headers/footers, dark panel backgrounds, primary texts |
| **UGR Accent** (10%) | `--ugr-accent` | `#127DC2` | High-visibility highlight, active links, CTAs, border highlights, map vectors |
| **UGR White** (60%) | `--ugr-white` | `#FAFBFC` | Main background color, light panels, structural pages |

## Typography

*   **Display / Headings**: `Archivo` (Sans-serif, technical geometric cuts resembling blueprint lettering and map coordinate typography).
*   **Body**: `Inter` (Clean, neutral, and highly readable on high-density screens).
*   **Monospace / Accents**: `IBM Plex Mono` (Used for technical data, tickers, coordinate readouts, and watermarks).

## Imagery & Assets

*   **Logo**: `logo_geodez.png` (Dimensions: 32x32px in header, object-fit contain).
*   **Source Images**: High-resolution photographs (width >= 800px) directly scraped from the official `ugr.ro` portal, showcasing actual field work, assemblies, and events.
*   **Watermarks**: All background carousel photos must carry a clean, technical watermark label in monospace (e.g., `SGR 2025 · TIMIȘOARA`).
