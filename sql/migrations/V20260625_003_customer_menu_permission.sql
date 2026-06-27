-- R-06 executable customer menu and permission baseline.
-- Scope: RuoYi sys_menu rows for business/customer only. Every insert is guarded by not exists.

insert into sys_menu(
  menu_name,
  parent_id,
  order_num,
  path,
  component,
  query,
  route_name,
  is_frame,
  is_cache,
  menu_type,
  visible,
  status,
  perms,
  icon,
  create_by,
  create_time,
  remark
)
select
  convert(unhex('E4B89AE58AA1E7AEA1E79086') using utf8mb4),
  0,
  4,
  'business',
  null,
  '',
  '',
  1,
  0,
  'M',
  '0',
  '0',
  '',
  'tree',
  'admin',
  sysdate(),
  convert(unhex('E4B89AE58AA1E7AEA1E79086E79BAEE5BD95') using utf8mb4)
where not exists (
  select 1
  from sys_menu
  where menu_name = convert(unhex('E4B89AE58AA1E7AEA1E79086') using utf8mb4)
    and parent_id = 0
);

insert into sys_menu(
  menu_name,
  parent_id,
  order_num,
  path,
  component,
  query,
  route_name,
  is_frame,
  is_cache,
  menu_type,
  visible,
  status,
  perms,
  icon,
  create_by,
  create_time,
  remark
)
select
  convert(unhex('E5AEA2E688B7E7AEA1E79086') using utf8mb4),
  business_menu.menu_id,
  1,
  'customer',
  'customer/index',
  '',
  '',
  1,
  0,
  'C',
  '0',
  '0',
  'business:customer:list',
  'peoples',
  'admin',
  sysdate(),
  convert(unhex('E5AEA2E688B7E7AEA1E79086E88F9CE58D95') using utf8mb4)
from sys_menu business_menu
where business_menu.menu_name = convert(unhex('E4B89AE58AA1E7AEA1E79086') using utf8mb4)
  and business_menu.parent_id = 0
  and not exists (
    select 1 from sys_menu where perms = 'business:customer:list'
  )
limit 1;

insert into sys_menu(menu_name, parent_id, order_num, path, component, query, route_name, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, remark)
select convert(unhex('E5AEA2E688B7E69FA5E8AFA2') using utf8mb4), customer_menu.menu_id, 1, '', '', '', '', 1, 0, 'F', '0', '0', 'business:customer:query', '#', 'admin', sysdate(), ''
from sys_menu customer_menu
where customer_menu.perms = 'business:customer:list'
  and not exists (select 1 from sys_menu where perms = 'business:customer:query')
limit 1;

insert into sys_menu(menu_name, parent_id, order_num, path, component, query, route_name, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, remark)
select convert(unhex('E5AEA2E688B7E696B0E5A29E') using utf8mb4), customer_menu.menu_id, 2, '', '', '', '', 1, 0, 'F', '0', '0', 'business:customer:add', '#', 'admin', sysdate(), ''
from sys_menu customer_menu
where customer_menu.perms = 'business:customer:list'
  and not exists (select 1 from sys_menu where perms = 'business:customer:add')
limit 1;

insert into sys_menu(menu_name, parent_id, order_num, path, component, query, route_name, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, remark)
select convert(unhex('E5AEA2E688B7E4BFAEE694B9') using utf8mb4), customer_menu.menu_id, 3, '', '', '', '', 1, 0, 'F', '0', '0', 'business:customer:edit', '#', 'admin', sysdate(), ''
from sys_menu customer_menu
where customer_menu.perms = 'business:customer:list'
  and not exists (select 1 from sys_menu where perms = 'business:customer:edit')
limit 1;

insert into sys_menu(menu_name, parent_id, order_num, path, component, query, route_name, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, remark)
select convert(unhex('E5AEA2E688B7E588A0E999A4') using utf8mb4), customer_menu.menu_id, 4, '', '', '', '', 1, 0, 'F', '0', '0', 'business:customer:remove', '#', 'admin', sysdate(), ''
from sys_menu customer_menu
where customer_menu.perms = 'business:customer:list'
  and not exists (select 1 from sys_menu where perms = 'business:customer:remove')
limit 1;

insert into sys_menu(menu_name, parent_id, order_num, path, component, query, route_name, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, remark)
select convert(unhex('E5AEA2E688B7E5AFBCE587BA') using utf8mb4), customer_menu.menu_id, 5, '', '', '', '', 1, 0, 'F', '0', '0', 'business:customer:export', '#', 'admin', sysdate(), ''
from sys_menu customer_menu
where customer_menu.perms = 'business:customer:list'
  and not exists (select 1 from sys_menu where perms = 'business:customer:export')
limit 1;

insert into sys_menu(menu_name, parent_id, order_num, path, component, query, route_name, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, remark)
select convert(unhex('E5AEA2E688B7E5BD92E5B19EE69FA5E79C8B') using utf8mb4), customer_menu.menu_id, 6, '', '', '', '', 1, 0, 'F', '0', '0', 'business:customer:owner:view', '#', 'admin', sysdate(), ''
from sys_menu customer_menu
where customer_menu.perms = 'business:customer:list'
  and not exists (select 1 from sys_menu where perms = 'business:customer:owner:view')
limit 1;

insert into sys_menu(menu_name, parent_id, order_num, path, component, query, route_name, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, remark)
select convert(unhex('E5AEA2E688B7E5BD92E5B19EE58886E9858D') using utf8mb4), customer_menu.menu_id, 7, '', '', '', '', 1, 0, 'F', '0', '0', 'business:customer:owner:assign', '#', 'admin', sysdate(), ''
from sys_menu customer_menu
where customer_menu.perms = 'business:customer:list'
  and not exists (select 1 from sys_menu where perms = 'business:customer:owner:assign')
