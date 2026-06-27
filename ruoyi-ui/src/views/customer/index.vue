<template>
  <div class="app-container customer-page">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="82px">
      <el-form-item label="客户名称" prop="customerName">
        <el-input v-model="queryParams.customerName" placeholder="请输入客户名称" clearable style="width: 220px" @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="客户简称" prop="shortName">
        <el-input v-model="queryParams.shortName" placeholder="请输入客户简称" clearable style="width: 180px" @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="客户性质" prop="customerNature">
        <el-select v-model="queryParams.customerNature" placeholder="请选择" clearable style="width: 140px" @change="handleQueryNatureChange">
          <el-option v-for="item in customerNatureOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item v-if="queryParams.customerNature === 'PUBLIC'" label="公共渠道" prop="publicChannel">
        <el-select v-model="queryParams.publicChannel" placeholder="请选择" clearable style="width: 150px">
          <el-option v-for="item in publicChannelOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="归属方式" prop="ownerType">
        <el-select v-model="queryParams.ownerType" placeholder="请选择" clearable style="width: 150px">
          <el-option v-for="item in ownerTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="联系人" prop="contactName">
        <el-input v-model="queryParams.contactName" placeholder="请输入联系人" clearable style="width: 180px" @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="联系电话" prop="contactPhone">
        <el-input v-model="queryParams.contactPhone" placeholder="请输入联系电话" clearable style="width: 180px" @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="客户类型" prop="customerType">
        <el-select v-model="queryParams.customerType" placeholder="请选择" clearable style="width: 160px">
          <el-option v-for="item in customerTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="客户等级" prop="customerLevel">
        <el-select v-model="queryParams.customerLevel" placeholder="请选择" clearable style="width: 140px">
          <el-option v-for="item in customerLevelOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="业务员" prop="ownerUserId">
        <el-select v-model="queryParams.ownerUserId" filterable remote clearable reserve-keyword :remote-method="loadSalesmen" placeholder="请选择业务员" style="width: 180px">
          <el-option v-for="item in salesmanOptions" :key="item.userId" :label="salesmanLabel(item)" :value="item.userId" />
        </el-select>
      </el-form-item>
      <el-form-item label="归属部门" prop="ownerDeptId">
        <el-tree-select v-model="queryParams.ownerDeptId" :data="deptOptions" :props="{ value: 'id', label: 'label', children: 'children' }" value-key="id" clearable check-strictly placeholder="请选择部门" style="width: 200px" />
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
        <el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermi="['business:customer:add']">新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="success" plain icon="Edit" :disabled="single || hasPublicSelection" @click="handleUpdate" v-hasPermi="['business:customer:edit']">修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="warning" plain icon="Download" @click="handleExport" v-hasPermi="['business:customer:export']">导出</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="customerList" class="customer-table" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="50" align="center" />
      <el-table-column label="客户编码" align="center" prop="customerCode" width="145" :show-overflow-tooltip="true" class-name="customer-code-cell" />
      <el-table-column label="客户名称" align="left" prop="customerName" min-width="180" :show-overflow-tooltip="true">
        <template #default="scope">
          <el-button link type="primary" @click="handleView(scope.row)">{{ scope.row.customerName }}</el-button>
        </template>
      </el-table-column>
      <el-table-column label="客户性质" align="center" prop="customerNature" width="110">
        <template #default="scope">
          <el-tag v-if="scope.row.customerNature === 'PUBLIC'" type="warning">公共客户</el-tag>
          <span v-else>真实客户</span>
        </template>
      </el-table-column>
      <el-table-column label="公共渠道" align="center" prop="publicChannel" width="110">
        <template #default="scope">{{ optionLabel(publicChannelOptions, scope.row.publicChannel) }}</template>
      </el-table-column>
      <el-table-column label="客户类型" align="center" prop="customerType" width="110">
        <template #default="scope">{{ customerTypeDisplay(scope.row) }}</template>
      </el-table-column>
      <el-table-column label="客户等级" align="center" prop="customerLevel" width="90">
        <template #default="scope">{{ customerLevelDisplay(scope.row) }}</template>
      </el-table-column>
      <el-table-column label="联系人" align="center" prop="contactName" width="110" :show-overflow-tooltip="true" />
      <el-table-column label="联系电话" align="center" prop="contactPhone" width="130" :show-overflow-tooltip="true" />
      <el-table-column label="省市区" align="center" min-width="170" :show-overflow-tooltip="true">
        <template #default="scope">{{ formatArea(scope.row) }}</template>
      </el-table-column>
      <el-table-column label="归属方式" align="center" prop="ownerType" width="110">
        <template #default="scope">{{ optionLabel(ownerTypeOptions, scope.row.ownerType) }}</template>
      </el-table-column>
      <el-table-column label="归属业务员" align="center" prop="ownerUserName" width="120" :show-overflow-tooltip="true">
        <template #default="scope">{{ ownerUserDisplay(scope.row) }}</template>
      </el-table-column>
      <el-table-column label="归属部门" align="center" prop="ownerDeptName" width="130" :show-overflow-tooltip="true" />
      <el-table-column label="收益口径" align="center" prop="ownerProfitMode" width="110">
        <template #default="scope">{{ optionLabel(ownerProfitModeOptions, scope.row.ownerProfitMode) }}</template>
      </el-table-column>
      <el-table-column label="状态" align="center" prop="status" width="90">
        <template #default="scope">
          <el-switch v-model="scope.row.status" active-value="0" inactive-value="1" :disabled="isPublicRow(scope.row)" @change="handleStatusChange(scope.row)" />
        </template>
      </el-table-column>
      <el-table-column label="创建时间" align="center" prop="createTime" width="160">
        <template #default="scope">{{ parseTime(scope.row.createTime) }}</template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="190" fixed="right" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-tooltip content="详情" placement="top">
            <el-button link type="primary" icon="View" @click="handleView(scope.row)" v-hasPermi="['business:customer:query']"></el-button>
          </el-tooltip>
          <el-tooltip v-if="!isPublicRow(scope.row)" content="修改" placement="top">
            <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['business:customer:edit']"></el-button>
          </el-tooltip>
          <el-tooltip v-if="!isPublicRow(scope.row)" content="归属变更" placement="top">
            <el-button link type="primary" icon="Switch" @click="handleTransfer(scope.row)" v-hasPermi="['business:customer:owner:transfer']"></el-button>
          </el-tooltip>
          <el-tooltip v-if="!isPublicRow(scope.row)" content="删除" placement="top">
            <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['business:customer:remove']"></el-button>
          </el-tooltip>
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />

    <el-dialog :title="title" v-model="open" width="980px" append-to-body>
      <el-form ref="customerRef" :model="form" :rules="rules" label-width="106px">
        <el-tabs v-model="editTab">
          <el-tab-pane label="基础信息" name="base">
            <el-row>
              <el-col :span="12">
                <el-form-item label="客户名称" prop="customerName">
                  <el-input v-model="form.customerName" placeholder="请输入客户名称" maxlength="80" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="客户简称" prop="shortName">
                  <el-input v-model="form.shortName" placeholder="选填，不填则同客户名称" maxlength="50" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="客户性质" prop="customerNature">
                  <el-radio-group v-model="form.customerNature" @change="handleFormNatureChange">
                    <el-radio-button label="REAL">真实客户</el-radio-button>
                  </el-radio-group>
                </el-form-item>
              </el-col>
              <el-col v-if="isPublicCustomerForm" :span="12">
                <el-form-item label="公共渠道" prop="publicChannel" :required="isPublicCustomerForm">
                  <el-select v-model="form.publicChannel" placeholder="请选择公共渠道" style="width: 100%">
                    <el-option v-for="item in publicChannelOptions" :key="item.value" :label="item.label" :value="item.value" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col v-if="isPublicCustomerForm" :span="24">
                <el-alert
                  title="公共客户仅用于订单归类，实际购买人、联系电话、收货地址、接待业务员请在销售订单中填写。"
                  type="warning"
                  :closable="false"
                  show-icon
                />
              </el-col>
              <el-col :span="12">
                <el-form-item label="客户类型" prop="customerType">
                  <el-select v-model="form.customerType" placeholder="请选择客户类型" style="width: 100%">
                    <el-option v-for="item in customerTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="客户等级" prop="customerLevel">
                  <el-select v-model="form.customerLevel" placeholder="请选择客户等级" style="width: 100%">
                    <el-option v-for="item in customerLevelOptions" :key="item.value" :label="item.label" :value="item.value" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col v-if="!isPublicCustomerForm" :span="12">
                <el-form-item label="归属方式" prop="ownerType" :required="!isPublicCustomerForm">
                  <el-radio-group v-model="form.ownerType" @change="handleOwnerTypeChange">
                    <el-radio-button label="FACTORY">厂内</el-radio-button>
                    <el-radio-button label="SALESMAN">业务员</el-radio-button>
                  </el-radio-group>
                </el-form-item>
              </el-col>
              <el-col v-if="!isPublicCustomerForm && isFactoryOwnerForm" :span="12">
                <el-form-item label="归属业务员">
                  <el-tag type="info">厂内</el-tag>
                </el-form-item>
              </el-col>
              <el-col v-if="isSalesmanOwnerForm" :span="12">
                <el-form-item label="归属业务员" prop="ownerUserId" :required="isSalesmanOwnerForm">
                  <el-select v-model="form.ownerUserId" filterable remote clearable reserve-keyword :remote-method="loadSalesmen" placeholder="请选择业务员" style="width: 100%">
                    <el-option v-for="item in salesmanOptions" :key="item.userId" :label="salesmanLabel(item)" :value="item.userId" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col v-if="isSalesmanOwnerForm" :span="12">
                <el-form-item label="归属来源" prop="ownerSource" :required="isSalesmanOwnerForm">
                  <el-radio-group v-model="form.ownerSource" @change="handleOwnerSourceChange">
                    <el-radio-button label="FACTORY_ASSIGNED">厂内分配维护（维护费）</el-radio-button>
                    <el-radio-button label="SALESMAN_SELF">业务员自有客户（业务提成）</el-radio-button>
                  </el-radio-group>
                </el-form-item>
              </el-col>
              <el-col v-if="isSalesmanOwnerForm" :span="12">
                <el-form-item label="收益口径">
                  <el-tag>{{ optionLabel(ownerProfitModeOptions, form.ownerProfitMode) }}</el-tag>
                </el-form-item>
              </el-col>
              <el-col v-if="!isPublicCustomerForm" :span="12">
                <el-form-item label="主联系人" prop="contactName" :required="!isPublicCustomerForm">
                  <el-input v-model="form.contactName" placeholder="请输入联系人" maxlength="30" />
                </el-form-item>
              </el-col>
              <el-col v-if="!isPublicCustomerForm" :span="12">
                <el-form-item label="联系电话" prop="contactPhone" :required="!isPublicCustomerForm">
                  <el-input v-model="form.contactPhone" placeholder="请输入联系电话" maxlength="30" />
                </el-form-item>
              </el-col>
              <el-col v-if="!isPublicCustomerForm" :span="12">
                <el-form-item label="微信号" prop="wechat">
                  <el-input v-model="form.wechat" placeholder="请输入微信号" maxlength="50" />
                </el-form-item>
              </el-col>
              <el-col v-if="!isPublicCustomerForm" :span="24">
                <el-form-item label="省市区" prop="areaPath" :required="!isPublicCustomerForm">
                  <el-cascader
                    v-model="form.areaPath"
                    :options="areaOptions"
                    :props="areaCascaderProps"
                    filterable
                    clearable
                    placeholder="请选择省 / 市 / 区"
                    style="width: 100%"
                    @change="handleCustomerAreaChange"
                  />
                </el-form-item>
              </el-col>
              <el-col v-if="!isPublicCustomerForm" :span="24">
                <el-form-item label="详细地址" prop="address" :required="!isPublicCustomerForm">
                  <el-input v-model="form.address" placeholder="请输入详细地址" maxlength="200" />
                </el-form-item>
              </el-col>
              <el-col :span="24">
                <el-form-item label="备注" prop="remark">
                  <el-input v-model="form.remark" type="textarea" placeholder="请输入备注" />
                </el-form-item>
              </el-col>
              <el-col v-if="form.customerId && !isPublicCustomerForm" :span="24">
                <el-form-item label="同步选项">
                  <div class="sync-options">
                    <div class="sync-option">
                      <el-checkbox v-model="form.syncDefaultContact">同步到默认联系人</el-checkbox>
                      <span class="sync-help">将主联系人、电话、微信同步到默认联系人</span>
                      <span v-if="syncDefaultContactHint" class="sync-hint">{{ syncDefaultContactHint }}</span>
                    </div>
                    <div class="sync-option">
                      <el-checkbox v-model="form.syncDefaultAddress">同步到默认收货地址</el-checkbox>
                      <span class="sync-help">将主联系人、电话、省市区、详细地址同步到默认收货地址</span>
                      <span v-if="syncDefaultAddressHint" class="sync-hint">{{ syncDefaultAddressHint }}</span>
                    </div>
                  </div>
                </el-form-item>
              </el-col>
            </el-row>
          </el-tab-pane>
          <el-tab-pane v-if="!isPublicCustomerForm" label="联系人" name="contacts">
            <el-button type="primary" plain icon="Plus" @click="addContact">新增联系人</el-button>
            <el-table :data="form.contacts" class="mt8">
              <el-table-column label="默认" width="70" align="center">
                <template #default="scope">
                  <el-radio v-model="scope.row.isDefault" label="Y" @change="setDefaultContact(scope.$index)">是</el-radio>
                </template>
              </el-table-column>
              <el-table-column label="联系人" min-width="130">
                <template #default="scope"><el-input v-model="scope.row.contactName" /></template>
              </el-table-column>
              <el-table-column label="电话" min-width="130">
                <template #default="scope"><el-input v-model="scope.row.phone" /></template>
              </el-table-column>
              <el-table-column label="微信" min-width="120">
                <template #default="scope"><el-input v-model="scope.row.wechat" /></template>
              </el-table-column>
              <el-table-column label="角色" width="120">
                <template #default="scope">
                  <el-select v-model="scope.row.contactRole" placeholder="请选择">
                    <el-option v-for="item in contactRoleOptions" :key="item.value" :label="item.label" :value="item.value" />
                  </el-select>
                </template>
              </el-table-column>
              <el-table-column label="职位" min-width="110">
                <template #default="scope"><el-input v-model="scope.row.position" /></template>
              </el-table-column>
              <el-table-column label="备注" min-width="140">
                <template #default="scope"><el-input v-model="scope.row.remark" /></template>
              </el-table-column>
              <el-table-column label="操作" width="70" align="center">
                <template #default="scope"><el-button link type="primary" icon="Delete" @click="removeContact(scope.$index)"></el-button></template>
              </el-table-column>
            </el-table>
          </el-tab-pane>
          <el-tab-pane v-if="!isPublicCustomerForm" label="收货地址" name="addresses">
            <el-button type="primary" plain icon="Plus" @click="addAddress">新增地址</el-button>
            <el-table :data="form.addresses" class="mt8">
              <el-table-column label="默认" width="70" align="center">
                <template #default="scope">
                  <el-radio v-model="scope.row.isDefault" label="Y" @change="setDefaultAddress(scope.$index)">是</el-radio>
                </template>
              </el-table-column>
              <el-table-column label="收货人" width="120">
                <template #default="scope"><el-input v-model="scope.row.receiverName" /></template>
              </el-table-column>
              <el-table-column label="电话" width="130">
                <template #default="scope"><el-input v-model="scope.row.receiverPhone" /></template>
              </el-table-column>
              <el-table-column label="省/市/区" min-width="230">
                <template #default="scope">
                  <el-cascader
                    v-model="scope.row.areaPath"
                    :options="areaOptions"
                    :props="areaCascaderProps"
                    filterable
                    clearable
                    placeholder="请选择省 / 市 / 区"
                    style="width: 100%"
                    @change="handleAddressAreaChange(scope.row)"
                  />
                </template>
              </el-table-column>
              <el-table-column label="详细地址" min-width="220">
                <template #default="scope"><el-input v-model="scope.row.detailAddress" /></template>
              </el-table-column>
              <el-table-column label="物流线路" width="130">
                <template #default="scope"><el-input v-model="scope.row.logisticsLine" /></template>
              </el-table-column>
              <el-table-column label="操作" width="70" align="center">
                <template #default="scope"><el-button link type="primary" icon="Delete" @click="removeAddress(scope.$index)"></el-button></template>
              </el-table-column>
            </el-table>
          </el-tab-pane>
        </el-tabs>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitForm">确 定</el-button>
          <el-button @click="cancel">取 消</el-button>
        </div>
      </template>
    </el-dialog>

    <el-drawer v-model="detailOpen" :title="detailTitle" size="78%" append-to-body>
      <el-tabs v-model="detailTab" v-if="detail.customer">
        <el-tab-pane label="基础信息" name="base">
          <el-alert
            v-if="isPublicDetail"
            title="公共客户仅用于订单归类，实际购买人、联系电话、收货地址、接待业务员请在销售订单中填写。"
            type="warning"
            show-icon
            :closable="false"
            class="public-customer-tip"
          />
          <el-descriptions :column="3" border>
            <el-descriptions-item label="客户编码">{{ detail.customer.customerCode }}</el-descriptions-item>
            <el-descriptions-item label="客户名称">{{ detail.customer.customerName }}</el-descriptions-item>
            <el-descriptions-item label="客户性质">{{ optionLabel(customerNatureOptions, detail.customer.customerNature) }}</el-descriptions-item>
            <el-descriptions-item v-if="detail.customer.customerNature === 'PUBLIC'" label="公共渠道">{{ optionLabel(publicChannelOptions, detail.customer.publicChannel) }}</el-descriptions-item>
            <el-descriptions-item label="客户类型">{{ customerTypeDisplay(detail.customer) }}</el-descriptions-item>
            <el-descriptions-item label="客户等级">{{ customerLevelDisplay(detail.customer) }}</el-descriptions-item>
            <el-descriptions-item v-if="!isPublicDetail" label="主联系人">{{ detail.customer.contactName }}</el-descriptions-item>
            <el-descriptions-item v-if="!isPublicDetail" label="联系电话">{{ detail.customer.contactPhone }}</el-descriptions-item>
            <el-descriptions-item label="归属方式">{{ optionLabel(ownerTypeOptions, detail.customer.ownerType) }}</el-descriptions-item>
            <el-descriptions-item label="归属来源">{{ optionLabel(ownerSourceAllOptions, detail.customer.ownerSource) }}</el-descriptions-item>
            <el-descriptions-item label="收益口径">{{ optionLabel(ownerProfitModeOptions, detail.customer.ownerProfitMode) }}</el-descriptions-item>
            <el-descriptions-item v-if="!isPublicDetail" label="归属业务员">{{ ownerUserDisplay(detail.customer) }}</el-descriptions-item>
            <el-descriptions-item v-if="!isPublicDetail" label="归属部门">{{ detail.customer.ownerDeptName }}</el-descriptions-item>
            <el-descriptions-item v-if="!isPublicDetail" label="归属生效时间">{{ parseTime(detail.customer.ownerEffectiveTime) }}</el-descriptions-item>
            <el-descriptions-item label="状态">{{ detail.customer.status === '0' ? '正常' : '停用' }}</el-descriptions-item>
            <el-descriptions-item v-if="!isPublicDetail" label="地址" :span="3">{{ fullAddress(detail.customer) }}</el-descriptions-item>
            <el-descriptions-item label="备注" :span="3">{{ detail.customer.remark }}</el-descriptions-item>
          </el-descriptions>
        </el-tab-pane>
        <el-tab-pane v-if="!isPublicDetail" label="联系人" name="contacts">
          <el-table :data="detail.customer.contacts || []">
            <el-table-column label="默认" prop="isDefault" width="80" />
            <el-table-column label="联系人" prop="contactName" />
            <el-table-column label="电话" prop="phone" />
            <el-table-column label="微信" prop="wechat" />
            <el-table-column label="角色" prop="contactRole" />
            <el-table-column label="职位" prop="position" />
            <el-table-column label="备注" prop="remark" />
          </el-table>
        </el-tab-pane>
        <el-tab-pane v-if="!isPublicDetail" label="收货地址" name="addresses">
          <el-table :data="detail.customer.addresses || []">
            <el-table-column label="默认" prop="isDefault" width="80" />
            <el-table-column label="收货人" prop="receiverName" />
            <el-table-column label="电话" prop="receiverPhone" />
            <el-table-column label="省" prop="province" />
            <el-table-column label="市" prop="city" />
            <el-table-column label="区" prop="district" />
            <el-table-column label="详细地址" prop="detailAddress" min-width="220" />
            <el-table-column label="物流线路" prop="logisticsLine" />
          </el-table>
        </el-tab-pane>
        <el-tab-pane label="资金与政策" name="fund">
          <el-alert
            v-if="isPublicDetail"
            title="公共客户不启用客户级定金，订单收款请在销售订单中记录本单定金。"
            type="warning"
            :closable="false"
            show-icon
          />
          <template v-else>
          <el-row :gutter="12" class="fund-row">
            <el-col :span="8" v-for="account in detail.fundAccounts || []" :key="account.accountType">
              <el-card shadow="never">
                <template #header>{{ accountTypeLabel(account.accountType) }}</template>
                <div class="fund-amount">余额：{{ moneyText(account.balanceAmount) }}</div>
                <div>冻结：{{ moneyText(account.frozenAmount) }}</div>
                <div>可用：{{ moneyText(account.availableAmount) }}</div>
              </el-card>
            </el-col>
          </el-row>
          <div class="detail-actions">
            <el-button type="primary" plain icon="Money" @click="handleFundEntry" v-hasPermi="['business:customer:fund:deposit']">录入定金</el-button>
            <el-button type="success" plain icon="Plus" @click="handleSampleRebate" v-hasPermi="['business:customer:sample-rebate:create']">生成样品返现</el-button>
          </div>
          <el-divider content-position="left">样品支持政策</el-divider>
          <el-form :model="samplePolicy" label-width="126px" class="policy-form">
            <el-row>
              <el-col :span="8">
                <el-form-item label="支持模式">
                  <el-select v-model="samplePolicy.supportMode" style="width: 100%">
                    <el-option v-for="item in supportModeOptions" :key="item.value" :label="item.label" :value="item.value" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="总支持比例">
                  <el-input-number v-model="samplePolicy.totalSupportRate" :precision="4" :step="0.05" :min="0" :max="1" />
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="当场实收折扣">
                  <el-input-number v-model="samplePolicy.instantDiscountRate" :precision="4" :step="0.05" :min="0" :max="1" />
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="发货抵扣比例">
                  <el-input-number v-model="samplePolicy.deliveryDeductRate" :precision="4" :step="0.05" :min="0" :max="1" />
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="单次抵扣上限">
                  <el-input-number v-model="samplePolicy.maxDeductPerDelivery" :precision="2" :min="0" />
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="状态">
                  <el-radio-group v-model="samplePolicy.status">
                    <el-radio value="0">启用</el-radio>
                    <el-radio value="1">停用</el-radio>
                  </el-radio-group>
                </el-form-item>
              </el-col>
              <el-col :span="24">
                <el-form-item label="备注">
                  <el-input v-model="samplePolicy.remark" type="textarea" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-button type="primary" icon="Check" @click="submitSamplePolicy" v-hasPermi="['business:customer:sample-policy:edit']">保存政策</el-button>
          </el-form>
          <el-divider content-position="left">样品返现记录</el-divider>
          <el-table :data="detail.sampleRebates || []">
            <el-table-column label="样品订单号" prop="sampleOrderNo" width="150" />
            <el-table-column label="样品金额" prop="sampleAmount" width="100" />
            <el-table-column label="支持方式" width="130"><template #default="scope">{{ optionLabel(supportModeOptions, scope.row.supportMode) }}</template></el-table-column>
            <el-table-column label="即时优惠金额" prop="instantDiscountAmount" width="120" />
            <el-table-column label="返现金额" prop="rebateAmount" width="100" />
            <el-table-column label="已用金额" prop="usedAmount" width="100" />
            <el-table-column label="剩余金额" prop="remainingAmount" width="100" />
            <el-table-column label="状态" prop="status" width="100" />
            <el-table-column label="创建时间" prop="createTime" width="160" />
            <el-table-column label="备注" prop="remark" min-width="160" />
          </el-table>
          <el-divider content-position="left">资金流水</el-divider>
          <el-table :data="detail.fundFlows || []">
            <el-table-column label="流水号" prop="flowNo" width="180" />
            <el-table-column label="账户" width="150"><template #default="scope">{{ accountTypeLabel(scope.row.accountType) }}</template></el-table-column>
            <el-table-column label="类型" prop="flowType" width="190" />
            <el-table-column label="金额" prop="amount" width="100" />
            <el-table-column label="变动前" prop="beforeBalance" width="100" />
            <el-table-column label="变动后" prop="afterBalance" width="100" />
            <el-table-column label="关联单号" prop="relatedBizNo" width="140" />
            <el-table-column label="时间" prop="occurTime" width="160" />
            <el-table-column label="备注" prop="remark" min-width="160" />
          </el-table>
          </template>
        </el-tab-pane>
        <el-tab-pane label="操作日志" name="logs">
          <el-table :data="detail.ownerLogs || []">
            <el-table-column label="原归属" width="120"><template #default="scope">{{ optionLabel(ownerTypeOptions, scope.row.oldOwnerType) }}</template></el-table-column>
            <el-table-column label="新归属" width="120"><template #default="scope">{{ optionLabel(ownerTypeOptions, scope.row.newOwnerType) }}</template></el-table-column>
            <el-table-column label="原来源" width="150"><template #default="scope">{{ optionLabel(ownerSourceAllOptions, scope.row.oldOwnerSource) }}</template></el-table-column>
            <el-table-column label="新来源" width="150"><template #default="scope">{{ optionLabel(ownerSourceAllOptions, scope.row.newOwnerSource) }}</template></el-table-column>
            <el-table-column label="原收益口径" width="120"><template #default="scope">{{ optionLabel(ownerProfitModeOptions, scope.row.oldOwnerProfitMode) }}</template></el-table-column>
            <el-table-column label="新收益口径" width="120"><template #default="scope">{{ optionLabel(ownerProfitModeOptions, scope.row.newOwnerProfitMode) }}</template></el-table-column>
            <el-table-column label="原业务员" prop="oldOwnerUserName" />
            <el-table-column label="新业务员" prop="newOwnerUserName" />
            <el-table-column label="原部门" prop="oldDeptName" />
            <el-table-column label="新部门" prop="newDeptName" />
            <el-table-column label="原生效时间" prop="oldOwnerEffectiveTime" width="160" />
            <el-table-column label="新生效时间" prop="newOwnerEffectiveTime" width="160" />
            <el-table-column label="原因" prop="changeReason" />
            <el-table-column label="操作人" prop="changeBy" />
            <el-table-column label="时间" prop="changeTime" width="160" />
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </el-drawer>

    <el-dialog title="归属变更" v-model="transferOpen" width="620px" append-to-body>
      <el-form :model="transferForm" label-width="110px">
        <el-alert
          title="归属变更只影响生效时间之后提交的销售订单；历史订单归属不自动回算。"
          type="warning"
          show-icon
          :closable="false"
          class="mb8"
        />
        <el-form-item label="变更方式">
          <el-radio-group v-model="transferForm.transferMode" @change="handleTransferModeChange">
            <el-radio-button v-for="item in transferModeOptions" :key="item.value" :label="item.value">{{ item.label }}</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="transferRequiresSalesman()" label="新业务员" required>
          <el-select v-model="transferForm.newOwnerUserId" filterable remote clearable :remote-method="loadSalesmen" placeholder="请选择业务员" style="width: 100%">
            <el-option v-for="item in salesmanOptions" :key="item.userId" :label="salesmanLabel(item)" :value="item.userId" />
          </el-select>
        </el-form-item>
        <el-form-item label="收益口径">
          <el-tag>{{ transferProfitModeLabel }}</el-tag>
        </el-form-item>
        <el-form-item label="生效时间">
          <el-date-picker v-model="transferForm.effectiveTime" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" placeholder="请选择生效时间" style="width: 100%" />
        </el-form-item>
        <el-form-item label="变更原因" required>
          <el-input v-model="transferForm.changeReason" type="textarea" maxlength="200" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="transferForm.remark" type="textarea" maxlength="200" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button type="primary" @click="submitTransfer">确 定</el-button>
        <el-button @click="transferOpen = false">取 消</el-button>
      </template>
    </el-dialog>

    <el-dialog :title="fundTitle" v-model="fundOpen" width="520px" append-to-body>
      <el-form :model="fundForm" label-width="118px">
        <el-form-item label="收款金额">
          <el-input-number v-model="fundForm.amount" :precision="2" :min="0" style="width: 100%" />
        </el-form-item>
        <el-form-item label="收款凭证号">
          <el-input v-model="fundForm.receiptNo" placeholder="选填" maxlength="64" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="fundForm.remark" type="textarea" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button type="primary" @click="submitFundEntry">确 定</el-button>
        <el-button @click="fundOpen = false">取 消</el-button>
      </template>
    </el-dialog>

    <el-dialog title="生成样品返现" v-model="rebateOpen" width="620px" append-to-body>
      <el-form :model="rebateForm" label-width="126px">
        <el-row>
          <el-col :span="12"><el-form-item label="样品订单号"><el-input v-model="rebateForm.sampleOrderNo" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="样品原价"><el-input-number v-model="rebateForm.sampleAmount" :precision="2" :min="0" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="支持模式"><el-select v-model="rebateForm.supportMode"><el-option v-for="item in supportModeOptions" :key="item.value" :label="item.label" :value="item.value" /></el-select></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="总支持比例"><el-input-number v-model="rebateForm.totalSupportRate" :precision="4" :step="0.05" :min="0" :max="1" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="当场实收折扣"><el-input-number v-model="rebateForm.instantDiscountRate" :precision="4" :step="0.05" :min="0" :max="1" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="当场优惠金额"><el-input-number v-model="rebateForm.instantDiscountAmount" :precision="2" :min="0" /></el-form-item></el-col>
          <el-col :span="24"><el-form-item label="备注"><el-input v-model="rebateForm.remark" type="textarea" /></el-form-item></el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button type="primary" @click="submitSampleRebate">确 定</el-button>
        <el-button @click="rebateOpen = false">取 消</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="Customer">
