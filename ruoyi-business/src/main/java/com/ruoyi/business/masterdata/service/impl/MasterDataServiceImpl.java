package com.ruoyi.business.masterdata.service.impl;

import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.regex.Pattern;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.ruoyi.business.common.code.BusinessMonthlyCodeGenerator;
import com.ruoyi.business.masterdata.domain.MasterDataRecord;
import com.ruoyi.business.masterdata.domain.MasterDataResource;
import com.ruoyi.business.masterdata.mapper.MasterDataMapper;
import com.ruoyi.business.masterdata.service.IMasterDataService;
import com.ruoyi.common.exception.ServiceException;
import com.ruoyi.common.utils.StringUtils;

/**
 * 主数据配置 服务实现.
 */
@Service
public class MasterDataServiceImpl implements IMasterDataService
{
    private static final String NORMAL = "0";
    private static final String DISABLED = "1";
    private static final String DELETED = "2";
    private static final int CODE_RETRY_LIMIT = 8;
    private static final int PRODUCT_CATEGORY_MAX_DEPTH = 3;
    private static final Pattern CODE_PATTERN = Pattern.compile("^[A-Z0-9_]+$");

    @Autowired
    private MasterDataMapper masterDataMapper;

    @Autowired
    private BusinessMonthlyCodeGenerator codeGenerator;

    @Override
    public List<MasterDataRecord> selectRecordList(String resource, MasterDataRecord record)
    {
        MasterDataResource target = resolve(resource);
        normalizeQuery(record);
        return masterDataMapper.selectRecordList(target, record);
    }

    @Override
    public List<MasterDataRecord> selectEnabledOptions(String resource)
    {
        MasterDataRecord query = new MasterDataRecord();
        query.setStatus(NORMAL);
        return selectRecordList(resource, query);
    }

    @Override
    public MasterDataRecord selectRecordById(String resource, Long id)
    {
        MasterDataRecord record = masterDataMapper.selectRecordById(resolve(resource), id);
        if (record == null)
        {
            throw new ServiceException("主数据不存在或已删除");
        }
        record.setResource(resource);
        return record;
    }

    @Override
    @Transactional
    public int insertRecord(String resource, MasterDataRecord record)
    {
        MasterDataResource target = resolve(resource);
        normalizeForSave(target, record, true);
        if (record.getStatus() == null)
        {
            record.setStatus(NORMAL);
        }
        record.setDelFlag(NORMAL);
        if (record.getSortOrder() == null)
        {
            record.setSortOrder(0);
        }
        validateReferences(target, record);
        validateProductCategoryHierarchy(target, record);
        return insertRecordWithGeneratedCode(target, record);
    }

    @Override
    @Transactional
    public int updateRecord(String resource, MasterDataRecord record)
    {
        MasterDataResource target = resolve(resource);
        if (record == null || record.getId() == null)
        {
            throw new ServiceException("主数据ID不能为空");
        }
        MasterDataRecord existing = requiredRecord(target, record.getId());
        record.setItemCode(existing.getItemCode());
        normalizeForSave(target, record, false);
        validateReferences(target, record);
        validateProductCategoryHierarchy(target, record);
        return masterDataMapper.updateRecord(target, record);
    }

    @Override
    @Transactional
    public int updateRecordStatus(String resource, MasterDataRecord record)
    {
        MasterDataResource target = resolve(resource);
        if (record == null || record.getId() == null)
        {
            throw new ServiceException("主数据ID不能为空");
        }
        assertStatus(record.getStatus());
        requiredRecord(target, record.getId());
        return masterDataMapper.updateRecordStatus(target, record);
    }

    @Override
    @Transactional
    public int deleteRecordByIds(String resource, Long[] ids, String updateBy)
    {
        MasterDataResource target = resolve(resource);
        if (ids == null || ids.length == 0)
        {
            throw new ServiceException("请选择要删除的主数据");
        }
        for (Long id : ids)
        {
            requiredRecord(target, id);
        }
        assertNoProductCategoryChildren(target, ids);
        return masterDataMapper.deleteRecordByIds(target, ids, updateBy);
    }

    private MasterDataResource resolve(String resource)
    {
        try
        {
            return MasterDataResource.fromPath(resource);
        }
        catch (IllegalArgumentException e)
        {
            throw new ServiceException("不支持的主数据对象：" + resource);
        }
    }

    private MasterDataRecord requiredRecord(MasterDataResource resource, Long id)
    {
        MasterDataRecord existing = masterDataMapper.selectRecordById(resource, id);
        if (existing == null)
        {
            throw new ServiceException(resource.getDisplayName() + "不存在或已删除");
        }
        return existing;
    }

