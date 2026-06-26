package com.ruoyi.business.common.idempotency.service.impl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;
import com.ruoyi.business.common.idempotency.domain.IdempotentRequest;
import com.ruoyi.business.common.idempotency.mapper.IdempotentRequestMapper;
import com.ruoyi.business.common.idempotency.service.IdempotencyService;
import com.ruoyi.common.exception.ServiceException;
import com.ruoyi.common.utils.StringUtils;

/**
 * Request idempotency service implementation.
 */
@Service
public class IdempotencyServiceImpl implements IdempotencyService
{
    public static final String STATUS_PROCESSING = "PROCESSING";
    public static final String STATUS_SUCCESS = "SUCCESS";
    public static final String STATUS_FAILED = "FAILED";

    @Autowired
    private IdempotentRequestMapper idempotentRequestMapper;

    @Override
    public IdempotentRequest begin(String bizType, String idempotentKey, Long bizId, String requestHash, String operator)
    {
        String normalizedBizType = required(trimToNull(bizType), "幂等业务类型不能为空");
        String normalizedKey = required(trimToNull(idempotentKey), "幂等键不能为空");
        String normalizedHash = required(trimToNull(requestHash), "幂等请求摘要不能为空");

        IdempotentRequest existing = idempotentRequestMapper.selectByBizKeyForUpdate(normalizedBizType, normalizedKey);
        if (existing == null)
        {
            IdempotentRequest created = new IdempotentRequest();
            created.setBizType(normalizedBizType);
            created.setIdempotentKey(normalizedKey);
            created.setBizId(bizId);
            created.setRequestHash(normalizedHash);
            created.setStatus(STATUS_PROCESSING);
            created.setCreateBy(operator);
            try
            {
                idempotentRequestMapper.insertIdempotentRequest(created);
                return created;
            }
            catch (DuplicateKeyException e)
            {
                existing = idempotentRequestMapper.selectByBizKeyForUpdate(normalizedBizType, normalizedKey);
                if (existing == null)
                {
                    throw new ServiceException("幂等请求初始化失败，请重试");
                }
            }
        }

        assertSameRequestHash(existing, normalizedHash);
        if (STATUS_SUCCESS.equals(existing.getStatus()))
        {
            existing.setReplay(true);
            return existing;
        }
        if (STATUS_PROCESSING.equals(existing.getStatus()))
        {
            throw new ServiceException("请求处理中，请勿重复提交");
        }
        if (STATUS_FAILED.equals(existing.getStatus()))
        {
            throw new ServiceException("幂等请求已失败，请使用新的幂等键重试");
        }
        throw new ServiceException("幂等请求状态不合法");
    }

    @Override
    public void markSuccess(Long requestId, String resultRefType, Long resultRefId)
    {
        if (requestId == null)
        {
            throw new ServiceException("幂等请求ID不能为空");
        }
        idempotentRequestMapper.updateSuccess(requestId, resultRefType, resultRefId);
    }

    @Override
    public void markFailed(Long requestId, String errorMessage)
    {
        if (requestId != null)
        {
            idempotentRequestMapper.updateFailed(requestId, limit(errorMessage, 500));
        }
    }

    private void assertSameRequestHash(IdempotentRequest existing, String requestHash)
    {
        if (!requestHash.equals(existing.getRequestHash()))
        {
            throw new ServiceException("幂等键已被不同请求使用");
        }
    }

    private String required(String value, String message)
    {
        if (StringUtils.isEmpty(value))
        {
            throw new ServiceException(message);
        }
        return value;
    }

    private String trimToNull(String value)
    {
        if (value == null)
        {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private String limit(String value, int maxLength)
    {
        if (value == null || value.length() <= maxLength)
        {
            return value;
        }
        return value.substring(0, maxLength);
    }
}
