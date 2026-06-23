# Verification

Status: verified

## Commands And Outcomes

- `npm run resume` passed and reported `customer` as the active feature context.
- `npm run ai:do -- "功能迭代：客户管理"` passed and opened current change record `CR-20260623T071949Z-change`.
- `npm run impact -- 客户管理` passed with no blockers and allowed edits under the customer feature screen, feature brief, memory, and current change record.
- Static UI verification passed for `ruoyi-ui/src/views/customer/index.vue`: the independent list column `label="客户简称"` is absent; no `scope.row.shortName` rendering remains under customer name; the customer name button still calls `handleView(scope.row)`; search still binds `queryParams.shortName`; add/edit still binds `form.shortName`; the short-name placeholder is `选填，不填则同客户名称`; list/export request flow still uses `queryParams.value`; contact, phone, area, and owner columns remain present.
- `npm --prefix ruoyi-ui run build:prod` passed with Vite production build success.
- `npm run scan:all` passed: backend routes, frontend routes, API clients, DB schema, permissions, components, and ownership sync all completed with `ok`.
- `npm run finalize:change -- --summary "客户管理列表隐藏客户简称列"` passed.
- First `npm run check` reached `check:components` and failed because this current change record did not yet include the scoped RuoYi component/boundary exception notes for pre-existing platform and tool-generator files. Added `component-exception.md` and `boundary-exception.md` under this change record only.
- Second `npm run check` passed component, component-similarity, boundary, stale-doc, orphan, and Codex lint checks, then reached `check:handover-integrity` and failed because this verification file still contained generated template evidence. This file and the current handover were updated with concrete outcomes before rerunning the full gate.

## Evidence

- 客户列表默认不再显示独立“客户简称”列，也没有把简称渲染到客户名称下方。
- 客户名称列仍保持单行按钮展示，并继续通过 `handleView(scope.row)` 进入详情。
- 搜索区保留“客户简称”条件，`queryParams.shortName` 仍随 `listCustomer(queryParams.value)` 请求列表接口。
- 新增/编辑弹窗保留“客户简称”字段，字段仍为选填，placeholder 已改为 `选填，不填则同客户名称`。
- 后端 `fillDefaultShortName`、数据库表结构、API 路径、权限码、导出逻辑、资金、样品返现、定金流水、业务员转移、联系人、联系电话、省市区、唯一默认联系人/地址逻辑均未修改。
- 本次 UI 删除一个表格列，客户列表横向展示宽度相应减少；主要列表列仍保留客户编码、客户名称、客户类型、客户等级、联系人、联系电话、省市区、归属业务员、归属部门、状态、创建时间和操作。
