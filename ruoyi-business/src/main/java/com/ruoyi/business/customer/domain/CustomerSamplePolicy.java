package com.ruoyi.business.customer.domain;

import java.math.BigDecimal;
import com.ruoyi.common.core.domain.BaseEntity;

/**
 * 客户样品支持政策 customer_sample_policy.
 */
public class CustomerSamplePolicy extends BaseEntity
{
    private static final long serialVersionUID = 1L;

    private Long policyId;
    private Long customerId;
    private String supportMode;
    private BigDecimal totalSupportRate;
    private BigDecimal instantDiscountRate;
    private BigDecimal deliveryDeductRate;
    private BigDecimal maxDeductPerDelivery;
    private String status;

    public Long getPolicyId() { return policyId; }
    public void setPolicyId(Long policyId) { this.policyId = policyId; }
    public Long getCustomerId() { return customerId; }
    public void setCustomerId(Long customerId) { this.customerId = customerId; }
    public String getSupportMode() { return supportMode; }
    public void setSupportMode(String supportMode) { this.supportMode = supportMode; }
    public BigDecimal getTotalSupportRate() { return totalSupportRate; }
    public void setTotalSupportRate(BigDecimal totalSupportRate) { this.totalSupportRate = totalSupportRate; }
    public BigDecimal getInstantDiscountRate() { return instantDiscountRate; }
    public void setInstantDiscountRate(BigDecimal instantDiscountRate) { this.instantDiscountRate = instantDiscountRate; }
    public BigDecimal getDeliveryDeductRate() { return deliveryDeductRate; }
    public void setDeliveryDeductRate(BigDecimal deliveryDeductRate) { this.deliveryDeductRate = deliveryDeductRate; }
    public BigDecimal getMaxDeductPerDelivery() { return maxDeductPerDelivery; }
    public void setMaxDeductPerDelivery(BigDecimal maxDeductPerDelivery) { this.maxDeductPerDelivery = maxDeductPerDelivery; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
