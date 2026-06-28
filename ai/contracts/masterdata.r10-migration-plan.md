# Masterdata R-10 Migration Plan

Change: `R-10A masterdata MVP contract package`
Status: contract/pre-review only. No SQL migration, validation SQL, registry row, or database scan is created in R-10A.

## Purpose

R-10B must implement the master-data MVP with executable MySQL migration evidence rather than markdown-only schema intent.

## R-10B Migration Deliverables

R-10B must provide:

- executable MySQL migration for the MVP tables
- rollback or rebuild guidance appropriate for the pre-release policy
- seed-data notes if preset product/material/option examples are supplied
- validation SQL or equivalent MySQL evidence
- ownership file or registry entry required by the active governance gates
- generated DB scan and graph/registry sync if the scanner detects new DB objects

## Migration Order

Recommended R-10B order:

1. product category, series, and model tables
2. material and accessory category tables
3. material and accessory record tables
4. sales option category and value tables
5. indexes, uniqueness constraints, and status/reference fields
6. seed data, if approved as configurable data
7. validation SQL and ownership registration

## MySQL Assumption

The project default database direction remains MySQL. R-10B must not introduce another database dialect unless a separate approved governance change changes that rule.

## Seed Data Rule

Seed examples such as product families, door types, opening modes, colors, handles, locks, hinges, glass, surface treatment, packaging, and material systems may be inserted only as configurable rows. They must not create hard-coded database structures or application branches.

## R-10A Boundary

R-10A intentionally stops before SQL creation. Any SQL file under `sql/migrations` or `sql/validation` belongs to the later R-10B runtime change.
