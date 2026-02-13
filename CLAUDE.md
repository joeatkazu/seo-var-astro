# KeresoPartner — Astro Website

Hungarian SEO & AI search optimization agency website. Built with Astro, Tailwind CSS v4, and React (for interactive components).

## Project Structure

```
seo-var-astro/
├── src/
│   ├── pages/
│   │   ├── index.astro              # Homepage (assembles section components)
│   │   ├── 404.astro
│   │   ├── blog/
│   │   │   ├── index.astro          # Blog listing
│   │   │   └── [slug].astro         # Blog post template
│   │   └── szolgaltatasok/
│   │       └── [slug].astro         # Service page template (Hero + MDX Content + CTA)
│   ├── layouts/
│   │   └── BaseLayout.astro         # Shared <head>, fonts, schema.org, toaster
│   ├── components/
│   │   ├── Navbar.astro             # Fixed top nav (desktop + mobile)
│   │   ├── Footer.astro
│   │   ├── HeroSection.astro        # Homepage hero with /hero.png
│   │   ├── ServicesSection.astro    # 6-card grid, links to /szolgaltatasok/{slug}
│   │   ├── AboutSection.astro
│   │   ├── CTASection.astro
│   │   ├── WhyChooseUs.astro
│   │   ├── StatsSection.astro       # Currently commented out on homepage
│   │   ├── TestimonialsSection.astro # Currently commented out on homepage
│   │   ├── LogoBar.astro            # Currently commented out on homepage
│   │   ├── ContactSection.tsx       # React — HubSpot form (client:load)
│   │   ├── MobileMenu.tsx           # React — hamburger menu (client:load)
│   │   ├── service/
│   │   │   ├── Benefits.astro       # Reusable benefit cards (used in service MDX)
│   │   │   └── ProcessSteps.astro   # Reusable numbered steps (used in service MDX)
│   │   └── ui/                      # shadcn/ui primitives (button, input, toast, etc.)
│   ├── content/
│   │   ├── config.ts                # Zod schemas for posts + services collections
│   │   ├── posts/                   # Blog MDX files
│   │   └── services/                # Service MDX files (6 total)
│   ├── styles/
│   │   └── global.css               # Tailwind v4 config, CSS variables, light theme
│   ├── hooks/
│   │   └── use-toast.ts
│   └── lib/
│       └── utils.ts                 # cn() helper
├── public/
│   └── hero.png                     # Homepage hero image
├── astro.config.mjs                 # Integrations: react, mdx, sitemap. Site: keresopartner.hu
└── package.json
```

## Key Patterns

### Service Pages (MDX + Components)
Service pages use a composable MDX pattern. The `[slug].astro` template renders only the Hero and CTA. All middle content is controlled from each `.mdx` file using imported Astro components:

```mdx
import Benefits from '@/components/service/Benefits.astro';
import ProcessSteps from '@/components/service/ProcessSteps.astro';

<Benefits accentColor="blue" title="Custom heading" items={[...]} />

## Free-form markdown works here too

<ProcessSteps accentColor="blue" items={[{ step: "...", description: "..." }]} />
```

Components use `not-prose` class to escape the prose wrapper styling. Both `title` and section order are fully flexible per-page.

### Content Collections
- `posts`: title, date, author, readTime, coverImage, tags
- `services`: title, longDescription, icon (lucide name), accentColor

### Design System
- Light theme only, CSS custom properties in `global.css` (e.g. `--primary: 221 83% 53%`)
- Tailwind v4 with `@tailwindcss/typography` plugin
- Accent colors per service: blue, indigo, teal, purple, orange, pink
- Icons: `lucide-react` (used in both React and Astro components)

### Deployment
- Hosted on Vercel, auto-deploys from `main` branch
- Sitemap auto-generated at `/sitemap-index.xml` via `@astrojs/sitemap`
- Domain: keresopartner.hu

## Commands
```
npm run dev      # Start dev server
npm run build    # Production build (npx astro build)
npm run preview  # Preview production build locally
```

## Language
All user-facing content is in Hungarian. The site uses `lang="hu"`.
