export function createCacheChartLifecycle({
  echarts,
  commandElement,
  memoryElement,
  windowTarget = globalThis.window,
  ResizeObserverImpl = globalThis.ResizeObserver,
  theme = 'macarons'
}) {
  let commandstatsInstance = null
  let usedmemoryInstance = null
  let resizeObserver = null
  let mounted = false

  const resize = () => {
    commandstatsInstance?.resize()
    usedmemoryInstance?.resize()
  }

  function mount() {
    if (mounted) return
    mounted = true
    windowTarget?.addEventListener?.('resize', resize)
    if (typeof ResizeObserverImpl === 'function') {
      resizeObserver = new ResizeObserverImpl(resize)
      const commandNode = commandElement()
      const memoryNode = memoryElement()
      if (commandNode) resizeObserver.observe(commandNode)
      if (memoryNode) resizeObserver.observe(memoryNode)
    }
  }

  function render(data) {
    const commandNode = commandElement()
    const memoryNode = memoryElement()
    if (!commandNode || !memoryNode) {
      throw new Error('Cache chart containers are unavailable')
    }

    commandstatsInstance ||= echarts.getInstanceByDom(commandNode) || echarts.init(commandNode, theme)
    commandstatsInstance.setOption({
      tooltip: {
        trigger: 'item',
        formatter: '{a} <br/>{b} : {c} ({d}%)'
      },
      series: [
        {
          name: '命令',
          type: 'pie',
          roseType: 'radius',
          radius: [15, 95],
          center: ['50%', '38%'],
          data: data.commandStats,
          animationEasing: 'cubicInOut',
          animationDuration: 1000
        }
      ]
    }, true)

    usedmemoryInstance ||= echarts.getInstanceByDom(memoryNode) || echarts.init(memoryNode, theme)
    usedmemoryInstance.setOption({
      tooltip: {
        formatter: '{b} <br/>{a} : ' + data.info.used_memory_human
      },
      series: [
        {
          name: '峰值',
          type: 'gauge',
          min: 0,
          max: 1000,
          detail: {
            formatter: data.info.used_memory_human
          },
          data: [
            {
              value: parseFloat(data.info.used_memory_human),
              name: '内存消耗'
            }
          ]
        }
      ]
    }, true)
  }

  function dispose() {
    if (mounted) {
      windowTarget?.removeEventListener?.('resize', resize)
      mounted = false
    }
    resizeObserver?.disconnect()
    resizeObserver = null
    commandstatsInstance?.dispose()
    usedmemoryInstance?.dispose()
    commandstatsInstance = null
    usedmemoryInstance = null
  }

  return { mount, render, resize, dispose }
}
