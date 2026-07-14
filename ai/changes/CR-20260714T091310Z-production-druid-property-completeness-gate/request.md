# Request

Add a governance-only production Druid property completeness gate. The checker must dynamically derive required keys from `DruidProperties.java`, fail when `application-prod.yml` omits any key, run inside the existing main `npm run check` path, and prove fail-closed behavior with per-key and synthetic-source mutation tests.

Do not change application configuration, Java runtime code, dependencies, business modules, sales-order state, release, or deployment.
