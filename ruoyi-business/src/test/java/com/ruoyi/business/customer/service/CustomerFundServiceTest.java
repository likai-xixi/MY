package com.ruoyi.business.customer.service;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertSame;

import com.ruoyi.business.common.idempotency.domain.IdempotentRequest;
import com.ruoyi.business.common.idempotency.mapper.IdempotentRequestMapper;
import com.ruoyi.business.common.idempotency.service.IdempotencyService;
import com.ruoyi.business.common.idempotency.service.impl.IdempotencyServiceImpl;
import com.ruoyi.business.customer.domain.CustomerDepositBatch;
import com.ruoyi.business.customer.domain.CustomerFundAccount;
import com.ruoyi.business.customer.domain.CustomerFundEntry;
import com.ruoyi.business.customer.domain.CustomerFundFlow;
import com.ruoyi.business.customer.domain.SampleRebateRecord;
import com.ruoyi.business.customer.mapper.CustomerMapper;
import com.ruoyi.business.customer.service.impl.CustomerFundServiceImpl;
import java.lang.reflect.InvocationHandler;
import java.lang.reflect.Method;
import java.math.BigDecimal;
import org.junit.Test;
import org.springframework.dao.DuplicateKeyException;

public class CustomerFundServiceTest
{
    @Test
    public void customerDepositRequiresIdempotentKeyBeforeMutation()
    {
        CustomerMapperFake mapper = new CustomerMapperFake();
        CustomerFundServiceImpl service = service(mapper, realIdempotencyService(new NoopIdempotentMapper()));

        CustomerFundEntry entry = CustomerTestSupport.depositEntry(null, null, null, "10.00");

        CustomerTestSupport.assertServiceException("幂等键不能为空",
            () -> service.recordCustomerDeposit(1L, entry, 7L, "tester"));

        assertEquals(0, mapper.selectCustomerCalls);
        assertEquals(0, mapper.insertFundFlowAttempts);
        assertEquals(0, mapper.insertDepositBatchAttempts);
    }

    @Test
    public void customerDepositRejectsNonCustomerDepositAccountBeforeIdempotency()
    {
        FakeIdempotencyService idempotency = new FakeIdempotencyService();
        CustomerFundServiceImpl service = service(new CustomerMapperFake(), idempotency);
        CustomerFundEntry entry = CustomerTestSupport.depositEntry("deposit-key", "SAMPLE_REBATE", null, "10.00");

        CustomerTestSupport.assertServiceException("定金录入接口只允许写入CUSTOMER_DEPOSIT账户",
            () -> service.recordCustomerDeposit(1L, entry, 7L, "tester"));

        assertEquals(0, idempotency.beginCalls);
    }

    @Test
    public void customerDepositRejectsNonDepositInFlowBeforeIdempotency()
    {
        FakeIdempotencyService idempotency = new FakeIdempotencyService();
        CustomerFundServiceImpl service = service(new CustomerMapperFake(), idempotency);
        CustomerFundEntry entry = CustomerTestSupport.depositEntry("deposit-key", "CUSTOMER_DEPOSIT", "DEPOSIT_REFUND", "10.00");

        CustomerTestSupport.assertServiceException("定金录入接口只允许入金",
            () -> service.recordCustomerDeposit(1L, entry, 7L, "tester"));

        assertEquals(0, idempotency.beginCalls);
    }

    @Test
    public void customerDepositSuccessReplayReturnsOriginalFundFlow()
    {
        CustomerFundFlow replay = new CustomerFundFlow();
        replay.setFlowId(88L);
        replay.setAccountType("CUSTOMER_DEPOSIT");
        replay.setFlowType("DEPOSIT_IN");

        CustomerMapperFake mapper = new CustomerMapperFake();
        mapper.replayFlow = replay;

        FakeIdempotencyService idempotency = new FakeIdempotencyService();
        idempotency.beginResult = replayRequest("CUSTOMER_FUND_FLOW", 88L);

        CustomerFundServiceImpl service = service(mapper, idempotency);
        CustomerFundEntry entry = CustomerTestSupport.depositEntry("deposit-key", "CUSTOMER_DEPOSIT", "DEPOSIT_IN", "10.00");

        CustomerFundFlow result = service.recordCustomerDeposit(1L, entry, 7L, "tester");

        assertSame(replay, result);
        assertEquals(1, mapper.selectFundFlowByIdCalls);
        assertEquals(0, mapper.insertFundFlowAttempts);
        assertEquals(0, mapper.insertDepositBatchAttempts);
        assertEquals(0, idempotency.markSuccessCalls);
    }

