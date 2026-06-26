package com.ruoyi.business.customer.service.impl;

import java.math.BigDecimal;
import java.math.BigInteger;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.regex.Pattern;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.ruoyi.business.common.idempotency.domain.IdempotentRequest;
import com.ruoyi.business.common.idempotency.service.IdempotencyService;
import com.ruoyi.business.common.idempotency.support.IdempotencyRequestHash;
import com.ruoyi.business.customer.domain.Customer;
import com.ruoyi.business.customer.domain.CustomerAddress;
import com.ruoyi.business.customer.domain.CustomerContact;
import com.ruoyi.business.customer.domain.CustomerDepositBatch;
import com.ruoyi.business.customer.domain.CustomerFundAccount;
import com.ruoyi.business.customer.domain.CustomerFundEntry;
import com.ruoyi.business.customer.domain.CustomerFundFlow;
import com.ruoyi.business.customer.domain.CustomerOwnerTransfer;
import com.ruoyi.business.customer.domain.CustomerSalesmanBindLog;
import com.ruoyi.business.customer.domain.CustomerSamplePolicy;
import com.ruoyi.business.customer.domain.SampleRebateRecord;
import com.ruoyi.business.customer.mapper.CustomerMapper;
import com.ruoyi.business.customer.service.ICustomerFundService;
import com.ruoyi.business.customer.service.ICustomerService;
import com.ruoyi.common.core.domain.entity.SysDept;
import com.ruoyi.common.core.domain.entity.SysRole;
import com.ruoyi.common.core.domain.entity.SysUser;
import com.ruoyi.common.exception.ServiceException;
import com.ruoyi.common.utils.StringUtils;
import com.ruoyi.system.mapper.SysDeptMapper;
import com.ruoyi.system.mapper.SysUserMapper;
import com.ruoyi.system.service.ISysRoleService;

/**
 * 客户管理 服务实现.
 */
@Service
public class CustomerServiceImpl implements ICustomerService
{
    private static final String NORMAL = "0";
    private static final String DELETED = "2";
    private static final String YES = "Y";
    private static final String NO = "N";
    private static final String REAL = "REAL";
    private static final String PUBLIC = "PUBLIC";
    private static final String DIRECT_SALE = "DIRECT_SALE";
    private static final String SELF_MEDIA = "SELF_MEDIA";
    private static final String PUBLIC_DIRECT_SALE_CODE = "PUB_DIRECT_SALE";
    private static final String PUBLIC_SELF_MEDIA_CODE = "PUB_SELF_MEDIA";
    private static final String OWNER_FACTORY = "FACTORY";
    private static final String OWNER_SALESMAN = "SALESMAN";
    private static final String OWNER_NONE = "NONE";
    private static final String SOURCE_FACTORY_POOL = "FACTORY_POOL";
    private static final String SOURCE_FACTORY_ASSIGNED = "FACTORY_ASSIGNED";
    private static final String SOURCE_SALESMAN_SELF = "SALESMAN_SELF";
    private static final String SOURCE_NONE = "NONE";
    private static final String PROFIT_NONE = "NONE";
    private static final String PROFIT_MAINTENANCE_FEE = "MAINTENANCE_FEE";
    private static final String PROFIT_SALES_COMMISSION = "SALES_COMMISSION";
    private static final String TRANSFER_ASSIGN_MAINTENANCE = "ASSIGN_MAINTENANCE";
    private static final String TRANSFER_MARK_SALESMAN_SELF = "MARK_SALESMAN_SELF";
    private static final String TRANSFER_RETURN_FACTORY = "RETURN_FACTORY";
    private static final String TRANSFER_CHANGE_SALESMAN = "CHANGE_SALESMAN";
    private static final String SAMPLE_REBATE = "SAMPLE_REBATE";
    private static final String SAMPLE_REBATE_GENERATE = "SAMPLE_REBATE_GENERATE";
    private static final String BIZ_CUSTOMER_SAMPLE_REBATE = "CUSTOMER_SAMPLE_REBATE";
    private static final String RESULT_SAMPLE_REBATE_RECORD = "SAMPLE_REBATE_RECORD";
    private static final BigDecimal ZERO = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
    private static final String CUSTOMER_CODE_PREFIX = "KH";
    private static final int CUSTOMER_CODE_MIN_SEQUENCE_WIDTH = 6;
    private static final int CUSTOMER_CODE_MAX_RETRY = 8;
    private static final DateTimeFormatter CUSTOMER_CODE_MONTH_FORMATTER = DateTimeFormatter.ofPattern("yyyyMM");
    private static final Pattern MOBILE_PHONE_PATTERN = Pattern.compile("^1[3-9]\\d{9}$");

    @Autowired
    private CustomerMapper customerMapper;

    @Autowired
    private ICustomerFundService customerFundService;

    @Autowired
    private IdempotencyService idempotencyService;

    @Autowired
    private SysUserMapper sysUserMapper;

    @Autowired
    private SysDeptMapper sysDeptMapper;

    @Autowired
    private ISysRoleService sysRoleService;

    @Override
    public List<Customer> selectCustomerList(Customer customer)
    {
        return customerMapper.selectCustomerList(customer);
    }

    @Override
    public Customer selectCustomerById(Long customerId)
    {
        Customer customer = customerMapper.selectCustomerById(customerId);
        if (customer != null)
        {
            if (isPublicCustomer(customer))
            {
                customer.setContacts(Collections.emptyList());
                customer.setAddresses(Collections.emptyList());
            }
            else
            {
                customer.setContacts(customerMapper.selectContactsByCustomerId(customerId));
                customer.setAddresses(customerMapper.selectAddressesByCustomerId(customerId));
            }
        }
        return customer;
    }

