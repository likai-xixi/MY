package com.ruoyi.business.customer.domain;

import java.math.BigDecimal;
import com.ruoyi.common.core.domain.BaseEntity;

/**
 * 客户资金账户 customer_fund_account.
 */
public class CustomerFundAccount extends BaseEntity
{
    private static final long serialVersionUID = 1L;

    private Long accountId;
    private Long customerId;
    private String accountType;
    private BigDecimal balanceAmount;
    private BigDecimal frozenAmount;
    private BigDecimal availableAmount;
    private String status;

    public Long getAccountId() { return accountId; }
    public void setAccountId(Long accountId) { this.accountId = accountId; }
    public Long getCustomerId() { return customerId; }
    public void setCustomerId(Long customerId) { this.customerId = customerId; }
    public String getAccountType() { return accountType; }
    public void setAccountType(String accountType) { this.accountType = accountType; }
    public BigDecimal getBalanceAmount() { return balanceAmount; }
    public void setBalanceAmount(BigDecimal balanceAmount) { this.balanceAmount = balanceAmount; }
    public BigDecimal getFrozenAmount() { return frozenAmount; }
    public void setFrozenAmount(BigDecimal frozenAmount) { this.frozenAmount = frozenAmount; }
    public BigDecimal getAvailableAmount() { return availableAmount; }
    public void setAvailableAmount(BigDecimal availableAmount) { this.availableAmount = availableAmount; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
