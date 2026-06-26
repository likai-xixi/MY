package com.ruoyi.business.customer.domain;

import java.math.BigDecimal;

/**
 * 客户资金录入入参.
 */
public class CustomerFundEntry
{
    private String idempotentKey;
    private String accountType;
    private String flowType;
    private String depositType;
    private BigDecimal amount;
    private Long relatedBizId;
    private String relatedBizNo;
    private String relatedBizType;
    private String receiptNo;
    private String remark;

    public String getIdempotentKey() { return idempotentKey; }
    public void setIdempotentKey(String idempotentKey) { this.idempotentKey = idempotentKey; }
    public String getAccountType() { return accountType; }
    public void setAccountType(String accountType) { this.accountType = accountType; }
    public String getFlowType() { return flowType; }
    public void setFlowType(String flowType) { this.flowType = flowType; }
    public String getDepositType() { return depositType; }
    public void setDepositType(String depositType) { this.depositType = depositType; }
    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
    public Long getRelatedBizId() { return relatedBizId; }
    public void setRelatedBizId(Long relatedBizId) { this.relatedBizId = relatedBizId; }
    public String getRelatedBizNo() { return relatedBizNo; }
    public void setRelatedBizNo(String relatedBizNo) { this.relatedBizNo = relatedBizNo; }
    public String getRelatedBizType() { return relatedBizType; }
    public void setRelatedBizType(String relatedBizType) { this.relatedBizType = relatedBizType; }
    public String getReceiptNo() { return receiptNo; }
    public void setReceiptNo(String receiptNo) { this.receiptNo = receiptNo; }
    public String getRemark() { return remark; }
    public void setRemark(String remark) { this.remark = remark; }
}
