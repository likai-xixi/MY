package com.ruoyi.business.customer.domain;

/**
 * 客户业务员转移入参.
 */
public class CustomerOwnerTransfer
{
    private Long customerId;
    private Long newOwnerUserId;
    private String changeReason;
    private String remark;

    public Long getCustomerId() { return customerId; }
    public void setCustomerId(Long customerId) { this.customerId = customerId; }
    public Long getNewOwnerUserId() { return newOwnerUserId; }
    public void setNewOwnerUserId(Long newOwnerUserId) { this.newOwnerUserId = newOwnerUserId; }
    public String getChangeReason() { return changeReason; }
    public void setChangeReason(String changeReason) { this.changeReason = changeReason; }
    public String getRemark() { return remark; }
    public void setRemark(String remark) { this.remark = remark; }
}