limit 1;

insert into sys_menu(menu_name, parent_id, order_num, path, component, query, route_name, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, remark)
select convert(unhex('E5AEA2E688B7E5BD92E5B19EE8BDACE7A7BB') using utf8mb4), customer_menu.menu_id, 8, '', '', '', '', 1, 0, 'F', '0', '0', 'business:customer:owner:transfer', '#', 'admin', sysdate(), ''
from sys_menu customer_menu
where customer_menu.perms = 'business:customer:list'
  and not exists (select 1 from sys_menu where perms = 'business:customer:owner:transfer')
limit 1;

insert into sys_menu(menu_name, parent_id, order_num, path, component, query, route_name, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, remark)
select convert(unhex('E5AEA2E688B7E5BD92E5B19EE58E86E58FB2') using utf8mb4), customer_menu.menu_id, 9, '', '', '', '', 1, 0, 'F', '0', '0', 'business:customer:owner:history', '#', 'admin', sysdate(), ''
from sys_menu customer_menu
where customer_menu.perms = 'business:customer:list'
  and not exists (select 1 from sys_menu where perms = 'business:customer:owner:history')
limit 1;

insert into sys_menu(menu_name, parent_id, order_num, path, component, query, route_name, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, remark)
select convert(unhex('E5AEA2E688B7E8B584E98791E69FA5E79C8B') using utf8mb4), customer_menu.menu_id, 10, '', '', '', '', 1, 0, 'F', '0', '0', 'business:customer:fund:view', '#', 'admin', sysdate(), ''
from sys_menu customer_menu
where customer_menu.perms = 'business:customer:list'
  and not exists (select 1 from sys_menu where perms = 'business:customer:fund:view')
limit 1;

insert into sys_menu(menu_name, parent_id, order_num, path, component, query, route_name, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, remark)
select convert(unhex('E5AEA2E688B7E5AE9AE98791E5BD95E585A5') using utf8mb4), customer_menu.menu_id, 11, '', '', '', '', 1, 0, 'F', '0', '0', 'business:customer:fund:deposit', '#', 'admin', sysdate(), ''
from sys_menu customer_menu
where customer_menu.perms = 'business:customer:list'
  and not exists (select 1 from sys_menu where perms = 'business:customer:fund:deposit')
limit 1;

insert into sys_menu(menu_name, parent_id, order_num, path, component, query, route_name, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, remark)
select convert(unhex('E6A0B7E59381E8BF94E78EB0E7949FE68890') using utf8mb4), customer_menu.menu_id, 12, '', '', '', '', 1, 0, 'F', '0', '0', 'business:customer:sample-rebate:create', '#', 'admin', sysdate(), ''
from sys_menu customer_menu
where customer_menu.perms = 'business:customer:list'
  and not exists (select 1 from sys_menu where perms = 'business:customer:sample-rebate:create')
limit 1;

insert into sys_menu(menu_name, parent_id, order_num, path, component, query, route_name, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, remark)
select convert(unhex('E5AEA2E688B7E8B584E98791E6B581E6B0B4') using utf8mb4), customer_menu.menu_id, 13, '', '', '', '', 1, 0, 'F', '0', '0', 'business:customer:fund:flow', '#', 'admin', sysdate(), ''
from sys_menu customer_menu
where customer_menu.perms = 'business:customer:list'
  and not exists (select 1 from sys_menu where perms = 'business:customer:fund:flow')
limit 1;

insert into sys_menu(menu_name, parent_id, order_num, path, component, query, route_name, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, remark)
select convert(unhex('E5AEA2E688B7E8B584E98791E8B083E695B4') using utf8mb4), customer_menu.menu_id, 14, '', '', '', '', 1, 0, 'F', '0', '0', 'business:customer:fund:adjust', '#', 'admin', sysdate(), ''
from sys_menu customer_menu
where customer_menu.perms = 'business:customer:list'
  and not exists (select 1 from sys_menu where perms = 'business:customer:fund:adjust')
limit 1;

insert into sys_menu(menu_name, parent_id, order_num, path, component, query, route_name, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, remark)
select convert(unhex('E5AEA2E688B7E8B584E98791E5AFBCE587BA') using utf8mb4), customer_menu.menu_id, 15, '', '', '', '', 1, 0, 'F', '0', '0', 'business:customer:fund:export', '#', 'admin', sysdate(), ''
from sys_menu customer_menu
where customer_menu.perms = 'business:customer:list'
  and not exists (select 1 from sys_menu where perms = 'business:customer:fund:export')
limit 1;

insert into sys_menu(menu_name, parent_id, order_num, path, component, query, route_name, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, remark)
select convert(unhex('E5AEA2E688B7E6A0B7E59381E694BFE7AD96E69FA5E79C8B') using utf8mb4), customer_menu.menu_id, 16, '', '', '', '', 1, 0, 'F', '0', '0', 'business:customer:sample-policy:view', '#', 'admin', sysdate(), ''
from sys_menu customer_menu
where customer_menu.perms = 'business:customer:list'
  and not exists (select 1 from sys_menu where perms = 'business:customer:sample-policy:view')
limit 1;

insert into sys_menu(menu_name, parent_id, order_num, path, component, query, route_name, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, remark)
select convert(unhex('E5AEA2E688B7E6A0B7E59381E694BFE7AD96E7BC96E8BE91') using utf8mb4), customer_menu.menu_id, 17, '', '', '', '', 1, 0, 'F', '0', '0', 'business:customer:sample-policy:edit', '#', 'admin', sysdate(), ''
from sys_menu customer_menu
where customer_menu.perms = 'business:customer:list'
  and not exists (select 1 from sys_menu where perms = 'business:customer:sample-policy:edit')
limit 1;
