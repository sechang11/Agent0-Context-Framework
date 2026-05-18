---
name: bold-tech
version: 1.0
source: created
parents: []
mood: high-contrast, dense, technical, opinionated
best_for: developer tools, terminals-in-the-browser, technical dashboards, internal tooling for engineers
---

# Theme: Bold Tech

## Philosophy

High contrast, dense information, monospace accents. Built for users who would rather see more on screen and adjust their attention than see less and have everything spelled out. This theme assumes the user knows what they're doing and treats them accordingly.

The aesthetic borrows from terminals and code editors — confident defaults, no apology for being technical, decoration kept to a minimum because the data is the decoration.

## When to use this

- Developer tools — IDEs in the browser, terminals, code-adjacent UIs.
- Technical dashboards where information density beats whitespace.
- Internal tooling for engineering teams.
- Status pages, monitoring tools, log viewers.
- Anywhere users would rather see 50 rows of data than 10 with cards.

## When NOT to use this

- Consumer products. The density and contrast will feel hostile.
- Anything aimed at non-technical users — looks intimidating.
- Marketing sites or landing pages.
- Long-form reading. The font and density make sustained reading uncomfortable.

## Design tokens

```json
{
  "colors": {
    "background": "#0a0e14",
    "surface": "#11161f",
    "surface_elevated": "#1a212e",
    "primary": "#e6e8ee",
    "primary_hover": "#ffffff",
    "accent": "#5af78e",
    "accent_hover": "#7afaa1",
    "text": "#e6e8ee",
    "text_muted": "#7d8590",
    "text_inverse": "#0a0e14",
    "border": "#2a3140",
    "danger": "#ff5c5c",
    "success": "#5af78e",
    "warning": "#ffcc66",
    "info": "#5ac8fa"
  },
  "typography": {
    "font_heading": "'JetBrains Mono', 'SF Mono', Menlo, monospace",
    "font_body": "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    "font_mono": "'JetBrains Mono', 'SF Mono', Menlo, monospace",
    "scale_px": [11, 12, 13, 14, 16, 18, 22, 28, 40],
    "weight_regular": 400,
    "weight_medium": 500,
    "weight_bold": 600,
    "line_height_tight": 1.2,
    "line_height_body": 1.45,
    "line_height_loose": 1.6
  },
  "spacing": {
    "scale_px": [2, 4, 8, 12, 16, 20, 24, 32, 48, 64]
  },
  "radii": {
    "none": "0",
    "sm": "2px",
    "md": "4px",
    "lg": "6px",
    "xl": "8px",
    "full": "9999px"
  },
  "shadows": {
    "none": "none",
    "sm": "0 1px 0 rgba(0, 0, 0, 0.3)",
    "md": "0 2px 4px rgba(0, 0, 0, 0.4)",
    "lg": "0 4px 12px rgba(0, 0, 0, 0.5)",
    "xl": "0 8px 24px rgba(0, 0, 0, 0.6)"
  },
  "motion": {
    "duration_fast_ms": 100,
    "duration_normal_ms": 180,
    "duration_slow_ms": 300,
    "easing_standard": "cubic-bezier(0.4, 0.0, 0.2, 1)",
    "easing_decel": "cubic-bezier(0.0, 0.0, 0.2, 1)",
    "easing_accel": "cubic-bezier(0.4, 0.0, 1, 1)"
  }
}
```

## Component examples

### Table — dense data

```html
<table class="data-table">
  <thead>
    <tr><th>Status</th><th>Service</th><th>Latency</th><th>Updated</th></tr>
  </thead>
  <tbody>
    <tr><td><span class="status-ok">●</span> healthy</td><td>api-gateway</td><td>42ms</td><td>3s ago</td></tr>
    <tr><td><span class="status-warn">●</span> degraded</td><td>auth-service</td><td>1.2s</td><td>12s ago</td></tr>
  </tbody>
</table>

<style>
.data-table {
  width: 100%;
  font-family: var(--font-mono);
  font-size: 13px;
  border-collapse: collapse;
}
.data-table th, .data-table td {
  text-align: left;
  padding: 6px 12px;
  border-bottom: 1px solid var(--color-border);
}
.data-table th { color: var(--color-text-muted); font-weight: 500; }
.status-ok { color: var(--color-success); }
.status-warn { color: var(--color-warning); }
</style>
```

### Button — primary

```html
<button class="btn-primary">Deploy</button>

<style>
.btn-primary {
  background: var(--color-accent);
  color: var(--color-text-inverse);
  padding: 6px 14px;
  font-family: var(--font-mono);
  font-size: 13px;
  font-weight: 500;
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: background 100ms ease;
}
.btn-primary:hover { background: var(--color-accent-hover); }
</style>
```

### Code block

```html
<pre class="code-block"><code>$ deploy --env prod
[OK] build succeeded
[OK] tests passed
[OK] deploy complete
</code></pre>

<style>
.code-block {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 16px;
  font-family: var(--font-mono);
  font-size: 13px;
  line-height: 1.6;
  color: var(--color-text);
  overflow-x: auto;
}
</style>
```

## Notes

- This is a dark theme by default. There's an implicit assumption that users running developer tools have dark-mode preferences. A light variant could be derived if needed.
- The accent (`#5af78e`) is electric green — borrowed from terminal status conventions. Used for primary actions and "OK" status. Adjusting it changes the personality significantly.
- Headings are monospace. This is unusual and intentional. If headings need to be sans-serif (e.g., the product wants more approachability), use Inter via `font_body` for headings too — this is the most common variation users want.
- Information density is the point. Resist the urge to add padding "for clarity" — that's a different theme.
- Contrast ratios: `text` on `background` is 13.5:1, well above AAA. `text_muted` on `background` is 4.6:1, just above AA — fine for labels but don't push it lower.
