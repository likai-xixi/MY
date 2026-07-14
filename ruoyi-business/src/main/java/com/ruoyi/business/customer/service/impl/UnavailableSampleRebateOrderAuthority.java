package com.ruoyi.business.customer.service.impl;

import org.springframework.stereotype.Service;
import com.ruoyi.business.customer.service.SampleRebateOrderAuthority;
import com.ruoyi.common.exception.ServiceException;

/**
 * Fail-closed adapter used until an approved sample-order source is available.
 */
@Service
public class UnavailableSampleRebateOrderAuthority implements SampleRebateOrderAuthority
{
    @Override
    public AuthoritativeSampleOrder requireEligible(Long customerId, Long requestedOrderId, String requestedOrderNo)
    {
        throw new ServiceException("权威样品订单来源尚未接入，暂不允许生成样品返现。");
    }
}
