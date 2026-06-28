<template>
  <div class="app-container masterdata-page">
    <el-tabs v-model="activeResource" @tab-change="handleResourceChange">
      <el-tab-pane v-for="item in resourceConfigs" :key="item.value" :label="item.label" :name="item.value" />
    </el-tabs>

    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="84px">
      <el-form-item label="编码" prop="itemCode">
        <el-input v-model="queryParams.itemCode" placeholder="请输入编码" clearable style="width: 180px" @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="名称" prop="itemName">
        <el-input v-model="queryParams.itemName" placeholder="请输入名称" clearable style="width: 180px" @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item v-if="currentConfig.categoryResource" label="所属分类" prop="categoryId">
        <el-select v-model="queryParams.categoryId" placeholder="请选择" clearable filterable style="width: 180px">
          <el-option v-for="item in categoryOptions" :key="item.id" :label="optionLabel(item)" :value="item.id" />
        </el-select>
      </el-form-item>
      <el-form-item v-if="currentConfig.seriesResource" label="所属系列" prop="seriesId">
        <el-select v-model="queryParams.seriesId" placeholder="请选择" clearable filterable style="width: 180px">
          <el-option v-for="item in filteredSeriesOptions" :key="item.id" :label="optionLabel(item)" :value="item.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="请选择" clearable style="width: 120px">
          <el-option label="正常" value="0" />
          <el-option label="停用" value="1" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermi="['business:masterdata:add']">新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="success" plain icon="Edit" :disabled="single" @click="handleUpdate" v-hasPermi="['business:masterdata:edit']">修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete" v-hasPermi="['business:masterdata:remove']">删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="warning" plain icon="Download" @click="handleExport" v-hasPermi="['business:masterdata:export']">导出</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="recordList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="50" align="center" />
      <el-table-column label="编码" align="center" prop="itemCode" min-width="140" :show-overflow-tooltip="true" />
      <el-table-column label="名称" align="left" prop="itemName" min-width="180" :show-overflow-tooltip="true">
        <template #default="scope">
          <el-button link type="primary" @click="handleUpdate(scope.row)">{{ scope.row.itemName }}</el-button>
        </template>
      </el-table-column>
      <el-table-column v-if="currentConfig.categoryResource" label="所属分类" align="center" min-width="160" :show-overflow-tooltip="true">
        <template #default="scope">{{ relationName(currentConfig.categoryResource, scope.row.categoryId) }}</template>
      </el-table-column>
      <el-table-column v-if="currentConfig.seriesResource" label="所属系列" align="center" min-width="160" :show-overflow-tooltip="true">
        <template #default="scope">{{ relationName(currentConfig.seriesResource, scope.row.seriesId) }}</template>
      </el-table-column>
      <el-table-column v-if="currentConfig.parentEnabled" label="上级分类" align="center" min-width="160" :show-overflow-tooltip="true">
        <template #default="scope">{{ relationName(currentConfig.value, scope.row.parentId) }}</template>
      </el-table-column>
      <el-table-column v-if="currentConfig.specEnabled" label="规格" align="center" prop="spec" min-width="130" :show-overflow-tooltip="true" />
      <el-table-column v-if="currentConfig.unitEnabled" label="单位" align="center" prop="unit" width="90" />
      <el-table-column label="排序" align="center" prop="sortOrder" width="90" />
      <el-table-column label="状态" align="center" prop="status" width="90">
        <template #default="scope">
          <el-switch v-model="scope.row.status" active-value="0" inactive-value="1" @change="handleStatusChange(scope.row)" v-hasPermi="['business:masterdata:status']" />
        </template>
      </el-table-column>
      <el-table-column label="备注" align="left" prop="remark" min-width="160" :show-overflow-tooltip="true" />
      <el-table-column label="创建时间" align="center" prop="createTime" width="160">
        <template #default="scope">{{ parseTime(scope.row.createTime) }}</template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="130" fixed="right" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-tooltip content="修改" placement="top">
            <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['business:masterdata:edit']"></el-button>
          </el-tooltip>
          <el-tooltip content="删除" placement="top">
            <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['business:masterdata:remove']"></el-button>
          </el-tooltip>
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />

    <el-dialog :title="title" v-model="open" width="680px" append-to-body>
      <el-form ref="recordRef" :model="form" :rules="rules" label-width="96px">
        <el-form-item v-if="form.id" label="编码" prop="itemCode">
          <el-input v-model="form.itemCode" maxlength="64" disabled />
        </el-form-item>
        <el-form-item label="名称" prop="itemName">
          <el-input v-model="form.itemName" placeholder="请输入名称" maxlength="120" />
        </el-form-item>
        <el-form-item v-if="currentConfig.parentEnabled" label="上级分类" prop="parentId">
          <el-select v-model="form.parentId" placeholder="请选择" clearable filterable style="width: 100%">
            <el-option v-for="item in parentOptions" :key="item.id" :label="optionLabel(item)" :value="item.id" :disabled="item.id === form.id" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="currentConfig.categoryResource" label="所属分类" prop="categoryId">
          <el-select v-model="form.categoryId" placeholder="请选择" filterable style="width: 100%" @change="handleFormCategoryChange">
            <el-option v-for="item in categoryOptions" :key="item.id" :label="optionLabel(item)" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="currentConfig.seriesResource" label="所属系列" prop="seriesId">
          <el-select v-model="form.seriesId" placeholder="请选择" filterable style="width: 100%">
            <el-option v-for="item in formSeriesOptions" :key="item.id" :label="optionLabel(item)" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="currentConfig.specEnabled" label="规格" prop="spec">
          <el-input v-model="form.spec" placeholder="请输入规格" maxlength="120" />
        </el-form-item>
        <el-form-item v-if="currentConfig.unitEnabled" label="单位" prop="unit">
          <el-input v-model="form.unit" placeholder="请输入单位" maxlength="32" />
        </el-form-item>
        <el-form-item label="排序" prop="sortOrder">
          <el-input-number v-model="form.sortOrder" :min="0" :max="999999" controls-position="right" style="width: 180px" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio-button label="0">正常</el-radio-button>
            <el-radio-button label="1">停用</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.remark" type="textarea" placeholder="请输入备注" maxlength="500" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitForm">确 定</el-button>
          <el-button @click="cancel">取 消</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="Masterdata">
