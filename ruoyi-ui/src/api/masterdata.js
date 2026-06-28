import request from '@/utils/request'

function masterDataUrl(resource, suffix = '') {
  return `/business/masterdata/${resource}${suffix}`
}

export function listMasterData(resource, query) {
  return request({
    url: masterDataUrl(resource, '/list'),
    method: 'get',
    params: query
  })
}

export function listMasterDataOptions(resource) {
  return request({
    url: masterDataUrl(resource, '/options'),
    method: 'get'
  })
}

export function getMasterData(resource, id) {
  return request({
    url: masterDataUrl(resource, `/${id}`),
    method: 'get'
  })
}

export function addMasterData(resource, data) {
  return request({
    url: masterDataUrl(resource),
    method: 'post',
    data: data
  })
}

export function updateMasterData(resource, data) {
  return request({
    url: masterDataUrl(resource),
    method: 'put',
    data: data
  })
}

export function delMasterData(resource, ids) {
  return request({
    url: masterDataUrl(resource, `/${ids}`),
    method: 'delete'
  })
}

export function changeMasterDataStatus(resource, id, status) {
  return request({
    url: masterDataUrl(resource, '/changeStatus'),
    method: 'put',
    data: { id, status }
  })
}
