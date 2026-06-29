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

    <el-table v-loading="loading" :data="tableRows" row-key="id" :expand-row-keys="expandedTreeRowKeys" :tree-props="treeProps" :row-class-name="tableRowClassName" @expand-change="handleTreeExpandChange" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="50" align="center" />
      <el-table-column label="编码" align="center" prop="itemCode" min-width="140" :show-overflow-tooltip="true" />
      <el-table-column label="名称" align="left" prop="itemName" min-width="260" :show-overflow-tooltip="!isTreeTable">
        <template #default="scope">
          <el-tooltip v-if="isTreeTable" :content="productCategoryTreeTooltip(scope.row)" placement="top-start">
            <div class="product-category-tree-node" :class="productCategoryNodeClass(scope.row)" :style="productCategoryNodeStyle(scope.row)">
              <span class="product-category-branch" aria-hidden="true"></span>
              <el-tag class="product-category-level-tag" :type="productCategoryLevelTagType(scope.row)" size="small" effect="plain">{{ productCategoryLevelLabel(scope.row) }}</el-tag>
              <el-button class="product-category-name-button" link type="primary" @click="handleUpdate(scope.row)">{{ scope.row.itemName }}</el-button>
            </div>
          </el-tooltip>
          <el-button v-else link type="primary" @click="handleUpdate(scope.row)">{{ scope.row.itemName }}</el-button>
        </template>
      </el-table-column>
      <el-table-column v-if="currentConfig.categoryResource" label="所属分类" align="center" min-width="160" :show-overflow-tooltip="true">
        <template #default="scope">{{ relationName(currentConfig.categoryResource, scope.row.categoryId) }}</template>
      </el-table-column>
      <el-table-column v-if="currentConfig.seriesResource" label="所属系列" align="center" min-width="160" :show-overflow-tooltip="true">
        <template #default="scope">{{ relationName(currentConfig.seriesResource, scope.row.seriesId) }}</template>
      </el-table-column>
      <el-table-column v-if="currentConfig.parentEnabled && !isTreeTable" label="上级分类" align="center" min-width="160" :show-overflow-tooltip="true">
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

    <pagination v-show="!isTreeTable && total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />

    <el-dialog :title="title" v-model="open" width="680px" append-to-body>
      <el-form ref="recordRef" :model="form" :rules="rules" label-width="96px">
        <el-form-item v-if="form.id" label="编码" prop="itemCode">
          <el-input v-model="form.itemCode" maxlength="64" disabled />
        </el-form-item>
        <el-form-item label="名称" prop="itemName">
          <el-input v-model="form.itemName" placeholder="请输入名称" maxlength="120" />
        </el-form-item>
        <el-form-item v-if="currentConfig.parentEnabled" label="上级分类" prop="parentId">
          <el-select v-model="form.parentId" placeholder="请选择" clearable filterable style="width: 100%" @change="handleParentChange">
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
import { useRoute } from 'vue-router'
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
const props = defineProps({
  resourceGroup: {
    type: String,
    default: ''
  }
})
const route = useRoute()

const allResourceConfigs = [
  { value: 'product-category', label: '产品大类', parentEnabled: true, treeEnabled: true },
  { value: 'product-series', label: '产品系列', categoryResource: 'product-category' },
  { value: 'product-model', label: '工艺型号', categoryResource: 'product-category', seriesResource: 'product-series' },
  { value: 'material-category', label: '物料分类' },
  { value: 'material-item', label: '物料档案', categoryResource: 'material-category', specEnabled: true, unitEnabled: true },
  { value: 'accessory-category', label: '配件分类' },
  { value: 'accessory-item', label: '配件档案', categoryResource: 'accessory-category', specEnabled: true, unitEnabled: true },
  { value: 'sales-option-category', label: '销售选项分类' },
  { value: 'sales-option-value', label: '销售选项值', categoryResource: 'sales-option-category' }
]

const DEFAULT_RESOURCE_GROUP = 'product'
const resourceGroups = {
  product: {
    label: '产品配置',
    resources: ['product-category', 'product-series', 'product-model']
  },
  material: {
    label: '物料配置',
    resources: ['material-category', 'material-item']
  },
  accessory: {
    label: '配件配置',
    resources: ['accessory-category', 'accessory-item']
  },
  'sales-option': {
    label: '销售选项配置',
    resources: ['sales-option-category', 'sales-option-value']
  }
}

function normalizeResourceGroup(value) {
  const group = Array.isArray(value) ? value[0] : value
  return Object.prototype.hasOwnProperty.call(resourceGroups, group) ? group : DEFAULT_RESOURCE_GROUP
}

