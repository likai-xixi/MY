# R-12A Database Acceptance

Provenance: `[runtime-local]` on MySQL database `my_ry_vue_runtime`.

## Strategy And Recovery Points

- Strategy A deterministic migration was executed with `sql/migrations/V20260720_007_masterdata_option_set_breaking_migration.sql`.
- Pre-cutover backup: `C:\Users\11131\AppData\Local\Codex\r12a-backups\20260721\r12a-pre-cutover.sql`, 388432 bytes, SHA-256 `EA5439E498B0D6A96D68A7B4BC8FE36019763FE63DA7AE68466F74B1FD17B2FE`.
- Post-migration/pre-fixture backup: `C:\Users\11131\AppData\Local\Codex\r12a-backups\20260721\r12a-post-migration-pre-fixture-20260721-072332.sql`, 395529 bytes, SHA-256 `00DE75A00071BFD9E99352F310A6E5D53C830C11C616713835F6A1A811E6ABE4`.
- The post-migration snapshot was restored after API/browser acceptance, so temporary acceptance records are not present in the final database.

## Deterministic Dirty-data Correction

- Original problem: the reserved deleted product-category hierarchy mutex row was absent (`count=0`).
- Rule: recreate only reserved sentinel `id=-1`, hidden/deleted state, after rejecting any conflicting id/code row; do not mutate business categories.
- Affected rows: 1 inserted sentinel.
- Result: `product_category_hierarchy_mutex=1`; shared validation passed.

## Final Validation

Both `masterdata_option_set_validation.sql` and `masterdata_runtime_validation.sql` were executed from binary-safe files inside the MySQL container.

- `masterdata_option_set=4`; `masterdata_option_value=2`; `selection_mode=SINGLE` rows=4.
- Old sales-option tables=0; orphan option values=0; duplicate `(option_set_id, option_value_code)` groups=0.
- Selection-mode CHECK=1; RESTRICT option-value foreign key=1; option-set unique-code index=1; option-value composite unique index columns=`option_set_id,option_value_code`.
- New option menu=1; old option menu=0; old permission alias=0.
- Current product wording row=1; menu remarks containing the obsolete product-model wording=0.
- All nine current masterdata tables exist; shared permissions and hierarchy mutex validation passed.

## Rollback Rehearsal

- Restored the pre-cutover backup into isolated `my_ry_vue_r12a_rollback`.
- Built review-base source `f28e3d12358bdc35ac1782fd50be7850f937bc1b` with Maven.
- Started that old runtime on port 18081 and used a real captcha-backed login.
- Old `sales-option-category` and `sales-option-value` list APIs both returned business code 200 against the restored old database.
- Stopped the old runtime and removed the isolated database and temporary detached worktree.
