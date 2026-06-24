package com.ruoyi.business.customer.domain;

import java.util.Date;
import java.util.List;
import jakarta.validation.constraints.NotBlank;
import com.fasterxml.jackson.annotation.JsonFormat;
import org.apache.commons.lang3.builder.ToStringBuilder;
import org.apache.commons.lang3.builder.ToStringStyle;
import com.ruoyi.common.annotation.Excel;
import com.ruoyi.common.core.domain.BaseEntity;

/**
 * 客户档案 customer.
 */
public class Customer extends BaseEntity
{
    private static final long serialVersionUID = 1L;

    private Long customerId;

    @Excel(name = "客户编码")
    private String customerCode;

    @Excel(name = "客户名称")
    private String customerName;

    @Excel(name = "客户简称")
    private String shortName;

    @Excel(name = "客户性质", readConverterExp = "REAL=真实客户,PUBLIC=公共客户")
    private String customerNature;

    @Excel(name = "公共客户渠道", readConverterExp = "DIRECT_SALE=厂内自销,SELF_MEDIA=自媒体")
    private String publicChannel;

    @Excel(name = "客户类型", readConverterExp = "DEALER=经销商,PROJECT=工程客户,RETAIL=散户,STORE=门店,OTHER=其他")
    private String customerType;

    @Excel(name = "客户等级", readConverterExp = "A=A,B=B,C=C,NORMAL=普通")
    private String customerLevel;

    @Excel(name = "联系人")
    private String contactName;

    @Excel(name = "联系电话")
    private String contactPhone;

    private String wechat;
    @Excel(name = "省")
    private String province;

    private String provinceCode;

    @Excel(name = "市")
    private String city;

    private String cityCode;

    @Excel(name = "区")
    private String district;

    private String districtCode;

    @Excel(name = "详细地址")
    private String address;

    @Excel(name = "归属方式", readConverterExp = "FACTORY=厂内,SALESMAN=业务员,NONE=无固定归属")
    private String ownerType;

    @Excel(name = "归属来源", readConverterExp = "FACTORY_POOL=厂内客户池,FACTORY_ASSIGNED=厂内分配维护,SALESMAN_SELF=业务员自有,NONE=无")
    private String ownerSource;

    @Excel(name = "收益口径", readConverterExp = "NONE=无个人收益,MAINTENANCE_FEE=维护费,SALES_COMMISSION=业务提成")
    private String ownerProfitMode;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @Excel(name = "归属生效时间", width = 30, dateFormat = "yyyy-MM-dd HH:mm:ss")
    private Date ownerEffectiveTime;

    private Long ownerUserId;

    @Excel(name = "归属业务员")
    private String ownerUserName;

    private Long ownerDeptId;

    @Excel(name = "归属部门")
    private String ownerDeptName;

    @Excel(name = "状态", readConverterExp = "0=正常,1=停用")
    private String status;

    private String delFlag;
    private List<CustomerContact> contacts;
    private List<CustomerAddress> addresses;
    private Boolean syncDefaultContact;
    private Boolean syncDefaultAddress;

    public Long getCustomerId()
    {
        return customerId;
    }

    public void setCustomerId(Long customerId)
    {
        this.customerId = customerId;
    }

    public String getCustomerCode()
    {
        return customerCode;
    }

    public void setCustomerCode(String customerCode)
    {
        this.customerCode = customerCode;
    }

    @NotBlank(message = "客户名称不能为空")
    public String getCustomerName()
    {
        return customerName;
    }

    public void setCustomerName(String customerName)
    {
        this.customerName = customerName;
    }

    public String getShortName()
    {
        return shortName;
    }

    public void setShortName(String shortName)
    {
        this.shortName = shortName;
    }

    public String getCustomerNature()
    {
        return customerNature;
    }

    public void setCustomerNature(String customerNature)
    {
        this.customerNature = customerNature;
    }

    public String getPublicChannel()
    {
        return publicChannel;
    }

    public void setPublicChannel(String publicChannel)
    {
        this.publicChannel = publicChannel;
    }

    public String getCustomerType()
    {
        return customerType;
    }

    public void setCustomerType(String customerType)
    {
        this.customerType = customerType;
    }

    public String getCustomerLevel()
    {
        return customerLevel;
    }

    public void setCustomerLevel(String customerLevel)
    {
        this.customerLevel = customerLevel;
    }

    public String getContactName()
    {
        return contactName;
    }

    public void setContactName(String contactName)
    {
        this.contactName = contactName;
    }

    public String getContactPhone()
    {
        return contactPhone;
    }

