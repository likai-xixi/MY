package com.ruoyi.business.customer.service;

import static org.junit.Assert.fail;

import com.ruoyi.business.customer.domain.Customer;
import com.ruoyi.business.customer.domain.CustomerFundAccount;
import com.ruoyi.business.customer.domain.CustomerFundEntry;
import com.ruoyi.common.exception.ServiceException;
import java.lang.reflect.Field;
import java.lang.reflect.InvocationHandler;
import java.lang.reflect.Method;
import java.lang.reflect.Proxy;
import java.math.BigDecimal;

public final class CustomerTestSupport
{
    private CustomerTestSupport()
    {
    }

    public static void inject(Object target, String fieldName, Object value)
    {
        try
        {
            Field field = target.getClass().getDeclaredField(fieldName);
            field.setAccessible(true);
            field.set(target, value);
        }
        catch (ReflectiveOperationException e)
        {
            throw new AssertionError(e);
        }
    }

    @SuppressWarnings("unchecked")
    public static <T> T proxy(Class<T> type, InvocationHandler handler)
    {
        return (T) Proxy.newProxyInstance(type.getClassLoader(), new Class<?>[] { type }, handler);
    }

    public static Object defaultValue(Method method)
    {
        Class<?> type = method.getReturnType();
        if (Void.TYPE.equals(type))
        {
            return null;
        }
        if (Boolean.TYPE.equals(type))
        {
            return false;
        }
        if (Byte.TYPE.equals(type) || Short.TYPE.equals(type) || Integer.TYPE.equals(type))
        {
            return 0;
        }
        if (Long.TYPE.equals(type))
        {
            return 0L;
        }
        if (Float.TYPE.equals(type))
        {
            return 0F;
        }
        if (Double.TYPE.equals(type))
        {
            return 0D;
        }
        return null;
    }

    public static Customer realCustomer(Long customerId)
    {
        Customer customer = new Customer();
        customer.setCustomerId(customerId);
        customer.setCustomerNature("REAL");
        customer.setStatus("0");
        return customer;
    }

    public static Customer publicCustomer(Long customerId)
    {
        Customer customer = new Customer();
        customer.setCustomerId(customerId);
        customer.setCustomerNature("PUBLIC");
        customer.setStatus("0");
        return customer;
    }

    public static CustomerFundEntry depositEntry(String idempotentKey, String accountType, String flowType, String amount)
    {
        CustomerFundEntry entry = new CustomerFundEntry();
        entry.setIdempotentKey(idempotentKey);
        entry.setAccountType(accountType);
        entry.setFlowType(flowType);
        entry.setAmount(new BigDecimal(amount));
        entry.setReceiptNo(" receipt-001 ");
        return entry;
    }

    public static CustomerFundAccount fundAccount(Long customerId, String accountType, String balance)
    {
        CustomerFundAccount account = new CustomerFundAccount();
        account.setAccountId(100L);
        account.setCustomerId(customerId);
        account.setAccountType(accountType);
        account.setBalanceAmount(new BigDecimal(balance));
        account.setAvailableAmount(BigDecimal.ZERO.setScale(2));
        account.setFrozenAmount(new BigDecimal(balance));
        account.setStatus("0");
        return account;
    }

    public static void assertServiceException(String expectedMessagePart, ThrowingRunnable runnable)
    {
        try
        {
            runnable.run();
            fail("Expected ServiceException");
        }
        catch (ServiceException e)
        {
            if (expectedMessagePart != null && !e.getMessage().contains(expectedMessagePart))
            {
                throw new AssertionError("Expected message to contain <" + expectedMessagePart + "> but was <" + e.getMessage() + ">");
            }
        }
        catch (Exception e)
        {
            throw new AssertionError(e);
        }
    }

    public interface ThrowingRunnable
    {
        void run() throws Exception;
    }
}
