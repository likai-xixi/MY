-- R-12A destructive masterdata option-set/value cutover (Strategy A).
-- Preconditions: stop all writers and capture a checksum-backed full database backup including
-- sys_menu/sys_role_menu. Run this file without force/continue-on-error in one MySQL session.
-- The preflight assertions execute before any persistent write. Later assertion failures retain
-- both source tables; remove the newly created target tables before retrying after the cause is fixed.
-- Rollback is whole-state only: stop the new runtime, restore the complete pre-cutover backup, and
-- deploy the matching pre-cutover code revision. Partial recreation and mixed code/schema are forbidden.

create temporary table r12a_preflight_assertion (
  check_name varchar(96) not null,
  violation_count bigint not null,
  constraint chk_r12a_preflight_assertion check (violation_count = 0)
);

insert into r12a_preflight_assertion(check_name, violation_count)
select 'source_tables_exist', abs(count(*) - 2)
from information_schema.tables
where table_schema = database()
  and table_name in ('masterdata_sales_option_category', 'masterdata_sales_option_value');

insert into r12a_preflight_assertion(check_name, violation_count)
select 'target_tables_absent', count(*)
from information_schema.tables
where table_schema = database()
  and table_name in ('masterdata_option_set', 'masterdata_option_value');

-- Strategy A is intentionally bound to the inspected 4/2 source inventory.
insert into r12a_preflight_assertion(check_name, violation_count)
select 'source_option_set_count_is_4', abs(count(*) - 4)
from masterdata_sales_option_category;

insert into r12a_preflight_assertion(check_name, violation_count)
select 'source_option_value_count_is_2', abs(count(*) - 2)
from masterdata_sales_option_value;

insert into r12a_preflight_assertion(check_name, violation_count)
select 'source_option_set_code_unique', count(*)
from (
  select category_code
  from masterdata_sales_option_category
  group by category_code
  having count(*) > 1
) duplicate_set;

insert into r12a_preflight_assertion(check_name, violation_count)
select 'source_option_value_set_code_unique', count(*)
from (
  select category_id, option_code
  from masterdata_sales_option_value
  group by category_id, option_code
  having count(*) > 1
) duplicate_value;

insert into r12a_preflight_assertion(check_name, violation_count)
select 'source_option_value_has_parent', count(*)
from masterdata_sales_option_value child
left join masterdata_sales_option_category parent on parent.category_id = child.category_id
where parent.category_id is null;

insert into r12a_preflight_assertion(check_name, violation_count)
select 'source_tables_have_no_inbound_fk', count(*)
from information_schema.referential_constraints
where constraint_schema = database()
  and referenced_table_name in ('masterdata_sales_option_category', 'masterdata_sales_option_value');

insert into r12a_preflight_assertion(check_name, violation_count)
select 'old_option_menu_is_singular', abs(count(*) - 1)
from sys_menu option_menu
join sys_menu masterdata_menu on masterdata_menu.menu_id = option_menu.parent_id
where masterdata_menu.menu_name = '主数据配置'
  and masterdata_menu.path = 'masterdata'
  and option_menu.menu_name = '销售选项配置'
  and option_menu.path = 'sales-option-config'
  and option_menu.component = 'masterdata/sales-option-config'
  and option_menu.route_name = 'MasterdataSalesOptionConfig';

insert into r12a_preflight_assertion(check_name, violation_count)
select 'new_option_menu_has_no_conflict', count(*)
from sys_menu
where menu_name = '选项配置'
   or path = 'option-config'
   or component = 'masterdata/option-config'
   or route_name = 'MasterdataOptionConfig';

insert into r12a_preflight_assertion(check_name, violation_count)
select 'product_menu_is_singular', abs(count(*) - 1)
from sys_menu product_menu
join sys_menu masterdata_menu on masterdata_menu.menu_id = product_menu.parent_id
where masterdata_menu.menu_name = '主数据配置'
  and masterdata_menu.path = 'masterdata'
  and product_menu.path = 'product-config'
  and product_menu.component = 'masterdata/product-config';

