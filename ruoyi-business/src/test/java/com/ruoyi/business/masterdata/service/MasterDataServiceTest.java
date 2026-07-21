package com.ruoyi.business.masterdata.service;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertThrows;
import static org.junit.Assert.assertTrue;

import com.ruoyi.business.common.code.BusinessMonthlyCodeGenerator;
import com.ruoyi.business.masterdata.domain.MasterDataRecord;
import com.ruoyi.business.masterdata.domain.MasterDataResource;
import com.ruoyi.business.masterdata.mapper.MasterDataMapper;
import com.ruoyi.business.masterdata.service.impl.MasterDataServiceImpl;
import com.ruoyi.common.exception.ServiceException;
import java.lang.reflect.Field;
import java.lang.reflect.InvocationHandler;
import java.lang.reflect.Method;
import java.lang.reflect.Proxy;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeoutException;
import org.junit.Test;

public class MasterDataServiceTest
{
    @Test
    public void productCategoryDeleteRejectsChildCategoryReference()
    {
        assertDeleteBlocked(
            MasterDataResource.PRODUCT_CATEGORY,
            "countActiveByParentIds",
            MasterDataResource.PRODUCT_CATEGORY
        );
    }

    @Test
    public void productCategoryDeleteRejectsProductSeriesReference()
    {
        assertDeleteBlocked(
            MasterDataResource.PRODUCT_CATEGORY,
            "countActiveByCategoryIds",
            MasterDataResource.PRODUCT_SERIES
        );
    }

    @Test
    public void productCategoryDeleteRejectsProductModelReference()
    {
        assertDeleteBlocked(
            MasterDataResource.PRODUCT_CATEGORY,
            "countActiveByCategoryIds",
            MasterDataResource.PRODUCT_MODEL
        );
    }

    @Test
    public void productSeriesDeleteRejectsProductModelReference()
    {
        assertDeleteBlocked(
            MasterDataResource.PRODUCT_SERIES,
            "countActiveBySeriesIds",
            MasterDataResource.PRODUCT_MODEL
        );
    }

    @Test
    public void materialCategoryDeleteRejectsMaterialItemReference()
    {
        assertDeleteBlocked(
            MasterDataResource.MATERIAL_CATEGORY,
            "countActiveByCategoryIds",
            MasterDataResource.MATERIAL_ITEM
        );
    }

    @Test
    public void accessoryCategoryDeleteRejectsAccessoryItemReference()
    {
        assertDeleteBlocked(
            MasterDataResource.ACCESSORY_CATEGORY,
            "countActiveByCategoryIds",
            MasterDataResource.ACCESSORY_ITEM
        );
    }

    @Test
    public void optionSetDeleteRejectsDisabledOrEnabledOptionValueReference()
    {
        assertDeleteBlocked(
            MasterDataResource.OPTION_SET,
            "countExistingByOptionSetIds",
            MasterDataResource.OPTION_VALUE
        );
    }

    @Test
    public void currentResourceVocabularyRejectsOldSalesOptionPaths()
    {
        assertEquals(
            List.of(
                "product-category",
                "product-series",
                "product-model",
                "material-category",
                "material-item",
                "accessory-category",
                "accessory-item",
                "option-set",
                "option-value"
            ),
            MasterDataResource.pathValues()
        );
        assertEquals("产品型号", MasterDataResource.PRODUCT_MODEL.getDisplayName());

        MasterDataServiceImpl service = service(new FakeMapper());
        assertThrows(
            ServiceException.class,
            () -> service.selectRecordList("sales-option-category", new MasterDataRecord())
        );
        assertThrows(
            ServiceException.class,
            () -> service.selectRecordList("sales-option-value", new MasterDataRecord())
        );
    }

    @Test
    public void optionSetRequiresExactSelectionMode()
    {
        MasterDataServiceImpl service = service(new FakeMapper());

        MasterDataRecord missing = writableRecord(null, "Missing mode");
        assertThrows(
            ServiceException.class,
            () -> service.insertRecord(MasterDataResource.OPTION_SET.getPathValue(), missing)
        );

        MasterDataRecord invalid = writableRecord(null, "Invalid mode");
        invalid.setSelectionMode("single");
        assertThrows(
            ServiceException.class,
            () -> service.insertRecord(MasterDataResource.OPTION_SET.getPathValue(), invalid)
        );

        MasterDataRecord multiple = writableRecord(null, "Multiple choice");
        multiple.setSelectionMode("MULTIPLE");
        assertEquals(1, service.insertRecord(MasterDataResource.OPTION_SET.getPathValue(), multiple));
        assertTrue(multiple.getItemCode().startsWith("OS"));
    }

