# Frontend Review

## Customer Detail

- Fetch only basic customer data from the query endpoint.
- Load owner history, fund accounts/batches/rebates, fund flows, and sample policy through their dedicated API functions only when the current user has the corresponding permission.
- Hide sections and tabs that the user cannot read. Deposit keeps its dedicated permission. Sample rebate creation has no button, dialog, or API-client helper until the authoritative order source is integrated; history remains read-only with an explicit warning.
- Normal customer edit displays ownership as read-only and directs changes through the transfer action.

## Notice Rendering

- Replace raw `v-html` with a sandboxed `srcdoc` iframe.
- Do not grant `allow-scripts`, `allow-same-origin`, form, popup, or top-navigation capabilities.
- Preserve formatted notice presentation inside the isolated document and provide a safe empty state.

## Verification

- Static behavior tests lock permission-to-request mappings, hidden sections, the absence of the aggregate sensitive payload, and the sandbox attributes.
- `npm --prefix ruoyi-ui run build:prod` must pass.
- Browser validation must use an event-handler/script payload and prove no parent state or marker is modified.
