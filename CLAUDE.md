# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Business Card Lead Manager MVP - A single-user system for scanning business cards, extracting contact info via OCR, organizing leads, and generating AI-powered email campaigns.

**Current Status**: Project setup phase (no implementation yet)

**Documentation Files**:
- `mvp-project-plan.md` - 14-day implementation roadmap
- `mvp-database-schema.md` - Complete PostgreSQL schema
- `updated-ui-design.md` - UI/UX specifications
- `claude-rules.md` - Development rules and conventions
- `docs/TECH-DEBT.md` - Technical debt and security TODOs (private, not committed)

## Essential Rules

1. **Environment Safety**: NEVER delete/rename/commit .env files. Update both .env and .env.example when adding variables.

2. **Port Management**: Use Slot B (ports 3002/8002) for Claude agents:
   ```bash
   # Before starting dev servers:
   echo "3002 8002 <branch> $$ Claude $(date -Iseconds)" >> ports.log
   export PORT=3002 API_PORT=8002
   ```

3. **Feature-Sliced Architecture**: Create slice README (≤15 lines) for each feature:
   ```md
   # <slice-name>
   Purpose                : <one sentence>
   Public API             : • <Component> • <hook>() • <constant>
   Dependencies           : <entities/*> <shared/*>
   How to test            : npm run test -- <pattern>
   ```

## Development Commands

**Project Setup** (run once):
```bash
# Initialize monorepo structure
mkdir -p client server shared docs
cd client && npm create vite@latest . -- --template react-ts
cd ../server && npm init -y && npm install express typescript @types/node @types/express
cd .. && npm init -y && npm install -D @types/node typescript

# Install dependencies
cd client && npm install @tanstack/react-query tailwindcss @radix-ui/themes
cd ../server && npm install drizzle-orm @supabase/supabase-js tesseract.js openai
```

**Development** (once implemented):
```bash
# Start dev servers (use appropriate ports)
cd client && npm run dev -- --port $PORT
cd server && npm run dev -- --port $API_PORT

# Run tests
npm run test

# Lint and typecheck
npm run lint
npm run typecheck
```

## Architecture

```
business-card-manager/
├── client/                 # React + Vite frontend
│   ├── src/
│   │   ├── app/           # App-wide setup
│   │   ├── widgets/       # Complex UI blocks
│   │   ├── features/      # User scenarios
│   │   ├── entities/      # Business entities
│   │   └── shared/        # Reusable utilities
│   └── public/
├── server/                 # Express backend
│   ├── src/
│   │   ├── features/      # Feature slices
│   │   │   ├── events/
│   │   │   ├── contacts/
│   │   │   ├── lead-groups/
│   │   │   └── campaigns/
│   │   ├── shared/        # Common utilities
│   │   └── db/           # Database setup
│   └── tests/
└── shared/                # Shared TypeScript types
```

## Key Implementation Details

- **Database**: Supabase PostgreSQL with Drizzle ORM (see `mvp-database-schema.md`)
- **File Storage**: Supabase Storage for business card images
- **OCR Processing**: Tesseract.js with confidence scoring (0.00-1.00)
- **AI Integration**: OpenAI API for email personalization
- **Status Tracking**: Contact statuses: `processing`, `completed`, `failed`, `pending_review`, `user_verified`
- **Activity Logging**: Standardized actions like `contact_uploaded`, `email_campaign_exported`
- **Single User**: Hard-code `user_id = 1` for all operations
- **Export Strategy**: CSV export for Gmail mail merge (no OAuth integration needed)

## Environment Variables

Required in `.env`:
```
DATABASE_URL=postgresql://...
OPENAI_API_KEY=sk-...
SUPABASE_URL=https://...
SUPABASE_ANON_KEY=...
PORT=3002
API_PORT=8002
NODE_ENV=development
```

## Testing Approach

- Unit tests for services and utilities
- Integration tests for API endpoints
- E2E tests for critical workflows (upload → OCR → email)
- Test low-confidence OCR review flow
- Verify activity logging works correctly

## Common Tasks

1. **Add new feature slice**: Create feature directory with service/routes/types, add slice README
2. **Update database schema**: Edit schema file, run migrations, update types
3. **Add API endpoint**: Create route in feature slice, add validation, log activity
4. **Handle OCR results**: Check confidence score, set appropriate status, queue for review if needed
5. **Export campaigns**: Generate CSV with proper formatting for Gmail mail merge
6. **Track technical debt**: When taking shortcuts for MVP speed, document in `docs/TECH-DEBT.md` with security implications and timeline for fixes

## UI Components & Pages

- **Dashboard**: Stats cards showing contacts needing review, recent activity feed
- **Events**: CRUD with tabs for Details, Scan Card, and Contacts
- **Contacts**: Table with status badges (🟢 Verified, 🟡 Needs Review, 🔵 Completed)
- **Review Modal**: Side-by-side card image and editable form for low-confidence results
- **Email Campaigns**: Draft generation → Export options → Campaign history

## Database Tables

Core tables: `events`, `contacts`, `lead_groups`, `lead_group_contacts`, `email_templates`, `email_campaigns`, `email_drafts`, `activity_logs`. Future-ready: `ocr_jobs` for background processing.