import { computed, getCurrentInstance, onMounted, ref, watch } from 'vue'
import {
  addMasterData,
  changeMasterDataStatus,
  delMasterData,
  getMasterData,
  listMasterData,
  listMasterDataOptions,
  updateMasterData
} from '@/api/masterdata'

const { proxy } = getCurrentInstance()

const resourceConfigs = [
  { value: 'product-category', label: '产品分类', parentEnabled: true },
  { value: 'product-series', label: '产品系列', categoryResource: 'product-category' },
  { value: 'product-model', label: '产品型号', categoryResource: 'product-category', seriesResource: 'product-series' },
  { value: 'material-category', label: '物料分类' },
  { value: 'material-item', label: '物料档案', categoryResource: 'material-category', specEnabled: true, unitEnabled: true },
  { value: 'accessory-category', label: '配件分类' },
  { value: 'accessory-item', label: '配件档案', categoryResource: 'accessory-category', specEnabled: true, unitEnabled: true },
  { value: 'sales-option-category', label: '销售选项分类' },
  { value: 'sales-option-value', label: '销售选项值', categoryResource: 'sales-option-category' }
]

const activeResource = ref('product-category')
const loading = ref(false)
const showSearch = ref(true)
const total = ref(0)
const recordList = ref([])
const selectedRows = ref([])
const ids = ref([])
const single = ref(true)
const multiple = ref(true)
const open = ref(false)
const title = ref('')
const relationOptions = ref({})

const queryParams = ref({
  pageNum: 1,
  pageSize: 10,
  itemCode: undefined,
  itemName: undefined,
  categoryId: undefined,
  seriesId: undefined,
  status: undefined
})

const form = ref({})

const currentConfig = computed(() => resourceConfigs.find(item => item.value === activeResource.value) || resourceConfigs[0])
const categoryOptions = computed(() => relationOptions.value[currentConfig.value.categoryResource] || [])
const parentOptions = computed(() => (relationOptions.value[currentConfig.value.value] || []).filter(item => item.id !== form.value.id))
const filteredSeriesOptions = computed(() => {
  const options = relationOptions.value[currentConfig.value.seriesResource] || []
  return queryParams.value.categoryId ? options.filter(item => item.categoryId === queryParams.value.categoryId) : options
})
const formSeriesOptions = computed(() => {
  const options = relationOptions.value[currentConfig.value.seriesResource] || []
  return form.value.categoryId ? options.filter(item => item.categoryId === form.value.categoryId) : options
})

const rules = computed(() => ({
  itemName: [{ required: true, message: '名称不能为空', trigger: 'blur' }],
  categoryId: currentConfig.value.categoryResource ? [{ required: true, message: '所属分类不能为空', trigger: 'change' }] : [],
  seriesId: currentConfig.value.seriesResource ? [{ required: true, message: '所属系列不能为空', trigger: 'change' }] : []
}))

watch(activeResource, () => {
  resetQueryState()
  loadRelationOptions().then(getList)
})

function optionLabel(item) {
  return item ? `${item.itemCode} ${item.itemName}` : ''
}

function relationName(resource, id) {
  if (!id) return ''
  const item = (relationOptions.value[resource] || []).find(option => option.id === id)
  return item ? item.itemName : String(id)
}

