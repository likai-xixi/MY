package com.ruoyi.business.customer.service;

import java.util.List;
import com.ruoyi.business.customer.domain.Customer;
import com.ruoyi.business.customer.domain.CustomerFundAccount;
import com.ruoyi.business.customer.domain.CustomerFundEntry;
import com.ruoyi.business.customer.domain.CustomerFundFlow;
import com.ruoyi.business.customer.domain.SampleRebateRecord;

/**
 * 客户资金服务.
 */
public interface ICustomerFundService
{
    public void initFundAccounts(Customer customer, String operator);

    public List<CustomerFundAccount> selectFundAccounts(Long customerId);

    public CustomerFundFlow recordCustomerDeposit(Long customerId, CustomerFundEntry entry, Long operatorId, String operatorName);

    public CustomerFundFlow recordFundEntry(Long customerId, CustomerFundEntry entry, Long operatorId, String operatorName);

    public CustomerFundFlow recordSampleRebateFlow(SampleRebateRecord record, Long operatorId, String operatorName);
}
