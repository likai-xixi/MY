-- R-10B executable masterdata menu and permission migration.
-- Scope: RuoYi sys_menu rows for business/masterdata only. Every insert is guarded by not exists.

insert into sys_menu(
  menu_name, parent_id, order_num, path, component, query, route_name,
  is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, remark
)
select
  '业务管理', 0, 4, 'business', null, '', '',
  1, 0, 'M', '0', '0', '', 'tree', 'admin', sysdate(), '业务管理目录'
where not exists (
  select 1 from sys_menu where menu_name = '业务管理' and parent_id = 0
);

insert into sys_menu(
  menu_name, parent_id, order_num, path, component, query, route_name,
  is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, remark
)
select
  '主数据配置', business_menu.menu_id, 2, 'masterdata', null, '', 'Masterdata',
  1, 0, 'M', '0', '0', '', 'tree', 'admin', sysdate(), '主数据配置目录'
from sys_menu business_menu
where business_menu.menu_name = '业务管理'
  and business_menu.parent_id = 0
  and not exists (select 1 from sys_menu where menu_name = '主数据配置' and parent_id = business_menu.menu_id)
limit 1;

update sys_menu masterdata_menu
join sys_menu business_menu on business_menu.menu_id = masterdata_menu.parent_id
set masterdata_menu.menu_type = 'M',
    masterdata_menu.component = null,
    masterdata_menu.`query` = '',
    masterdata_menu.route_name = 'Masterdata',
    masterdata_menu.perms = '',
    masterdata_menu.icon = 'tree',
    masterdata_menu.remark = '主数据配置目录'
where business_menu.menu_name = '业务管理'
  and business_menu.parent_id = 0
  and masterdata_menu.menu_name = '主数据配置'
  and masterdata_menu.path = 'masterdata';

insert into sys_menu(
  menu_name, parent_id, order_num, path, component, query, route_name,
  is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, remark
)
select
  '产品配置', masterdata_menu.menu_id, 1, 'product-config', 'masterdata/product-config', '', 'MasterdataProductConfig',
  1, 0, 'C', '0', '0', 'business:masterdata:list', 'tree-table', 'admin', sysdate(), '产品大类、产品系列、工艺型号'
from sys_menu masterdata_menu
join sys_menu business_menu on business_menu.menu_id = masterdata_menu.parent_id
where business_menu.menu_name = '业务管理'
  and business_menu.parent_id = 0
  and masterdata_menu.menu_name = '主数据配置'
  and masterdata_menu.path = 'masterdata'
  and not exists (select 1 from sys_menu where parent_id = masterdata_menu.menu_id and path = 'product-config')
limit 1;

insert into sys_menu(
  menu_name, parent_id, order_num, path, component, query, route_name,
  is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, remark
)
select
  '物料配置', masterdata_menu.menu_id, 2, 'material-config', 'masterdata/material-config', '', 'MasterdataMaterialConfig',
  1, 0, 'C', '0', '0', 'business:masterdata:list', 'component', 'admin', sysdate(), '物料分类、原材料档案'
from sys_menu masterdata_menu
join sys_menu business_menu on business_menu.menu_id = masterdata_menu.parent_id
where business_menu.menu_name = '业务管理'
  and business_menu.parent_id = 0
  and masterdata_menu.menu_name = '主数据配置'
  and masterdata_menu.path = 'masterdata'
  and not exists (select 1 from sys_menu where parent_id = masterdata_menu.menu_id and path = 'material-config')
limit 1;

insert into sys_menu(
  menu_name, parent_id, order_num, path, component, query, route_name,
  is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, remark
)
select
  '配件配置', masterdata_menu.menu_id, 3, 'accessory-config', 'masterdata/accessory-config', '', 'MasterdataAccessoryConfig',
  1, 0, 'C', '0', '0', 'business:masterdata:list', 'dict', 'admin', sysdate(), '配件分类、配件档案'
from sys_menu masterdata_menu
join sys_menu business_menu on business_menu.menu_id = masterdata_menu.parent_id
where business_menu.menu_name = '业务管理'
  and business_menu.parent_id = 0
  and masterdata_menu.menu_name = '主数据配置'
  and masterdata_menu.path = 'masterdata'
  and not exists (select 1 from sys_menu where parent_id = masterdata_menu.menu_id and path = 'accessory-config')
limit 1;