insert into r12a_preflight_assertion(check_name, violation_count)
select 'old_permission_alias_absent', count(*)
from sys_menu
where perms like '%sales-option%';

-- The inspected acceptance database had lost the V005 hierarchy mutex row. Permit only the
-- deterministic missing-row case; conflicting reuse of the reserved id or code must stop cutover.
insert into r12a_preflight_assertion(check_name, violation_count)
select 'product_category_mutex_identity_has_no_conflict', count(*)
from masterdata_product_category
where (category_id = -1 and category_code <> '__MD_PRODUCT_CATEGORY_HIERARCHY_MUTEX__')
   or (category_id <> -1 and category_code = '__MD_PRODUCT_CATEGORY_HIERARCHY_MUTEX__');

create temporary table r12a_menu_identity as
select option_menu.menu_id
from sys_menu option_menu
join sys_menu masterdata_menu on masterdata_menu.menu_id = option_menu.parent_id
where masterdata_menu.menu_name = '主数据配置'
  and masterdata_menu.path = 'masterdata'
  and option_menu.menu_name = '销售选项配置'
  and option_menu.path = 'sales-option-config'
  and option_menu.component = 'masterdata/sales-option-config'
  and option_menu.route_name = 'MasterdataSalesOptionConfig';

drop temporary table r12a_preflight_assertion;

-- Recorded dirty-data correction: recreate and normalize exactly one permanent hidden mutex row.
-- Business rows are untouched; normal queries exclude this row because del_flag remains '2'.
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

create table masterdata_option_set (
  option_set_id bigint not null auto_increment comment 'option set id',
  option_set_code varchar(64) not null comment 'stable option set code',
  option_set_name varchar(120) not null comment 'display option set name',
  selection_mode varchar(16) not null comment 'SINGLE or MULTIPLE',
  status char(1) default '0' comment '0 normal, 1 disabled',
  sort_order int default 0 comment 'sort order',
  del_flag char(1) default '0' comment '0 exists, 2 deleted',
  create_by varchar(64) default '' comment 'created by',
  create_time datetime default null comment 'created at',
  update_by varchar(64) default '' comment 'updated by',
  update_time datetime default null comment 'updated at',
  remark varchar(500) default null comment 'remark',
  primary key (option_set_id),
  unique key uk_masterdata_option_set_code (option_set_code),
  key idx_masterdata_option_set_status (status, del_flag),
  constraint chk_masterdata_option_set_selection_mode
    check (selection_mode in ('SINGLE', 'MULTIPLE'))
) engine=innodb default charset=utf8mb4 comment='masterdata reusable option set';

create table masterdata_option_value (
  option_value_id bigint not null auto_increment comment 'option value id',
  option_set_id bigint not null comment 'owning option set id',
  option_value_code varchar(64) not null comment 'stable option value code',
  option_value_name varchar(120) not null comment 'display option value name',
  status char(1) default '0' comment '0 normal, 1 disabled',
  sort_order int default 0 comment 'sort order',
  del_flag char(1) default '0' comment '0 exists, 2 deleted',
  create_by varchar(64) default '' comment 'created by',
  create_time datetime default null comment 'created at',
  update_by varchar(64) default '' comment 'updated by',
  update_time datetime default null comment 'updated at',
  remark varchar(500) default null comment 'remark',
  primary key (option_value_id),
  unique key uk_masterdata_option_value_set_code (option_set_id, option_value_code),
  key idx_masterdata_option_value_status (status, del_flag),
  constraint fk_masterdata_option_value_set
    foreign key (option_set_id) references masterdata_option_set (option_set_id)
    on update restrict on delete restrict
) engine=innodb default charset=utf8mb4 comment='masterdata reusable option value';

