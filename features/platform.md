# Platform Base

RuoYi + Vue3 platform shell ownership baseline.

## Scope

- Login, register, redirect, lock, and error pages.
- Frontend router shell and base UI entry points.
- No custom business behavior is introduced by this baseline record.

## Acceptance Criteria

- Platform shell files are registered under `platform`.
- System, monitor, and tool pages remain owned by their own feature records.
- Source merge does not overwrite governance roots.

## Verification

- Run `npm run scan:all`.
- Run `npm run finalize:change`.
- Run `npm run check`.
