package com.ruoyi.business.masterdata.mapper;

import java.util.List;
import org.apache.ibatis.annotations.Param;
import com.ruoyi.business.masterdata.domain.MasterDataRecord;
import com.ruoyi.business.masterdata.domain.MasterDataResource;

/**
 * 主数据配置 Mapper.
 */
public interface MasterDataMapper
{
    public List<MasterDataRecord> selectRecordList(@Param("resource") MasterDataResource resource, @Param("record") MasterDataRecord record);

    public MasterDataRecord selectRecordById(@Param("resource") MasterDataResource resource, @Param("id") Long id);

    public MasterDataRecord selectRecordByCode(@Param("resource") MasterDataResource resource, @Param("code") String code);

    public String selectMaxCodeByMonth(@Param("resource") MasterDataResource resource, @Param("monthPrefix") String monthPrefix);

    public int countCode(@Param("resource") MasterDataResource resource, @Param("id") Long id, @Param("code") String code);

    public int insertRecord(@Param("resource") MasterDataResource resource, @Param("record") MasterDataRecord record);

    public int updateRecord(@Param("resource") MasterDataResource resource, @Param("record") MasterDataRecord record);

    public int updateRecordStatus(@Param("resource") MasterDataResource resource, @Param("record") MasterDataRecord record);

    public int deleteRecordByIds(@Param("resource") MasterDataResource resource, @Param("ids") Long[] ids, @Param("updateBy") String updateBy);
}
