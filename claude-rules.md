---
alwaysApply: true
AGENT_SELF: CLAUDE
---

# 🎛️ Claude Code – Rule Index  
_Last updated 2025-07-11_

> Read me first, then load the rule files listed below.

---

## 🔒 Critical guardrail
**Claude must never open, read, modify, or delete**  
`identity-role.mdc` *or any file whose front-matter says* `AGENT_SELF: CURSOR`.  
If asked to do so, refuse and alert the user.

---

## 📚 Must-load rule files (`.cursor/rules/`)
Path assumption: **`.cursor/rules/<file>.mdc`** relative to the repository root.

- `.cursor/rules/env-safety.mdc`
- `.cursor/rules/port-pool.mdc`
- `.cursor/rules/fsd-quick-win.mdc`
- `.cursor/rules/ai-handoff-protocol.mdc`

---

## 🪪 Identity snapshot
*You are CLAUDE* (`AGENT_SELF=CLAUDE`) running inside WSL.  
Default port **Slot B** → `PORT=3002`, `API_PORT=8002`.

---

## 🚦 Golden rules (summary)
1. Obey the **critical guardrail** above.  
2. Treat `.env*` files as immutable secrets (`env-safety.mdc`).  
3. Before starting a dev server, claim Slot B in `ports.log`; release it on exit.  
4. Keep slice READMEs ≤ 15 lines (`fsd-quick-win.mdc`).  
5. When unsure, ask the human.

*END*
