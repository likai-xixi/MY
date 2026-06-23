# Feature Brief: 客户管理

## Identity

- ID: `customer`
- Name: 客户管理
- Adapter: locked RuoYi adapter
- Current change: `CR-20260622T150304Z-change`

## Business Problem

客户管理是门业 ERP 的第一个业务主数据模块。它不仅维护通讯录，还要为后续销售订单、发货、收款、对账、样品支持、定金抵扣提供稳定的客户、联系人、收货地址、业务员归属和资金政策基础。

## Users

- 销售/业务员：维护客户资料、联系人、默认地址和归属关系。
- 销售主管：查看并转移客户业务员归属。
- 财务/内勤：查看客户资金账户、录入长期定金和滚动订单定金、维护样品支持政策和返现记录。
- 后续订单/发货模块：读取默认联系人、默认地址、业务员快照和资金政策，不直接改客户余额。

## Scope

- 客户档案列表、新增、编辑、详情、启用/停用、逻辑删除和导出。
- 客户名称、联系电话重复提醒；名称和电话同时重复时强提醒。
- 多联系人维护，只允许一个默认联系人。
- 多收货地址维护，只允许一个默认收货地址。
- 归属业务员选择、归属部门带出、列表筛选、详情展示和业务员转移日志。
- 资金与政策详情：三类账户展示、长期定金录入、滚动订单定金录入、资金流水查看、样品政策配置、样品返现记录生成/查看。
- 菜单、权限、SQL ownership、API/UI/DB/permission graph 和 registry 登记。
- 客户编码、字典展示、省市区选择和列表显示体验优化。
- 新增/编辑弹窗使用完整中国省市区三级行政区划数据源，覆盖省、直辖市、自治区、地级市/州/盟、区/县/县级市，并同时保存行政区划 code 与中文名称。
- 客户简称保留为选填字段，不填时仍由服务端保存为客户名称；客户列表默认不再显示客户简称列，客户简称搜索条件和新增/编辑维护入口保留。
- 新增客户时，基础信息自动派生默认联系人和默认收货地址；编辑客户时仅在用户勾选同步选项后同步到默认联系人/默认收货地址。

## Non-goals

- 不实现销售订单、发货单、自动抵扣、收款认领、对账、发票、合同、提成、公海、小程序。
- 不实现单门定金或订单明细级定金。
- 不新增业务员管理模块；业务员来自 RuoYi `sys_user`/`sys_role`/`sys_dept`。
- 不允许直接修改 `customer_fund_account` 余额；所有资金变化必须由资金流水入口产生。

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
- The monthly sequence starts at `000001`, is at least 6 digits, resets by month, and may expand beyond 6 digits when a month exceeds `999999`.
- `customer.customer_code` is protected by `uk_customer_code`; concurrent inserts retry on duplicate-key conflicts instead of directly editing existing codes.
- Historical test records using the previous `CUS...` code format are not backfilled; mixed historical/new codes may appear in validation data.
- Customer level is stored as enum values but displayed/exported as labels: `A`, `B`, `C`, `NORMAL -> 普通`.
- Customer type is stored as enum values but displayed/exported as Chinese labels: `DEALER -> 经销商`, `PROJECT -> 工程客户`, `RETAIL -> 散户`, `STORE -> 门店`, `OTHER -> 其他`.
- New/edit customer dialogs use a searchable province/city/district cascader. The Cascader value path is administrative division code, and the save payload persists both `province_code`, `city_code`, `district_code` and Chinese `province`, `city`, `district`.
- Region options are maintained outside the large page file in `ruoyi-ui/src/utils/region-data.js`, generated from `china-area-data@5.0.1 (MIT)`, with `value` as code and `label` as Chinese name.
- Region data covers 34 province-level entries. Direct municipalities use a same-name city level, for example `北京市 / 北京市 / 朝阳区`; the source `河南省 / 省直辖县级行政区划 / 济源市` is displayed and echoed as `河南省 / 济源示范区 / 济源市`.
- Customer master and customer shipping addresses now include nullable `province_code`, `city_code`, and `district_code` columns. Historical rows that only have Chinese names are not forcibly backfilled; edit forms try name-based matching and write codes on the next confirmed save.
- If a user selects only part of a province/city/district path, save is blocked with a clear validation message requiring selection down to district/county.
- Customer short name is optional. If it is empty on create or update, the service saves the customer name as the short name.
- Customer short name remains available as an optional search and add/edit field, with add/edit placeholder copy explaining that an empty value falls back to customer name.
- Customer list no longer displays a separate short-name column by default, to reduce duplicate display when `shortName` equals or closely matches `customerName`.
- Customer code list cells use fixed width, no wrapping, overflow ellipsis, and tooltip.
- Customer list shows province/city/district as Chinese names with overflow tooltip.
- Creating a customer auto-creates one default contact from master `contact_name/contact_phone/wechat` when no meaningful submitted contact exists. If the master contact name is empty but the phone exists, the generated child contact uses `默认联系人`.
- Creating a customer auto-creates one default shipping address from master contact, phone, area code/name fields, and detail address when no meaningful submitted address exists and detail address is present.
- Editing a customer does not overwrite existing default contact/address by default. The edit dialog exposes explicit sync checkboxes:
  - `同步到默认联系人`: maps master contact, phone, and WeChat to the default contact, or creates it if missing.
  - `同步到默认收货地址`: maps master contact, phone, province/city/district code/name fields, and detail address to the default address, or creates it if missing.
