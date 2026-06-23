package com.ruoyi.business.customer.mapper;

import java.math.BigDecimal;
import java.util.List;
import org.apache.ibatis.annotations.Param;
import com.ruoyi.business.customer.domain.Customer;
import com.ruoyi.business.customer.domain.CustomerAddress;
import com.ruoyi.business.customer.domain.CustomerContact;
import com.ruoyi.business.customer.domain.CustomerDepositBatch;
import com.ruoyi.business.customer.domain.CustomerFundAccount;
import com.ruoyi.business.customer.domain.CustomerFundFlow;
import com.ruoyi.business.customer.domain.CustomerSalesmanBindLog;
import com.ruoyi.business.customer.domain.CustomerSamplePolicy;
import com.ruoyi.business.customer.domain.SampleRebateRecord;

/**
 * 客户管理 Mapper.
 */
public interface CustomerMapper
{
    public List<Customer> selectCustomerList(Customer customer);

    public Customer selectCustomerById(Long customerId);

    public Customer selectCustomerByCode(String customerCode);

    public String selectMaxCustomerCodeByMonth(@Param("monthPrefix") String monthPrefix);

    public int insertCustomer(Customer customer);

    public int updateCustomer(Customer customer);

    public int updateCustomerStatus(Customer customer);

    public int deleteCustomerByIds(Long[] customerIds);

    public int countCustomerByName(@Param("customerId") Long customerId, @Param("customerName") String customerName);

    public int countCustomerByPhone(@Param("customerId") Long customerId, @Param("contactPhone") String contactPhone);

    public List<CustomerContact> selectContactsByCustomerId(Long customerId);

    public int deleteContactsByCustomerId(Long customerId);

    public int insertContact(CustomerContact contact);

    public List<CustomerAddress> selectAddressesByCustomerId(Long customerId);

    public int deleteAddressesByCustomerId(Long customerId);

    public int insertAddress(CustomerAddress address);

    public List<CustomerSalesmanBindLog> selectOwnerLogsByCustomerId(Long customerId);

    public int insertOwnerLog(CustomerSalesmanBindLog log);

    public List<CustomerFundAccount> selectFundAccountsByCustomerId(Long customerId);

    public CustomerFundAccount selectFundAccount(@Param("customerId") Long customerId, @Param("accountType") String accountType);

    public int insertFundAccount(CustomerFundAccount account);

    public int updateFundAccountBalance(@Param("accountId") Long accountId,
                                        @Param("balanceAmount") BigDecimal balanceAmount,
                                        @Param("availableAmount") BigDecimal availableAmount,
                                        @Param("frozenAmount") BigDecimal frozenAmount);

    public int insertFundFlow(CustomerFundFlow flow);

    public List<CustomerFundFlow> selectFundFlows(CustomerFundFlow flow);

    public int insertDepositBatch(CustomerDepositBatch batch);

    public List<CustomerDepositBatch> selectDepositBatchesByCustomerId(Long customerId);

    public CustomerSamplePolicy selectSamplePolicyByCustomerId(Long customerId);

    public int insertSamplePolicy(CustomerSamplePolicy policy);

    public int updateSamplePolicy(CustomerSamplePolicy policy);

    public int insertSampleRebateRecord(SampleRebateRecord record);

    public List<SampleRebateRecord> selectSampleRebateRecordsByCustomerId(Long customerId);
}
