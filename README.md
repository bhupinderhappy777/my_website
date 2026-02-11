# Modern Website

A modern, beautiful, and responsive website built with React, Vite, and Tailwind CSS.

## Features

- ⚡ **Lightning Fast**: Built with Vite for instant hot module replacement and optimized production builds
- 📱 **Mobile First**: Designed with mobile devices in mind, ensuring perfect responsiveness on all screen sizes
- 🌓 **Dark Mode**: Beautiful dark mode implementation that respects user preferences and system settings
- 🎨 **Modern Design**: Clean, professional aesthetic with rounded corners, generous spacing, and smooth animations
- ♿ **Accessible**: High contrast ratios and proper semantic HTML for better accessibility
- 📚 **Cloud+ Exam Prep**: Enhanced quiz platform with 615 challenging Cloud Plus questions

## Cloud Plus Exam Preparation

This repository includes a comprehensive Cloud+ exam preparation quiz with **615 enhanced questions** that are **harder than the actual CompTIA Cloud+ exam**. The questions have been transformed from simple, straightforward questions into complex, scenario-based questions requiring critical thinking.

### Features
- 🎯 **615 Enhanced Questions** across 6 Cloud+ domains
- 💼 **Realistic Business Scenarios** (healthcare, finance, retail, government, etc.)
- 📊 **Quantified Requirements** (latency, uptime, transactions, compliance)
- 🧠 **Critical Thinking Required** - all options appear plausible
- 📝 **CompTIA-Style Format** - wordy, detailed scenarios
- ✅ **Comprehensive Explanations** for each answer

### Question Categories
1. **Cloud Architecture** (115 questions) - Service models, deployment models, shared responsibility
2. **Deployment** (100 questions) - Multi-region, blue-green, canary, migration strategies
3. **Security** (100 questions) - Encryption, compliance, access control, threat prevention
4. **Operations** (100 questions) - Monitoring, backup/recovery, performance optimization
5. **DevOps Fundamentals** (100 questions) - CI/CD, IaC, automation, containerization
6. **Troubleshooting** (100 questions) - Root cause analysis, cascading failures, debugging

### Enhancement Details
See [CLOUD_PLUS_ENHANCEMENTS.md](./CLOUD_PLUS_ENHANCEMENTS.md) for complete documentation of enhancements.

**Statistics:**
- Average question length: **692 characters** (was 43 chars)
- Content size: **1.3 MB** (was 265 KB)
- Scenario-based: **81%** of questions
- Difficulty: **Harder than actual exam**

### Using the Quiz
Open `public/quiz/cloud_plus.html` in a browser to access the quiz platform with:
- Browse all questions by category
- Take practice quizzes with randomized questions
- Review mode with instant answer feedback
- Progress tracking

**Study Tip:** If you can answer these enhanced questions, the actual Cloud+ exam will be significantly easier!

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