insert into masterdata_option_set(
  option_set_id, option_set_code, option_set_name, selection_mode,
  status, sort_order, del_flag, create_by, create_time, update_by, update_time, remark
)
select
  category_id, category_code, category_name, 'SINGLE',
  status, sort_order, del_flag, create_by, create_time, update_by, update_time, remark
from masterdata_sales_option_category;

insert into masterdata_option_value(
  option_value_id, option_set_id, option_value_code, option_value_name,
  status, sort_order, del_flag, create_by, create_time, update_by, update_time, remark
)
select
  option_id, category_id, option_code, option_name,
  status, sort_order, del_flag, create_by, create_time, update_by, update_time, remark
from masterdata_sales_option_value;

create temporary table r12a_postcopy_assertion (
  check_name varchar(96) not null,
  violation_count bigint not null,
  constraint chk_r12a_postcopy_assertion check (violation_count = 0)
);

insert into r12a_postcopy_assertion(check_name, violation_count)
select 'option_set_count_reconciled',
       abs((select count(*) from masterdata_sales_option_category)
           - (select count(*) from masterdata_option_set));

insert into r12a_postcopy_assertion(check_name, violation_count)
select 'option_value_count_reconciled',
       abs((select count(*) from masterdata_sales_option_value)
           - (select count(*) from masterdata_option_value));

insert into r12a_postcopy_assertion(check_name, violation_count)
select 'option_set_fields_preserved', count(*)
from masterdata_sales_option_category source
left join masterdata_option_set target on target.option_set_id = source.category_id
where target.option_set_id is null
   or not (target.option_set_code <=> source.category_code)
   or not (target.option_set_name <=> source.category_name)
   or target.selection_mode <> 'SINGLE'
   or not (target.status <=> source.status)
   or not (target.sort_order <=> source.sort_order)
   or not (target.del_flag <=> source.del_flag)
   or not (target.create_by <=> source.create_by)
   or not (target.create_time <=> source.create_time)
   or not (target.update_by <=> source.update_by)
   or not (target.update_time <=> source.update_time)
   or not (target.remark <=> source.remark);

insert into r12a_postcopy_assertion(check_name, violation_count)
select 'option_value_fields_preserved', count(*)
from masterdata_sales_option_value source
left join masterdata_option_value target on target.option_value_id = source.option_id
where target.option_value_id is null
   or not (target.option_set_id <=> source.category_id)
   or not (target.option_value_code <=> source.option_code)
   or not (target.option_value_name <=> source.option_name)
   or not (target.status <=> source.status)
   or not (target.sort_order <=> source.sort_order)
   or not (target.del_flag <=> source.del_flag)
   or not (target.create_by <=> source.create_by)
   or not (target.create_time <=> source.create_time)
   or not (target.update_by <=> source.update_by)
   or not (target.update_time <=> source.update_time)
   or not (target.remark <=> source.remark);

insert into r12a_postcopy_assertion(check_name, violation_count)
select 'option_set_modes_are_single', count(*)
from masterdata_option_set
where selection_mode <> 'SINGLE';

insert into r12a_postcopy_assertion(check_name, violation_count)
select 'option_value_has_physical_parent', count(*)
from masterdata_option_value value_row
left join masterdata_option_set set_row on set_row.option_set_id = value_row.option_set_id
where set_row.option_set_id is null;

insert into r12a_postcopy_assertion(check_name, violation_count)
select 'product_category_mutex_is_present', abs(count(*) - 1)
from masterdata_product_category
where category_id = -1
  and category_code = '__MD_PRODUCT_CATEGORY_HIERARCHY_MUTEX__'
  and del_flag = '2';

drop temporary table r12a_postcopy_assertion;

-- Preserve the existing menu_id so sys_role_menu assignments survive the vocabulary cutover.
update sys_menu option_menu
join r12a_menu_identity original_menu on original_menu.menu_id = option_menu.menu_id
set option_menu.menu_name = '选项配置',
    option_menu.path = 'option-config',
    option_menu.component = 'masterdata/option-config',
    option_menu.route_name = 'MasterdataOptionConfig',
    option_menu.remark = '选项集、选项值',
    option_menu.update_by = 'admin',
    option_menu.update_time = sysdate();