import { addCustomer, addFundDeposit, changeCustomerStatus, createSampleRebate, delCustomer, duplicateWarning, getCustomer, listCustomer, listSalesmen, saveSamplePolicy, transferOwner, updateCustomer } from "@/api/customer"
import { areaCascaderProps, areaOptions, findAreaPathByCode, findAreaPathByName, resolveAreaPathLabels } from "@/utils/region-data"

const { proxy } = getCurrentInstance()

const customerTypeOptions = [
  { label: "经销商", value: "DEALER" },
  { label: "工程客户", value: "PROJECT" },
  { label: "散户", value: "RETAIL" },
  { label: "门店", value: "STORE" },
  { label: "其他", value: "OTHER" }
]
const customerLevelOptions = [
  { label: "A", value: "A" },
  { label: "B", value: "B" },
  { label: "C", value: "C" },
  { label: "普通", value: "NORMAL" }
]
const customerNatureOptions = [
  { label: "真实客户", value: "REAL" },
  { label: "公共客户", value: "PUBLIC" }
]
const publicChannelOptions = [
  { label: "厂内自销", value: "DIRECT_SALE" },
  { label: "自媒体", value: "SELF_MEDIA" }
]
const ownerTypeOptions = [
  { label: "厂内", value: "FACTORY" },
  { label: "业务员", value: "SALESMAN" },
  { label: "无固定归属", value: "NONE" }
]
const ownerSourceOptions = [
  { label: "厂内分配维护（维护费）", value: "FACTORY_ASSIGNED" },
  { label: "业务员自有客户（业务提成）", value: "SALESMAN_SELF" }
]
const ownerSourceAllOptions = [
  { label: "厂内客户池", value: "FACTORY_POOL" },
  ...ownerSourceOptions,
  { label: "无", value: "NONE" }
]
const ownerProfitModeOptions = [
  { label: "无个人收益", value: "NONE" },
  { label: "维护费", value: "MAINTENANCE_FEE" },
  { label: "业务提成", value: "SALES_COMMISSION" }
]
const transferModeOptions = [
  { label: "分配给业务员维护", value: "ASSIGN_MAINTENANCE", ownerProfitMode: "MAINTENANCE_FEE" },
  { label: "转为业务员自有客户", value: "MARK_SALESMAN_SELF", ownerProfitMode: "SALES_COMMISSION" },
  { label: "收回厂内", value: "RETURN_FACTORY", ownerProfitMode: "NONE" }
]
const contactRoleOptions = ["老板", "采购", "财务", "收货人", "跟单员", "其他"].map(item => ({ label: item, value: item }))
const supportModeOptions = [
  { label: "不支持", value: "NONE" },
  { label: "直接打折", value: "INSTANT_DISCOUNT" },
  { label: "仅返现", value: "REBATE_ONLY" },
  { label: "打折并返现", value: "DISCOUNT_AND_REBATE" }
]
const MOBILE_PHONE_PATTERN = /^1[3-9]\d{9}$/
const SALESMAN_EMPTY_MESSAGE = "未找到销售/业务员角色用户，请先配置销售角色。"

