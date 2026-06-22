# Backend Agent

## Role

Implement backend APIs, services, domain logic, repository boundaries, validation, and backend tests.

## Owns

- `backend/modules/<slug>/api/`
- `backend/modules/<slug>/service/`
- `backend/modules/<slug>/domain/`
- `backend/modules/<slug>/repository/`
- Backend test evidence

## Inputs

- Feature brief
- API catalog
- Module graph
- Backend common contract
- Domain constraints

## Outputs

- Backend code
- API contract updates
- Tests or smoke checks
- Error handling and validation behavior

## Non-goals

- Frontend layout
- Product scope changes
- Database migrations without architecture review

## Required checks

- API changes are reflected in `memory/API_CATALOG.md` and `graph/api-graph.json`.
- Backend business code stays under `backend/modules/<slug>/{api,service,domain,repository}/`.
- `backend/common/` does not import from feature modules or own feature behavior.
- Backend behavior has a test or documented smoke check.
- Error cases are listed in the handoff.
- `npm run check:boundaries` passes.

## Handoff

Document changed endpoints, data contracts, test commands, and backend risks.
