package com.ruoyi.business.masterdata.service;

import static java.util.concurrent.TimeUnit.SECONDS;
import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertTrue;
import static org.junit.Assert.fail;

import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.lang.reflect.Proxy;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.concurrent.Callable;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicReference;
import javax.sql.DataSource;
import org.apache.ibatis.session.SqlSessionFactory;
import org.junit.Test;
import org.mybatis.spring.SqlSessionFactoryBean;
import org.mybatis.spring.SqlSessionTemplate;
import org.springframework.aop.support.AopUtils;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.AnnotationConfigApplicationContext;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;
import org.springframework.jdbc.datasource.DataSourceTransactionManager;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.EnableTransactionManagement;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.testcontainers.containers.MySQLContainer;
import com.ruoyi.business.common.code.BusinessMonthlyCodeGenerator;
import com.ruoyi.business.masterdata.domain.MasterDataRecord;
import com.ruoyi.business.masterdata.domain.MasterDataResource;
import com.ruoyi.business.masterdata.mapper.MasterDataMapper;
import com.ruoyi.business.masterdata.service.impl.MasterDataServiceImpl;
import com.ruoyi.common.exception.ServiceException;

/**
 * Real Spring transaction, MyBatis XML, and MySQL lock proof for master-data references.
 *
 * The coordinating mapper is only an observer: it delegates to the real MyBatis mapper first,
 * then pauses the owning service transaction after a real FOR UPDATE query has returned. The
 * competing transaction must appear in performance_schema.data_lock_waits before the owner is
 * released, so thread timing alone cannot make these tests green.
 */
public class MasterDataReferenceMySqlIT
{
    private static final String DATABASE_NAME = "masterdata_reference_test";
    private static final String SELECT_RECORD_FOR_UPDATE = "selectRecordByIdForUpdate";
    private static final String SELECT_ACTIVE_FOR_UPDATE = "selectActiveRecordsForUpdate";
    private static final String SELECT_CATEGORY_HIERARCHY_MUTEX_FOR_UPDATE =
        "selectProductCategoryHierarchyMutexForUpdate";
    private static final String VALIDATION_SQL_PATH =
        "sql/validation/masterdata_runtime_validation.sql";

    private static final List<OrphanValidationFixture> ORPHAN_VALIDATION_FIXTURES = List.of(
        new OrphanValidationFixture(
            "orphan_product_category_parent",
            "insert into masterdata_product_category(category_id, parent_id, category_code, category_name, "
                + "status, sort_order, del_flag, create_by, create_time) values "
                + "(10001, 19001, 'PC_IT_ORPHAN', 'Orphan product category', '0', 0, '0', 'it', now())",
            "delete from masterdata_product_category where category_id = 10001",
            10001L,
            "missing_parent_id",
            19001L
        ),
        new OrphanValidationFixture(
            "orphan_product_series_category",
            "insert into masterdata_product_series(series_id, category_id, series_code, series_name, "
                + "status, sort_order, del_flag, create_by, create_time) values "
                + "(10002, 19002, 'PS_IT_ORPHAN', 'Orphan product series', '0', 0, '0', 'it', now())",
            "delete from masterdata_product_series where series_id = 10002",
            10002L,
            "missing_category_id",
            19002L
        ),
        new OrphanValidationFixture(
            "orphan_product_model_category",
            "insert into masterdata_product_model(model_id, category_id, series_id, model_code, model_name, "
                + "status, sort_order, del_flag, create_by, create_time) values "
                + "(10003, 19003, 301, 'PM_IT_ORPHAN_CATEGORY', 'Orphan model category', "
                + "'0', 0, '0', 'it', now())",
            "delete from masterdata_product_model where model_id = 10003",
            10003L,
            "missing_category_id",
            19003L
        ),
        new OrphanValidationFixture(
            "orphan_product_model_series",
            "insert into masterdata_product_model(model_id, category_id, series_id, model_code, model_name, "
                + "status, sort_order, del_flag, create_by, create_time) values "
                + "(10004, 200, 19004, 'PM_IT_ORPHAN_SERIES', 'Orphan model series', "
                + "'0', 0, '0', 'it', now())",
            "delete from masterdata_product_model where model_id = 10004",
            10004L,
            "missing_series_id",
            19004L
        ),
        new OrphanValidationFixture(
            "orphan_material_item_category",
            "insert into masterdata_material_item(material_id, category_id, material_code, material_name, "
                + "status, sort_order, del_flag, create_by, create_time) values "
                + "(10005, 19005, 'MI_IT_ORPHAN', 'Orphan material item', '0', 0, '0', 'it', now())",
            "delete from masterdata_material_item where material_id = 10005",
            10005L,
            "missing_category_id",
            19005L
        ),
        new OrphanValidationFixture(
            "orphan_accessory_item_category",
            "insert into masterdata_accessory_item(accessory_id, category_id, accessory_code, accessory_name, "
                + "status, sort_order, del_flag, create_by, create_time) values "
                + "(10006, 19006, 'AI_IT_ORPHAN', 'Orphan accessory item', '0', 0, '0', 'it', now())",
            "delete from masterdata_accessory_item where accessory_id = 10006",
            10006L,
            "missing_category_id",
            19006L
        ),
        new OrphanValidationFixture(
            "orphan_sales_option_value_category",
            "insert into masterdata_sales_option_value(option_id, category_id, option_code, option_name, "
                + "status, sort_order, del_flag, create_by, create_time) values "
                + "(10007, 19007, 'SOV_IT_ORPHAN', 'Orphan sales option', '0', 0, '0', 'it', now())",
            "delete from masterdata_sales_option_value where option_id = 10007",
            10007L,
            "missing_category_id",
            19007L
        )
    );

    private static final String MODEL_SERIES_CATEGORY_MISMATCH_QUERY =
        "select count(*) from masterdata_product_model model "
            + "join masterdata_product_series series "
            + "on series.series_id = model.series_id and series.del_flag = '0' "
            + "where model.del_flag = '0' and model.category_id <> series.category_id";