    @Override
    public Map<String, Object> selectCustomerDetail(Long customerId)
    {
        Map<String, Object> detail = new HashMap<>();
        detail.put("customer", selectCustomerById(customerId));
        detail.put("ownerLogs", selectOwnerLogs(customerId));
        detail.put("fundAccounts", selectFundAccounts(customerId));
        detail.put("fundFlows", selectFundFlows(flowQuery(customerId)));
        detail.put("depositBatches", selectDepositBatches(customerId));
        detail.put("samplePolicy", selectSamplePolicy(customerId));
        detail.put("sampleRebates", selectSampleRebateRecords(customerId));
        return detail;
    }

    @Override
    @Transactional
    public int insertCustomer(Customer customer)
    {
        if (customer != null && PUBLIC.equals(customer.getCustomerNature()))
        {
            throw new ServiceException("公共客户由系统初始化，不允许手工新增。");
        }
        normalizeCustomerForSave(customer);
        assertNotReservedPublicCode(customer);
        fillDefaultShortName(customer);
        if (StringUtils.isEmpty(customer.getStatus()))
        {
            customer.setStatus(NORMAL);
        }
        customer.setDelFlag(NORMAL);
        fillOwnerSnapshot(customer);
        if (!StringUtils.isEmpty(customer.getCustomerCode()))
        {
            return insertCustomerWithChildren(customer);
        }
        for (int i = 0; i < CUSTOMER_CODE_MAX_RETRY; i++)
        {
            customer.setCustomerCode(nextCustomerCode());
            try
            {
                return insertCustomerWithChildren(customer);
            }
            catch (DuplicateKeyException e)
            {
                if (i == CUSTOMER_CODE_MAX_RETRY - 1)
                {
                    throw new ServiceException("客户编码生成冲突，请重试");
                }
            }
        }
        throw new ServiceException("客户编码生成失败，请重试");
    }

    private int insertCustomerWithChildren(Customer customer)
    {
        int rows = customerMapper.insertCustomer(customer);
        prepareCreateDefaultChildren(customer);
        replaceChildren(customer);
        customerFundService.initFundAccounts(customer, customer.getCreateBy());
        return rows;
    }

    @Override
    @Transactional
    public int updateCustomer(Customer customer)
    {
        Customer existing = requiredCustomer(customer.getCustomerId());
        if (isBuiltinPublicCustomer(existing))
        {
            throw new ServiceException("内置公共客户不允许在普通客户编辑中修改。");
        }
        if (PUBLIC.equals(customer.getCustomerNature()))
        {
            throw new ServiceException("真实客户不允许改为公共客户。");
        }
        normalizeCustomerForSave(customer);
        assertNotReservedPublicCode(customer);
        fillDefaultShortName(customer);
        fillOwnerSnapshot(customer);
        int rows = customerMapper.updateCustomer(customer);
        prepareUpdateDefaultChildren(customer);
        replaceChildren(customer);
        return rows;
    }

    @Override
    public int updateCustomerStatus(Customer customer)
    {
        Customer existing = requiredCustomer(customer.getCustomerId());
        if (isBuiltinPublicCustomer(existing))
        {
            throw new ServiceException("内置公共客户不允许停用。");
        }
        return customerMapper.updateCustomerStatus(customer);
    }

    @Override
    public int deleteCustomerByIds(Long[] customerIds)
    {
        if (customerIds != null)
        {
            for (Long customerId : customerIds)
            {
                Customer existing = requiredCustomer(customerId);
                if (isBuiltinPublicCustomer(existing))
                {
                    throw new ServiceException("内置公共客户不允许删除。");
                }
            }
        }
        return customerMapper.deleteCustomerByIds(customerIds);
    }

    @Override
    public Map<String, Object> checkDuplicate(Long customerId, String customerName, String contactPhone)
    {
        String normalizedCustomerName = trimToNull(customerName);
        String normalizedContactPhone = trimToNull(contactPhone);
        if (StringUtils.isNotEmpty(normalizedContactPhone) && !MOBILE_PHONE_PATTERN.matcher(normalizedContactPhone).matches())
        {
            normalizedContactPhone = null;
        }
        int nameCount = StringUtils.isEmpty(normalizedCustomerName) ? 0 : customerMapper.countCustomerByName(customerId, normalizedCustomerName);
        int phoneCount = StringUtils.isEmpty(normalizedContactPhone) ? 0 : customerMapper.countCustomerByPhone(customerId, normalizedContactPhone);
        Map<String, Object> result = new HashMap<>();
        result.put("nameDuplicate", nameCount > 0);
        result.put("phoneDuplicate", phoneCount > 0);
        result.put("strongDuplicate", nameCount > 0 && phoneCount > 0);
        result.put("message", duplicateMessage(nameCount > 0, phoneCount > 0));
        return result;
    }

    @Override
    public List<SysUser> selectSalesmanCandidates(String keyword)
    {
        SysUser user = new SysUser();
        user.setStatus(NORMAL);
        if (StringUtils.isNotEmpty(keyword))
        {
            user.setUserName(keyword);
        }
        List<SysUser> users = sysUserMapper.selectUserList(user);
        List<SysUser> salesmen = users.stream().filter(this::hasSalesRole).collect(Collectors.toList());
        return salesmen;
    }

