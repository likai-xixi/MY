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
