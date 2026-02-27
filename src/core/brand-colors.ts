/**
 * Shared brand color constants for use in JavaScript-side theming.
 *
 * CSS custom properties (var(--mp-*)) cannot be used in APIs that accept
 * plain JS objects (CodeMirror's EditorView.theme(), Mermaid's themeVariables).
 * This module provides the single source of truth so hex values are never
 * scattered across component files.
 *
 * Keep these values in sync with src/styles/variables.css.
 */
export const BRAND = {
  /** Page / editor background — var(--mp-bg) */
  bg: '#322D2B',
  /** Surface panels — var(--mp-surface) */
  surface: '#2E3B30',
  /** Primary accent (gold) — var(--mp-primary) */
  primary: '#E4C56C',
  /** Secondary accent (green) — var(--mp-secondary) */
  secondary: '#1C6331',
  /** Body text — var(--mp-text) */
  text: '#F0E8D8',
  /** De-emphasised text — var(--mp-muted) */
  muted: '#8A7D5A',
  /** Code block background — var(--mp-code-bg) */
  codeBg: '#263029',
} as const

/* ------------------------------------------------------------------ */
/*  Derived / alpha helpers                                           */
/* ------------------------------------------------------------------ */

/**
 * Return an rgba() string for the primary gold at a given alpha.
 * The RGB components (228, 197, 108) correspond to BRAND.primary (#E4C56C).
 */
export function primaryAlpha(alpha: number): string {
  return `rgba(228, 197, 108, ${alpha})`
}

/* ------------------------------------------------------------------ */
/*  Mermaid-specific derived colors                                   */
/* ------------------------------------------------------------------ */

/**
 * Colors derived from the brand palette for Mermaid diagram theming.
 * These are intentional darkened / shifted variants that don't exist as
 * standalone CSS variables but are needed by Mermaid's theme engine.
 */
export const MERMAID_DERIVED = {
  /** Warm dark brown for primary node fill */
  primaryColor: '#3D3425',
  /** Darker green for secondary node fill */
  secondaryColor: '#0C4A23',
  /** Dark green-grey for tertiary node fill */
  tertiaryColor: '#263029',
  /** Warm dark surface for main background */
  mainBkg: '#352F2A',
} as const