    public void setContactPhone(String contactPhone)
    {
        this.contactPhone = contactPhone;
    }

    public String getWechat()
    {
        return wechat;
    }

    public void setWechat(String wechat)
    {
        this.wechat = wechat;
    }

    public String getProvince()
    {
        return province;
    }

    public void setProvince(String province)
    {
        this.province = province;
    }

    public String getProvinceCode()
    {
        return provinceCode;
    }

    public void setProvinceCode(String provinceCode)
    {
        this.provinceCode = provinceCode;
    }

    public String getCity()
    {
        return city;
    }

    public void setCity(String city)
    {
        this.city = city;
    }

    public String getCityCode()
    {
        return cityCode;
    }

    public void setCityCode(String cityCode)
    {
        this.cityCode = cityCode;
    }

    public String getDistrict()
    {
        return district;
    }

    public void setDistrict(String district)
    {
        this.district = district;
    }

    public String getDistrictCode()
    {
        return districtCode;
    }

    public void setDistrictCode(String districtCode)
    {
        this.districtCode = districtCode;
    }

    public String getAddress()
    {
        return address;
    }

    public void setAddress(String address)
    {
        this.address = address;
    }

    public String getOwnerType()
    {
        return ownerType;
    }

    public void setOwnerType(String ownerType)
    {
        this.ownerType = ownerType;
    }

    public String getOwnerSource()
    {
        return ownerSource;
    }

    public void setOwnerSource(String ownerSource)
    {
        this.ownerSource = ownerSource;
    }

    public String getOwnerProfitMode()
    {
        return ownerProfitMode;
    }

    public void setOwnerProfitMode(String ownerProfitMode)
    {
        this.ownerProfitMode = ownerProfitMode;
    }

    public Date getOwnerEffectiveTime()
    {
        return ownerEffectiveTime;
    }

    public void setOwnerEffectiveTime(Date ownerEffectiveTime)
    {
        this.ownerEffectiveTime = ownerEffectiveTime;
    }

    public Long getOwnerUserId()
    {
        return ownerUserId;
    }

    public void setOwnerUserId(Long ownerUserId)
    {
        this.ownerUserId = ownerUserId;
    }

    public String getOwnerUserName()
    {
        return ownerUserName;
    }

    public void setOwnerUserName(String ownerUserName)
    {
        this.ownerUserName = ownerUserName;
    }

    public Long getOwnerDeptId()
    {
        return ownerDeptId;
    }

    public void setOwnerDeptId(Long ownerDeptId)
    {
        this.ownerDeptId = ownerDeptId;
    }

    public String getOwnerDeptName()
    {
        return ownerDeptName;
    }

    public void setOwnerDeptName(String ownerDeptName)
    {
        this.ownerDeptName = ownerDeptName;
    }

    public String getStatus()
    {
        return status;
    }

    public void setStatus(String status)
    {
        this.status = status;
    }

    public String getDelFlag()
    {
        return delFlag;
    }

    public void setDelFlag(String delFlag)
    {
        this.delFlag = delFlag;
    }

    public List<CustomerContact> getContacts()
    {
        return contacts;
    }

    public void setContacts(List<CustomerContact> contacts)
    {
        this.contacts = contacts;
    }

    public List<CustomerAddress> getAddresses()
    {
        return addresses;
    }

    public void setAddresses(List<CustomerAddress> addresses)
    {
        this.addresses = addresses;
    }

    public Boolean getSyncDefaultContact()
    {
        return syncDefaultContact;
    }

    public void setSyncDefaultContact(Boolean syncDefaultContact)
    {
        this.syncDefaultContact = syncDefaultContact;
    }

    public Boolean getSyncDefaultAddress()
    {
        return syncDefaultAddress;
    }

    public void setSyncDefaultAddress(Boolean syncDefaultAddress)
    {
        this.syncDefaultAddress = syncDefaultAddress;
    }

    @Override
    public String toString()
    {
        return new ToStringBuilder(this, ToStringStyle.MULTI_LINE_STYLE)
            .append("customerId", getCustomerId())
            .append("customerCode", getCustomerCode())
            .append("customerName", getCustomerName())
            .append("customerNature", getCustomerNature())
            .append("publicChannel", getPublicChannel())
            .append("ownerType", getOwnerType())
            .append("ownerSource", getOwnerSource())
            .append("ownerProfitMode", getOwnerProfitMode())
            .append("ownerEffectiveTime", getOwnerEffectiveTime())
            .append("ownerUserName", getOwnerUserName())
            .append("status", getStatus())
            .toString();
    }
}
