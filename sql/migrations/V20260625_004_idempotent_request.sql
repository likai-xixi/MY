create table idempotent_request (
  request_id bigint not null auto_increment,
  biz_type varchar(64) not null comment '业务类型',
  idempotent_key varchar(128) not null comment '幂等键',
  biz_id bigint default null comment '业务ID，如 customer_id',
  request_hash varchar(128) not null comment '规范化请求摘要',
  status varchar(32) not null comment 'PROCESSING/SUCCESS/FAILED',
  result_ref_type varchar(64) default null comment '结果引用类型',
  result_ref_id bigint default null comment '结果引用ID',
  error_message varchar(500) default null,
  create_by varchar(64) default '',
  create_time datetime default null,
  update_time datetime default null,
  primary key (request_id),
  unique key uk_idempotent_biz_key (biz_type, idempotent_key),
  key idx_idempotent_biz_id (biz_type, biz_id),
  key idx_idempotent_status_time (status, create_time)
) engine=innodb default charset=utf8mb4 comment='幂等请求记录';