    private static final List<ReferenceDeleteCase> REMAINING_REFERENCE_DELETE_CASES = List.of(
        new ReferenceDeleteCase(
            "product category -> child category",
            MasterDataResource.PRODUCT_CATEGORY,
            102L,
            "masterdata_product_category",
            "category_id",
            103L,
            "masterdata_product_category",
            "category_id",
            null
        ),
        new ReferenceDeleteCase(
            "product category -> product model",
            MasterDataResource.PRODUCT_CATEGORY,
            201L,
            "masterdata_product_category",
            "category_id",
            402L,
            "masterdata_product_model",
            "model_id",
            // Series 303 starts deleted so the delete reaches the direct-model check; restore it afterward.
            "update masterdata_product_series set del_flag = '0' where series_id = 303"
        ),
        new ReferenceDeleteCase(
            "material category -> material item",
            MasterDataResource.MATERIAL_CATEGORY,
            700L,
            "masterdata_material_category",
            "category_id",
            701L,
            "masterdata_material_item",
            "material_id",
            null
        ),
        new ReferenceDeleteCase(
            "accessory category -> accessory item",
            MasterDataResource.ACCESSORY_CATEGORY,
            800L,
            "masterdata_accessory_category",
            "category_id",
            801L,
            "masterdata_accessory_item",
            "accessory_id",
            null
        ),
        new ReferenceDeleteCase(
            "sales option category -> sales option value",
            MasterDataResource.SALES_OPTION_CATEGORY,
            900L,
            "masterdata_sales_option_category",
            "category_id",
            901L,
            "masterdata_sales_option_value",
            "option_id",
            null
        )
    );

    @Test
    public void realServiceTransactionsSerializeReferenceAndHierarchyChanges() throws Exception
    {
        try (MySQLContainer<?> mysql = new MySQLContainer<>("mysql:8.0.36")
            .withDatabaseName(DATABASE_NAME)
            .withUsername("test")
            .withPassword("test"))
        {
            mysql.start();
            try (Connection connection = connect(mysql))
            {
                applySql(connection, "sql/migrations/V20260628_005_masterdata_r10_schema.sql");
                applySql(connection, "sql/migrations/V20260628_005_masterdata_r10_schema.sql");
                assertHierarchyMutexState(connection, "after two migration applications");
                try (Statement statement = connection.createStatement())
                {
                    assertEquals(1, statement.executeUpdate(
                        "update masterdata_product_category "
                            + "set category_code = 'BROKEN_MUTEX', status = '0', del_flag = '0' "
                            + "where category_id = -1"));
                }
                applySql(connection, "sql/migrations/V20260628_005_masterdata_r10_schema.sql");
                assertHierarchyMutexState(connection, "after repairing a corrupted mutex");
                try (Statement statement = connection.createStatement())
                {
                    assertEquals(1, statement.executeUpdate(
                        "delete from masterdata_product_category where category_id = -1"));
                }
                assertEquals("the mutex delete fixture must remove the sentinel", 0,
                    count(connection, "select count(*) from masterdata_product_category where category_id = -1"));
            }

            try (TestRuntime runtime = TestRuntime.start(mysql))
            {
                rejectCategoryWriteWhenHierarchyMutexIsMissing(runtime, mysql);
                try (Connection connection = connect(mysql))
                {
                    applySql(connection, "sql/migrations/V20260628_005_masterdata_r10_schema.sql");
                    assertHierarchyMutexState(connection, "after restoring a deleted mutex");
                }

                ExecutorService executor = Executors.newFixedThreadPool(2);
                try
                {
                    concurrentFirstRootCategoryCreates(runtime, mysql, executor);
                    rejectExistingInvalidHierarchyAndReleaseMutex(runtime, mysql);
                    try (Connection connection = connect(mysql))
                    {
                        seedReferenceGraph(connection);
                    }
                    rejectRemainingNonEmptyReferences(runtime, mysql);
                    try (Connection connection = connect(mysql))
                    {
                        assertValidationQueriesDetectEachOrphan(connection);
                    }
                    deleteFirstCategorySeries(runtime, mysql, executor);
                    childFirstCategorySeries(runtime, mysql, executor);
                    deleteFirstSeriesModel(runtime, mysql, executor);
                    childFirstSeriesModel(runtime, mysql, executor);
                    rejectSeriesCategoryChangeWithActiveModel(runtime);
                    serializeCategoryMovesBeforeTheyCreateFourLevels(runtime, mysql, executor);
                }
                finally
                {
                    executor.shutdownNow();
                    assertTrue("service tasks did not terminate", executor.awaitTermination(10, SECONDS));
                }
            }

            assertFinalReferenceAndHierarchyInvariants(mysql);
        }
    }

    private void rejectExistingInvalidHierarchyAndReleaseMutex(TestRuntime runtime,
                                                                 MySQLContainer<?> mysql) throws Exception
    {
        String hierarchyValidation = sqlStatementContaining(
            "sql/validation/masterdata_runtime_validation.sql",
            "invalid_product_category_hierarchy"
        );
        try (Connection connection = connect(mysql); Statement statement = connection.createStatement())
        {
            assertEquals(7, statement.executeUpdate(
                "insert into masterdata_product_category(category_id, parent_id, category_code, category_name, "
                    + "status, sort_order, del_flag, create_by, create_time) values "
                    + "(40, 41, 'PC_IT_040', 'Cycle A', '0', 0, '0', 'it', now()),"
                    + "(41, 40, 'PC_IT_041', 'Cycle B', '0', 0, '0', 'it', now()),"
                    + "(42, null, 'PC_IT_042', 'Cycle move target', '0', 0, '0', 'it', now()),"
                    + "(43, null, 'PC_IT_043', 'Depth one', '0', 0, '0', 'it', now()),"
                    + "(44, 43, 'PC_IT_044', 'Depth two', '0', 0, '0', 'it', now()),"
                    + "(45, 44, 'PC_IT_045', 'Depth three', '0', 0, '0', 'it', now()),"
                    + "(46, 45, 'PC_IT_046', 'Depth four', '0', 0, '0', 'it', now())"
            ));
            assertExactHierarchyViolations(connection, hierarchyValidation);
        }

        ExecutorService cycleExecutor = Executors.newSingleThreadExecutor(task -> {
            Thread thread = new Thread(task, "masterdata-real-cycle-timeout-probe");
            thread.setDaemon(true);
            return thread;
        });
        Future<Integer> cycleUpdate = cycleExecutor.submit(
            () -> runtime.service.updateRecord(
                "product-category",
                updatedProductCategory(40L, "Move cyclic category", 42L)
            )
        );
        try
        {
            cycleUpdate.get(3, SECONDS);
            fail("a pre-existing category cycle must fail closed");
        }
        catch (ExecutionException error)
        {
            Throwable cause = rootCause(error);
            assertTrue("cycle rejection must come from the production service; actual=" + cause,
                cause instanceof ServiceException);
            assertTrue("cycle rejection must explain the invalid hierarchy",
                cause.getMessage() != null && cause.getMessage().contains("循环"));
        }
        catch (TimeoutException error)
        {
            fail("cycle validation exceeded the bounded timeout");
        }
        finally
        {
            cycleUpdate.cancel(true);
            cycleExecutor.shutdownNow();
            assertTrue("cycle probe transaction did not terminate",
                cycleExecutor.awaitTermination(2, SECONDS));
        }

        try (Connection connection = connect(mysql))
        {
            connection.setAutoCommit(false);
            try (Statement statement = connection.createStatement())
            {
                statement.execute("set session innodb_lock_wait_timeout = 2");
                assertEquals("failed category update must release the hierarchy mutex", -1L,
                    longValue(connection,
                        "select category_id from masterdata_product_category "
                            + "where category_id = -1 for update"));
            }
            finally
            {
                connection.rollback();
            }
        }

        try (Connection connection = connect(mysql); Statement statement = connection.createStatement())
        {
            assertEquals(1, statement.executeUpdate(
                "update masterdata_product_category set parent_id = null where category_id = 40"));
            assertEquals(1, statement.executeUpdate(
                "update masterdata_product_category set parent_id = 40 where category_id = 41"));
            assertEquals(1, statement.executeUpdate(
                "update masterdata_product_category set parent_id = null where category_id = 46"));
            assertEquals("validation SQL must return clean after repairing the cycle and excess depth", 0,
                resultRowCount(connection, hierarchyValidation));
            assertEquals(7, statement.executeUpdate(
                "delete from masterdata_product_category where category_id in (40, 41, 42, 43, 44, 45, 46)"));
        }
    }

