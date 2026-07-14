package com.ruoyi.business.customer.service;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertSame;
import static org.junit.Assert.assertTrue;

import com.ruoyi.business.common.idempotency.domain.IdempotentRequest;
import com.ruoyi.business.common.idempotency.mapper.IdempotentRequestMapper;
import com.ruoyi.business.common.idempotency.service.IdempotencyService;
import com.ruoyi.business.common.idempotency.service.impl.IdempotencyServiceImpl;
import com.ruoyi.business.customer.domain.CustomerFundAccount;
import com.ruoyi.business.customer.domain.CustomerFundEntry;
import com.ruoyi.business.customer.domain.CustomerFundFlow;
import com.ruoyi.business.customer.domain.CustomerOwnerTransfer;
import com.ruoyi.business.customer.domain.CustomerSamplePolicy;
import com.ruoyi.business.customer.domain.SampleRebateRecord;
import com.ruoyi.business.customer.mapper.CustomerMapper;
import com.ruoyi.business.customer.service.impl.CustomerServiceImpl;
import com.ruoyi.business.customer.service.impl.UnavailableSampleRebateOrderAuthority;
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
import org.springframework.dao.DuplicateKeyException;
import org.junit.Test;

public class CustomerServiceTest
{
    @Test
    public void customerDetailContainsOnlyQuerySafeCustomerData()
    {
        CustomerMapperFake mapper = new CustomerMapperFake();
        FakeFundService fundService = new FakeFundService();
        CustomerServiceImpl service = service(
            mapper,
            new FakeIdempotencyService(),
            fundService,
            userMapper(Collections.emptyList()),
            roleService(Collections.emptyMap())
        );
        Map<String, Object> detail = service.selectCustomerDetail(1L);

        assertEquals(Collections.singleton("customer"), detail.keySet());
        assertSame(mapper.customer, detail.get("customer"));
        assertEquals(0, fundService.selectFundAccountsCalls);
    }

    @Test
    public void sampleRebateFailsClosedWithoutAuthoritativeOrderSource()
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
        CustomerTestSupport.inject(service, "sampleRebateOrderAuthority", new UnavailableSampleRebateOrderAuthority());

        CustomerTestSupport.assertServiceException("权威样品订单来源尚未接入",
            () -> service.createSampleRebateRecord(sampleRecord("rebate-key"), 7L, "tester"));

