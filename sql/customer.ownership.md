# 客户管理 RuoYi SQL/Menu/Permission Ownership

Feature ID: `customer`

## Owned Tables

- `customer`
- `customer_contact`
- `customer_address`
- `customer_salesman_bind_log`
- `customer_fund_account`
- `customer_fund_flow`
- `customer_deposit_batch`
- `customer_sample_policy`
- `sample_rebate_record`

## Mapper XML

- `ruoyi-business/src/main/resources/mapper/customer/CustomerMapper.xml`

## Final Business Rules

- Customer nature is stored on `customer.customer_nature`:
  - `REAL`: 真实客户
  - `PUBLIC`: 公共客户
- Public customer channel is stored on `customer.public_channel`:
  - `DIRECT_SALE`: 厂内自销
  - `SELF_MEDIA`: 自媒体
- 公共客户只用于订单归类，不代表真实买家；真实购买人、联系电话、收货地址、接待业务员、来源渠道由后续 `sales-order` 模块在订单主表快照字段保存。
- 公共客户不强制联系人、收货地址，不绑定固定归属业务员，不启用客户级定金、客户级样品政策或样品返现。
- 定金只有一种：`CUSTOMER_DEPOSIT`。样品返现账户 `SAMPLE_REBATE` 独立保留。
- `customer_fund_account.account_type` 只允许 `CUSTOMER_DEPOSIT`、`SAMPLE_REBATE`。
- `customer_deposit_batch.deposit_type` 只允许 `CUSTOMER_DEPOSIT`。
- 定金相关 `customer_fund_flow.flow_type` 只允许 `DEPOSIT_IN`、`DEPOSIT_DEDUCT`、`DEPOSIT_REFUND`、`DEPOSIT_ADJUST`、`DEPOSIT_REVERSE`。
- 所有资金变化必须写入 `customer_fund_flow`；不允许新增 `customer.deposit_balance` 单字段，也不允许手工直接改余额。
- 本项目仍处于开发阶段，本文件只保留最终初始化结构，不包含旧数据迁移、旧资金账户兼容或旧前端文案兼容。

## Permission Codes

### Customer Base

- `business:customer:list`
- `business:customer:query`
- `business:customer:add`
- `business:customer:edit`
- `business:customer:remove`
- `business:customer:export`

### Owner Assignment

- `business:customer:owner:view`
- `business:customer:owner:assign`
- `business:customer:owner:transfer`
- `business:customer:owner:history`

### Funds

- `business:customer:fund:view`
- `business:customer:fund:add`
- `business:customer:fund:flow`
- `business:customer:fund:adjust`
- `business:customer:fund:export`

### Sample Policy

- `business:customer:sample-policy:view`
- `business:customer:sample-policy:edit`

## RuoYi Menu Rows

Use the existing `sys_menu` table. Parent menu `业务管理` should be created once, then `客户管理` belongs under it.

```sql
insert into sys_menu(menu_name, parent_id, order_num, path, component, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, remark)
select '业务管理', 0, 4, 'business', null, 1, 0, 'M', '0', '0', '', 'tree', 'admin', sysdate(), '业务管理目录'
where not exists (select 1 from sys_menu where menu_name = '业务管理' and parent_id = 0);

insert into sys_menu(menu_name, parent_id, order_num, path, component, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, remark)
select '客户管理', menu_id, 1, 'customer', 'customer/index', 1, 0, 'C', '0', '0', 'business:customer:list', 'peoples', 'admin', sysdate(), '客户管理菜单'
from sys_menu
where menu_name = '业务管理' and parent_id = 0
  and not exists (select 1 from sys_menu where perms = 'business:customer:list');
```

Button permissions should be inserted under `客户管理` with `menu_type = 'F'` and `perms` equal to the codes above.

## Table DDL