    private void assertExactHierarchyViolations(Connection connection, String sql) throws SQLException
    {
        Map<Long, HierarchyViolation> actual = new HashMap<>();
        try (Statement statement = connection.createStatement(); ResultSet resultSet = statement.executeQuery(sql))
        {
            while (resultSet.next())
            {
                assertEquals("hierarchy validation must retain its check name",
                    "invalid_product_category_hierarchy", resultSet.getString("check_name"));
                long rowId = resultSet.getLong("row_id");
                HierarchyViolation previous = actual.put(
                    rowId,
                    new HierarchyViolation(
                        resultSet.getLong("parent_id"),
                        resultSet.getInt("hierarchy_depth"),
                        resultSet.getString("violation")
                    )
                );
                assertNull("hierarchy validation must return each invalid row once", previous);
            }
        }

        assertEquals(
            "validation SQL must identify both cycle nodes and the exact level-four node",
            Map.of(
                40L, new HierarchyViolation(41L, 0, "unreachable_or_cycle"),
                41L, new HierarchyViolation(40L, 0, "unreachable_or_cycle"),
                46L, new HierarchyViolation(45L, 4, "depth_exceeds_3")
            ),
            actual
        );
    }

    private void assertValidationQueriesDetectEachOrphan(Connection connection) throws Exception
    {
        assertEquals("the validation contract owns exactly seven orphan checks", 7,
            ORPHAN_VALIDATION_FIXTURES.size());
        for (OrphanValidationFixture fixture : ORPHAN_VALIDATION_FIXTURES)
        {
            String validationSql = validationStatement(fixture.checkName);
            boolean inserted = false;
            try (Statement statement = connection.createStatement())
            {
                int insertedRows = statement.executeUpdate(fixture.insertSql);
                inserted = insertedRows > 0;
                assertEquals(fixture.checkName + " fixture must insert exactly one invalid row", 1, insertedRows);

                try (ResultSet resultSet = statement.executeQuery(validationSql))
                {
                    assertTrue(fixture.checkName + " must detect its positive fixture", resultSet.next());
                    assertEquals(fixture.checkName + " must preserve its check_name",
                        fixture.checkName, resultSet.getString("check_name"));
                    assertEquals(fixture.checkName + " must report the inserted child row",
                        fixture.rowId, resultSet.getLong("row_id"));
                    assertEquals(fixture.checkName + " must report the missing parent id",
                        fixture.missingId, resultSet.getLong(fixture.missingIdColumn));
                    assertFalse(fixture.checkName + " must report only its one isolated fixture",
                        resultSet.next());
                }
            }
            finally
            {
                if (inserted)
                {
                    try (Statement cleanup = connection.createStatement())
                    {
                        assertEquals(fixture.checkName + " fixture cleanup must remove one row", 1,
                            cleanup.executeUpdate(fixture.cleanupSql));
                    }
                }
            }
            assertEquals(fixture.checkName + " must return clean after fixture cleanup", 0,
                resultRowCount(connection, validationSql));
        }
        assertAllOrphanValidationQueriesClean(connection);
    }

    private void assertAllOrphanValidationQueriesClean(Connection connection) throws Exception
    {
        for (OrphanValidationFixture fixture : ORPHAN_VALIDATION_FIXTURES)
        {
            assertEquals(fixture.checkName + " must have zero active orphans", 0,
                resultRowCount(connection, validationStatement(fixture.checkName)));
        }
    }

    private String validationStatement(String checkName) throws Exception
    {
        return sqlStatementContaining(VALIDATION_SQL_PATH, "'" + checkName + "'");
    }

    private void assertHierarchyMutexState(Connection connection, String description) throws SQLException
    {
        assertEquals(description + " must preserve exactly one sentinel row", 1,
            count(connection, "select count(*) from masterdata_product_category where category_id = -1"));
        assertEquals(description + " must restore the complete hidden mutex shape", 1,
            count(connection, "select count(*) from masterdata_product_category "
                + "where category_id = -1 "
                + "and category_code = '__MD_PRODUCT_CATEGORY_HIERARCHY_MUTEX__' "
                + "and status = '1' and del_flag = '2'"));
    }

    private void rejectCategoryWriteWhenHierarchyMutexIsMissing(TestRuntime runtime,
                                                                  MySQLContainer<?> mysql) throws Exception
    {
        try
        {
            runtime.service.insertRecord("product-category", newProductCategory("Must fail without mutex"));
            fail("a product-category write must fail closed while the hierarchy mutex is missing");
        }
        catch (ServiceException expected)
        {
            assertTrue("the fail-closed rejection must come from the production service",
                expected.getMessage() != null && !expected.getMessage().isBlank());
        }

        try (Connection connection = connect(mysql))
        {
            assertEquals("a failed category write must not create an active row", 0,
                count(connection, "select count(*) from masterdata_product_category where del_flag = '0'"));
            assertEquals("the service must not recreate the migration-owned mutex", 0,
                count(connection, "select count(*) from masterdata_product_category where category_id = -1"));
        }
    }

