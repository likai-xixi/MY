import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { CODE_EXTENSIONS, textFilesUnder } from '../tools/scan-utils.js';
import { buildFrontendRouteScan } from '../tools/scan-frontend-routes.js';
import * as apiScanner from '../tools/scan-api-clients.js';
import * as permissionScanner from '../tools/scan-permissions.js';
import * as componentScanner from '../tools/scan-components.js';
import * as componentChecker from '../tools/component-checker.js';
import * as boundaryChecker from '../tools/boundary-lint.js';
import * as diffChecker from '../tools/diff-checker.js';
import * as impactAnalyzer from '../tools/impact-analyzer.js';
import * as orphanChecker from '../tools/orphan-code-checker.js';
import * as duplicateScanner from '../tools/duplicate-scan.js';
import * as ownershipSyncer from '../tools/ownership-syncer.js';
import * as phaseGateChecker from '../tools/phase-gate-checker.js';
import * as fileWeightChecker from '../tools/file-weight-checker.js';
import * as removeFeature from '../scripts/remove-feature.js';

const RUNTIME_MJS_FILES = [
  'ruoyi-ui/src/layout/components/HeaderNotice/notice-rich-text.mjs',
  'ruoyi-ui/src/views/customer/detail-request-guard.mjs',
  'ruoyi-ui/src/views/monitor/cache/cache-request-controller.mjs',
  'ruoyi-ui/src/views/monitor/cache/chart-lifecycle.mjs'
];

const FEATURES = [
  { id: 'customer', status: 'active', frontendModules: ['ruoyi-ui/src/views/customer'] },
  { id: 'monitor', status: 'active', frontendModules: ['ruoyi-ui/src/views/monitor'] },
  { id: 'masterdata', status: 'active', frontendModules: ['ruoyi-ui/src/views/masterdata'] }
];

test('general source traversal includes every runtime mjs helper without creating fake routes', () => {
  assert.equal(CODE_EXTENSIONS.has('.mjs'), true);
  const scanned = new Set(textFilesUnder('ruoyi-ui/src'));
  for (const file of RUNTIME_MJS_FILES) {
    assert.equal(fs.existsSync(file), true, file);
    assert.equal(scanned.has(file), true, `${file} must be visible to general source traversal`);
  }

  const routeFiles = new Set(buildFrontendRouteScan().routes.map((route) => route.file));
  for (const file of RUNTIME_MJS_FILES) {
    assert.equal(routeFiles.has(file), false, `${file} must remain a helper rather than a route page`);
  }

  const registry = JSON.parse(fs.readFileSync('ai/registry/features.json', 'utf8'));
  const system = registry.features.find((feature) => feature.id === 'system');
  assert.equal(system.components.includes(RUNTIME_MJS_FILES[0]), false);
  assert.equal(system.ownership.components.includes(RUNTIME_MJS_FILES[0]), false);
});

test('every non-route governance source policy classifies mjs as executable text', () => {
  const file = 'ruoyi-ui/src/views/customer/helper.mjs';
  const policies = [
    ['api client', apiScanner.isFrontendApiSourceFile],
    ['permission', permissionScanner.isPermissionSourceFile],
    ['component consumer', componentScanner.isComponentConsumerSourceFile],
    ['boundary', boundaryChecker.isCodeFile],
    ['diff hygiene', diffChecker.isTextHygieneFile],
    ['impact', impactAnalyzer.isImpactReferenceFile],
    ['orphan', orphanChecker.isOrphanReferenceFile],
    ['duplicate', duplicateScanner.isDuplicateCandidateFile],
    ['ownership', ownershipSyncer.isFrontendOwnershipSourceFile],
    ['phase gate', phaseGateChecker.isRuntimeSourceFile],
    ['file weight', fileWeightChecker.isMethodWeightSourceFile],
    ['feature removal', removeFeature.isRemovalReferenceFile]
  ];

  for (const [name, policy] of policies) {
    assert.equal(typeof policy, 'function', `${name} policy must be executable`);
    assert.equal(policy(file), true, `${name} must include .mjs`);
  }
  assert.equal(componentChecker.isComponentSourceFile(file), false, 'plain .mjs helpers must not become component candidates');
});

