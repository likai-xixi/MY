package com.ruoyi.web.controller.business.masterdata;

import java.util.List;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.ruoyi.business.masterdata.domain.MasterDataRecord;
import com.ruoyi.business.masterdata.service.IMasterDataService;
import com.ruoyi.common.annotation.Log;
import com.ruoyi.common.core.controller.BaseController;
import com.ruoyi.common.core.domain.AjaxResult;
import com.ruoyi.common.core.page.TableDataInfo;
import com.ruoyi.common.enums.BusinessType;
import com.ruoyi.common.utils.poi.ExcelUtil;

/**
 * 主数据配置.
 */
@RestController
@RequestMapping("/business/masterdata")
public class MasterDataController extends BaseController
{
    @Autowired
    private IMasterDataService masterDataService;

    @PreAuthorize("@ss.hasPermi('business:masterdata:list')")
    @GetMapping("/{resource}/list")
    public TableDataInfo list(@PathVariable String resource, MasterDataRecord record)
    {
        startPage();
        List<MasterDataRecord> list = masterDataService.selectRecordList(resource, record);
        return getDataTable(list);
    }

    @PreAuthorize("@ss.hasPermi('business:masterdata:list')")
    @GetMapping("/{resource}/options")
    public AjaxResult options(@PathVariable String resource)
    {
        return success(masterDataService.selectEnabledOptions(resource));
    }

    @Log(title = "主数据配置", businessType = BusinessType.EXPORT)
    @PreAuthorize("@ss.hasPermi('business:masterdata:export')")
    @PostMapping("/{resource}/export")
    public void export(HttpServletResponse response, @PathVariable String resource, MasterDataRecord record)
    {
        List<MasterDataRecord> list = masterDataService.selectRecordList(resource, record);
        ExcelUtil<MasterDataRecord> util = new ExcelUtil<MasterDataRecord>(MasterDataRecord.class);
        util.exportExcel(response, list, "主数据配置");
    }

    @PreAuthorize("@ss.hasPermi('business:masterdata:query')")
    @GetMapping("/{resource}/{id}")
    public AjaxResult getInfo(@PathVariable String resource, @PathVariable Long id)
    {
        return success(masterDataService.selectRecordById(resource, id));
    }

    @PreAuthorize("@ss.hasPermi('business:masterdata:add')")
    @Log(title = "主数据配置", businessType = BusinessType.INSERT)
    @PostMapping("/{resource}")
    public AjaxResult add(@PathVariable String resource, @Validated @RequestBody MasterDataRecord record)
    {
        record.setCreateBy(getUsername());
        return toAjax(masterDataService.insertRecord(resource, record));
    }

    @PreAuthorize("@ss.hasPermi('business:masterdata:edit')")
    @Log(title = "主数据配置", businessType = BusinessType.UPDATE)
    @PutMapping("/{resource}")
    public AjaxResult edit(@PathVariable String resource, @Validated @RequestBody MasterDataRecord record)
    {
        record.setUpdateBy(getUsername());
        return toAjax(masterDataService.updateRecord(resource, record));
    }

    @PreAuthorize("@ss.hasPermi('business:masterdata:status')")
    @Log(title = "主数据状态", businessType = BusinessType.UPDATE)
    @PutMapping("/{resource}/changeStatus")
    public AjaxResult changeStatus(@PathVariable String resource, @RequestBody MasterDataRecord record)
    {
        record.setUpdateBy(getUsername());
        return toAjax(masterDataService.updateRecordStatus(resource, record));
    }

    @PreAuthorize("@ss.hasPermi('business:masterdata:remove')")
    @Log(title = "主数据配置", businessType = BusinessType.DELETE)
    @DeleteMapping("/{resource}/{ids}")
    public AjaxResult remove(@PathVariable String resource, @PathVariable Long[] ids)
    {
        return toAjax(masterDataService.deleteRecordByIds(resource, ids, getUsername()));
    }
}
