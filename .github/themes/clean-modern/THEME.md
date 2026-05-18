---
name: clean-modern
version: 1.0
source: created
parents: []
mood: minimal, spacious, professional, neutral
best_for: dashboards, B2B SaaS, productivity tools, documentation sites
---

# Theme: Clean Modern

## Philosophy

Generous whitespace, a single neutral palette, sans-serif everything. Content does the talking. Color is reserved for the one element that matters most on each screen — usually a primary action. Everything else recedes.

This is the "no surprises" theme. Familiar enough that users don't have to learn it; clean enough that the product's content is the only thing they remember.

## When to use this

- Productivity tools where speed of comprehension matters more than personality.
- B2B SaaS where users are at work and the product should not compete for attention with their actual job.
- Dashboards displaying data — color is reserved for meaning (status, trend, alert), not decoration.
- Documentation sites where reading is the entire job.

## When NOT to use this

- Consumer brands that need warmth or distinctiveness.
- Anywhere the product itself should feel exciting, expressive, or memorable.
- Sites competing in a crowded category where "looking like everyone else" is a negative.

## Design tokens

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
    "font_heading": "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    "font_body": "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    "font_mono": "'JetBrains Mono', 'SF Mono', Menlo, monospace",
    "scale_px": [12, 14, 16, 18, 20, 24, 32, 48, 64],
    "weight_regular": 400,
    "weight_medium": 500,
    "weight_bold": 600,
    "line_height_tight": 1.2,
    "line_height_body": 1.6,
    "line_height_loose": 1.8
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
    "sm": "0 1px 2px rgba(15, 23, 42, 0.05)",
    "md": "0 4px 6px rgba(15, 23, 42, 0.07)",
    "lg": "0 10px 15px rgba(15, 23, 42, 0.10)",
    "xl": "0 25px 50px rgba(15, 23, 42, 0.15)"
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

### Button — primary

```html
<button class="btn-primary">Continue</button>

<style>
.btn-primary {
  background: var(--color-primary);
  color: var(--color-text-inverse);
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 500;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background 150ms ease;
}
.btn-primary:hover { background: var(--color-primary-hover); }
.btn-primary:focus-visible { outline: 2px solid var(--color-accent); outline-offset: 2px; }
</style>
```

### Card

```html
<article class="card">
  <h3>Card title</h3>
  <p>Card body content sits comfortably here with reading-friendly line height.</p>
</article>

<style>
.card {
  background: var(--color-background);
  padding: 24px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  /* No shadow — borders carry the structure */
}
</style>
```

### Input — text

```html
<label class="field">
  <span class="field-label">Email</span>
  <input class="input" type="email" placeholder="you@example.com" />
</label>

<style>
.field-label { font-size: 13px; color: var(--color-text-muted); margin-bottom: 6px; display: block; }
.input {
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 10px 12px;
  font-size: 14px;
  width: 100%;
  transition: border-color 150ms ease;
}
.input:focus { outline: none; border-color: var(--color-accent); }
</style>
```

## Notes

- The accent color (`#3b82f6`) is used sparingly — only on primary actions and focused inputs. If everything is blue, nothing is.
- Borders carry structure more than shadows in this theme. Shadows are used for elevation cues (modals, dropdowns), not decoration.
- Text contrast: `text` on `background` is AAA; `text_muted` on `background` is AA. Don't use `text_muted` for anything users need to read carefully — labels and metadata only.
