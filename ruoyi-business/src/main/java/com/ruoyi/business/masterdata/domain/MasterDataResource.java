package com.ruoyi.business.masterdata.domain;

import java.util.Arrays;
import java.util.List;

/**
 * R-10B masterdata resources.
 */
public enum MasterDataResource
{
    PRODUCT_CATEGORY("product-category", "产品分类", "masterdata_product_category", "category_id", "category_code", "category_name", true, false, false, false, false),
    PRODUCT_SERIES("product-series", "产品系列", "masterdata_product_series", "series_id", "series_code", "series_name", false, true, false, false, false),
    PRODUCT_MODEL("product-model", "产品型号", "masterdata_product_model", "model_id", "model_code", "model_name", false, true, true, false, false),
    MATERIAL_CATEGORY("material-category", "物料分类", "masterdata_material_category", "category_id", "category_code", "category_name", false, false, false, false, false),
    MATERIAL_ITEM("material-item", "物料档案", "masterdata_material_item", "material_id", "material_code", "material_name", false, true, false, true, true),
    ACCESSORY_CATEGORY("accessory-category", "配件分类", "masterdata_accessory_category", "category_id", "category_code", "category_name", false, false, false, false, false),
    ACCESSORY_ITEM("accessory-item", "配件档案", "masterdata_accessory_item", "accessory_id", "accessory_code", "accessory_name", false, true, false, true, true),
    SALES_OPTION_CATEGORY("sales-option-category", "销售选项分类", "masterdata_sales_option_category", "category_id", "category_code", "category_name", false, false, false, false, false),
    SALES_OPTION_VALUE("sales-option-value", "销售选项值", "masterdata_sales_option_value", "option_id", "option_code", "option_name", false, true, false, false, false);

    private final String pathValue;
    private final String displayName;
    private final String tableName;
    private final String idColumn;
    private final String codeColumn;
    private final String nameColumn;
    private final boolean parentScoped;
    private final boolean categoryScoped;
    private final boolean seriesScoped;
    private final boolean specEnabled;
    private final boolean unitEnabled;

    MasterDataResource(String pathValue, String displayName, String tableName, String idColumn, String codeColumn,
                       String nameColumn, boolean parentScoped, boolean categoryScoped, boolean seriesScoped,
                       boolean specEnabled, boolean unitEnabled)
    {
        this.pathValue = pathValue;
        this.displayName = displayName;
        this.tableName = tableName;
        this.idColumn = idColumn;
        this.codeColumn = codeColumn;
        this.nameColumn = nameColumn;
        this.parentScoped = parentScoped;
        this.categoryScoped = categoryScoped;
        this.seriesScoped = seriesScoped;
        this.specEnabled = specEnabled;
        this.unitEnabled = unitEnabled;
    }

    public String getPathValue()
    {
        return pathValue;
    }

    public String getDisplayName()
    {
        return displayName;
    }

    public String getTableName()
    {
        return tableName;
    }

    public String getIdColumn()
    {
        return idColumn;
    }

    public String getCodeColumn()
    {
        return codeColumn;
    }

    public String getNameColumn()
    {
        return nameColumn;
    }

    public boolean isParentScoped()
    {
        return parentScoped;
    }

    public boolean isCategoryScoped()
    {
        return categoryScoped;
    }

    public boolean isSeriesScoped()
    {
        return seriesScoped;
    }

    public boolean isSpecEnabled()
    {
        return specEnabled;
    }

    public boolean isUnitEnabled()
    {
        return unitEnabled;
    }

    public static MasterDataResource fromPath(String resource)
    {
        return Arrays.stream(values())
            .filter(item -> item.pathValue.equals(resource))
            .findFirst()
            .orElseThrow(() -> new IllegalArgumentException("不支持的主数据对象：" + resource));
    }

    public static List<String> pathValues()
    {
        return Arrays.stream(values()).map(MasterDataResource::getPathValue).toList();
    }

    public MasterDataResource categoryResource()
    {
        return switch (this)
        {
            case PRODUCT_SERIES, PRODUCT_MODEL -> PRODUCT_CATEGORY;
            case MATERIAL_ITEM -> MATERIAL_CATEGORY;
            case ACCESSORY_ITEM -> ACCESSORY_CATEGORY;
            case SALES_OPTION_VALUE -> SALES_OPTION_CATEGORY;
            default -> null;
        };
    }
}
