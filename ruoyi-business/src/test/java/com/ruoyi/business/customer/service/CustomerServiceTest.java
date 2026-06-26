package com.ruoyi.business.customer.service;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertSame;

import com.ruoyi.business.common.idempotency.domain.IdempotentRequest;
import com.ruoyi.business.common.idempotency.mapper.IdempotentRequestMapper;
import com.ruoyi.business.common.idempotency.service.IdempotencyService;
import com.ruoyi.business.common.idempotency.service.impl.IdempotencyServiceImpl;
import com.ruoyi.business.customer.domain.CustomerFundAccount;
import com.ruoyi.business.customer.domain.CustomerFundEntry;
import com.ruoyi.business.customer.domain.CustomerFundFlow;
import com.ruoyi.business.customer.domain.SampleRebateRecord;
import com.ruoyi.business.customer.mapper.CustomerMapper;
import com.ruoyi.business.customer.service.impl.CustomerServiceImpl;
import com.ruoyi.common.core.domain.entity.SysRole;
import com.ruoyi.common.core.domain.entity.SysUser;
import com.ruoyi.system.mapper.SysDeptMapper;
import com.ruoyi.system.mapper.SysUserMapper;
import com.ruoyi.system.service.ISysRoleService;
import java.lang.reflect.InvocationHandler;
import java.lang.reflect.Method;
import java.math.BigDecimal;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.junit.Test;

public class CustomerServiceTest
{
    @Test
    public void sampleRebateRequiresIdempotentKeyBeforeMutation()
    {
        CustomerMapperFake mapper = new CustomerMapperFake();
        CustomerServiceImpl service = service(
            mapper,
            realIdempotencyService(new NoopIdempotentMapper()),
            new FakeFundService(),
            userMapper(Collections.emptyList()),
            roleService(Collections.emptyMap())
        );

        CustomerTestSupport.assertServiceException("幂等键不能为空",
            () -> service.createSampleRebateRecord(sampleRecord(null), 7L, "tester"));

        assertEquals(1, mapper.selectCustomerCalls);
        assertEquals(0, mapper.insertSampleRebateCalls);
    }

    @Test
    public void sampleRebateSuccessReplayReturnsOriginalRecord()
    {
        SampleRebateRecord replay = new SampleRebateRecord();
        replay.setRebateRecordId(900L);
        replay.setCustomerId(1L);
        replay.setRebateAmount(new BigDecimal("20.00"));

        CustomerMapperFake mapper = new CustomerMapperFake();
        mapper.replayRecord = replay;
        FakeIdempotencyService idempotency = new FakeIdempotencyService();
        idempotency.beginResult = replayRequest("SAMPLE_REBATE_RECORD", 900L);
        FakeFundService fundService = new FakeFundService();
        CustomerServiceImpl service = service(
            mapper,
            idempotency,
            fundService,
            userMapper(Collections.emptyList()),
            roleService(Collections.emptyMap())
        );

        SampleRebateRecord result = service.createSampleRebateRecord(sampleRecord("rebate-key"), 7L, "tester");

        assertSame(replay, result);
        assertEquals(1, mapper.selectSampleRebateRecordByIdCalls);
        assertEquals(0, mapper.insertSampleRebateCalls);
        assertEquals(0, fundService.recordSampleRebateFlowCalls);
        assertEquals(0, idempotency.markSuccessCalls);
    }