    @Override
    @Transactional
    public int transferOwner(CustomerOwnerTransfer transfer, Long operatorId, String operatorName)
    {
        if (transfer == null || transfer.getCustomerId() == null)
        {
            throw new ServiceException("客户不能为空");
        }
        Customer current = requiredCustomer(transfer.getCustomerId());
        if (isPublicCustomer(current))
        {
            throw new ServiceException("公共客户不支持归属变更");
        }
        assertRequired(transfer.getChangeReason(), "变更原因不能为空");

        Customer next = buildOwnerTransferTarget(current, transfer);
        next.setCustomerId(transfer.getCustomerId());
        next.setUpdateBy(operatorName);
        fillOwnerSnapshot(next);
        int rows = customerMapper.updateCustomer(next);

        CustomerSalesmanBindLog log = new CustomerSalesmanBindLog();
        log.setCustomerId(current.getCustomerId());
        log.setOldOwnerType(current.getOwnerType());
        log.setOldOwnerSource(current.getOwnerSource());
        log.setOldOwnerProfitMode(current.getOwnerProfitMode());
        log.setOldOwnerEffectiveTime(current.getOwnerEffectiveTime());
        log.setNewOwnerType(next.getOwnerType());
        log.setNewOwnerSource(next.getOwnerSource());
        log.setNewOwnerProfitMode(next.getOwnerProfitMode());
        log.setNewOwnerEffectiveTime(next.getOwnerEffectiveTime());
        log.setOldOwnerUserId(current.getOwnerUserId());
        log.setOldOwnerUserName(current.getOwnerUserName());
        log.setOldDeptId(current.getOwnerDeptId());
        log.setOldDeptName(current.getOwnerDeptName());
        log.setNewOwnerUserId(next.getOwnerUserId());
        log.setNewOwnerUserName(next.getOwnerUserName());
        log.setNewDeptId(next.getOwnerDeptId());
        log.setNewDeptName(next.getOwnerDeptName());
        log.setChangeReason(transfer.getChangeReason());
        log.setChangeBy(operatorName);
        log.setChangeTime(new Date());
        log.setRemark(transfer.getRemark());
        customerMapper.insertOwnerLog(log);
        return rows;
    }

    @Override
    public List<CustomerSalesmanBindLog> selectOwnerLogs(Long customerId)
    {
        return customerMapper.selectOwnerLogsByCustomerId(customerId);
    }

    @Override
    public List<CustomerFundAccount> selectFundAccounts(Long customerId)
    {
        return customerFundService.selectFundAccounts(customerId);
    }

    @Override
    public CustomerFundFlow recordCustomerDeposit(Long customerId, CustomerFundEntry entry, Long operatorId, String operatorName)
    {
        return customerFundService.recordCustomerDeposit(customerId, entry, operatorId, operatorName);
    }

    @Override
    public CustomerFundFlow recordFundEntry(Long customerId, CustomerFundEntry entry, Long operatorId, String operatorName)
    {
        return customerFundService.recordFundEntry(customerId, entry, operatorId, operatorName);
    }

    @Override
    public List<CustomerFundFlow> selectFundFlows(CustomerFundFlow flow)
    {
        return customerMapper.selectFundFlows(flow);
    }

    @Override
    public List<CustomerDepositBatch> selectDepositBatches(Long customerId)
    {
        return customerMapper.selectDepositBatchesByCustomerId(customerId);
    }

    @Override
    public CustomerSamplePolicy selectSamplePolicy(Long customerId)
    {
        Customer customer = requiredCustomer(customerId);
        if (isPublicCustomer(customer))
        {
            CustomerSamplePolicy policy = new CustomerSamplePolicy();
            policy.setCustomerId(customerId);
            policy.setSupportMode("NONE");
            policy.setStatus("1");
            return policy;
        }
        CustomerSamplePolicy policy = customerMapper.selectSamplePolicyByCustomerId(customerId);
        if (policy == null)
        {
            policy = new CustomerSamplePolicy();
            policy.setCustomerId(customerId);
            policy.setSupportMode("NONE");
            policy.setStatus(NORMAL);
        }
        return policy;
    }

    @Override
    @Transactional
    public int saveSamplePolicy(CustomerSamplePolicy policy)
    {
        assertRealCustomerFeature(policy.getCustomerId(), "公共客户不启用客户级样品政策。");
        CustomerSamplePolicy existing = customerMapper.selectSamplePolicyByCustomerId(policy.getCustomerId());
        if (StringUtils.isEmpty(policy.getStatus()))
        {
            policy.setStatus(NORMAL);
        }
        return existing == null ? customerMapper.insertSamplePolicy(policy) : customerMapper.updateSamplePolicy(policy);
    }

    @Override
    @Transactional
    public SampleRebateRecord createSampleRebateRecord(SampleRebateRecord record, Long operatorId, String operatorName)
    {
        if (record == null || record.getCustomerId() == null)
        {
            throw new ServiceException("样品返现记录不能为空");
        }
        assertRealCustomerFeature(record.getCustomerId(), "公共客户不启用客户级样品返现。");
        IdempotentRequest request = idempotencyService.begin(
            BIZ_CUSTOMER_SAMPLE_REBATE,
            record.getIdempotentKey(),
            record.getCustomerId(),
            sampleRebateRequestHash(record, operatorId, operatorName),
            operatorName
        );
        if (request.isReplay())
        {
            return replaySampleRebate(request);
        }

        fillSampleRebateAmounts(record);
        record.setUsedAmount(ZERO);
        record.setRemainingAmount(money(record.getRebateAmount()));
        record.setStatus("AVAILABLE");
        record.setCreateBy(operatorName);
        customerMapper.insertSampleRebateRecord(record);

        customerFundService.recordSampleRebateFlow(record, operatorId, operatorName);
        idempotencyService.markSuccess(request.getRequestId(), RESULT_SAMPLE_REBATE_RECORD, record.getRebateRecordId());
        return record;
    }

