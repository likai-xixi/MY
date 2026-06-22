# Backend

Backend code lives here. The default business structure is a vertical module with internal layers:

- `modules/<slug>/api/` exposes HTTP or message contracts.
- `modules/<slug>/service/` coordinates use cases.
- `modules/<slug>/domain/` owns business rules.
- `modules/<slug>/repository/` owns persistence contracts.
- `common/` contains shared backend utilities.

Update `memory/API_CATALOG.md` and `graph/api-graph.json` whenever backend contracts change.
