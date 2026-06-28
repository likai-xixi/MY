package com.ruoyi.business.masterdata.service;

import java.util.List;
import com.ruoyi.business.masterdata.domain.MasterDataRecord;

/**
 * 主数据配置 服务层.
 */
public interface IMasterDataService
{
    public List<MasterDataRecord> selectRecordList(String resource, MasterDataRecord record);

    public List<MasterDataRecord> selectEnabledOptions(String resource);

    public MasterDataRecord selectRecordById(String resource, Long id);

    public int insertRecord(String resource, MasterDataRecord record);

    public int updateRecord(String resource, MasterDataRecord record);

    public int updateRecordStatus(String resource, MasterDataRecord record);

    public int deleteRecordByIds(String resource, Long[] ids, String updateBy);
}