function generateCustomerIdempotentKey(scope) {
  const cryptoApi = globalThis.crypto
  const token = cryptoApi && typeof cryptoApi.randomUUID === "function"
    ? cryptoApi.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`
  return `${scope}-${token}`
}

function ensureCustomerIdempotentKey(target, scope) {
  if (!target.idempotentKey) {
    target.idempotentKey = generateCustomerIdempotentKey(scope)
  }
  return target.idempotentKey
}

const customerList = ref([])
const salesmanOptions = ref([])
const salesmanEmptyNoticeShown = ref(false)
const deptOptions = ref([])
const loading = ref(true)
const showSearch = ref(true)
const ids = ref([])
const selectedRows = ref([])
const single = ref(true)
const total = ref(0)
const open = ref(false)
const title = ref("")
const editTab = ref("base")
const detailOpen = ref(false)
const detailTitle = ref("")
const detailTab = ref("base")
const detail = ref({})
const transferOpen = ref(false)
const fundOpen = ref(false)
const rebateOpen = ref(false)
const fundTitle = ref("")
const currentCustomerId = ref(undefined)
const samplePolicy = ref({})

const data = reactive({
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    customerName: undefined,
    shortName: undefined,
    customerNature: undefined,
    publicChannel: undefined,
    contactName: undefined,
    contactPhone: undefined,
    customerType: undefined,
    customerLevel: undefined,
    ownerType: undefined,
    ownerUserId: undefined,
    ownerDeptId: undefined,
    status: undefined
  },
  form: {},
  transferForm: {},
  fundForm: {},
  rebateForm: {},
  rules: {
    customerName: [{ required: true, message: "客户名称不能为空", trigger: "blur" }],
    customerNature: [{ required: true, message: "客户性质不能为空", trigger: "change" }],
    customerType: [{ required: true, message: "客户类型不能为空", trigger: "change" }],
    customerLevel: [{ required: true, message: "客户等级不能为空", trigger: "change" }],
    publicChannel: [requiredWhen(() => isPublicCustomerForm.value, "公共渠道不能为空", "change")],
    contactName: [requiredWhen(() => !isPublicCustomerForm.value, "主联系人不能为空", "blur")],
    contactPhone: [
      requiredWhen(() => !isPublicCustomerForm.value, "联系电话不能为空", "blur"),
      mobilePhoneWhen(() => !isPublicCustomerForm.value, "联系电话必须为11位手机号"),
      { max: 30, message: "联系电话长度不能超过30个字符", trigger: "blur" }
    ],
    ownerType: [requiredWhen(() => !isPublicCustomerForm.value, "归属方式不能为空", "change")],
    ownerUserId: [requiredWhen(() => isSalesmanOwnerForm.value, "归属业务员不能为空", "change")],
    ownerSource: [requiredWhen(() => isSalesmanOwnerForm.value, "归属来源不能为空", "change")],
    areaPath: [areaPathRequiredWhenReal()],
    address: [requiredWhen(() => !isPublicCustomerForm.value, "详细地址不能为空", "blur")]
  }
})

const { queryParams, form, transferForm, fundForm, rebateForm, rules } = toRefs(data)

const isPublicCustomerForm = computed(() => form.value.customerNature === "PUBLIC")
const isSalesmanOwnerForm = computed(() => !isPublicCustomerForm.value && form.value.ownerType === "SALESMAN")
const isFactoryOwnerForm = computed(() => !isPublicCustomerForm.value && form.value.ownerType !== "SALESMAN")
const isPublicDetail = computed(() => detail.value.customer?.customerNature === "PUBLIC")
const hasPublicSelection = computed(() => selectedRows.value.some(row => isPublicRow(row)))
const transferProfitModeLabel = computed(() => {
  const option = transferModeOptions.find(item => item.value === transferForm.value.transferMode)
  return optionLabel(ownerProfitModeOptions, option?.ownerProfitMode)
})

function isEmptyFormValue(value) {
  return value === undefined || value === null || value === "" || (typeof value === "string" && value.trim() === "")
}

function normalizePhoneValue(value) {
  const trimmed = String(value || "").trim()
  return trimmed || undefined
}

function isValidMobilePhone(value) {
  const phone = normalizePhoneValue(value)
  return !!phone && MOBILE_PHONE_PATTERN.test(phone)
}

function requiredWhen(predicate, message, trigger) {
  return {
    trigger,
    validator: (_rule, value, callback) => {
      if (!predicate() || !isEmptyFormValue(value)) {
        callback()
        return
      }
      callback(new Error(message))
    }
  }
}

function mobilePhoneWhen(predicate, message = "联系电话必须为11位手机号") {
  return {
    trigger: "blur",
    validator: (_rule, value, callback) => {
      if (!predicate() || isEmptyFormValue(value)) {
        callback()
        return
      }
      if (!isValidMobilePhone(value)) {
        callback(new Error(message))
        return
      }
      callback()
    }
  }
}

function areaPathRequiredWhenReal() {
  return {
    trigger: "change",
    validator: (_rule, value, callback) => {
      if (isPublicCustomerForm.value) {
        callback()
        return
      }
      if (Array.isArray(value) && value.length === 3) {
        callback()
        return
      }
      callback(new Error("省市区请选择完整到区县"))
    }
  }
}

function optionLabel(options, value) {
  return options.find(item => item.value === value)?.label || value || ""
}

function isPublicRow(row) {
  return row?.customerNature === "PUBLIC"
}

function customerTypeDisplay(row) {
  return isPublicRow(row) ? "系统分类" : optionLabel(customerTypeOptions, row?.customerType)
}

function customerLevelDisplay(row) {
  return isPublicRow(row) ? "-" : optionLabel(customerLevelOptions, row?.customerLevel)
}

function formatArea(row) {
  return [row.province, row.city, row.district].filter(Boolean).join(" / ")
}

function ownerUserDisplay(row) {
  if (!row || row.customerNature === "PUBLIC" || row.ownerType === "NONE") {
    return "无固定归属"
  }
  if (row.ownerType === "FACTORY") {
    return "厂内"
  }
  return row.ownerUserName || "-"
}

function salesmanLabel(item) {
  return item.nickName ? `${item.nickName}（${item.userName}）` : item.userName
}

function salesmanDeptId(item) {
  return item.deptId || item.dept?.deptId
}

function salesmanDeptName(item) {
  return item.deptName || item.dept?.deptName
}

function buildDeptOptions(users) {
  const seen = new Set()
  return (users || []).reduce((options, user) => {
    const id = salesmanDeptId(user)
    const label = salesmanDeptName(user)
    if (!id || !label || seen.has(id)) {
      return options
    }
    seen.add(id)
    options.push({ id, label, children: [] })
    return options
  }, [])
}

function accountTypeLabel(type) {
  return {
    CUSTOMER_DEPOSIT: "定金",
    SAMPLE_REBATE: "样品返现"
  }[type] || type
}

function moneyText(value) {
  return Number(value || 0).toFixed(2)
}

function fullAddress(row) {
  return [row.province, row.city, row.district, row.address].filter(Boolean).join("")
}

const syncDefaultContactHint = computed(() => {
  if (isPublicCustomerForm.value || !form.value.customerId || hasDefaultContact()) {
    return ""
  }
  return form.value.syncDefaultContact ? "当前没有默认联系人，保存时将自动创建默认联系人" : "当前没有默认联系人，勾选后保存会自动创建默认联系人"
})

const syncDefaultAddressHint = computed(() => {
  if (isPublicCustomerForm.value || !form.value.customerId || hasDefaultAddress()) {
    return ""
  }
  if (!hasBaseAddressForSync()) {
    return "当前没有默认收货地址，补全省市区和详细地址后可同步创建"
  }
  return form.value.syncDefaultAddress ? "当前没有默认收货地址，保存时将自动创建默认收货地址" : "当前没有默认收货地址，勾选后保存会自动创建默认收货地址"
})

function hasDefaultContact() {
  return (form.value.contacts || []).some(item => item.isDefault === "Y")
}

function hasDefaultAddress() {
  return (form.value.addresses || []).some(item => item.isDefault === "Y")
}

function hasBaseAddressForSync() {
  const hasArea = form.value.areaPath?.length === 3 || Boolean(form.value.province && form.value.city && form.value.district)
  return hasArea && Boolean(form.value.address)
}

function findAreaPath(row) {
  const codePath = findAreaPathByCode(row)
  return codePath.length ? codePath : findAreaPathByName(row)
}

function applyAreaPath(row, areaPath) {
  const path = Array.isArray(areaPath) ? areaPath : []
  const labels = resolveAreaPathLabels(path)
  row.provinceCode = path[0] || ""
  row.cityCode = path[1] || ""
  row.districtCode = path[2] || ""
  row.province = labels[0] || ""
  row.city = labels[1] || ""
  row.district = labels[2] || ""
}

function hydrateCustomerArea() {
  form.value.areaPath = findAreaPath(form.value)
}

function hydrateAddressAreas() {
  ;(form.value.addresses || []).forEach(item => {
    item.areaPath = findAreaPath(item)
  })
}

function handleCustomerAreaChange(value) {
  applyAreaPath(form.value, value)
}

function handleAddressAreaChange(row) {
  applyAreaPath(row, row.areaPath)
}

function isPartialAreaPath(areaPath) {
  return Array.isArray(areaPath) && areaPath.length > 0 && areaPath.length < 3
}

function validateAreaSelections() {
  if (isPublicCustomerForm.value) {
    return true
  }
  if (isPartialAreaPath(form.value.areaPath)) {
    proxy.$modal.msgError("省市区请选择完整到区县")
    editTab.value = "base"
    return false
  }
  const partialAddressIndex = (form.value.addresses || []).findIndex(item => isPartialAreaPath(item.areaPath))
  if (partialAddressIndex !== -1) {
    proxy.$modal.msgError(`第${partialAddressIndex + 1}条收货地址请选择完整省 / 市 / 区`)
    editTab.value = "addresses"
    return false
  }
  return true
}

function validateChildPhoneSelections() {
  if (isPublicCustomerForm.value) {
    return true
  }
  const invalidContactIndex = (form.value.contacts || []).findIndex(item => !isEmptyFormValue(item.phone) && !isValidMobilePhone(item.phone))
  if (invalidContactIndex !== -1) {
    proxy.$modal.msgError(`第${invalidContactIndex + 1}个联系人电话必须为11位手机号`)
    editTab.value = "contacts"
    return false
  }
  const invalidAddressIndex = (form.value.addresses || []).findIndex(item => !isEmptyFormValue(item.receiverPhone) && !isValidMobilePhone(item.receiverPhone))
  if (invalidAddressIndex !== -1) {
    proxy.$modal.msgError(`第${invalidAddressIndex + 1}条收货地址联系电话必须为11位手机号`)
    editTab.value = "addresses"
    return false
  }
  return true
}

function applyPublicOwnerFields() {
  form.value.ownerType = "NONE"
  form.value.ownerSource = "NONE"
  form.value.ownerProfitMode = "NONE"
  form.value.ownerEffectiveTime = undefined
  form.value.ownerUserId = undefined
  form.value.ownerUserName = undefined
  form.value.ownerDeptId = undefined
  form.value.ownerDeptName = undefined
}

function applyFactoryOwnerFields() {
  form.value.ownerType = "FACTORY"
  form.value.ownerSource = "FACTORY_POOL"
  form.value.ownerProfitMode = "NONE"
  form.value.ownerUserId = undefined
  form.value.ownerUserName = undefined
  form.value.ownerDeptId = undefined
  form.value.ownerDeptName = undefined
}

function applySalesmanOwnerDefaults() {
  form.value.ownerType = "SALESMAN"
  if (!["FACTORY_ASSIGNED", "SALESMAN_SELF"].includes(form.value.ownerSource)) {
    form.value.ownerSource = "FACTORY_ASSIGNED"
  }
  handleOwnerSourceChange(form.value.ownerSource)
}

function normalizeOwnerBeforeSave() {
  if (isPublicCustomerForm.value) {
    applyPublicOwnerFields()
    return
  }
  if (form.value.ownerType === "SALESMAN") {
    applySalesmanOwnerDefaults()
    return
  }
  applyFactoryOwnerFields()
}

function normalizeCustomerPhoneFields() {
  form.value.contactPhone = normalizePhoneValue(form.value.contactPhone)
  ;(form.value.contacts || []).forEach(item => {
    item.phone = normalizePhoneValue(item.phone)
  })
  ;(form.value.addresses || []).forEach(item => {
    item.receiverPhone = normalizePhoneValue(item.receiverPhone)
  })
}

function prepareCustomerBeforeSave() {
  if (isPublicCustomerForm.value) {
    applyPublicOwnerFields()
    form.value.contactName = undefined
    form.value.contactPhone = undefined
    form.value.wechat = undefined
    form.value.province = undefined
    form.value.provinceCode = undefined
    form.value.city = undefined
    form.value.cityCode = undefined
    form.value.district = undefined
    form.value.districtCode = undefined
    form.value.areaPath = []
    form.value.address = undefined
    form.value.syncDefaultContact = false
    form.value.syncDefaultAddress = false
    form.value.contacts = []
    form.value.addresses = []
  } else {
    normalizeCustomerPhoneFields()
    form.value.publicChannel = undefined
    normalizeOwnerBeforeSave()
  }
  if (!form.value.shortName) {
    form.value.shortName = form.value.customerName
  }
  if (form.value.areaPath?.length) {
    applyAreaPath(form.value, form.value.areaPath)
  }
  ;(form.value.addresses || []).forEach(item => {
    if (item.areaPath?.length) {
      applyAreaPath(item, item.areaPath)
    }
  })
}

function getList() {
  loading.value = true
  listCustomer(queryParams.value).then(response => {
    customerList.value = response.rows
    total.value = response.total
    loading.value = false
  })
}

function loadSalesmen(keyword) {
  return listSalesmen(keyword).then(response => {
    salesmanOptions.value = response.data || []
    deptOptions.value = buildDeptOptions(salesmanOptions.value)
    if (salesmanOptions.value.length) {
      salesmanEmptyNoticeShown.value = false
    }
    return salesmanOptions.value
  })
}

function showSalesmanEmptyMessage(force = false) {
  if (force || !salesmanEmptyNoticeShown.value) {
    proxy.$modal.msgError(SALESMAN_EMPTY_MESSAGE)
    salesmanEmptyNoticeShown.value = true
  }
}

function warnIfNoSalesmanCandidates(force = false) {
  return loadSalesmen("").then(options => {
    if (!options.length) {
      showSalesmanEmptyMessage(force)
      return false
    }
    return true
  })
}

function handleQuery() {
  queryParams.value.pageNum = 1
  getList()
}

function handleQueryNatureChange(value) {
  if (value !== "PUBLIC") {
    queryParams.value.publicChannel = undefined
  }
}

function resetQuery() {
  proxy.resetForm("queryRef")
  handleQuery()
}

function reset() {
  form.value = {
    customerId: undefined,
    customerName: undefined,
    shortName: undefined,
    customerNature: "REAL",
    publicChannel: undefined,
    customerType: "DEALER",
    customerLevel: "NORMAL",
    contactName: undefined,
    contactPhone: undefined,
    wechat: undefined,
    province: undefined,
    provinceCode: undefined,
    city: undefined,
    cityCode: undefined,
    district: undefined,
    districtCode: undefined,
    areaPath: [],
    address: undefined,
    ownerType: "FACTORY",
    ownerSource: "FACTORY_POOL",
    ownerProfitMode: "NONE",
    ownerEffectiveTime: undefined,
    ownerUserId: undefined,
    ownerUserName: undefined,
    ownerDeptId: undefined,
    ownerDeptName: undefined,
    status: "0",
    remark: undefined,
    syncDefaultContact: false,
    syncDefaultAddress: false,
    contacts: [],
    addresses: []
  }
  proxy.resetForm("customerRef")
}

function handleAdd() {
  reset()
  editTab.value = "base"
  open.value = true
  title.value = "新增客户"
}

function handleUpdate(row) {
  reset()
  const selected = row || selectedRows.value[0]
  if (isPublicRow(selected)) {
    proxy.$modal.msgError("公共客户为系统内置分类客户，不允许在普通客户编辑中修改。")
    return
  }
  const customerId = selected.customerId || ids.value[0]
  getCustomer(customerId).then(response => {
    form.value = response.data.customer
    if (isPublicCustomerForm.value) {
      proxy.$modal.msgError("公共客户为系统内置分类客户，不允许在普通客户编辑中修改。")
      return
    }
    form.value.customerNature = form.value.customerNature || "REAL"
    form.value.ownerType = form.value.ownerType || (form.value.customerNature === "PUBLIC" ? "NONE" : "FACTORY")
    form.value.ownerSource = form.value.ownerSource || (form.value.ownerType === "SALESMAN" ? "FACTORY_ASSIGNED" : form.value.ownerType === "FACTORY" ? "FACTORY_POOL" : "NONE")
    form.value.ownerProfitMode = form.value.ownerProfitMode || (form.value.ownerSource === "SALESMAN_SELF" ? "SALES_COMMISSION" : form.value.ownerSource === "FACTORY_ASSIGNED" ? "MAINTENANCE_FEE" : "NONE")
    form.value.contacts = form.value.contacts || []
    form.value.addresses = form.value.addresses || []
    hydrateCustomerArea()
    hydrateAddressAreas()
    form.value.syncDefaultContact = !isPublicCustomerForm.value
    form.value.syncDefaultAddress = !isPublicCustomerForm.value
    editTab.value = "base"
    open.value = true
    title.value = "修改客户"
  })
}

function handleFormNatureChange(value) {
  if (value === "PUBLIC") {
    proxy.$modal.msgError("公共客户由系统初始化，不允许手工新增或编辑。")
    form.value.customerNature = "REAL"
    form.value.publicChannel = undefined
    applyFactoryOwnerFields()
  } else {
    form.value.publicChannel = undefined
    applyFactoryOwnerFields()
  }
  proxy.$refs["customerRef"]?.clearValidate()
}

function handleOwnerTypeChange(value) {
  if (value === "SALESMAN") {
    applySalesmanOwnerDefaults()
    warnIfNoSalesmanCandidates()
  } else {
    applyFactoryOwnerFields()
  }
  proxy.$refs["customerRef"]?.clearValidate(["ownerType", "ownerUserId", "ownerSource"])
}

function handleOwnerSourceChange(value) {
  if (value === "SALESMAN_SELF") {
    form.value.ownerProfitMode = "SALES_COMMISSION"
  } else if (value === "FACTORY_ASSIGNED") {
    form.value.ownerProfitMode = "MAINTENANCE_FEE"
  } else {
    form.value.ownerProfitMode = "NONE"
  }
  proxy.$refs["customerRef"]?.clearValidate(["ownerSource"])
}

function handleView(row) {
  currentCustomerId.value = row.customerId
  loadDetail(row.customerId)
  detailTitle.value = row.customerName
  detailTab.value = "base"
  detailOpen.value = true
}

function loadDetail(customerId) {
  getCustomer(customerId).then(response => {
    detail.value = response.data || {}
    samplePolicy.value = detail.value.samplePolicy || {}
  })
}

function cancel() {
  open.value = false
  reset()
}

function submitForm() {
  if (form.value.ownerType === "SALESMAN" && !salesmanOptions.value.length) {
    warnIfNoSalesmanCandidates(true).then(hasCandidates => {
      if (hasCandidates) {
        submitForm()
      } else {
        editTab.value = "base"
      }
    })
    return
  }
  proxy.$refs["customerRef"].validate(valid => {
    if (!valid) return
    if (isPublicCustomerForm.value) {
      proxy.$modal.msgError("公共客户由系统初始化，不允许手工新增或编辑。")
      editTab.value = "base"
      return
    }
    if (!validateAreaSelections()) return
    if (!validateChildPhoneSelections()) return
    prepareCustomerBeforeSave()
    duplicateWarning({
      customerId: form.value.customerId,
      customerName: form.value.customerName,
      contactPhone: form.value.contactPhone
    }).then(response => {
      const warning = response.data || {}
      const save = () => {
        const action = form.value.customerId ? updateCustomer(form.value) : addCustomer(form.value)
        action.then(() => {
          proxy.$modal.msgSuccess(form.value.customerId ? "修改成功" : "新增成功")
          open.value = false
          getList()
        })
      }
      if (warning.message) {
        proxy.$modal.confirm(warning.message + "，是否继续保存？").then(save).catch(() => {})
      } else {
        save()
      }
    })
  })
}

function handleSelectionChange(selection) {
  selectedRows.value = selection
  ids.value = selection.map(item => item.customerId)
  single.value = selection.length !== 1
}

function handleStatusChange(row) {
  if (isPublicRow(row)) {
    row.status = row.status === "0" ? "1" : "0"
    proxy.$modal.msgError("内置公共客户不允许停用。")
    return
  }
  const text = row.status === "0" ? "启用" : "停用"
  proxy.$modal.confirm(`确认要${text}客户"${row.customerName}"吗？`).then(() => {
    return changeCustomerStatus(row.customerId, row.status)
  }).then(() => {
    proxy.$modal.msgSuccess(text + "成功")
  }).catch(() => {
    row.status = row.status === "0" ? "1" : "0"
  })
}

function handleDelete(row) {
  const customerIds = row.customerId || ids.value
  if (isPublicRow(row) || (!row.customerId && hasPublicSelection.value)) {
    proxy.$modal.msgError("内置公共客户不允许删除。")
    return
  }
  proxy.$modal.confirm('是否确认删除客户编号为"' + customerIds + '"的数据项？').then(() => {
    return delCustomer(customerIds)
  }).then(() => {
    getList()
    proxy.$modal.msgSuccess("删除成功")
  }).catch(() => {})
}

function handleExport() {
  proxy.download("business/customer/export", {
    ...queryParams.value
  }, `customer_${new Date().getTime()}.xlsx`)
}

function addContact() {
  form.value.contacts.push({ contactName: "", phone: "", wechat: "", position: "", contactRole: "其他", isDefault: form.value.contacts.length ? "N" : "Y", remark: "" })
}

function removeContact(index) {
  form.value.contacts.splice(index, 1)
  if (form.value.contacts.length && !form.value.contacts.some(item => item.isDefault === "Y")) {
    form.value.contacts[0].isDefault = "Y"
  }
}

function setDefaultContact(index) {
  form.value.contacts.forEach((item, itemIndex) => {
    item.isDefault = itemIndex === index ? "Y" : "N"
  })
}

function addAddress() {
  form.value.addresses.push({ receiverName: "", receiverPhone: "", province: "", provinceCode: "", city: "", cityCode: "", district: "", districtCode: "", areaPath: [], detailAddress: "", logisticsLine: "", isDefault: form.value.addresses.length ? "N" : "Y", remark: "" })
}

function removeAddress(index) {
  form.value.addresses.splice(index, 1)
  if (form.value.addresses.length && !form.value.addresses.some(item => item.isDefault === "Y")) {
    form.value.addresses[0].isDefault = "Y"
  }
}

function setDefaultAddress(index) {
  form.value.addresses.forEach((item, itemIndex) => {
    item.isDefault = itemIndex === index ? "Y" : "N"
  })
}

function handleTransfer(row) {
  if (row.customerNature === "PUBLIC") {
    proxy.$modal.msgError("公共客户不支持归属变更")
    return
  }
  currentCustomerId.value = row.customerId
  transferForm.value = {
    customerId: row.customerId,
    transferMode: row.ownerType === "SALESMAN" ? "RETURN_FACTORY" : "ASSIGN_MAINTENANCE",
    newOwnerUserId: row.ownerType === "SALESMAN" ? undefined : row.ownerUserId,
    effectiveTime: currentDateTimeValue(),
    changeReason: "",
    remark: ""
  }
  transferOpen.value = true
  if (transferRequiresSalesman()) {
    warnIfNoSalesmanCandidates()
  }
}

function transferRequiresSalesman(mode = transferForm.value.transferMode) {
  return mode === "ASSIGN_MAINTENANCE" || mode === "MARK_SALESMAN_SELF" || mode === "CHANGE_SALESMAN"
}

function handleTransferModeChange(mode) {
  if (!transferRequiresSalesman(mode)) {
    transferForm.value.newOwnerUserId = undefined
  } else {
    warnIfNoSalesmanCandidates()
  }
}

function prepareTransferPayload() {
  const payload = { ...transferForm.value }
  if (payload.transferMode === "ASSIGN_MAINTENANCE") {
    payload.newOwnerType = "SALESMAN"
    payload.newOwnerSource = "FACTORY_ASSIGNED"
    payload.newOwnerProfitMode = "MAINTENANCE_FEE"
  } else if (payload.transferMode === "MARK_SALESMAN_SELF") {
    payload.newOwnerType = "SALESMAN"
    payload.newOwnerSource = "SALESMAN_SELF"
    payload.newOwnerProfitMode = "SALES_COMMISSION"
  } else if (payload.transferMode === "RETURN_FACTORY") {
    payload.newOwnerType = "FACTORY"
    payload.newOwnerSource = "FACTORY_POOL"
    payload.newOwnerProfitMode = "NONE"
    payload.newOwnerUserId = undefined
  }
  return payload
}

function submitTransfer() {
  if (!transferForm.value.transferMode) {
    proxy.$modal.msgError("请选择归属变更方式")
    return
  }
  if (transferRequiresSalesman() && !salesmanOptions.value.length) {
    warnIfNoSalesmanCandidates(true)
    return
  }
  if (transferRequiresSalesman() && !transferForm.value.newOwnerUserId) {
    proxy.$modal.msgError("请选择归属业务员")
    return
  }
  if (isEmptyFormValue(transferForm.value.changeReason)) {
    proxy.$modal.msgError("请输入变更原因")
    return
  }
  transferOwner(prepareTransferPayload()).then(() => {
    proxy.$modal.msgSuccess("归属变更成功")
    transferOpen.value = false
    getList()
    if (detailOpen.value) loadDetail(currentCustomerId.value)
  })
}

function currentDateTimeValue() {
  const date = new Date()
  const pad = value => String(value).padStart(2, "0")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

function handleFundEntry() {
  fundForm.value = {
    idempotentKey: generateCustomerIdempotentKey("customer-fund-deposit"),
    amount: 0,
    receiptNo: "",
    remark: ""
  }
  fundTitle.value = "录入定金"
  fundOpen.value = true
}

function submitFundEntry() {
  const idempotentKey = ensureCustomerIdempotentKey(fundForm.value, "customer-fund-deposit")
  addFundDeposit(currentCustomerId.value, {
    idempotentKey,
    amount: fundForm.value.amount,
    receiptNo: fundForm.value.receiptNo,
    remark: fundForm.value.remark
  }).then(() => {
    proxy.$modal.msgSuccess("录入成功")
    fundOpen.value = false
    loadDetail(currentCustomerId.value)
  })
}

function submitSamplePolicy() {
  saveSamplePolicy(currentCustomerId.value, samplePolicy.value).then(() => {
    proxy.$modal.msgSuccess("保存成功")
    loadDetail(currentCustomerId.value)
  })
}

function handleSampleRebate() {
  rebateForm.value = {
    idempotentKey: generateCustomerIdempotentKey("customer-sample-rebate"),
    sampleOrderNo: "",
    sampleAmount: 0,
    supportMode: samplePolicy.value.supportMode || "REBATE_ONLY",
    totalSupportRate: samplePolicy.value.totalSupportRate || 0.5,
    instantDiscountRate: samplePolicy.value.instantDiscountRate || 0.8,
    instantDiscountAmount: undefined,
    remark: ""
  }
  rebateOpen.value = true
}

function submitSampleRebate() {
  const payload = {
    ...rebateForm.value,
    idempotentKey: ensureCustomerIdempotentKey(rebateForm.value, "customer-sample-rebate")
  }
  createSampleRebate(currentCustomerId.value, payload).then(() => {
    proxy.$modal.msgSuccess("生成成功")
    rebateOpen.value = false
    loadDetail(currentCustomerId.value)
  })
}

onMounted(() => {
  loadSalesmen("")
  getList()
})
</script>

<style scoped>
.customer-page :deep(.el-drawer__body) {
  padding-top: 8px;
}
.mt8 {
  margin-top: 8px;
}
.customer-page :deep(.customer-code-cell .cell) {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.fund-row {
  margin-bottom: 12px;
}
.fund-amount {
  font-weight: 600;
  margin-bottom: 4px;
}
.detail-actions {
  margin: 10px 0 4px;
}
.policy-form {
  max-width: 960px;
}
.sync-options {
  display: flex;
  flex-direction: column;
  gap: 6px;
  line-height: 24px;
}
.sync-option {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}
.sync-help {
  color: #606266;
}
.sync-hint {
  color: #909399;
}
</style>
