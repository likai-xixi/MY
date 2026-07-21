import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { readJson, readText } from '../tools/common.js';

const UI_PACKAGE = 'ruoyi-ui/package.json';
const UI_LOCK = 'ruoyi-ui/package-lock.json';
const SVG_PLUGIN = 'ruoyi-ui/vite/plugins/svg-icon.js';
const VITE_PLUGINS = 'ruoyi-ui/vite/plugins/index.js';
const MAIN = 'ruoyi-ui/src/main.js';
const SVG_COMPONENT = 'ruoyi-ui/src/components/SvgIcon/index.vue';
const CACHE_VIEW = 'ruoyi-ui/src/views/monitor/cache/index.vue';
const CACHE_REQUEST = 'ruoyi-ui/src/views/monitor/cache/cache-request-controller.mjs';
const CACHE_LIFECYCLE = 'ruoyi-ui/src/views/monitor/cache/chart-lifecycle.mjs';
const ICON_ROOT = 'ruoyi-ui/src/assets/icons/svg';
const FEATURE_REGISTRY = 'ai/registry/features.json';
const TEST_FILE = 'tests/frontend-dependency-hardening.test.js';
const UI_LIFECYCLE_TEST = 'ruoyi-ui/tests/cache-chart-lifecycle.test.js';
const UI_REQUEST_TEST = 'ruoyi-ui/tests/cache-request-controller.test.js';
const UI_SPRITEMAP_TEST = 'ruoyi-ui/tests/spritemap-production.test.js';

function versionTuple(version) {
  return version.split('.').map((part) => Number.parseInt(part, 10));
}

function versionAtLeast(version, minimum) {
  const actual = versionTuple(version);
  const required = versionTuple(minimum);
  for (let index = 0; index < Math.max(actual.length, required.length); index += 1) {
    const delta = (actual[index] || 0) - (required[index] || 0);
    if (delta !== 0) return delta > 0;
  }
  return true;
}

function braceExpansionPatchedForGhsa3jxr9vmjr5cp(version) {
  const [major] = versionTuple(version);
  if (major === 1) return versionAtLeast(version, '1.1.16');
  if (major === 2) return versionAtLeast(version, '2.1.2');
  return major >= 5 && versionAtLeast(version, '5.0.7');
}

function assertBalancedXmlTags(file, source) {
  const stack = [];
  const tags = source.match(/<\/?[A-Za-z][^>]*>/g) || [];
  for (const tag of tags) {
    if (/^<\//.test(tag)) {
      const name = tag.match(/^<\/([A-Za-z][\w:.-]*)/)?.[1];
      assert.equal(stack.pop(), name, `${file} has an unmatched closing <${name}> tag`);
    } else if (!/\/>$/.test(tag)) {
      const name = tag.match(/^<([A-Za-z][\w:.-]*)/)?.[1];
      stack.push(name);
    }
  }
  assert.deepEqual(stack, [], `${file} has unclosed XML tags`);
}

test('platform owns the regression and clean CI executes both controller and full UI suites', () => {
  const rootPackage = readJson('package.json');
  const uiPackage = readJson(UI_PACKAGE);
  const registry = readJson(FEATURE_REGISTRY);
  const platform = registry.features.find((feature) => feature.id === 'platform');

  assert.ok(platform, 'platform feature must exist');
  assert.equal(rootPackage.scripts.test, 'node --test tests/*.test.js');
  assert.equal(uiPackage.scripts.test, 'node --test tests/*.test.js');
  assert.equal(uiPackage.scripts['prebuild:prod'], 'npm test', 'the existing frontend CI build must run the full UI suite');
  assert.ok(platform.tests.includes(TEST_FILE));
  assert.ok(platform.ownership.tests.includes(TEST_FILE));
  for (const executableTest of [UI_LIFECYCLE_TEST, UI_REQUEST_TEST, UI_SPRITEMAP_TEST]) {
    assert.equal(fs.existsSync(executableTest), true, `${executableTest} must exist`);
  }

  const result = spawnSync(process.execPath, ['--test', UI_LIFECYCLE_TEST, UI_REQUEST_TEST], {
    cwd: process.cwd(),
    encoding: 'utf8',
    timeout: 60_000
  });
  assert.equal(
    result.status,
    0,
    `dependency-free UI controller regressions must pass through the clean root test gate\n${result.stdout || ''}\n${result.stderr || ''}`
  );
});

test('frontend dependency graph removes known vulnerable visualization, SVG, and brace-expansion packages', () => {
  const pkg = readJson(UI_PACKAGE);
  const lock = readJson(UI_LOCK);
  const packages = lock.packages || {};

  assert.equal(pkg.dependencies.echarts, '6.1.0');
  assert.equal(pkg.devDependencies['@spiriit/vite-plugin-svg-spritemap'], '6.0.0');
  assert.equal(pkg.devDependencies.svgo, '4.0.2');
  assert.equal(pkg.devDependencies['vite-plugin-svg-icons'], undefined);
  assert.equal(packages['node_modules/echarts']?.version, '6.1.0');
  assert.equal(packages['node_modules/@spiriit/vite-plugin-svg-spritemap']?.version, '6.0.0');
  assert.equal(packages['node_modules/svgo']?.version, '4.0.2');
  assert.equal(packages['node_modules/brace-expansion']?.version, '2.1.2');

  for (const packagePath of Object.keys(packages)) {
    assert.doesNotMatch(packagePath, /(?:^|\/)node_modules\/(?:vite-plugin-svg-icons|svg-baker)$/);
    if (/(?:^|\/)node_modules\/postcss$/.test(packagePath)) {
      assert.equal(
        versionAtLeast(packages[packagePath].version, '8.5.10'),
        true,
        `${packagePath} must not resolve a vulnerable PostCSS version`
      );
    }
    if (/(?:^|\/)node_modules\/brace-expansion$/.test(packagePath)) {
      assert.equal(
        braceExpansionPatchedForGhsa3jxr9vmjr5cp(packages[packagePath].version),
        true,
        `${packagePath} must not resolve a version affected by GHSA-3jxr-9vmj-r5cp`
      );
    }
  }
});