    @Override
    public List<SampleRebateRecord> selectSampleRebateRecords(Long customerId)
    {
        return customerMapper.selectSampleRebateRecordsByCustomerId(customerId);
    }

    private void replaceChildren(Customer customer)
    {
        if (customer.getCustomerId() == null)
        {
            return;
        }
        customerMapper.deleteContactsByCustomerId(customer.getCustomerId());
        List<CustomerContact> contacts = customer.getContacts();
        if (isPublicCustomer(customer))
        {
            customerMapper.deleteAddressesByCustomerId(customer.getCustomerId());
            return;
        }
        normalizeDefaultContact(contacts);
        if (contacts != null)
        {
            for (CustomerContact contact : contacts)
            {
                if (StringUtils.isEmpty(contact.getContactName()) && StringUtils.isEmpty(contact.getPhone()))
                {
                    continue;
                }
                contact.setCustomerId(customer.getCustomerId());
                contact.setDelFlag(NORMAL);
                contact.setCreateBy(customer.getUpdateBy() != null ? customer.getUpdateBy() : customer.getCreateBy());
                customerMapper.insertContact(contact);
            }
        }

        customerMapper.deleteAddressesByCustomerId(customer.getCustomerId());
        List<CustomerAddress> addresses = customer.getAddresses();
        normalizeDefaultAddress(addresses);
        if (addresses != null)
        {
            for (CustomerAddress address : addresses)
            {
                if (StringUtils.isEmpty(address.getReceiverName()) && StringUtils.isEmpty(address.getDetailAddress()))
                {
                    continue;
                }
                address.setCustomerId(customer.getCustomerId());
                address.setDelFlag(NORMAL);
                address.setCreateBy(customer.getUpdateBy() != null ? customer.getUpdateBy() : customer.getCreateBy());
                customerMapper.insertAddress(address);
            }
        }
    }

    private void prepareCreateDefaultChildren(Customer customer)
    {
        if (isPublicCustomer(customer))
        {
            return;
        }
        if (shouldCreateDefaultContact(customer))
        {
            ensureContacts(customer).add(buildDefaultContact(customer));
        }
        if (shouldCreateDefaultAddress(customer))
        {
            ensureAddresses(customer).add(buildDefaultAddress(customer, null));
        }
    }

    private void prepareUpdateDefaultChildren(Customer customer)
    {
        if (isPublicCustomer(customer))
        {
            return;
        }
        if (Boolean.TRUE.equals(customer.getSyncDefaultContact()))
        {
            syncDefaultContact(customer);
        }
        if (Boolean.TRUE.equals(customer.getSyncDefaultAddress()) && StringUtils.isNotEmpty(customer.getAddress()))
        {
            syncDefaultAddress(customer);
        }
    }

    private boolean shouldCreateDefaultContact(Customer customer)
    {
        return (StringUtils.isNotEmpty(customer.getContactName()) || StringUtils.isNotEmpty(customer.getContactPhone()))
            && !hasMeaningfulContact(customer.getContacts());
    }

    private boolean shouldCreateDefaultAddress(Customer customer)
    {
        return StringUtils.isNotEmpty(customer.getAddress()) && !hasMeaningfulAddress(customer.getAddresses());
    }

    private void syncDefaultContact(Customer customer)
    {
        List<CustomerContact> contacts = ensureContacts(customer);
        CustomerContact defaultContact = findDefaultContact(contacts);
        if (defaultContact == null)
        {
            contacts.add(buildDefaultContact(customer));
            return;
        }
        applyDefaultContact(defaultContact, customer);
    }

    private void syncDefaultAddress(Customer customer)
    {
        List<CustomerAddress> addresses = ensureAddresses(customer);
        CustomerAddress defaultAddress = findDefaultAddress(addresses);
        if (defaultAddress == null)
        {
            addresses.add(buildDefaultAddress(customer, null));
            return;
        }
        String logisticsLine = defaultAddress.getLogisticsLine();
        applyDefaultAddress(defaultAddress, customer);
        defaultAddress.setLogisticsLine(logisticsLine);
    }

    private List<CustomerContact> ensureContacts(Customer customer)
    {
        if (customer.getContacts() == null)
        {
            customer.setContacts(new ArrayList<>());
        }
        return customer.getContacts();
    }

    private List<CustomerAddress> ensureAddresses(Customer customer)
    {
        if (customer.getAddresses() == null)
        {
            customer.setAddresses(new ArrayList<>());
        }
        return customer.getAddresses();
    }

    private CustomerContact buildDefaultContact(Customer customer)
    {
        CustomerContact contact = new CustomerContact();
        applyDefaultContact(contact, customer);
        return contact;
    }

    private void applyDefaultContact(CustomerContact contact, Customer customer)
    {
        contact.setContactName(defaultIfEmpty(customer.getContactName(), "默认联系人"));
        contact.setPhone(customer.getContactPhone());
        contact.setWechat(customer.getWechat());
        contact.setPosition("主联系人");
        if (StringUtils.isEmpty(contact.getContactRole()))
        {
            contact.setContactRole("其他");
        }
        contact.setIsDefault(YES);
    }

