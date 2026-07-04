# Remote Intelligence

A production-grade SaaS platform that automatically discovers companies actively hiring remotely and allows users to search, filter, enrich, and generate leads from those companies.

## Features

- **Automated Discovery**: Scrapes 25+ job boards and ATS platforms for remote jobs
- **Company Intelligence**: Enriches company profiles with AI-generated scores and analysis
- **Advanced Search**: Full-text search with filters for country, industry, technology, remote status, and more
- **Beautiful Dashboard**: Real-time statistics, charts, and recent scrape logs
- **Export**: Download data as CSV, Excel, or JSON
- **Authentication**: JWT-based auth with role-based access control (Admin/User)
- **Dark Mode**: Full dark/light theme support
- **Responsive**: Works on desktop and mobile

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, SCSS Modules, Recharts, TanStack Query, Zustand
- **Backend**: Next.js API Routes, Prisma, PostgreSQL, Redis, BullMQ
- **Scraping**: Playwright, Cheerio, Axios with anti-bot measures
- **AI**: OpenAI, Gemini, OpenRouter support for enrichment
- **DevOps**: Docker, Docker Compose

## Quick Start

### Prerequisites

- Node.js 20+
- Docker & Docker Compose (optional)
- PostgreSQL (if not using Docker)
- Redis (if not using Docker)

### Environment Setup

```bash
cp .env.example .env
# Edit .env with your configuration
```

### Option 1: Docker (Recommended)

```bash
docker-compose up -d
```

This starts PostgreSQL, Redis, and the Next.js app.

### Option 2: Local Development

```bash
# Install dependencies
npm install --legacy-peer-deps

# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# Seed the database
npm run db:seed

# Start development server
npm run dev
```

The app will be available at `http://localhost:3000`.

### Default Credentials

- **Admin**: `admin@remoteintelligence.com` / `admin123`
- **User**: `user@example.com` / `user123`

## Project Structure

```
app/
  (dashboard)/          # Dashboard pages (protected)
    page.tsx            # Dashboard home
    companies/          # Company listing
    jobs/               # Job listing
    search/             # Global search
    saved-searches/     # Saved searches
    settings/           # User settings
    admin/              # Admin panel
  api/                  # API routes
    auth/               # Authentication
    companies/          # Company CRUD
    jobs/               # Job CRUD
    search/             # Search endpoint
    dashboard/          # Stats endpoint
    scrape/             # Trigger scrapes
    export/             # Export data
    enrich/             # Trigger enrichment
components/
  ui/                   # Reusable UI components
  layout/               # Sidebar, header, dashboard layout
  tables/               # Data tables
  charts/               # Chart components
  forms/                # Filter panels, search forms
  auth/                 # Auth components
  providers/            # Context providers
lib/
  prisma.ts             # Prisma client
  redis.ts              # Redis client
  auth.ts               # Auth utilities
  logger.ts             # Winston logger
  validation.ts         # Zod schemas
  query-client.ts       # React Query client
repositories/
  company.repository.ts
  job.repository.ts
  user.repository.ts
services/
  scraper/              # Scraper implementations
  enrichment/           # AI enrichment services
  auth/                 # Auth service
  export/               # Export service
  queue/                # BullMQ queues and workers
  scheduler/            # Cron jobs
prisma/
  schema.prisma         # Database schema
  seed.ts               # Seed data
```

## API Documentation

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login with email/password |
| POST | `/api/auth/register` | Register new account |
| POST | `/api/auth/refresh` | Refresh access token |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/auth/me` | Get current user |

### Companies

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/companies` | List companies with filters |
| GET | `/api/companies/:id` | Get company details |

### Jobs

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/jobs` | List jobs with filters |
| GET | `/api/jobs/:id` | Get job details |

### Search & Analytics

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/search?q=...` | Global search |
| GET | `/api/dashboard` | Dashboard statistics |
| GET | `/api/industries` | List industries |
| GET | `/api/countries` | List countries |

### Admin

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/scrape` | Trigger scrapers (Admin only) |
| POST | `/api/export` | Export data |
| POST | `/api/enrich` | Trigger enrichment (Admin only) |

## Scrapers

The platform includes scrapers for:

- **Tier 1**: RemoteOK, We Work Remotely, Himalayas, Jobspresso, Remote.co, Startup.jobs
- **Tier 2 (ATS)**: Greenhouse, Lever, Ashby, Workable, SmartRecruiters, Teamtailor, BambooHR, Personio, Recruitee, Comeet, Jobvite
- **Tier 3**: Indeed, ZipRecruiter, LinkedIn, Glassdoor, Google Jobs, Y Combinator Jobs, Wellfound, Arc.dev

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `REDIS_HOST` | Redis host | Yes |
| `JWT_SECRET` | Secret for JWT signing | Yes |
| `OPENAI_API_KEY` | OpenAI API key | No |
| `GEMINI_API_KEY` | Gemini API key | No |
| `OPENROUTER_API_KEY` | OpenRouter API key | No |
| `LOG_LEVEL` | Logging level (debug, info, warn, error) | No |

## Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run db:generate  # Generate Prisma client
npm run db:migrate   # Run database migrations
npm run db:push      # Push schema to database
npm run db:studio    # Open Prisma Studio
npm run db:seed      # Seed database with sample data
npm run worker       # Start background workers
npm run lint         # Run ESLint
npm run typecheck    # Run TypeScript type checking
```

## Docker

```bash
# Development
docker-compose up -d

# Production build
docker build --target production -t remote-intelligence .
```

## Scaling Recommendations

- Use Redis Sentinel or Redis Cluster for high availability
- Scale workers horizontally for parallel scraping
- Use PostgreSQL read replicas for API queries
- Implement CDN for static assets
- Use connection pooling for database connections

## License

MIT