    @Test
    public void optionValueRequiresAndLocksItsOptionSet()
    {
        FakeMapper mapper = new FakeMapper();
        MasterDataServiceImpl service = service(mapper);

        MasterDataRecord missing = writableRecord(null, "Missing owner");
        assertThrows(
            ServiceException.class,
            () -> service.insertRecord(MasterDataResource.OPTION_VALUE.getPathValue(), missing)
        );
        assertTrue(mapper.lockCalls.isEmpty());

        MasterDataRecord value = writableRecord(null, "Glass color");
        value.setOptionSetId(20L);
        assertEquals(1, service.insertRecord(MasterDataResource.OPTION_VALUE.getPathValue(), value));
        assertEquals(
            List.of(new LockCall(MasterDataResource.OPTION_SET, 20L)),
            mapper.lockCalls
        );
        assertEquals(List.of("lock:OPTION_SET:20", "insert"), mapper.events);
        assertTrue(value.getItemCode().startsWith("OV"));
    }

    @Test
    public void optionValueInsertRejectsMissingOptionSet()
    {
        FakeMapper mapper = new FakeMapper();
        mapper.missing(MasterDataResource.OPTION_SET, 20L);
        MasterDataRecord value = writableRecord(null, "Orphan value");
        value.setOptionSetId(20L);

        assertThrows(
            ServiceException.class,
            () -> service(mapper).insertRecord(MasterDataResource.OPTION_VALUE.getPathValue(), value)
        );
        assertEquals(
            List.of(new LockCall(MasterDataResource.OPTION_SET, 20L)),
            mapper.lockCalls
        );
        assertTrue(!mapper.events.contains("insert"));
    }

    @Test
    public void optionValueOptionsUseParentStatusAwareQuery()
    {
        FakeMapper mapper = new FakeMapper();
        MasterDataRecord value = record(30L, "OV_30", null, null);
        value.setOptionSetId(20L);
        mapper.enabledOptionValues = List.of(value);

        List<MasterDataRecord> result = service(mapper)
            .selectEnabledOptions(MasterDataResource.OPTION_VALUE.getPathValue());

        assertEquals(List.of(value), result);
        assertEquals(List.of("select-enabled-option-values"), mapper.events);
    }

    @Test
    public void optionSetDisableDoesNotCascadeToValues()
    {
        FakeMapper mapper = new FakeMapper();
        MasterDataRecord status = new MasterDataRecord();
        status.setId(20L);
        status.setStatus("1");

        assertEquals(
            1,
            service(mapper).updateRecordStatus(MasterDataResource.OPTION_SET.getPathValue(), status)
        );
        assertEquals(List.of("lock:OPTION_SET:20", "status"), mapper.events);
        assertTrue(mapper.referenceQueries.isEmpty());
    }

    @Test
    public void optionFieldsAreNormalizedByOwningResource()
    {
        FakeMapper mapper = new FakeMapper();
        MasterDataServiceImpl service = service(mapper);

        MasterDataRecord set = writableRecord(null, "Opening direction");
        set.setSelectionMode("SINGLE");
        set.setOptionSetId(99L);
        service.insertRecord(MasterDataResource.OPTION_SET.getPathValue(), set);
        assertEquals("SINGLE", set.getSelectionMode());
        assertEquals(null, set.getOptionSetId());

        MasterDataRecord value = writableRecord(null, "Left opening");
        value.setSelectionMode("MULTIPLE");
        value.setOptionSetId(20L);
        service.insertRecord(MasterDataResource.OPTION_VALUE.getPathValue(), value);
        assertEquals(null, value.getSelectionMode());
        assertEquals(Long.valueOf(20L), value.getOptionSetId());

        MasterDataRecord material = writableRecord(null, "Aluminium");
        material.setSelectionMode("SINGLE");
        material.setOptionSetId(20L);
        service.insertRecord(MasterDataResource.MATERIAL_CATEGORY.getPathValue(), material);
        assertEquals(null, material.getSelectionMode());
        assertEquals(null, material.getOptionSetId());
    }