    private CustomerAddress buildDefaultAddress(Customer customer, String logisticsLine)
    {
        CustomerAddress address = new CustomerAddress();
        applyDefaultAddress(address, customer);
        address.setLogisticsLine(logisticsLine);
        return address;
    }

    private void applyDefaultAddress(CustomerAddress address, Customer customer)
    {
        address.setReceiverName(defaultIfEmpty(customer.getContactName(), "默认联系人"));
        address.setReceiverPhone(customer.getContactPhone());
        address.setProvince(customer.getProvince());
        address.setProvinceCode(customer.getProvinceCode());
        address.setCity(customer.getCity());
        address.setCityCode(customer.getCityCode());
        address.setDistrict(customer.getDistrict());
        address.setDistrictCode(customer.getDistrictCode());
        address.setDetailAddress(customer.getAddress());
        address.setIsDefault(YES);
    }

    private boolean hasMeaningfulContact(List<CustomerContact> contacts)
    {
        if (contacts == null)
        {
            return false;
        }
        return contacts.stream().anyMatch(this::isMeaningfulContact);
    }

    private boolean hasMeaningfulAddress(List<CustomerAddress> addresses)
    {
        if (addresses == null)
        {
            return false;
        }
        return addresses.stream().anyMatch(this::isMeaningfulAddress);
    }

    private boolean isMeaningfulContact(CustomerContact contact)
    {
        return contact != null && (StringUtils.isNotEmpty(contact.getContactName()) || StringUtils.isNotEmpty(contact.getPhone()));
    }

    private boolean isMeaningfulAddress(CustomerAddress address)
    {
        return address != null && (StringUtils.isNotEmpty(address.getReceiverName()) || StringUtils.isNotEmpty(address.getDetailAddress()));
    }

    private CustomerContact findDefaultContact(List<CustomerContact> contacts)
    {
        if (contacts == null)
        {
            return null;
        }
        return contacts.stream().filter(contact -> YES.equals(contact.getIsDefault())).findFirst().orElse(null);
    }

    private CustomerAddress findDefaultAddress(List<CustomerAddress> addresses)
    {
        if (addresses == null)
        {
            return null;
        }
        return addresses.stream().filter(address -> YES.equals(address.getIsDefault())).findFirst().orElse(null);
    }

    private void normalizeDefaultContact(List<CustomerContact> contacts)
    {
        if (contacts == null || contacts.isEmpty())
        {
            return;
        }
        boolean found = false;
        CustomerContact firstMeaningful = null;
        for (CustomerContact contact : contacts)
        {
            if (!isMeaningfulContact(contact))
            {
                contact.setIsDefault(NO);
                continue;
            }
            if (firstMeaningful == null)
            {
                firstMeaningful = contact;
            }
            if (!found && YES.equals(contact.getIsDefault()))
            {
                found = true;
            }
            else
            {
                contact.setIsDefault(NO);
            }
        }
        if (!found && firstMeaningful != null)
        {
            firstMeaningful.setIsDefault(YES);
        }
    }

    private void normalizeDefaultAddress(List<CustomerAddress> addresses)
    {
        if (addresses == null || addresses.isEmpty())
        {
            return;
        }
        boolean found = false;
        CustomerAddress firstMeaningful = null;
        for (CustomerAddress address : addresses)
        {
            if (!isMeaningfulAddress(address))
            {
                address.setIsDefault(NO);
                continue;
            }
            if (firstMeaningful == null)
            {
                firstMeaningful = address;
            }
            if (!found && YES.equals(address.getIsDefault()))
            {
                found = true;
            }
            else
            {
                address.setIsDefault(NO);
            }
        }
        if (!found && firstMeaningful != null)
        {
            firstMeaningful.setIsDefault(YES);
        }
    }

    private void fillOwnerSnapshot(Customer customer)
    {
        if (customer.getOwnerUserId() == null)
        {
            return;
        }
        SysUser user = sysUserMapper.selectUserById(customer.getOwnerUserId());
        if (user == null)
        {
            throw new ServiceException("归属业务员不存在");
        }
        customer.setOwnerUserName(defaultIfEmpty(user.getNickName(), user.getUserName()));
        customer.setOwnerDeptId(user.getDeptId());
        SysDept dept = user.getDept();
        if (dept == null && user.getDeptId() != null)
        {
            dept = sysDeptMapper.selectDeptById(user.getDeptId());
        }
        customer.setOwnerDeptName(dept == null ? null : dept.getDeptName());
    }

