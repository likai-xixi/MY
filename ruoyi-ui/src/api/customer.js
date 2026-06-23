import request from '@/utils/request'

// 查询客户列表
export function listCustomer(query) {
  return request({
    url: '/business/customer/list',
    method: 'get',
    params: query
  })
}

// 查询客户详情
export function getCustomer(customerId) {
  return request({
    url: '/business/customer/' + customerId,
    method: 'get'
  })
}

// 客户重复提醒
export function duplicateWarning(query) {
  return request({
    url: '/business/customer/duplicate-warning',
    method: 'get',
    params: query
  })
}

// 新增客户
export function addCustomer(data) {
  return request({
    url: '/business/customer',
    method: 'post',
    data: data
  })
}

// 修改客户
export function updateCustomer(data) {
  return request({
    url: '/business/customer',
    method: 'put',
    data: data
  })
}

// 删除客户
export function delCustomer(customerId) {
  return request({
    url: '/business/customer/' + customerId,
    method: 'delete'
  })
}

// 客户状态修改
export function changeCustomerStatus(customerId, status) {
  return request({
    url: '/business/customer/changeStatus',
    method: 'put',
    data: { customerId, status }
  })
}

// 业务员候选
export function listSalesmen(keyword) {
  return request({
    url: '/business/customer/salesmen',
    method: 'get',
    params: { keyword }
  })
}

// 转移业务员
export function transferOwner(data) {
  return request({
    url: '/business/customer/transferOwner',
    method: 'put',
    data: data
  })
}

// 资金账户
export function listFundAccounts(customerId) {
  return request({
    url: '/business/customer/' + customerId + '/fund/accounts',
    method: 'get'
  })
}

// 资金流水
export function listFundFlows(customerId, query) {
  return request({
    url: '/business/customer/' + customerId + '/fund/flows',
    method: 'get',
    params: query
  })
}

// 录入客户定金
export function addFundDeposit(customerId, data) {
  return request({
    url: '/business/customer/' + customerId + '/fund/deposit',
    method: 'post',
    data: data
  })
}

// 定金批次
export function listDepositBatches(customerId) {
  return request({
    url: '/business/customer/' + customerId + '/fund/deposit-batches',
    method: 'get'
  })
}

// 样品政策
export function getSamplePolicy(customerId) {
  return request({
    url: '/business/customer/' + customerId + '/sample-policy',
    method: 'get'
  })
}

// 保存样品政策
export function saveSamplePolicy(customerId, data) {
  return request({
    url: '/business/customer/' + customerId + '/sample-policy',
    method: 'put',
    data: data
  })
}

// 生成样品返现
export function createSampleRebate(customerId, data) {
  return request({
    url: '/business/customer/' + customerId + '/sample-rebate',
    method: 'post',
    data: data
  })
}

// 样品返现记录
export function listSampleRebates(customerId) {
  return request({
    url: '/business/customer/' + customerId + '/sample-rebate',
    method: 'get'
  })
}
