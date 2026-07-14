# Context

- Feature: `platform`.
- Review base: `428d359827cc5f34441fe1f6b206c6f9a906aed6`.
- The project is unreleased, so the approved contract may replace the abandoned SVG integration directly without a compatibility shim.
- Current findings are ECharts below 6.1.0 plus `vite-plugin-svg-icons -> svg-baker -> postcss@5`.
- The repository contains exactly 90 SVG source icons and one cache-monitor page with two ECharts instances.
- Existing backend `getCache`, routes, permissions, database objects, and monitor ownership are outside this slice.
- Governance rules, CI workflow changes, audit-policy tightening, release, deployment, sales-order runtime, and stash restoration are separate work.

Implementation must use a dedicated platform change record, stay inside the approved roots, run executable UI regressions and browser acceptance, and finish with the repository gate.
