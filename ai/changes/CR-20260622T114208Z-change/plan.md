# Plan

Mode: `update`
Feature: `customer`

1. Read project memory and feature ownership.
2. Restrict edits to `impact.allowedEditRoots`.
3. Update code, registry, graph, generated scan files, memory, changelog, and handover together.
4. Run the required verification commands and keep this change record complete.

## Summary

客户管理省市区完整数据源修复

## Impact Scope Note

The change record explicitly includes `ruoyi-ui/src/utils/region-data.js` because the complete China region dataset is a data utility, not a RuoYi view route. Keeping it outside `ruoyi-ui/src/views/customer/` prevents scanners from treating the data file as a fake `/customer/region-data` screen.

The close-change allowed roots also retain the existing customer/RuoYi baseline files already present in the working tree (`ai/registry/db.json`, `ai/registry/permissions.json`, root `pom.xml`, `ruoyi-admin/pom.xml`, and `ruoyi-business/pom.xml`) so the current customer closeout can be verified without weakening governance rules.