    private void normalizeQuery(MasterDataRecord record)
    {
        if (record == null)
        {
            return;
        }
        record.setItemCode(trimToNull(record.getItemCode()));
        record.setItemName(trimToNull(record.getItemName()));
        record.setStatus(trimToNull(record.getStatus()));
    }

    private void normalizeForSave(MasterDataResource resource, MasterDataRecord record, boolean create)
    {
        if (record == null)
        {
            throw new ServiceException("主数据不能为空");
        }
        record.setItemCode(create ? null : upperCode(record.getItemCode()));
        record.setItemName(trimToNull(record.getItemName()));
        record.setSpec(resource.isSpecEnabled() ? trimToNull(record.getSpec()) : null);
        record.setUnit(resource.isUnitEnabled() ? trimToNull(record.getUnit()) : null);
        record.setParentId(resource.isParentScoped() ? normalizeParentId(record.getParentId()) : null);
        record.setStatus(defaultStatus(record.getStatus()));
        record.setDelFlag(create ? NORMAL : record.getDelFlag());
        if (record.getSortOrder() == null)
        {
            record.setSortOrder(0);
        }
        assertRequired(record.getItemName(), "名称不能为空");
        if (!create)
        {
            assertRequired(record.getItemCode(), "编码不能为空");
            if (!CODE_PATTERN.matcher(record.getItemCode()).matches())
            {
                throw new ServiceException("编码只能使用大写英文、数字和下划线");
            }
        }
        assertStatus(record.getStatus());
    }

    private int insertRecordWithGeneratedCode(MasterDataResource resource, MasterDataRecord record)
    {
        for (int attempt = 0; attempt < CODE_RETRY_LIMIT; attempt++)
        {
            record.setItemCode(nextRecordCode(resource));
            try
            {
                return masterDataMapper.insertRecord(resource, record);
            }
            catch (DuplicateKeyException e)
            {
                if (attempt == CODE_RETRY_LIMIT - 1)
                {
                    throw new ServiceException(resource.getDisplayName() + "编码生成冲突，请重试");
                }
            }
        }
        throw new ServiceException(resource.getDisplayName() + "编码生成失败，请重试");
    }

    private String nextRecordCode(MasterDataResource resource)
    {
        String monthPrefix = codeGenerator.currentMonthPrefix(codePrefix(resource));
        String maxCode = masterDataMapper.selectMaxCodeByMonth(resource, monthPrefix);
        return codeGenerator.nextCode(monthPrefix, maxCode);
    }

    private String codePrefix(MasterDataResource resource)
    {
        return switch (resource)
        {
            case PRODUCT_CATEGORY -> "PC";
            case PRODUCT_SERIES -> "PS";
            case PRODUCT_MODEL -> "PM";
            case MATERIAL_CATEGORY -> "MC";
            case MATERIAL_ITEM -> "MI";
            case ACCESSORY_CATEGORY -> "AC";
            case ACCESSORY_ITEM -> "AI";
            case SALES_OPTION_CATEGORY -> "SOC";
            case SALES_OPTION_VALUE -> "SOV";
        };
    }

    private void validateReferences(MasterDataResource resource, MasterDataRecord record)
    {
        if (resource.isParentScoped() && record.getParentId() != null)
        {
            MasterDataRecord parent = requiredRecord(resource, record.getParentId());
            if (record.getId() != null && record.getId().equals(parent.getId()))
            {
                throw new ServiceException("上级分类不能选择自己");
            }
        }
        if (resource.isCategoryScoped())
        {
            assertRequired(record.getCategoryId(), resource.getDisplayName() + "所属分类不能为空");
            requiredRecord(resource.categoryResource(), record.getCategoryId());
        }
        if (resource.isSeriesScoped())
        {
            assertRequired(record.getSeriesId(), "产品型号所属系列不能为空");
            MasterDataRecord series = requiredRecord(MasterDataResource.PRODUCT_SERIES, record.getSeriesId());
            if (record.getCategoryId() != null && series.getCategoryId() != null && !record.getCategoryId().equals(series.getCategoryId()))
            {
                throw new ServiceException("产品型号所属分类必须与所属系列一致");
            }
        }
    }

    private void validateProductCategoryHierarchy(MasterDataResource resource, MasterDataRecord record)
    {
        if (resource != MasterDataResource.PRODUCT_CATEGORY)
        {
            return;
        }
        Long id = record.getId();
        Long parentId = normalizeParentId(record.getParentId());
        record.setParentId(parentId);
        if (id != null && id.equals(parentId))
        {
            throw new ServiceException("产品分类的上级分类不能选择自己");
        }

        List<MasterDataRecord> categories = masterDataMapper.selectRecordList(resource, new MasterDataRecord());
        Map<Long, MasterDataRecord> byId = recordsById(categories);
        Map<Long, List<MasterDataRecord>> childrenByParent = childrenByParent(categories);
        if (id != null && parentId != null && isDescendant(parentId, id, childrenByParent))
        {
            throw new ServiceException("产品分类的上级分类不能选择自己的子级或后代");
        }

        int parentDepth = parentId == null ? 0 : hierarchyDepth(parentId, byId);
        int subtreeHeight = id == null ? 1 : subtreeHeight(id, childrenByParent, new HashSet<>());
        if (parentDepth + subtreeHeight > PRODUCT_CATEGORY_MAX_DEPTH)
        {
            throw new ServiceException("产品分类最多只允许3级");
        }
    }

