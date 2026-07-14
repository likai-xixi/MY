import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { fileExists, readJson, readText } from '../tools/common.js';

const DETAIL_VIEW = 'ruoyi-ui/src/layout/components/HeaderNotice/DetailView.vue';
const RICH_TEXT_DOCUMENT = 'ruoyi-ui/src/layout/components/HeaderNotice/notice-rich-text.mjs';
const FEATURE_REGISTRY = 'ai/registry/features.json';
const TEST_FILE = 'tests/system-notice-security.test.js';

test('system notice security regression is owned by the system feature and reached by the main gate', () => {
  const pkg = readJson('package.json');
  const registry = readJson(FEATURE_REGISTRY);
  const system = registry.features.find((feature) => feature.id === 'system');

  assert.ok(system, 'system feature must exist');
  assert.equal(pkg.scripts.test, 'node --test tests/*.test.js');
  assert.ok(system.components.includes('ruoyi-ui/src/layout/components/HeaderNotice/DetailView.vue'));
  assert.ok(system.ownership.components.includes('ruoyi-ui/src/layout/components/HeaderNotice/DetailView.vue'));
  assert.ok(system.tests.includes(TEST_FILE));
  assert.ok(system.ownership.tests.includes(TEST_FILE));
});

test('notice rich text never enters the parent document through v-html', () => {
  const detailView = readText(DETAIL_VIEW);

  assert.doesNotMatch(detailView, /\bv-html\s*=/, 'stored notice HTML must not execute in the parent document');
  assert.match(detailView, /<iframe\b/);
  assert.match(detailView, /sandbox=""/, 'the iframe must enable every sandbox restriction');
  assert.match(detailView, /:srcdoc="noticeDocument"/);
  assert.match(detailView, /referrerpolicy="no-referrer"/);
  assert.doesNotMatch(detailView, /allow-scripts|allow-same-origin|allow-forms|allow-top-navigation|allow-popups/);
  assert.match(detailView, /MutationObserver\(syncNoticeColorScheme\)/, 'theme changes must refresh the isolated document');
  assert.match(detailView, /colorScheme:\s*noticeColorScheme\.value/);
});

test('notice iframe document applies a restrictive CSP before untrusted rich text', async () => {
  assert.equal(fileExists(RICH_TEXT_DOCUMENT), true, 'the isolated document builder must exist');
  const moduleUrl = `${pathToFileURL(path.resolve(RICH_TEXT_DOCUMENT)).href}?test=${Date.now()}`;
  const {
    NOTICE_CONTENT_SECURITY_POLICY,
    buildNoticeContentSecurityPolicy,
    buildNoticeDocument
  } = await import(moduleUrl);

  for (const directive of [
    "default-src 'none'",
    "base-uri 'none'",
    "script-src 'none'",
    "connect-src 'none'",
    "object-src 'none'",
    "frame-src 'none'",
    "form-action 'none'"
  ]) {
    assert.ok(NOTICE_CONTENT_SECURITY_POLICY.includes(directive), `missing CSP directive: ${directive}`);
  }

  const sameOriginPolicy = buildNoticeContentSecurityPolicy('https://erp.example.test/some/path');
  assert.match(sameOriginPolicy, /img-src data: blob: https:\/\/erp\.example\.test(?:;|$)/);
  assert.match(sameOriginPolicy, /media-src data: blob: https:\/\/erp\.example\.test(?:;|$)/);
  assert.doesNotMatch(sameOriginPolicy, /(?:^|\s)https:(?:\s|;|$)/, 'arbitrary HTTPS origins must not be allowed');
  assert.equal(buildNoticeContentSecurityPolicy('javascript:alert(1)'), NOTICE_CONTENT_SECURITY_POLICY);

  const hostile = '<script>parent.__noticeXss = true</script><form action="https://attacker.invalid"><button>send</button></form>';
  const document = buildNoticeDocument(hostile);
  const cspIndex = document.indexOf('Content-Security-Policy');
  const contentIndex = document.indexOf(hostile);

  assert.ok(cspIndex > -1, 'CSP must be embedded in srcdoc');
  assert.ok(contentIndex > cspIndex, 'untrusted content must appear only after the CSP declaration');
  assert.match(document, /<meta\s+name="referrer"\s+content="no-referrer"/);
  assert.match(document, /<main\s+class="notice-content">/);
  assert.ok(document.endsWith('</main></body></html>'));
});

test('legitimate notice formatting remains intact inside the isolated document', async () => {
  assert.equal(fileExists(RICH_TEXT_DOCUMENT), true, 'the isolated document builder must exist');
  const moduleUrl = `${pathToFileURL(path.resolve(RICH_TEXT_DOCUMENT)).href}?format=${Date.now()}`;
  const { buildNoticeDocument } = await import(moduleUrl);
  const richText = '<h2>Maintenance</h2><p><strong>Window:</strong> 22:00</p><table><tr><td>A</td></tr></table>';

  assert.ok(buildNoticeDocument(richText).includes(richText));
  assert.ok(buildNoticeDocument(null).includes('<main class="notice-content"></main>'));
});

test('isolated notice document preserves dark theme contrast and Quill read-only formats', async () => {
  const moduleUrl = `${pathToFileURL(path.resolve(RICH_TEXT_DOCUMENT)).href}?theme=${Date.now()}`;
  const { buildNoticeDocument } = await import(moduleUrl);
  const richText = [
    '<p class="ql-align-center ql-indent-2 ql-size-large ql-font-serif">Centered</p>',
    '<div class="ql-code-block-container"><div class="ql-code-block">const safe = true</div></div>'
  ].join('');
  const document = buildNoticeDocument(richText, 'https://erp.example.test', { colorScheme: 'dark' });

  assert.match(document, /<html[^>]+class="dark"[^>]+data-color-scheme="dark"/);
  for (const expectedStyle of [
    ':root.dark',
    '--notice-background: #1d1e1f',
    '--notice-content-color: #d0d0d0',
    '.notice-content .ql-align-center',
    '.notice-content .ql-indent-2:not(.ql-direction-rtl)',
    '.notice-content .ql-size-large',
    '.notice-content .ql-font-serif',
    '.notice-content .ql-code-block-container'
  ]) {
    assert.ok(document.includes(expectedStyle), `missing isolated read-only style: ${expectedStyle}`);
  }
  assert.ok(document.includes(richText));
});