    private void rejectRemainingNonEmptyReferences(TestRuntime runtime, MySQLContainer<?> mysql)
        throws Exception
    {
        assertEquals("five reference edges remain beyond the two concurrency scenarios", 5,
            REMAINING_REFERENCE_DELETE_CASES.size());
        for (ReferenceDeleteCase reference : REMAINING_REFERENCE_DELETE_CASES)
        {
            try
            {
                runtime.service.deleteRecordByIds(
                    reference.targetResource.getPathValue(),
                    new Long[] { reference.targetId },
                    "integration-test"
                );
                fail(reference.name + " must reject deleting a referenced parent");
            }
            catch (ServiceException expected)
            {
                assertTrue(reference.name + " rejection must come from the production service",
                    expected.getMessage() != null && !expected.getMessage().isBlank());
            }

            try (Connection connection = connect(mysql))
            {
                assertEquals(reference.name + " must preserve the active parent", 1,
                    count(connection, activeRowCountSql(
                        reference.targetTable, reference.targetIdColumn, reference.targetId)));
                assertEquals(reference.name + " must preserve the active child", 1,
                    count(connection, activeRowCountSql(
                        reference.childTable, reference.childIdColumn, reference.childId)));
                if (reference.cleanupSql != null)
                {
                    try (Statement statement = connection.createStatement())
                    {
                        assertEquals(reference.name + " fixture cleanup must restore the active series", 1,
                            statement.executeUpdate(reference.cleanupSql));
                    }
                }
            }
        }
    }

    private String activeRowCountSql(String table, String idColumn, long id)
    {
        return "select count(*) from " + table + " where " + idColumn + " = " + id + " and del_flag = '0'";
    }

    /** Compile-time link to every production mapper lock/count contract exercised by this IT. */
    @SuppressWarnings("unused")
    private void requireProductionMapperContract(MasterDataMapper mapper)
    {
        List<Long> ids = List.of(1L);
        mapper.selectProductCategoryHierarchyMutexForUpdate();
        mapper.selectRecordByIdForUpdate(MasterDataResource.PRODUCT_CATEGORY, 1L);
        mapper.selectActiveRecordsForUpdate(MasterDataResource.PRODUCT_CATEGORY);
        mapper.countActiveByParentIds(MasterDataResource.PRODUCT_CATEGORY, ids);
        mapper.countActiveByCategoryIds(MasterDataResource.PRODUCT_CATEGORY, ids);
        mapper.countActiveBySeriesIds(MasterDataResource.PRODUCT_MODEL, ids);
        mapper.deleteRecordByIds(MasterDataResource.PRODUCT_CATEGORY, ids, "integration-test");
    }

    private void concurrentFirstRootCategoryCreates(TestRuntime runtime, MySQLContainer<?> mysql,
                                                    ExecutorService executor) throws Exception
    {
        PausePlan plan = PausePlan.hierarchyMutex("create-first-root-owner");
        Future<Integer> owner = null;
        Future<Integer> waiter = null;
        runtime.coordinator.install(plan);
        try
        {
            owner = submitNamed(executor, plan.threadName,
                () -> runtime.service.insertRecord("product-category",
                    newProductCategory("First root category")));
            plan.awaitRealSqlReturn("first root category mutex owner");
            assertTrue("mutex owner must run inside a real Spring transaction",
                plan.springTransactionObserved.get());

            waiter = submitNamed(executor, "create-second-root-waiter",
                () -> runtime.service.insertRecord("product-category",
                    newProductCategory("Second root category")));
            assertDatabaseLockWait(mysql, waiter, "empty active category table mutex");

            plan.releaseOwner();
            assertEquals("first root category must commit", Integer.valueOf(1), owner.get(10, SECONDS));
            assertEquals("second root category must commit after the mutex owner",
                Integer.valueOf(1), waiter.get(10, SECONDS));
        }
        finally
        {
            plan.releaseOwner();
            runtime.coordinator.clear(plan);
            if (owner != null && !owner.isDone())
            {
                owner.cancel(true);
            }
            if (waiter != null && !waiter.isDone())
            {
                waiter.cancel(true);
            }
        }

        try (Connection connection = connect(mysql))
        {
            assertEquals("the migration must preserve one logically deleted hierarchy mutex row", 1,
                count(connection, "select count(*) from masterdata_product_category "
                    + "where category_id = -1 and del_flag = '2'"));
            assertEquals("both serialized first root inserts must remain active", 2,
                count(connection, "select count(*) from masterdata_product_category where del_flag = '0'"));
        }
    }

    private void deleteFirstCategorySeries(TestRuntime runtime, MySQLContainer<?> mysql,
                                           ExecutorService executor) throws Exception
    {
        runOwnerThenRejectedWaiter(
            runtime,
            mysql,
            executor,
            PausePlan.record("delete-category-first", MasterDataResource.PRODUCT_CATEGORY, 100L),
            "delete category before series insert",
            () -> runtime.service.deleteRecordByIds("product-category", new Long[] { 100L }, "integration-test"),
            () -> runtime.service.insertRecord("product-series", newProductSeries("Delete-first child", 100L))
        );

        try (Connection connection = connect(mysql))
        {
            assertEquals(0, count(connection,
                "select count(*) from masterdata_product_category where category_id = 100 and del_flag = '0'"));
            assertEquals(0, count(connection,
                "select count(*) from masterdata_product_series where category_id = 100 and del_flag = '0'"));
        }
    }

    private void childFirstCategorySeries(TestRuntime runtime, MySQLContainer<?> mysql,
                                          ExecutorService executor) throws Exception
    {
        runOwnerThenRejectedWaiter(
            runtime,
            mysql,
            executor,
            PausePlan.record("insert-series-first", MasterDataResource.PRODUCT_CATEGORY, 101L),
            "insert series before category delete",
            () -> runtime.service.insertRecord("product-series", newProductSeries("Child-first series", 101L)),
            () -> runtime.service.deleteRecordByIds("product-category", new Long[] { 101L }, "integration-test")
        );

        try (Connection connection = connect(mysql))
        {
            assertEquals(1, count(connection,
                "select count(*) from masterdata_product_category where category_id = 101 and del_flag = '0'"));
            assertEquals(1, count(connection,
                "select count(*) from masterdata_product_series where category_id = 101 and del_flag = '0'"));
        }
    }

    private void deleteFirstSeriesModel(TestRuntime runtime, MySQLContainer<?> mysql,
                                        ExecutorService executor) throws Exception
    {
        runOwnerThenRejectedWaiter(
            runtime,
            mysql,
            executor,
            PausePlan.record("delete-series-first", MasterDataResource.PRODUCT_SERIES, 300L),
            "delete series before model move",
            () -> runtime.service.deleteRecordByIds("product-series", new Long[] { 300L }, "integration-test"),
            () -> runtime.service.updateRecord("product-model",
                updatedProductModel(400L, "Delete-first model", 200L, 300L))
        );

        try (Connection connection = connect(mysql))
        {
            assertEquals(0, count(connection,
                "select count(*) from masterdata_product_series where series_id = 300 and del_flag = '0'"));
            assertEquals(301L, longValue(connection,
                "select series_id from masterdata_product_model where model_id = 400 and del_flag = '0'"));
        }
    }