    private Customer buildOwnerTransferTarget(Customer current, CustomerOwnerTransfer transfer)
    {
        Customer next = new Customer();
        next.setOwnerEffectiveTime(transfer.getEffectiveTime() == null ? new Date() : transfer.getEffectiveTime());
        String transferMode = transfer.getTransferMode();
        if (TRANSFER_ASSIGN_MAINTENANCE.equals(transferMode))
        {
            next.setOwnerType(OWNER_SALESMAN);
            next.setOwnerSource(SOURCE_FACTORY_ASSIGNED);
            next.setOwnerProfitMode(PROFIT_MAINTENANCE_FEE);
            next.setOwnerUserId(transfer.getNewOwnerUserId());
        }
        else if (TRANSFER_MARK_SALESMAN_SELF.equals(transferMode))
        {
            next.setOwnerType(OWNER_SALESMAN);
            next.setOwnerSource(SOURCE_SALESMAN_SELF);
            next.setOwnerProfitMode(PROFIT_SALES_COMMISSION);
            next.setOwnerUserId(transfer.getNewOwnerUserId());
        }
        else if (TRANSFER_RETURN_FACTORY.equals(transferMode))
        {
            next.setOwnerType(OWNER_FACTORY);
            next.setOwnerSource(SOURCE_FACTORY_POOL);
            next.setOwnerProfitMode(PROFIT_NONE);
            clearOwnerSnapshot(next);
        }
        else if (TRANSFER_CHANGE_SALESMAN.equals(transferMode))
        {
            next.setOwnerType(OWNER_SALESMAN);
            next.setOwnerSource(defaultIfEmpty(transfer.getNewOwnerSource(), current.getOwnerSource()));
            next.setOwnerProfitMode(defaultIfEmpty(transfer.getNewOwnerProfitMode(), current.getOwnerProfitMode()));
            next.setOwnerUserId(transfer.getNewOwnerUserId());
        }
        else
        {
            throw new ServiceException("归属变更方式不能为空");
        }
        validateOwnerStateForReal(next);
        return next;
    }

    private void clearOwnerSnapshot(Customer customer)
    {
        customer.setOwnerUserId(null);
        customer.setOwnerUserName(null);
        customer.setOwnerDeptId(null);
        customer.setOwnerDeptName(null);
    }

    private Customer requiredCustomer(Long customerId)
    {
        Customer customer = customerMapper.selectCustomerById(customerId);
        if (customer == null)
        {
            throw new ServiceException("客户不存在或已删除");
        }
        return customer;
    }

    private CustomerFundFlow flowQuery(Long customerId)
    {
        CustomerFundFlow flow = new CustomerFundFlow();
        flow.setCustomerId(customerId);
        return flow;
    }

    private String nextCustomerCode()
    {
        String monthPrefix = CUSTOMER_CODE_PREFIX + LocalDateTime.now().format(CUSTOMER_CODE_MONTH_FORMATTER);
        String maxCode = customerMapper.selectMaxCustomerCodeByMonth(monthPrefix);
        BigInteger next = BigInteger.ONE;
        if (!StringUtils.isEmpty(maxCode) && maxCode.length() > monthPrefix.length())
        {
            next = new BigInteger(maxCode.substring(monthPrefix.length())).add(BigInteger.ONE);
        }
        String sequence = next.toString();
        if (sequence.length() < CUSTOMER_CODE_MIN_SEQUENCE_WIDTH)
        {
            sequence = "0".repeat(CUSTOMER_CODE_MIN_SEQUENCE_WIDTH - sequence.length()) + sequence;
        }
        return monthPrefix + sequence;
    }

    private void normalizeCustomerForSave(Customer customer)
    {
        if (customer == null)
        {
            return;
        }
        if (StringUtils.isEmpty(customer.getCustomerNature()))
        {
            customer.setCustomerNature(REAL);
        }
        if (!REAL.equals(customer.getCustomerNature()) && !PUBLIC.equals(customer.getCustomerNature()))
        {
            throw new ServiceException("客户性质不合法");
        }
        if (isPublicCustomer(customer))
        {
            normalizePublicCustomerForSave(customer);
            return;
        }
        normalizeRealContactFields(customer);
        validateCustomerRequiredForSave(customer);
        customer.setPublicChannel(null);
        normalizeOwnerForReal(customer);
        validateRealCustomerRequired(customer);
    }

    private void normalizePublicCustomerForSave(Customer customer)
    {
        validatePublicChannel(customer.getPublicChannel());
        assertUniquePublicChannel(customer);
        customer.setCustomerType("OTHER");
        customer.setCustomerLevel("NORMAL");
        customer.setOwnerType(OWNER_NONE);
        customer.setOwnerSource(SOURCE_NONE);
        customer.setOwnerProfitMode(PROFIT_NONE);
        customer.setOwnerEffectiveTime(null);
        customer.setContactName(null);
        customer.setContactPhone(null);
        customer.setWechat(null);
        customer.setProvince(null);
        customer.setProvinceCode(null);
        customer.setCity(null);
        customer.setCityCode(null);
        customer.setDistrict(null);
        customer.setDistrictCode(null);
        customer.setAddress(null);
        clearOwnerSnapshot(customer);
        customer.setSyncDefaultContact(false);
        customer.setSyncDefaultAddress(false);
        customer.setContacts(Collections.emptyList());
        customer.setAddresses(Collections.emptyList());
    }

    private void normalizeOwnerForReal(Customer customer)
    {
        if (StringUtils.isEmpty(customer.getOwnerType()))
        {
            customer.setOwnerType(OWNER_FACTORY);
        }
        if (OWNER_NONE.equals(customer.getOwnerType()))
        {
            throw new ServiceException("真实客户不能使用无固定归属");
        }
        if (customer.getOwnerEffectiveTime() == null)
        {
            customer.setOwnerEffectiveTime(new Date());
        }
        validateOwnerStateForReal(customer);
    }

