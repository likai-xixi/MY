package com.ruoyi.business.common.idempotency.service;

import com.ruoyi.business.common.idempotency.domain.IdempotentRequest;

/**
 * Request idempotency service.
 */
public interface IdempotencyService
{
    public IdempotentRequest begin(String bizType, String idempotentKey, Long bizId, String requestHash, String operator);

    public void markSuccess(Long requestId, String resultRefType, Long resultRefId);

    public void markFailed(Long requestId, String errorMessage);
}