    private void childFirstSeriesModel(TestRuntime runtime, MySQLContainer<?> mysql,
                                       ExecutorService executor) throws Exception
    {
        runOwnerThenRejectedWaiter(
            runtime,
            mysql,
            executor,
            PausePlan.record("move-model-first", MasterDataResource.PRODUCT_SERIES, 302L),
            "move model before series delete",
            () -> runtime.service.updateRecord("product-model",
                updatedProductModel(401L, "Child-first model", 200L, 302L)),
            () -> runtime.service.deleteRecordByIds("product-series", new Long[] { 302L }, "integration-test")
        );

        try (Connection connection = connect(mysql))
        {
            assertEquals(1, count(connection,
                "select count(*) from masterdata_product_series where series_id = 302 and del_flag = '0'"));
            assertEquals(302L, longValue(connection,
                "select series_id from masterdata_product_model where model_id = 401 and del_flag = '0'"));
        }
    }

    private void rejectSeriesCategoryChangeWithActiveModel(TestRuntime runtime) throws Exception
    {
        try
        {
            runtime.service.updateRecord("product-series",
                updatedProductSeries(510L, "Series with active model", 501L));
            fail("an active model must reject moving its series to another category");
        }
        catch (ServiceException expected)
        {
            assertTrue("rejection must come from the real service", expected.getMessage() != null);
        }

        try (Connection connection = runtime.dataSource.getConnection())
        {
            assertEquals(500L, longValue(connection,
                "select category_id from masterdata_product_series where series_id = 510 and del_flag = '0'"));
            assertEquals(0, count(connection, MODEL_SERIES_CATEGORY_MISMATCH_QUERY));
        }
    }

    private void serializeCategoryMovesBeforeTheyCreateFourLevels(TestRuntime runtime,
                                                                   MySQLContainer<?> mysql,
                                                                   ExecutorService executor) throws Exception
    {
        runOwnerThenRejectedWaiter(
            runtime,
            mysql,
            executor,
            PausePlan.activeHierarchy("move-c-under-b-first", MasterDataResource.PRODUCT_CATEGORY),
            "concurrent C->B and A->D category moves",
            () -> runtime.service.updateRecord("product-category",
                updatedProductCategory(602L, "Category C", 601L)),
            () -> runtime.service.updateRecord("product-category",
                updatedProductCategory(600L, "Category A", 603L))
        );

        try (Connection connection = connect(mysql))
        {
            assertEquals(Long.valueOf(601L), nullableLong(connection,
                "select parent_id from masterdata_product_category where category_id = 602 and del_flag = '0'"));
            assertNull(nullableLong(connection,
                "select parent_id from masterdata_product_category where category_id = 600 and del_flag = '0'"));
            assertCategoryTreeHasNoCycleAndAtMostThreeLevels(connection);
        }
    }

    private void runOwnerThenRejectedWaiter(TestRuntime runtime, MySQLContainer<?> mysql,
                                            ExecutorService executor, PausePlan plan,
                                            String description, Callable<Integer> ownerWork,
                                            Callable<Integer> waiterWork) throws Exception
    {
        Future<Integer> owner = null;
        Future<Integer> waiter = null;
        runtime.coordinator.install(plan);
        try
        {
            owner = submitNamed(executor, plan.threadName, ownerWork);
            plan.awaitRealSqlReturn(description);
            assertTrue(description + " must run inside a real Spring transaction",
                plan.springTransactionObserved.get());

            waiter = submitNamed(executor, description + "-waiter", waiterWork);
            assertDatabaseLockWait(mysql, waiter, description);

            plan.releaseOwner();
            assertEquals(description + " owner must commit", Integer.valueOf(1), owner.get(10, SECONDS));
            assertServiceRejected(waiter, description + " waiter must reject after serialization");
        }
        finally
        {
            plan.releaseOwner();
            runtime.coordinator.clear(plan);
            if (owner != null && !owner.isDone())
            {
                owner.cancel(true);
            }
            if (waiter != null && !waiter.isDone())
            {
                waiter.cancel(true);
            }
        }
    }

    private Future<Integer> submitNamed(ExecutorService executor, String threadName,
                                        Callable<Integer> work)
    {
        return executor.submit(() -> {
            Thread.currentThread().setName(threadName);
            return work.call();
        });
    }

    private void assertServiceRejected(Future<Integer> future, String message) throws Exception
    {
        try
        {
            future.get(10, SECONDS);
            fail(message);
        }
        catch (ExecutionException error)
        {
            Throwable cause = rootCause(error);
            assertTrue(message + "; actual cause: " + cause,
                cause instanceof ServiceException);
        }
    }

    private Throwable rootCause(Throwable error)
    {
        Throwable current = error;
        while (current.getCause() != null && current.getCause() != current)
        {
            current = current.getCause();
        }
        return current;
    }

    private void assertDatabaseLockWait(MySQLContainer<?> mysql, Future<?> waiter,
                                        String description) throws Exception
    {
        long deadline = System.nanoTime() + TimeUnit.SECONDS.toNanos(10);
        try (Connection connection = DriverManager.getConnection(
            mysql.getJdbcUrl(), "root", mysql.getPassword()))
        {
            while (System.nanoTime() < deadline)
            {
                if (databaseLockWaitCount(connection) > 0)
                {
                    assertFalse(description + " waiter completed despite a recorded database lock wait",
                        waiter.isDone());
                    return;
                }
                if (waiter.isDone())
                {
                    fail(description + " waiter completed before MySQL recorded a lock wait");
                }
                // Backoff only; the assertion is the performance_schema row, not elapsed time.
                Thread.sleep(25L);
            }
        }
        fail(description + " did not appear in performance_schema.data_lock_waits");
    }

    private int databaseLockWaitCount(Connection connection) throws SQLException
    {
        String sql = "select count(*) from performance_schema.data_lock_waits waits "
            + "join performance_schema.data_locks requested "
            + "on requested.engine = waits.engine "
            + "and requested.engine_lock_id = waits.requesting_engine_lock_id "
            + "where requested.object_schema = ?";
        try (PreparedStatement statement = connection.prepareStatement(sql))
        {
            statement.setString(1, DATABASE_NAME);
            try (ResultSet resultSet = statement.executeQuery())
            {
                resultSet.next();
                return resultSet.getInt(1);
            }
        }
    }

    private MasterDataRecord newProductSeries(String name, long categoryId)
    {
        MasterDataRecord record = writableRecord(name);
        record.setCategoryId(categoryId);
        record.setCreateBy("integration-test");
        return record;
    }

    private MasterDataRecord newProductCategory(String name)
    {
        MasterDataRecord record = writableRecord(name);
        record.setCreateBy("integration-test");
        return record;
    }

    private MasterDataRecord updatedProductModel(long id, String name, long categoryId, long seriesId)
    {
        MasterDataRecord record = writableRecord(name);
        record.setId(id);
        record.setCategoryId(categoryId);
        record.setSeriesId(seriesId);
        return record;
    }

