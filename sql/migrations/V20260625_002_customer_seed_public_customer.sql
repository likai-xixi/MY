-- R-06 executable customer public seed baseline.
-- Scope: only the two built-in PUBLIC customer rows.

insert into customer(
  customer_code,
  customer_name,
  short_name,
  customer_nature,
  public_channel,
  customer_type,
  customer_level,
  owner_type,
  owner_source,
  owner_profit_mode,
  status,
  del_flag,
  create_by,
  create_time,
  remark
)
select
  'PUB_DIRECT_SALE',
  convert(unhex('E58E82E58685E887AAE99480E5AEA2E688B7') using utf8mb4),
  convert(unhex('E58E82E58685E887AAE99480E5AEA2E688B7') using utf8mb4),
  'PUBLIC',
  'DIRECT_SALE',
  'OTHER',
  'NORMAL',
  'NONE',
  'NONE',
  'NONE',
  '0',
  '0',
  'admin',
  sysdate(),
  'system public customer: direct sale order classification'
where not exists (
  select 1 from customer where customer_code = 'PUB_DIRECT_SALE'
);

insert into customer(
  customer_code,
  customer_name,
  short_name,
  customer_nature,
  public_channel,
  customer_type,
  customer_level,
  owner_type,
  owner_source,
  owner_profit_mode,
  status,
  del_flag,
  create_by,
  create_time,
  remark
)
select
  'PUB_SELF_MEDIA',
  convert(unhex('E887AAE5AA92E4BD93E5AEA2E688B7') using utf8mb4),
  convert(unhex('E887AAE5AA92E4BD93E5AEA2E688B7') using utf8mb4),
  'PUBLIC',
  'SELF_MEDIA',
  'OTHER',
  'NORMAL',
  'NONE',
  'NONE',
  'NONE',
  '0',
  '0',
  'admin',
  sysdate(),
  'system public customer: self-media order classification'
where not exists (
  select 1 from customer where customer_code = 'PUB_SELF_MEDIA'
);