    @Test
    public void deleteNormalizesIdsBeforeLockingAndMutation()
    {
        FakeMapper mapper = new FakeMapper();
        mapper.deleteResult = 3;
        MasterDataServiceImpl service = service(mapper);

        int result = service.deleteRecordByIds(
            MasterDataResource.PRODUCT_MODEL.getPathValue(),
            new Long[] { 9L, 3L, 9L, null, 5L },
            "tester"
        );

        assertEquals(3, result);
        assertEquals(
            List.of(
                new LockCall(MasterDataResource.PRODUCT_MODEL, 3L),
                new LockCall(MasterDataResource.PRODUCT_MODEL, 5L),
                new LockCall(MasterDataResource.PRODUCT_MODEL, 9L)
            ),
            mapper.lockCalls
        );
        assertEquals(List.of(3L, 5L, 9L), mapper.deletedIds);
        assertEquals(
            List.of(
                "lock:PRODUCT_MODEL:3",
                "lock:PRODUCT_MODEL:5",
                "lock:PRODUCT_MODEL:9",
                "delete"
            ),
            mapper.events
        );
        assertTrue(mapper.unlockedReads.isEmpty());
    }

    @Test
    public void deleteRejectsMissingTargetBeforeReferenceChecksOrMutation()
    {
        FakeMapper mapper = new FakeMapper();
        mapper.missing(MasterDataResource.PRODUCT_SERIES, 77L);
        MasterDataServiceImpl service = service(mapper);

        assertThrows(
            ServiceException.class,
            () -> service.deleteRecordByIds(
                MasterDataResource.PRODUCT_SERIES.getPathValue(),
                new Long[] { 77L },
                "tester"
            )
        );

        assertEquals(
            List.of(new LockCall(MasterDataResource.PRODUCT_SERIES, 77L)),
            mapper.lockCalls
        );
        assertTrue(mapper.referenceQueries.isEmpty());
        assertEquals(0, mapper.deleteCalls);
        assertTrue(mapper.unlockedReads.isEmpty());
    }

    @Test
    public void productModelInsertLocksReferencedParentsInGlobalOrder()
    {
        FakeMapper mapper = new FakeMapper();
        mapper.putRecord(
            MasterDataResource.PRODUCT_SERIES,
            20L,
            record(20L, "SERIES_20", 10L, null)
        );
        MasterDataServiceImpl service = service(mapper);
        MasterDataRecord model = writableRecord(null, "Model");
        model.setCategoryId(10L);
        model.setSeriesId(20L);

        assertEquals(1, service.insertRecord(MasterDataResource.PRODUCT_MODEL.getPathValue(), model));

        assertEquals(
            List.of(
                new LockCall(MasterDataResource.PRODUCT_CATEGORY, 10L),
                new LockCall(MasterDataResource.PRODUCT_SERIES, 20L)
            ),
            mapper.lockCalls
        );
        assertEquals(
            List.of("lock:PRODUCT_CATEGORY:10", "lock:PRODUCT_SERIES:20", "insert"),
            mapper.events
        );
        assertTrue(mapper.unlockedReads.isEmpty());
    }

    @Test
    public void productModelUpdateLocksParentsAndTargetInGlobalOrder()
    {
        FakeMapper mapper = new FakeMapper();
        mapper.putRecord(
            MasterDataResource.PRODUCT_SERIES,
            20L,
            record(20L, "SERIES_20", 10L, null)
        );
        mapper.putRecord(
            MasterDataResource.PRODUCT_MODEL,
            30L,
            record(30L, "MODEL_30", 10L, 20L)
        );
        MasterDataServiceImpl service = service(mapper);
        MasterDataRecord model = writableRecord(30L, "Updated model");
        model.setCategoryId(10L);
        model.setSeriesId(20L);

        assertEquals(1, service.updateRecord(MasterDataResource.PRODUCT_MODEL.getPathValue(), model));

        assertEquals(
            List.of(
                new LockCall(MasterDataResource.PRODUCT_CATEGORY, 10L),
                new LockCall(MasterDataResource.PRODUCT_SERIES, 20L),
                new LockCall(MasterDataResource.PRODUCT_MODEL, 30L)
            ),
            mapper.lockCalls
        );
        assertEquals(
            List.of(
                "lock:PRODUCT_CATEGORY:10",
                "lock:PRODUCT_SERIES:20",
                "lock:PRODUCT_MODEL:30",
                "update"
            ),
            mapper.events
        );
        assertTrue(mapper.unlockedReads.isEmpty());
    }