insert into sys_menu(
  menu_name, parent_id, order_num, path, component, query, route_name,
  is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, remark
)
select
  '销售选项配置', masterdata_menu.menu_id, 4, 'sales-option-config', 'masterdata/sales-option-config', '', 'MasterdataSalesOptionConfig',
  1, 0, 'C', '0', '0', 'business:masterdata:list', 'checkbox', 'admin', sysdate(), '销售选项分类、销售选项值'
from sys_menu masterdata_menu
join sys_menu business_menu on business_menu.menu_id = masterdata_menu.parent_id
where business_menu.menu_name = '业务管理'
  and business_menu.parent_id = 0
  and masterdata_menu.menu_name = '主数据配置'
  and masterdata_menu.path = 'masterdata'
  and not exists (select 1 from sys_menu where parent_id = masterdata_menu.menu_id and path = 'sales-option-config')
limit 1;

insert into sys_menu(menu_name, parent_id, order_num, path, component, query, route_name, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, remark)
select '主数据查询', masterdata_menu.menu_id, 1, '', '', '', '', 1, 0, 'F', '0', '0', 'business:masterdata:query', '#', 'admin', sysdate(), ''
from sys_menu masterdata_menu
where masterdata_menu.menu_name = '主数据配置'
  and masterdata_menu.menu_type = 'M'
  and not exists (select 1 from sys_menu where perms = 'business:masterdata:query')
limit 1;

insert into sys_menu(menu_name, parent_id, order_num, path, component, query, route_name, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, remark)
select '主数据新增', masterdata_menu.menu_id, 2, '', '', '', '', 1, 0, 'F', '0', '0', 'business:masterdata:add', '#', 'admin', sysdate(), ''
from sys_menu masterdata_menu
where masterdata_menu.menu_name = '主数据配置'
  and masterdata_menu.menu_type = 'M'
  and not exists (select 1 from sys_menu where perms = 'business:masterdata:add')
limit 1;

insert into sys_menu(menu_name, parent_id, order_num, path, component, query, route_name, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, remark)
select '主数据修改', masterdata_menu.menu_id, 3, '', '', '', '', 1, 0, 'F', '0', '0', 'business:masterdata:edit', '#', 'admin', sysdate(), ''
from sys_menu masterdata_menu
where masterdata_menu.menu_name = '主数据配置'
  and masterdata_menu.menu_type = 'M'
  and not exists (select 1 from sys_menu where perms = 'business:masterdata:edit')
limit 1;

insert into sys_menu(menu_name, parent_id, order_num, path, component, query, route_name, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, remark)
select '主数据删除', masterdata_menu.menu_id, 4, '', '', '', '', 1, 0, 'F', '0', '0', 'business:masterdata:remove', '#', 'admin', sysdate(), ''
from sys_menu masterdata_menu
where masterdata_menu.menu_name = '主数据配置'
  and masterdata_menu.menu_type = 'M'
  and not exists (select 1 from sys_menu where perms = 'business:masterdata:remove')
limit 1;

insert into sys_menu(menu_name, parent_id, order_num, path, component, query, route_name, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, remark)
select '主数据导出', masterdata_menu.menu_id, 5, '', '', '', '', 1, 0, 'F', '0', '0', 'business:masterdata:export', '#', 'admin', sysdate(), ''
from sys_menu masterdata_menu
where masterdata_menu.menu_name = '主数据配置'
  and masterdata_menu.menu_type = 'M'
  and not exists (select 1 from sys_menu where perms = 'business:masterdata:export')
limit 1;

insert into sys_menu(menu_name, parent_id, order_num, path, component, query, route_name, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, remark)
select '主数据启停', masterdata_menu.menu_id, 6, '', '', '', '', 1, 0, 'F', '0', '0', 'business:masterdata:status', '#', 'admin', sysdate(), ''
from sys_menu masterdata_menu
where masterdata_menu.menu_name = '主数据配置'
  and masterdata_menu.menu_type = 'M'
  and not exists (select 1 from sys_menu where perms = 'business:masterdata:status')
limit 1;

insert into sys_menu(menu_name, parent_id, order_num, path, component, query, route_name, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, remark)
select '主数据发布', masterdata_menu.menu_id, 7, '', '', '', '', 1, 0, 'F', '0', '0', 'business:masterdata:publish', '#', 'admin', sysdate(), 'R-10B reserved publish boundary; full publish flow deferred'
from sys_menu masterdata_menu
where masterdata_menu.menu_name = '主数据配置'
  and masterdata_menu.menu_type = 'M'
  and not exists (select 1 from sys_menu where perms = 'business:masterdata:publish')
limit 1;