    private void validateOwnerStateForReal(Customer customer)
    {
        if (OWNER_FACTORY.equals(customer.getOwnerType()))
        {
            customer.setOwnerSource(SOURCE_FACTORY_POOL);
            customer.setOwnerProfitMode(PROFIT_NONE);
            clearOwnerSnapshot(customer);
            return;
        }
        if (!OWNER_SALESMAN.equals(customer.getOwnerType()))
        {
            throw new ServiceException("归属方式不合法");
        }
        if (customer.getOwnerUserId() == null)
        {
            throw new ServiceException("归属业务员不能为空");
        }
        if (StringUtils.isEmpty(customer.getOwnerSource()))
        {
            throw new ServiceException("归属来源不能为空");
        }
        if (SOURCE_FACTORY_ASSIGNED.equals(customer.getOwnerSource()))
        {
            assertOwnerProfitMode(customer, PROFIT_MAINTENANCE_FEE, "厂内分配维护必须使用维护费口径");
            return;
        }
        if (SOURCE_SALESMAN_SELF.equals(customer.getOwnerSource()))
        {
            assertOwnerProfitMode(customer, PROFIT_SALES_COMMISSION, "业务员自有客户必须使用业务提成口径");
            return;
        }
        throw new ServiceException("归属来源不合法");
    }

    private void assertOwnerProfitMode(Customer customer, String expectedProfitMode, String message)
    {
        if (StringUtils.isEmpty(customer.getOwnerProfitMode()))
        {
            customer.setOwnerProfitMode(expectedProfitMode);
            return;
        }
        if (!expectedProfitMode.equals(customer.getOwnerProfitMode()))
        {
            throw new ServiceException(message);
        }
    }

    private void validateCustomerRequiredForSave(Customer customer)
    {
        assertRequired(customer.getCustomerType(), "客户类型不能为空");
        assertRequired(customer.getCustomerLevel(), "客户等级不能为空");
    }

    private void validateRealCustomerRequired(Customer customer)
    {
        assertRequired(customer.getContactName(), "主联系人不能为空");
        assertRequired(customer.getContactPhone(), "联系电话不能为空");
        assertMobilePhone(customer.getContactPhone(), "联系电话必须为11位手机号");
        if (StringUtils.isEmpty(customer.getProvince()) || StringUtils.isEmpty(customer.getCity()) || StringUtils.isEmpty(customer.getDistrict()))
        {
            throw new ServiceException("省市区不能为空");
        }
        assertRequired(customer.getAddress(), "详细地址不能为空");
        validateChildMobilePhones(customer);
    }

    private void assertRequired(String value, String message)
    {
        if (StringUtils.isEmpty(value))
        {
            throw new ServiceException(message);
        }
    }

    private void assertMobilePhone(String value, String message)
    {
        if (!MOBILE_PHONE_PATTERN.matcher(value).matches())
        {
            throw new ServiceException(message);
        }
    }

    private void validateChildMobilePhones(Customer customer)
    {
        List<CustomerContact> contacts = customer.getContacts();
        if (contacts != null)
        {
            for (int i = 0; i < contacts.size(); i++)
            {
                String phone = contacts.get(i).getPhone();
                if (StringUtils.isNotEmpty(phone) && !MOBILE_PHONE_PATTERN.matcher(phone).matches())
                {
                    throw new ServiceException("第" + (i + 1) + "个联系人电话必须为11位手机号");
                }
            }
        }
        List<CustomerAddress> addresses = customer.getAddresses();
        if (addresses != null)
        {
            for (int i = 0; i < addresses.size(); i++)
            {
                String receiverPhone = addresses.get(i).getReceiverPhone();
                if (StringUtils.isNotEmpty(receiverPhone) && !MOBILE_PHONE_PATTERN.matcher(receiverPhone).matches())
                {
                    throw new ServiceException("第" + (i + 1) + "条收货地址联系电话必须为11位手机号");
                }
            }
        }
    }

    private void validatePublicChannel(String publicChannel)
    {
        if (StringUtils.isEmpty(publicChannel))
        {
            throw new ServiceException("公共渠道不能为空");
        }
        if (!DIRECT_SALE.equals(publicChannel) && !SELF_MEDIA.equals(publicChannel))
        {
            throw new ServiceException("公共客户渠道不合法");
        }
    }

    private void assertUniquePublicChannel(Customer customer)
    {
        int count = customerMapper.countActivePublicCustomerByChannel(customer.getCustomerId(), customer.getPublicChannel());
        if (count > 0)
        {
            throw new ServiceException("公共客户渠道已存在，不允许重复创建内置公共客户。");
        }
        assertBuiltinPublicCustomerIdentity(customer);
    }

    private void assertBuiltinPublicCustomerIdentity(Customer customer)
    {
        if (customer == null)
        {
            return;
        }
        if (DIRECT_SALE.equals(customer.getPublicChannel()))
        {
            assertBuiltinPublicValue(customer.getCustomerCode(), PUBLIC_DIRECT_SALE_CODE, "厂内自销公共客户编码必须为PUB_DIRECT_SALE");
            assertBuiltinPublicValue(customer.getCustomerName(), "厂内自销客户", "厂内自销公共客户名称必须为厂内自销客户");
            return;
        }
        if (SELF_MEDIA.equals(customer.getPublicChannel()))
        {
            assertBuiltinPublicValue(customer.getCustomerCode(), PUBLIC_SELF_MEDIA_CODE, "自媒体公共客户编码必须为PUB_SELF_MEDIA");
            assertBuiltinPublicValue(customer.getCustomerName(), "自媒体客户", "自媒体公共客户名称必须为自媒体客户");
        }
    }

    private void assertBuiltinPublicValue(String actual, String expected, String message)
    {
        if (!expected.equals(trimToNull(actual)))
        {
            throw new ServiceException(message);
        }
    }

    private boolean isPublicCustomer(Customer customer)
    {
        return customer != null && PUBLIC.equals(customer.getCustomerNature());
    }

