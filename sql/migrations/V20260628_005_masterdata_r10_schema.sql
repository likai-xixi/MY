-- R-10B executable masterdata MVP schema.
-- Scope: nine configurable master-data objects only. Downstream runtime domains remain outside this migration.

create table if not exists masterdata_product_category (
  category_id bigint not null auto_increment comment 'product category id',
  category_code varchar(64) not null comment 'stable category code',
  category_name varchar(120) not null comment 'display category name',
  parent_id bigint default null comment 'optional parent category id',
  status char(1) default '0' comment '0 normal, 1 disabled',
  sort_order int default 0 comment 'sort order',
  del_flag char(1) default '0' comment '0 exists, 2 deleted',
  create_by varchar(64) default '' comment 'created by',
  create_time datetime default null comment 'created at',
  update_by varchar(64) default '' comment 'updated by',
  update_time datetime default null comment 'updated at',
  remark varchar(500) default null comment 'remark',
  primary key (category_id),
  unique key uk_masterdata_product_category_code (category_code),
  key idx_masterdata_product_category_parent (parent_id),
  key idx_masterdata_product_category_status (status, del_flag)
) engine=innodb default charset=utf8mb4 comment='masterdata product category';

-- Permanent hidden row used only to serialize product-category hierarchy writes.
-- Keep this row logically deleted so normal business queries and code allocation ignore it.
insert ignore into masterdata_product_category (
  category_id, category_code, category_name, parent_id, status, sort_order,
  del_flag, create_by, create_time, update_by, update_time, remark
) values (
  -1, '__MD_PRODUCT_CATEGORY_HIERARCHY_MUTEX__', '__masterdata hierarchy mutex__',
  null, '1', 0, '2', 'system', now(), 'system', now(),
  'Permanent hidden row used only to serialize product-category hierarchy writes.'
);

update masterdata_product_category
set category_code = '__MD_PRODUCT_CATEGORY_HIERARCHY_MUTEX__',
  category_name = '__masterdata hierarchy mutex__',
  parent_id = null,
  status = '1',
  sort_order = 0,
  del_flag = '2',
  update_by = 'system',
  update_time = now(),
  remark = 'Permanent hidden row used only to serialize product-category hierarchy writes.'
where category_id = -1;

create table if not exists masterdata_product_series (
  series_id bigint not null auto_increment comment 'product series id',
  category_id bigint not null comment 'product category id',
  series_code varchar(64) not null comment 'stable series code',
  series_name varchar(120) not null comment 'display series name',
  status char(1) default '0' comment '0 normal, 1 disabled',
  sort_order int default 0 comment 'sort order',
  del_flag char(1) default '0' comment '0 exists, 2 deleted',
  create_by varchar(64) default '' comment 'created by',
  create_time datetime default null comment 'created at',
  update_by varchar(64) default '' comment 'updated by',
  update_time datetime default null comment 'updated at',
  remark varchar(500) default null comment 'remark',
  primary key (series_id),
  unique key uk_masterdata_product_series_code (series_code),
  key idx_masterdata_product_series_category (category_id),
  key idx_masterdata_product_series_status (status, del_flag)
) engine=innodb default charset=utf8mb4 comment='masterdata product series';

create table if not exists masterdata_product_model (
  model_id bigint not null auto_increment comment 'product model id',
  category_id bigint not null comment 'product category id',
  series_id bigint not null comment 'product series id',
  model_code varchar(64) not null comment 'stable model code',
  model_name varchar(120) not null comment 'display model name',
  status char(1) default '0' comment '0 normal, 1 disabled',
  sort_order int default 0 comment 'sort order',
  del_flag char(1) default '0' comment '0 exists, 2 deleted',
  create_by varchar(64) default '' comment 'created by',
  create_time datetime default null comment 'created at',
  update_by varchar(64) default '' comment 'updated by',
  update_time datetime default null comment 'updated at',
  remark varchar(500) default null comment 'remark',
  primary key (model_id),
  unique key uk_masterdata_product_model_code (model_code),
  key idx_masterdata_product_model_category (category_id),
  key idx_masterdata_product_model_series (series_id),
  key idx_masterdata_product_model_status (status, del_flag)
) engine=innodb default charset=utf8mb4 comment='masterdata product model';

create table if not exists masterdata_material_category (
  category_id bigint not null auto_increment comment 'material category id',
  category_code varchar(64) not null comment 'stable category code',
  category_name varchar(120) not null comment 'display category name',
  status char(1) default '0' comment '0 normal, 1 disabled',
  sort_order int default 0 comment 'sort order',
  del_flag char(1) default '0' comment '0 exists, 2 deleted',
  create_by varchar(64) default '' comment 'created by',
  create_time datetime default null comment 'created at',
  update_by varchar(64) default '' comment 'updated by',
  update_time datetime default null comment 'updated at',
  remark varchar(500) default null comment 'remark',
  primary key (category_id),
  unique key uk_masterdata_material_category_code (category_code),
  key idx_masterdata_material_category_status (status, del_flag)
) engine=innodb default charset=utf8mb4 comment='masterdata material category';

