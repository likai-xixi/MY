# Risk Register

| Risk | Impact | Mitigation | Owner |
| --- | --- | --- | --- |
| Existing brace-only review is reused | Unauthorized scope expansion | Use this new review and commit it before implementation | Codex |
| Lockfile resolver drifts unrelated packages | Broader compatibility risk | Reject the result unless the version delta is limited to immutable plus required metadata | Codex |
| Safe immutable version breaks Sass build behavior | Frontend build regression | Run clean install, UI tests, and production build | Codex |
| Audit database changes again before push | CI may become red again | Re-run the exact audit immediately before any later authorized push | Codex |
| Evidence overstates remote closure | False-green R-12A status | Keep push, CI, and post-push evidence `[not-run]` | Codex |
| Scope enters business runtime or R-12B | Unauthorized product change | Enforce forbidden roots and keep both phase gates blocked | Codex |
