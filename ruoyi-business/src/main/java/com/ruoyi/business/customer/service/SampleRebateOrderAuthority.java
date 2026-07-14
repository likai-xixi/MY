package com.ruoyi.business.customer.service;

import java.math.BigDecimal;

/**
 * Resolves a sample order from an authoritative business source before a rebate
 * can change customer funds.
 */
public interface SampleRebateOrderAuthority
{
    AuthoritativeSampleOrder requireEligible(Long customerId, Long requestedOrderId, String requestedOrderNo);

    final class AuthoritativeSampleOrder
    {
        private final Long customerId;
        private final Long orderId;
        private final String orderNo;
        private final BigDecimal sampleAmount;

        public AuthoritativeSampleOrder(Long customerId, Long orderId, String orderNo, BigDecimal sampleAmount)
        {
            this.customerId = customerId;
            this.orderId = orderId;
            this.orderNo = orderNo;
            this.sampleAmount = sampleAmount;
        }

        public Long getCustomerId()
        {
            return customerId;
        }

        public Long getOrderId()
        {
            return orderId;
        }

        public String getOrderNo()
        {
            return orderNo;
        }

        public BigDecimal getSampleAmount()
        {
            return sampleAmount;
        }
    }
}
