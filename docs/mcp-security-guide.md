# MCP Security Guide

## Overview

This guide provides security best practices for using Model Context Protocol (MCP) servers with Cursor and Claude Code in the Business Card Lead Manager project.

## Token Management

### 1. Environment Variable Usage

**Never hardcode tokens** in configuration files. Always use environment variables:

```json
// ❌ Bad: Hardcoded token
"env": {
  "GITHUB_TOKEN": "ghp_actualTokenHere123"
}

// ✅ Good: Environment variable reference
"env": {
  "GITHUB_TOKEN": "${GITHUB_PERSONAL_ACCESS_TOKEN}"
}
```

### 2. Token Scoping

Minimize permissions for each service:

| Service | Required Scopes | Notes |
|---------|----------------|-------|
| GitHub | `repo`, `read:org` | Avoid `admin` scopes |
| Supabase | Read-only access | Use service role key only in production |
| TaskMaster | API access only | No admin permissions |

### 3. Token Rotation Schedule

- **Development tokens**: Rotate monthly
- **Production tokens**: Rotate every 90 days
- **Compromised tokens**: Rotate immediately

## MCP Server Security

### 1. Server Isolation

Each MCP server runs in its own process with limited permissions:

```json
"supabase": {
  "args": ["--read-only"],  // Enforce read-only mode
}
```

### 2. File System Access

The filesystem MCP server should be scoped to project directory only:

```json
"filesystem": {
  "args": [
    "@modelcontextprotocol/server-filesystem",
    "/path/to/project"  // Never use root directory
  ]
}
```

### 3. Network Security

- MCP servers communicate via stdio (not network sockets)
- No external network access unless explicitly configured
- Use Docker containers for additional isolation when possible

## Development vs Production

### Development Environment
- Use `.env.mcp.development` for dev tokens
- More permissive scopes acceptable
- Shorter rotation cycles

### Production Environment
- Use secrets manager (e.g., AWS Secrets Manager, Vault)
- Minimal permission scopes
- Audit trail for all token usage
- Never store in `.env` files

## Security Checklist

Before deploying:

- [ ] All tokens use environment variables
- [ ] No sensitive data in version control
- [ ] Token permissions minimized
- [ ] Rotation schedule documented
- [ ] Access logs configured
- [ ] MCP servers use minimal permissions
- [ ] File system access properly scoped
- [ ] Production tokens in secrets manager

## Incident Response

If a token is compromised:

1. **Immediately revoke** the compromised token
2. **Generate new token** with minimal required permissions
3. **Update** all configurations with new token
4. **Audit** logs for unauthorized access
5. **Document** incident and update security procedures

## Monitoring

Enable logging for MCP operations:

```bash
# Set MCP debug logging
export MCP_DEBUG=1

# Monitor MCP server logs
tail -f ~/.mcp/logs/*.log
```

## Additional Resources

- [MCP Security Documentation](https://modelcontextprotocol.io/docs/security)
- [GitHub Token Security](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure)
- [Supabase Security Best Practices](https://supabase.com/docs/guides/platform/security)