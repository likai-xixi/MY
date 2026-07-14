# Request

Follow up the successful `master` CI run `29374274047`: remove its unused Maven cache from the governance job and replace the pinned GitHub Actions that emitted Node.js 20 deprecation annotations with verified Node 24-compatible release pins. Preserve the governance JDK, all test, audit, build, and backend integration coverage; do not release or deploy.
