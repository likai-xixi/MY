# Plan

Mode: `update`
Feature: `customer`

1. Keep the change scoped to executable customer SQL baseline files, migration registry, customer DB/migration docs, focused high-risk tests, generated ownership scans, and handoff memory.
2. Add executable SQL for the existing customer schema, two PUBLIC seed rows, RuoYi customer menu/permissions, and read-only customer runtime validation.
3. Register the SQL files as blocking customer migration/validation entries with rollback plans and verification notes.
4. Verify high-risk governance no longer expects the current customer markdown baseline warning, then run the scaffold gates and record MySQL runtime execution as run or not-run.

## Summary

R-06 executable customer migration baseline
