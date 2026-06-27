package com.ruoyi.web.controller.business.customer;

import java.util.List;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.ruoyi.business.customer.domain.Customer;
import com.ruoyi.business.customer.domain.CustomerFundEntry;
import com.ruoyi.business.customer.domain.CustomerFundFlow;
import com.ruoyi.business.customer.domain.CustomerOwnerTransfer;
import com.ruoyi.business.customer.domain.CustomerSamplePolicy;
import com.ruoyi.business.customer.domain.SampleRebateRecord;
import com.ruoyi.business.customer.service.ICustomerService;
import com.ruoyi.common.annotation.Log;
import com.ruoyi.common.core.controller.BaseController;
import com.ruoyi.common.core.domain.AjaxResult;
import com.ruoyi.common.core.page.TableDataInfo;
import com.ruoyi.common.enums.BusinessType;
import com.ruoyi.common.utils.poi.ExcelUtil;

/**
 * 客户管理.
 */
@RestController
@RequestMapping("/business/customer")
public class CustomerController extends BaseController
{
    @Autowired
    private ICustomerService customerService;

    @PreAuthorize("@ss.hasPermi('business:customer:list')")
    @GetMapping("/list")
    public TableDataInfo list(Customer customer)
    {
        startPage();
        List<Customer> list = customerService.selectCustomerList(customer);
        return getDataTable(list);
    }

    @Log(title = "客户管理", businessType = BusinessType.EXPORT)
    @PreAuthorize("@ss.hasPermi('business:customer:export')")
    @PostMapping("/export")
    public void export(HttpServletResponse response, Customer customer)
    {
        List<Customer> list = customerService.selectCustomerList(customer);
        ExcelUtil<Customer> util = new ExcelUtil<Customer>(Customer.class);
        util.exportExcel(response, list, "客户数据");
    }

    @PreAuthorize("@ss.hasPermi('business:customer:query')")
    @GetMapping("/{customerId}")
    public AjaxResult getInfo(@PathVariable Long customerId)
    {
        return success(customerService.selectCustomerDetail(customerId));
    }

    @PreAuthorize("@ss.hasPermi('business:customer:query')")
    @GetMapping("/duplicate-warning")
    public AjaxResult duplicateWarning(Long customerId, String customerName, String contactPhone)
    {
        return success(customerService.checkDuplicate(customerId, customerName, contactPhone));
    }

    @PreAuthorize("@ss.hasPermi('business:customer:add')")
    @Log(title = "客户管理", businessType = BusinessType.INSERT)
    @PostMapping
    public AjaxResult add(@Validated @RequestBody Customer customer)
    {
        customer.setCreateBy(getUsername());
        return toAjax(customerService.insertCustomer(customer));
    }

    @PreAuthorize("@ss.hasPermi('business:customer:edit')")
    @Log(title = "客户管理", businessType = BusinessType.UPDATE)
    @PutMapping
    public AjaxResult edit(@Validated @RequestBody Customer customer)
    {
        customer.setUpdateBy(getUsername());
        return toAjax(customerService.updateCustomer(customer));
    }

    @PreAuthorize("@ss.hasPermi('business:customer:edit')")
    @Log(title = "客户状态", businessType = BusinessType.UPDATE)
    @PutMapping("/changeStatus")
    public AjaxResult changeStatus(@RequestBody Customer customer)
    {
        customer.setUpdateBy(getUsername());
        return toAjax(customerService.updateCustomerStatus(customer));
    }

    @PreAuthorize("@ss.hasPermi('business:customer:remove')")
    @Log(title = "客户管理", businessType = BusinessType.DELETE)
    @DeleteMapping("/{customerIds}")
    public AjaxResult remove(@PathVariable Long[] customerIds)
    {
        return toAjax(customerService.deleteCustomerByIds(customerIds));
    }

    @PreAuthorize("@ss.hasPermi('business:customer:owner:view')")
    @GetMapping("/salesmen")
    public AjaxResult salesmen(String keyword)
    {
        return success(customerService.selectSalesmanCandidates(keyword));
    }

    @PreAuthorize("@ss.hasPermi('business:customer:owner:transfer')")
    @Log(title = "客户归属变更", businessType = BusinessType.UPDATE)
    @PutMapping("/transferOwner")
    public AjaxResult transferOwner(@RequestBody CustomerOwnerTransfer transfer)
    {
        return toAjax(customerService.transferOwner(transfer, getUserId(), getUsername()));
    }

    @PreAuthorize("@ss.hasPermi('business:customer:owner:history')")
    @GetMapping("/{customerId}/owner-log")
    public AjaxResult ownerLogs(@PathVariable Long customerId)
    {
        return success(customerService.selectOwnerLogs(customerId));
    }

    @PreAuthorize("@ss.hasPermi('business:customer:fund:view')")
    @GetMapping("/{customerId}/fund/accounts")
    public AjaxResult fundAccounts(@PathVariable Long customerId)
    {
        return success(customerService.selectFundAccounts(customerId));
    }

    @PreAuthorize("@ss.hasPermi('business:customer:fund:deposit')")
    @Log(title = "客户资金录入", businessType = BusinessType.INSERT)
    @PostMapping("/{customerId}/fund/deposit")
    public AjaxResult fundDeposit(@PathVariable Long customerId, @RequestBody CustomerFundEntry entry)
    {
        return success(customerService.recordCustomerDeposit(customerId, entry, getUserId(), getUsername()));
    }

    @PreAuthorize("@ss.hasPermi('business:customer:fund:flow')")
    @GetMapping("/{customerId}/fund/flows")
    public TableDataInfo fundFlows(@PathVariable Long customerId, CustomerFundFlow flow)
    {
        flow.setCustomerId(customerId);
        startPage();
        return getDataTable(customerService.selectFundFlows(flow));
    }

    @PreAuthorize("@ss.hasPermi('business:customer:fund:view')")
    @GetMapping("/{customerId}/fund/deposit-batches")
    public AjaxResult depositBatches(@PathVariable Long customerId)
    {
        return success(customerService.selectDepositBatches(customerId));
    }

    @PreAuthorize("@ss.hasPermi('business:customer:sample-policy:view')")
    @GetMapping("/{customerId}/sample-policy")
    public AjaxResult samplePolicy(@PathVariable Long customerId)
    {
        return success(customerService.selectSamplePolicy(customerId));
    }

    @PreAuthorize("@ss.hasPermi('business:customer:sample-policy:edit')")
    @Log(title = "客户样品政策", businessType = BusinessType.UPDATE)
    @PutMapping("/{customerId}/sample-policy")
    public AjaxResult saveSamplePolicy(@PathVariable Long customerId, @RequestBody CustomerSamplePolicy policy)
    {
        policy.setCustomerId(customerId);
        policy.setUpdateBy(getUsername());
        policy.setCreateBy(getUsername());
        return toAjax(customerService.saveSamplePolicy(policy));
    }

    @PreAuthorize("@ss.hasPermi('business:customer:sample-rebate:create')")
    @Log(title = "样品返现记录", businessType = BusinessType.INSERT)
    @PostMapping("/{customerId}/sample-rebate")
    public AjaxResult createSampleRebate(@PathVariable Long customerId, @RequestBody SampleRebateRecord record)
    {
        record.setCustomerId(customerId);
        return success(customerService.createSampleRebateRecord(record, getUserId(), getUsername()));
    }

    @PreAuthorize("@ss.hasPermi('business:customer:fund:view')")
    @GetMapping("/{customerId}/sample-rebate")
    public AjaxResult sampleRebates(@PathVariable Long customerId)
    {
        return success(customerService.selectSampleRebateRecords(customerId));
    }
}
