package com.ruoyi.business.customer.domain;

import com.ruoyi.common.core.domain.BaseEntity;

/**
 * 客户联系人 customer_contact.
 */
public class CustomerContact extends BaseEntity
{
    private static final long serialVersionUID = 1L;

    private Long contactId;
    private Long customerId;
    private String contactName;
    private String phone;
    private String wechat;
    private String position;
    private String contactRole;
    private String isDefault;
    private String delFlag;

    public Long getContactId() { return contactId; }
    public void setContactId(Long contactId) { this.contactId = contactId; }
    public Long getCustomerId() { return customerId; }
    public void setCustomerId(Long customerId) { this.customerId = customerId; }
    public String getContactName() { return contactName; }
    public void setContactName(String contactName) { this.contactName = contactName; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getWechat() { return wechat; }
    public void setWechat(String wechat) { this.wechat = wechat; }
    public String getPosition() { return position; }
    public void setPosition(String position) { this.position = position; }
    public String getContactRole() { return contactRole; }
    public void setContactRole(String contactRole) { this.contactRole = contactRole; }
    public String getIsDefault() { return isDefault; }
    public void setIsDefault(String isDefault) { this.isDefault = isDefault; }
    public String getDelFlag() { return delFlag; }
    public void setDelFlag(String delFlag) { this.delFlag = delFlag; }
}
