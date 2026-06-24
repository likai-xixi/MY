# Feature Brief: 客户管理

## Identity

- ID: `customer`
- Name: 客户管理
- Adapter: locked RuoYi adapter
- Current change: `CR-20260624T010638Z-change`

## Business Problem

客户管理是门业 ERP 的第一个业务主数据模块。它不是普通通讯录，而是后续销售订单、发货、收款、对账、样品政策、客户级定金抵扣的客户主数据中心。

当前开发阶段直接采用最终口径：区分真实客户和公共客户，把客户级定金统一为一种 `CUSTOMER_DEPOSIT`，并记录真实客户归属方式、归属来源、收益口径和归属生效时间。不保留旧定金分类、旧数据迁移或旧前端文案兼容。

## Users

- 销售/业务员：维护真实客户资料、联系人、默认地址和业务员自有/维护客户关系。
- 销售主管：查看真实客户厂内归属、分配业务员维护、收回厂内和归属变更日志。
- 财务/内勤：查看真实客户资金账户、录入客户级定金、维护样品支持政策和样品返现记录。
- 后续订单/发货模块：读取真实客户默认联系人、默认地址、归属业务员快照和资金政策；公共客户订单的实际购买人、联系电话、收货地址、接待业务员、来源渠道由销售订单保存快照。

## Customer Nature

- `REAL` 真实客户：经销商、长期合作客户、工程客户、门店客户。可以维护联系人、收货地址、客户归属、客户级定金、样品政策、样品返现。
- `PUBLIC` 公共客户：固定为系统内置分类客户，只用于订单归类，不代表真实买家。

系统内置两个公共客户：

- `PUB_DIRECT_SALE` / 厂内自销客户 / `PUBLIC` / `DIRECT_SALE`
- `PUB_SELF_MEDIA` / 自媒体客户 / `PUBLIC` / `SELF_MEDIA`

公共客户规则：

- 只允许两个内置公共客户：`PUB_DIRECT_SALE` / 厂内自销客户、`PUB_SELF_MEDIA` / 自媒体客户。
- Only two built-in PUBLIC classification customers are allowed: `PUB_DIRECT_SALE` and `PUB_SELF_MEDIA`; normal customer UI/API flows must not create additional PUBLIC rows.
- 不再作为普通客户新增入口，不允许手工新增更多 PUBLIC 公共客户。
- 不允许普通编辑、删除、停用或归属变更。
- 不展示/不维护客户类型、客户等级；后端仅为技术兼容固定保存 `customerType=OTHER`、`customerLevel=NORMAL`，前端不展示成“经销商 / 普通”。
- 不强制联系人。
- 不强制收货地址。
- 不启用客户级定金。
- 不绑定固定归属业务员。
- 不启用客户级样品政策和样品返现。
- 厂内直销、自媒体订单的实际购买人、联系电话、收货地址、接待业务员、来源平台、具体账号，后续放到销售订单主表快照字段。
- 展厅、抖音、快手、视频号、具体账号、接待业务员和真实买家信息不拆成更多公共客户。

## Owner Rules

- 新增 `REAL` 真实客户默认归厂内客户池：`ownerType=FACTORY`、`ownerSource=FACTORY_POOL`、`ownerProfitMode=NONE`，不要求选择业务员。
- 真实客户选择 `FACTORY` 厂内时，清空 `ownerUserId/ownerUserName/ownerDeptId/ownerDeptName`，列表归属业务员显示“厂内”。
- 真实客户选择 `SALESMAN` 业务员时必须选择归属业务员，并选择归属来源：
  - `FACTORY_ASSIGNED` 厂内分配维护，对应 `ownerProfitMode=MAINTENANCE_FEE` 维护费口径。
  - `SALESMAN_SELF` 业务员自有客户，对应 `ownerProfitMode=SALES_COMMISSION` 业务提成口径。
