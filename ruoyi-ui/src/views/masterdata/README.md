# 主数据配置 RuoYi Frontend Ownership

Feature ID: `masterdata`

This folder owns the R-10B masterdata maintenance page.

- The page may maintain only the nine R-10B master-data objects.
- Add does not show a required code input; the backend generates code.
- Edit shows code as read-only.
- Product category uses a tree table and allows at most three hierarchy levels.
- Product category parent selection excludes the current category and descendants.
- Product families, product types, and sales option examples are data rows, not UI branches.
- Sales-order, field-scheme, formula, and technical-decomposition runtime must stay out of this folder.
