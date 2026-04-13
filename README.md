# Learn with Adhi

Unified Astro redesign for the Learn with Adhi hub and five courses.

## Stack

- Astro
- MDX content collections
- Vanilla CSS design tokens with Menor palette

## Local development

```bash
npm install
npm run dev
```

Build for production:

```bash
npm run build
npm run preview
```

## Structure

- `src/pages/index.astro`: learning hub
- `src/pages/[slug].astro`: dynamic course pages
- `src/content/courses/*.mdx`: five course contents
- `src/components/*`: shared component system
- `src/styles/*`: tokens, base, and component styles
- `legacy/*`: previous static HTML files kept for rollback
