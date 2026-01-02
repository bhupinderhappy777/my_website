# Modern Website

A modern, beautiful, and responsive website built with React, Vite, and Tailwind CSS.

## Features

- ⚡ **Lightning Fast**: Built with Vite for instant hot module replacement and optimized production builds
- 📱 **Mobile First**: Designed with mobile devices in mind, ensuring perfect responsiveness on all screen sizes
- 🌓 **Dark Mode**: Beautiful dark mode implementation that respects user preferences and system settings
- 🎨 **Modern Design**: Clean, professional aesthetic with rounded corners, generous spacing, and smooth animations
- ♿ **Accessible**: High contrast ratios and proper semantic HTML for better accessibility

## Tech Stack

- **Framework**: React 19
- **Build Tool**: Vite 7
- **Styling**: Tailwind CSS 3
- **Code Quality**: ESLint + Prettier

## Getting Started

### Environment

Create a `.env` (or `.env.local`) in the project root with your Supabase credentials:

```
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-public-anon-key
```

Restart `npm run dev` after changing env vars.

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

### Build

```bash
npm run build
```

The build output will be generated in the `/dist` directory.

### Preview Production Build

```bash
npm run preview
```

## Deployment

This project is configured for deployment on Cloudflare Pages:

- **Build Command**: `npm run build`
- **Output Directory**: `dist`

## Project Structure

```
/
├── src/
│   ├── App.jsx       # Main application component
│   ├── index.css     # Global styles with Tailwind directives
│   └── main.jsx      # Application entry point
├── public/           # Static assets
├── dist/             # Build output (generated)
├── migrations/       # Database migrations (form_templates, forms, etc.)
└── index.html        # HTML template
```

## Forms Architecture (Supabase)

- `form_templates`: registry of PDF templates (name, pdf_url, company)
- `forms`: generic JSONB storage for any form type (`form_type='kyc'`, `trade_ticket`, etc.) plus status/version metadata
- `form_events`: immutable audit log for form actions (submitted, pdf_generated, etc.)
- Prefill flow: latest `forms` row per client+form_type, fallback to `clients`
- PDF generation: handled client-side via `kycFiller` → `pdfGenerator`
- Storage: PDFs uploaded to private `generated-pdfs` bucket with signed URLs for downloads

### Storage Setup

Create a private bucket for generated PDFs:

```sql
-- Create private bucket
insert into storage.buckets (id, name, public) values ('generated-pdfs', 'generated-pdfs', false)
on conflict (id) do nothing;

-- Authenticated users can upload/write
create policy "pdfs authenticated write"
on storage.objects for all
using (bucket_id = 'generated-pdfs' and auth.role() = 'authenticated')
with check (bucket_id = 'generated-pdfs' and auth.role() = 'authenticated');
```

PDFs are stored at paths like: `generated-pdfs/kyc/{clientId}/KYC_{clientName}_{date}.pdf`

## Code Quality

- **Linting**: `npm run lint`
- **Formatting**: `npm run format`