    @Test
    public void productSeriesCategoryChangeRejectsActiveProductModels()
    {
        FakeMapper mapper = new FakeMapper();
        mapper.putRecord(
            MasterDataResource.PRODUCT_SERIES,
            20L,
            record(20L, "SERIES_20", 10L, null)
        );
        mapper.blockedReference = new ReferenceQuery(
            "countActiveBySeriesIds",
            MasterDataResource.PRODUCT_MODEL,
            List.of(20L)
        );
        MasterDataServiceImpl service = service(mapper);
        MasterDataRecord series = writableRecord(20L, "Moved series");
        series.setCategoryId(11L);

        assertThrows(
            ServiceException.class,
            () -> service.updateRecord(MasterDataResource.PRODUCT_SERIES.getPathValue(), series)
        );

        assertEquals(
            List.of(
                new LockCall(MasterDataResource.PRODUCT_CATEGORY, 11L),
                new LockCall(MasterDataResource.PRODUCT_SERIES, 20L)
            ),
            mapper.lockCalls
        );
        assertTrue(mapper.referenceQueries.contains(mapper.blockedReference));
        assertTrue("series update must not run after a referenced category move", !mapper.events.contains("update"));
        assertTrue(mapper.unlockedReads.isEmpty());
    }

    @Test
    public void productSeriesCategoryUnchangedDoesNotRejectActiveProductModels()
    {
        FakeMapper mapper = new FakeMapper();
        mapper.putRecord(
            MasterDataResource.PRODUCT_SERIES,
            20L,
            record(20L, "SERIES_20", 10L, null)
        );
        mapper.blockedReference = new ReferenceQuery(
            "countActiveBySeriesIds",
            MasterDataResource.PRODUCT_MODEL,
            List.of(20L)
        );
        MasterDataServiceImpl service = service(mapper);
        MasterDataRecord series = writableRecord(20L, "Renamed series");
        series.setCategoryId(10L);

        assertEquals(1, service.updateRecord(MasterDataResource.PRODUCT_SERIES.getPathValue(), series));
        assertTrue(mapper.referenceQueries.isEmpty());
        assertTrue(mapper.events.contains("update"));
    }

    @Test
    public void productCategoryUpdateLocksSameResourceIdsAscending()
    {
        FakeMapper mapper = new FakeMapper();
        mapper.putRecord(
            MasterDataResource.PRODUCT_CATEGORY,
            3L,
            record(3L, "CATEGORY_3", null, null)
        );
        mapper.putRecord(
            MasterDataResource.PRODUCT_CATEGORY,
            9L,
            record(9L, "CATEGORY_9", null, null)
        );
        MasterDataServiceImpl service = service(mapper);
        MasterDataRecord category = writableRecord(9L, "Moved category");
        category.setParentId(3L);

        assertEquals(1, service.updateRecord(MasterDataResource.PRODUCT_CATEGORY.getPathValue(), category));

        assertEquals(
            List.of(
                new LockCall(MasterDataResource.PRODUCT_CATEGORY, 3L),
                new LockCall(MasterDataResource.PRODUCT_CATEGORY, 9L)
            ),
            mapper.lockCalls
        );
        assertEquals(
            List.of(
                "lock-mutex:PRODUCT_CATEGORY",
                "lock-tree:PRODUCT_CATEGORY",
                "lock:PRODUCT_CATEGORY:3",
                "lock:PRODUCT_CATEGORY:9",
                "update"
            ),
            mapper.events
        );
        assertTrue(mapper.unlockedReads.isEmpty());
    }

    @Test
    public void productCategoryInsertFailsClosedWhenHierarchyMutexIsMissing()
    {
        FakeMapper mapper = new FakeMapper();
        mapper.hierarchyMutexId = null;
        MasterDataRecord category = writableRecord(null, "First category");

        assertThrows(
            ServiceException.class,
            () -> service(mapper).insertRecord(MasterDataResource.PRODUCT_CATEGORY.getPathValue(), category)
        );

        assertEquals(List.of("lock-mutex:PRODUCT_CATEGORY"), mapper.events);
        assertTrue("the active tree must not be read without the permanent mutex", mapper.lockCalls.isEmpty());
        assertTrue("category insert must not run without the permanent mutex", !mapper.events.contains("insert"));
    }

