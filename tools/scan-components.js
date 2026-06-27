import { finish, isCli, fileExists, readJson } from './common.js';
import { basenameWithoutExtension, readJsonOrDefault, readSafe, writeGenerated } from './scan-utils.js';
import { configuredPaths, inferFeatureFromPath, listFilesUnderRoots, readFeatureRegistry } from './project-config.js';
import { isComponentSourceFile, isModuleComponentCandidate } from './component-checker.js';

const COMPONENT_EXTENSIONS = /\.(vue|tsx|jsx|ts|js)$/;
const HTML_TAGS = new Set([
  'a', 'abbr', 'address', 'area', 'article', 'aside', 'audio', 'b', 'base', 'bdi', 'bdo', 'blockquote', 'body',
  'br', 'button', 'canvas', 'caption', 'cite', 'code', 'col', 'colgroup', 'data', 'datalist', 'dd', 'del',
  'details', 'dfn', 'dialog', 'div', 'dl', 'dt', 'em', 'embed', 'fieldset', 'figcaption', 'figure', 'footer',
  'form', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'head', 'header', 'hr', 'html', 'i', 'iframe', 'img', 'input',
  'ins', 'kbd', 'label', 'legend', 'li', 'link', 'main', 'map', 'mark', 'meta', 'meter', 'nav', 'noscript',
  'object', 'ol', 'optgroup', 'option', 'output', 'p', 'param', 'picture', 'pre', 'progress', 'q', 'rp', 'rt',
  'ruby', 's', 'samp', 'script', 'section', 'select', 'slot', 'small', 'source', 'span', 'strong', 'style',
  'sub', 'summary', 'sup', 'svg', 'table', 'tbody', 'td', 'template', 'textarea', 'tfoot', 'th', 'thead',
  'time', 'title', 'tr', 'track', 'u', 'ul', 'var', 'video', 'wbr'
]);
const VUE_BUILTIN_TAGS = new Set(['component', 'keep-alive', 'router-link', 'router-view', 'suspense', 'teleport', 'transition', 'transition-group']);
const KNOWN_GLOBAL_COMPONENT_TAGS = new Set([
  'dict-tag',
  'editor',
  'file-upload',
  'image-preview',
  'image-upload',
  'pagination',
  'right-toolbar',
  'svg-icon'
]);

function kebabCase(value = '') {
  return String(value)
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[_\s/]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

function templateBlock(text = '') {
  return text.match(/<template(?:\s[^>]*)?>([\s\S]*?)<\/template>/i)?.[1] || '';
}

function isIgnoredTemplateTag(tag = '') {
  const normalized = tag.toLowerCase();
  return HTML_TAGS.has(normalized)
    || VUE_BUILTIN_TAGS.has(normalized)
    || normalized.startsWith('el-');
}

export function extractVueTemplateComponentTags(text = '') {
  const template = templateBlock(text);
  if (!template) {
    return [];
  }
  const tags = [];
  const tagRegex = /<\s*([A-Za-z][A-Za-z0-9-]*)\b/g;
  for (const match of template.matchAll(tagRegex)) {
    const tag = match[1];
    if (isIgnoredTemplateTag(tag)) {
      continue;
    }
    if (tag.includes('-') || /^[A-Z]/.test(tag) || KNOWN_GLOBAL_COMPONENT_TAGS.has(tag.toLowerCase())) {
      tags.push(kebabCase(tag));
    }
  }
  return [...new Set(tags)].sort();
}

function componentTagIndex(components = []) {
  const index = new Map();
  for (const component of components || []) {
    const tags = [
      component.name,
      component.id,
      component.exportedFrom,
      ...(component.aliases || [])
    ].filter(Boolean).flatMap((value) => {
      const text = String(value);
      const noExtension = text.replace(/\.(vue|tsx|jsx|ts|js)$/i, '');
      const parts = noExtension.split(/[\\/]/).filter(Boolean);
      return [text, noExtension, ...parts];
    }).map(kebabCase).filter(Boolean);
    for (const tag of tags) {
      if (!index.has(tag)) {
        index.set(tag, component.id || component.name || '');
      }
    }
  }
  return index;
}

function readSharedCatalog(root, { exists = fileExists, read = readJson } = {}) {
  const catalogPath = `${root}/catalog.json`;
  return exists(catalogPath) ? read(catalogPath) : { schemaVersion: 1, components: [] };
}

export function buildComponentScan({
  config = configuredPaths(),
  features = readFeatureRegistry(),
  list = listFilesUnderRoots,
  exists = fileExists,
  read = readJson,
  readOrDefault = readJsonOrDefault,
  readTextFile = readSafe
} = {}) {
  const registry = readOrDefault('ai/registry/components.json', { schemaVersion: 1, components: [] });
  const sharedCatalogs = config.sharedComponentRoots.map((root) => ({ root, components: readSharedCatalog(root, { exists, read }).components || [] }));
  const sharedFiles = list(config.sharedComponentRoots, (file) => isComponentSourceFile(file));
  const moduleComponentFiles = list(config.frontendModuleRoots, (file) => isModuleComponentCandidate(file));
  const imports = list(config.frontendScanRoots, (file) => COMPONENT_EXTENSIONS.test(file)).flatMap((file) => {
    const text = readTextFile(file);
    const matches = [...text.matchAll(/from\s+["']([^"']*components[^"']*)["']/g)];
    return matches.map((match) => ({ file, module: inferFeatureFromPath(file, features), source: match[1] }));
  });
  const componentIndex = componentTagIndex([
    ...(registry.components || []),
    ...sharedCatalogs.flatMap((item) => item.components || [])
  ]);
  const globalComponentUsages = list(config.frontendScanRoots, (file) => file.endsWith('.vue')).flatMap((file) => {
    const text = readTextFile(file);
    return extractVueTemplateComponentTags(text).map((tag) => ({
      file,
      module: inferFeatureFromPath(file, features),
      tag,
      componentId: componentIndex.get(tag) || '',
      source: 'vue-template-global'
    }));
  });
  const globalUsageCounts = new Map();
  for (const usage of globalComponentUsages) {
    globalUsageCounts.set(usage.tag, (globalUsageCounts.get(usage.tag) || 0) + 1);
  }
  const globalComponentWarnings = [...globalUsageCounts.entries()]
    .filter(([tag, count]) => count >= 2 && !componentIndex.has(tag))
    .map(([tag, count]) => ({ tag, count, warning: 'global component tag is used frequently but is not registered in the component registry/catalog' }));

  return {
    schemaVersion: 1,
    generatedBy: 'tools/scan-components.js',
    adapter: config.adapter,
    sharedCatalogs,
    sharedCatalog: sharedCatalogs.flatMap((item) => item.components),
    componentRegistry: registry.components || [],
    sharedFiles: sharedFiles.map((file) => ({ file, name: basenameWithoutExtension(file) })),
    moduleComponentFiles: moduleComponentFiles.map((file) => ({ file, name: basenameWithoutExtension(file), module: inferFeatureFromPath(file, features) })),
    imports,
    globalComponentUsages,
    globalComponentWarnings
  };
}

export function runComponentScan({ checkMode = false } = {}) {
  return writeGenerated('ai/generated/component-usage.json', buildComponentScan(), { checkMode });
}

if (isCli(import.meta.url)) {
  finish('scan:components', runComponentScan({ checkMode: process.argv.includes('--check') }));
}
