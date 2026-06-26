package com.ruoyi.business.common.idempotency.support;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import com.ruoyi.common.exception.ServiceException;

/**
 * Builds deterministic request hashes from normalized fields.
 */
public final class IdempotencyRequestHash
{
    private IdempotencyRequestHash()
    {
    }

    public static String sha256(String canonicalText)
    {
        try
        {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] bytes = digest.digest(canonicalText.getBytes(StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder(bytes.length * 2);
            for (byte value : bytes)
            {
                hex.append(String.format("%02x", value));
            }
            return hex.toString();
        }
        catch (NoSuchAlgorithmException e)
        {
            throw new ServiceException("幂等请求摘要生成失败");
        }
    }

    public static String text(String value)
    {
        if (value == null)
        {
            return "";
        }
        return value.trim();
    }

    public static String money(BigDecimal amount)
    {
        BigDecimal normalized = amount == null ? BigDecimal.ZERO : amount;
        return normalized.setScale(2, RoundingMode.HALF_UP).toPlainString();
    }

    public static String rate(BigDecimal value, BigDecimal fallback)
    {
        BigDecimal normalized = value == null ? fallback : value;
        return normalized.setScale(4, RoundingMode.HALF_UP).toPlainString();
    }

    public static String operatorScope(Long operatorId, String operatorName)
    {
        if (operatorId != null)
        {
            return String.valueOf(operatorId);
        }
        return text(operatorName);
    }

}
