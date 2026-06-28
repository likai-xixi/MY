# Verification

Status: [local] live acceptance and final governance checks passed.

## Baseline

- [local] `npm run resume` passed before evidence work.
- [local] `git status --short --branch` returned clean `## master...origin/master` before R-10G evidence edits.
- [local] `git -c http.proxy= -c https.proxy= fetch origin master` passed.
- [local] `git rev-parse HEAD origin/master FETCH_HEAD` confirmed `HEAD`, `origin/master`, and `FETCH_HEAD` at R-10F commit `770784f07335c2ff90c2c8c89f99456e8d76c22f`.
- [local] `ai/roadmap/phase-gates.json` and current context still show `beforeSalesOrder` as `blocked`.

## Runtime Stack

- [local] MySQL container `mj-mysql` was running and database `my_ry_vue_runtime` exists.
- [local] Redis container `mj-redis` was running; Redis DB1 returned `PONG`.
- [local] Frontend was available at `http://127.0.0.1:5173`; `/dev-api/captchaImage` returned HTTP 200.
- [local] The existing backend process on port `18080` was detected as a stale jar after it accepted a level-four category. The failed marker rows were deleted from `masterdata_product_category`.
- [local] Cached Maven package initially failed because the stale `ruoyi-admin.jar` was locked by the running backend. After stopping that process, cached Maven package passed with `BUILD SUCCESS`.
- [local] Backend was restarted from the current HEAD jar at `http://localhost:18080` with DB `my_ry_vue_runtime` and Redis DB1; `/captchaImage` returned HTTP 200.

## API Acceptance

- [local] Login used the real `/captchaImage` flow plus Redis DB1 captcha value lookup, then `POST /login` as `admin`.
- [local] Acceptance marker: `R10G20260628085626`.
- [local] Created level 1 product category: id `15`, code `PC202606000004`, name `门-R10G20260628085626`, parent `null`.
- [local] Created level 2 product category: id `16`, code `PC202606000005`, name `庭院门-R10G20260628085626`, parent `15`.
- [local] Created level 3 product category: id `17`, code `PC202606000006`, name `玻璃拼接门-R10G20260628085626`, parent `16`.
- [local] Product category list returned the expected hierarchy: `门-R10G20260628085626 -> 庭院门-R10G20260628085626 -> 玻璃拼接门-R10G20260628085626`.
- [local] Fourth-level create under id `17` was rejected by the backend with `产品分类最多只允许3级`; DB residue check for the fourth-level marker returned `0`.
- [local] Updating category id `16` to use itself as parent was rejected with `上级分类不能选择自己`.
- [local] Updating category id `15` to use descendant id `17` as parent was rejected with `产品分类的上级分类不能选择自己的子级或后代`.
- [local] Deleting parent id `15` while child id `16` existed was rejected with `产品分类存在子分类，不能删除父分类`.
- [local] Disabling root id `15` changed only id `15` to status `1`; child ids `16` and `17` stayed status `0`. Root id `15` was restored to status `0` after the check.
- [local] PC automatic coding remained active: the three accepted rows used generated `PC202606000004`, `PC202606000005`, and `PC202606000006` codes.
- [local] Other masterdata API list endpoints returned HTTP 200: `product-series`, `product-model`, `material-item`, `accessory-item`, and `sales-option-value`.

## Browser Acceptance

- [local] Opened `http://127.0.0.1:5173/business/masterdata` in the in-app browser with a real backend token cookie.
- [local] Product category tab was active and rendered table headers `编码`, `名称`, `排序`, `状态`, `备注`, `创建时间`, `操作`.
- [local] The product-category `上级分类` column was absent because hierarchy is represented by the tree table.
- [local] Browser DOM contained the three R-10G rows and expand controls on the level 1 and level 2 rows; the level 3 row rendered as a leaf.
- [local] Sampled tabs opened normally with tables present and no error text: `产品系列`, `产品型号`, `物料档案`, `配件档案`, and `销售选项值`.

## Runtime Absence

- [local] Filesystem audit confirmed no sales-order runtime roots under business/admin/ui/api/sql paths.
- [local] Filesystem audit confirmed no field-scheme, formula, or technical-decomposition runtime roots under UI/API paths.

## Acceptance Results

- [local] R-10G live acceptance is complete for product-category tree display, 1/2/3-level create, 3-level maximum depth, backend rejection paths, PC auto-code continuity, non-cascading disable, sampled masterdata tabs, and forbidden runtime absence.
- [local] The passing acceptance run used marker `R10G20260628085626` on backend `http://localhost:18080`, frontend `http://127.0.0.1:5173`, database `my_ry_vue_runtime`, and Redis DB1.

## Final Commands

- [local] `npm run context:build -- customer` passed.
- [local] `npm run check` passed with `npm test` 254/254; existing config-safety output remained development/default warnings only.
- [local] `git diff --check` passed.
