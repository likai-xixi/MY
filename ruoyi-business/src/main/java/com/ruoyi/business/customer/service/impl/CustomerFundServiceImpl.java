package com.ruoyi.business.customer.service.impl;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Collections;
import java.util.Date;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.ruoyi.business.customer.domain.Customer;
import com.ruoyi.business.customer.domain.CustomerDepositBatch;
import com.ruoyi.business.customer.domain.CustomerFundAccount;
import com.ruoyi.business.customer.domain.CustomerFundEntry;
import com.ruoyi.business.customer.domain.CustomerFundFlow;
import com.ruoyi.business.customer.domain.SampleRebateRecord;
import com.ruoyi.business.customer.mapper.CustomerMapper;
import com.ruoyi.business.customer.service.ICustomerFundService;
import com.ruoyi.common.exception.ServiceException;
import com.ruoyi.common.utils.StringUtils;

/**
 * 客户资金服务实现.
 */
@Service
public class CustomerFundServiceImpl implements ICustomerFundService
{
    private static final String NORMAL = "0";
    private static final String PUBLIC = "PUBLIC";
    private static final String CUSTOMER_DEPOSIT = "CUSTOMER_DEPOSIT";
    private static final String SAMPLE_REBATE = "SAMPLE_REBATE";
    private static final String SAMPLE_REBATE_GENERATE = "SAMPLE_REBATE_GENERATE";
    private static final String DEPOSIT_IN = "DEPOSIT_IN";
    private static final String DEPOSIT_DEDUCT = "DEPOSIT_DEDUCT";
    private static final String DEPOSIT_REFUND = "DEPOSIT_REFUND";
    private static final String DEPOSIT_ADJUST = "DEPOSIT_ADJUST";
    private static final String DEPOSIT_REVERSE = "DEPOSIT_REVERSE";
    private static final String DEPOSIT_ACCOUNT_ONLY_MESSAGE = "定金录入接口只允许写入CUSTOMER_DEPOSIT账户，样品返现请通过样品返现入口处理。";
    private static final String DEPOSIT_IN_ONLY_MESSAGE = "定金录入接口只允许入金，扣减、退款、调整、冲正请走独立资金处理流程。";
    private static final BigDecimal ZERO = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
    private static final int UNIQUE_NO_MAX_RETRY = 8;
    private static final DateTimeFormatter NO_FORMATTER = DateTimeFormatter.ofPattern("yyyyMMddHHmmssSSS");
    private static final AtomicInteger NO_SEQUENCE = new AtomicInteger();

    @Autowired
    private CustomerMapper customerMapper;

    @Override
    @Transactional
    public void initFundAccounts(Customer customer, String operator)
    {
        if (customer == null || customer.getCustomerId() == null || isPublicCustomer(customer))
        {
            return;
        }
        ensureFundAccountExists(customer.getCustomerId(), CUSTOMER_DEPOSIT, operator);
        ensureFundAccountExists(customer.getCustomerId(), SAMPLE_REBATE, operator);
    }

    @Override
    @Transactional
    public List<CustomerFundAccount> selectFundAccounts(Long customerId)
    {
        Customer customer = requiredCustomer(customerId);
        if (isPublicCustomer(customer))
        {
            return Collections.emptyList();
        }
        initFundAccounts(customer, null);
        return customerMapper.selectFundAccountsByCustomerId(customerId);
    }

    @Override
    @Transactional
    public CustomerFundFlow recordCustomerDeposit(Long customerId, CustomerFundEntry entry, Long operatorId, String operatorName)
    {
        if (entry == null)
        {
            entry = new CustomerFundEntry();
        }
        validateCustomerDepositAccountType(entry.getAccountType());
        entry.setAccountType(CUSTOMER_DEPOSIT);
        return recordFundEntryInternal(customerId, entry, operatorId, operatorName);
    }

    @Override
    @Transactional
    public CustomerFundFlow recordFundEntry(Long customerId, CustomerFundEntry entry, Long operatorId, String operatorName)
    {
        return recordFundEntryInternal(customerId, entry, operatorId, operatorName);
    }