    private boolean isBuiltinPublicCustomer(Customer customer)
    {
        return isPublicCustomer(customer) || (customer != null && isReservedPublicCode(customer.getCustomerCode()));
    }

    private boolean isReservedPublicCode(String customerCode)
    {
        return PUBLIC_DIRECT_SALE_CODE.equals(customerCode) || PUBLIC_SELF_MEDIA_CODE.equals(customerCode);
    }

    private void assertNotReservedPublicCode(Customer customer)
    {
        if (customer != null && isReservedPublicCode(customer.getCustomerCode()))
        {
            throw new ServiceException("内置公共客户编码不允许用于普通客户。");
        }
    }

    private void assertRealCustomerFeature(Long customerId, String message)
    {
        Customer customer = requiredCustomer(customerId);
        if (isPublicCustomer(customer))
        {
            throw new ServiceException(message);
        }
    }

    private void fillDefaultShortName(Customer customer)
    {
        if (customer != null && StringUtils.isEmpty(customer.getShortName()))
        {
            customer.setShortName(customer.getCustomerName());
        }
    }

    private String duplicateMessage(boolean nameDuplicate, boolean phoneDuplicate)
    {
        if (nameDuplicate && phoneDuplicate)
        {
            return "客户名称和联系电话都已存在，请重点核对是否重复建档";
        }
        if (nameDuplicate)
        {
            return "客户名称已存在，请确认是否重复建档";
        }
        if (phoneDuplicate)
        {
            return "联系电话已存在，请确认是否重复建档";
        }
        return "";
    }

    private String defaultIfEmpty(String value, String fallback)
    {
        return StringUtils.isEmpty(value) ? fallback : value;
    }

    private void normalizeRealContactFields(Customer customer)
    {
        customer.setContactPhone(trimToNull(customer.getContactPhone()));
        if (customer.getContacts() != null)
        {
            for (CustomerContact contact : customer.getContacts())
            {
                contact.setPhone(trimToNull(contact.getPhone()));
            }
        }
        if (customer.getAddresses() != null)
        {
            for (CustomerAddress address : customer.getAddresses())
            {
                address.setReceiverPhone(trimToNull(address.getReceiverPhone()));
            }
        }
    }

    private String trimToNull(String value)
    {
        if (value == null)
        {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private boolean hasSalesRole(SysUser user)
    {
        List<SysRole> roles = sysRoleService.selectRolesByUserId(user.getUserId());
        return roles.stream().anyMatch(role -> {
            String key = role.getRoleKey();
            String name = role.getRoleName();
            return "sales".equals(key) || "salesman".equals(key) || "business".equals(key)
                || (name != null && (name.contains("销售") || name.contains("业务员")));
        });
    }

    private BigDecimal money(BigDecimal amount)
    {
        return amount == null ? ZERO : amount.setScale(2, RoundingMode.HALF_UP);
    }

    private void fillSampleRebateAmounts(SampleRebateRecord record)
    {
        BigDecimal sampleAmount = money(record.getSampleAmount());
        BigDecimal totalRate = record.getTotalSupportRate() == null ? BigDecimal.ZERO : record.getTotalSupportRate();
        BigDecimal instantRate = record.getInstantDiscountRate() == null ? BigDecimal.ONE : record.getInstantDiscountRate();
        BigDecimal supportAmount = sampleAmount.multiply(totalRate).setScale(2, RoundingMode.HALF_UP);
        BigDecimal instantDiscount = record.getInstantDiscountAmount();
        if (instantDiscount == null)
        {
            instantDiscount = sampleAmount.multiply(BigDecimal.ONE.subtract(instantRate)).setScale(2, RoundingMode.HALF_UP);
        }
        BigDecimal rebate = supportAmount.subtract(instantDiscount).max(BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP);
        record.setInstantDiscountAmount(instantDiscount);
        record.setRebateAmount(rebate);
    }

    private SampleRebateRecord replaySampleRebate(IdempotentRequest request)
    {
        if (!RESULT_SAMPLE_REBATE_RECORD.equals(request.getResultRefType()) || request.getResultRefId() == null)
        {
            throw new ServiceException("幂等请求结果不存在，请联系管理员");
        }
        SampleRebateRecord record = customerMapper.selectSampleRebateRecordById(request.getResultRefId());
        if (record == null)
        {
            throw new ServiceException("幂等请求结果不存在，请联系管理员");
        }
        return record;
    }

    private String sampleRebateRequestHash(SampleRebateRecord record, Long operatorId, String operatorName)
    {
        String canonical = String.join("\n",
            "biz_type=" + BIZ_CUSTOMER_SAMPLE_REBATE,
            "customer_id=" + record.getCustomerId(),
            "account_type=" + SAMPLE_REBATE,
            "flow_type=" + SAMPLE_REBATE_GENERATE,
            "amount=" + IdempotencyRequestHash.money(record.getSampleAmount()),
            "receipt_no=",
            "sample_order_no=" + IdempotencyRequestHash.text(record.getSampleOrderNo()),
            "support_mode=" + IdempotencyRequestHash.text(record.getSupportMode()),
            "total_support_rate=" + IdempotencyRequestHash.rate(record.getTotalSupportRate(), BigDecimal.ZERO),
            "instant_discount_rate=" + IdempotencyRequestHash.rate(record.getInstantDiscountRate(), BigDecimal.ONE),
            "operator_scope=" + IdempotencyRequestHash.operatorScope(operatorId, operatorName)
        );
        return IdempotencyRequestHash.sha256(canonical);
    }
}
