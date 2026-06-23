# Handover

## Summary

客户管理编辑同步选项默认勾选. This is a small customer frontend behavior change for the existing edit dialog only.

## Impact

The functional code change is limited to `ruoyi-ui/src/views/customer/index.vue`. When an existing customer is opened for editing, `handleUpdate` now initializes both `form.value.syncDefaultContact` and `form.value.syncDefaultAddress` to `true`. The add flow remains unchanged because `reset()` still initializes both fields to `false`.

This change does not modify backend synchronization semantics, APIs, SQL, mapper XML, funds, sample rebate, owner transfer, province/city/district code handling, or contact/address default uniqueness normalization.

The current change record also contains scoped RuoYi component and boundary exception notes for pre-existing platform/tool-generator files required by the repository gates; those notes do not expand customer ownership.

## Changed Files

- `ruoyi-ui/src/views/customer/index.vue`
- `ai/changes/CR-20260623T055820Z-change/`
- `ai/changes/CURRENT_CHANGE.json`
- `memory/CHANGELOG.md`
- `memory/HANDOVER.md`
- `memory/TASKS.json`

## Commands

- `npm run resume`
- `npm run ai:do -- "功能迭代：客户管理"`
- `npm run impact -- 客户管理`
- static verification of edit defaults, add defaults, and submit payload path
- `npm --prefix ruoyi-ui run build:prod`
- `npm run scan:all`
- `npm run finalize:change -- --summary "客户管理编辑同步选项默认勾选"`
- `npm run check:components`
- `npm run check:boundaries`
- `npm run check`

## Verification

Frontend production build passed. `scan:all` passed. Static verification confirmed edit mode defaults both sync fields to `true`, add mode keeps both fields `false`, and submit still sends `form.value`, so user-unchecked boxes submit as `false`. The full governance gate passed after updating concrete verification evidence; the passing `npm run check` included `npm test` with 97 passed tests.

## Risks

No unresolved code risk is known. This was not browser-click validated against a live customer record in this run; the behavior was verified by source-level data-flow inspection and production build/governance gates.

## Next Actions

None required for this change. Future sales order, shipment, automatic deduction, finance settlement, DXF, workstation client, mobile H5, and mini-program behavior remains outside customer management.
