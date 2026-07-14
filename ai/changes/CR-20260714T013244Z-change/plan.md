# Plan

Mode: `update`
Feature: `customer`

1. Read project memory and feature ownership.
2. Restrict edits to `impact.allowedEditRoots`.
3. Update code, registry, graph, generated scan files, memory, changelog, and handover together.
4. Return only query-safe customer detail and load each sensitive domain through its dedicated permission-protected endpoint.
5. Make fund reads side-effect free and constrain normal customer updates from mutating ownership.
6. Fail closed sample rebate creation until an authoritative order adapter exists; hide the create UI, retain read-only history, and add future order-identity uniqueness plus data audit.
7. Lock owner transfer rows, require exactly one update before audit, and accept only controlled salesman role keys.
8. Run unit, MySQL integration, Node, frontend, scan, handoff, and full governance gates.

## Summary

修复客户详情权限、查询写入、样品返现伪造与重复入账、归属并发审计和角色校验风险
