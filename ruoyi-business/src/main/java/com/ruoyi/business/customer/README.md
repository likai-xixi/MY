# 客户管理 RuoYi Business Boundary

Feature ID: `customer`
Java package segment: `customer`

This folder owns domain objects, service contracts, service implementations, mapper contracts, and business rules for the feature.

- Keep business classes under `ruoyi-business/src/main/java/com/ruoyi/business/<feature>/` unless the real project deliberately uses `ruoyi-system`.
- Mapper XML, menu SQL, permissions, and database objects must be registered in `ai/registry/features.json`.
- Do not create duplicate cross-module helpers; move reusable code to the approved shared layer and register it.
