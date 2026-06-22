# Codex Guide

Use Codex App as a development partner inside this scaffold:

1. Ask Codex to read `AGENTS.md`.
2. Point Codex at a feature brief in `features/`.
3. Ask Codex to implement the smallest verified slice.
4. Require graph and memory updates with code changes.
5. Ask Codex to run `npm run check`.
6. Use `memory/HANDOVER.md` as the next-thread handoff.

Good prompt:

```text
Read AGENTS.md and features/customer.md. Implement the next smallest backend and frontend slice. Update memory and graph files, then run npm run check.
```

Reusable prompts:

- `prompts/start-business-feature.md`
- `prompts/finish-business-feature.md`
