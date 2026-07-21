<template>
  <div class="app-container masterdata-option-page">
    <el-tabs v-model="activeResource">
      <el-tab-pane label="选项集" :name="OPTION_SET_RESOURCE" />
      <el-tab-pane label="选项值" :name="OPTION_VALUE_RESOURCE" />
    </el-tabs>

    <el-form ref="queryRef" :model="queryParams" :inline="true" v-show="showSearch" label-width="84px">
      <el-form-item label="编码" prop="itemCode">
        <el-input v-model="queryParams.itemCode" placeholder="请输入编码" clearable style="width: 180px" @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="名称" prop="itemName">
        <el-input v-model="queryParams.itemName" placeholder="请输入名称" clearable style="width: 180px" @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item v-if="isOptionValue" label="所属选项集" prop="optionSetId">
        <el-select v-model="queryParams.optionSetId" placeholder="请选择" clearable filterable style="width: 220px">
          <el-option v-for="item in optionSets" :key="item.id" :label="optionLabel(item)" :value="item.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="请选择" clearable style="width: 120px">
          <el-option label="正常" value="0" />
          <el-option label="停用" value="1" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" :loading="listLoading" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" :disabled="listLoading" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button v-if="canAdd" type="primary" plain icon="Plus" :disabled="mutationBusy" @click="handleAdd">新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button v-if="canEdit" type="success" plain icon="Edit" :disabled="single || mutationBusy" @click="handleUpdate()">修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button v-if="canRemove" type="danger" plain icon="Delete" :disabled="multiple || mutationBusy" :loading="deleteLoading" @click="handleDelete()">删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button v-if="canExport" type="warning" plain icon="Download" :disabled="listLoading" @click="handleExport">导出</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-alert v-if="listError" class="mb8" type="error" :closable="false" show-icon>
      <template #title>数据加载失败：{{ listError }}</template>
      <el-button link type="primary" @click="retryList">重试</el-button>
    </el-alert>

    <el-table
      v-loading="listLoading || relationLoading"
      :data="records"
      row-key="id"
      @selection-change="handleSelectionChange"
    >
      <template #empty>
        <el-empty v-if="listError" description="数据加载失败，请重试" :image-size="72" />
        <el-empty v-else-if="!listLoading && records.length === 0" description="暂无数据" :image-size="72" />
      </template>
      <el-table-column type="selection" width="50" align="center" />
      <el-table-column label="编码" align="center" prop="itemCode" min-width="150" :show-overflow-tooltip="true" />
      <el-table-column label="名称" align="left" prop="itemName" min-width="200" :show-overflow-tooltip="true">
        <template #default="scope">
          <el-button v-if="canEdit" link type="primary" :disabled="detailLoading" @click="handleUpdate(scope.row)">{{ scope.row.itemName }}</el-button>
          <span v-else>{{ scope.row.itemName }}</span>
        </template>
      </el-table-column>
      <el-table-column v-if="isOptionSet" label="选择方式" align="center" prop="selectionMode" width="130">
        <template #default="scope">
          <el-tag effect="plain">{{ scope.row.selectionMode }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column v-if="isOptionValue" label="所属选项集" align="left" min-width="220" :show-overflow-tooltip="true">
        <template #default="scope">{{ optionSetName(scope.row.optionSetId) }}</template>
      </el-table-column>
      <el-table-column label="排序" align="center" prop="sortOrder" width="90" />
      <el-table-column label="状态" align="center" prop="status" width="100">
        <template #default="scope">
          <el-switch
            v-if="canChangeStatus"
            v-model="scope.row.status"
            active-value="0"
            inactive-value="1"
            :loading="statusBusyIds.has(scope.row.id)"
            :disabled="statusBusyIds.has(scope.row.id)"
            @change="handleStatusChange(scope.row)"
          />
          <el-tag v-else :type="scope.row.status === '0' ? 'success' : 'info'">{{ statusLabel(scope.row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="备注" align="left" prop="remark" min-width="180" :show-overflow-tooltip="true" />
      <el-table-column label="创建时间" align="center" prop="createTime" width="160">
        <template #default="scope">{{ parseTime(scope.row.createTime) }}</template>
      </el-table-column>
      <el-table-column v-if="canEdit || canRemove" label="操作" align="center" width="130" fixed="right" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-tooltip v-if="canEdit" content="修改" placement="top">
            <el-button link type="primary" icon="Edit" :disabled="mutationBusy" @click="handleUpdate(scope.row)"></el-button>
          </el-tooltip>
          <el-tooltip v-if="canRemove" content="删除" placement="top">
            <el-button link type="primary" icon="Delete" :disabled="mutationBusy" @click="handleDelete(scope.row)"></el-button>
          </el-tooltip>
        </template>
      </el-table-column>
    </el-table>

    <pagination
      v-show="!listError && total > 0"
      :total="total"
      v-model:page="queryParams.pageNum"
      v-model:limit="queryParams.pageSize"
      @pagination="getList"
    />

    <el-dialog :title="dialogTitle" v-model="open" width="620px" append-to-body :close-on-click-modal="false">
      <el-form ref="recordRef" v-loading="detailLoading" :model="form" :rules="rules" label-width="100px">
        <el-form-item v-if="form.id" label="编码" prop="itemCode">
          <el-input v-model="form.itemCode" maxlength="64" disabled />
        </el-form-item>
        <el-form-item label="名称" prop="itemName">
          <el-input v-model="form.itemName" placeholder="请输入名称" maxlength="120" />
        </el-form-item>
        <el-form-item v-if="isOptionSet" label="选择方式" prop="selectionMode">
          <el-radio-group v-model="form.selectionMode">
            <el-radio-button v-for="mode in SELECTION_MODES" :key="mode" :label="mode">{{ mode }}</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="isOptionValue" label="所属选项集" prop="optionSetId">
          <el-select v-model="form.optionSetId" placeholder="请选择选项集" filterable style="width: 100%">
            <el-option v-for="item in selectableOptionSets" :key="item.id" :label="optionLabel(item)" :value="item.id" />
          </el-select>
          <div v-if="form.id && selectedOptionSet?.status === '1'" class="form-tip">当前所属选项集已停用，仅允许保留或改为正常选项集。</div>
        </el-form-item>
        <el-form-item label="排序" prop="sortOrder">
          <el-input-number :key="`${activeResource}:${formRenderSequence}`" v-model="form.sortOrder" :min="0" :max="999999" controls-position="right" style="width: 180px" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio-button label="0">正常</el-radio-button>
            <el-radio-button label="1">停用</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.remark" type="textarea" placeholder="请输入备注" maxlength="500" show-word-limit />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" :loading="submitLoading" :disabled="detailLoading" @click="submitForm">确 定</el-button>
          <el-button :disabled="submitLoading" @click="cancel">取 消</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="MasterdataOptionConfig">
import { computed, getCurrentInstance, onMounted, ref, watch } from 'vue'
import {
  addMasterData,
  changeMasterDataStatus,
  delMasterData,
  getMasterData,
  listMasterData,
  updateMasterData
} from '@/api/masterdata'

const { proxy } = getCurrentInstance()
const OPTION_SET_RESOURCE = 'option-set'
const OPTION_VALUE_RESOURCE = 'option-value'
const SELECTION_MODES = Object.freeze(['SINGLE', 'MULTIPLE'])

const queryRef = ref()
const recordRef = ref()
const activeResource = ref(OPTION_SET_RESOURCE)
const showSearch = ref(true)
const records = ref([])
const optionSets = ref([])
const selectedRows = ref([])
const ids = ref([])
const total = ref(0)
const single = ref(true)
const multiple = ref(true)
const open = ref(false)
const listLoading = ref(false)
const relationLoading = ref(false)
const detailLoading = ref(false)
const submitLoading = ref(false)
const deleteLoading = ref(false)
const listError = ref('')
const statusBusyIds = ref(new Set())
const listRequestSequence = ref(0)
const relationRequestSequence = ref(0)
const formRenderSequence = ref(0)

const canAdd = computed(() => proxy.$auth.hasPermi('business:masterdata:add'))
const canEdit = computed(() => proxy.$auth.hasPermi('business:masterdata:edit'))
const canRemove = computed(() => proxy.$auth.hasPermi('business:masterdata:remove'))
const canExport = computed(() => proxy.$auth.hasPermi('business:masterdata:export'))
const canChangeStatus = computed(() => proxy.$auth.hasPermi('business:masterdata:status'))
const isOptionSet = computed(() => activeResource.value === OPTION_SET_RESOURCE)
const isOptionValue = computed(() => activeResource.value === OPTION_VALUE_RESOURCE)
const resourceLabel = computed(() => isOptionSet.value ? '选项集' : '选项值')
const dialogTitle = computed(() => `${form.value.id ? '修改' : '新增'}${resourceLabel.value}`)
const mutationBusy = computed(() => detailLoading.value || submitLoading.value || deleteLoading.value || statusBusyIds.value.size > 0)
const selectedOptionSet = computed(() => optionSets.value.find(item => item.id === form.value.optionSetId))
const selectableOptionSets = computed(() => optionSets.value.filter(item => item.status === '0' || item.id === form.value.optionSetId))

const queryParams = ref(defaultQuery())
const form = ref(defaultForm())

function validSelectionMode(rule, value, callback) {
  if (!SELECTION_MODES.includes(value)) {
    callback(new Error('选择方式只能是 SINGLE 或 MULTIPLE'))
    return
  }
  callback()
}

const rules = computed(() => ({
  itemName: [{ required: true, message: '名称不能为空', trigger: 'blur' }],
  selectionMode: [{ required: true, validator: validSelectionMode, trigger: 'change' }],
  optionSetId: [{ required: true, message: '所属选项集不能为空', trigger: 'change' }]
}))

function defaultQuery() {
  return {
    pageNum: 1,
    pageSize: 10,
    itemCode: undefined,
    itemName: undefined,
    optionSetId: undefined,
    status: undefined
  }
}

function defaultForm() {
  return {
    id: undefined,
    itemCode: undefined,
    itemName: undefined,
    selectionMode: 'SINGLE',
    optionSetId: undefined,
    sortOrder: 0,
    status: '0',
    remark: undefined
  }
}

function optionLabel(item) {
  return item ? `${item.itemCode} ${item.itemName}` : ''
}

function optionSetName(id) {
  const item = optionSets.value.find(option => option.id === id)
  return item ? optionLabel(item) : (id == null ? '' : String(id))
}

function statusLabel(status) {
  return status === '0' ? '正常' : '停用'
}

function sortRecords(rows) {
  return [...(rows || [])].sort((left, right) => {
    const sortDelta = (left.sortOrder ?? 0) - (right.sortOrder ?? 0)
    if (sortDelta !== 0) return sortDelta
    const leftId = Number(left.id)
    const rightId = Number(right.id)
    if (Number.isFinite(leftId) && Number.isFinite(rightId) && leftId !== rightId) return leftId - rightId
    return String(left.itemCode || '').localeCompare(String(right.itemCode || ''))
  })
}

function errorMessage(error, fallback) {
  return error?.msg || error?.message || fallback
}

function isDialogCancel(error) {
  return error === 'cancel' || error === 'close' || error?.message === 'cancel'
}

async function loadOptionSets() {
  const requestId = ++relationRequestSequence.value
  relationLoading.value = true
  try {
    const response = await listMasterData(OPTION_SET_RESOURCE, { pageNum: 1, pageSize: 10000 })
    if (requestId !== relationRequestSequence.value) return
    optionSets.value = sortRecords(response.rows || [])
  } catch (error) {
    if (requestId !== relationRequestSequence.value) return
    optionSets.value = []
    throw error
  } finally {
    if (requestId === relationRequestSequence.value) relationLoading.value = false
  }
}

async function getList() {
  const requestId = ++listRequestSequence.value
  listLoading.value = true
  listError.value = ''
  const params = { ...queryParams.value }
  if (isOptionSet.value) params.optionSetId = undefined
  try {
    if (isOptionValue.value && optionSets.value.length === 0) await loadOptionSets()
    const response = await listMasterData(activeResource.value, params)
    if (requestId !== listRequestSequence.value) return
    records.value = sortRecords(response.rows || [])
    total.value = response.total ?? records.value.length
  } catch (error) {
    if (requestId !== listRequestSequence.value) return
    records.value = []
    total.value = 0
    listError.value = errorMessage(error, `${resourceLabel.value}加载失败`)
  } finally {
    if (requestId === listRequestSequence.value) listLoading.value = false
  }
}

function retryList() {
  return getList()
}

function resetSelection() {
  selectedRows.value = []
  ids.value = []
  single.value = true
  multiple.value = true
}

function resetFormState() {
  formRenderSequence.value += 1
  form.value = defaultForm()
  recordRef.value?.clearValidate()
}

function handleQuery() {
  queryParams.value.pageNum = 1
  getList()
}

function resetQuery() {
  queryRef.value?.resetFields()
  queryParams.value = defaultQuery()
  resetSelection()
  getList()
}

function handleSelectionChange(selection) {
  selectedRows.value = selection
  ids.value = selection.map(item => item.id)
  single.value = selection.length !== 1
  multiple.value = selection.length === 0
}

async function ensureOptionSetsLoaded() {
  if (isOptionValue.value && optionSets.value.length === 0) {
    try {
      await loadOptionSets()
    } catch (error) {
      proxy.$modal.msgError(errorMessage(error, '选项集加载失败'))
      return false
    }
  }
  return true
}

async function handleAdd() {
  if (!canAdd.value || mutationBusy.value) return
  if (!(await ensureOptionSetsLoaded())) return
  resetFormState()
  open.value = true
}

async function handleUpdate(row) {
  if (!canEdit.value || mutationBusy.value) return
  const target = row || selectedRows.value[0]
  const id = target?.id || ids.value[0]
  if (!id || !(await ensureOptionSetsLoaded())) return
  detailLoading.value = true
  try {
    const response = await getMasterData(activeResource.value, id)
    form.value = {
      ...defaultForm(),
      ...response.data,
      selectionMode: response.data?.selectionMode || 'SINGLE',
      sortOrder: response.data?.sortOrder ?? 0,
      status: response.data?.status || '0'
    }
    formRenderSequence.value += 1
    open.value = true
  } catch (error) {
    proxy.$modal.msgError(errorMessage(error, `${resourceLabel.value}详情加载失败`))
  } finally {
    detailLoading.value = false
  }
}

async function handleStatusChange(row) {
  if (!canChangeStatus.value) return
  const previousStatus = row.status === '0' ? '1' : '0'
  if (statusBusyIds.value.has(row.id)) {
    row.status = previousStatus
    return
  }
  statusBusyIds.value = new Set(statusBusyIds.value).add(row.id)
  const actionLabel = row.status === '0' ? '启用' : '停用'
  try {
    await proxy.$modal.confirm(`确认要${actionLabel}“${row.itemName}”吗？`)
    await changeMasterDataStatus(activeResource.value, row.id, row.status)
    await getList()
    proxy.$modal.msgSuccess(`${actionLabel}成功`)
  } catch (error) {
    row.status = previousStatus
    if (!isDialogCancel(error)) proxy.$modal.msgError(errorMessage(error, `${actionLabel}失败`))
  } finally {
    const nextBusyIds = new Set(statusBusyIds.value)
    nextBusyIds.delete(row.id)
    statusBusyIds.value = nextBusyIds
  }
}

async function handleDelete(row) {
  if (!canRemove.value || mutationBusy.value) return
  const deleteIds = row?.id ? [row.id] : [...ids.value]
  if (deleteIds.length === 0) return
  deleteLoading.value = true
  try {
    await proxy.$modal.confirm(`是否确认删除${resourceLabel.value}编号为“${deleteIds.join(',')}”的数据项？`)
    await delMasterData(activeResource.value, deleteIds)
    if (isOptionSet.value) await loadOptionSets()
    await getList()
    resetSelection()
    proxy.$modal.msgSuccess('删除成功')
  } catch (error) {
    if (!isDialogCancel(error)) proxy.$modal.msgError(errorMessage(error, '删除失败'))
  } finally {
    deleteLoading.value = false
  }
}

function handleExport() {
  if (!canExport.value) return
  proxy.download(`business/masterdata/${activeResource.value}/export`, {
    ...queryParams.value
  }, `masterdata_${activeResource.value}_${new Date().getTime()}.xlsx`)
}

function normalizedPayload() {
  const payload = {
    ...form.value,
    itemCode: form.value.id ? (form.value.itemCode || '').trim().toUpperCase() : undefined,
    itemName: (form.value.itemName || '').trim(),
    selectionMode: isOptionSet.value ? form.value.selectionMode : undefined,
    optionSetId: isOptionValue.value ? form.value.optionSetId : undefined
  }
  return payload
}

async function submitForm() {
  if (submitLoading.value || detailLoading.value) return
  let valid = false
  try {
    valid = await recordRef.value.validate()
  } catch {
    valid = false
  }
  if (!valid) return
  submitLoading.value = true
  try {
    const payload = normalizedPayload()
    const isEdit = Boolean(payload.id)
    const action = isEdit ? updateMasterData(activeResource.value, payload) : addMasterData(activeResource.value, payload)
    await action
    if (isOptionSet.value) await loadOptionSets()
    await getList()
    open.value = false
    proxy.$modal.msgSuccess(isEdit ? '修改成功' : '新增成功')
  } catch (error) {
    proxy.$modal.msgError(errorMessage(error, `${form.value.id ? '修改' : '新增'}失败`))
  } finally {
    submitLoading.value = false
  }
}

function cancel() {
  if (submitLoading.value) return
  open.value = false
  resetFormState()
}

watch(activeResource, async () => {
  ++listRequestSequence.value
  ++relationRequestSequence.value
  open.value = false
  records.value = []
  total.value = 0
  listError.value = ''
  queryParams.value = defaultQuery()
  resetFormState()
  resetSelection()
  if (isOptionValue.value) {
    try {
      await loadOptionSets()
    } catch (error) {
      proxy.$modal.msgError(errorMessage(error, '选项集加载失败'))
    }
  }
  await getList()
})

onMounted(async () => {
  try {
    await loadOptionSets()
  } catch (error) {
    proxy.$modal.msgError(errorMessage(error, '选项集加载失败'))
  }
  await getList()
})
</script>

<style scoped>
.masterdata-option-page :deep(.el-tabs) {
  margin-bottom: 12px;
}

.form-tip {
  margin-top: 4px;
  color: var(--el-color-warning);
  font-size: 12px;
  line-height: 18px;
}
</style>
