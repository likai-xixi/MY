-- R-06 executable customer runtime validation SQL.
-- Passing validation means every query below returns zero rows unless the comment says otherwise.

-- Expected: zero rows. Active PUBLIC customer count must be exactly 2.
select 'active_public_count_must_be_2' as check_name, count(*) as actual_count, 2 as expected_count
from customer
where del_flag = '0'
  and customer_nature = 'PUBLIC'
having actual_count <> expected_count;

-- Expected: zero rows. Active PUBLIC customers may only use the two built-in codes.
select 'unexpected_public_customer_code' as check_name, customer_code, customer_name, public_channel
from customer
where del_flag = '0'
  and customer_nature = 'PUBLIC'
  and customer_code not in ('PUB_DIRECT_SALE', 'PUB_SELF_MEDIA');

-- Expected: zero rows. Each active PUBLIC channel is unique.
select 'duplicate_public_channel' as check_name, public_channel, count(*) as active_count
from customer
where del_flag = '0'
  and customer_nature = 'PUBLIC'
group by public_channel
having count(*) > 1;

-- Expected: zero rows. Fund accounts only use the final two-account vocabulary.
select 'invalid_customer_fund_account_type' as check_name, account_id, customer_id, account_type
from customer_fund_account
where account_type not in ('CUSTOMER_DEPOSIT', 'SAMPLE_REBATE');

-- Expected: zero rows. Deposit batches are only customer-level deposit batches.
select 'invalid_customer_deposit_batch_type' as check_name, deposit_batch_id, customer_id, deposit_type
from customer_deposit_batch
where deposit_type <> 'CUSTOMER_DEPOSIT';

-- Expected: zero rows. The current CUSTOMER_DEPOSIT entry path creates only DEPOSIT_IN flows.
select 'invalid_customer_deposit_entry_flow_type' as check_name, flow_id, customer_id, flow_type, related_biz_type, related_biz_no
from customer_fund_flow
where account_type = 'CUSTOMER_DEPOSIT'
  and related_biz_type = 'CUSTOMER_DEPOSIT_BATCH'
  and flow_type <> 'DEPOSIT_IN';

-- Expected: zero rows. Old deposit vocabulary must not exist in live fund data.
select 'legacy_deposit_type_in_fund_account' as check_name, account_id as row_id, customer_id, account_type as legacy_value
from customer_fund_account
where account_type in ('LONG_TERM_DEPOSIT', 'ROLLING_ORDER_DEPOSIT')
union all
select 'legacy_deposit_type_in_deposit_batch' as check_name, deposit_batch_id as row_id, customer_id, deposit_type as legacy_value
from customer_deposit_batch
where deposit_type in ('LONG_TERM_DEPOSIT', 'ROLLING_ORDER_DEPOSIT')
union all
select 'legacy_deposit_type_in_fund_flow_account' as check_name, flow_id as row_id, customer_id, account_type as legacy_value
from customer_fund_flow
where account_type in ('LONG_TERM_DEPOSIT', 'ROLLING_ORDER_DEPOSIT')
union all
select 'legacy_deposit_type_in_fund_flow_related_biz' as check_name, flow_id as row_id, customer_id, related_biz_type as legacy_value
from customer_fund_flow
where related_biz_type in ('LONG_TERM_DEPOSIT', 'ROLLING_ORDER_DEPOSIT');

-- Expected: zero rows. Future rebate enablement requires authoritative order identity.
select 'sample_rebate_missing_order_identity' as check_name, rebate_record_id, customer_id, sample_order_id, sample_order_no
from sample_rebate_record
where sample_order_id is null
   or sample_order_no is null
   or trim(sample_order_no) = '';

-- Expected: zero rows. One authoritative order can fund at most one rebate record.
select 'duplicate_sample_rebate_order_id' as check_name, sample_order_id, count(*) as actual_count
from sample_rebate_record
where sample_order_id is not null
group by sample_order_id
having count(*) > 1;

-- Expected: zero rows. The same customer/order number cannot be replayed under a new idempotency key.
select 'duplicate_sample_rebate_customer_order_no' as check_name, customer_id, sample_order_no, count(*) as actual_count
from sample_rebate_record
where sample_order_no is not null and trim(sample_order_no) <> ''
group by customer_id, sample_order_no
having count(*) > 1;

-- Informational: every existing row predates the authoritative-order adapter and must be
-- reviewed or removed by rebuilding the unreleased development database before future enablement.
select 'legacy_unverified_sample_rebate_count' as check_name, count(*) as actual_count
from sample_rebate_record;
