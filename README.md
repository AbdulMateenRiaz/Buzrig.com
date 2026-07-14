# Buzrig — Autonomous AI Penetration Testing

Buzrig is an AI-powered security platform that continuously pentests your infrastructure, discovers vulnerabilities, and ships the actual code fix as a pull request.

🌐 **Live:** [buzrig.com](https://buzrig.com)  
🔧 **API:** [buzrig-api.onrender.com](https://buzrig-api.onrender.com/api/health)

---

## Project Structure

```
├── src/                    # Frontend (React + Vite + TypeScript)
│   ├── components/         # Reusable UI components
│   ├── pages/              # Route pages
│   ├── lib/                # API client, auth, hooks
│   └── index.css           # Global styles (Tailwind)
│
├── server/                 # Backend (Fastify + Prisma + PostgreSQL)
│   ├── src/
│   │   ├── config/         # Database, Redis, environment config
│   │   ├── lib/            # Utilities (errors, validation, JWT, logger)
│   │   ├── middleware/     # Auth, error handling
│   │   ├── routes/         # API endpoints
│   │   └── services/       # Business logic
│   │       ├── llm/        # AI remediation, attack chains, PoC generation
│   │       ├── scanner/    # Vulnerability scanner (5 modules)
│   │       ├── github/     # GitHub PR creation
│   │       ├── queue/      # BullMQ job workers
│   │       └── email/      # Resend email service
│   └── prisma/             # Database schema
│
├── public/                 # Static assets (favicon, OG image)
├── vercel.json             # Frontend deployment config
└── package.json            # Frontend dependencies
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, Recharts |
| Backend | Fastify, TypeScript, Prisma ORM |
| Database | PostgreSQL (Neon) |
| Queue | BullMQ + Redis (Upstash) |
| AI | OpenAI GPT-4o |
| Auth | JWT + GitHub OAuth |
| Email | Resend |
| Hosting | Vercel (frontend) + Render (backend) |

---

## Features

### Frontend (10 pages)
- Landing page with animated terminal, comparison table, FAQ
- Dashboard with security score gauge, activity feed, charts
- Scans management (create, pause, resume, cancel)
- Vulnerability list with severity filtering
- Attack chain visualization
- Remediation PR tracking
- Compliance framework mapping
- Settings (targets, integrations, team)
- Auth (login, signup, forgot password, GitHub OAuth)
- Legal pages (privacy, terms, security, about)

### Backend (30+ API endpoints)
- JWT auth with refresh token rotation
- GitHub OAuth flow
- Password reset via email
- Target CRUD with duplicate detection
- Scan orchestration with state machine
- Vulnerability lifecycle management
- LLM-powered code fix generation
- GitHub PR creation (full git workflow)
- Attack chain AI analysis
- Proof-of-concept generation
- Compliance scoring
- Real-time WebSocket feed
- Audit logging
- Rate limiting & RBAC

### Scanner (5 modules)
- Security Headers (HSTS, CSP, cookies)
- Injection (SQLi, XSS, SSRF, template injection)
- Web App (redirects, directory listing, sensitive files)
- API Security (IDOR, info disclosure, verb tampering)
- Auth (default creds, rate limiting, JWT, CORS)

---

## Local Development

### Frontend
```bash
npm install
npm run dev          # http://localhost:5173
```

### Backend
```bash
cd server
npm install
npx prisma db push   # create tables
npx tsx src/seed.ts  # seed demo data
npm run dev          # http://localhost:3001
```

### Environment Variables
Copy `.env.example` to `.env` in the server directory and fill in values.

---

## Deployment

- **Frontend:** Auto-deploys to Vercel on push to `main`
- **Backend:** Auto-deploys to Render on push to `main`
- **Database:** Neon PostgreSQL (free tier)
- **Redis:** Upstash (free tier, optional)

---

## Demo Credentials

After seeding the database:
- Email: `demo@buzrig.com`
- Password: `Demo@1234`

---

## License

Proprietary. All rights reserved.
