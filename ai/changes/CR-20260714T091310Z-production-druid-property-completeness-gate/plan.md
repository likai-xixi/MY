# Plan

Mode: `rule-change`
Feature: `platform`
Proposal: `2026-07-14-production-druid-property-completeness-gate`

1. Add failing tests that remove each Java-required Druid key from an otherwise valid production fixture and that add a synthetic `@Value` key to Java source.
2. Make `config-safety-checker.js` dynamically extract required placeholders from `DruidProperties.java` and resolve their exact nested paths in production YAML.
3. Run the completeness validation in both `check:config-safety` and `check:prod-safety`, preserving development-only warning behavior for unrelated defaults.
4. Prove every real key and the synthetic future key fail closed, then run focused tests, both safety commands, the complete suite, and the main gate.
5. Update only the proposal, exact change/context/memory evidence, finalize, close, scope-audit, and obtain independent staged review before commit.

## Scope Boundary

- Do not edit `application-prod.yml`, `DruidProperties.java`, package scripts, workflows, dependencies, registries, feature briefs, graph files, business runtime, or SQL.
- Keep `beforeSalesOrder` blocked. Do not release or deploy.