test('api permission and component-consumer scans execute against mjs fixtures', () => {
  const file = 'ruoyi-ui/src/views/monitor/fixture.mjs';
  const config = {
    adapter: 'ruoyi',
    frontendScanRoots: ['ruoyi-ui/src/views/monitor'],
    frontendModuleRoots: [],
    sharedComponentRoots: []
  };
  const list = (roots, predicate) => (roots.includes('ruoyi-ui/src/views/monitor') && predicate(file) ? [file] : []);
  const source = [
    "import Widget from '@/components/Widget'",
    'request({',
    "  url: '/monitor/cache',",
    "  method: 'get'",
    '})',
    "const permission = 'monitor:cache:list'"
  ].join('\n');

  const api = apiScanner.buildApiClientScan({
    config,
    features: FEATURES,
    list,
    listModuleFiles: () => [],
    readTextFile: () => source
  });
  assert.ok(api.calls.some((call) => call.file === file && call.path === '/monitor/cache'));

  const permissions = permissionScanner.buildPermissionScan({
    config: { ...config, permissionScanRoots: config.frontendScanRoots },
    features: FEATURES,
    list,
    readTextFile: () => source
  });
  assert.ok(permissions.permissions.some((entry) => entry.file === file && entry.code === 'monitor:cache:list'));

  const components = componentScanner.buildComponentScan({
    config,
    features: FEATURES,
    list,
    exists: () => false,
    readOrDefault: () => ({ schemaVersion: 1, components: [] }),
    readTextFile: () => source
  });
  assert.ok(components.imports.some((entry) => entry.file === file && entry.source === '@/components/Widget'));
  assert.equal(components.moduleComponentFiles.some((entry) => entry.file === file), false);
});

test('boundary lint evaluates cross-feature imports inside mjs helpers', () => {
  const file = 'ruoyi-ui/src/views/customer/unsafe-helper.mjs';
  const errors = boundaryChecker.validateFrontendBoundaries({
    files: () => [],
    ruoyiFiles: (_roots, predicate) => predicate(file) ? [file] : [],
    ruoyiRead: () => "import resource from '@/api/masterdata'",
    ruoyiFeatures: FEATURES,
    legacyState: { valid: true, errors: [], baseline: { boundaryFindings: [] } },
    exceptionState: { valid: true, errors: [], entries: [] }
  });

  assert.ok(errors.some((error) => error.includes(`${file} must not import another RuoYi feature internals (masterdata)`)));
});

test('impact and orphan scans include source mjs while excluding nested dependencies', () => {
  const source = 'ruoyi-ui/src/views/customer/reference-helper.mjs';
  const businessBuildSource = 'ruoyi-ui/src/views/tool/build/CodeTypeDialog.vue';
  const dependency = 'ruoyi-ui/node_modules/example/reference-helper.mjs';
  const candidates = [source, businessBuildSource, dependency];
  const list = (_root, predicate) => candidates.filter((file) => predicate(file));
  const readTextFile = () => "export const permission = 'customer:record:list';";
  assert.equal(fs.existsSync(businessBuildSource), true);

  const references = impactAnalyzer.findReferences(['customer:record:list'], { list, readTextFile });
  assert.deepEqual(references, [source, businessBuildSource]);

  const orphanErrors = orphanChecker.scanOrphans({
    tokens: ['customer:record:list'],
    allowedPrefixes: [],
    allowedFiles: [],
    list,
    readTextFile,
    readIgnoreConfigFile: () => ({ prefixes: [], files: [] })
  });
  assert.deepEqual(orphanErrors, [
    `${source} still contains removed feature token customer:record:list.`,
    `${businessBuildSource} still contains removed feature token customer:record:list.`
  ]);
});

test('duplicate and file-weight checks execute against mjs helpers', () => {
  const first = 'ruoyi-ui/src/views/customer/first-helper.mjs';
  const second = 'ruoyi-ui/src/views/customer/second-helper.mjs';
  const businessBuildSource = 'ruoyi-ui/src/views/tool/build/CodeTypeDialog.vue';
  const dependencyBuildOutput = 'ruoyi-ui/node_modules/example/build/generated.mjs';
  const duplicateSource = 'export const duplicatedCustomerHelper = () => customerRecord;\n';
  const duplicateErrors = duplicateScanner.scanDuplicates({
    list: (_root, predicate) => [first, second, businessBuildSource, dependencyBuildOutput].filter((file) => predicate(file)),
    readTextFile: () => duplicateSource
  });
  assert.deepEqual(duplicateErrors, [
    `${second} duplicates the full content of ${first}.`,
    `${businessBuildSource} duplicates the full content of ${first}.`
  ]);

  const longMethod = [
    'export function buildCustomerCacheModel() {',
    ...Array.from({ length: 121 }, (_, index) => `  const value${index} = ${index};`),
    '}'
  ].join('\n');
  const weight = fileWeightChecker.validateFileWeight({
    changedFiles: [first],
    readJsonFile: () => ({ current: '' }),
    readTextFile: () => longMethod,
    statFile: () => ({ isDirectory: () => false, isFile: () => true })
  });
  assert.ok(weight.warnings.some((warning) => warning.startsWith(`${first}:1 method/function is `)));
});
