---
name: <!-- PROJECT: kebab-case theme name -->
version: 1.0
source: created
parents: []
mood: <!-- PROJECT: 3-5 adjectives. e.g. "minimal, spacious, professional" -->
best_for: <!-- PROJECT: 1-line description of when to use this theme -->
---

# Theme: <!-- PROJECT: theme name in title case -->

## Philosophy

<!-- PROJECT: 2-3 sentences. What is this theme going for? What's the feeling? What's the intended user reaction? Avoid design jargon — write what you'd tell a non-designer. -->

## When to use this

- <!-- PROJECT: a specific use case -->
- <!-- PROJECT: another use case -->
- <!-- PROJECT: another use case -->

## When NOT to use this

- <!-- PROJECT: a specific anti-use case -->
- <!-- PROJECT: another anti-use case -->

## Design tokens

The machine-readable source of truth. Implementations reference these directly via CSS variables, Tailwind config, etc.

```json
{
  "colors": {
    "background": "#ffffff",
    "surface": "#f8fafc",
    "primary": "#0f172a",
    "primary_hover": "#1e293b",
    "accent": "#3b82f6",
    "accent_hover": "#2563eb",
    "text": "#0f172a",
    "text_muted": "#64748b",
    "text_inverse": "#ffffff",
    "border": "#e2e8f0",
    "danger": "#ef4444",
    "success": "#10b981",
    "warning": "#f59e0b"
  },
  "typography": {
    "font_heading": "Inter, -apple-system, sans-serif",
    "font_body": "Inter, -apple-system, sans-serif",
    "font_mono": "JetBrains Mono, monospace",
    "scale_px": [12, 14, 16, 18, 20, 24, 32, 48, 64],
    "weight_regular": 400,
    "weight_medium": 500,
    "weight_bold": 700,
    "line_height_tight": 1.2,
    "line_height_body": 1.5,
    "line_height_loose": 1.7
  },
  "spacing": {
    "scale_px": [4, 8, 12, 16, 24, 32, 48, 64, 96, 128]
  },
  "radii": {
    "none": "0",
    "sm": "4px",
    "md": "8px",
    "lg": "12px",
    "xl": "16px",
    "full": "9999px"
  },
  "shadows": {
    "none": "none",
    "sm": "0 1px 2px rgba(0,0,0,0.05)",
    "md": "0 4px 6px rgba(0,0,0,0.07)",
    "lg": "0 10px 15px rgba(0,0,0,0.10)",
    "xl": "0 25px 50px rgba(0,0,0,0.15)"
  },
  "motion": {
    "duration_fast_ms": 150,
    "duration_normal_ms": 250,
    "duration_slow_ms": 400,
    "easing_standard": "cubic-bezier(0.4, 0.0, 0.2, 1)",
    "easing_decel": "cubic-bezier(0.0, 0.0, 0.2, 1)",
    "easing_accel": "cubic-bezier(0.4, 0.0, 1, 1)"
  }
}
```

## Component examples

Reference implementations showing how core components look under this theme. Implementations in any framework can use these as a starting point; agents reference them when generating new components.

### Button — primary

```html
<button class="theme-btn theme-btn-primary">Continue</button>

<style>
.theme-btn-primary {
  background: var(--color-primary);
  color: var(--color-text-inverse);
  padding: var(--space-3) var(--space-5);
  border-radius: var(--radius-md);
  font-weight: var(--font-weight-medium);
  border: none;
  cursor: pointer;
  transition: background var(--duration-fast) var(--easing-standard);
}
.theme-btn-primary:hover { background: var(--color-primary-hover); }
</style>
```

### Card

```html
<article class="theme-card">
  <h3>Card title</h3>
  <p>Card body content.</p>
</article>

<style>
.theme-card {
  background: var(--color-surface);
  padding: var(--space-5);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  border: 1px solid var(--color-border);
}
</style>
```

### Input — text

```html
<input class="theme-input" type="text" placeholder="Enter value" />

<style>
.theme-input {
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-3);
  font-size: var(--font-size-2);
  width: 100%;
}
.theme-input:focus {
  outline: 2px solid var(--color-accent);
  outline-offset: 1px;
}
</style>
```

## Notes

<!-- PROJECT: anything else worth saying about this theme. Edge cases. Components that don't follow the pattern (with reasons). Accessibility considerations specific to the palette (e.g., "the muted text on surface meets AA contrast"). -->