```sql
create table customer (
  customer_id bigint not null auto_increment comment '客户ID',
  customer_code varchar(64) not null comment '客户编码',
  customer_name varchar(120) not null comment '客户名称',
  short_name varchar(80) default null comment '客户简称',
  customer_nature varchar(32) not null default 'REAL' comment '客户性质（REAL真实客户 PUBLIC公共客户）',
  public_channel varchar(32) default null comment '公共客户渠道（DIRECT_SALE厂内自销 SELF_MEDIA自媒体）',
  customer_type varchar(32) default null comment '客户类型',
  customer_level varchar(32) default null comment '客户等级',
  contact_name varchar(64) default null comment '联系人',
  contact_phone varchar(64) default null comment '联系电话',
  wechat varchar(64) default null comment '微信号',
  province varchar(64) default null comment '省',
  province_code varchar(20) default null comment '省编码',
  city varchar(64) default null comment '市',
  city_code varchar(20) default null comment '市编码',
  district varchar(64) default null comment '区',
  district_code varchar(20) default null comment '区县编码',
  address varchar(255) default null comment '详细地址',
  owner_user_id bigint default null comment '归属业务员ID',
  owner_user_name varchar(64) default null comment '归属业务员名称',
  owner_dept_id bigint default null comment '归属部门ID',
  owner_dept_name varchar(64) default null comment '归属部门名称',
  status char(1) default '0' comment '状态（0正常 1停用）',
  del_flag char(1) default '0' comment '删除标志（0存在 2删除）',
  create_by varchar(64) default '' comment '创建者',
  create_time datetime default null comment '创建时间',
  update_by varchar(64) default '' comment '更新者',
  update_time datetime default null comment '更新时间',
  remark varchar(500) default null comment '备注',
  primary key (customer_id),
  unique key uk_customer_code (customer_code),
  key idx_customer_name_phone (customer_name, contact_phone),
  key idx_customer_nature_channel (customer_nature, public_channel),
  key idx_customer_owner (owner_user_id, owner_dept_id),
  constraint chk_customer_nature check (customer_nature in ('REAL', 'PUBLIC')),
  constraint chk_customer_public_channel check (
    (customer_nature = 'REAL' and public_channel is null)
    or (customer_nature = 'PUBLIC' and public_channel in ('DIRECT_SALE', 'SELF_MEDIA'))
  )
) engine=innodb auto_increment=1 default charset=utf8mb4 comment='客户档案';

create table customer_contact (
  contact_id bigint not null auto_increment,
  customer_id bigint not null,
  contact_name varchar(64) default null,
  phone varchar(64) default null,
  wechat varchar(64) default null,
  position varchar(64) default null,
  contact_role varchar(32) default null,
  is_default char(1) default 'N',
  del_flag char(1) default '0',
  create_by varchar(64) default '',
  create_time datetime default null,
  update_by varchar(64) default '',
  update_time datetime default null,
  remark varchar(500) default null,
  primary key (contact_id),
  key idx_customer_contact_customer (customer_id)
) engine=innodb default charset=utf8mb4 comment='客户联系人';

create table customer_address (
  address_id bigint not null auto_increment,
  customer_id bigint not null,
  receiver_name varchar(64) default null,
  receiver_phone varchar(64) default null,
  province varchar(64) default null,
  province_code varchar(20) default null comment '省编码',
  city varchar(64) default null,
  city_code varchar(20) default null comment '市编码',
  district varchar(64) default null,
  district_code varchar(20) default null comment '区县编码',
  detail_address varchar(255) default null,
  logistics_line varchar(128) default null,
  is_default char(1) default 'N',
  del_flag char(1) default '0',
  create_by varchar(64) default '',
  create_time datetime default null,
  update_by varchar(64) default '',
  update_time datetime default null,
  remark varchar(500) default null,
  primary key (address_id),
  key idx_customer_address_customer (customer_id)
) engine=innodb default charset=utf8mb4 comment='客户收货地址';

create table customer_salesman_bind_log (
  log_id bigint not null auto_increment,
  customer_id bigint not null,
  old_owner_user_id bigint default null,
  old_owner_user_name varchar(64) default null,
  new_owner_user_id bigint default null,
  new_owner_user_name varchar(64) default null,
  old_dept_id bigint default null,
  old_dept_name varchar(64) default null,
  new_dept_id bigint default null,
  new_dept_name varchar(64) default null,
  change_reason varchar(255) default null,
  change_by varchar(64) default null,
  change_time datetime default null,
  remark varchar(500) default null,
  primary key (log_id),
  key idx_customer_salesman_log_customer (customer_id)
) engine=innodb default charset=utf8mb4 comment='客户业务员转移日志';

create table customer_fund_account (
  account_id bigint not null auto_increment,
  customer_id bigint not null,
  account_type varchar(64) not null,
  balance_amount decimal(18,2) default 0.00,
  frozen_amount decimal(18,2) default 0.00,
  available_amount decimal(18,2) default 0.00,
  status char(1) default '0',
  create_by varchar(64) default '',
  create_time datetime default null,
  update_by varchar(64) default '',
  update_time datetime default null,
  remark varchar(500) default null,
  primary key (account_id),
  unique key uk_customer_fund_account (customer_id, account_type),
  constraint chk_customer_fund_account_type check (account_type in ('CUSTOMER_DEPOSIT', 'SAMPLE_REBATE'))
) engine=innodb default charset=utf8mb4 comment='客户资金账户';

create table customer_fund_flow (
  flow_id bigint not null auto_increment,
  customer_id bigint not null,
  account_type varchar(64) not null,
  flow_no varchar(64) not null,
  flow_type varchar(64) not null,
  amount decimal(18,2) not null,
  before_balance decimal(18,2) not null,
  after_balance decimal(18,2) not null,
  related_biz_type varchar(64) default null,
  related_biz_id bigint default null,
  related_biz_no varchar(64) default null,
  operator_id bigint default null,
  occur_time datetime default null,
  create_by varchar(64) default '',
  create_time datetime default null,
  remark varchar(500) default null,
  primary key (flow_id),
  unique key uk_customer_fund_flow_no (flow_no),
  key idx_customer_fund_flow_customer (customer_id, account_type, occur_time),
  constraint chk_customer_fund_flow_account_type check (account_type in ('CUSTOMER_DEPOSIT', 'SAMPLE_REBATE')),
  constraint chk_customer_fund_flow_type check (
    flow_type in ('DEPOSIT_IN', 'DEPOSIT_DEDUCT', 'DEPOSIT_REFUND', 'DEPOSIT_ADJUST', 'DEPOSIT_REVERSE', 'SAMPLE_REBATE_GENERATE')
  )
) engine=innodb default charset=utf8mb4 comment='客户资金流水';

create table customer_deposit_batch (
  deposit_batch_id bigint not null auto_increment,
  deposit_batch_no varchar(64) not null,
  customer_id bigint not null,
  deposit_type varchar(32) not null default 'CUSTOMER_DEPOSIT',
  receipt_no varchar(64) default null comment '收款凭证号',
  deposit_amount decimal(18,2) not null,
  used_amount decimal(18,2) default 0.00,
  remaining_amount decimal(18,2) default 0.00,
  status varchar(32) default 'LOCKED',
  start_time datetime default null,
  settle_time datetime default null,
  create_by varchar(64) default '',
  create_time datetime default null,
  remark varchar(500) default null,
  primary key (deposit_batch_id),
  unique key uk_customer_deposit_batch_no (deposit_batch_no),
  key idx_customer_deposit_batch_customer (customer_id, deposit_type, status),
  constraint chk_customer_deposit_batch_type check (deposit_type = 'CUSTOMER_DEPOSIT')
) engine=innodb default charset=utf8mb4 comment='客户定金批次';

create table customer_sample_policy (
  policy_id bigint not null auto_increment,
  customer_id bigint not null,
  support_mode varchar(64) default 'NONE',
  total_support_rate decimal(10,4) default 0.0000,
  instant_discount_rate decimal(10,4) default 1.0000,
  delivery_deduct_rate decimal(10,4) default 0.0000,
  max_deduct_per_delivery decimal(18,2) default 0.00,
  status char(1) default '0',
  create_by varchar(64) default '',
  create_time datetime default null,
  update_by varchar(64) default '',
  update_time datetime default null,
  remark varchar(500) default null,
  primary key (policy_id),
  unique key uk_customer_sample_policy (customer_id)
) engine=innodb default charset=utf8mb4 comment='客户样品支持政策';

create table sample_rebate_record (
  rebate_record_id bigint not null auto_increment,
  customer_id bigint not null,
  sample_order_id bigint default null,
  sample_order_no varchar(64) default null,
  sample_amount decimal(18,2) not null,
  support_mode varchar(64) default null,
  total_support_rate decimal(10,4) default 0.0000,
  instant_discount_rate decimal(10,4) default 1.0000,
  instant_discount_amount decimal(18,2) default 0.00,
  rebate_amount decimal(18,2) default 0.00,
  used_amount decimal(18,2) default 0.00,
  remaining_amount decimal(18,2) default 0.00,
  status varchar(32) default 'AVAILABLE',
  create_by varchar(64) default '',
  create_time datetime default null,
  update_by varchar(64) default '',
  update_time datetime default null,
  remark varchar(500) default null,
  primary key (rebate_record_id),
  key idx_sample_rebate_customer (customer_id, status)
) engine=innodb default charset=utf8mb4 comment='样品返现记录';
```

