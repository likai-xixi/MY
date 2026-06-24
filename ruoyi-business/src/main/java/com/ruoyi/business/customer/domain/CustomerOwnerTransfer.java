package com.ruoyi.business.customer.domain;

import java.util.Date;
import com.fasterxml.jackson.annotation.JsonFormat;

/**
 * 客户归属变更入参.
 */
public class CustomerOwnerTransfer
{
    private Long customerId;
    private String transferMode;
    private String newOwnerType;
    private String newOwnerSource;
    private String newOwnerProfitMode;
    private Long newOwnerUserId;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private Date effectiveTime;

    private String changeReason;
    private String remark;

    public Long getCustomerId() { return customerId; }
    public void setCustomerId(Long customerId) { this.customerId = customerId; }
    public String getTransferMode() { return transferMode; }
    public void setTransferMode(String transferMode) { this.transferMode = transferMode; }
    public String getNewOwnerType() { return newOwnerType; }
    public void setNewOwnerType(String newOwnerType) { this.newOwnerType = newOwnerType; }
    public String getNewOwnerSource() { return newOwnerSource; }
    public void setNewOwnerSource(String newOwnerSource) { this.newOwnerSource = newOwnerSource; }
    public String getNewOwnerProfitMode() { return newOwnerProfitMode; }
    public void setNewOwnerProfitMode(String newOwnerProfitMode) { this.newOwnerProfitMode = newOwnerProfitMode; }
    public Long getNewOwnerUserId() { return newOwnerUserId; }
    public void setNewOwnerUserId(Long newOwnerUserId) { this.newOwnerUserId = newOwnerUserId; }
    public Date getEffectiveTime() { return effectiveTime; }
    public void setEffectiveTime(Date effectiveTime) { this.effectiveTime = effectiveTime; }
    public String getChangeReason() { return changeReason; }
    public void setChangeReason(String changeReason) { this.changeReason = changeReason; }
    public String getRemark() { return remark; }
    public void setRemark(String remark) { this.remark = remark; }
}