    @Test
    public void sampleRebateCreatesRecordThenSampleRebateFundFlow()
    {
        CustomerMapperFake mapper = new CustomerMapperFake();
        FakeIdempotencyService idempotency = new FakeIdempotencyService();
        FakeFundService fundService = new FakeFundService();
        CustomerServiceImpl service = service(
            mapper,
            idempotency,
            fundService,
            userMapper(Collections.emptyList()),
            roleService(Collections.emptyMap())
        );

        SampleRebateRecord result = service.createSampleRebateRecord(sampleRecord("rebate-key"), 7L, "tester");

        assertSame(mapper.insertedRecord, result);
        assertSame(mapper.insertedRecord, fundService.lastRecord);
        assertEquals(Long.valueOf(700L), result.getRebateRecordId());
        assertEquals(new BigDecimal("10.00"), result.getInstantDiscountAmount());
        assertEquals(new BigDecimal("20.00"), result.getRebateAmount());
        assertEquals(new BigDecimal("0.00"), result.getUsedAmount());
        assertEquals(new BigDecimal("20.00"), result.getRemainingAmount());
        assertEquals("AVAILABLE", result.getStatus());
        assertEquals("tester", result.getCreateBy());
        assertEquals("SAMPLE_REBATE_RECORD", idempotency.markSuccessRefType);
        assertEquals(Long.valueOf(700L), idempotency.markSuccessRefId);
    }

    @Test
    public void publicCustomerSampleRebateIsRejectedBeforeIdempotency()
    {
        CustomerMapperFake mapper = new CustomerMapperFake();
        mapper.customer = CustomerTestSupport.publicCustomer(1L);
        FakeIdempotencyService idempotency = new FakeIdempotencyService();
        FakeFundService fundService = new FakeFundService();
        CustomerServiceImpl service = service(
            mapper,
            idempotency,
            fundService,
            userMapper(Collections.emptyList()),
            roleService(Collections.emptyMap())
        );

        CustomerTestSupport.assertServiceException("公共客户不启用客户级样品返现",
            () -> service.createSampleRebateRecord(sampleRecord("rebate-key"), 7L, "tester"));

        assertEquals(0, idempotency.beginCalls);
        assertEquals(0, mapper.insertSampleRebateCalls);
        assertEquals(0, fundService.recordSampleRebateFlowCalls);
    }

    @Test
    public void salesmanCandidatesReturnEmptyInsteadOfFallingBackToAllUsers()
    {
        SysUser normalUser = user(1L, "normal");
        SysUser financeUser = user(2L, "finance");
        CustomerServiceImpl service = service(
            new CustomerMapperFake(),
            new FakeIdempotencyService(),
            new FakeFundService(),
            userMapper(Arrays.asList(normalUser, financeUser)),
            roleService(Collections.emptyMap())
        );

        List<SysUser> result = service.selectSalesmanCandidates(null);

        assertEquals(Collections.emptyList(), result);
    }

    @Test
    public void salesmanCandidatesKeepOnlySalesRoleUsers()
    {
        SysUser normalUser = user(1L, "normal");
        SysUser salesUser = user(2L, "sales");
        Map<Long, List<SysRole>> roles = new HashMap<>();
        roles.put(1L, Collections.singletonList(role("finance", "财务")));
        roles.put(2L, Collections.singletonList(role("sales", "销售")));
        CustomerServiceImpl service = service(
            new CustomerMapperFake(),
            new FakeIdempotencyService(),
            new FakeFundService(),
            userMapper(Arrays.asList(normalUser, salesUser)),
            roleService(roles)
        );

        List<SysUser> result = service.selectSalesmanCandidates("sa");

        assertEquals(1, result.size());
        assertSame(salesUser, result.get(0));
    }

    private CustomerServiceImpl service(
        CustomerMapperFake mapper,
        IdempotencyService idempotencyService,
        ICustomerFundService fundService,
        SysUserMapper sysUserMapper,
        ISysRoleService sysRoleService)
    {
        CustomerServiceImpl service = new CustomerServiceImpl();
        CustomerTestSupport.inject(service, "customerMapper", mapper.proxy());
        CustomerTestSupport.inject(service, "idempotencyService", idempotencyService);
        CustomerTestSupport.inject(service, "customerFundService", fundService);
        CustomerTestSupport.inject(service, "sysUserMapper", sysUserMapper);
        CustomerTestSupport.inject(service, "sysRoleService", sysRoleService);
        CustomerTestSupport.inject(service, "sysDeptMapper", deptMapper());
        return service;
    }

