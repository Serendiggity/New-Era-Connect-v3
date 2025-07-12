# Business Card Lead Manager MVP

A single-user system for scanning business cards, extracting contact information via OCR, organizing leads, and generating AI-powered email campaigns.

## Tech Stack

- **Frontend**: React + Vite + TypeScript + TailwindCSS + shadcn/ui
- **Backend**: Node.js + Express + TypeScript  
- **Database**: Supabase (PostgreSQL) + Drizzle ORM
- **OCR**: Tesseract.js
- **AI**: OpenAI API

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm 8+
- Supabase account
- OpenAI API key

### Setup

1. Clone the repository
2. Copy `.env.example` to `.env` and fill in your values
3. Install dependencies:
   ```bash
   pnpm install
   ```

### Development

Start both frontend and backend:
```bash
pnpm dev
```

Or start them separately:
```bash
# Frontend (port 3002)
cd client && pnpm dev

# Backend (port 8002)  
cd server && pnpm dev
```

## Project Structure

```
business-card-manager/
├── client/          # React frontend
├── server/          # Express backend
├── shared/          # Shared TypeScript types
└── docs/           # Documentation
```

## Port Management

This project uses a 3-slot port pool system. Claude agents use Slot B (ports 3002/8002) by default.

## Environment Variables

See `.env.example` for required environment variables.

## License

Private - All rights reserved