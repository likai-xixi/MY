-- R-06 executable customer schema baseline.
-- Scope: customer-owned tables only. No sales-order tables and no idempotent_request table.

create table if not exists customer (
  customer_id bigint not null auto_increment comment 'customer id',
  customer_code varchar(64) not null comment 'customer code',
  customer_name varchar(120) not null comment 'customer name',
  short_name varchar(80) default null comment 'short name',
  customer_nature varchar(32) not null default 'REAL' comment 'REAL or PUBLIC',
  public_channel varchar(32) default null comment 'DIRECT_SALE or SELF_MEDIA for PUBLIC customers',
  customer_type varchar(32) default null comment 'customer type',
  customer_level varchar(32) default null comment 'customer level',
  contact_name varchar(64) default null comment 'main contact',
  contact_phone varchar(64) default null comment 'main contact phone',
  wechat varchar(64) default null comment 'wechat',
  province varchar(64) default null comment 'province name',
  province_code varchar(20) default null comment 'province code',
  city varchar(64) default null comment 'city name',
  city_code varchar(20) default null comment 'city code',
  district varchar(64) default null comment 'district name',
  district_code varchar(20) default null comment 'district code',
  address varchar(255) default null comment 'detail address',
  owner_type varchar(32) not null default 'FACTORY' comment 'FACTORY, SALESMAN, or NONE',
  owner_source varchar(32) not null default 'FACTORY_POOL' comment 'FACTORY_POOL, FACTORY_ASSIGNED, SALESMAN_SELF, or NONE',
  owner_profit_mode varchar(32) not null default 'NONE' comment 'NONE, MAINTENANCE_FEE, or SALES_COMMISSION',
  owner_effective_time datetime default null comment 'current owner effective time',
  owner_user_id bigint default null comment 'owner user id',
  owner_user_name varchar(64) default null comment 'owner user name',
  owner_dept_id bigint default null comment 'owner department id',
  owner_dept_name varchar(64) default null comment 'owner department name',
  status char(1) default '0' comment '0 normal, 1 disabled',
  del_flag char(1) default '0' comment '0 exists, 2 deleted',
  create_by varchar(64) default '' comment 'created by',
  create_time datetime default null comment 'created at',
  update_by varchar(64) default '' comment 'updated by',
  update_time datetime default null comment 'updated at',
  remark varchar(500) default null comment 'remark',
  primary key (customer_id),
  unique key uk_customer_code (customer_code),
  unique key uk_customer_public_channel (customer_nature, public_channel),
  key idx_customer_name_phone (customer_name, contact_phone),
  key idx_customer_nature_channel (customer_nature, public_channel),
  key idx_customer_owner_type (owner_type, owner_source, owner_profit_mode),
  key idx_customer_owner (owner_user_id, owner_dept_id),
  constraint chk_customer_nature check (customer_nature in ('REAL', 'PUBLIC')),
  constraint chk_customer_owner_type check (owner_type in ('FACTORY', 'SALESMAN', 'NONE')),
  constraint chk_customer_owner_source check (owner_source in ('FACTORY_POOL', 'FACTORY_ASSIGNED', 'SALESMAN_SELF', 'NONE')),
  constraint chk_customer_owner_profit_mode check (owner_profit_mode in ('NONE', 'MAINTENANCE_FEE', 'SALES_COMMISSION')),
  constraint chk_customer_public_channel check (
    (customer_nature = 'REAL' and public_channel is null)
    or (customer_nature = 'PUBLIC' and public_channel in ('DIRECT_SALE', 'SELF_MEDIA'))
  ),
  constraint chk_customer_owner_rule check (
    (customer_nature = 'REAL' and owner_type = 'FACTORY' and owner_source = 'FACTORY_POOL' and owner_profit_mode = 'NONE' and owner_user_id is null)
    or (customer_nature = 'REAL' and owner_type = 'SALESMAN' and owner_source = 'FACTORY_ASSIGNED' and owner_profit_mode = 'MAINTENANCE_FEE' and owner_user_id is not null)
    or (customer_nature = 'REAL' and owner_type = 'SALESMAN' and owner_source = 'SALESMAN_SELF' and owner_profit_mode = 'SALES_COMMISSION' and owner_user_id is not null)
    or (customer_nature = 'PUBLIC' and owner_type = 'NONE' and owner_source = 'NONE' and owner_profit_mode = 'NONE' and owner_user_id is null)
  )
) engine=innodb default charset=utf8mb4 comment='customer master';

create table if not exists customer_contact (
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
) engine=innodb default charset=utf8mb4 comment='customer contact';

create table if not exists customer_address (
  address_id bigint not null auto_increment,
  customer_id bigint not null,
  receiver_name varchar(64) default null,
  receiver_phone varchar(64) default null,
  province varchar(64) default null,
  province_code varchar(20) default null comment 'province code',
  city varchar(64) default null,
  city_code varchar(20) default null comment 'city code',
  district varchar(64) default null,
  district_code varchar(20) default null comment 'district code',
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
) engine=innodb default charset=utf8mb4 comment='customer shipping address';

create table if not exists customer_salesman_bind_log (
  log_id bigint not null auto_increment,
  customer_id bigint not null,
  old_owner_type varchar(32) default null,
  new_owner_type varchar(32) default null,
  old_owner_source varchar(32) default null,
  new_owner_source varchar(32) default null,
  old_owner_profit_mode varchar(32) default null,
  new_owner_profit_mode varchar(32) default null,
  old_owner_effective_time datetime default null,
  new_owner_effective_time datetime default null,
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
) engine=innodb default charset=utf8mb4 comment='customer owner change log';

create table if not exists customer_fund_account (
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
) engine=innodb default charset=utf8mb4 comment='customer fund account';

create table if not exists customer_fund_flow (
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
) engine=innodb default charset=utf8mb4 comment='customer fund flow';

create table if not exists customer_deposit_batch (
  deposit_batch_id bigint not null auto_increment,
  deposit_batch_no varchar(64) not null,
  customer_id bigint not null,
  deposit_type varchar(32) not null default 'CUSTOMER_DEPOSIT',
  receipt_no varchar(64) default null comment 'receipt no',
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
) engine=innodb default charset=utf8mb4 comment='customer deposit batch';

create table if not exists customer_sample_policy (
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
) engine=innodb default charset=utf8mb4 comment='customer sample policy';

create table if not exists sample_rebate_record (
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
) engine=innodb default charset=utf8mb4 comment='sample rebate record';