## Public Customer Seed Data

```sql
insert into customer(customer_code, customer_name, short_name, customer_nature, public_channel, customer_type, customer_level, status, del_flag, create_by, create_time, remark)
select 'PUB_DIRECT_SALE', '厂内自销客户', '厂内自销客户', 'PUBLIC', 'DIRECT_SALE', 'OTHER', 'NORMAL', '0', '0', 'admin', sysdate(), '系统内置公共客户：厂内自销订单归类'
where not exists (select 1 from customer where customer_code = 'PUB_DIRECT_SALE');

insert into customer(customer_code, customer_name, short_name, customer_nature, public_channel, customer_type, customer_level, status, del_flag, create_by, create_time, remark)
select 'PUB_SELF_MEDIA', '自媒体客户', '自媒体客户', 'PUBLIC', 'SELF_MEDIA', 'OTHER', 'NORMAL', '0', '0', 'admin', sysdate(), '系统内置公共客户：自媒体订单归类'
where not exists (select 1 from customer where customer_code = 'PUB_SELF_MEDIA');
```

## Removal Ownership

Deletion dry-run/apply must remove or archive all files above, menu rows for the RuoYi runtime route `/business/customer`, permission rows with prefix `business:customer:*`, feature registry ownership, module registry ownership, graph/API/UI references, generated scan references, and memory handover/task entries.
