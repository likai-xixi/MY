package com.ruoyi.business.customer.domain;

import java.math.BigDecimal;
import com.ruoyi.common.core.domain.BaseEntity;

/**
 * 样品返现记录 sample_rebate_record.
 */
public class SampleRebateRecord extends BaseEntity
{
    private static final long serialVersionUID = 1L;

    private Long rebateRecordId;
    private Long customerId;
    private Long sampleOrderId;
    private String sampleOrderNo;
    private BigDecimal sampleAmount;
    private String supportMode;
    private BigDecimal totalSupportRate;
    private BigDecimal instantDiscountRate;
    private BigDecimal instantDiscountAmount;
    private BigDecimal rebateAmount;
    private BigDecimal usedAmount;
    private BigDecimal remainingAmount;
    private String status;

    public Long getRebateRecordId() { return rebateRecordId; }
    public void setRebateRecordId(Long rebateRecordId) { this.rebateRecordId = rebateRecordId; }
    public Long getCustomerId() { return customerId; }
    public void setCustomerId(Long customerId) { this.customerId = customerId; }
    public Long getSampleOrderId() { return sampleOrderId; }
    public void setSampleOrderId(Long sampleOrderId) { this.sampleOrderId = sampleOrderId; }
    public String getSampleOrderNo() { return sampleOrderNo; }
    public void setSampleOrderNo(String sampleOrderNo) { this.sampleOrderNo = sampleOrderNo; }
    public BigDecimal getSampleAmount() { return sampleAmount; }
    public void setSampleAmount(BigDecimal sampleAmount) { this.sampleAmount = sampleAmount; }
    public String getSupportMode() { return supportMode; }
    public void setSupportMode(String supportMode) { this.supportMode = supportMode; }
    public BigDecimal getTotalSupportRate() { return totalSupportRate; }
    public void setTotalSupportRate(BigDecimal totalSupportRate) { this.totalSupportRate = totalSupportRate; }
    public BigDecimal getInstantDiscountRate() { return instantDiscountRate; }
    public void setInstantDiscountRate(BigDecimal instantDiscountRate) { this.instantDiscountRate = instantDiscountRate; }
    public BigDecimal getInstantDiscountAmount() { return instantDiscountAmount; }
    public void setInstantDiscountAmount(BigDecimal instantDiscountAmount) { this.instantDiscountAmount = instantDiscountAmount; }
    public BigDecimal getRebateAmount() { return rebateAmount; }
    public void setRebateAmount(BigDecimal rebateAmount) { this.rebateAmount = rebateAmount; }
    public BigDecimal getUsedAmount() { return usedAmount; }
    public void setUsedAmount(BigDecimal usedAmount) { this.usedAmount = usedAmount; }
    public BigDecimal getRemainingAmount() { return remainingAmount; }
    public void setRemainingAmount(BigDecimal remainingAmount) { this.remainingAmount = remainingAmount; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
