---
name: warm-editorial
version: 1.0
source: created
parents: []
mood: warm, content-focused, editorial, deliberate
best_for: blogs, long-form writing, content sites, newsletters, portfolios
---

# Theme: Warm Editorial

## Philosophy

This theme respects the reader. Serif headings signal "this is something to read"; warm off-white backgrounds reduce eye strain over long sessions; generous line height and paragraph spacing make text breathe. Color is muted by default and only emerges where it has meaning.

The product feels like something that took time to craft. Reading a page feels like reading a printed magazine, not skimming a feed.

## When to use this

- Blogs, essay sites, long-form writing platforms.
- Newsletters and content-focused publications.
- Portfolios where each piece deserves attention.
- Documentation that wants to feel approachable rather than corporate.
- Personal sites where craft matters.

## When NOT to use this

- Dashboards, data-heavy applications, or anywhere skimming beats reading.
- B2B utility software where users are at work.
- Anywhere users will spend less than 30 seconds per page on average.
- Touch-heavy mobile apps where serif fonts can feel out of place at small sizes.

## Design tokens

```json
{
  "colors": {
    "background": "#fdf9f3",
    "surface": "#f7f0e6",
    "primary": "#1a1410",
    "primary_hover": "#2a1f18",
    "accent": "#b34d2f",
    "accent_hover": "#9a3f23",
    "text": "#1a1410",
    "text_muted": "#6b5d50",
    "text_inverse": "#fdf9f3",
    "border": "#e6dcc8",
    "danger": "#c2410c",
    "success": "#3f7a4e",
    "warning": "#b08020"
  },
  "typography": {
    "font_heading": "'Source Serif Pro', 'Iowan Old Style', Georgia, serif",
    "font_body": "'Source Serif Pro', 'Iowan Old Style', Georgia, serif",
    "font_mono": "'IBM Plex Mono', 'SF Mono', Menlo, monospace",
    "scale_px": [13, 15, 17, 19, 22, 28, 36, 52, 72],
    "weight_regular": 400,
    "weight_medium": 500,
    "weight_bold": 700,
    "line_height_tight": 1.25,
    "line_height_body": 1.7,
    "line_height_loose": 1.9
  },
  "spacing": {
    "scale_px": [4, 8, 12, 20, 32, 48, 64, 96, 128, 160]
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
    "sm": "0 1px 2px rgba(26, 20, 16, 0.06)",
    "md": "0 2px 4px rgba(26, 20, 16, 0.08)",
    "lg": "0 6px 12px rgba(26, 20, 16, 0.10)",
    "xl": "0 12px 24px rgba(26, 20, 16, 0.12)"
  },
  "motion": {
    "duration_fast_ms": 200,
    "duration_normal_ms": 350,
    "duration_slow_ms": 600,
    "easing_standard": "cubic-bezier(0.4, 0.0, 0.2, 1)",
    "easing_decel": "cubic-bezier(0.0, 0.0, 0.2, 1)",
    "easing_accel": "cubic-bezier(0.4, 0.0, 1, 1)"
  }
}
```

## Component examples

### Article container

```html
<article class="prose">
  <h1>The title of the piece</h1>
  <p class="lede">An opening paragraph in slightly larger type, setting up what the reader is about to read.</p>
  <p>The body text in comfortable serif, with line height generous enough to scan and small enough to feel intimate.</p>
</article>

<style>
.prose {
  max-width: 680px;
  margin: 0 auto;
  padding: 64px 32px;
  font-family: var(--font-body);
  font-size: 19px;
  line-height: 1.7;
  color: var(--color-text);
}
.prose h1 {
  font-size: 52px;
  line-height: 1.2;
  margin-bottom: 32px;
  font-weight: 700;
}
.prose .lede {
  font-size: 22px;
  color: var(--color-text-muted);
  margin-bottom: 32px;
  line-height: 1.5;
}
</style>
```

### Button — primary

```html
<button class="btn-primary">Subscribe</button>

<style>
.btn-primary {
  background: var(--color-accent);
  color: var(--color-text-inverse);
  padding: 12px 24px;
  font-family: var(--font-body);
  font-size: 17px;
  font-weight: 500;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background 200ms ease;
}
.btn-primary:hover { background: var(--color-accent-hover); }
</style>
```

### Pull quote

```html
<blockquote class="pullquote">
  Something the writer wants to emphasize, set apart from the body of the text.
</blockquote>

<style>
.pullquote {
  border-left: 3px solid var(--color-accent);
  padding-left: 24px;
  margin: 32px 0;
  font-size: 22px;
  font-style: italic;
  color: var(--color-text);
  line-height: 1.5;
}
</style>
```

## Notes

- Background `#fdf9f3` is a warm off-white — never pure white. Pure white feels clinical in this theme.
- Body text size (19px default) is larger than most modern themes. This is deliberate — reading sessions are longer here than in a dashboard.
- The accent color (warm rust) is used for primary actions and pull-quote markers only. Don't sprinkle it as decoration.
- Letter-spacing is left at browser defaults — serif fonts don't need adjustment at these sizes.