    @Override
    @Transactional
    public CustomerFundFlow recordSampleRebateFlow(SampleRebateRecord record, Long operatorId, String operatorName)
    {
        if (record == null || record.getCustomerId() == null)
        {
            throw new ServiceException("样品返现记录不能为空");
        }
        CustomerFundEntry entry = new CustomerFundEntry();
        entry.setAccountType(SAMPLE_REBATE);
        entry.setFlowType(SAMPLE_REBATE_GENERATE);
        entry.setAmount(record.getRebateAmount());
        entry.setRelatedBizType(SAMPLE_REBATE);
        entry.setRelatedBizId(record.getRebateRecordId());
        entry.setRelatedBizNo(record.getSampleOrderNo());
        entry.setRemark(record.getRemark());
        return recordFundEntryInternal(record.getCustomerId(), entry, operatorId, operatorName);
    }

    private CustomerFundFlow recordFundEntryInternal(Long customerId, CustomerFundEntry entry, Long operatorId, String operatorName)
    {
        Customer customer = requiredCustomer(customerId);
        if (isPublicCustomer(customer))
        {
            throw new ServiceException("公共客户不启用客户级定金，请在销售订单中记录本单定金。");
        }
        if (entry == null)
        {
            entry = new CustomerFundEntry();
        }
        BigDecimal amount = normalizeAmount(entry.getAmount());
        if (amount.compareTo(BigDecimal.ZERO) <= 0)
        {
            throw new ServiceException("资金录入金额必须大于0");
        }

        String accountType = normalizeAccountType(entry.getAccountType());
        CustomerFundAccount account = ensureFundAccountForUpdate(customerId, accountType, operatorName);
        BigDecimal beforeBalance = money(account.getBalanceAmount());
        BigDecimal afterBalance = beforeBalance.add(amount);
        BigDecimal frozen = money(account.getFrozenAmount());
        BigDecimal available = money(account.getAvailableAmount());
        if (SAMPLE_REBATE.equals(accountType))
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

        if (!SAMPLE_REBATE.equals(accountType))
        {
            CustomerDepositBatch batch = new CustomerDepositBatch();
            batch.setCustomerId(customerId);
            batch.setDepositType(resolveDepositType(accountType, entry.getDepositType()));
            batch.setReceiptNo(entry.getReceiptNo());
            batch.setDepositAmount(amount);
            batch.setUsedAmount(ZERO);
            batch.setRemainingAmount(amount);
            batch.setStatus("LOCKED");
            batch.setStartTime(new Date());
            batch.setRemark(entry.getRemark());
            batch.setCreateBy(operatorName);
            insertDepositBatchWithRetry(batch);
            flow.setRelatedBizType("CUSTOMER_DEPOSIT_BATCH");
            flow.setRelatedBizId(batch.getDepositBatchId());
            flow.setRelatedBizNo(batch.getDepositBatchNo());
        }
        insertFundFlowWithRetry(flow);
        return flow;
    }

    private CustomerFundAccount ensureFundAccountForUpdate(Long customerId, String accountType, String operator)
    {
        CustomerFundAccount account = customerMapper.selectFundAccountForUpdate(customerId, accountType);
        if (account != null)
        {
            return account;
        }
        try
        {
            customerMapper.insertFundAccount(newFundAccount(customerId, accountType, operator));
        }
        catch (DuplicateKeyException e)
        {
            // Another transaction created the account; the locked re-read below is the synchronization point.
        }
        account = customerMapper.selectFundAccountForUpdate(customerId, accountType);
        if (account == null)
        {
            throw new ServiceException("资金账户初始化失败，请重试");
        }
        return account;
    }

    private void ensureFundAccountExists(Long customerId, String accountType, String operator)
    {
        if (customerMapper.selectFundAccount(customerId, accountType) != null)
        {
            return;
        }
        try
        {
            customerMapper.insertFundAccount(newFundAccount(customerId, accountType, operator));
        }
        catch (DuplicateKeyException e)
        {
            // Concurrent initialization already created the account.
        }
    }

