package com.ruoyi.business.common.idempotency.mapper;

import org.apache.ibatis.annotations.Param;
import com.ruoyi.business.common.idempotency.domain.IdempotentRequest;

/**
 * Idempotent request mapper.
 */
public interface IdempotentRequestMapper
{
    public IdempotentRequest selectByBizKeyForUpdate(@Param("bizType") String bizType,
                                                     @Param("idempotentKey") String idempotentKey);

    public int insertIdempotentRequest(IdempotentRequest request);

    public int updateSuccess(@Param("requestId") Long requestId,
                             @Param("resultRefType") String resultRefType,
                             @Param("resultRefId") Long resultRefId);

    public int updateFailed(@Param("requestId") Long requestId,
                            @Param("errorMessage") String errorMessage);
}