    private MasterDataRecord updatedProductSeries(long id, String name, long categoryId)
    {
        MasterDataRecord record = writableRecord(name);
        record.setId(id);
        record.setCategoryId(categoryId);
        return record;
    }

    private MasterDataRecord updatedProductCategory(long id, String name, Long parentId)
    {
        MasterDataRecord record = writableRecord(name);
        record.setId(id);
        record.setParentId(parentId);
        return record;
    }

    private MasterDataRecord writableRecord(String name)
    {
        MasterDataRecord record = new MasterDataRecord();
        record.setItemName(name);
        record.setStatus("0");
        record.setSortOrder(0);
        record.setUpdateBy("integration-test");
        return record;
    }

    private void assertFinalReferenceAndHierarchyInvariants(MySQLContainer<?> mysql) throws Exception
    {
        try (Connection connection = connect(mysql))
        {
            assertEquals("the original seven orphan checks must remain complete", 7,
                ORPHAN_VALIDATION_FIXTURES.size());
            assertAllOrphanValidationQueriesClean(connection);
            assertEquals("model.category_id must match its active series.category_id", 0,
                count(connection, MODEL_SERIES_CATEGORY_MISMATCH_QUERY));
            assertCategoryTreeHasNoCycleAndAtMostThreeLevels(connection);
        }
    }

    private void assertCategoryTreeHasNoCycleAndAtMostThreeLevels(Connection connection) throws SQLException
    {
        String sql = "with recursive category_tree as ("
            + "select category_id, parent_id, 1 as depth "
            + "from masterdata_product_category "
            + "where del_flag = '0' and parent_id is null "
            + "union all "
            + "select child.category_id, child.parent_id, tree.depth + 1 "
            + "from masterdata_product_category child "
            + "join category_tree tree on child.parent_id = tree.category_id "
            + "where child.del_flag = '0'"
            + ") select count(*), coalesce(max(depth), 0) from category_tree";
        try (Statement statement = connection.createStatement(); ResultSet resultSet = statement.executeQuery(sql))
        {
            resultSet.next();
            int treeNodeCount = resultSet.getInt(1);
            int maxDepth = resultSet.getInt(2);
            assertEquals("every active category must be reachable from a root (no detached cycle)",
                count(connection,
                    "select count(*) from masterdata_product_category where del_flag = '0'"),
                treeNodeCount);
            assertTrue("active category hierarchy must not exceed three levels; actual=" + maxDepth,
                maxDepth <= 3);
        }
    }

    private void seedReferenceGraph(Connection connection) throws SQLException
    {
        try (Statement statement = connection.createStatement())
        {
            statement.executeUpdate(
                "insert into masterdata_product_category(category_id, parent_id, category_code, category_name, "
                    + "status, sort_order, del_flag, create_by, create_time) values "
                    + "(100, null, 'PC_IT_100', 'Delete first category', '0', 0, '0', 'it', now()),"
                    + "(101, null, 'PC_IT_101', 'Child first category', '0', 0, '0', 'it', now()),"
                    + "(102, null, 'PC_IT_102', 'Referenced parent category', '0', 0, '0', 'it', now()),"
                    + "(103, 102, 'PC_IT_103', 'Referencing child category', '0', 0, '0', 'it', now()),"
                    + "(200, null, 'PC_IT_200', 'Model category', '0', 0, '0', 'it', now()),"
                    + "(201, null, 'PC_IT_201', 'Direct model reference category', '0', 0, '0', 'it', now()),"
                    + "(500, null, 'PC_IT_500', 'Series original category', '0', 0, '0', 'it', now()),"
                    + "(501, null, 'PC_IT_501', 'Series requested category', '0', 0, '0', 'it', now()),"
                    + "(600, null, 'PC_IT_600', 'Category A', '0', 0, '0', 'it', now()),"
                    + "(601, 600, 'PC_IT_601', 'Category B', '0', 0, '0', 'it', now()),"
                    + "(602, null, 'PC_IT_602', 'Category C', '0', 0, '0', 'it', now()),"
                    + "(603, null, 'PC_IT_603', 'Category D', '0', 0, '0', 'it', now())"
            );
            statement.executeUpdate(
                "insert into masterdata_product_series(series_id, category_id, series_code, series_name, status, "
                    + "sort_order, del_flag, create_by, create_time) values "
                    + "(300, 200, 'PS_IT_300', 'Delete first target', '0', 0, '0', 'it', now()),"
                    + "(301, 200, 'PS_IT_301', 'Existing source', '0', 0, '0', 'it', now()),"
                    + "(302, 200, 'PS_IT_302', 'Child first target', '0', 0, '0', 'it', now()),"
                    + "(303, 201, 'PS_IT_303', 'Deleted direct-model series', '0', 0, '2', 'it', now()),"
                    + "(510, 500, 'PS_IT_510', 'Series with active model', '0', 0, '0', 'it', now())"
            );
            statement.executeUpdate(
                "insert into masterdata_product_model(model_id, category_id, series_id, model_code, model_name, "
                    + "status, sort_order, del_flag, create_by, create_time) values "
                    + "(400, 200, 301, 'PM_IT_400', 'Delete first model', '0', 0, '0', 'it', now()),"
                    + "(401, 200, 301, 'PM_IT_401', 'Child first model', '0', 0, '0', 'it', now()),"
                    + "(402, 201, 303, 'PM_IT_402', 'Direct category model', '0', 0, '0', 'it', now()),"
                    + "(520, 500, 510, 'PM_IT_520', 'Active series model', '0', 0, '0', 'it', now())"
            );
            statement.executeUpdate(
                "insert into masterdata_material_category(category_id, category_code, category_name, status, "
                    + "sort_order, del_flag, create_by, create_time) values "
                    + "(700, 'MC_IT_700', 'Referenced material category', '0', 0, '0', 'it', now())"
            );
            statement.executeUpdate(
                "insert into masterdata_material_item(material_id, category_id, material_code, material_name, "
                    + "status, sort_order, del_flag, create_by, create_time) values "
                    + "(701, 700, 'MI_IT_701', 'Referencing material item', '0', 0, '0', 'it', now())"
            );
            statement.executeUpdate(
                "insert into masterdata_accessory_category(category_id, category_code, category_name, status, "
                    + "sort_order, del_flag, create_by, create_time) values "
                    + "(800, 'AC_IT_800', 'Referenced accessory category', '0', 0, '0', 'it', now())"
            );
            statement.executeUpdate(
                "insert into masterdata_accessory_item(accessory_id, category_id, accessory_code, accessory_name, "
                    + "status, sort_order, del_flag, create_by, create_time) values "
                    + "(801, 800, 'AI_IT_801', 'Referencing accessory item', '0', 0, '0', 'it', now())"
            );
            statement.executeUpdate(
                "insert into masterdata_sales_option_category(category_id, category_code, category_name, status, "
                    + "sort_order, del_flag, create_by, create_time) values "
                    + "(900, 'SOC_IT_900', 'Referenced sales option category', '0', 0, '0', 'it', now())"
            );
            statement.executeUpdate(
                "insert into masterdata_sales_option_value(option_id, category_id, option_code, option_name, "
                    + "status, sort_order, del_flag, create_by, create_time) values "
                    + "(901, 900, 'SOV_IT_901', 'Referencing sales option value', '0', 0, '0', 'it', now())"
            );
        }
    }