- If the default shipping address already has `logistics_line`, syncing from master data preserves it. If master detail address is empty, address sync is skipped to avoid creating an invalid shipping address.
- Customer create/update, child default generation/sync, child replacement, and default uniqueness normalization run in the existing customer service transaction.

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

`customer` and `customer_address` both store `province_code`, `city_code`, `district_code` plus Chinese `province`, `city`, and `district`. List, detail, and export continue to display Chinese names; code fields are returned for edit echo and later logistics/region-statistics integrations.

Funds are modeled as account plus flow plus batch/policy records. Balance, frozen amount, and available amount are updated only inside the fund-entry service transaction that writes `customer_fund_flow`.

## Permissions

- Basic: `business:customer:list`, `query`, `add`, `edit`, `remove`, `export`
- Owner: `business:customer:owner:view`, `assign`, `transfer`, `history`
- Fund: `business:customer:fund:view`, `add`, `flow`, `adjust`, `export`
- Sample policy: `business:customer:sample-policy:view`, `edit`

普通客户编辑权限不包含资金调整权限。

## Acceptance Criteria

- 客户可以新增、编辑、查询、停用、导出。
- 新客户自动生成 `KHyyyyMM` monthly sequence code, and same-month inserts increment without duplicate `customer_code`.
- 客户列表、详情 and Excel export display customer type and level labels instead of raw enum values.
- 客户列表默认不显示独立的客户简称列；客户名称仍保持单行点击详情，客户简称搜索条件和新增/编辑维护入口保留。
- 新增/编辑客户 can select province/city/district through a searchable complete cascader, edit forms echo existing province/city/district by code or historical Chinese names, and saved records include both area codes and Chinese names while list/detail/export values remain Chinese names.
- 河南省下可选择完整地级市/示范区，不再只有郑州、洛阳；浙江、山东、广东、北京、上海均可正常选择到区县。
- Empty short name is automatically filled from customer name on create and update.
- 联系人和收货地址支持多条维护，并各自只保留一个默认项。
- 新增客户填写主联系人、联系电话、微信号、省市区和详细地址后，保存会自动生成一条默认联系人和一条默认收货地址。
- 修改客户基础信息时，未勾选同步选项不得覆盖默认联系人或默认收货地址；勾选后只同步对应默认记录，并保持默认联系人/默认地址唯一。
- 客户可以绑定归属业务员和部门，转移业务员时写入转移日志。
- 客户详情页可以查看基础信息、联系人、地址、归属、资金与政策、操作日志。
- 长期定金和滚动订单定金录入会同步账户、批次和资金流水。
- 样品政策可以配置，样品返现记录可以生成、在详情页表格查看，并形成资金流水。
- API、UI、DB、权限、菜单、registry、graph、memory、handover 和 change record 同步。
- `npm run scan:all`, `npm run finalize:change -- --summary "新增客户管理功能"`, `npm run check` 完成后方可关闭。

## Verification

- `npm run resume`
- `npm run ai:do -- "新增功能：客户管理"`
- `npm run impact -- 客户管理`
- `C:\Users\11131\.cache\codex-tools\apache-maven-3.9.9\bin\mvn.cmd -pl ruoyi-admin -am -DskipTests compile`
- `npm --prefix ruoyi-ui run build:prod`
- `npm run scan:all`
- `npm run finalize:change -- --summary "新增客户管理功能"`
- `npm run check`
- Runtime closeout keeps the accepted RuoYi menu route at `/business/customer`, verifies new deposit flows with `CUSTOMER_DEPOSIT_BATCH` traceability, shows sample rebate records in the detail UI, and verifies the export button by a 200 XLSX network response.
- Customer UX iteration `CR-20260622T102456Z-change` keeps the same route, changes only customer-owned RuoYi adapter paths, and verifies customer code generation, enum-label display, address cascader behavior, short-name fallback, and export content.
- Region-data follow-up `CR-20260622T114208Z-change` replaces incomplete hand-written cascader options with `china-area-data@5.0.1` generated data in a standalone utility file, verifies complete Henan city coverage, municipality district selection, browser add/edit echo/save, list/detail/export Chinese names, and frontend production build.
- Administrative-code follow-up `CR-20260622T124645Z-change` adds nullable `province_code`, `city_code`, and `district_code` to customer master and shipping addresses, changes Cascader values to codes while saving Chinese names, keeps historical name-only rows compatible, and validates backend compile, frontend production build, runtime DB persistence, browser add/edit/address echo, historical no-code compatibility, list/detail/export Chinese display, XLSX parsing, and final gates.
- Default-child follow-up `CR-20260622T150304Z-change` adds transactional default contact/default shipping-address generation on create and explicit edit-time sync checkboxes so master-data updates do not blindly overwrite child records. Runtime validation created `默认同步UTF8验证客户20260622162301`, confirmed create auto-defaults, no-sync no-overwrite, sync update, preserved logistics line, one active default contact/address, and final gates.

## Traceability

`customer` -> `ruoyi-business/.../customer` + `ruoyi-admin/.../business/customer` -> `memory/API_CATALOG.md` + `graph/api-graph.json` -> `ruoyi-ui/src/views/customer/index.vue` + `ruoyi-ui/src/utils/region-data.js` + `graph/ui-graph.json` -> `ai/registry/features.json` + `ai/registry/modules.json`.
