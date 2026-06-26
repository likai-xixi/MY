package com.ruoyi.business.customer.service;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import org.junit.Test;
import org.testcontainers.containers.MySQLContainer;

public class CustomerFundMySqlIT
{
    @Test
    public void concurrentDepositKeepsBalanceAndIdempotentKeysUnique() throws Exception
    {
        try (MySQLContainer<?> mysql = new MySQLContainer<>("mysql:8.0.36")
            .withDatabaseName("customer_runtime_test")
            .withUsername("test")
            .withPassword("test"))
        {
            mysql.start();
            try (Connection connection = DriverManager.getConnection(mysql.getJdbcUrl(), mysql.getUsername(), mysql.getPassword()))
            {
                applySql(connection, "sql/migrations/V20260625_001_customer_schema.sql");
                applySql(connection, "sql/migrations/V20260625_004_idempotent_request.sql");
                seedCustomer(connection);
            }

            int workers = 8;
            CountDownLatch start = new CountDownLatch(1);
            ExecutorService executor = Executors.newFixedThreadPool(workers);
            List<Future<?>> futures = new ArrayList<>();
            for (int i = 0; i < workers; i++)
            {
                final int index = i;
                futures.add(executor.submit(() -> {
                    start.await();
                    deposit(mysql, "runtime-key-" + index, "FLOW-IT-" + index, "DEP-IT-" + index);
                    return null;
                }));
            }
            start.countDown();
            for (Future<?> future : futures)
            {
                future.get();
            }
            executor.shutdown();

            try (Connection connection = DriverManager.getConnection(mysql.getJdbcUrl(), mysql.getUsername(), mysql.getPassword()))
            {
                assertEquals(new BigDecimal("8.00"), decimal(connection, "select balance_amount from customer_fund_account where customer_id = 1 and account_type = 'CUSTOMER_DEPOSIT'"));
                assertEquals(new BigDecimal("8.00"), decimal(connection, "select frozen_amount from customer_fund_account where customer_id = 1 and account_type = 'CUSTOMER_DEPOSIT'"));
                assertEquals(workers, count(connection, "select count(*) from customer_fund_flow where account_type = 'CUSTOMER_DEPOSIT' and flow_type = 'DEPOSIT_IN'"));
                assertEquals(workers, count(connection, "select count(distinct flow_no) from customer_fund_flow"));
                assertEquals(workers, count(connection, "select count(distinct deposit_batch_no) from customer_deposit_batch"));
                assertEquals(workers, count(connection, "select count(*) from idempotent_request where biz_type = 'CUSTOMER_FUND_DEPOSIT' and status = 'SUCCESS'"));
                assertTrue("duplicate idempotent key must be rejected by uk_idempotent_biz_key",
                    duplicateIdempotentKeyRejected(connection));
            }
        }
    }

    private void deposit(MySQLContainer<?> mysql, String idempotentKey, String flowNo, String batchNo) throws Exception
    {
        try (Connection connection = DriverManager.getConnection(mysql.getJdbcUrl(), mysql.getUsername(), mysql.getPassword()))
        {
            connection.setAutoCommit(false);
            try
            {
                long requestId = insertIdempotencyProcessing(connection, idempotentKey);
                BigDecimal before = lockedBalance(connection);
                BigDecimal after = before.add(new BigDecimal("1.00"));
                Thread.sleep(25L);
                updateBalance(connection, after);
                long batchId = insertDepositBatch(connection, batchNo);
                long flowId = insertFundFlow(connection, flowNo, before, after, batchId, batchNo);
                markIdempotencySuccess(connection, requestId, flowId);
                connection.commit();
            }
            catch (Exception e)
            {
                connection.rollback();
                throw e;
            }
        }
    }

    private long insertIdempotencyProcessing(Connection connection, String idempotentKey) throws SQLException
    {
        try (PreparedStatement statement = connection.prepareStatement(
            "insert into idempotent_request(biz_type, idempotent_key, biz_id, request_hash, status, create_by, create_time, update_time) values('CUSTOMER_FUND_DEPOSIT', ?, 1, ?, 'PROCESSING', 'it', now(), now())",
            Statement.RETURN_GENERATED_KEYS))
        {
            statement.setString(1, idempotentKey);
            statement.setString(2, "hash-" + idempotentKey);
            statement.executeUpdate();
            return generatedKey(statement);
        }
    }

    private BigDecimal lockedBalance(Connection connection) throws SQLException
    {
        try (PreparedStatement statement = connection.prepareStatement(
            "select balance_amount from customer_fund_account where customer_id = 1 and account_type = 'CUSTOMER_DEPOSIT' for update");
            ResultSet resultSet = statement.executeQuery())
        {
            resultSet.next();
            return resultSet.getBigDecimal(1);
        }
    }

    private void updateBalance(Connection connection, BigDecimal after) throws SQLException
    {
        try (PreparedStatement statement = connection.prepareStatement(
            "update customer_fund_account set balance_amount = ?, frozen_amount = ?, update_time = now() where customer_id = 1 and account_type = 'CUSTOMER_DEPOSIT'"))
        {
            statement.setBigDecimal(1, after);
            statement.setBigDecimal(2, after);
            statement.executeUpdate();
        }
    }