    private Connection connect(MySQLContainer<?> mysql) throws SQLException
    {
        return DriverManager.getConnection(mysql.getJdbcUrl(), mysql.getUsername(), mysql.getPassword());
    }

    private int count(Connection connection, String sql) throws SQLException
    {
        try (Statement statement = connection.createStatement(); ResultSet resultSet = statement.executeQuery(sql))
        {
            resultSet.next();
            return resultSet.getInt(1);
        }
    }

    private int resultRowCount(Connection connection, String sql) throws SQLException
    {
        int rows = 0;
        try (Statement statement = connection.createStatement(); ResultSet resultSet = statement.executeQuery(sql))
        {
            while (resultSet.next())
            {
                rows++;
            }
        }
        return rows;
    }

    private long longValue(Connection connection, String sql) throws SQLException
    {
        try (Statement statement = connection.createStatement(); ResultSet resultSet = statement.executeQuery(sql))
        {
            assertTrue("expected one database row for: " + sql, resultSet.next());
            return resultSet.getLong(1);
        }
    }

    private Long nullableLong(Connection connection, String sql) throws SQLException
    {
        try (Statement statement = connection.createStatement(); ResultSet resultSet = statement.executeQuery(sql))
        {
            assertTrue("expected one database row for: " + sql, resultSet.next());
            long value = resultSet.getLong(1);
            return resultSet.wasNull() ? null : value;
        }
    }

    private void applySql(Connection connection, String relativePath) throws Exception
    {
        try (Statement statement = connection.createStatement())
        {
            for (String command : sqlStatements(relativePath))
            {
                statement.execute(command);
            }
        }
    }

    private String sqlStatementContaining(String relativePath, String marker) throws Exception
    {
        return sqlStatements(relativePath).stream()
            .filter(statement -> statement.contains(marker))
            .findFirst()
            .orElseThrow(() -> new AssertionError(
                "SQL statement containing marker was not found: " + relativePath + " -> " + marker));
    }

