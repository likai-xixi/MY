package com.ruoyi.business.masterdata.domain;

import jakarta.validation.constraints.NotBlank;
import org.apache.commons.lang3.builder.ToStringBuilder;
import org.apache.commons.lang3.builder.ToStringStyle;
import com.ruoyi.common.annotation.Excel;
import com.ruoyi.common.core.domain.BaseEntity;

/**
 * 主数据配置通用记录.
 */
public class MasterDataRecord extends BaseEntity
{
    private static final long serialVersionUID = 1L;

    private Long id;

    private String resource;

    @Excel(name = "编码")
    private String itemCode;

    @Excel(name = "名称")
    private String itemName;

    private Long parentId;

    private Long categoryId;

    private Long seriesId;

    @Excel(name = "规格")
    private String spec;

    @Excel(name = "单位")
    private String unit;

    @Excel(name = "状态", readConverterExp = "0=正常,1=停用")
    private String status;

    @Excel(name = "排序")
    private Integer sortOrder;

    private String delFlag;

    public Long getId()
    {
        return id;
    }

    public void setId(Long id)
    {
        this.id = id;
    }

    public String getResource()
    {
        return resource;
    }

    public void setResource(String resource)
    {
        this.resource = resource;
    }

    public String getItemCode()
    {
        return itemCode;
    }

    public void setItemCode(String itemCode)
    {
        this.itemCode = itemCode;
    }

    @NotBlank(message = "名称不能为空")
    public String getItemName()
    {
        return itemName;
    }

    public void setItemName(String itemName)
    {
        this.itemName = itemName;
    }

    public Long getParentId()
    {
        return parentId;
    }

    public void setParentId(Long parentId)
    {
        this.parentId = parentId;
    }

    public Long getCategoryId()
    {
        return categoryId;
    }

    public void setCategoryId(Long categoryId)
    {
        this.categoryId = categoryId;
    }

    public Long getSeriesId()
    {
        return seriesId;
    }

    public void setSeriesId(Long seriesId)
    {
        this.seriesId = seriesId;
    }

    public String getSpec()
    {
        return spec;
    }

    public void setSpec(String spec)
    {
        this.spec = spec;
    }

    public String getUnit()
    {
        return unit;
    }

    public void setUnit(String unit)
    {
        this.unit = unit;
    }

    public String getStatus()
    {
        return status;
    }

    public void setStatus(String status)
    {
        this.status = status;
    }

    public Integer getSortOrder()
    {
        return sortOrder;
    }

    public void setSortOrder(Integer sortOrder)
    {
        this.sortOrder = sortOrder;
    }

    public String getDelFlag()
    {
        return delFlag;
    }

    public void setDelFlag(String delFlag)
    {
        this.delFlag = delFlag;
    }

    @Override
    public String toString()
    {
        return new ToStringBuilder(this, ToStringStyle.MULTI_LINE_STYLE)
            .append("id", getId())
            .append("resource", getResource())
            .append("itemCode", getItemCode())
            .append("itemName", getItemName())
            .append("categoryId", getCategoryId())
            .append("seriesId", getSeriesId())
            .append("status", getStatus())
            .append("sortOrder", getSortOrder())
            .toString();
    }
}