    private SampleRebateRecord sampleRecord(String idempotentKey)
    {
        SampleRebateRecord record = new SampleRebateRecord();
        record.setCustomerId(1L);
        record.setSampleOrderId(30L);
        record.setSampleOrderNo(" sample-001 ");
        record.setSampleAmount(new BigDecimal("100.00"));
        record.setSupportMode("RATE");
        record.setTotalSupportRate(new BigDecimal("0.3000"));
        record.setInstantDiscountRate(new BigDecimal("0.9000"));
        record.setIdempotentKey(idempotentKey);
        return record;
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

    private SysUser user(Long userId, String userName)
    {
        SysUser user = new SysUser();
        user.setUserId(userId);
        user.setUserName(userName);
        user.setStatus("0");
        return user;
    }

    private SysRole role(String roleKey, String roleName)
    {
        SysRole role = new SysRole();
        role.setRoleKey(roleKey);
        role.setRoleName(roleName);
        return role;
    }

    private SysUserMapper userMapper(List<SysUser> users)
    {
        return CustomerTestSupport.proxy(SysUserMapper.class, (proxy, method, args) -> {
            if ("selectUserList".equals(method.getName()))
            {
                return users;
            }
            return CustomerTestSupport.defaultValue(method);
        });
    }

    private ISysRoleService roleService(Map<Long, List<SysRole>> roles)
    {
        return CustomerTestSupport.proxy(ISysRoleService.class, (proxy, method, args) -> {
            if ("selectRolesByUserId".equals(method.getName()))
            {
                return roles.getOrDefault((Long) args[0], Collections.emptyList());
            }
            return CustomerTestSupport.defaultValue(method);
        });
    }

    private SysDeptMapper deptMapper()
    {
        return CustomerTestSupport.proxy(SysDeptMapper.class, (proxy, method, args) -> CustomerTestSupport.defaultValue(method));
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

    private static class FakeFundService implements ICustomerFundService
    {
        private int recordSampleRebateFlowCalls;
        private SampleRebateRecord lastRecord;

        @Override
        public void initFundAccounts(com.ruoyi.business.customer.domain.Customer customer, String operator)
        {
        }

        @Override
        public List<CustomerFundAccount> selectFundAccounts(Long customerId)
        {
            return Collections.emptyList();
        }

        @Override
        public CustomerFundFlow recordCustomerDeposit(Long customerId, CustomerFundEntry entry, Long operatorId, String operatorName)
        {
            return null;
        }

        @Override
        public CustomerFundFlow recordFundEntry(Long customerId, CustomerFundEntry entry, Long operatorId, String operatorName)
        {
            return null;
        }

        @Override
        public CustomerFundFlow recordSampleRebateFlow(SampleRebateRecord record, Long operatorId, String operatorName)
        {
            recordSampleRebateFlowCalls++;
            lastRecord = record;
            CustomerFundFlow flow = new CustomerFundFlow();
            flow.setAccountType("SAMPLE_REBATE");
            flow.setFlowType("SAMPLE_REBATE_GENERATE");
            return flow;
        }
    }

    private static class CustomerMapperFake implements InvocationHandler
    {
        private com.ruoyi.business.customer.domain.Customer customer = CustomerTestSupport.realCustomer(1L);
        private SampleRebateRecord replayRecord;
        private SampleRebateRecord insertedRecord;
        private int selectCustomerCalls;
        private int insertSampleRebateCalls;
        private int selectSampleRebateRecordByIdCalls;

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
            if ("insertSampleRebateRecord".equals(name))
            {
                insertSampleRebateCalls++;
                insertedRecord = (SampleRebateRecord) args[0];
                insertedRecord.setRebateRecordId(700L);
                return 1;
            }
            if ("selectSampleRebateRecordById".equals(name))
            {
                selectSampleRebateRecordByIdCalls++;
                return replayRecord;
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
