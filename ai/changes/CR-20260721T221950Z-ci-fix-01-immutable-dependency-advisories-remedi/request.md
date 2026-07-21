# Request

Extend CI-FIX-01 with a separately authorized immutable dependency-security repair discovered by a fresh pre-push audit on 2026-07-22.

The existing review authorizes only brace-expansion, so implementation must wait for a new committed immutable review that explicitly allows the smallest compatible lockfile-only security patch. Preserve the two existing local commits without rewrite, keep all business/runtime and phase-gate roots unchanged, create a local implementation commit only after complete verification, and do not push or begin R-12B.