function resetQueryState() {
  queryParams.value = {
    pageNum: 1,
    pageSize: queryParams.value.pageSize || 10,
    itemCode: undefined,
    itemName: undefined,
    categoryId: undefined,
    seriesId: undefined,
    status: undefined
  }
  selectedRows.value = []
  ids.value = []
  single.value = true
  multiple.value = true
}

function resetFormState() {
  form.value = {
    id: undefined,
    itemCode: undefined,
    itemName: undefined,
    parentId: undefined,
    categoryId: undefined,
    seriesId: undefined,
    spec: undefined,
    unit: undefined,
    status: '0',
    sortOrder: 0,
    remark: undefined
  }
  proxy.resetForm('recordRef')
}

function relatedResources() {
  return Array.from(new Set([
    activeResource.value,
    currentConfig.value.categoryResource,
    currentConfig.value.seriesResource
  ].filter(Boolean)))
}

function loadRelationOptions() {
  const tasks = relatedResources().map(resource => listMasterDataOptions(resource).then(response => {
    relationOptions.value = {
      ...relationOptions.value,
      [resource]: response.data || []
    }
  }))
  return Promise.all(tasks)
}

function getList() {
  loading.value = true
  listMasterData(activeResource.value, queryParams.value).then(response => {
    recordList.value = response.rows || []
    total.value = response.total || 0
  }).finally(() => {
    loading.value = false
  })
}

function handleQuery() {
  queryParams.value.pageNum = 1
  getList()
}

function resetQuery() {
  proxy.resetForm('queryRef')
  resetQueryState()
  getList()
}

function handleResourceChange() {
  resetFormState()
}

function handleSelectionChange(selection) {
  selectedRows.value = selection
  ids.value = selection.map(item => item.id)
  single.value = selection.length !== 1
  multiple.value = selection.length === 0
}

function handleAdd() {
  resetFormState()
  title.value = `新增${currentConfig.value.label}`
  open.value = true
}

function handleUpdate(row) {
  resetFormState()
  const target = row || selectedRows.value[0]
  const id = target?.id || ids.value[0]
  getMasterData(activeResource.value, id).then(response => {
    form.value = {
      ...response.data,
      sortOrder: response.data?.sortOrder ?? 0,
      status: response.data?.status || '0'
    }
    title.value = `修改${currentConfig.value.label}`
    open.value = true
  })
}

function handleFormCategoryChange() {
  if (currentConfig.value.seriesResource) {
    form.value.seriesId = undefined
  }
}

function handleStatusChange(row) {
  const text = row.status === '0' ? '启用' : '停用'
  proxy.$modal.confirm(`确认要${text}"${row.itemName}"吗？`).then(() => {
    return changeMasterDataStatus(activeResource.value, row.id, row.status)
  }).then(() => {
    proxy.$modal.msgSuccess(text + '成功')
  }).catch(() => {
    row.status = row.status === '0' ? '1' : '0'
  })
}

function handleDelete(row) {
  const deleteIds = row.id || ids.value
  proxy.$modal.confirm(`是否确认删除${currentConfig.value.label}编号为"${deleteIds}"的数据项？`).then(() => {
    return delMasterData(activeResource.value, deleteIds)
  }).then(() => {
    getList()
    loadRelationOptions()
    proxy.$modal.msgSuccess('删除成功')
  }).catch(() => {})
}

function handleExport() {
  proxy.download(`business/masterdata/${activeResource.value}/export`, {
    ...queryParams.value
  }, `masterdata_${activeResource.value}_${new Date().getTime()}.xlsx`)
}

function normalizeFormBeforeSubmit() {
  form.value.itemCode = form.value.id ? (form.value.itemCode || '').trim().toUpperCase() : undefined
  form.value.itemName = (form.value.itemName || '').trim()
  if (!currentConfig.value.parentEnabled) form.value.parentId = undefined
  if (!currentConfig.value.categoryResource) form.value.categoryId = undefined
  if (!currentConfig.value.seriesResource) form.value.seriesId = undefined
  if (!currentConfig.value.specEnabled) form.value.spec = undefined
  if (!currentConfig.value.unitEnabled) form.value.unit = undefined
}

function submitForm() {
  normalizeFormBeforeSubmit()
  proxy.$refs.recordRef.validate(valid => {
    if (!valid) return
    const action = form.value.id ? updateMasterData(activeResource.value, form.value) : addMasterData(activeResource.value, form.value)
    action.then(() => {
      proxy.$modal.msgSuccess(form.value.id ? '修改成功' : '新增成功')
      open.value = false
      getList()
      loadRelationOptions()
    })
  })
}

function cancel() {
  open.value = false
  resetFormState()
}

onMounted(() => {
  loadRelationOptions().then(getList)
})
</script>

<style scoped>
.masterdata-page :deep(.el-tabs) {
  margin-bottom: 12px;
}
.masterdata-page :deep(.el-table .cell) {
  line-height: 22px;
}
</style>