    @Test
    public void existingProductCategoryCycleFailsClosedWithinBoundedTime() throws Exception
    {
        FakeMapper mapper = new FakeMapper();
        MasterDataRecord categoryA = record(41L, "CATEGORY_41", null, null);
        categoryA.setParentId(42L);
        MasterDataRecord categoryB = record(42L, "CATEGORY_42", null, null);
        categoryB.setParentId(41L);
        mapper.putRecord(MasterDataResource.PRODUCT_CATEGORY, 41L, categoryA);
        mapper.putRecord(MasterDataResource.PRODUCT_CATEGORY, 42L, categoryB);
        mapper.putRecord(
            MasterDataResource.PRODUCT_CATEGORY,
            43L,
            record(43L, "CATEGORY_43", null, null)
        );

        MasterDataRecord requested = writableRecord(41L, "Move cyclic category");
        requested.setParentId(43L);
        ExecutorService executor = Executors.newSingleThreadExecutor(task -> {
            Thread thread = new Thread(task, "masterdata-cycle-timeout-probe");
            thread.setDaemon(true);
            return thread;
        });
        Future<Integer> update = executor.submit(
            () -> service(mapper).updateRecord(MasterDataResource.PRODUCT_CATEGORY.getPathValue(), requested)
        );

        try
        {
            update.get(1, java.util.concurrent.TimeUnit.SECONDS);
            throw new AssertionError("a pre-existing product-category cycle must fail closed");
        }
        catch (ExecutionException error)
        {
            Throwable cause = error.getCause();
            assertTrue("cycle rejection must be a business error", cause instanceof ServiceException);
            assertTrue("cycle rejection must explain the hierarchy cycle",
                cause.getMessage() != null && cause.getMessage().contains("循环"));
        }
        catch (TimeoutException error)
        {
            throw new AssertionError("cycle validation exceeded the bounded timeout", error);
        }
        finally
        {
            update.cancel(true);
            executor.shutdownNow();
            assertTrue(
                "cycle timeout probe did not terminate",
                executor.awaitTermination(1, java.util.concurrent.TimeUnit.SECONDS)
            );
        }
    }

    @Test
    public void insertRejectsAffectedRowCountMismatch()
    {
        FakeMapper mapper = new FakeMapper();
        mapper.insertResult = 0;
        MasterDataRecord item = writableRecord(null, "Material category");

        assertThrows(
            ServiceException.class,
            () -> service(mapper).insertRecord(MasterDataResource.MATERIAL_CATEGORY.getPathValue(), item)
        );
    }

    @Test
    public void updateRejectsAffectedRowCountMismatch()
    {
        FakeMapper mapper = new FakeMapper();
        mapper.updateResult = 2;
        MasterDataRecord item = writableRecord(5L, "Material category");

        assertThrows(
            ServiceException.class,
            () -> service(mapper).updateRecord(MasterDataResource.MATERIAL_CATEGORY.getPathValue(), item)
        );
    }

    @Test
    public void statusUpdateRejectsAffectedRowCountMismatch()
    {
        FakeMapper mapper = new FakeMapper();
        mapper.statusResult = 0;
        MasterDataRecord status = new MasterDataRecord();
        status.setId(30L);
        status.setStatus("1");

        assertThrows(
            ServiceException.class,
            () -> service(mapper).updateRecordStatus(MasterDataResource.PRODUCT_MODEL.getPathValue(), status)
        );
    }

    @Test
    public void statusUpdateLocksTargetBeforeMutation()
    {
        FakeMapper mapper = new FakeMapper();
        MasterDataServiceImpl service = service(mapper);
        MasterDataRecord status = new MasterDataRecord();
        status.setId(30L);
        status.setStatus("1");

        assertEquals(1, service.updateRecordStatus(MasterDataResource.PRODUCT_MODEL.getPathValue(), status));

        assertEquals(
            List.of(new LockCall(MasterDataResource.PRODUCT_MODEL, 30L)),
            mapper.lockCalls
        );
        assertEquals(List.of("lock:PRODUCT_MODEL:30", "status"), mapper.events);
        assertTrue(mapper.unlockedReads.isEmpty());
    }

