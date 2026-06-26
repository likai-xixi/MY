package com.ruoyi.business.common.idempotency.domain;

import java.util.Date;

/**
 * Idempotent request record.
 */
public class IdempotentRequest
{
    private Long requestId;
    private String bizType;
    private String idempotentKey;
    private Long bizId;
    private String requestHash;
    private String status;
    private String resultRefType;
    private Long resultRefId;
    private String errorMessage;
    private String createBy;
    private Date createTime;
    private Date updateTime;
    private boolean replay;

    public Long getRequestId() { return requestId; }
    public void setRequestId(Long requestId) { this.requestId = requestId; }
    public String getBizType() { return bizType; }
    public void setBizType(String bizType) { this.bizType = bizType; }
    public String getIdempotentKey() { return idempotentKey; }
    public void setIdempotentKey(String idempotentKey) { this.idempotentKey = idempotentKey; }
    public Long getBizId() { return bizId; }
    public void setBizId(Long bizId) { this.bizId = bizId; }
    public String getRequestHash() { return requestHash; }
    public void setRequestHash(String requestHash) { this.requestHash = requestHash; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getResultRefType() { return resultRefType; }
    public void setResultRefType(String resultRefType) { this.resultRefType = resultRefType; }
    public Long getResultRefId() { return resultRefId; }
    public void setResultRefId(Long resultRefId) { this.resultRefId = resultRefId; }
    public String getErrorMessage() { return errorMessage; }
    public void setErrorMessage(String errorMessage) { this.errorMessage = errorMessage; }
    public String getCreateBy() { return createBy; }
    public void setCreateBy(String createBy) { this.createBy = createBy; }
    public Date getCreateTime() { return createTime; }
    public void setCreateTime(Date createTime) { this.createTime = createTime; }
    public Date getUpdateTime() { return updateTime; }
    public void setUpdateTime(Date updateTime) { this.updateTime = updateTime; }
    public boolean isReplay() { return replay; }
    public void setReplay(boolean replay) { this.replay = replay; }
}
