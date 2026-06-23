# Feature Brief: 客户管理

## Identity

- ID: `customer`
- Name: 客户管理
- Adapter: locked RuoYi adapter
- Current change: `CR-20260623T105432Z-change`

## Business Problem

客户管理是门业 ERP 的第一个业务主数据模块。它不是普通通讯录，而是后续销售订单、发货、收款、对账、样品政策、客户级定金抵扣的客户主数据中心。

本次迭代在开发阶段直接采用最终口径：区分真实客户和公共客户，并把客户级定金统一为一种 `CUSTOMER_DEPOSIT`。不保留旧定金分类、旧数据迁移或旧前端文案兼容。

## Users

- 销售/业务员：维护真实客户资料、联系人、默认地址和归属关系。
- 销售主管：查看并转移真实客户业务员归属。
- 财务/内勤：查看真实客户资金账户、录入客户级定金、维护样品支持政策和样品返现记录。
- 后续订单/发货模块：读取真实客户默认联系人、默认地址、归属业务员快照和资金政策；公共客户订单的实际购买人、联系电话、收货地址、接待业务员、来源渠道由销售订单保存快照。

## Customer Nature

- `REAL` 真实客户：经销商、长期合作客户、工程客户、门店客户。可以维护联系人、收货地址、归属业务员、客户级定金、样品政策、样品返现。
- `PUBLIC` 公共客户：只用于订单归类，不代表真实买家。

系统内置两个公共客户：

- `PUB_DIRECT_SALE` / 厂内自销客户 / `PUBLIC` / `DIRECT_SALE`
- `PUB_SELF_MEDIA` / 自媒体客户 / `PUBLIC` / `SELF_MEDIA`

公共客户规则：

- 不强制联系人。
- 不强制收货地址。
- 不启用客户级定金。
- 不绑定固定归属业务员。
- 不启用客户级样品政策和样品返现。
- 厂内直销、自媒体订单的实际购买人、联系电话、收货地址、接待业务员、来源渠道，后续放到销售订单主表快照字段。

## Scope

- 客户档案列表、新增、编辑、详情、启用/停用、逻辑删除和导出。
- 客户性质、公共客户渠道筛选和维护。
- 客户名称、联系电话重复提醒；名称和电话同时重复时强提醒。
- 真实客户多联系人维护，只允许一个默认联系人。
- 真实客户多收货地址维护，只允许一个默认收货地址。
- 真实客户归属业务员选择、归属部门带出、列表筛选、详情展示和业务员转移日志。
- 真实客户资金与政策详情：定金账户、样品返现账户、定金录入、资金流水查看、样品政策配置、样品返现记录生成/查看。
- 菜单、权限、SQL ownership、API/UI/DB/permission graph 和 registry 登记。
- 客户编码、字典展示、省市区选择和列表显示体验优化。
- 新增/编辑弹窗使用完整中国省市区三级行政区划数据源，覆盖省、直辖市、自治区、地级市/州/盟、区/县/县级市，并同时保存行政区划 code 与中文名称。
- 客户简称保留为选填字段，不填时仍由服务端保存为客户名称；客户列表默认不显示客户简称列，客户简称搜索条件和新增/编辑维护入口保留。
- 新增真实客户时，基础信息自动派生默认联系人和默认收货地址；编辑真实客户时仅在用户勾选同步选项后同步到默认联系人/默认收货地址。

## Non-goals

- 不实现销售订单、发货单、自动抵扣、收款认领、对账、发票、合同、提成、公海、小程序。
- 不开发订单本单定金表、真实购买人订单字段落库、复杂收款规则、授信规则、全款后生产规则。
- 不为公共客户创建每个直销/自媒体买家的客户档案。
- 不实现单门定金或订单明细级定金。
- 不新增业务员管理模块；业务员来自 RuoYi `sys_user`/`sys_role`/`sys_dept`。
- 不允许直接修改 `customer_fund_account` 余额；所有资金变化必须由资金流水入口产生。
- 不保留旧数据迁移、旧资金账户兼容、旧前端文案兼容或旧 API 入参兼容。

## Owned Runtime Paths

- Backend domain/service/mapper: `ruoyi-business/src/main/java/com/ruoyi/business/customer/`
- Backend mapper XML: `ruoyi-business/src/main/resources/mapper/customer/CustomerMapper.xml`
- Controller: `ruoyi-admin/src/main/java/com/ruoyi/web/controller/business/customer/CustomerController.java`
- Frontend page: `ruoyi-ui/src/views/customer/index.vue`
- Frontend region data: `ruoyi-ui/src/utils/region-data.js`
- Frontend API client: `ruoyi-ui/src/api/customer.js`
- SQL/menu/permission ownership: `sql/customer.ownership.md`
- Runtime menu route: `/business/customer` (`业务管理 / 客户管理`)

## Display And Entry Rules

