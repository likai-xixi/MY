# 使用入口

这个压缩包是给 Codex App 使用的工程治理模板。它不是业务系统本身，而是放在真实项目根目录上的治理层，用来约束 Codex 按模块、按功能总账、按变更记录、按交接文档推进开发。

## 你在 Codex App 里怎么说

新增功能：

```text
新增功能：客户管理
业务要求：
1. 客户列表支持搜索。
2. 新增和编辑客户。
3. 操作需要记录日志。
```

Codex 应执行：

```bash
npm run ai:do -- "新增功能：客户管理"
```

功能迭代：

```text
功能迭代：客户管理
增加客户等级筛选，新建和编辑弹窗都要支持客户等级。
```

Codex 应先做影响分析，只允许编辑 `impact.allowedEditRoots` 内的文件：

```bash
npm run ai:do -- "功能迭代：客户管理"
npm run impact -- 客户管理
npm run finalize:change
npm run check
```

删除功能必须分两步：

```text
删除功能预分析：客户管理
```

对应命令：

```bash
npm run ai:do -- "删除功能预分析：客户管理"
```

确认后再说：

```text
确认删除：客户管理
```

对应命令：

```bash
npm run ai:do -- "确认删除：客户管理"
```



## 中文功能名识别

默认词典在 `ai/registry/feature-id-dictionary.json`。常见业务名已经内置：

```text
客户管理 -> customer
供应商管理 -> supplier
库存管理 -> inventory
物料管理 -> material
销售订单 -> sales-order
采购订单 -> purchase-order
考勤管理 -> attendance
工资管理 -> payroll
```

如果你再次说 `新增功能：客户管理`，而 `customer` 已经存在，工作流不会重复创建模块，会自动切到 `功能迭代：客户管理`。

## 已补齐的关键能力

- 新增功能会自动创建变更记录，不会留下空的 changed-files 或 verification。
- 删除功能会先 dry-run，再确认 apply；apply 后会更新 registry、graph、memory、handover、changelog，并跑 orphan 检查。
- `features.json` 支持完整 ownership：后端、前端、API、页面、数据库表、权限、菜单 SQL、Mapper XML、组件、测试、文档。
- `npm run check:diff` 会检查实际变更文件是否落在 `impact.allowedEditRoots` 内。
- 扫描器已经按 adapter 工作：默认 generic，可切到 RuoYi。
- RuoYi adapter 支持 `ruoyi-business`、`ruoyi-admin`、`ruoyi-ui`、`sql`、权限和菜单 ownership。
- 共享组件必须登记到组件 catalog；功能模块内部不能随意创建明显可复用的通用控件。
- 变更完成时可用 `npm run finalize:change` 自动写入 changed-files、verification、handover、CHANGELOG 和 TASKS。

## 接入 RuoYi 项目

如果你用原始若依或 RuoYi-Vue 项目，先让 Codex 执行：

```bash
npm run profile:setup
```

RuoYi 模块默认落在：

```text
ruoyi-business/src/main/java/com/ruoyi/business/<功能id>/
ruoyi-admin/src/main/java/com/ruoyi/web/controller/business/<功能id>/
ruoyi-ui/src/views/<功能id>/
ruoyi-ui/src/api/<功能id>.contract.md
sql/<功能id>.ownership.md
```

锁定 profile 后，业务开发不能随意改扫描器、规则、脚本、包命令和项目画像。确实需要升级规则时，必须走 rule-change 变更。

## 固定规则

- 新会话先读 `AGENTS.md`，再运行 `npm run resume`。
- 你可以在聊天中只说中文功能名，例如 `新增功能：客户管理`；系统先查 `ai/registry/feature-id-dictionary.json`，自动得到 `id=customer`。词典外功能必须先补词典或使用 `--id demo-feature --name 显示名称`。
- 新增、迭代、删除功能都必须有 `ai/changes/` 变更记录。
- 公共组件必须登记到 `ai/registry/components.json` 和当前 adapter 的 `components/catalog.json`。
- 删除功能只能删除登记过或 scanner 能识别的 ownership；真实数据库、菜单、权限、SQL、Mapper XML 必须登记后才能可靠清理。
- Codex 说完成前，必须给出 `npm run check` 的结果。

## Chat Command Entry

Use `npm run ai:do -- "新增功能：客户管理"`, `npm run ai:do -- "功能迭代：客户管理"`, `npm run ai:do -- "删除功能预分析：客户管理"`, or `npm run ai:do -- "确认删除：客户管理"` as the single Codex App chat-driven entry. Runtime implementation must stay inside `impact.allowedEditRoots` and finish with `npm run check`.
