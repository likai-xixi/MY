import { finish, isCli } from './common.js';
import { readSafe, writeGenerated } from './scan-utils.js';
import { configuredPaths, inferFeatureFromPath, listFilesUnderRoots, readFeatureRegistry } from './project-config.js';

function moduleFor(file, text, features) {
  const fromPath = inferFeatureFromPath(file, features);
  if (fromPath) {
    return fromPath;
  }
  const normalizedFile = file.toLowerCase();
  const normalizedText = text.toLowerCase();
  const feature = (features || []).find((item) => {
    if (item.status === 'removed') {
      return false;
    }
    const names = [item.id, item.name, ...(item.aliases || [])].filter(Boolean).map((value) => String(value).toLowerCase());
    return names.some((name) => normalizedFile.includes(name) || normalizedText.includes(name));
  });
  return feature?.id || '';
}

function scanSqlTables(file, text, features) {
  const tables = [];
  const module = moduleFor(file, text, features);
  const createRegex = /\bCREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?[`"]?([a-zA-Z0-9_]+)[`"]?/gi;
  let match;
  while ((match = createRegex.exec(text))) {
    tables.push({ name: match[1], module, file, source: 'create-table' });
  }
  const mapperRegex = /(?<!<)\b(?:from|join|update|into|delete\s+from|truncate\s+table)\s+[`"]?([a-zA-Z0-9_]+)[`"]?/gi;
  while ((match = mapperRegex.exec(text))) {
    tables.push({ name: match[1], module, file, source: 'sql-reference' });
  }
  const tableNameRegex = /@TableName\s*\(\s*["']([^"']+)["']\s*\)/g;
  while ((match = tableNameRegex.exec(text))) {
    tables.push({ name: match[1], module, file, source: 'java-table-annotation' });
  }
  return tables;
}

export function buildDbSchemaScan() {
  const config = configuredPaths();
  const features = readFeatureRegistry();
  const files = listFilesUnderRoots(config.dbScanRoots, (file) => /\.(sql|xml|yml|yaml|java|kt)$/.test(file));
  const seen = new Set();
  const tables = [];
  for (const table of files.flatMap((file) => scanSqlTables(file, readSafe(file), features))) {
    const key = `${table.name}:${table.file}:${table.source}`;
    if (!seen.has(key)) {
      seen.add(key);
      tables.push(table);
    }
  }
  return {
    schemaVersion: 1,
    generatedBy: 'tools/scan-db-schema.js',
    adapter: config.adapter,
    roots: config.dbScanRoots,
    tables
  };
}

export function runDbSchemaScan({ checkMode = false } = {}) {
  return writeGenerated('ai/generated/db-schema.json', buildDbSchemaScan(), { checkMode });
}

if (isCli(import.meta.url)) {
  finish('scan:db', runDbSchemaScan({ checkMode: process.argv.includes('--check') }));
}