- `ownerEffectiveTime` 记录当前归属生效时间；归属变更只影响该时间之后提交的销售订单。
- 后续 `sales-order` 模块应在订单提交时冻结客户归属快照；`ownerEffectiveTime` 之前已提交订单不受后续归属变更影响。
- 当前客户管理只记录收益口径和生效时间，不计算维护费金额、业务提成金额，也不做历史订单回算。
- `PUBLIC` 公共客户固定为 `ownerType=NONE`、`ownerSource=NONE`、`ownerProfitMode=NONE`、`ownerEffectiveTime=null`，不允许执行归属变更。

## Scope

- 客户档案列表、新增、编辑、详情、启用/停用、逻辑删除和导出。
- 客户性质、公共客户渠道筛选和维护。
- 客户名称、联系电话重复提醒；名称和电话同时重复时强提醒，电话重复查询会先 trim 且只对合法手机号参与查重。
- 真实客户多联系人维护，只允许一个默认联系人。
- 真实客户多收货地址维护，只允许一个默认收货地址。
- 真实客户归属方式选择、归属业务员和部门带出、归属来源/收益口径记录、列表筛选、详情展示和归属变更日志。
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
- New customer dialogs default to `REAL` and do not offer `PUBLIC` as a normal customer nature option.
- Edit customer dialogs only support `REAL` customers. PUBLIC built-in customers cannot enter the normal edit flow and cannot be switched to REAL.
- New/edit REAL customer dialogs always require customer name, customer nature, customer type, and customer level.
- New/edit REAL customer dialogs additionally require main contact, contact phone, complete province/city/district selection down to district/county, and detail address.
- New/edit REAL customer dialogs default owner type to `FACTORY`; owner salesman is required only when owner type is `SALESMAN`.
- REAL owner source/profit options are fixed pairs: factory-assigned maintenance uses `MAINTENANCE_FEE`; salesman-self uses `SALES_COMMISSION`.
- New/edit REAL customer dialogs trim the master contact phone and require it to be an 11-digit mainland China mobile number. Additional contact phone and shipping-address receiver phone fields remain optional, are also trimmed, and if filled must use the same mobile-number format.
- PUBLIC built-in customers are maintained by SQL seed/initialization data only. If the database is missing a built-in public customer, it must be restored from seed data rather than created through the normal customer dialog.
- Public customer add/edit and detail base tab display: `公共客户仅用于订单归类，实际购买人、联系电话、收货地址、接待业务员请在销售订单中填写。`
- Public customer list/detail type and level display as `系统分类` / `-` instead of the technical compatibility values `OTHER` / `NORMAL`.
- Public customer detail fund area displays: `公共客户不启用客户级定金，订单收款请在销售订单中记录本单定金。`
- Customer short name is optional. If it is empty on create or update, the service saves the customer name as the short name.
- Customer code list cells use fixed width, no wrapping, overflow ellipsis, and tooltip.
- Customer list shows province/city/district as Chinese names with overflow tooltip.
- Creating a real customer auto-creates one default contact from master `contact_name/contact_phone/wechat` when no meaningful submitted contact exists.
- Creating a real customer auto-creates one default shipping address from master contact, phone, area code/name fields, and detail address when no meaningful submitted address exists and detail address is present.
- Editing a real customer exposes explicit sync checkboxes:
  - `同步到默认联系人`: maps master contact, phone, and WeChat to the default contact, or creates it if missing.
  - `同步到默认收货地址`: maps master contact, phone, province/city/district code/name fields, and detail address to the default address, or creates it if missing.
- The edit dialog checks both sync options by default for REAL customers; cancelling either checkbox means the backend must not overwrite that default child record on save.
- User requirement: when editing a REAL customer, both default-contact and default-address sync options must start checked, while the user can uncheck either option before saving.
- Editing a public customer hides sync checkboxes and never creates default contact or default address.
- Public customer rows hide or disable normal edit, delete, status-toggle, owner type, owner salesman, owner source, owner profit controls, and the owner-change action.
- The customer list displays owner type, owner display, owner department, and owner profit mode. Factory-owned real customers show owner display as `厂内`; public customers show `无固定归属`.
- The original owner-transfer action is now `归属变更`, supports assigning factory customers to maintenance, marking salesman-self customers, and returning customers to factory ownership.

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
- `owner_type varchar(32) not null default 'FACTORY'`
- `owner_source varchar(32) not null default 'FACTORY_POOL'`
- `owner_profit_mode varchar(32) not null default 'NONE'`
- `owner_effective_time datetime default null`

