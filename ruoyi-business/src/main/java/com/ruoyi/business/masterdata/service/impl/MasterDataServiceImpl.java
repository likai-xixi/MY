package com.ruoyi.business.masterdata.service.impl;

import java.util.List;
import java.util.Locale;
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
