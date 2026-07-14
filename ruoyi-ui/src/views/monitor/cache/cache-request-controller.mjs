export function createCacheRequestController({
  request,
  showLoading,
  closeLoading,
  setData,
  nextRender,
  render,
  reportRenderError,
  renderErrorMessage = '缓存图表渲染失败'
}) {
  let requestVersion = 0
  let loading = false
  let disposed = false

  function closeCurrentLoading() {
    if (!loading) return
    closeLoading()
    loading = false
  }

  async function load() {
    if (disposed) return

    const version = ++requestVersion
    closeCurrentLoading()
    showLoading()
    loading = true

    let response
    try {
      response = await request()
    } catch {
      // Request failures are reported once by the shared Axios interceptor.
      if (version === requestVersion) closeCurrentLoading()
      return
    }

    if (disposed || version !== requestVersion) return

    try {
      setData(response.data)
      await nextRender()
      if (disposed || version !== requestVersion) return
      await render(response.data)
    } catch (error) {
      if (!disposed && version === requestVersion) {
        reportRenderError(error?.message || renderErrorMessage)
      }
    } finally {
      if (version === requestVersion) closeCurrentLoading()
    }
  }

  function dispose() {
    if (!disposed) {
      disposed = true
      requestVersion += 1
    }
    closeCurrentLoading()
  }

  return { load, dispose }
}
