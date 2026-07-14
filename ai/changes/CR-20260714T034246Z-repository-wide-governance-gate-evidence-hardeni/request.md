# Request

治理修复：消除全项目审查中确认的治理假绿、漂移基线与不完整 CI 证据，同时保持业务运行时代码、生产配置和 `beforeSalesOrder` 阶段门不变。

## Intent

- 用项目级、精确 finding、规范化 SHA256 绑定的 RuoYi 遗留基线替代重复的 change-local 路径例外。
- 将变更证据绑定到固定 Git commit OID，并覆盖 base-to-HEAD、staged、unstaged、deleted、renamed 和 untracked 路径。
- 强制审查包先于业务实现提交，绑定批准 feature、运行时根和 revision；业务实现不得在同一 diff 自批审查。
- 让 context、Java 测试归属、CI 锁文件、第三方 Action 固定版本、Maven 集成测试、前端审计和生产构建失败关闭。
- 不修改客户、主数据、公告、生产配置或销售订单运行时代码；不发布或部署。
