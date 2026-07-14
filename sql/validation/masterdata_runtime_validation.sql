-- R-10B masterdata runtime validation SQL.
-- Expected: each table_exists row returns 1; duplicate queries return 0 rows.

select 'table_exists:masterdata_product_category' as check_name, count(*) as actual
from information_schema.tables
where table_schema = database() and table_name = 'masterdata_product_category';

select 'table_exists:masterdata_product_series' as check_name, count(*) as actual
from information_schema.tables
where table_schema = database() and table_name = 'masterdata_product_series';

select 'table_exists:masterdata_product_model' as check_name, count(*) as actual
from information_schema.tables
where table_schema = database() and table_name = 'masterdata_product_model';

select 'table_exists:masterdata_material_category' as check_name, count(*) as actual
from information_schema.tables
where table_schema = database() and table_name = 'masterdata_material_category';

select 'table_exists:masterdata_material_item' as check_name, count(*) as actual
from information_schema.tables
where table_schema = database() and table_name = 'masterdata_material_item';

select 'table_exists:masterdata_accessory_category' as check_name, count(*) as actual
from information_schema.tables
where table_schema = database() and table_name = 'masterdata_accessory_category';

select 'table_exists:masterdata_accessory_item' as check_name, count(*) as actual
from information_schema.tables
where table_schema = database() and table_name = 'masterdata_accessory_item';

select 'table_exists:masterdata_sales_option_category' as check_name, count(*) as actual
from information_schema.tables
where table_schema = database() and table_name = 'masterdata_sales_option_category';

select 'table_exists:masterdata_sales_option_value' as check_name, count(*) as actual
from information_schema.tables
where table_schema = database() and table_name = 'masterdata_sales_option_value';

select 'permission_exists:business:masterdata:list' as check_name, count(*) as actual
from sys_menu where perms = 'business:masterdata:list';

select 'permission_exists:business:masterdata:publish' as check_name, count(*) as actual
from sys_menu where perms = 'business:masterdata:publish';

-- Expected: exactly one permanent, logically deleted product-category hierarchy mutex row.
select 'product_category_hierarchy_mutex' as check_name, count(*) as actual
from masterdata_product_category
where category_id = -1
  and category_code = '__MD_PRODUCT_CATEGORY_HIERARCHY_MUTEX__'
  and del_flag = '2';

-- Expected: zero rows. Every active category must be reachable from one root and stay within three levels.
-- Traversal stops after depth four, so corrupt deep data cannot exhaust the recursive CTE limit.
with recursive active_product_category_tree as (
  select category_id, parent_id, 1 as hierarchy_depth
  from masterdata_product_category
  where del_flag = '0' and parent_id is null
  union all
  select child.category_id, child.parent_id, tree.hierarchy_depth + 1
  from masterdata_product_category child
  join active_product_category_tree tree on child.parent_id = tree.category_id
  where child.del_flag = '0' and tree.hierarchy_depth < 4
)
select 'invalid_product_category_hierarchy' as check_name,
       category.category_id as row_id,
       category.parent_id,
       coalesce(tree.hierarchy_depth, 0) as hierarchy_depth,
       case
         when tree.category_id is null then 'unreachable_or_cycle'
         when tree.hierarchy_depth > 3 then 'depth_exceeds_3'
       end as violation
from masterdata_product_category category
left join active_product_category_tree tree on tree.category_id = category.category_id
where category.del_flag = '0'
  and (tree.category_id is null or tree.hierarchy_depth > 3);

select 'duplicate_product_category_code' as check_name, category_code as code, count(*) as actual
from masterdata_product_category
where del_flag = '0'
group by category_code
having count(*) > 1;

select 'duplicate_product_series_code' as check_name, series_code as code, count(*) as actual
from masterdata_product_series
where del_flag = '0'
group by series_code
having count(*) > 1;

select 'duplicate_product_model_code' as check_name, model_code as code, count(*) as actual
from masterdata_product_model
where del_flag = '0'
group by model_code
having count(*) > 1;

select 'duplicate_material_category_code' as check_name, category_code as code, count(*) as actual
from masterdata_material_category
where del_flag = '0'
group by category_code
having count(*) > 1;

select 'duplicate_material_item_code' as check_name, material_code as code, count(*) as actual
from masterdata_material_item
where del_flag = '0'
group by material_code
having count(*) > 1;

select 'duplicate_accessory_category_code' as check_name, category_code as code, count(*) as actual
from masterdata_accessory_category
where del_flag = '0'
group by category_code
having count(*) > 1;

select 'duplicate_accessory_item_code' as check_name, accessory_code as code, count(*) as actual
from masterdata_accessory_item
where del_flag = '0'
group by accessory_code
having count(*) > 1;

select 'duplicate_sales_option_category_code' as check_name, category_code as code, count(*) as actual
from masterdata_sales_option_category
where del_flag = '0'
group by category_code
having count(*) > 1;

select 'duplicate_sales_option_value_code' as check_name, option_code as code, count(*) as actual
from masterdata_sales_option_value
where del_flag = '0'
group by option_code
having count(*) > 1;

-- Expected: zero rows. Active records may reference only active masterdata parents.
select 'orphan_product_category_parent' as check_name, child.category_id as row_id, child.parent_id as missing_parent_id
from masterdata_product_category child
left join masterdata_product_category parent
  on parent.category_id = child.parent_id and parent.del_flag = '0'
where child.del_flag = '0' and child.parent_id is not null and parent.category_id is null;

select 'orphan_product_series_category' as check_name, child.series_id as row_id, child.category_id as missing_category_id
from masterdata_product_series child
left join masterdata_product_category parent
  on parent.category_id = child.category_id and parent.del_flag = '0'
where child.del_flag = '0' and parent.category_id is null;

select 'orphan_product_model_category' as check_name, child.model_id as row_id, child.category_id as missing_category_id
from masterdata_product_model child
left join masterdata_product_category parent
  on parent.category_id = child.category_id and parent.del_flag = '0'
where child.del_flag = '0' and parent.category_id is null;

select 'orphan_product_model_series' as check_name, child.model_id as row_id, child.series_id as missing_series_id
from masterdata_product_model child
left join masterdata_product_series parent
  on parent.series_id = child.series_id and parent.del_flag = '0'
where child.del_flag = '0' and parent.series_id is null;

select 'product_model_series_category_mismatch' as check_name,
       child.model_id as row_id,
       child.category_id as model_category_id,
       parent.category_id as series_category_id
from masterdata_product_model child
join masterdata_product_series parent
  on parent.series_id = child.series_id and parent.del_flag = '0'
where child.del_flag = '0' and child.category_id <> parent.category_id;

select 'orphan_material_item_category' as check_name, child.material_id as row_id, child.category_id as missing_category_id
from masterdata_material_item child
left join masterdata_material_category parent
  on parent.category_id = child.category_id and parent.del_flag = '0'
where child.del_flag = '0' and parent.category_id is null;

select 'orphan_accessory_item_category' as check_name, child.accessory_id as row_id, child.category_id as missing_category_id
from masterdata_accessory_item child
left join masterdata_accessory_category parent
  on parent.category_id = child.category_id and parent.del_flag = '0'
where child.del_flag = '0' and parent.category_id is null;

select 'orphan_sales_option_value_category' as check_name, child.option_id as row_id, child.category_id as missing_category_id
from masterdata_sales_option_value child
left join masterdata_sales_option_category parent
  on parent.category_id = child.category_id and parent.del_flag = '0'
where child.del_flag = '0' and parent.category_id is null;
