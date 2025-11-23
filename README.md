# Educator Website — Income Growth, Financial Education, Self-Improvement

This repository contains a small React + Vite site that presents an educator-led offering focused on three core areas:

- Income Growth — practical frameworks to create multiple income streams
- Financial Education — clear, actionable financial lessons and systems
- Self-Improvement — habit design and accountability to turn plans into results

## Quick start

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

## Deployment (Cloudflare Pages)

Recommended: deploy as a static site on Cloudflare Pages.

- Build command: `npm run build`
- Build output directory: `dist`
- If you previously added a custom deploy step like `npx wrangler deploy`, remove it — Pages only needs the build command and `dist`.

If you prefer deploying site assets with Wrangler (Workers), add a `wrangler.toml` or `wrangler.jsonc` that points to `dist` as the site bucket/asset directory.

## What changed

This repository has been simplified to reflect the educator positioning: the homepage, programs, resources, and contact views have been updated to present a clean, actionable message for learners.

## Project structure

```
/
├── src/
│   ├── App.jsx       # Main application component (educator content)
│   ├── index.css     # Global styles
│   └── main.jsx      # Application entry point
├── public/           # Static assets (starter guide, images)
├── dist/             # Build output (generated)
└── index.html        # HTML template and metadata
```

If you want, I can further:

- Add a short signup form wired to Netlify/Forms or a simple Mailchimp link
- Create a downloadable `starter-guide.pdf` in `public/` and link it from Resources
- Prepare a `wrangler.jsonc` that uploads `dist` when you explicitly want Wrangler-based deploys

