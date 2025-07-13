# Multi-Agent Workflow Guide

## Overview

This guide provides detailed instructions for using Cursor and Claude Code together to maximize productivity in the Business Card Lead Manager project.

## Quick Start

### 1. Terminal-in-Cursor Setup

The most effective pattern is running Claude Code inside Cursor's terminal:

```bash
# In Cursor terminal (Ctrl+` or Cmd+`)
cd "/mnt/c/Users/jeffr/Music/Dev Repo/New-Era-Connect-v3"
claude
```

This gives you:
- **Claude Code** for complex backend operations
- **Cursor** for UI development and code review
- **Shared context** through the same project directory

### 2. MCP Server Configuration

Ensure MCP servers are configured for both tools:

```bash
# Copy MCP configuration
cp workflow-enhancement/.claude/config.json .claude/
cp workflow-enhancement/.env.mcp.example .env.mcp
# Edit .env.mcp with your actual tokens
```

## Task Routing Matrix

Use this decision matrix to determine which agent should handle each task:

| Task Type | Complexity | Agent | Rationale |
|-----------|------------|-------|-----------|
| React Components | 1-3 | Cursor | Fast tab completion, immediate preview |
| Bug Fixes | 2-4 | Cursor | Quick iterations, context awareness |
| Backend APIs | 4-7 | Claude Code | Better system access, testing integration |
| Database Operations | 5-8 | Claude Code | Complex queries, migration handling |
| OCR Implementation | 6-8 | Claude Code | Multi-file coordination, error handling |
| Full Features | 8-10 | Both | Parallel development streams |

## Workflow Patterns

### Pattern 1: Backend-First Development

**Best for**: OCR processing, email generation, complex business logic

1. **Claude Code**: Implements backend service with tests
   ```bash
   # In Cursor terminal
   claude
   > Implement the OCR contact processing service with confidence scoring
   ```

2. **Cursor**: Reviews implementation and creates UI
   - Use diff view to understand Claude's changes
   - Create React components that consume the API
   - Add loading states and error handling

3. **Claude Code**: Handles integration testing and deployment prep

### Pattern 2: UI-First Development

**Best for**: Dashboard pages, forms, user interactions

1. **Cursor**: Creates React component structure
   - Design the UI layout and components
   - Mock API responses for development
   - Implement client-side logic

2. **Claude Code**: Implements backend to match UI contract
   - Create API endpoints based on UI requirements
   - Implement data validation and business logic
   - Add proper error responses

3. **Cursor**: Integrates real API and polishes UX

### Pattern 3: Parallel Development

**Best for**: Complete features like email campaigns

1. **Simultaneous Development**:
   - **Cursor**: Email template UI, campaign dashboard
   - **Claude Code**: OpenAI integration, personalization logic

2. **Integration Phase**:
   - **Cursor**: Connects UI to backend APIs
   - **Claude Code**: Handles CSV export and testing

3. **Polish Phase**:
   - **Cursor**: UX improvements and error states
   - **Claude Code**: Performance optimization and monitoring

## Real Developer Tips

Based on research from developers using both tools:

### Context Management
- **Cursor**: Leverages project-wide indexing automatically
- **Claude Code**: Use `/compact` every 20 minutes to maintain focus
- **Both**: Reference specific files when handing off tasks

### Session Optimization
- **Cursor**: Keep sessions to 1-2 hours for optimal context
- **Claude Code**: 10-20 minutes for autonomous complex tasks
- **Handoffs**: Use `@handoff:context` comments in code

### Speed vs Depth
- **Quick edits**: Use Cursor's Command+K
- **Complex refactoring**: Let Claude Code handle end-to-end
- **Code review**: Use Cursor's diff view after Claude's changes

## Communication Protocols

### Handoff Messages

Use structured handoff messages:

