package com.ruoyi.business.customer.service;

import java.util.List;
import java.util.Map;
import com.ruoyi.business.customer.domain.Customer;
import com.ruoyi.business.customer.domain.CustomerDepositBatch;
import com.ruoyi.business.customer.domain.CustomerFundAccount;
import com.ruoyi.business.customer.domain.CustomerFundEntry;
import com.ruoyi.business.customer.domain.CustomerFundFlow;
import com.ruoyi.business.customer.domain.CustomerOwnerTransfer;
import com.ruoyi.business.customer.domain.CustomerSalesmanBindLog;
import com.ruoyi.business.customer.domain.CustomerSamplePolicy;
import com.ruoyi.business.customer.domain.SampleRebateRecord;
import com.ruoyi.common.core.domain.entity.SysUser;

/**
 * 客户管理 服务层.
 */
public interface ICustomerService
{
    public List<Customer> selectCustomerList(Customer customer);

    public Customer selectCustomerById(Long customerId);

    public Map<String, Object> selectCustomerDetail(Long customerId);

    public int insertCustomer(Customer customer);

    public int updateCustomer(Customer customer);

    public int updateCustomerStatus(Customer customer);

    public int deleteCustomerByIds(Long[] customerIds);

    public Map<String, Object> checkDuplicate(Long customerId, String customerName, String contactPhone);

    public List<SysUser> selectSalesmanCandidates(String keyword);

    public int transferOwner(CustomerOwnerTransfer transfer, Long operatorId, String operatorName);

    public List<CustomerSalesmanBindLog> selectOwnerLogs(Long customerId);

    public List<CustomerFundAccount> selectFundAccounts(Long customerId);

    public CustomerFundFlow recordFundEntry(Long customerId, CustomerFundEntry entry, Long operatorId, String operatorName);

    public List<CustomerFundFlow> selectFundFlows(CustomerFundFlow flow);

    public List<CustomerDepositBatch> selectDepositBatches(Long customerId);

    public CustomerSamplePolicy selectSamplePolicy(Long customerId);

    public int saveSamplePolicy(CustomerSamplePolicy policy);

    public SampleRebateRecord createSampleRebateRecord(SampleRebateRecord record, Long operatorId, String operatorName);

    public List<SampleRebateRecord> selectSampleRebateRecords(Long customerId);
}