    private void assertNoProductCategoryChildren(MasterDataResource resource, Long[] ids)
    {
        if (resource != MasterDataResource.PRODUCT_CATEGORY)
        {
            return;
        }
        Set<Long> deletedIds = new HashSet<>();
        for (Long id : ids)
        {
            deletedIds.add(id);
        }
        List<MasterDataRecord> categories = masterDataMapper.selectRecordList(resource, new MasterDataRecord());
        for (MasterDataRecord category : categories)
        {
            Long parentId = normalizeParentId(category.getParentId());
            if (parentId != null && deletedIds.contains(parentId))
            {
                throw new ServiceException("产品分类存在子分类，不能删除父分类");
            }
        }
    }

    private Map<Long, MasterDataRecord> recordsById(List<MasterDataRecord> records)
    {
        Map<Long, MasterDataRecord> byId = new HashMap<>();
        for (MasterDataRecord record : records)
        {
            byId.put(record.getId(), record);
        }
        return byId;
    }

    private Map<Long, List<MasterDataRecord>> childrenByParent(List<MasterDataRecord> records)
    {
        Map<Long, List<MasterDataRecord>> childrenByParent = new HashMap<>();
        for (MasterDataRecord record : records)
        {
            Long parentId = normalizeParentId(record.getParentId());
            if (parentId != null)
            {
                childrenByParent.computeIfAbsent(parentId, key -> new ArrayList<>()).add(record);
            }
        }
        return childrenByParent;
    }

    private boolean isDescendant(Long candidateId, Long rootId, Map<Long, List<MasterDataRecord>> childrenByParent)
    {
        ArrayDeque<Long> stack = new ArrayDeque<>();
        stack.add(rootId);
        while (!stack.isEmpty())
        {
            Long currentId = stack.removeFirst();
            for (MasterDataRecord child : childrenByParent.getOrDefault(currentId, List.of()))
            {
                if (candidateId.equals(child.getId()))
                {
                    return true;
                }
                stack.add(child.getId());
            }
        }
        return false;
    }

    private int hierarchyDepth(Long id, Map<Long, MasterDataRecord> byId)
    {
        int depth = 0;
        Long currentId = id;
        Set<Long> visited = new HashSet<>();
        while (currentId != null)
        {
            if (!visited.add(currentId))
            {
                throw new ServiceException("产品分类层级存在循环");
            }
            MasterDataRecord current = byId.get(currentId);
            if (current == null)
            {
                break;
            }
            depth++;
            currentId = normalizeParentId(current.getParentId());
        }
        return depth;
    }

    private int subtreeHeight(Long id, Map<Long, List<MasterDataRecord>> childrenByParent, Set<Long> visited)
    {
        if (!visited.add(id))
        {
            throw new ServiceException("产品分类层级存在循环");
        }
        int height = 1;
        for (MasterDataRecord child : childrenByParent.getOrDefault(id, List.of()))
        {
            height = Math.max(height, 1 + subtreeHeight(child.getId(), childrenByParent, visited));
        }
        return height;
    }

    private void assertUniqueCode(MasterDataResource resource, MasterDataRecord record)
    {
        int count = masterDataMapper.countCode(resource, record.getId(), record.getItemCode());
        if (count > 0)
        {
            throw new ServiceException(resource.getDisplayName() + "编码已存在");
        }
    }

    private String defaultStatus(String status)
    {
        return StringUtils.isEmpty(status) ? NORMAL : status;
    }

    private void assertStatus(String status)
    {
        if (!NORMAL.equals(status) && !DISABLED.equals(status))
        {
            throw new ServiceException("状态只能为正常或停用");
        }
    }

    private void assertRequired(String value, String message)
    {
        if (StringUtils.isEmpty(value))
        {
            throw new ServiceException(message);
        }
    }

    private void assertRequired(Long value, String message)
    {
        if (value == null)
        {
            throw new ServiceException(message);
        }
    }

    private String upperCode(String value)
    {
        String trimmed = trimToNull(value);
        return trimmed == null ? null : trimmed.toUpperCase(Locale.ROOT);
    }

    private Long normalizeParentId(Long value)
    {
        return value == null || value <= 0 ? null : value;
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
}