    @Test
    public void deleteRejectsAffectedRowCountMismatch()
    {
        FakeMapper mapper = new FakeMapper();
        mapper.deleteResult = 1;
        MasterDataServiceImpl service = service(mapper);

        assertThrows(
            ServiceException.class,
            () -> service.deleteRecordByIds(
                MasterDataResource.PRODUCT_MODEL.getPathValue(),
                new Long[] { 5L, 3L },
                "tester"
            )
        );

        assertEquals(
            List.of(
                new LockCall(MasterDataResource.PRODUCT_MODEL, 3L),
                new LockCall(MasterDataResource.PRODUCT_MODEL, 5L)
            ),
            mapper.lockCalls
        );
        assertEquals(List.of(3L, 5L), mapper.deletedIds);
        assertEquals(1, mapper.deleteCalls);
        assertTrue(mapper.unlockedReads.isEmpty());
    }

    private static void assertDeleteBlocked(
        MasterDataResource target,
        String countMethod,
        MasterDataResource childResource)
    {
        FakeMapper mapper = new FakeMapper();
        ReferenceQuery blocked = new ReferenceQuery(countMethod, childResource, List.of(10L));
        mapper.blockedReference = blocked;
        MasterDataServiceImpl service = service(mapper);

        assertThrows(
            ServiceException.class,
            () -> service.deleteRecordByIds(
                target.getPathValue(),
                new Long[] { 10L },
                "tester"
            )
        );

        assertEquals(List.of(new LockCall(target, 10L)), mapper.lockCalls);
        assertTrue(mapper.referenceQueries.contains(blocked));
        assertEquals(0, mapper.deleteCalls);
        assertTrue(mapper.unlockedReads.isEmpty());
        int firstReference = firstEventIndex(mapper.events, "count:");
        int lastLock = lastEventIndex(mapper.events, "lock:");
        assertTrue("target locks must precede reference queries", lastLock >= 0 && lastLock < firstReference);
    }

    private static MasterDataServiceImpl service(FakeMapper mapper)
    {
        MasterDataServiceImpl service = new MasterDataServiceImpl();
        inject(service, "masterDataMapper", mapper.proxy());
        inject(service, "codeGenerator", new BusinessMonthlyCodeGenerator());
        return service;
    }

    private static void inject(Object target, String fieldName, Object value)
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

    private static MasterDataRecord writableRecord(Long id, String name)
    {
        MasterDataRecord record = new MasterDataRecord();
        record.setId(id);
        record.setItemName(name);
        record.setStatus("0");
        return record;
    }

    private static MasterDataRecord record(
        Long id,
        String code,
        Long categoryId,
        Long seriesId)
    {
        MasterDataRecord record = writableRecord(id, "Existing " + id);
        record.setItemCode(code);
        record.setCategoryId(categoryId);
        record.setSeriesId(seriesId);
        record.setDelFlag("0");
        return record;
    }

    private static int firstEventIndex(List<String> events, String prefix)
    {
        for (int i = 0; i < events.size(); i++)
        {
            if (events.get(i).startsWith(prefix))
            {
                return i;
            }
        }
        return -1;
    }

    private static int lastEventIndex(List<String> events, String prefix)
    {
        for (int i = events.size() - 1; i >= 0; i--)
        {
            if (events.get(i).startsWith(prefix))
            {
                return i;
            }
        }
        return -1;
    }

    private record LockCall(MasterDataResource resource, Long id)
    {
    }

    private record ReferenceQuery(String method, MasterDataResource childResource, List<Long> ids)
    {
    }

    private static final class FakeMapper implements InvocationHandler
    {
        private final List<LockCall> lockCalls = new ArrayList<>();
        private final List<LockCall> unlockedReads = new ArrayList<>();
        private final List<ReferenceQuery> referenceQueries = new ArrayList<>();
        private final List<String> events = new ArrayList<>();
        private final Map<LockCall, MasterDataRecord> records = new HashMap<>();
        private final Set<LockCall> missingRecords = new HashSet<>();
        private ReferenceQuery blockedReference;
        private List<Long> deletedIds = Collections.emptyList();
        private int deleteCalls;
        private Integer deleteResult;
        private int insertResult = 1;
        private int updateResult = 1;
        private int statusResult = 1;
        private Long hierarchyMutexId = -1L;
        private List<MasterDataRecord> enabledOptionValues = Collections.emptyList();

        private MasterDataMapper proxy()
        {
            return (MasterDataMapper) Proxy.newProxyInstance(
                MasterDataMapper.class.getClassLoader(),
                new Class<?>[] { MasterDataMapper.class },
                this
            );
        }

        private void missing(MasterDataResource resource, Long id)
        {
            missingRecords.add(new LockCall(resource, id));
        }