test('spritemap wiring preserves icon ids without the legacy virtual injection module', () => {
  const plugin = readText(SVG_PLUGIN);
  const pluginIndex = readText(VITE_PLUGINS);
  const main = readText(MAIN);
  const component = readText(SVG_COMPONENT);

  assert.match(plugin, /@spiriit\/vite-plugin-svg-spritemap/);
  assert.match(plugin, /prefix:\s*['"]icon-['"]/);
  assert.match(plugin, /route:\s*['"]\/__spritemap['"]/);
  assert.match(plugin, /oxvg:\s*false/);
  assert.match(plugin, /styles:\s*false/);
  assert.match(plugin, /injectSvgOnDev:\s*false/);
  assert.match(plugin, /name:\s*['"]removeDimensions['"]/);
  assert.match(plugin, /removeStyleElement/);
  assert.doesNotMatch(plugin, /removeViewBox/);
  assert.doesNotMatch(plugin, /preset-default/);
  assert.match(plugin, /view:\s*false/);
  assert.match(plugin, /use:\s*false/);
  assert.match(pluginIndex, /\.\.\.createSvgIcon\(\)/);
  assert.doesNotMatch(main, /virtual:svg-icons-register/);
  assert.match(component, /\/__spritemap#icon-/);
});

test('all repository icons are parseable, locally self-contained, and convertible to viewBox symbols', () => {
  const icons = fs.readdirSync(ICON_ROOT).filter((file) => file.endsWith('.svg')).sort();
  assert.equal(icons.length, 90, 'the migration must preserve the complete 90-icon inventory');

  for (const icon of icons) {
    const source = fs.readFileSync(path.join(ICON_ROOT, icon), 'utf8');
    assertBalancedXmlTags(icon, source);
    for (const style of source.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)) {
      assert.equal(style[1].trim(), '', `${icon} must not rely on a style block removed by the build`);
    }
    assert.doesNotMatch(source, /<script\b|\son[a-z]+\s*=/i, `${icon} must not contain executable SVG content`);
    assert.doesNotMatch(
      source,
      /(?:url\(\s*['"]?(?:https?:|chrome-extension:|\/\/)|(?:xlink:href|href)\s*=\s*['"](?:https?:|chrome-extension:|\/\/))/i,
      `${icon} must not reference an external origin`
    );
    assert.ok(
      /\bviewBox\s*=/.test(source) || (/\bwidth\s*=\s*['"]\d+(?:\.\d+)?['"]/.test(source) && /\bheight\s*=\s*['"]\d+(?:\.\d+)?['"]/.test(source)),
      `${icon} needs a viewBox or numeric dimensions for removeDimensions`
    );
  }
});

test('cache charts wire executable request and lifecycle controllers', () => {
  const source = readText(CACHE_VIEW);
  const requestController = readText(CACHE_REQUEST);
  const lifecycle = readText(CACHE_LIFECYCLE);

  assert.match(source, /import\s+['"]echarts\/theme\/macarons\.js['"]/);
  assert.match(source, /createCacheChartLifecycle/);
  assert.match(source, /createCacheRequestController/);
  assert.match(source, /charts\.mount\(\)/);
  assert.match(source, /charts\.dispose\(\)/);
  assert.match(source, /requestController\.load\(\)/);
  assert.match(source, /requestController\.dispose\(\)/);
  assert.match(source, /onMounted\s*\(/);
  assert.match(source, /onBeforeUnmount\s*\(/);
  assert.match(requestController, /export\s+function\s+createCacheRequestController/);
  assert.match(requestController, /version\s*!==\s*requestVersion/);
  assert.match(requestController, /Request failures are reported once by the shared Axios interceptor/);
  assert.match(requestController, /reportRenderError\(error\?\.message\s*\|\|\s*renderErrorMessage\)/);
  assert.match(lifecycle, /export\s+function\s+createCacheChartLifecycle/);
  assert.match(lifecycle, /const\s+resize\s*=\s*\(\)\s*=>/);
  assert.match(lifecycle, /addEventListener\?\.\(['"]resize['"],\s*resize\)/);
  assert.match(lifecycle, /removeEventListener\?\.\(['"]resize['"],\s*resize\)/);
  assert.match(lifecycle, /new\s+ResizeObserverImpl\(resize\)/);
  assert.match(lifecycle, /resizeObserver\?\.disconnect\(\)/);
  assert.match(lifecycle, /getInstanceByDom/);
  assert.match(lifecycle, /commandstatsInstance\?\.dispose\(\)/);
  assert.match(lifecycle, /usedmemoryInstance\?\.dispose\(\)/);
});
