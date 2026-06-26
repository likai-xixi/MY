package com.ruoyi.business.common.idempotency;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertSame;
import static org.junit.Assert.assertTrue;

import com.ruoyi.business.common.idempotency.domain.IdempotentRequest;
import com.ruoyi.business.common.idempotency.mapper.IdempotentRequestMapper;
import com.ruoyi.business.common.idempotency.service.impl.IdempotencyServiceImpl;
import com.ruoyi.business.customer.service.CustomerTestSupport;
import org.junit.Test;

public class IdempotencyServiceTest
{
    @Test
    public void beginRejectsMissingIdempotentKeyBeforeMapperAccess()
    {
        FakeMapper mapper = new FakeMapper();
        IdempotencyServiceImpl service = service(mapper);

        CustomerTestSupport.assertServiceException("幂等键不能为空",
            () -> service.begin("CUSTOMER_FUND_DEPOSIT", " ", 10L, "hash", "tester"));

        assertEquals(0, mapper.selectCalls);
        assertEquals(0, mapper.insertCalls);
    }

    @Test
    public void beginRejectsSameKeyDifferentHash()
    {
        FakeMapper mapper = new FakeMapper();
        mapper.existing = existing("CUSTOMER_FUND_DEPOSIT", "k-1", "old-hash", IdempotencyServiceImpl.STATUS_SUCCESS);

        CustomerTestSupport.assertServiceException("幂等键已被不同请求使用",
            () -> service(mapper).begin("CUSTOMER_FUND_DEPOSIT", "k-1", 10L, "new-hash", "tester"));

        assertFalse(mapper.existing.isReplay());
    }

    @Test
    public void beginRejectsProcessingDuplicate()
    {
        FakeMapper mapper = new FakeMapper();
        mapper.existing = existing("CUSTOMER_FUND_DEPOSIT", "k-2", "same-hash", IdempotencyServiceImpl.STATUS_PROCESSING);

        CustomerTestSupport.assertServiceException("请求处理中，请勿重复提交",
            () -> service(mapper).begin("CUSTOMER_FUND_DEPOSIT", "k-2", 10L, "same-hash", "tester"));
    }

    @Test
    public void beginReturnsReplayForSuccessfulSameRequest()
    {
        FakeMapper mapper = new FakeMapper();
        mapper.existing = existing("CUSTOMER_FUND_DEPOSIT", "k-3", "same-hash", IdempotencyServiceImpl.STATUS_SUCCESS);
        mapper.existing.setResultRefType("CUSTOMER_FUND_FLOW");
        mapper.existing.setResultRefId(88L);

        IdempotentRequest result = service(mapper).begin("CUSTOMER_FUND_DEPOSIT", "k-3", 10L, "same-hash", "tester");

        assertSame(mapper.existing, result);
        assertTrue(result.isReplay());
        assertEquals("CUSTOMER_FUND_FLOW", result.getResultRefType());
        assertEquals(Long.valueOf(88L), result.getResultRefId());
    }

    @Test
    public void beginCreatesProcessingRecordForFirstRequest()
    {
        FakeMapper mapper = new FakeMapper();

        IdempotentRequest result = service(mapper).begin(" CUSTOMER_SAMPLE_REBATE ", " key-1 ", 11L, " hash-1 ", "tester");

        assertSame(mapper.inserted, result);
        assertEquals("CUSTOMER_SAMPLE_REBATE", result.getBizType());
        assertEquals("key-1", result.getIdempotentKey());
        assertEquals("hash-1", result.getRequestHash());
        assertEquals(IdempotencyServiceImpl.STATUS_PROCESSING, result.getStatus());
        assertEquals(1, mapper.insertCalls);
    }

    private IdempotencyServiceImpl service(FakeMapper mapper)
    {
        IdempotencyServiceImpl service = new IdempotencyServiceImpl();
        CustomerTestSupport.inject(service, "idempotentRequestMapper", mapper);
        return service;
    }

    private static IdempotentRequest existing(String bizType, String key, String hash, String status)
    {
        IdempotentRequest request = new IdempotentRequest();
        request.setRequestId(1L);
        request.setBizType(bizType);
        request.setIdempotentKey(key);
        request.setRequestHash(hash);
        request.setStatus(status);
        return request;
    }

    private static class FakeMapper implements IdempotentRequestMapper
    {
        private IdempotentRequest existing;
        private IdempotentRequest inserted;
        private int selectCalls;
        private int insertCalls;

        @Override
        public IdempotentRequest selectByBizKeyForUpdate(String bizType, String idempotentKey)
        {
            selectCalls++;
            return existing;
        }

        @Override
        public int insertIdempotentRequest(IdempotentRequest request)
        {
            insertCalls++;
            request.setRequestId(99L);
            inserted = request;
            return 1;
        }

        @Override
        public int updateSuccess(Long requestId, String resultRefType, Long resultRefId)
        {
            return 1;
        }

        @Override
        public int updateFailed(Long requestId, String errorMessage)
        {
            return 1;
        }
    }
}
