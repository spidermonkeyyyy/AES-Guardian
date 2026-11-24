# SANAD Design System

This is the current UI authority for the Android application. It supersedes earlier proposal documents where they conflict; historical reports remain unchanged.

## Product and language

SANAD supports French by default, Arabic (RTL), and English (LTR). It is an offline-first application for healthcare professionals to declare, follow up, and prevent occupational Accidents d'Exposition au Sang (AES). Use synthetic demonstration data only.

## Welcome and access

The welcome screen uses the existing `sanad_icon.png` asset unchanged, followed by the SANAD wordmark, the exact French tagline **« Déclarer. Suivre. Prévenir. »**, and a concise localized AES description. A compact French/Arabic/English selector remains at the upper-right. **« Commencer »** is the only welcome action and is disabled until SQLite is ready.

The welcome action opens a separate access screen with **« Se connecter »** and **« Mode démonstration »**. Sign-in must clearly disclose that real authentication is unavailable in this offline prototype; demonstration access preserves the existing disclaimer and role-picker flow. Role shortcuts do not belong on the welcome screen.

## Typography

Use the shared `AppText` semantic API (`display`, `title`, `section`, `card`, `subheading`, `body`, `bodyEmphasis`, `label`, `button`, `caption`, `metadata`) for rendered text. Use `AppTextInput` for editable text so the active locale selects the proper face.

| Usage | Typeface and available weights |
|---|---|
| Latin interface and body | IBM Plex Sans: 400, 500, 600, 700 |
| Arabic interface and body | IBM Plex Sans Arabic: 400, 500, 600, 700 |
| Section, card, and subsection headings | Readex Pro variable, weight 600 |

Font role selection lives in `src/theme/tokens/fontFamilies.ts`; bundled Android assets live in `android/app/src/main/assets/fonts`. `AppText` applies its resolved family after caller styles, preventing stale per-screen font aliases from overriding locale-aware typography. Keep body copy in IBM Plex Sans / IBM Plex Sans Arabic rather than applying Readex Pro indiscriminately.

## Icons and direction

Use `AppIcon` and `AppIconLabel` from `src/components/AppIcon.tsx` for functional interface icons. They resolve through the installed Hugeicons registry, use shared sizes and stroke widths, hide decorative glyphs from accessibility, and provide directional aliases (`back`, `forward`, `back-chevron`, `forward-chevron`) that resolve for RTL. Unsupported identifiers use the registered help-circle fallback. Preserve the SANAD logo as an image, not an icon.

## Visual and scope constraints

Retain SANAD green, accessible contrast, clear hierarchy, generous spacing, and readable multiline content. Keep controls and directional navigation consistent with the active locale; never mirror the SANAD logo. Do not add a welcome carousel, role or administrator shortcuts, new clinical workflows, production integrations, real clinical data, or database/CAPA scope.
