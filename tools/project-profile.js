import fs from 'node:fs';
import path from 'node:path';
import { finish, formatJson, isCli, listFiles, projectPath, readJson, writeOrCheck } from './common.js';

function exists(relativePath) {
  return fs.existsSync(projectPath(relativePath));
}

function writeIfMissing(relativePath, content, errors) {
  const absolute = projectPath(relativePath);
  if (fs.existsSync(absolute)) {
    return;
  }
  fs.mkdirSync(path.dirname(absolute), { recursive: true });
  fs.writeFileSync(absolute, content);
  errors.push(...[]);
}

function detectStack() {
  const files = new Set(listFiles('.', (file) => !file.startsWith('node_modules/') && !file.startsWith('.git/')));
  const hasRuoYiAdmin = exists('ruoyi-admin') || [...files].some((file) => file.startsWith('ruoyi-admin/'));
  const hasRuoYiUi = exists('ruoyi-ui') || [...files].some((file) => file.startsWith('ruoyi-ui/'));
  const hasVue = files.has('package.json') || [...files].some((file) => file.endsWith('vue.config.js') || file.endsWith('vite.config.js'));
  const hasMaven = files.has('pom.xml') || [...files].some((file) => file.endsWith('/pom.xml'));
  const hasMyBatisXml = [...files].some((file) => file.includes('/mapper/') && file.endsWith('.xml'));
  const adapter = hasRuoYiAdmin || hasRuoYiUi ? 'ruoyi' : 'generic';
  return {
    schemaVersion: 1,
    adapter,
    locked: false,
    detectedAt: new Date().toISOString(),
    signals: { hasRuoYiAdmin, hasRuoYiUi, hasVue, hasMaven, hasMyBatisXml },
    ruleOwnership: {
      scannerCanBeGeneratedDuringProfileSetup: true,
      scannerCanBeEditedDuringBusinessWork: false,
      ruleUpgradeRequiresChangeMode: 'rule-change'
    }
  };
}

function readProfile() {
  try {
    return readJson('ai/project-profile.json');
  } catch {
    return null;
  }
}

function ensureUnlocked(profile, force) {
  if (profile?.locked && !force) {
    return ['ai/project-profile.json is locked. Use a rule-change record or --force during project setup before changing project profile or adapter rules.'];
  }
  return [];
}

function loadAdapter(name) {
  const file = `ai/adapters/${name}.json`;
  if (!exists(file)) {
    return { errors: [`Adapter not found: ${file}`], adapter: null };
  }
  return { errors: [], adapter: readJson(file) };
}

function componentCatalogTemplate() {
  return formatJson({ schemaVersion: 1, description: 'Shared component catalog. Register reusable RuoYi UI components before Codex creates or uses them.', components: [] });
}

function componentReadmeTemplate() {
  return [
    '# Shared Components',
    '',
    'Reusable UI components live here. Before Codex creates a component, it must check this folder catalog and `ai/registry/components.json`.',
    '',
    '- Page-local components stay in the feature page folder only when they are not reusable controls.',
    '- Generic controls such as table, form, modal, drawer, filter, upload, picker, and search should be shared or explicitly justified.',
    ''
  ].join('\n');
}

function bootstrapAdapterGovernance(name, errors) {
  if (name === 'ruoyi') {
    writeIfMissing('ruoyi-ui/src/components/catalog.json', componentCatalogTemplate(), errors);
    writeIfMissing('ruoyi-ui/src/components/README.md', componentReadmeTemplate(), errors);
    writeIfMissing('sql/README.md', '# SQL Ownership\n\nRegister menu, permission, migration, and seed SQL ownership here before destructive changes.\n', errors);
  }
}

export function detectProfile({ write = true, force = false } = {}) {
  const current = readProfile();
  const errors = ensureUnlocked(current, force);
  if (errors.length > 0) {
    return errors;
  }
  const profile = detectStack();
  if (write) {
    writeOrCheck('ai/project-profile.json', formatJson(profile), false, errors);
  } else {
    console.log(JSON.stringify(profile, null, 2));
  }
  return errors;
}

export function adoptProfile({ name = 'generic', force = false, detected = null } = {}) {
  const current = readProfile();
  const errors = ensureUnlocked(current, force);
  if (errors.length > 0) {
    return errors;
  }
  const loaded = loadAdapter(name);
  if (loaded.errors.length > 0) {
    return loaded.errors;
  }
  const profile = {
    schemaVersion: 1,
    adapter: name,
    locked: false,
    adoptedAt: new Date().toISOString(),
    signals: detected?.signals,
    adapterRules: loaded.adapter,
    ruleOwnership: {
      scannerCanBeGeneratedDuringProfileSetup: true,
      scannerCanBeEditedDuringBusinessWork: false,
      ruleUpgradeRequiresChangeMode: 'rule-change'
    }
  };
  writeOrCheck('ai/project-profile.json', formatJson(profile), false, errors);
  bootstrapAdapterGovernance(name, errors);
  return errors;
}

export function setupProfile({ force = false } = {}) {
  const detected = detectStack();
  const errors = adoptProfile({ name: detected.adapter, force, detected });
  if (errors.length > 0) {
    return errors;
  }
  return lockProfile();
}

export function lockProfile() {
  const errors = [];
  const profile = readProfile() || detectStack();
  const loaded = loadAdapter(profile.adapter || 'generic');
  if (loaded.adapter) {
    profile.adapterRules = loaded.adapter;
  }
  profile.locked = true;
  profile.lockedAt = new Date().toISOString();
  profile.ruleOwnership = {
    scannerCanBeGeneratedDuringProfileSetup: true,
    scannerCanBeEditedDuringBusinessWork: false,
    ruleUpgradeRequiresChangeMode: 'rule-change'
  };
  writeOrCheck('ai/project-profile.json', formatJson(profile), false, errors);
  return errors;
}

function parseArgs(args) {
  const command = args[0] || 'detect';
  const force = args.includes('--force');
  const write = !args.includes('--json');
  const name = args.find((arg, index) => index > 0 && !arg.startsWith('--')) || 'generic';
  return { command, force, write, name };
}

if (isCli(import.meta.url)) {
  const { command, force, write, name } = parseArgs(process.argv.slice(2));
  let errors = [];
  if (command === 'detect') {
    errors = detectProfile({ write, force });
  } else if (command === 'adopt') {
    errors = adoptProfile({ name, force });
  } else if (command === 'lock') {
    errors = lockProfile();
  } else if (command === 'setup') {
    errors = setupProfile({ force });
  } else {
    errors = ['Usage: node tools/project-profile.js detect|adopt <adapter>|lock|setup [--force] [--json]'];
  }
  finish(`profile:${command}`, errors);
}
