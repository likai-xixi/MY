# Coding Standards

## General

- Keep changes scoped to the feature.
- Prefer explicit contracts over hidden conventions.
- Add tests or smoke checks for behavior changes.
- Update memory and graph files with structural changes.

## Backend

- Keep transport, service, domain, and repository concerns separate.
- Keep backend business code under `backend/modules/<slug>/{api,service,domain,repository}/`.
- Keep `backend/common/` free of feature ownership and imports from `backend/modules/<slug>/`.
- Validate inputs at the boundary.
- Document API errors.

## Frontend

- Preserve existing interaction models unless the task asks for redesign.
- Represent loading, empty, success, and error states when relevant.
- Keep API usage aligned with `memory/API_CATALOG.md`.
- Search `frontend/src/components/catalog.json` before creating a component.
- Put reusable UI in `frontend/src/components/` and export it from `frontend/src/components/index.ts`.
- Keep module-only widgets under `frontend/src/modules/<slug>/components/`.
- Do not import another frontend module's internals.