    @Test
    public void customerDepositStampsCustomerDepositAndDepositInBeforeMutation()
    {
        CustomerMapperFake mapper = new CustomerMapperFake();
        mapper.account = CustomerTestSupport.fundAccount(1L, "CUSTOMER_DEPOSIT", "2.00");
        FakeIdempotencyService idempotency = new FakeIdempotencyService();
        CustomerFundServiceImpl service = service(mapper, idempotency);
        CustomerFundEntry entry = CustomerTestSupport.depositEntry("deposit-key", null, null, "10.00");

        CustomerFundFlow result = service.recordCustomerDeposit(1L, entry, 7L, "tester");

        assertSame(mapper.insertedFlow, result);
        assertEquals("CUSTOMER_DEPOSIT", entry.getAccountType());
        assertEquals("DEPOSIT_IN", entry.getFlowType());
        assertEquals("CUSTOMER_DEPOSIT", mapper.insertedFlow.getAccountType());
        assertEquals("DEPOSIT_IN", mapper.insertedFlow.getFlowType());
        assertEquals("CUSTOMER_DEPOSIT_BATCH", mapper.insertedFlow.getRelatedBizType());
        assertEquals("CUSTOMER_DEPOSIT", mapper.insertedBatch.getDepositType());
        assertEquals(new BigDecimal("12.00"), mapper.updatedBalanceAmount);
        assertEquals(new BigDecimal("12.00"), mapper.updatedFrozenAmount);
        assertEquals("CUSTOMER_FUND_FLOW", idempotency.markSuccessRefType);
        assertEquals(mapper.insertedFlow.getFlowId(), idempotency.markSuccessRefId);
    }

    @Test
    public void customerDepositRetriesFlowAndBatchNumberCollisions()
    {
        CustomerMapperFake mapper = new CustomerMapperFake();
        mapper.account = CustomerTestSupport.fundAccount(1L, "CUSTOMER_DEPOSIT", "0.00");
        mapper.failFirstDepositBatch = true;
        mapper.failFirstFundFlow = true;
        FakeIdempotencyService idempotency = new FakeIdempotencyService();
        CustomerFundServiceImpl service = service(mapper, idempotency);

        CustomerFundFlow result = service.recordCustomerDeposit(
            1L,
            CustomerTestSupport.depositEntry("deposit-key", "CUSTOMER_DEPOSIT", "DEPOSIT_IN", "10.00"),
            7L,
            "tester"
        );

        assertNotNull(result.getFlowId());
        assertEquals(2, mapper.insertDepositBatchAttempts);
        assertEquals(2, mapper.insertFundFlowAttempts);
        assertEquals("CUSTOMER_FUND_FLOW", idempotency.markSuccessRefType);
    }

    @Test
    public void publicCustomerDepositIsRejectedWithoutFundMutation()
    {
        CustomerMapperFake mapper = new CustomerMapperFake();
        mapper.customer = CustomerTestSupport.publicCustomer(1L);
        FakeIdempotencyService idempotency = new FakeIdempotencyService();
        CustomerFundServiceImpl service = service(mapper, idempotency);

        CustomerTestSupport.assertServiceException("公共客户不启用客户级定金",
            () -> service.recordCustomerDeposit(
                1L,
                CustomerTestSupport.depositEntry("deposit-key", "CUSTOMER_DEPOSIT", "DEPOSIT_IN", "10.00"),
                7L,
                "tester"
            ));

        assertEquals(1, idempotency.beginCalls);
        assertEquals(0, mapper.updateFundAccountBalanceCalls);
        assertEquals(0, mapper.insertFundFlowAttempts);
        assertEquals(0, mapper.insertDepositBatchAttempts);
        assertEquals(0, idempotency.markSuccessCalls);
    }

    @Test
    public void sampleRebateFlowWritesSampleRebateGenerateOnly()
    {
        CustomerMapperFake mapper = new CustomerMapperFake();
        mapper.account = CustomerTestSupport.fundAccount(2L, "SAMPLE_REBATE", "1.00");
        CustomerFundServiceImpl service = service(mapper, new FakeIdempotencyService());

        SampleRebateRecord record = new SampleRebateRecord();
        record.setCustomerId(2L);
        record.setRebateRecordId(900L);
        record.setSampleOrderNo("SO-1");
        record.setRebateAmount(new BigDecimal("5.00"));
        record.setRemark("sample");

        CustomerFundFlow flow = service.recordSampleRebateFlow(record, 7L, "tester");

        assertSame(mapper.insertedFlow, flow);
        assertEquals("SAMPLE_REBATE", flow.getAccountType());
        assertEquals("SAMPLE_REBATE_GENERATE", flow.getFlowType());
        assertEquals("SAMPLE_REBATE", flow.getRelatedBizType());
        assertEquals(Long.valueOf(900L), flow.getRelatedBizId());
        assertEquals("SO-1", flow.getRelatedBizNo());
        assertEquals(0, mapper.insertDepositBatchAttempts);
        assertEquals(new BigDecimal("6.00"), mapper.updatedBalanceAmount);
        assertEquals(new BigDecimal("5.00"), mapper.updatedAvailableAmount);
    }