const activeResourceGroup = computed(() => normalizeResourceGroup(props.resourceGroup || route.query.group))
const resourceConfigs = computed(() => {
  const group = resourceGroups[activeResourceGroup.value] || resourceGroups[DEFAULT_RESOURCE_GROUP]
  return allResourceConfigs.filter(item => group.resources.includes(item.value))
})

function firstResourceForGroup(group) {
  return (resourceGroups[group] || resourceGroups[DEFAULT_RESOURCE_GROUP]).resources[0]
}

const activeResource = ref(firstResourceForGroup(activeResourceGroup.value))
const loading = ref(false)
const showSearch = ref(true)
const total = ref(0)
const recordList = ref([])
const expandedTreeRowKeys = ref([])
const selectedRows = ref([])
const ids = ref([])
const single = ref(true)
const multiple = ref(true)
const open = ref(false)
const title = ref('')
const relationOptions = ref({})
const PRODUCT_CATEGORY_MAX_DEPTH = 3
const PRODUCT_CATEGORY_LEVEL_LABELS = ['L1', 'L2', 'L3']
const treeProps = { children: 'children' }

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

const currentConfig = computed(() => resourceConfigs.value.find(item => item.value === activeResource.value) || resourceConfigs.value[0] || allResourceConfigs[0])
const isTreeTable = computed(() => currentConfig.value.treeEnabled === true)
const tableRows = computed(() => isTreeTable.value ? buildTreeRows(recordList.value) : recordList.value)
const categoryOptions = computed(() => relationOptions.value[currentConfig.value.categoryResource] || [])
const parentOptions = computed(() => {
  const options = relationOptions.value[currentConfig.value.value] || []
  if (!currentConfig.value.treeEnabled) {
    return options.filter(item => item.id !== form.value.id)
  }
  const descendants = productCategoryDescendantIds(form.value.id)
  const ownHeight = form.value.id ? productCategorySubtreeHeight(form.value.id) : 1
  return options.filter(item => item.id !== form.value.id && !descendants.has(item.id) && productCategoryDepth(item.id) + ownHeight <= PRODUCT_CATEGORY_MAX_DEPTH)
})
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
  resetFormState()
  resetQueryState()
  loadRelationOptions().then(getList)
})

