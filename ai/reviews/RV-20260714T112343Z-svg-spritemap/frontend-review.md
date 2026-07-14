# Frontend Review

## Approved Contracts

- ECharts is pinned to 6.1.0 and the existing macarons theme is explicitly registered.
- `SvgIcon` uses the maintained spritemap route with modern `href`; all existing icon basenames remain stable.
- All 90 SVG sources must parse, remain locally self-contained, and produce 90 unique safe symbols with valid viewBoxes.
- The four malformed/dead-style source icons may be corrected without changing their intended geometry.
- Cache charts initialize at most once per container, reuse instances for subsequent data, react to viewport and container changes, and dispose on unmount.
- A newer cache response wins over an older response; unmounted responses are ignored; request failures rely on the shared interceptor; render failures produce one local message.

## Required Tests

- Real in-memory Vite production spritemap test using the installed plugin.
- Pure Node request-controller and chart-lifecycle behavior tests, including ten mount/dispose cycles.
- Root structural/dependency regression that is safe in the clean governance job.
- Production build lifecycle that runs the complete UI suite after UI dependencies are installed.
- Browser acceptance for login/shell icons, 90-item icon picker, two cache charts, resize, and console warnings/errors.
