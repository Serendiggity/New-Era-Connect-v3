# CLAUDE.md - Enhanced Multi-Agent Workflow

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository alongside Cursor AI.

## Project Overview

Business Card Lead Manager MVP - A single-user system for scanning business cards, extracting contact info via OCR, organizing leads, and generating AI-powered email campaigns.

**Current Status**: Active development with multi-agent workflow
**Agent Role**: Claude Code handles backend/system operations, Cursor handles UI/frontend

**Documentation Files**:
- `mvp-project-plan.md` - 14-day implementation roadmap with parallel development tracks
- `mvp-database-schema.md` - Complete PostgreSQL schema
- `updated-ui-design.md` - UI/UX specifications
- `claude-rules.md` - Development rules and conventions
- `docs/multi-agent-workflow.md` - Detailed workflow guide
- `docs/mcp-security-guide.md` - MCP security best practices

## Multi-Agent Workflow

### Agent Responsibilities

**Claude Code (YOU):**
- Backend API implementation and complex business logic
- Database operations, migrations, and complex queries
- OCR processing with Tesseract.js integration
- System-level operations, file handling, terminal commands
- Integration testing and deployment preparation
- Git operations and commit message generation

**Cursor AI:**
- React component development and UI implementation
- Frontend state management and user interactions
- Code review and diff analysis
- Quick edits and styling adjustments
- Documentation and README updates

### Task Routing Guidelines

Use this complexity matrix for task assignment:

| Complexity | Task Type | Recommended Agent |
|------------|-----------|-------------------|
| 1-4 | UI components, styling, forms | Cursor |
| 5-8 | Backend services, database operations, OCR | Claude Code |
| 8-10 | Full features requiring coordination | Both (parallel) |

### Session Management

- **Optimal session length**: 10-20 minutes for autonomous complex tasks
- **Use `/compact`** every 20 minutes to maintain focus
- **Use `/clear`** when starting major new features
- **Check recent commits** before starting to ensure current context

## MCP Integration

### Available MCP Servers

Configure these servers for enhanced capabilities:

1. **@supabase** - Direct database access and queries
   - Query contact processing status
   - Verify schema changes during development
   - Real-time data validation

2. **@github** - Repository operations
   - Create PRs with proper handoff tags
   - Manage issues and project tracking
   - Coordinate with Cursor's work

3. **@taskmaster-ai** - Multi-provider task management
   - Break down complex features into subtasks
   - Coordinate parallel development streams
   - Track progress across both agents

4. **@web-eval-agent** - Research and validation
   - Research API best practices
   - Validate technical approaches
   - Documentation lookup

5. **@filesystem** - Project file operations
   - Efficient multi-file operations
   - Safe file system access
   - Project structure management

### MCP Security

- Always use environment variables: `${VARIABLE_NAME}`
- Verify `.env.mcp` exists before starting
- Use minimal permissions (prefer read-only during development)
- Follow token rotation schedule in `docs/mcp-security-guide.md`

## Terminal-in-Cursor Pattern

**Primary workflow**: Run Claude Code inside Cursor's terminal

```bash
# Cursor opens terminal (Ctrl+` / Cmd+`)
cd "/mnt/c/Users/jeffr/Music/Dev Repo/New-Era-Connect-v3"
claude
```

**Benefits**:
- Shared project context and file access
- Cursor can review your changes in real-time
- Seamless handoffs between agents
- Unified development environment

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
   Multi-agent notes      : <coordination requirements>
   ```

4. **Handoff Protocol**: Use structured handoff messages with `@handoff:context` tags

## Development Commands

**Project Setup** (run once):
```bash
# Initialize MCP configuration
cp workflow-enhancement/.claude/config.json .claude/
cp workflow-enhancement/.env.mcp.example .env.mcp
# Edit .env.mcp with actual tokens

# Initialize monorepo structure
mkdir -p client server shared docs
cd client && npm create vite@latest . -- --template react-ts
cd ../server && npm init -y && npm install express typescript @types/node @types/express
cd .. && npm init -y && npm install -D @types/node typescript

# Install dependencies
cd client && npm install @tanstack/react-query tailwindcss @radix-ui/themes
cd ../server && npm install drizzle-orm @supabase/supabase-js tesseract.js openai
```

**Development** (with MCP integration):
```bash
# Start dev servers (use appropriate ports)
cd client && npm run dev -- --port $PORT
cd server && npm run dev -- --port $API_PORT

# Run tests
npm run test

# Lint and typecheck
npm run lint
npm run typecheck

