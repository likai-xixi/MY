# R-12A API And Browser Acceptance

Provenance: `[runtime-local]` against the locally started backend, Vite frontend, MySQL, and Redis.

## API

- Real captcha login succeeded for the administrator; an unauthenticated business call returned 401.
- `option-set`: list/add/detail/edit/status/options and protected delete were exercised. New codes used `OS`; code stayed immutable; `MULTIPLE` and `SINGLE` were accepted.
- `option-value`: list/add/detail/edit/status/options and required ownership were exercised. New codes used `OV`; code and owner stayed correct.
- A set with an effective value could not be deleted. Disabling a set hid its values from new-business options. Disabling a value hid that value.
- Old `sales-option-category` and `sales-option-value` resource requests returned business code 500 and had no runtime path.
- Product-category API exercised a three-level tree, PC code generation, fourth-level/self/descendant-parent rejection, child-protected delete, and non-cascading disable.
- Product-series retained product-category ownership; product-model retained both product-category and product-series ownership and used the PM code prefix.
- Material-item, accessory-item, and customer list calls returned 200.
- A temporary authenticated user without a business role received 403 for masterdata and was deleted after the check.

## Browser

- Logged in and verified `产品配置 / 物料配置 / 配件配置 / 选项配置`; no old sales-option menu was present.
- Product tabs and fields displayed `产品大类 / 产品系列 / 产品型号`; no current page displayed the obsolete product-model label.
- Product-category tree opened only the selected parent path while deeper descendants stayed collapsed; the hierarchy rules were also covered by API and focused tests.
- Created and edited an option set, switched `MULTIPLE -> SINGLE`, disabled and re-enabled it, and verified the saved sort value.
- Created and edited an owned option value, disabled it, and verified the saved sort value.
- Browser delete of the set with an option value showed `选项集已被选项值引用，不能删除`.
- Material category/item, accessory category/item, and a fresh customer-management page rendered real rows.
- Direct navigation to `/business/masterdata/sales-option-config` rendered the 404 page.
- The browser run exposed stale Element Plus number-input state on repeated edits. R-12A now keys the control by a per-form render sequence; HMR recheck showed the server value on every reopen.

Browser-only login temporarily disabled local captcha after API captcha behavior had already passed; captcha was restored immediately, and `/captchaImage` again reported `captchaEnabled=true` before shutdown.
