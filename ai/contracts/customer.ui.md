# 客户管理 UI Ownership Contract

Feature ID: `customer`

## Owned Screens

- `customer:customer`
- Runtime route: `/business/customer`
- Menu: `业务管理 / 客户管理`
- File: `ruoyi-ui/src/views/customer/index.vue`
- Region data: `ruoyi-ui/src/utils/region-data.js`

The screen includes list search/table actions, add/edit dialog, detail drawer, owner transfer dialog, fund entry dialog, and sample rebate dialog.
The route is the RuoYi menu route produced by parent path `business` plus child path `customer`.

## Display Rules

- Customer list search includes customer nature (`REAL`/`PUBLIC`) and public channel (`DIRECT_SALE`/`SELF_MEDIA`) filters.
- Public customers are marked with a visible tag in the list.
- Customer code column uses a fixed width, no wrapping, overflow ellipsis, and Element Plus overflow tooltip.
- Customer name stays clickable and opens the existing detail drawer.
- Customer list displays province/city/district Chinese names in a tooltip-enabled column.
- Customer level display must use labels in every visible customer context: `A`, `B`, `C`, `NORMAL -> 普通`.
- Customer type display must use labels in every visible customer context: `DEALER -> 经销商`, `PROJECT -> 工程客户`, `RETAIL -> 散户`, `STORE -> 门店`, `OTHER -> 其他`.
- Add/edit customer dialogs use a searchable province/city/district cascader. Users cannot type arbitrary province/city/district text in the dialog.
- Cascader options are imported from `@/utils/region-data`, generated from `china-area-data@5.0.1 (MIT)` instead of hand-written mock options.
- The option tree covers province-level regions, direct municipalities, autonomous regions, prefecture-level cities/states/leagues, and district/county/county-level-city nodes.
- Direct municipalities are normalized to a complete 3-level path, for example `北京市 / 北京市 / 朝阳区`.
- Existing customers echo the saved province/city/district into the cascader by `province_code`/`city_code`/`district_code` when codes exist. If historical rows only have Chinese names, the UI attempts name-based matching; the legacy source label `省直辖县级行政区划` is accepted and displayed as `济源示范区` for Henan/Jiyuan.
- If a customer or shipping-address cascader has only a partial path selected, save is blocked with a clear message requiring selection down to district/county.
- Cascader option values are administrative division codes and labels are Chinese names.
- Save payloads persist both `province_code`, `city_code`, `district_code` and Chinese `province`, `city`, `district` for customer master data and shipping addresses.
- Customer detail, list, and export continue showing Chinese province/city/district names, not raw codes.
- Customer short name remains optional; when it is blank, backend save fills it from customer name.
- Add/edit customer dialogs expose customer nature. Public customer dialogs show public channel and the notice: `公共客户仅用于订单归类，实际购买人、联系电话、收货地址、接待业务员请在销售订单中填写。`
- Public customer editing hides contact, shipping-address, fixed-owner, and sync controls. Public customer detail hides customer-level deposit/sample policy actions and shows the public-customer fund notice.
- New real-customer creation does not require users to duplicate master contact/address fields into child tabs. When master contact/phone/WeChat and detail address are present, the backend creates the default contact and default shipping address transactionally.
- The edit dialog base tab exposes two explicit sync options:
  - `同步到默认联系人`: syncs master contact, phone, and WeChat to the default contact. It is checked by default when editing real customers and can be manually cancelled before save.
  - `同步到默认收货地址`: syncs master contact, phone, province/city/district code/name fields, and detail address to the default shipping address. It is checked by default when editing real customers and can be manually cancelled before save.
- If users do not check the sync options during edit, changing master contact/address fields must not overwrite existing default child records.
- Funds and policy display only `定金` and `样品返现`. The UI must not show old long-term or rolling deposit labels.
- Deposit entry dialog captures `收款金额`, optional `收款凭证号`, and `备注`; it must not show account-type selection or source-order fields.
- The accepted page route is `/business/customer`; `/customer` remains outside the runtime contract.

## Shared Component Rule

- This change uses existing RuoYi/Element Plus primitives and does not introduce shared components.
- Page-local structures are customer-specific and must not be promoted unless another feature reuses them in a later change.
- If a future reusable customer selector is needed, it must be created under the active shared component root and registered before use.

## Verification

- `npm run scan:frontend-routes`
- `npm run check:components`
- `npm run check:component-similarity`
- Browser validation on `/business/customer` for REAL/PUBLIC create/edit, public customer hidden child/fund controls, unified deposit display, complete area selection for real customers, default contact/address auto-create, edit sync/no-sync behavior, and parsed XLSX export labels.