create table if not exists masterdata_material_item (
  material_id bigint not null auto_increment comment 'material item id',
  category_id bigint not null comment 'material category id',
  material_code varchar(64) not null comment 'stable material code',
  material_name varchar(120) not null comment 'display material name',
  spec varchar(120) default null comment 'specification label',
  unit varchar(32) default null comment 'unit',
  status char(1) default '0' comment '0 normal, 1 disabled',
  sort_order int default 0 comment 'sort order',
  del_flag char(1) default '0' comment '0 exists, 2 deleted',
  create_by varchar(64) default '' comment 'created by',
  create_time datetime default null comment 'created at',
  update_by varchar(64) default '' comment 'updated by',
  update_time datetime default null comment 'updated at',
  remark varchar(500) default null comment 'remark',
  primary key (material_id),
  unique key uk_masterdata_material_item_code (material_code),
  key idx_masterdata_material_item_category (category_id),
  key idx_masterdata_material_item_status (status, del_flag)
) engine=innodb default charset=utf8mb4 comment='masterdata material item';

create table if not exists masterdata_accessory_category (
  category_id bigint not null auto_increment comment 'accessory category id',
  category_code varchar(64) not null comment 'stable category code',
  category_name varchar(120) not null comment 'display category name',
  status char(1) default '0' comment '0 normal, 1 disabled',
  sort_order int default 0 comment 'sort order',
  del_flag char(1) default '0' comment '0 exists, 2 deleted',
  create_by varchar(64) default '' comment 'created by',
  create_time datetime default null comment 'created at',
  update_by varchar(64) default '' comment 'updated by',
  update_time datetime default null comment 'updated at',
  remark varchar(500) default null comment 'remark',
  primary key (category_id),
  unique key uk_masterdata_accessory_category_code (category_code),
  key idx_masterdata_accessory_category_status (status, del_flag)
) engine=innodb default charset=utf8mb4 comment='masterdata accessory category';

create table if not exists masterdata_accessory_item (
  accessory_id bigint not null auto_increment comment 'accessory item id',
  category_id bigint not null comment 'accessory category id',
  accessory_code varchar(64) not null comment 'stable accessory code',
  accessory_name varchar(120) not null comment 'display accessory name',
  spec varchar(120) default null comment 'specification label',
  unit varchar(32) default null comment 'unit',
  status char(1) default '0' comment '0 normal, 1 disabled',
  sort_order int default 0 comment 'sort order',
  del_flag char(1) default '0' comment '0 exists, 2 deleted',
  create_by varchar(64) default '' comment 'created by',
  create_time datetime default null comment 'created at',
  update_by varchar(64) default '' comment 'updated by',
  update_time datetime default null comment 'updated at',
  remark varchar(500) default null comment 'remark',
  primary key (accessory_id),
  unique key uk_masterdata_accessory_item_code (accessory_code),
  key idx_masterdata_accessory_item_category (category_id),
  key idx_masterdata_accessory_item_status (status, del_flag)
) engine=innodb default charset=utf8mb4 comment='masterdata accessory item';

create table if not exists masterdata_sales_option_category (
  category_id bigint not null auto_increment comment 'sales option category id',
  category_code varchar(64) not null comment 'stable category code',
  category_name varchar(120) not null comment 'display category name',
  status char(1) default '0' comment '0 normal, 1 disabled',
  sort_order int default 0 comment 'sort order',
  del_flag char(1) default '0' comment '0 exists, 2 deleted',
  create_by varchar(64) default '' comment 'created by',
  create_time datetime default null comment 'created at',
  update_by varchar(64) default '' comment 'updated by',
  update_time datetime default null comment 'updated at',
  remark varchar(500) default null comment 'remark',
  primary key (category_id),
  unique key uk_masterdata_sales_option_category_code (category_code),
  key idx_masterdata_sales_option_category_status (status, del_flag)
) engine=innodb default charset=utf8mb4 comment='masterdata sales option category';

create table if not exists masterdata_sales_option_value (
  option_id bigint not null auto_increment comment 'sales option value id',
  category_id bigint not null comment 'sales option category id',
  option_code varchar(64) not null comment 'stable option code',
  option_name varchar(120) not null comment 'display option name',
  status char(1) default '0' comment '0 normal, 1 disabled',
  sort_order int default 0 comment 'sort order',
  del_flag char(1) default '0' comment '0 exists, 2 deleted',
  create_by varchar(64) default '' comment 'created by',
  create_time datetime default null comment 'created at',
  update_by varchar(64) default '' comment 'updated by',
  update_time datetime default null comment 'updated at',
  remark varchar(500) default null comment 'remark',
  primary key (option_id),
  unique key uk_masterdata_sales_option_value_code (option_code),
  key idx_masterdata_sales_option_value_category (category_id),
  key idx_masterdata_sales_option_value_status (status, del_flag)
) engine=innodb default charset=utf8mb4 comment='masterdata sales option value';