update sys_menu product_menu
join sys_menu masterdata_menu on masterdata_menu.menu_id = product_menu.parent_id
set product_menu.remark = '产品大类、产品系列、产品型号',
    product_menu.update_by = 'admin',
    product_menu.update_time = sysdate()
where masterdata_menu.menu_name = '主数据配置'
  and masterdata_menu.path = 'masterdata'
  and product_menu.path = 'product-config'
  and product_menu.component = 'masterdata/product-config';

create temporary table r12a_postmenu_assertion (
  check_name varchar(96) not null,
  violation_count bigint not null,
  constraint chk_r12a_postmenu_assertion check (violation_count = 0)
);

insert into r12a_postmenu_assertion(check_name, violation_count)
select 'new_option_menu_identity_preserved', abs(count(*) - 1)
from sys_menu option_menu
join r12a_menu_identity original_menu on original_menu.menu_id = option_menu.menu_id
where option_menu.menu_name = '选项配置'
  and option_menu.path = 'option-config'
  and option_menu.component = 'masterdata/option-config'
  and option_menu.route_name = 'MasterdataOptionConfig';

insert into r12a_postmenu_assertion(check_name, violation_count)
select 'new_option_menu_is_singular', abs(count(*) - 1)
from sys_menu
where menu_name = '选项配置'
  and path = 'option-config'
  and component = 'masterdata/option-config'
  and route_name = 'MasterdataOptionConfig';

insert into r12a_postmenu_assertion(check_name, violation_count)
select 'old_option_menu_absent', count(*)
from sys_menu
where menu_name = '销售选项配置'
   or path = 'sales-option-config'
   or component = 'masterdata/sales-option-config'
   or route_name = 'MasterdataSalesOptionConfig';

insert into r12a_postmenu_assertion(check_name, violation_count)
select 'old_permission_alias_absent', count(*)
from sys_menu
where perms like '%sales-option%';

insert into r12a_postmenu_assertion(check_name, violation_count)
select 'product_model_wording_updated', abs(count(*) - 1)
from sys_menu product_menu
join sys_menu masterdata_menu on masterdata_menu.menu_id = product_menu.parent_id
where masterdata_menu.menu_name = '主数据配置'
  and masterdata_menu.path = 'masterdata'
  and product_menu.path = 'product-config'
  and product_menu.component = 'masterdata/product-config'
  and product_menu.remark = '产品大类、产品系列、产品型号';

drop temporary table r12a_postmenu_assertion;
drop temporary table r12a_menu_identity;

-- This is the final destructive business DDL and removes both legacy tables together.
drop table masterdata_sales_option_value, masterdata_sales_option_category;

select 'migrated_option_set_count' as check_name, count(*) as actual
from masterdata_option_set;

select 'migrated_option_value_count' as check_name, count(*) as actual
from masterdata_option_value;

select 'migrated_single_mode_count' as check_name, count(*) as actual
from masterdata_option_set
where selection_mode = 'SINGLE';

select 'old_table_count' as check_name, count(*) as actual
from information_schema.tables
where table_schema = database()
  and table_name in ('masterdata_sales_option_category', 'masterdata_sales_option_value');

select 'new_option_menu_count' as check_name, count(*) as actual
from sys_menu
where menu_name = '选项配置'
  and path = 'option-config'
  and component = 'masterdata/option-config'
  and route_name = 'MasterdataOptionConfig';

select 'product_category_hierarchy_mutex_count' as check_name, count(*) as actual
from masterdata_product_category
where category_id = -1
  and category_code = '__MD_PRODUCT_CATEGORY_HIERARCHY_MUTEX__'
  and del_flag = '2';
