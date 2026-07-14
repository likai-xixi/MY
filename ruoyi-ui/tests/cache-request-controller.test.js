import test from 'node:test'
import assert from 'node:assert/strict'
import { createCacheRequestController } from '../src/views/monitor/cache/cache-request-controller.mjs'

function deferred() {
  let resolve
  let reject
  const promise = new Promise((onResolve, onReject) => {
    resolve = onResolve
    reject = onReject
  })
  return { promise, resolve, reject }
}

function createFixture() {
  const requests = []
  const calls = {
    showLoading: 0,
    closeLoading: 0,
    data: [],
    render: [],
    errors: []
  }
  let renderFailure = null

  const controller = createCacheRequestController({
    request() {
      const pending = deferred()
      requests.push(pending)
      return pending.promise
    },
    showLoading() {
      calls.showLoading += 1
    },
    closeLoading() {
      calls.closeLoading += 1
    },
    setData(data) {
      calls.data.push(data)
    },
    async nextRender() {},
    render(data) {
      calls.render.push(data)
      if (renderFailure) throw renderFailure
    },
    reportRenderError(message) {
      calls.errors.push(message)
    }
  })

  return {
    calls,
    controller,
    requests,
    failRender(error) {
      renderFailure = error
    }
  }
}

test('newer cache responses win and stale responses cannot update or close current loading', async () => {
  const fixture = createFixture()
  const older = fixture.controller.load()
  const newer = fixture.controller.load()

  fixture.requests[1].resolve({ data: { id: 'newer' } })
  await newer
  fixture.requests[0].resolve({ data: { id: 'older' } })
  await older

  assert.deepEqual(fixture.calls.data, [{ id: 'newer' }])
  assert.deepEqual(fixture.calls.render, [{ id: 'newer' }])
  assert.equal(fixture.calls.showLoading, 2)
  assert.equal(fixture.calls.closeLoading, 2, 'replacement plus current completion close exactly once each')
  assert.deepEqual(fixture.calls.errors, [])
})

test('dispose invalidates an in-flight response and closes loading once', async () => {
  const fixture = createFixture()
  const pending = fixture.controller.load()

  fixture.controller.dispose()
  fixture.controller.dispose()
  fixture.requests[0].resolve({ data: { id: 'late' } })
  await pending

  assert.deepEqual(fixture.calls.data, [])
  assert.deepEqual(fixture.calls.render, [])
  assert.equal(fixture.calls.closeLoading, 1)
  assert.deepEqual(fixture.calls.errors, [])
})

test('transport failures rely on the shared interceptor and do not produce a second toast', async () => {
  const fixture = createFixture()
  const pending = fixture.controller.load()

  fixture.requests[0].reject(new Error('transport failed'))
  await pending

  assert.equal(fixture.calls.closeLoading, 1)
  assert.deepEqual(fixture.calls.data, [])
  assert.deepEqual(fixture.calls.render, [])
  assert.deepEqual(fixture.calls.errors, [])
})

test('render failures produce one local toast with the actual message', async () => {
  const fixture = createFixture()
  fixture.failRender(new Error('chart exploded'))
  const pending = fixture.controller.load()

  fixture.requests[0].resolve({ data: { id: 'render-error' } })
  await pending

  assert.deepEqual(fixture.calls.data, [{ id: 'render-error' }])
  assert.deepEqual(fixture.calls.render, [{ id: 'render-error' }])
  assert.deepEqual(fixture.calls.errors, ['chart exploded'])
  assert.equal(fixture.calls.closeLoading, 1)
})