- The accepted runtime route remains `/business/customer`; direct `/customer` is not part of the supported RuoYi menu contract.
- New customer codes use `KH + yyyyMM + monthly sequence`, for example `KH202606000001`.
- Public customer seed codes use `PUB_DIRECT_SALE` and `PUB_SELF_MEDIA`.
- Customer level is stored as enum values but displayed/exported as labels: `A`, `B`, `C`, `NORMAL -> 普通`.
- Customer type is stored as enum values but displayed/exported as Chinese labels: `DEALER -> 经销商`, `PROJECT -> 工程客户`, `RETAIL -> 散户`, `STORE -> 门店`, `OTHER -> 其他`.
- Customer list includes customer-nature and public-channel filters. Public customer rows use a tag to distinguish them from real customers.
- New/edit customer dialogs use a searchable province/city/district cascader for real customers. Public customers hide contact, address, fixed owner, and sync controls.
- Public customer add/edit and detail base tab display: `公共客户仅用于订单归类，实际购买人、联系电话、收货地址、接待业务员请在销售订单中填写。`
- Public customer detail fund area displays: `公共客户不启用客户级定金，订单收款请在销售订单中记录本单定金。`
- Customer short name is optional. If it is empty on create or update, the service saves the customer name as the short name.
- Customer code list cells use fixed width, no wrapping, overflow ellipsis, and tooltip.
- Customer list shows province/city/district as Chinese names with overflow tooltip.
- Creating a real customer auto-creates one default contact from master `contact_name/contact_phone/wechat` when no meaningful submitted contact exists.
- Creating a real customer auto-creates one default shipping address from master contact, phone, area code/name fields, and detail address when no meaningful submitted address exists and detail address is present.
- Editing a real customer exposes explicit sync checkboxes:
  - `同步到默认联系人`: maps master contact, phone, and WeChat to the default contact, or creates it if missing.
  - `同步到默认收货地址`: maps master contact, phone, province/city/district code/name fields, and detail address to the default address, or creates it if missing.
- Editing a public customer hides sync checkboxes and never creates default contact or default address.

## Data Model

- `customer`
- `customer_contact`
- `customer_address`
- `customer_salesman_bind_log`
- `customer_fund_account`
- `customer_fund_flow`
- `customer_deposit_batch`
- `customer_sample_policy`
- `sample_rebate_record`

`customer` includes:

- `customer_nature varchar(32) not null default 'REAL'`
- `public_channel varchar(32) default null`

Funds are modeled as account plus flow plus batch/policy records. Balance, frozen amount, and available amount are updated only inside the fund-entry service transaction that writes `customer_fund_flow`.

Fund account types:

- `CUSTOMER_DEPOSIT`：客户级定金。
- `SAMPLE_REBATE`：样品返现。

Deposit batch type:

- `CUSTOMER_DEPOSIT`

Deposit flow types:

- `DEPOSIT_IN`
- `DEPOSIT_DEDUCT`
- `DEPOSIT_REFUND`
- `DEPOSIT_ADJUST`
- `DEPOSIT_REVERSE`

Sample rebate generation continues to use `SAMPLE_REBATE_GENERATE` for the sample rebate flow and remains separate from deposit.

## Permissions

- Basic: `business:customer:list`, `query`, `add`, `edit`, `remove`, `export`
- Owner: `business:customer:owner:view`, `assign`, `transfer`, `history`
- Fund: `business:customer:fund:view`, `add`, `flow`, `adjust`, `export`
- Sample policy: `business:customer:sample-policy:view`, `edit`

普通客户编辑权限不包含资金调整权限。公共客户限制由客户服务层校验，不新增权限码。

## Acceptance Criteria

- 客户新增/编辑支持 `REAL` / `PUBLIC`。
- 可以初始化“厂内自销客户”“自媒体客户”两个公共客户。
- 公共客户不自动生成默认联系人和默认收货地址。
- 公共客户详情不允许录入客户级定金。
- 真实客户仍可维护联系人、收货地址、归属业务员。
- 资金与政策页面只显示“定金”和“样品返现”。
- 前端不再出现旧定金分类和旧录入文案。
- 后端新业务只使用 `CUSTOMER_DEPOSIT`，不再使用旧定金账户和旧定金类型。
- SQL ownership 是最终结构，不写旧数据兼容迁移。
- 不引入 sales-order / delivery / finance 模块代码。
- API、UI、DB、权限、菜单、registry、graph、memory、handover 和 change record 同步。
- `npm run scan:all`, `npm run finalize:change -- --summary "客户管理公共客户与统一定金模型"`, `npm run check` 完成后方可关闭。

## Verification

- `npm run resume`
- `npm run ai:do -- "功能迭代：客户管理"`
- `npm run impact -- 客户管理`
- Backend compile when Maven is available
- `npm --prefix ruoyi-ui run build:prod`
- `npm run scan:all`
- `npm run finalize:change -- --summary "客户管理公共客户与统一定金模型"`
- `npm run check`
- `npm test`

## Traceability

`customer` -> `ruoyi-business/.../customer` + `ruoyi-admin/.../business/customer` -> `memory/API_CATALOG.md` + `graph/api-graph.json` -> `ruoyi-ui/src/views/customer/index.vue` + `ruoyi-ui/src/utils/region-data.js` + `graph/ui-graph.json` -> `ai/registry/features.json` + `ai/registry/modules.json`.
