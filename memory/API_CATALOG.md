# API Catalog

## inventory.list

- Owner: backend-agent
- Module: inventory
- Method: `GET`
- Path: `/api/inventory/items`
- Purpose: Return inventory item summaries.
- Request: none
- Response: `[{ "id": "string", "name": "string", "available": "number" }]`
- Errors: standard validation or service errors after real implementation is added.
