package com.ruoyi.business.common.code;

import java.math.BigInteger;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import org.springframework.stereotype.Component;

/**
 * Business monthly sequence code generator.
 */
@Component
public class BusinessMonthlyCodeGenerator
{
    private static final DateTimeFormatter MONTH_FORMATTER = DateTimeFormatter.ofPattern("yyyyMM");
    private static final int SEQUENCE_WIDTH = 6;

    public String currentMonthPrefix(String prefix)
    {
        return prefix + YearMonth.now().format(MONTH_FORMATTER);
    }

    public String nextCode(String monthPrefix, String maxCode)
    {
        BigInteger next = BigInteger.ONE;
        if (maxCode != null && maxCode.startsWith(monthPrefix) && maxCode.length() > monthPrefix.length())
        {
            next = new BigInteger(maxCode.substring(monthPrefix.length())).add(BigInteger.ONE);
        }
        String sequence = next.toString();
        if (sequence.length() < SEQUENCE_WIDTH)
        {
            sequence = "0".repeat(SEQUENCE_WIDTH - sequence.length()) + sequence;
        }
        return monthPrefix + sequence;
    }
}
