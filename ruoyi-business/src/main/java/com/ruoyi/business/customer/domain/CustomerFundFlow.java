package com.ruoyi.business.customer.domain;

import java.math.BigDecimal;
import java.util.Date;
import com.fasterxml.jackson.annotation.JsonFormat;
import com.ruoyi.common.core.domain.BaseEntity;

/**
 * 客户资金流水 customer_fund_flow.
 */
public class CustomerFundFlow extends BaseEntity
{
    private static final long serialVersionUID = 1L;

    private Long flowId;
    private Long customerId;
    private String accountType;
    private String flowNo;
    private String flowType;
    private BigDecimal amount;
    private BigDecimal beforeBalance;
    private BigDecimal afterBalance;
    private String relatedBizType;
    private Long relatedBizId;
    private String relatedBizNo;
    private Long operatorId;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private Date occurTime;

    public Long getFlowId() { return flowId; }
    public void setFlowId(Long flowId) { this.flowId = flowId; }
    public Long getCustomerId() { return customerId; }
    public void setCustomerId(Long customerId) { this.customerId = customerId; }
    public String getAccountType() { return accountType; }
    public void setAccountType(String accountType) { this.accountType = accountType; }
    public String getFlowNo() { return flowNo; }
    public void setFlowNo(String flowNo) { this.flowNo = flowNo; }
    public String getFlowType() { return flowType; }
    public void setFlowType(String flowType) { this.flowType = flowType; }
    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
    public BigDecimal getBeforeBalance() { return beforeBalance; }
    public void setBeforeBalance(BigDecimal beforeBalance) { this.beforeBalance = beforeBalance; }
    public BigDecimal getAfterBalance() { return afterBalance; }
    public void setAfterBalance(BigDecimal afterBalance) { this.afterBalance = afterBalance; }
    public String getRelatedBizType() { return relatedBizType; }
    public void setRelatedBizType(String relatedBizType) { this.relatedBizType = relatedBizType; }
    public Long getRelatedBizId() { return relatedBizId; }
    public void setRelatedBizId(Long relatedBizId) { this.relatedBizId = relatedBizId; }
    public String getRelatedBizNo() { return relatedBizNo; }
    public void setRelatedBizNo(String relatedBizNo) { this.relatedBizNo = relatedBizNo; }
    public Long getOperatorId() { return operatorId; }
    public void setOperatorId(Long operatorId) { this.operatorId = operatorId; }
    public Date getOccurTime() { return occurTime; }
    public void setOccurTime(Date occurTime) { this.occurTime = occurTime; }
}
