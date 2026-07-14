import test from 'node:test'
import assert from 'node:assert/strict'
import { createCacheChartLifecycle } from '../src/views/monitor/cache/chart-lifecycle.mjs'

function createFixture() {
  const commandElement = { id: 'command' }
  const memoryElement = { id: 'memory' }
  const listeners = new Map()
  const calls = {
    add: [],
    remove: [],
    observe: [],
    disconnect: 0,
    init: [],
    instances: []
  }

  const windowTarget = {
    addEventListener(type, handler) {
      calls.add.push({ type, handler })
      listeners.set(type, handler)
    },
    removeEventListener(type, handler) {
      calls.remove.push({ type, handler })
      if (listeners.get(type) === handler) listeners.delete(type)
    }
  }

  class FakeResizeObserver {
    constructor(handler) {
      this.handler = handler
    }

    observe(element) {
      calls.observe.push(element)
    }

    disconnect() {
      calls.disconnect += 1
    }
  }

  const echarts = {
    getInstanceByDom() {
      return null
    },
    init(element, theme) {
      const instance = {
        element,
        theme,
        options: [],
        resizeCount: 0,
        disposeCount: 0,
        setOption(option, replace) {
          this.options.push({ option, replace })
        },
        resize() {
          this.resizeCount += 1
        },
        dispose() {
          this.disposeCount += 1
        }
      }
      calls.init.push({ element, theme })
      calls.instances.push(instance)
      return instance
    }
  }

  const controller = createCacheChartLifecycle({
    echarts,
    commandElement: () => commandElement,
    memoryElement: () => memoryElement,
    windowTarget,
    ResizeObserverImpl: FakeResizeObserver
  })

  return { calls, controller, listeners, commandElement, memoryElement }
}

test('cache charts initialize once, resize through stable listeners, and dispose once', () => {
  const fixture = createFixture()
  const data = {
    commandStats: [{ name: 'get', value: 3 }],
    info: { used_memory_human: '12M' }
  }

  fixture.controller.mount()
  fixture.controller.mount()
  assert.equal(fixture.calls.add.length, 1, 'mount must not duplicate the window listener')
  assert.deepEqual(fixture.calls.observe, [fixture.commandElement, fixture.memoryElement])

  fixture.controller.render(data)
  fixture.controller.render(data)
  assert.equal(fixture.calls.init.length, 2, 'one ECharts instance is allowed per chart element')
  assert.deepEqual(fixture.calls.init.map((entry) => entry.theme), ['macarons', 'macarons'])
  assert.deepEqual(fixture.calls.instances.map((instance) => instance.options.length), [2, 2])
  assert.equal(fixture.calls.instances.every((instance) => instance.options.every((entry) => entry.replace === true)), true)

  fixture.listeners.get('resize')()
  assert.deepEqual(fixture.calls.instances.map((instance) => instance.resizeCount), [1, 1])

  const mountedHandler = fixture.calls.add[0].handler
  fixture.controller.dispose()
  fixture.controller.dispose()
  assert.equal(fixture.calls.remove.length, 1)
  assert.equal(fixture.calls.remove[0].handler, mountedHandler, 'remove must use the exact mounted handler')
  assert.equal(fixture.calls.disconnect, 1)
  assert.deepEqual(fixture.calls.instances.map((instance) => instance.disposeCount), [1, 1])
})

test('ten route-style mount and dispose cycles leave no listeners or chart instances behind', () => {
  const fixture = createFixture()
  const data = {
    commandStats: [{ name: 'set', value: 5 }],
    info: { used_memory_human: '24M' }
  }

  for (let cycle = 0; cycle < 10; cycle += 1) {
    fixture.controller.mount()
    fixture.controller.mount()
    fixture.controller.render(data)
    fixture.controller.dispose()
    fixture.controller.dispose()
  }

  assert.equal(fixture.calls.add.length, 10)
  assert.equal(fixture.calls.remove.length, 10)
  assert.equal(fixture.calls.disconnect, 10)
  assert.equal(fixture.listeners.size, 0)
  assert.equal(fixture.calls.init.length, 20)
  assert.equal(fixture.calls.instances.every((instance) => instance.disposeCount === 1), true)
})
