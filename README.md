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
└── index.html        # HTML template
```

## Code Quality

- **Linting**: `npm run lint`
- **Formatting**: `npm run format`
