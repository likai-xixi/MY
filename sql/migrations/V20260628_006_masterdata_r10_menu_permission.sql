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
  '主数据配置', business_menu.menu_id, 2, 'masterdata', 'masterdata/index', '', '',
  1, 0, 'C', '0', '0', 'business:masterdata:list', 'list', 'admin', sysdate(), '主数据配置菜单'
from sys_menu business_menu
where business_menu.menu_name = '业务管理'
  and business_menu.parent_id = 0
  and not exists (select 1 from sys_menu where perms = 'business:masterdata:list')
limit 1;

insert into sys_menu(menu_name, parent_id, order_num, path, component, query, route_name, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, remark)
select '主数据查询', masterdata_menu.menu_id, 1, '', '', '', '', 1, 0, 'F', '0', '0', 'business:masterdata:query', '#', 'admin', sysdate(), ''
from sys_menu masterdata_menu
where masterdata_menu.perms = 'business:masterdata:list'
  and not exists (select 1 from sys_menu where perms = 'business:masterdata:query')
limit 1;

insert into sys_menu(menu_name, parent_id, order_num, path, component, query, route_name, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, remark)
select '主数据新增', masterdata_menu.menu_id, 2, '', '', '', '', 1, 0, 'F', '0', '0', 'business:masterdata:add', '#', 'admin', sysdate(), ''
from sys_menu masterdata_menu
where masterdata_menu.perms = 'business:masterdata:list'
  and not exists (select 1 from sys_menu where perms = 'business:masterdata:add')
limit 1;

insert into sys_menu(menu_name, parent_id, order_num, path, component, query, route_name, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, remark)
select '主数据修改', masterdata_menu.menu_id, 3, '', '', '', '', 1, 0, 'F', '0', '0', 'business:masterdata:edit', '#', 'admin', sysdate(), ''
from sys_menu masterdata_menu
where masterdata_menu.perms = 'business:masterdata:list'
  and not exists (select 1 from sys_menu where perms = 'business:masterdata:edit')
limit 1;

insert into sys_menu(menu_name, parent_id, order_num, path, component, query, route_name, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, remark)
select '主数据删除', masterdata_menu.menu_id, 4, '', '', '', '', 1, 0, 'F', '0', '0', 'business:masterdata:remove', '#', 'admin', sysdate(), ''
from sys_menu masterdata_menu
where masterdata_menu.perms = 'business:masterdata:list'
  and not exists (select 1 from sys_menu where perms = 'business:masterdata:remove')
limit 1;

insert into sys_menu(menu_name, parent_id, order_num, path, component, query, route_name, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, remark)
select '主数据导出', masterdata_menu.menu_id, 5, '', '', '', '', 1, 0, 'F', '0', '0', 'business:masterdata:export', '#', 'admin', sysdate(), ''
from sys_menu masterdata_menu
where masterdata_menu.perms = 'business:masterdata:list'
  and not exists (select 1 from sys_menu where perms = 'business:masterdata:export')
limit 1;

insert into sys_menu(menu_name, parent_id, order_num, path, component, query, route_name, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, remark)
select '主数据启停', masterdata_menu.menu_id, 6, '', '', '', '', 1, 0, 'F', '0', '0', 'business:masterdata:status', '#', 'admin', sysdate(), ''
from sys_menu masterdata_menu
where masterdata_menu.perms = 'business:masterdata:list'
  and not exists (select 1 from sys_menu where perms = 'business:masterdata:status')
limit 1;

insert into sys_menu(menu_name, parent_id, order_num, path, component, query, route_name, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, remark)
select '主数据发布', masterdata_menu.menu_id, 7, '', '', '', '', 1, 0, 'F', '0', '0', 'business:masterdata:publish', '#', 'admin', sysdate(), 'R-10B reserved publish boundary; full publish flow deferred'
from sys_menu masterdata_menu
where masterdata_menu.perms = 'business:masterdata:list'
  and not exists (select 1 from sys_menu where perms = 'business:masterdata:publish')
limit 1;