# Use MCP for database queries
# Example: "@supabase query contacts where status = 'pending_review'"
```

## Architecture

```
business-card-manager/
├── client/                 # React + Vite frontend (Cursor focus)
│   ├── src/
│   │   ├── app/           # App-wide setup
│   │   ├── widgets/       # Complex UI blocks
│   │   ├── features/      # User scenarios
│   │   ├── entities/      # Business entities
│   │   └── shared/        # Reusable utilities
│   └── public/
├── server/                 # Express backend (Claude Code focus)
│   ├── src/
│   │   ├── features/      # Feature slices
│   │   │   ├── events/
│   │   │   ├── contacts/
│   │   │   ├── lead-groups/
│   │   │   └── campaigns/
│   │   ├── shared/        # Common utilities
│   │   └── db/           # Database setup
│   └── tests/
├── shared/                # Shared TypeScript types
├── .claude/               # Claude Code MCP configuration
└── workflow-enhancement/  # Enhanced workflow documentation
```

## Key Implementation Details

- **Database**: Supabase PostgreSQL with Drizzle ORM (use @supabase MCP for queries)
- **File Storage**: Supabase Storage for business card images
- **OCR Processing**: Tesseract.js with confidence scoring (0.00-1.00)
- **AI Integration**: OpenAI API for email personalization
- **Status Tracking**: Contact statuses: `processing`, `completed`, `failed`, `pending_review`, `user_verified`
- **Activity Logging**: Standardized actions like `contact_uploaded`, `email_campaign_exported`
- **Single User**: Hard-code `user_id = 1` for all operations
- **Export Strategy**: CSV export for Gmail mail merge (no OAuth integration needed)

## OCR-Specific Guidelines

When working on OCR features:

### Confidence Scoring
- **High (>= 0.85)**: Auto-accept → `status: 'completed'`
- **Medium (0.60-0.84)**: Queue for review → `status: 'pending_review'`
- **Low (< 0.60)**: Mark failed → `status: 'failed'`

### Processing Pipeline
1. Image upload → `status: 'processing'`
2. Tesseract.js processing with preprocessing
3. Confidence calculation per field
4. Status assignment based on overall confidence
5. Database update with `processed_at` timestamp

### Error Handling
- 30-second timeout for OCR operations
- Maximum 2 retry attempts with different preprocessing
- Clean up Tesseract workers after processing
- Comprehensive error logging for debugging

## Performance Targets

### Multi-Agent Efficiency Goals
- **50% reduction** in development time vs single-agent approach
- **< 3 handoffs** per feature implementation
- **< 2 merge conflicts** per week
- **> 80% test coverage** maintained across both agents' work

### Session Optimization
- Use `@supabase` MCP to verify current project state
- Leverage `@github` MCP for PR coordination
- Monitor token usage with `/ccusage`
- Clear context with `/clear` when switching major features

## Common Tasks

1. **Add new feature slice**: 
   - Create feature directory with service/routes/types
   - Add slice README with multi-agent coordination notes
   - Use @taskmaster-ai MCP to break down implementation

2. **Update database schema**: 
   - Edit schema file, run migrations
   - Use @supabase MCP to verify changes
   - Update TypeScript types and coordinate with Cursor

3. **Implement OCR processing**:
   - Handle image preprocessing and Tesseract.js integration
   - Implement confidence scoring algorithms
   - Create status management and error handling
   - Coordinate with Cursor for review UI

4. **Handle handoffs to Cursor**:
   - Create structured handoff messages with context
   - Tag relevant files and line numbers
   - Update feature slice README with current status
   - Use GitHub MCP to create PRs with handoff tags

## Activity Logging

Log all major operations with agent identification:

```javascript
await logActivity({
  action: 'feature_implemented',
  agent: 'CLAUDE',
  metadata: {
    feature: 'ocr_processing',
    files_changed: ['server/src/features/contacts/ocr.service.ts'],
    tests_added: 12,
    handoff_ready: true
  }
});
```

## Environment Variables

Required in `.env` and `.env.mcp`:

```bash
# Core application
DATABASE_URL=postgresql://...
OPENAI_API_KEY=sk-...
SUPABASE_URL=https://...
SUPABASE_ANON_KEY=...
PORT=3002
API_PORT=8002
NODE_ENV=development

# MCP Servers
SUPABASE_ACCESS_TOKEN=sbp_...
GITHUB_PERSONAL_ACCESS_TOKEN=ghp_...
GOOGLE_API_KEY=AIza...
PERPLEXITY_API_KEY=pplx_...
OPENROUTER_API_KEY=sk-or-v1-...
OPERATIVE_API_KEY=op_...
```

## Testing Approach with Multi-Agent Coordination

- **Unit tests** for services and utilities (Claude Code focus)
- **Integration tests** for API endpoints (Claude Code focus)
- **Component tests** for React components (Cursor focus)
- **E2E tests** for critical workflows (coordinated)
- **MCP integration tests** for server connectivity

### Testing Coordination
- Use @taskmaster-ai MCP to assign test responsibilities
- Run parallel test suites: backend (Claude) + frontend (Cursor)
- Coordinate E2E test scenarios through handoff protocol
- Use @supabase MCP to verify database state during tests

## Security Best Practices

- Follow `docs/mcp-security-guide.md` for token management
- Use environment variables for all sensitive configuration
- Implement read-only database access during development
- Regular token rotation (monthly dev, quarterly prod)
- Audit MCP server permissions regularly

## Troubleshooting Multi-Agent Issues

### Context Synchronization
- Check recent commits: `git log --oneline -10`
- Verify current branch: `git branch --show-current`
- Review handoff messages in recent commits
- Use @supabase MCP to verify database state

### MCP Server Issues
- Check `.env.mcp` configuration
- Verify token validity and permissions
- Restart MCP servers if needed: `pkill -f mcp-server`
- Enable debug logging: `export MCP_DEBUG=1`

### Performance Issues
- Use `/compact` to compress conversation history
- Clear context with `/clear` for major feature switches
- Monitor token usage with `/ccusage`
- Check MCP server response times

Remember: You are part of a multi-agent team. Coordinate effectively, communicate clearly in handoffs, and leverage MCP servers for enhanced capabilities while maintaining security best practices.