-- R-12A immediate post-cutover validation.
-- Run before accepting new writes. Existence/count rows have the expected actual value documented below;
-- violation queries must return zero rows.

select 'database_is_my_ry_vue_runtime' as check_name,
       (database() = 'my_ry_vue_runtime') as actual;

select 'table_exists:masterdata_option_set' as check_name, count(*) as actual
from information_schema.tables
where table_schema = database() and table_name = 'masterdata_option_set';

select 'table_exists:masterdata_option_value' as check_name, count(*) as actual
from information_schema.tables
where table_schema = database() and table_name = 'masterdata_option_value';

select 'old_table_absent:masterdata_sales_option_category' as check_name, count(*) as actual
from information_schema.tables
where table_schema = database() and table_name = 'masterdata_sales_option_category';

select 'old_table_absent:masterdata_sales_option_value' as check_name, count(*) as actual
from information_schema.tables
where table_schema = database() and table_name = 'masterdata_sales_option_value';

-- Strategy A immediate cutover reconciliation: expected 4 sets, 2 values, all four modes SINGLE.
select 'migrated_option_set_count' as check_name, count(*) as actual
from masterdata_option_set;

select 'migrated_option_value_count' as check_name, count(*) as actual
from masterdata_option_value;

select 'migrated_single_mode_count' as check_name, count(*) as actual
from masterdata_option_set
where selection_mode = 'SINGLE';

select 'invalid_selection_mode' as check_name, option_set_id as row_id, selection_mode
from masterdata_option_set
where selection_mode not in ('SINGLE', 'MULTIPLE') or selection_mode is null;

select 'orphan_option_value_set' as check_name,
       child.option_value_id as row_id,
       child.option_set_id as missing_option_set_id
from masterdata_option_value child
left join masterdata_option_set parent
  on parent.option_set_id = child.option_set_id and parent.del_flag = '0'
where child.del_flag = '0' and parent.option_set_id is null;

select 'duplicate_option_set_code' as check_name, option_set_code, count(*) as actual
from masterdata_option_set
group by option_set_code
having count(*) > 1;

select 'duplicate_option_value_set_code' as check_name,
       option_set_id,
       option_value_code,
       count(*) as actual
from masterdata_option_value
group by option_set_id, option_value_code
having count(*) > 1;

select 'selection_mode_check_exists' as check_name, count(*) as actual
from information_schema.table_constraints
where constraint_schema = database()
  and table_name = 'masterdata_option_set'
  and constraint_name = 'chk_masterdata_option_set_selection_mode'
  and constraint_type = 'CHECK';

select 'option_value_set_fk_exists' as check_name, count(*) as actual
from information_schema.referential_constraints
where constraint_schema = database()
  and table_name = 'masterdata_option_value'
  and constraint_name = 'fk_masterdata_option_value_set'
  and referenced_table_name = 'masterdata_option_set'
  and update_rule = 'RESTRICT'
  and delete_rule = 'RESTRICT';

select 'option_set_code_unique_exists' as check_name, count(*) as actual
from information_schema.statistics
where table_schema = database()
  and table_name = 'masterdata_option_set'
  and index_name = 'uk_masterdata_option_set_code'
  and non_unique = 0;

select 'option_value_set_code_unique_columns' as check_name,
       group_concat(column_name order by seq_in_index separator ',') as actual
from information_schema.statistics
where table_schema = database()
  and table_name = 'masterdata_option_value'
  and index_name = 'uk_masterdata_option_value_set_code'
  and non_unique = 0;

select 'new_option_menu_is_singular' as check_name, count(*) as actual
from sys_menu option_menu
join sys_menu masterdata_menu on masterdata_menu.menu_id = option_menu.parent_id
where masterdata_menu.menu_name = '主数据配置'
  and masterdata_menu.path = 'masterdata'
  and option_menu.menu_name = '选项配置'
  and option_menu.path = 'option-config'
  and option_menu.component = 'masterdata/option-config'
  and option_menu.route_name = 'MasterdataOptionConfig';

select 'old_option_menu_absent' as check_name, count(*) as actual
from sys_menu
where menu_name = '销售选项配置'
   or path = 'sales-option-config'
   or component = 'masterdata/sales-option-config'
   or route_name = 'MasterdataSalesOptionConfig';

select 'old_permission_alias_absent' as check_name, count(*) as actual
from sys_menu
where perms like '%sales-option%';

select 'product_model_wording_is_current' as check_name, count(*) as actual
from sys_menu product_menu
join sys_menu masterdata_menu on masterdata_menu.menu_id = product_menu.parent_id
where masterdata_menu.menu_name = '主数据配置'
  and masterdata_menu.path = 'masterdata'
  and product_menu.path = 'product-config'
  and product_menu.component = 'masterdata/product-config'
  and product_menu.remark = '产品大类、产品系列、产品型号';

select 'old_product_model_wording_absent' as check_name, count(*) as actual
from sys_menu
where remark like '%工艺型号%';