    private List<String> sqlStatements(String relativePath) throws Exception
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
        return java.util.Arrays.stream(cleaned.toString().split(";"))
            .map(String::trim)
            .filter(statement -> !statement.isEmpty())
            .toList();
    }

    private Path projectRoot()
    {
        Path current = Path.of("").toAbsolutePath();
        if (Files.exists(current.resolve("sql/migrations/V20260628_005_masterdata_r10_schema.sql")))
        {
            return current;
        }
        return current.getParent();
    }

    @Configuration(proxyBeanMethods = false)
    @EnableTransactionManagement
    public static class SpringTestConfiguration
    {
        @Bean
        public DataSource dataSource(TestDatabase database)
        {
            DriverManagerDataSource dataSource = new DriverManagerDataSource();
            dataSource.setDriverClassName("com.mysql.cj.jdbc.Driver");
            dataSource.setUrl(database.jdbcUrl);
            dataSource.setUsername(database.username);
            dataSource.setPassword(database.password);
            return dataSource;
        }

        @Bean
        public PlatformTransactionManager transactionManager(DataSource dataSource)
        {
            return new DataSourceTransactionManager(dataSource);
        }

        @Bean
        public SqlSessionFactory sqlSessionFactory(DataSource dataSource) throws Exception
        {
            SqlSessionFactoryBean factory = new SqlSessionFactoryBean();
            factory.setDataSource(dataSource);
            factory.setTypeAliasesPackage("com.ruoyi.business.masterdata.domain");
            factory.setMapperLocations(new PathMatchingResourcePatternResolver()
                .getResource("classpath:mapper/masterdata/MasterDataMapper.xml"));
            return Objects.requireNonNull(factory.getObject());
        }

        @Bean
        public SqlSessionTemplate sqlSessionTemplate(SqlSessionFactory sqlSessionFactory)
        {
            return new SqlSessionTemplate(sqlSessionFactory);
        }

        @Bean(name = "realMasterDataMapper")
        public MasterDataMapper realMasterDataMapper(SqlSessionTemplate sqlSessionTemplate)
        {
            return sqlSessionTemplate.getMapper(MasterDataMapper.class);
        }

        @Bean
        public LockCoordinator lockCoordinator()
        {
            return new LockCoordinator();
        }

        @Bean
        @Primary
        public MasterDataMapper masterDataMapper(
            @Qualifier("realMasterDataMapper") MasterDataMapper realMapper,
            LockCoordinator coordinator)
        {
            return (MasterDataMapper) Proxy.newProxyInstance(
                MasterDataMapper.class.getClassLoader(),
                new Class<?>[] { MasterDataMapper.class },
                (proxy, method, args) -> invokeRealMapperThenCoordinate(realMapper, coordinator, method, args)
            );
        }

        @Bean
        public BusinessMonthlyCodeGenerator businessMonthlyCodeGenerator()
        {
            return new BusinessMonthlyCodeGenerator();
        }

        @Bean
        public IMasterDataService masterDataService()
        {
            return new MasterDataServiceImpl();
        }

        private static Object invokeRealMapperThenCoordinate(MasterDataMapper realMapper,
                                                             LockCoordinator coordinator,
                                                             Method method, Object[] args) throws Throwable
        {
            Object result;
            try
            {
                result = method.invoke(realMapper, args);
            }
            catch (InvocationTargetException error)
            {
                throw error.getCause();
            }
            coordinator.afterRealLockQuery(method, args, result);
            return result;
        }
    }

    private static final class TestRuntime implements AutoCloseable
    {
        private final AnnotationConfigApplicationContext context;
        private final IMasterDataService service;
        private final LockCoordinator coordinator;
        private final DataSource dataSource;

        private TestRuntime(AnnotationConfigApplicationContext context,
                            IMasterDataService service,
                            LockCoordinator coordinator,
                            DataSource dataSource)
        {
            this.context = context;
            this.service = service;
            this.coordinator = coordinator;
            this.dataSource = dataSource;
        }

        private static TestRuntime start(MySQLContainer<?> mysql)
        {
            AnnotationConfigApplicationContext context = new AnnotationConfigApplicationContext();
            context.getBeanFactory().registerSingleton("testDatabase",
                new TestDatabase(mysql.getJdbcUrl(), mysql.getUsername(), mysql.getPassword()));
            context.register(SpringTestConfiguration.class);
            context.refresh();

            IMasterDataService service = context.getBean(IMasterDataService.class);
            assertTrue("MasterDataServiceImpl must be wrapped by Spring transaction AOP",
                AopUtils.isAopProxy(service));

            MasterDataMapper realMapper = context.getBean("realMasterDataMapper", MasterDataMapper.class);
            assertTrue("the delegated mapper must be the real MyBatis mapper proxy",
                Proxy.isProxyClass(realMapper.getClass()));
            assertTrue("the delegated mapper invocation handler must be MyBatis",
                Proxy.getInvocationHandler(realMapper).getClass().getName().contains("MapperProxy"));

            return new TestRuntime(
                context,
                service,
                context.getBean(LockCoordinator.class),
                context.getBean(DataSource.class)
            );
        }

        @Override
        public void close()
        {
            context.close();
        }
    }

    private static final class TestDatabase
    {
        private final String jdbcUrl;
        private final String username;
        private final String password;

        private TestDatabase(String jdbcUrl, String username, String password)
        {
            this.jdbcUrl = jdbcUrl;
            this.username = username;
            this.password = password;
        }
    }

    public static final class LockCoordinator
    {
        private final AtomicReference<PausePlan> current = new AtomicReference<>();

        private void install(PausePlan plan)
        {
            assertTrue("a prior lock pause plan is still installed", current.compareAndSet(null, plan));
        }

        private void clear(PausePlan plan)
        {
            current.compareAndSet(plan, null);
        }

        private void afterRealLockQuery(Method method, Object[] args, Object result)
        {
            String methodName = method.getName();
            if (!SELECT_RECORD_FOR_UPDATE.equals(methodName)
                && !SELECT_ACTIVE_FOR_UPDATE.equals(methodName)
                && !SELECT_CATEGORY_HIERARCHY_MUTEX_FOR_UPDATE.equals(methodName))
            {
                return;
            }
            PausePlan plan = current.get();
            if (plan != null)
            {
                plan.afterRealSqlReturn(methodName, args, result);
            }
        }
    }

    private static final class PausePlan
    {
        private final String threadName;
        private final String methodName;
        private final MasterDataResource resource;
        private final Long id;
        private final AtomicBoolean triggered = new AtomicBoolean();
        private final AtomicBoolean springTransactionObserved = new AtomicBoolean();
        private final CountDownLatch realSqlReturned = new CountDownLatch(1);
        private final CountDownLatch releaseOwner = new CountDownLatch(1);

        private PausePlan(String threadName, String methodName,
                          MasterDataResource resource, Long id)
        {
            this.threadName = threadName;
            this.methodName = methodName;
            this.resource = resource;
            this.id = id;
        }

        private static PausePlan record(String threadName, MasterDataResource resource, long id)
        {
            return new PausePlan(threadName, SELECT_RECORD_FOR_UPDATE, resource, id);
        }

        private static PausePlan activeHierarchy(String threadName, MasterDataResource resource)
        {
            return new PausePlan(threadName, SELECT_ACTIVE_FOR_UPDATE, resource, null);
        }

        private static PausePlan hierarchyMutex(String threadName)
        {
            return new PausePlan(threadName, SELECT_CATEGORY_HIERARCHY_MUTEX_FOR_UPDATE, null, null);
        }

        private void afterRealSqlReturn(String actualMethod, Object[] args, Object result)
        {
            if (!Thread.currentThread().getName().equals(threadName)
                || !methodName.equals(actualMethod))
            {
                return;
            }
            boolean mutexQuery = SELECT_CATEGORY_HIERARCHY_MUTEX_FOR_UPDATE.equals(actualMethod);
            if (!mutexQuery
                && (args == null || args.length == 0 || resource != args[0]))
            {
                return;
            }
            Long actualId = SELECT_RECORD_FOR_UPDATE.equals(actualMethod) && args != null && args.length > 1
                ? (Long) args[1] : null;
            if (!Objects.equals(id, actualId) || !triggered.compareAndSet(false, true))
            {
                return;
            }
            if (mutexQuery && result == null)
            {
                throw new AssertionError("real hierarchy mutex query returned no sentinel row");
            }
            if (SELECT_RECORD_FOR_UPDATE.equals(actualMethod) && result == null)
            {
                throw new AssertionError("real selectRecordByIdForUpdate returned no active row");
            }
            if (SELECT_ACTIVE_FOR_UPDATE.equals(actualMethod)
                && (!(result instanceof List<?>) || ((List<?>) result).isEmpty()))
            {
                throw new AssertionError("real selectActiveRecordsForUpdate returned no active rows");
            }
            if (!TransactionSynchronizationManager.isActualTransactionActive())
            {
                throw new AssertionError("real mapper lock query was not inside a Spring transaction");
            }
            springTransactionObserved.set(true);
            realSqlReturned.countDown();
            try
            {
                if (!releaseOwner.await(15, SECONDS))
                {
                    throw new AssertionError("test did not release the transaction that owns the MySQL lock");
                }
            }
            catch (InterruptedException error)
            {
                Thread.currentThread().interrupt();
                throw new AssertionError("lock-owning service transaction was interrupted", error);
            }
        }

        private void awaitRealSqlReturn(String description) throws InterruptedException
        {
            assertTrue(description + " did not return from the real mapper lock query",
                realSqlReturned.await(10, SECONDS));
        }

        private void releaseOwner()
        {
            releaseOwner.countDown();
        }
    }

    private record HierarchyViolation(long parentId, int depth, String violation)
    {
    }

    private record OrphanValidationFixture(String checkName, String insertSql, String cleanupSql,
                                           long rowId, String missingIdColumn, long missingId)
    {
    }

    private static final class ReferenceDeleteCase
    {
        private final String name;
        private final MasterDataResource targetResource;
        private final long targetId;
        private final String targetTable;
        private final String targetIdColumn;
        private final long childId;
        private final String childTable;
        private final String childIdColumn;
        private final String cleanupSql;

        private ReferenceDeleteCase(String name, MasterDataResource targetResource, long targetId,
                                    String targetTable, String targetIdColumn, long childId,
                                    String childTable, String childIdColumn, String cleanupSql)
        {
            this.name = name;
            this.targetResource = targetResource;
            this.targetId = targetId;
            this.targetTable = targetTable;
            this.targetIdColumn = targetIdColumn;
            this.childId = childId;
            this.childTable = childTable;
            this.childIdColumn = childIdColumn;
            this.cleanupSql = cleanupSql;
        }
    }
}