watch(activeResourceGroup, () => {
  if (!resourceConfigs.value.some(item => item.value === activeResource.value)) {
    activeResource.value = firstResourceForGroup(activeResourceGroup.value)
    return
  }
  resetFormState()
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

function normalizeParentId(value) {
  return value === undefined || value === null || value === 0 ? undefined : value
}

function buildTreeRows(rows) {
  const nodeMap = new Map()
  rows.forEach(row => {
    nodeMap.set(row.id, { ...row, children: [] })
  })
  const roots = []
  nodeMap.forEach(node => {
    const parentId = normalizeParentId(node.parentId)
    const parent = parentId ? nodeMap.get(parentId) : undefined
    if (parent) {
      parent.children.push(node)
    } else {
      roots.push(node)
    }
  })
  return roots
}

function productCategoryItems() {
  return relationOptions.value['product-category'] || []
}

function productCategoryById() {
  return new Map(productCategoryItems().map(item => [item.id, item]))
}

function productCategoryChildrenByParent() {
  const children = new Map()
  productCategoryItems().forEach(item => {
    const parentId = normalizeParentId(item.parentId)
    if (!parentId) return
    if (!children.has(parentId)) children.set(parentId, [])
    children.get(parentId).push(item)
  })
  return children
}

function productCategoryDepth(id) {
  const byId = productCategoryById()
  const visited = new Set()
  let depth = 0
  let current = byId.get(id)
  while (current) {
    if (visited.has(current.id)) return PRODUCT_CATEGORY_MAX_DEPTH + 1
    visited.add(current.id)
    depth += 1
    current = byId.get(normalizeParentId(current.parentId))
  }
  return depth
}

function productCategoryRowDepth(row) {
  const depth = productCategoryDepth(row?.id)
  if (!depth) return 1
  return Math.min(depth, PRODUCT_CATEGORY_MAX_DEPTH)
}

function productCategoryLevelLabel(row) {
  return PRODUCT_CATEGORY_LEVEL_LABELS[productCategoryRowDepth(row) - 1] || `L${productCategoryRowDepth(row)}`
}

function productCategoryLevelTagType(row) {
  const depth = productCategoryRowDepth(row)
  if (depth === 1) return 'primary'
  if (depth === 2) return 'info'
  return 'warning'
}

function productCategoryNodeClass(row) {
  const depth = productCategoryRowDepth(row)
  return [`is-level-${depth}`, { 'is-leaf': !(row.children || []).length }]
}

function productCategoryNodeStyle(row) {
  return {
    '--category-depth-offset': `${Math.max(productCategoryRowDepth(row) - 1, 0) * 18}px`
  }
}

function productCategoryPath(row) {
  const byId = productCategoryById()
  const path = []
  const visited = new Set()
  let current = row
  while (current && !visited.has(current.id)) {
    visited.add(current.id)
    path.unshift(current.itemName)
    current = byId.get(normalizeParentId(current.parentId))
  }
  return path.join(' / ')
}

function productCategoryTreeTooltip(row) {
  const parentName = relationName('product-category', row.parentId) || '-'
  return `${productCategoryLevelLabel(row)} | Parent: ${parentName} | Path: ${productCategoryPath(row)}`
}

function tableRowClassName({ row }) {
  if (!isTreeTable.value) return ''
  return `product-category-row product-category-row-level-${productCategoryRowDepth(row)}`
}

function normalizeExpandKey(id) {
  return id === undefined || id === null ? undefined : String(id)
}

function currentTreeRowKeys() {
  return new Set(recordList.value.map(item => normalizeExpandKey(item.id)).filter(Boolean))
}

function pruneExpandedTreeRowKeys() {
  const availableKeys = currentTreeRowKeys()
  expandedTreeRowKeys.value = expandedTreeRowKeys.value.filter(key => availableKeys.has(key))
}

function mergeExpandedTreeRowKeys(keys) {
  const availableKeys = currentTreeRowKeys()
  const merged = new Set(expandedTreeRowKeys.value.filter(key => availableKeys.has(key)))
  keys.filter(Boolean).forEach(key => {
    if (availableKeys.has(key)) merged.add(key)
  })
  expandedTreeRowKeys.value = Array.from(merged)
}

function removeExpandedTreeRowKey(key) {
  expandedTreeRowKeys.value = expandedTreeRowKeys.value.filter(item => item !== key)
}

function productCategoryAncestorKeys(parentId) {
  const byId = productCategoryById()
  const keys = []
  const visited = new Set()
  let current = byId.get(normalizeParentId(parentId))
  while (current && !visited.has(current.id)) {
    visited.add(current.id)
    keys.unshift(normalizeExpandKey(current.id))
    current = byId.get(normalizeParentId(current.parentId))
  }
  return keys.filter(Boolean)
}

function isTreeSearchActive() {
  if (!isTreeTable.value) return false
  return Boolean((queryParams.value.itemCode || '').trim() || (queryParams.value.itemName || '').trim() || queryParams.value.status)
}

function productCategorySearchParentKeys(rows) {
  const keys = []
  rows.forEach(row => {
    keys.push(...productCategoryAncestorKeys(row.parentId))
  })
  return keys
}

function syncProductCategoryExpandedKeys(options = {}) {
  if (!isTreeTable.value) {
    expandedTreeRowKeys.value = []
    return
  }
  if (options.resetExpanded) {
    expandedTreeRowKeys.value = []
    return
  }
  const keys = []
  if (options.expandParentId) {
    keys.push(...productCategoryAncestorKeys(options.expandParentId))
  }
  if (options.expandSearchMatches) {
    keys.push(...productCategorySearchParentKeys(recordList.value))
  }
  if (keys.length > 0) {
    mergeExpandedTreeRowKeys(keys)
  } else {
    pruneExpandedTreeRowKeys()
  }
}

function handleTreeExpandChange(row, expanded) {
  if (!isTreeTable.value) return
  const key = normalizeExpandKey(row?.id)
  if (!key) return
  if (Array.isArray(expanded)) {
    const isExpanded = expanded.some(item => normalizeExpandKey(item.id) === key)
    if (isExpanded) {
      mergeExpandedTreeRowKeys([key])
    } else {
      removeExpandedTreeRowKey(key)
    }
    return
  }
  if (expanded === true) {
    mergeExpandedTreeRowKeys([key])
  } else {
    removeExpandedTreeRowKey(key)
  }
}

function productCategorySubtreeHeight(id, visited = new Set()) {
  if (!id || visited.has(id)) return 1
  visited.add(id)
  const children = productCategoryChildrenByParent().get(id) || []
  if (children.length === 0) return 1
  return 1 + Math.max(...children.map(child => productCategorySubtreeHeight(child.id, visited)))
}

function productCategoryDescendantIds(id) {
  const descendants = new Set()
  if (!id) return descendants
  const children = productCategoryChildrenByParent()
  const stack = [...(children.get(id) || [])]
  while (stack.length > 0) {
    const current = stack.shift()
    descendants.add(current.id)
    stack.push(...(children.get(current.id) || []))
  }
  return descendants
}

function validateProductCategoryParent() {
  if (!currentConfig.value.treeEnabled || !form.value.parentId) return true
  if (form.value.id && form.value.parentId === form.value.id) {
    proxy.$modal.msgError('上级分类不能选择自己')
    return false
  }
  if (productCategoryDescendantIds(form.value.id).has(form.value.parentId)) {
    proxy.$modal.msgError('上级分类不能选择自己的子级或后代')
    return false
  }
  const ownHeight = form.value.id ? productCategorySubtreeHeight(form.value.id) : 1
  if (productCategoryDepth(form.value.parentId) + ownHeight > PRODUCT_CATEGORY_MAX_DEPTH) {
    proxy.$modal.msgError('产品大类最多只允许3级')
    return false
  }
  return true
}

function handleParentChange() {
  if (!validateProductCategoryParent()) {
    form.value.parentId = undefined
  }
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
  expandedTreeRowKeys.value = []
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

function getList(options = {}) {
  loading.value = true
  const params = { ...queryParams.value }
  if (isTreeTable.value) {
    delete params.pageNum
    delete params.pageSize
  }
  return listMasterData(activeResource.value, params).then(response => {
    recordList.value = response.rows || []
    total.value = isTreeTable.value ? recordList.value.length : response.total || 0
    syncProductCategoryExpandedKeys(options)
  }).finally(() => {
    loading.value = false
  })
}

function handleQuery() {
  queryParams.value.pageNum = 1
  getList({ expandSearchMatches: isTreeSearchActive() })
}

function resetQuery() {
  proxy.resetForm('queryRef')
  resetQueryState()
  getList({ resetExpanded: true })
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
    return loadRelationOptions().then(() => getList())
  }).then(() => {
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
  if (!validateProductCategoryParent()) return
  proxy.$refs.recordRef.validate(valid => {
    if (!valid) return
    const isEdit = Boolean(form.value.id)
    const parentIdToExpand = !isEdit ? normalizeParentId(form.value.parentId) : undefined
    const action = form.value.id ? updateMasterData(activeResource.value, form.value) : addMasterData(activeResource.value, form.value)
    action.then(() => {
      proxy.$modal.msgSuccess(form.value.id ? '修改成功' : '新增成功')
      open.value = false
      return loadRelationOptions().then(() => getList({ expandParentId: parentIdToExpand }))
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
.masterdata-page :deep(.product-category-row .el-table__expand-icon) {
  color: #409eff;
  margin-right: 4px;
}
.masterdata-page :deep(.product-category-row-level-1) {
  --category-row-bg: #f7fbff;
}
.masterdata-page :deep(.product-category-row-level-2) {
  --category-row-bg: #ffffff;
}
.masterdata-page :deep(.product-category-row-level-3) {
  --category-row-bg: #fcfcfd;
}
.masterdata-page :deep(.product-category-row:hover > td) {
  background-color: var(--category-row-bg);
}
.product-category-tree-node {
  position: relative;
  display: inline-flex;
  align-items: center;
  max-width: 100%;
  min-height: 28px;
  gap: 6px;
  padding-left: calc(var(--category-depth-offset) + 18px);
  vertical-align: middle;
}
.product-category-tree-node.is-level-1 {
  padding-left: 0;
}
.product-category-tree-node.is-level-1 .product-category-branch {
  display: none;
}
.product-category-branch {
  position: absolute;
  left: var(--category-depth-offset);
  top: 50%;
  width: 14px;
  border-top: 1px solid #c9d4df;
}
.product-category-branch::before {
  position: absolute;
  left: 0;
  top: -13px;
  height: 26px;
  border-left: 1px solid #d5dde5;
  content: '';
}
.product-category-level-tag {
  flex: 0 0 auto;
  min-width: 22px;
  height: 16px;
  padding: 0 4px;
  justify-content: center;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 500;
  line-height: 14px;
  opacity: 0.78;
}
.product-category-name-button {
  min-width: 0;
  max-width: 360px;
  overflow: hidden;
  text-align: left;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.product-category-tree-node.is-level-1 .product-category-name-button {
  color: #1f2d3d;
  font-weight: 600;
}
.product-category-tree-node.is-level-2 .product-category-name-button {
  color: #606266;
  font-weight: 500;
}
.product-category-tree-node.is-level-3 .product-category-name-button {
  color: #909399;
  font-weight: 400;
}
</style>
