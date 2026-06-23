package com.ruoyi.business.customer.service.impl;

import java.math.BigDecimal;
import java.math.BigInteger;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
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
    private static final BigDecimal ZERO = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
    private static final String CUSTOMER_CODE_PREFIX = "KH";
    private static final int CUSTOMER_CODE_MIN_SEQUENCE_WIDTH = 6;
    private static final int CUSTOMER_CODE_MAX_RETRY = 8;
    private static final DateTimeFormatter CUSTOMER_CODE_MONTH_FORMATTER = DateTimeFormatter.ofPattern("yyyyMM");

    @Autowired
    private CustomerMapper customerMapper;

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
            customer.setContacts(customerMapper.selectContactsByCustomerId(customerId));
            customer.setAddresses(customerMapper.selectAddressesByCustomerId(customerId));
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
        initFundAccounts(customer.getCustomerId(), customer.getCreateBy());
        return rows;
    }

    @Override
    @Transactional
    public int updateCustomer(Customer customer)
    {
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
        return customerMapper.updateCustomerStatus(customer);
    }

    @Override
    public int deleteCustomerByIds(Long[] customerIds)
    {
        return customerMapper.deleteCustomerByIds(customerIds);
    }

    @Override
    public Map<String, Object> checkDuplicate(Long customerId, String customerName, String contactPhone)
    {
        int nameCount = StringUtils.isEmpty(customerName) ? 0 : customerMapper.countCustomerByName(customerId, customerName);
        int phoneCount = StringUtils.isEmpty(contactPhone) ? 0 : customerMapper.countCustomerByPhone(customerId, contactPhone);
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
        return salesmen.isEmpty() ? users : salesmen;
    }

    @Override
    @Transactional
    public int transferOwner(CustomerOwnerTransfer transfer, Long operatorId, String operatorName)
    {
        Customer current = requiredCustomer(transfer.getCustomerId());
        Customer next = new Customer();
        next.setCustomerId(transfer.getCustomerId());
        next.setOwnerUserId(transfer.getNewOwnerUserId());
        next.setUpdateBy(operatorName);
        fillOwnerSnapshot(next);
        int rows = customerMapper.updateCustomer(next);

        CustomerSalesmanBindLog log = new CustomerSalesmanBindLog();
        log.setCustomerId(current.getCustomerId());
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
        initFundAccounts(customerId, null);
        return customerMapper.selectFundAccountsByCustomerId(customerId);
    }

    @Override
    @Transactional
    public CustomerFundFlow recordFundEntry(Long customerId, CustomerFundEntry entry, Long operatorId, String operatorName)
    {
        requiredCustomer(customerId);
        BigDecimal amount = normalizeAmount(entry.getAmount());
        if (amount.compareTo(BigDecimal.ZERO) <= 0)
        {
            throw new ServiceException("资金录入金额必须大于0");
        }

        String accountType = normalizeAccountType(entry.getAccountType());
        CustomerFundAccount account = ensureFundAccount(customerId, accountType, operatorName);
        BigDecimal beforeBalance = money(account.getBalanceAmount());
        BigDecimal afterBalance = beforeBalance.add(amount);
        BigDecimal frozen = money(account.getFrozenAmount());
        BigDecimal available = money(account.getAvailableAmount());
        if ("SAMPLE_REBATE".equals(accountType))
        {
            available = available.add(amount);
        }
        else
        {
            frozen = frozen.add(amount);
        }
        customerMapper.updateFundAccountBalance(account.getAccountId(), afterBalance, available, frozen);

        CustomerFundFlow flow = new CustomerFundFlow();
        flow.setCustomerId(customerId);
        flow.setAccountType(accountType);
        flow.setFlowNo(nextNo("FLOW"));
        flow.setFlowType(resolveFlowType(accountType, entry.getFlowType()));
        flow.setAmount(amount);
        flow.setBeforeBalance(beforeBalance);
        flow.setAfterBalance(afterBalance);
        flow.setRelatedBizType(defaultIfEmpty(entry.getRelatedBizType(), "CUSTOMER"));
        flow.setRelatedBizId(entry.getRelatedBizId());
        flow.setRelatedBizNo(entry.getRelatedBizNo());
        flow.setOperatorId(operatorId);
        flow.setOccurTime(new Date());
        flow.setRemark(entry.getRemark());
        flow.setCreateBy(operatorName);

        if (!"SAMPLE_REBATE".equals(accountType))
        {
            CustomerDepositBatch batch = new CustomerDepositBatch();
            batch.setDepositBatchNo(nextNo("DEP"));
            batch.setCustomerId(customerId);
            batch.setDepositType(resolveDepositType(accountType, entry.getDepositType()));
            batch.setSourceOrderId(entry.getSourceOrderId());
            batch.setSourceOrderNo(entry.getSourceOrderNo());
            batch.setDepositAmount(amount);
            batch.setUsedAmount(ZERO);
            batch.setRemainingAmount(amount);
            batch.setStatus("LOCKED");
            batch.setStartTime(new Date());
            batch.setRemark(entry.getRemark());
            batch.setCreateBy(operatorName);
            customerMapper.insertDepositBatch(batch);
            flow.setRelatedBizType("CUSTOMER_DEPOSIT_BATCH");
            flow.setRelatedBizId(batch.getDepositBatchId());
            flow.setRelatedBizNo(batch.getDepositBatchNo());
        }
        customerMapper.insertFundFlow(flow);
        return flow;
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
        requiredCustomer(policy.getCustomerId());
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
        requiredCustomer(record.getCustomerId());
        fillSampleRebateAmounts(record);
        record.setUsedAmount(ZERO);
        record.setRemainingAmount(money(record.getRebateAmount()));
        record.setStatus("AVAILABLE");
        record.setCreateBy(operatorName);
        customerMapper.insertSampleRebateRecord(record);

        CustomerFundEntry entry = new CustomerFundEntry();
        entry.setAccountType("SAMPLE_REBATE");
        entry.setFlowType("SAMPLE_REBATE_GENERATE");
        entry.setAmount(record.getRebateAmount());
        entry.setRelatedBizType("SAMPLE_REBATE");
        entry.setRelatedBizId(record.getRebateRecordId());
        entry.setRelatedBizNo(record.getSampleOrderNo());
        entry.setRemark(record.getRemark());
        recordFundEntry(record.getCustomerId(), entry, operatorId, operatorName);
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

    private void initFundAccounts(Long customerId, String operator)
    {
        if (customerId == null)
        {
            return;
        }
        ensureFundAccount(customerId, "LONG_TERM_DEPOSIT", operator);
        ensureFundAccount(customerId, "ROLLING_ORDER_DEPOSIT", operator);
        ensureFundAccount(customerId, "SAMPLE_REBATE", operator);
    }

    private CustomerFundAccount ensureFundAccount(Long customerId, String accountType, String operator)
    {
        CustomerFundAccount account = customerMapper.selectFundAccount(customerId, accountType);
        if (account != null)
        {
            return account;
        }
        account = new CustomerFundAccount();
        account.setCustomerId(customerId);
        account.setAccountType(accountType);
        account.setBalanceAmount(ZERO);
        account.setFrozenAmount(ZERO);
        account.setAvailableAmount(ZERO);
        account.setStatus(NORMAL);
        account.setCreateBy(operator);
        customerMapper.insertFundAccount(account);
        return customerMapper.selectFundAccount(customerId, accountType);
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

    private String nextNo(String prefix)
    {
        return prefix + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmssSSS"));
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

    private BigDecimal normalizeAmount(BigDecimal amount)
    {
        return amount == null ? ZERO : amount.setScale(2, RoundingMode.HALF_UP);
    }

    private BigDecimal money(BigDecimal amount)
    {
        return amount == null ? ZERO : amount.setScale(2, RoundingMode.HALF_UP);
    }

    private String normalizeAccountType(String accountType)
    {
        if ("LONG_TERM_DEPOSIT".equals(accountType) || "ROLLING_ORDER_DEPOSIT".equals(accountType) || "SAMPLE_REBATE".equals(accountType))
        {
            return accountType;
        }
        throw new ServiceException("资金账户类型不合法");
    }

    private String resolveFlowType(String accountType, String flowType)
    {
        if (StringUtils.isNotEmpty(flowType))
        {
            return flowType;
        }
        if ("LONG_TERM_DEPOSIT".equals(accountType))
        {
            return "LONG_TERM_DEPOSIT_IN";
        }
        if ("ROLLING_ORDER_DEPOSIT".equals(accountType))
        {
            return "ROLLING_ORDER_DEPOSIT_IN";
        }
        return "SAMPLE_REBATE_GENERATE";
    }

    private String resolveDepositType(String accountType, String depositType)
    {
        if (StringUtils.isNotEmpty(depositType))
        {
            return depositType;
        }
        return "LONG_TERM_DEPOSIT".equals(accountType) ? "LONG_TERM" : "ROLLING_ORDER";
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
}
