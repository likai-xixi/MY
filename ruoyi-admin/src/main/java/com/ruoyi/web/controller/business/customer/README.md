# 客户管理 RuoYi Controller Boundary

Feature ID: `customer`
Java package segment: `customer`

This folder owns HTTP controllers, request/response DTO mapping, and permission annotations for the feature.

- Keep controller classes under `ruoyi-admin/src/main/java/com/ruoyi/web/controller/business/<feature>/`.
- Mapper XML, menu SQL, permissions, and database objects must be registered in `ai/registry/features.json`.
- Do not create duplicate cross-module helpers; move reusable code to the approved shared layer and register it.
