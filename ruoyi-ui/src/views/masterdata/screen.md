# 主数据配置 Screen Contract

## Route

`/masterdata`

## States

- loading
- empty
- success
- error

## API Usage

- `/business/masterdata/{resource}/list`
- `/business/masterdata/{resource}/options`
- `/business/masterdata/{resource}/{id}`
- `/business/masterdata/{resource}`
- `/business/masterdata/{resource}/changeStatus`
- `/business/masterdata/{resource}/{ids}`
- `/business/masterdata/{resource}/export`

## Code Behavior

- Add dialog: no required code input.
- Edit dialog: code is displayed read-only.
- List/search may continue to show and filter by code.

## Boundary

The screen provides only basic master-data maintenance for the nine R-10B resources and does not implement sales-order, field-scheme, formula, technical-decomposition, inventory, BOM, production, scan/report, drawing, shipment, finance, or receipt flows.