```markdown
## Handoff: OCR Implementation → UI Integration

**Completed**:
- OCR service in `server/src/features/contacts/ocr.service.ts`
- Confidence scoring algorithm
- Database status updates
- Unit tests with 95% coverage

**Next Steps**:
- Create upload component in `client/src/features/contacts/upload/`
- Implement review modal for low-confidence results
- Add progress indicators for processing

**Files to Review**:
- `server/src/features/contacts/ocr.service.ts:45-89` (confidence calculation)
- `server/src/features/contacts/ocr-job.service.ts:23` (status management)

**MCP Context**: Use `@supabase` to verify contact status schema
```

### Activity Logging

Both agents should log activities consistently:

```javascript
// Use this format for all major operations
await logActivity({
  action: 'feature_implemented',
  agent: 'CLAUDE', // or 'CURSOR'
  metadata: {
    feature: 'ocr_processing',
    files_changed: 3,
    tests_added: 12,
    duration_minutes: 45
  }
});
```

## Performance Monitoring

### Success Metrics

Track these metrics to optimize the workflow:

| Metric | Target | How to Measure |
|--------|--------|----------------|
| Development Speed | 50% faster than single-agent | Time feature completion |
| Context Efficiency | < 3 handoffs per feature | Count handoff messages |
| Code Quality | > 80% test coverage | Automated test reports |
| Integration Success | < 2 merge conflicts per week | Git conflict frequency |

### Tools for Tracking

1. **GitHub MCP**: PR metrics and code review stats
2. **TaskMaster AI MCP**: Task completion tracking
3. **Manual Time Logs**: Development phase timing
4. **Supabase MCP**: Database query performance

## Troubleshooting

### Common Issues

1. **Context Mismatch**
   - **Symptom**: Agents working on outdated information
   - **Solution**: Both agents review recent commits before starting
   - **Prevention**: Regular handoff summaries

2. **Merge Conflicts**
   - **Symptom**: Git conflicts when merging work
   - **Solution**: Frequent pulls and clear commit messages
   - **Prevention**: Coordinate file ownership

3. **MCP Server Failures**
   - **Symptom**: Cannot access database or external services
   - **Solution**: Check `.env.mcp` configuration and token validity
   - **Prevention**: Monitor MCP logs and rotate tokens regularly

4. **Performance Degradation**
   - **Symptom**: Slow responses or timeouts
   - **Solution**: Clear sessions and restart MCP servers
   - **Prevention**: Monitor token usage and session length

### Recovery Procedures

1. **State Synchronization**:
   ```bash
   # Both agents should run
   git pull origin main
   npm run test -- --verbose
   # Review database state with @supabase MCP
   ```

2. **Context Refresh**:
   - **Cursor**: Reload window (Cmd+R / Ctrl+R)
   - **Claude Code**: Start new session with `/clear`
   - **Both**: Review project README and current branch status

3. **MCP Reset**:
   ```bash
   # Restart MCP servers
   pkill -f "mcp-server"
   # Verify configuration
   cat .env.mcp | grep -v "^#"
   # Restart with debug logging
   export MCP_DEBUG=1
   claude
   ```

## Advanced Techniques

### Parallel Testing

Run different test suites simultaneously:

- **Cursor**: Frontend unit tests and component tests
- **Claude Code**: Backend integration tests and E2E scenarios

### Database Operations

Coordinate database changes:

1. **Claude Code**: Schema migrations and complex queries
2. **Cursor**: UI for data display and user interactions
3. **Both**: Use Supabase MCP for real-time state verification

### Deployment Coordination

- **Claude Code**: Server deployment, environment configuration
- **Cursor**: Frontend build and static asset optimization
- **Both**: Monitor deployment success through GitHub MCP

## Success Stories

Based on real developer experiences:

> "Built a complete mobile budget tracking app in under 12 hours using this workflow"

> "Reduced development time by approximately 50% for features normally implemented manually"

> "Claude Code handles 18,000-line React components that no other AI could touch"

The key is leveraging each tool's strengths while maintaining clear communication and shared context through MCP servers.