        assertEquals(0, idempotency.beginCalls);
        assertEquals(0, mapper.insertSampleRebateCalls);
        assertEquals(0, fundService.recordSampleRebateFlowCalls);
    }

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
    public void sampleRebateRejectsDuplicateAuthoritativeOrderBeforeFundMutation()
    {
        CustomerMapperFake mapper = new CustomerMapperFake();
        mapper.rejectDuplicateSampleOrder = true;
        FakeIdempotencyService idempotency = new FakeIdempotencyService();
        FakeFundService fundService = new FakeFundService();
        CustomerServiceImpl service = service(
            mapper,
            idempotency,
            fundService,
            userMapper(Collections.emptyList()),
            roleService(Collections.emptyMap())
        );

        CustomerTestSupport.assertServiceException("样品订单已生成返现",
            () -> service.createSampleRebateRecord(sampleRecord("another-key"), 7L, "tester"));

        assertEquals(1, idempotency.beginCalls);
        assertEquals(1, mapper.insertSampleRebateCalls);
        assertEquals(0, fundService.recordSampleRebateFlowCalls);
        assertEquals(0, idempotency.markSuccessCalls);
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
    public void sampleRebateRejectsClientPolicyMismatchBeforeIdempotency()
    {
        CustomerMapperFake mapper = new CustomerMapperFake();
        FakeIdempotencyService idempotency = new FakeIdempotencyService();
        CustomerServiceImpl service = service(
            mapper,
            idempotency,
            new FakeFundService(),
            userMapper(Collections.emptyList()),
            roleService(Collections.emptyMap())
        );
        SampleRebateRecord record = sampleRecord("rebate-key");
        record.setTotalSupportRate(new BigDecimal("0.9900"));

        CustomerTestSupport.assertServiceException("服务端样品政策",
            () -> service.createSampleRebateRecord(record, 7L, "tester"));

        assertEquals(0, idempotency.beginCalls);
        assertEquals(0, mapper.insertSampleRebateCalls);
    }

    @Test
    public void sampleRebateUsesAuthoritativeAmountInsteadOfClientAmount()
    {
        CustomerMapperFake mapper = new CustomerMapperFake();
        FakeIdempotencyService idempotency = new FakeIdempotencyService();
        CustomerServiceImpl service = service(
            mapper,
            idempotency,
            new FakeFundService(),
            userMapper(Collections.emptyList()),
            roleService(Collections.emptyMap())
        );
        SampleRebateRecord record = sampleRecord("rebate-key");
        record.setSampleAmount(new BigDecimal("999999.99"));

        SampleRebateRecord result = service.createSampleRebateRecord(record, 7L, "tester");

        assertEquals(new BigDecimal("100.00"), result.getSampleAmount());
        assertEquals(1, idempotency.beginCalls);
    }

    @Test
    public void sampleRebateRejectsInvalidAuthoritativeOrderBeforeIdempotency()
    {
        CustomerMapperFake mapper = new CustomerMapperFake();
        FakeIdempotencyService idempotency = new FakeIdempotencyService();
        CustomerServiceImpl service = service(
            mapper,
            idempotency,
            new FakeFundService(),
            userMapper(Collections.emptyList()),
            roleService(Collections.emptyMap())
        );
        CustomerTestSupport.inject(service, "sampleRebateOrderAuthority",
            (SampleRebateOrderAuthority) (customerId, orderId, orderNo) ->
                new SampleRebateOrderAuthority.AuthoritativeSampleOrder(customerId, orderId, orderNo, BigDecimal.ZERO));

        CustomerTestSupport.assertServiceException("权威样品订单数据不完整",
            () -> service.createSampleRebateRecord(sampleRecord("invalid-authority"), 7L, "tester"));

        assertEquals(0, idempotency.beginCalls);
        assertEquals(0, mapper.insertSampleRebateCalls);
    }

    @Test
    public void sampleRebateRejectsInvalidServerPolicyBeforeIdempotency()
    {
        CustomerMapperFake invalidModeMapper = new CustomerMapperFake();
        invalidModeMapper.policy.setSupportMode("UNKNOWN");
        FakeIdempotencyService invalidModeIdempotency = new FakeIdempotencyService();
        CustomerServiceImpl invalidModeService = service(
            invalidModeMapper,
            invalidModeIdempotency,
            new FakeFundService(),
            userMapper(Collections.emptyList()),
            roleService(Collections.emptyMap())
        );
        CustomerTestSupport.assertServiceException("样品支持模式不合法",
            () -> invalidModeService.createSampleRebateRecord(sampleRecord("invalid-mode"), 7L, "tester"));
        assertEquals(0, invalidModeIdempotency.beginCalls);

        CustomerMapperFake invalidRateMapper = new CustomerMapperFake();
        invalidRateMapper.policy.setTotalSupportRate(new BigDecimal("1.0001"));
        FakeIdempotencyService invalidRateIdempotency = new FakeIdempotencyService();
        CustomerServiceImpl invalidRateService = service(
            invalidRateMapper,
            invalidRateIdempotency,
            new FakeFundService(),
            userMapper(Collections.emptyList()),
            roleService(Collections.emptyMap())
        );
        CustomerTestSupport.assertServiceException("必须在0到1之间",
            () -> invalidRateService.createSampleRebateRecord(sampleRecord("invalid-rate"), 7L, "tester"));
        assertEquals(0, invalidRateIdempotency.beginCalls);
    }

    @Test
    public void sampleRebateRejectsNegativeDiscountBeforeIdempotency()
    {
        CustomerMapperFake mapper = new CustomerMapperFake();
        FakeIdempotencyService idempotency = new FakeIdempotencyService();
        CustomerServiceImpl service = service(
            mapper,
            idempotency,
            new FakeFundService(),
            userMapper(Collections.emptyList()),
            roleService(Collections.emptyMap())
        );
        SampleRebateRecord record = sampleRecord("negative-discount");
        record.setInstantDiscountAmount(new BigDecimal("-0.01"));

        CustomerTestSupport.assertServiceException("服务端样品政策支持额度",
            () -> service.createSampleRebateRecord(record, 7L, "tester"));
        assertEquals(0, idempotency.beginCalls);
    }

    @Test
    public void sampleRebateHashCoversOrderIdentityAndEffectiveDiscount()
    {
        CustomerMapperFake mapper = new CustomerMapperFake();
        FakeIdempotencyService firstIdempotency = new FakeIdempotencyService();
        CustomerServiceImpl firstService = service(
            mapper,
            firstIdempotency,
            new FakeFundService(),
            userMapper(Collections.emptyList()),
            roleService(Collections.emptyMap())
        );
        SampleRebateRecord first = sampleRecord("rebate-key-1");
        firstService.createSampleRebateRecord(first, 7L, "tester");

        FakeIdempotencyService changedOrderIdempotency = new FakeIdempotencyService();
        CustomerServiceImpl changedOrderService = service(
            new CustomerMapperFake(),
            changedOrderIdempotency,
            new FakeFundService(),
            userMapper(Collections.emptyList()),
            roleService(Collections.emptyMap())
        );
        SampleRebateRecord changedOrder = sampleRecord("rebate-key-2");
        changedOrder.setSampleOrderId(31L);
        changedOrderService.createSampleRebateRecord(changedOrder, 7L, "tester");

        FakeIdempotencyService changedDiscountIdempotency = new FakeIdempotencyService();
        CustomerServiceImpl changedDiscountService = service(
            new CustomerMapperFake(),
            changedDiscountIdempotency,
            new FakeFundService(),
            userMapper(Collections.emptyList()),
            roleService(Collections.emptyMap())
        );
        SampleRebateRecord changedDiscount = sampleRecord("rebate-key-3");
        changedDiscount.setInstantDiscountAmount(new BigDecimal("5.00"));
        changedDiscountService.createSampleRebateRecord(changedDiscount, 7L, "tester");

        assertTrue(!firstIdempotency.lastRequestHash.equals(changedOrderIdempotency.lastRequestHash));
        assertTrue(!firstIdempotency.lastRequestHash.equals(changedDiscountIdempotency.lastRequestHash));
    }

    @Test
    public void sampleRebateImplicitAndEquivalentExplicitDiscountShareHash()
    {
        FakeIdempotencyService implicitIdempotency = new FakeIdempotencyService();
        CustomerServiceImpl implicitService = service(
            new CustomerMapperFake(),
            implicitIdempotency,
            new FakeFundService(),
            userMapper(Collections.emptyList()),
            roleService(Collections.emptyMap())
        );
        implicitService.createSampleRebateRecord(sampleRecord("implicit"), 7L, "tester");

        FakeIdempotencyService explicitIdempotency = new FakeIdempotencyService();
        CustomerServiceImpl explicitService = service(
            new CustomerMapperFake(),
            explicitIdempotency,
            new FakeFundService(),
            userMapper(Collections.emptyList()),
            roleService(Collections.emptyMap())
        );
        SampleRebateRecord explicit = sampleRecord("explicit");
        explicit.setInstantDiscountAmount(new BigDecimal("10.00"));
        explicitService.createSampleRebateRecord(explicit, 7L, "tester");

        assertEquals(implicitIdempotency.lastRequestHash, explicitIdempotency.lastRequestHash);
    }

    @Test
    public void transferOwnerRejectsUserWithoutAssignedSalesRole()
    {
        CustomerMapperFake mapper = new CustomerMapperFake();
        SysUser candidate = user(8L, "candidate");
        SysRole unassignedSalesRole = role("sales", "销售");
        unassignedSalesRole.setFlag(false);
        Map<Long, List<SysRole>> roles = new HashMap<>();
        roles.put(8L, Collections.singletonList(unassignedSalesRole));
        CustomerServiceImpl service = service(
            mapper,
            new FakeIdempotencyService(),
            new FakeFundService(),
            userMapper(Collections.singletonList(candidate)),
            roleService(roles)
        );
        CustomerOwnerTransfer transfer = new CustomerOwnerTransfer();
        transfer.setCustomerId(1L);
        transfer.setTransferMode("ASSIGN_MAINTENANCE");
        transfer.setNewOwnerUserId(8L);
        transfer.setChangeReason("test");

        CustomerTestSupport.assertServiceException("销售或业务员角色",
            () -> service.transferOwner(transfer, 7L, "tester"));

        assertEquals(0, mapper.updateCustomerOwnerCalls);
        assertEquals(0, mapper.insertOwnerLogCalls);
    }

    @Test
    public void transferOwnerRejectsSpoofedSalesRoleDisplayName()
    {
        CustomerMapperFake mapper = new CustomerMapperFake();
        SysUser candidate = user(8L, "candidate");
        Map<Long, List<SysRole>> roles = new HashMap<>();
        roles.put(8L, Collections.singletonList(role("common", "销售业务员")));
        CustomerServiceImpl service = service(
            mapper,
            new FakeIdempotencyService(),
            new FakeFundService(),
            userMapper(Collections.singletonList(candidate)),
            roleService(roles)
        );

        CustomerTestSupport.assertServiceException("销售或业务员角色",
            () -> service.transferOwner(ownerTransfer(8L), 7L, "tester"));

        assertEquals(0, mapper.updateCustomerOwnerCalls);
        assertEquals(0, mapper.insertOwnerLogCalls);
    }

    @Test
    public void transferOwnerRejectsDisabledOrDeletedUsers()
    {
        SysUser disabled = user(8L, "disabled");
        disabled.setStatus("1");
        Map<Long, List<SysRole>> disabledRoles = new HashMap<>();
        disabledRoles.put(8L, Collections.singletonList(role("sales", "销售")));
        CustomerMapperFake disabledMapper = new CustomerMapperFake();
        CustomerServiceImpl disabledService = service(
            disabledMapper,
            new FakeIdempotencyService(),
            new FakeFundService(),
            userMapper(Collections.singletonList(disabled)),
            roleService(disabledRoles)
        );
        CustomerTestSupport.assertServiceException("正常且未删除",
            () -> disabledService.transferOwner(ownerTransfer(8L), 7L, "tester"));
        assertEquals(0, disabledMapper.updateCustomerOwnerCalls);
        assertEquals(0, disabledMapper.insertOwnerLogCalls);

        SysUser deleted = user(9L, "deleted");
        deleted.setDelFlag("2");
        Map<Long, List<SysRole>> deletedRoles = new HashMap<>();
        deletedRoles.put(9L, Collections.singletonList(role("sales", "销售")));
        CustomerMapperFake deletedMapper = new CustomerMapperFake();
        CustomerServiceImpl deletedService = service(
            deletedMapper,
            new FakeIdempotencyService(),
            new FakeFundService(),
            userMapper(Collections.singletonList(deleted)),
            roleService(deletedRoles)
        );
        CustomerTestSupport.assertServiceException("正常且未删除",
            () -> deletedService.transferOwner(ownerTransfer(9L), 7L, "tester"));
        assertEquals(0, deletedMapper.updateCustomerOwnerCalls);
        assertEquals(0, deletedMapper.insertOwnerLogCalls);
    }

    @Test
    public void standardCustomerEditCannotChangeOwnerFields()
    {
        CustomerMapperFake mapper = new CustomerMapperFake();
        CustomerServiceImpl service = service(
            mapper,
            new FakeIdempotencyService(),
            new FakeFundService(),
            userMapper(Collections.emptyList()),
            roleService(Collections.emptyMap())
        );
        com.ruoyi.business.customer.domain.Customer update = CustomerTestSupport.realCustomer(1L);
        update.setOwnerType("SALESMAN");

        CustomerTestSupport.assertServiceException("归属变更接口", () -> service.updateCustomer(update));

        assertEquals(0, mapper.updateCustomerCalls);
        assertEquals(0, mapper.updateCustomerOwnerCalls);
    }

    @Test
    public void transferOwnerUsesDedicatedMutationAndAuditLog()
    {
        CustomerMapperFake mapper = new CustomerMapperFake();
        SysUser candidate = user(8L, "sales-user");
        Map<Long, List<SysRole>> roles = new HashMap<>();
        roles.put(8L, Collections.singletonList(role("sales", "销售")));
        CustomerServiceImpl service = service(
            mapper,
            new FakeIdempotencyService(),
            new FakeFundService(),
            userMapper(Collections.singletonList(candidate)),
            roleService(roles)
        );
        CustomerOwnerTransfer transfer = new CustomerOwnerTransfer();
        transfer.setCustomerId(1L);
        transfer.setTransferMode("ASSIGN_MAINTENANCE");
        transfer.setNewOwnerUserId(8L);
        transfer.setChangeReason("test");

        assertEquals(1, service.transferOwner(transfer, 7L, "tester"));
        assertEquals(0, mapper.updateCustomerCalls);
        assertEquals(1, mapper.selectCustomerByIdForUpdateCalls);
        assertEquals(1, mapper.updateCustomerOwnerCalls);
        assertEquals(1, mapper.insertOwnerLogCalls);
    }

    @Test
    public void transferOwnerDoesNotWriteAuditWhenLockedUpdateMisses()
    {
        CustomerMapperFake mapper = new CustomerMapperFake();
        mapper.updateCustomerOwnerResult = 0;
        SysUser candidate = user(8L, "sales-user");
        Map<Long, List<SysRole>> roles = new HashMap<>();
        roles.put(8L, Collections.singletonList(role("sales", "销售")));
        CustomerServiceImpl service = service(
            mapper,
            new FakeIdempotencyService(),
            new FakeFundService(),
            userMapper(Collections.singletonList(candidate)),
            roleService(roles)
        );

        CustomerTestSupport.assertServiceException("客户归属更新失败",
            () -> service.transferOwner(ownerTransfer(8L), 7L, "tester"));

        assertEquals(1, mapper.selectCustomerByIdForUpdateCalls);
        assertEquals(1, mapper.updateCustomerOwnerCalls);
        assertEquals(0, mapper.insertOwnerLogCalls);
    }

    @Test
    public void sampleRebateCannotExceedServerPolicyBudget()
    {
        CustomerMapperFake mapper = new CustomerMapperFake();
        FakeIdempotencyService idempotency = new FakeIdempotencyService();
        CustomerServiceImpl service = service(
            mapper,
            idempotency,
            new FakeFundService(),
            userMapper(Collections.emptyList()),
            roleService(Collections.emptyMap())
        );
        SampleRebateRecord record = sampleRecord("rebate-key");
        record.setInstantDiscountAmount(new BigDecimal("40.00"));

        CustomerTestSupport.assertServiceException("服务端样品政策支持额度",
            () -> service.createSampleRebateRecord(record, 7L, "tester"));

        assertEquals(0, idempotency.beginCalls);
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
        CustomerTestSupport.inject(service, "sampleRebateOrderAuthority", allowingSampleRebateOrderAuthority());
        CustomerTestSupport.inject(service, "customerFundService", fundService);
        CustomerTestSupport.inject(service, "sysUserMapper", sysUserMapper);
        CustomerTestSupport.inject(service, "sysRoleService", sysRoleService);
        CustomerTestSupport.inject(service, "sysDeptMapper", deptMapper());
        return service;
    }

    private SampleRebateOrderAuthority allowingSampleRebateOrderAuthority()
    {
        return (customerId, orderId, orderNo) -> new SampleRebateOrderAuthority.AuthoritativeSampleOrder(
            customerId,
            orderId,
            orderNo == null ? null : orderNo.trim(),
            new BigDecimal("100.00")
        );
    }

    private SampleRebateRecord sampleRecord(String idempotentKey)
    {
        SampleRebateRecord record = new SampleRebateRecord();
        record.setCustomerId(1L);
        record.setSampleOrderId(30L);
        record.setSampleOrderNo(" sample-001 ");
        record.setSampleAmount(new BigDecimal("100.00"));
        record.setSupportMode("DISCOUNT_AND_REBATE");
        record.setTotalSupportRate(new BigDecimal("0.3000"));
        record.setInstantDiscountRate(new BigDecimal("0.9000"));
        record.setIdempotentKey(idempotentKey);
        return record;
    }

    private CustomerOwnerTransfer ownerTransfer(Long ownerUserId)
    {
        CustomerOwnerTransfer transfer = new CustomerOwnerTransfer();
        transfer.setCustomerId(1L);
        transfer.setTransferMode("ASSIGN_MAINTENANCE");
        transfer.setNewOwnerUserId(ownerUserId);
        transfer.setChangeReason("test");
        return transfer;
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
        user.setDelFlag("0");
        return user;
    }

    private SysRole role(String roleKey, String roleName)
    {
        SysRole role = new SysRole();
        role.setRoleKey(roleKey);
        role.setRoleName(roleName);
        role.setFlag(true);
        role.setStatus("0");
        role.setDelFlag("0");
        return role;
    }

    private SysUserMapper userMapper(List<SysUser> users)
    {
        return CustomerTestSupport.proxy(SysUserMapper.class, (proxy, method, args) -> {
            if ("selectUserList".equals(method.getName()))
            {
                return users;
            }
            if ("selectUserById".equals(method.getName()))
            {
                Long userId = (Long) args[0];
                return users.stream().filter(user -> userId.equals(user.getUserId())).findFirst().orElse(null);
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
        private String lastRequestHash;

        @Override
        public IdempotentRequest begin(String bizType, String idempotentKey, Long bizId, String requestHash, String operator)
        {
            beginCalls++;
            lastRequestHash = requestHash;
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
        private int selectFundAccountsCalls;
        private SampleRebateRecord lastRecord;

        @Override
        public void initFundAccounts(com.ruoyi.business.customer.domain.Customer customer, String operator)
        {
        }

        @Override
        public List<CustomerFundAccount> selectFundAccounts(Long customerId)
        {
            selectFundAccountsCalls++;
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
        private CustomerSamplePolicy policy = activePolicy();
        private int selectCustomerCalls;
        private int insertSampleRebateCalls;
        private int selectSampleRebateRecordByIdCalls;
        private int updateCustomerOwnerCalls;
        private int updateCustomerCalls;
        private int insertOwnerLogCalls;
        private boolean rejectDuplicateSampleOrder;
        private int selectCustomerByIdForUpdateCalls;
        private int updateCustomerOwnerResult = 1;

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
            if ("selectCustomerByIdForUpdate".equals(name))
            {
                selectCustomerByIdForUpdateCalls++;
                return customer;
            }
            if ("insertSampleRebateRecord".equals(name))
            {
                insertSampleRebateCalls++;
                if (rejectDuplicateSampleOrder)
                {
                    throw new DuplicateKeyException("uk_sample_rebate_order_id");
                }
                insertedRecord = (SampleRebateRecord) args[0];
                insertedRecord.setRebateRecordId(700L);
                return 1;
            }
            if ("selectSamplePolicyByCustomerId".equals(name))
            {
                return policy;
            }
            if ("updateCustomerOwner".equals(name))
            {
                updateCustomerOwnerCalls++;
                return updateCustomerOwnerResult;
            }
            if ("updateCustomer".equals(name))
            {
                updateCustomerCalls++;
                return 1;
            }
            if ("insertOwnerLog".equals(name))
            {
                insertOwnerLogCalls++;
                return 1;
            }
            if ("selectSampleRebateRecordById".equals(name))
            {
                selectSampleRebateRecordByIdCalls++;
                return replayRecord;
            }
            return CustomerTestSupport.defaultValue(method);
        }

        private static CustomerSamplePolicy activePolicy()
        {
            CustomerSamplePolicy policy = new CustomerSamplePolicy();
            policy.setCustomerId(1L);
            policy.setSupportMode("DISCOUNT_AND_REBATE");
            policy.setTotalSupportRate(new BigDecimal("0.3000"));
            policy.setInstantDiscountRate(new BigDecimal("0.9000"));
            policy.setStatus("0");
            return policy;
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
