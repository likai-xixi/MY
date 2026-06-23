package com.ruoyi.business.customer.domain;

import java.util.Date;
import com.fasterxml.jackson.annotation.JsonFormat;
import com.ruoyi.common.core.domain.BaseEntity;

/**
 * 客户业务员转移日志 customer_salesman_bind_log.
 */
public class CustomerSalesmanBindLog extends BaseEntity
{
    private static final long serialVersionUID = 1L;

    private Long logId;
    private Long customerId;
    private Long oldOwnerUserId;
    private String oldOwnerUserName;
    private Long newOwnerUserId;
    private String newOwnerUserName;
    private Long oldDeptId;
    private String oldDeptName;
    private Long newDeptId;
    private String newDeptName;
    private String changeReason;
    private String changeBy;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private Date changeTime;

    public Long getLogId() { return logId; }
    public void setLogId(Long logId) { this.logId = logId; }
    public Long getCustomerId() { return customerId; }
    public void setCustomerId(Long customerId) { this.customerId = customerId; }
    public Long getOldOwnerUserId() { return oldOwnerUserId; }
    public void setOldOwnerUserId(Long oldOwnerUserId) { this.oldOwnerUserId = oldOwnerUserId; }
    public String getOldOwnerUserName() { return oldOwnerUserName; }
    public void setOldOwnerUserName(String oldOwnerUserName) { this.oldOwnerUserName = oldOwnerUserName; }
    public Long getNewOwnerUserId() { return newOwnerUserId; }
    public void setNewOwnerUserId(Long newOwnerUserId) { this.newOwnerUserId = newOwnerUserId; }
    public String getNewOwnerUserName() { return newOwnerUserName; }
    public void setNewOwnerUserName(String newOwnerUserName) { this.newOwnerUserName = newOwnerUserName; }
    public Long getOldDeptId() { return oldDeptId; }
    public void setOldDeptId(Long oldDeptId) { this.oldDeptId = oldDeptId; }
    public String getOldDeptName() { return oldDeptName; }
    public void setOldDeptName(String oldDeptName) { this.oldDeptName = oldDeptName; }
    public Long getNewDeptId() { return newDeptId; }
    public void setNewDeptId(Long newDeptId) { this.newDeptId = newDeptId; }
    public String getNewDeptName() { return newDeptName; }
    public void setNewDeptName(String newDeptName) { this.newDeptName = newDeptName; }
    public String getChangeReason() { return changeReason; }
    public void setChangeReason(String changeReason) { this.changeReason = changeReason; }
    public String getChangeBy() { return changeBy; }
    public void setChangeBy(String changeBy) { this.changeBy = changeBy; }
    public Date getChangeTime() { return changeTime; }
    public void setChangeTime(Date changeTime) { this.changeTime = changeTime; }
}