    private CustomerFundAccount newFundAccount(Long customerId, String accountType, String operator)
    {
        CustomerFundAccount account = new CustomerFundAccount();
        account.setCustomerId(customerId);
        account.setAccountType(accountType);
        account.setBalanceAmount(ZERO);
        account.setFrozenAmount(ZERO);
        account.setAvailableAmount(ZERO);
        account.setStatus(NORMAL);
        account.setCreateBy(operator);
        return account;
    }

    private void insertFundFlowWithRetry(CustomerFundFlow flow)
    {
        for (int attempt = 0; attempt < UNIQUE_NO_MAX_RETRY; attempt++)
        {
            flow.setFlowNo(nextNo("FLOW"));
            try
            {
                customerMapper.insertFundFlow(flow);
                return;
            }
            catch (DuplicateKeyException e)
            {
                if (attempt == UNIQUE_NO_MAX_RETRY - 1)
                {
                    throw new ServiceException("资金流水编号生成冲突，请重试");
                }
            }
        }
    }

    private void insertDepositBatchWithRetry(CustomerDepositBatch batch)
    {
        for (int attempt = 0; attempt < UNIQUE_NO_MAX_RETRY; attempt++)
        {
            batch.setDepositBatchNo(nextNo("DEP"));
            try
            {
                customerMapper.insertDepositBatch(batch);
                return;
            }
            catch (DuplicateKeyException e)
            {
                if (attempt == UNIQUE_NO_MAX_RETRY - 1)
                {
                    throw new ServiceException("定金批次编号生成冲突，请重试");
                }
            }
        }
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

    private boolean isPublicCustomer(Customer customer)
    {
        return customer != null && PUBLIC.equals(customer.getCustomerNature());
    }

    private String nextNo(String prefix)
    {
        int sequence = NO_SEQUENCE.updateAndGet(value -> value >= 999 ? 0 : value + 1);
        return prefix + LocalDateTime.now().format(NO_FORMATTER) + String.format("%03d", sequence);
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
        if (StringUtils.isEmpty(accountType))
        {
            return CUSTOMER_DEPOSIT;
        }
        if (CUSTOMER_DEPOSIT.equals(accountType) || SAMPLE_REBATE.equals(accountType))
        {
            return accountType;
        }
        throw new ServiceException("资金账户类型不合法");
    }

    private void validateCustomerDepositAccountType(String accountType)
    {
        if (StringUtils.isEmpty(accountType) || CUSTOMER_DEPOSIT.equals(accountType))
        {
            return;
        }
        throw new ServiceException(DEPOSIT_ACCOUNT_ONLY_MESSAGE);
    }

    private String resolveFlowType(String accountType, String flowType)
    {
        if (StringUtils.isNotEmpty(flowType))
        {
            if (CUSTOMER_DEPOSIT.equals(accountType))
            {
                if (DEPOSIT_IN.equals(flowType))
                {
                    return DEPOSIT_IN;
                }
                if (isDepositChangeFlowType(flowType))
                {
                    throw new ServiceException(DEPOSIT_IN_ONLY_MESSAGE);
                }
            }
            if (SAMPLE_REBATE.equals(accountType) && SAMPLE_REBATE_GENERATE.equals(flowType))
            {
                return flowType;
            }
            throw new ServiceException("资金流水类型不合法");
        }
        if (CUSTOMER_DEPOSIT.equals(accountType))
        {
            return DEPOSIT_IN;
        }
        return SAMPLE_REBATE_GENERATE;
    }

    private String resolveDepositType(String accountType, String depositType)
    {
        if (!CUSTOMER_DEPOSIT.equals(accountType))
        {
            throw new ServiceException("定金账户类型不合法");
        }
        if (StringUtils.isNotEmpty(depositType) && !CUSTOMER_DEPOSIT.equals(depositType))
        {
            throw new ServiceException("定金类型不合法");
        }
        return CUSTOMER_DEPOSIT;
    }

    private boolean isDepositChangeFlowType(String flowType)
    {
        return DEPOSIT_DEDUCT.equals(flowType) || DEPOSIT_REFUND.equals(flowType)
            || DEPOSIT_ADJUST.equals(flowType) || DEPOSIT_REVERSE.equals(flowType);
    }

    private String defaultIfEmpty(String value, String fallback)
    {
        return StringUtils.isEmpty(value) ? fallback : value;
    }
}
