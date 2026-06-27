-- R-07 platform idempotency runtime validation SQL.
-- Passing validation means every query below returns zero rows unless the comment says otherwise.

-- Expected: zero rows. Idempotent requests only use the platform-supported status vocabulary.
select 'invalid_idempotent_request_status' as check_name, request_id, biz_type, idempotent_key, status
from idempotent_request
where status not in ('PROCESSING', 'SUCCESS', 'FAILED');

-- Expected: zero rows. Persistent idempotency records must have a usable business type and key.
select 'invalid_idempotent_request_identity' as check_name, request_id, biz_type, idempotent_key
from idempotent_request
where coalesce(trim(biz_type), '') = ''
   or coalesce(trim(idempotent_key), '') = '';