    private long insertDepositBatch(Connection connection, String batchNo) throws SQLException
    {
        try (PreparedStatement statement = connection.prepareStatement(
            "insert into customer_deposit_batch(deposit_batch_no, customer_id, deposit_type, deposit_amount, used_amount, remaining_amount, status, start_time, create_by, create_time) values(?, 1, 'CUSTOMER_DEPOSIT', 1.00, 0.00, 1.00, 'LOCKED', now(), 'it', now())",
            Statement.RETURN_GENERATED_KEYS))
        {
            statement.setString(1, batchNo);
            statement.executeUpdate();
            return generatedKey(statement);
        }
    }

    private long insertFundFlow(Connection connection, String flowNo, BigDecimal before, BigDecimal after, long batchId, String batchNo) throws SQLException
    {
        try (PreparedStatement statement = connection.prepareStatement(
            "insert into customer_fund_flow(customer_id, account_type, flow_no, flow_type, amount, before_balance, after_balance, related_biz_type, related_biz_id, related_biz_no, operator_id, occur_time, create_by, create_time) values(1, 'CUSTOMER_DEPOSIT', ?, 'DEPOSIT_IN', 1.00, ?, ?, 'CUSTOMER_DEPOSIT_BATCH', ?, ?, 7, now(), 'it', now())",
            Statement.RETURN_GENERATED_KEYS))
        {
            statement.setString(1, flowNo);
            statement.setBigDecimal(2, before);
            statement.setBigDecimal(3, after);
            statement.setLong(4, batchId);
            statement.setString(5, batchNo);
            statement.executeUpdate();
            return generatedKey(statement);
        }
    }

    private void markIdempotencySuccess(Connection connection, long requestId, long flowId) throws SQLException
    {
        try (PreparedStatement statement = connection.prepareStatement(
            "update idempotent_request set status = 'SUCCESS', result_ref_type = 'CUSTOMER_FUND_FLOW', result_ref_id = ?, update_time = now() where request_id = ?"))
        {
            statement.setLong(1, flowId);
            statement.setLong(2, requestId);
            statement.executeUpdate();
        }
    }

    private long generatedKey(PreparedStatement statement) throws SQLException
    {
        try (ResultSet resultSet = statement.getGeneratedKeys())
        {
            resultSet.next();
            return resultSet.getLong(1);
        }
    }

    private boolean duplicateIdempotentKeyRejected(Connection connection) throws SQLException
    {
        try (PreparedStatement statement = connection.prepareStatement(
            "insert into idempotent_request(biz_type, idempotent_key, biz_id, request_hash, status, create_by, create_time, update_time) values('CUSTOMER_FUND_DEPOSIT', 'runtime-key-0', 1, 'other-hash', 'PROCESSING', 'it', now(), now())"))
        {
            statement.executeUpdate();
            return false;
        }
        catch (SQLException e)
        {
            return e.getSQLState() != null && e.getSQLState().startsWith("23");
        }
    }

    private void seedCustomer(Connection connection) throws SQLException
    {
        try (Statement statement = connection.createStatement())
        {
            statement.executeUpdate(
                "insert into customer(customer_id, customer_code, customer_name, short_name, customer_nature, customer_type, customer_level, contact_name, contact_phone, province, city, district, address, owner_type, owner_source, owner_profit_mode, status, del_flag, create_by, create_time) values(1, 'KH_IT_001', 'Runtime Test Customer', 'Runtime Test Customer', 'REAL', 'DEALER', 'NORMAL', 'Tester', '18500000000', '浙江省', '杭州市', '西湖区', 'Runtime Road', 'FACTORY', 'FACTORY_POOL', 'NONE', '0', '0', 'it', now())"
            );
            statement.executeUpdate(
                "insert into customer_fund_account(customer_id, account_type, balance_amount, frozen_amount, available_amount, status, create_by, create_time) values(1, 'CUSTOMER_DEPOSIT', 0.00, 0.00, 0.00, '0', 'it', now())"
            );
        }
    }

    private void applySql(Connection connection, String relativePath) throws Exception
    {
        String sql = Files.readString(projectRoot().resolve(relativePath), StandardCharsets.UTF_8);
        StringBuilder cleaned = new StringBuilder();
        for (String line : sql.split("\\R"))
        {
            if (!line.trim().startsWith("--"))
            {
                cleaned.append(line).append('\n');
            }
        }
        try (Statement statement = connection.createStatement())
        {
            for (String part : cleaned.toString().split(";"))
            {
                String command = part.trim();
                if (!command.isEmpty())
                {
                    statement.execute(command);
                }
            }
        }
    }

    private Path projectRoot()
    {
        Path current = Path.of("").toAbsolutePath();
        if (Files.exists(current.resolve("sql/migrations/V20260625_001_customer_schema.sql")))
        {
            return current;
        }
        return current.getParent();
    }

    private int count(Connection connection, String sql) throws SQLException
    {
        try (Statement statement = connection.createStatement(); ResultSet resultSet = statement.executeQuery(sql))
        {
            resultSet.next();
            return resultSet.getInt(1);
        }
    }

    private BigDecimal decimal(Connection connection, String sql) throws SQLException
    {
        try (Statement statement = connection.createStatement(); ResultSet resultSet = statement.executeQuery(sql))
        {
            resultSet.next();
            return resultSet.getBigDecimal(1);
        }
    }
}