Funds are modeled as account plus flow plus batch/policy records. Balance, frozen amount, and available amount are updated only inside the fund-entry service transaction that writes `customer_fund_flow`.

Fund account types:

- `CUSTOMER_DEPOSIT`：客户级定金。
- `SAMPLE_REBATE`：样品返现。

Deposit batch type:

- `CUSTOMER_DEPOSIT`

Deposit flow types:

- `DEPOSIT_IN`

The current customer deposit-entry endpoint is入金-only: `POST /business/customer/{customerId}/fund/deposit` accepts omitted `flowType` or `DEPOSIT_IN` and rejects `DEPOSIT_DEDUCT`、`DEPOSIT_REFUND`、`DEPOSIT_ADJUST`、`DEPOSIT_REVERSE` with a service error. Dedicated deduction/refund/adjust/reversal flows are not implemented in this customer iteration.

Sample rebate generation continues to use `SAMPLE_REBATE_GENERATE` for the sample rebate flow and remains separate from deposit.

## Permissions

- Basic: `business:customer:list`, `query`, `add`, `edit`, `remove`, `export`
- Owner: `business:customer:owner:view`, `assign`, `transfer`, `history`
- Fund: `business:customer:fund:view`, `add`, `flow`, `adjust`, `export`
- Sample policy: `business:customer:sample-policy:view`, `edit`

普通客户编辑权限不包含资金调整权限。公共客户限制由客户服务层校验，不新增权限码。

## Acceptance Criteria

- 普通客户新增/编辑只支持 `REAL`；`PUBLIC` 由 SQL seed/初始化数据维护。
- 可以初始化“厂内自销客户”“自媒体客户”两个公共客户。
- 不能通过普通客户新增、编辑、删除、停用或归属变更内置公共客户。
- 公共客户列表/详情不展示真实客户的客户类型和客户等级口径。
- 公共客户不自动生成默认联系人和默认收货地址。
- 公共客户详情不允许录入客户级定金。
- 客户级定金录入接口只允许入金，不允许通过该接口提交扣减、退款、调整或冲正。
- 新增真实客户默认归厂内，且不要求选择业务员。
- 真实客户仍可维护联系人、收货地址；选择业务员归属时可以记录厂内分配维护或业务员自有客户口径。
- 公共客户固定无固定归属，不允许归属变更。
- 资金与政策页面只显示“定金”和“样品返现”。
- 前端不再出现旧定金分类和旧录入文案。
- 后端新业务只使用 `CUSTOMER_DEPOSIT`，不再使用旧定金账户和旧定金类型。
- SQL ownership 是最终结构，不写旧数据兼容迁移。
- 不引入 sales-order / delivery / finance 模块代码。
- API、UI、DB、权限、菜单、registry、graph、memory、handover 和 change record 同步。
- `npm run scan:all`, `npm run finalize:change -- --summary "客户管理厂内归属与业务员维护口径"`, `npm run check` 完成后方可关闭。

## Verification

- `npm run resume`
- `npm run ai:do -- "功能迭代：客户管理"`
- `npm run impact -- 客户管理`
- Backend compile when Maven is available
- `npm --prefix ruoyi-ui run build:prod`
- `npm run scan:all`
- `npm run finalize:change -- --summary "客户管理厂内归属与业务员维护口径"`
- `npm run check`
- `npm test`

## Traceability

`customer` -> `ruoyi-business/.../customer` + `ruoyi-admin/.../business/customer` -> `memory/API_CATALOG.md` + `graph/api-graph.json` -> `ruoyi-ui/src/views/customer/index.vue` + `ruoyi-ui/src/utils/region-data.js` + `graph/ui-graph.json` -> `ai/registry/features.json` + `ai/registry/modules.json`.