        private void putRecord(MasterDataResource resource, Long id, MasterDataRecord record)
        {
            records.put(new LockCall(resource, id), record);
        }

        @Override
        public Object invoke(Object proxy, Method method, Object[] args)
        {
            String name = method.getName();
            if ("selectRecordByIdForUpdate".equals(name) || "selectRecordById".equals(name))
            {
                MasterDataResource resource = (MasterDataResource) args[0];
                Long id = (Long) args[1];
                LockCall call = new LockCall(resource, id);
                if ("selectRecordByIdForUpdate".equals(name))
                {
                    lockCalls.add(call);
                    events.add("lock:" + resource.name() + ":" + id);
                }
                else
                {
                    unlockedReads.add(call);
                }
                if (missingRecords.contains(call))
                {
                    return null;
                }
                return records.getOrDefault(call, defaultRecord(resource, id));
            }
            if (name.startsWith("countActiveBy") || "countExistingByOptionSetIds".equals(name))
            {
                MasterDataResource childResource = (MasterDataResource) args[0];
                List<Long> ids = longIds(args[1]);
                ReferenceQuery query = new ReferenceQuery(name, childResource, ids);
                referenceQueries.add(query);
                events.add("count:" + name + ":" + childResource.name());
                return query.equals(blockedReference) ? 1 : 0;
            }
            if ("selectActiveRecordsForUpdate".equals(name))
            {
                MasterDataResource resource = (MasterDataResource) args[0];
                events.add("lock-tree:" + resource.name());
                return records.entrySet().stream()
                    .filter(entry -> entry.getKey().resource() == resource)
                    .sorted(Map.Entry.comparingByKey((left, right) -> Long.compare(left.id(), right.id())))
                    .map(Map.Entry::getValue)
                    .toList();
            }
            if ("selectProductCategoryHierarchyMutexForUpdate".equals(name))
            {
                events.add("lock-mutex:PRODUCT_CATEGORY");
                return hierarchyMutexId;
            }
            if ("selectRecordList".equals(name))
            {
                return Collections.emptyList();
            }
            if ("selectEnabledOptionValues".equals(name))
            {
                events.add("select-enabled-option-values");
                return enabledOptionValues;
            }
            if ("selectMaxCodeByMonth".equals(name))
            {
                return null;
            }
            if ("insertRecord".equals(name))
            {
                events.add("insert");
                return insertResult;
            }
            if ("updateRecord".equals(name))
            {
                events.add("update");
                return updateResult;
            }
            if ("updateRecordStatus".equals(name))
            {
                events.add("status");
                return statusResult;
            }
            if ("deleteRecordByIds".equals(name))
            {
                deleteCalls++;
                deletedIds = longIds(args[1]);
                events.add("delete");
                return deleteResult == null ? deletedIds.size() : deleteResult;
            }
            if ("toString".equals(name))
            {
                return "FakeMasterDataMapper";
            }
            if ("hashCode".equals(name))
            {
                return System.identityHashCode(proxy);
            }
            if ("equals".equals(name))
            {
                return proxy == args[0];
            }
            return defaultValue(method.getReturnType());
        }

        private static MasterDataRecord defaultRecord(MasterDataResource resource, Long id)
        {
            Long categoryId = resource == MasterDataResource.PRODUCT_SERIES ? 10L : null;
            return record(id, resource.name() + "_" + id, categoryId, null);
        }

        private static List<Long> longIds(Object value)
        {
            List<Long> ids = new ArrayList<>();
            if (value instanceof Long[] array)
            {
                ids.addAll(Arrays.asList(array));
            }
            else if (value instanceof Iterable<?> iterable)
            {
                for (Object item : iterable)
                {
                    ids.add((Long) item);
                }
            }
            else
            {
                throw new AssertionError("Unsupported id container: " + value);
            }
            return ids;
        }

        private static Object defaultValue(Class<?> type)
        {
            if (!type.isPrimitive() || Void.TYPE.equals(type))
            {
                return null;
            }
            if (Boolean.TYPE.equals(type))
            {
                return false;
            }
            if (Byte.TYPE.equals(type))
            {
                return (byte) 0;
            }
            if (Short.TYPE.equals(type))
            {
                return (short) 0;
            }
            if (Integer.TYPE.equals(type))
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
            if (Character.TYPE.equals(type))
            {
                return '\0';
            }
            throw new AssertionError("Unsupported primitive type: " + type);
        }
    }
}
