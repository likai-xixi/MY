# Masterdata R-10 Permission Contract

Change: `R-10A masterdata MVP contract package`
Status: contract/pre-review only. R-10A creates no SQL menu row, permission code, controller annotation, Vue permission directive, or permission scan artifact.

## Purpose

R-10B must keep master-data maintenance permissions explicit enough to separate viewing, editing, deletion, export, status changes, and publication.

## Required Action Boundary

Each R-10B resource must map to these action concepts:

- view
- add
- edit
- remove
- export
- status
- publish

If the RuoYi adapter uses `list` and `query`, those may implement the view boundary, but the contract must keep `view` as the business-level capability. If R-10B defers actual publish workflow, the permission and contract must still reserve the publish boundary.

## Future Resource Permission Groups

R-10B must provide equivalent permission ownership for:

- product category
- product series
- product model
- material category
- material record
- accessory category
- accessory record
- sales option category
- sales option value

## Hard Rules

- Publish rights must be separate from ordinary edit rights.
- Status/disable/archive rights must be separate from ordinary edit rights or explicitly justified in R-10B.
- Remove must enforce reference checks and must not delete referenced master data.
- Permission names must not encode product examples such as door, courtyard door, opening mode, glass, handle, lock, hinge, surface treatment, packaging, or material system.

## Future Ownership Requirement

When R-10B creates permissions it must update, in the same change:

- SQL menu/permission migration
- controller annotations
- frontend permission checks
- generated permission scan
- feature registry permission ownership
- permission contract/test matrix

R-10A records the boundary only and does not register permission codes yet.