    private CustomerFundServiceImpl service(CustomerMapperFake mapper, IdempotencyService idempotencyService)
    {
        CustomerFundServiceImpl service = new CustomerFundServiceImpl();
        CustomerTestSupport.inject(service, "customerMapper", mapper.proxy());
        CustomerTestSupport.inject(service, "idempotencyService", idempotencyService);
        return service;
    }

    private IdempotencyServiceImpl realIdempotencyService(IdempotentRequestMapper mapper)
    {
        IdempotencyServiceImpl service = new IdempotencyServiceImpl();
        CustomerTestSupport.inject(service, "idempotentRequestMapper", mapper);
        return service;
    }

    private IdempotentRequest replayRequest(String resultRefType, Long resultRefId)
    {
        IdempotentRequest request = new IdempotentRequest();
        request.setRequestId(200L);
        request.setStatus(IdempotencyServiceImpl.STATUS_SUCCESS);
        request.setResultRefType(resultRefType);
        request.setResultRefId(resultRefId);
        request.setReplay(true);
        return request;
    }

    private static class FakeIdempotencyService implements IdempotencyService
    {
        private IdempotentRequest beginResult = newRequest();
        private int beginCalls;
        private int markSuccessCalls;
        private String markSuccessRefType;
        private Long markSuccessRefId;

        @Override
        public IdempotentRequest begin(String bizType, String idempotentKey, Long bizId, String requestHash, String operator)
        {
            beginCalls++;
            return beginResult;
        }

        @Override
        public void markSuccess(Long requestId, String resultRefType, Long resultRefId)
        {
            markSuccessCalls++;
            markSuccessRefType = resultRefType;
            markSuccessRefId = resultRefId;
        }

        @Override
        public void markFailed(Long requestId, String errorMessage)
        {
        }

        private static IdempotentRequest newRequest()
        {
            IdempotentRequest request = new IdempotentRequest();
            request.setRequestId(200L);
            request.setStatus(IdempotencyServiceImpl.STATUS_PROCESSING);
            return request;
        }
    }

    private static class CustomerMapperFake implements InvocationHandler
    {
        private com.ruoyi.business.customer.domain.Customer customer = CustomerTestSupport.realCustomer(1L);
        private CustomerFundAccount account = CustomerTestSupport.fundAccount(1L, "CUSTOMER_DEPOSIT", "0.00");
        private CustomerFundFlow replayFlow;
        private CustomerDepositBatch insertedBatch;
        private CustomerFundFlow insertedFlow;
        private BigDecimal updatedBalanceAmount;
        private BigDecimal updatedAvailableAmount;
        private BigDecimal updatedFrozenAmount;
        private boolean failFirstDepositBatch;
        private boolean failFirstFundFlow;
        private int selectCustomerCalls;
        private int updateFundAccountBalanceCalls;
        private int insertDepositBatchAttempts;
        private int insertFundFlowAttempts;
        private int selectFundFlowByIdCalls;

        private CustomerMapper proxy()
        {
            return CustomerTestSupport.proxy(CustomerMapper.class, this);
        }

        @Override
        public Object invoke(Object proxy, Method method, Object[] args)
        {
            String name = method.getName();
            if ("selectCustomerById".equals(name))
            {
                selectCustomerCalls++;
                return customer;
            }
            if ("selectFundAccountForUpdate".equals(name))
            {
                return account;
            }
            if ("updateFundAccountBalance".equals(name))
            {
                updateFundAccountBalanceCalls++;
                updatedBalanceAmount = (BigDecimal) args[1];
                updatedAvailableAmount = (BigDecimal) args[2];
                updatedFrozenAmount = (BigDecimal) args[3];
                return 1;
            }
            if ("insertDepositBatch".equals(name))
            {
                insertDepositBatchAttempts++;
                if (failFirstDepositBatch && insertDepositBatchAttempts == 1)
                {
                    throw new DuplicateKeyException("duplicate batch no");
                }
                insertedBatch = (CustomerDepositBatch) args[0];
                insertedBatch.setDepositBatchId(300L);
                return 1;
            }
            if ("insertFundFlow".equals(name))
            {
                insertFundFlowAttempts++;
                if (failFirstFundFlow && insertFundFlowAttempts == 1)
                {
                    throw new DuplicateKeyException("duplicate flow no");
                }
                insertedFlow = (CustomerFundFlow) args[0];
                insertedFlow.setFlowId(400L);
                return 1;
            }
            if ("selectFundFlowById".equals(name))
            {
                selectFundFlowByIdCalls++;
                return replayFlow;
            }
            return CustomerTestSupport.defaultValue(method);
        }
    }

    private static class NoopIdempotentMapper implements IdempotentRequestMapper
    {
        @Override
        public IdempotentRequest selectByBizKeyForUpdate(String bizType, String idempotentKey)
        {
            return null;
        }

        @Override
        public int insertIdempotentRequest(IdempotentRequest request)
        {
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
