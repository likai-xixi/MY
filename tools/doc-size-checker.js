import fs from 'node:fs';
import path from 'node:path';
import { ensure, finish, isCli, projectPath, readJson, readText } from './common.js';

const FIXED_LIMITS = [
  { file: 'AGENTS.md', maxLines: 280 },
  { file: 'README.md', maxLines: 240 },
  { file: 'memory/PROJECT_STATE.md', maxLines: 220 },
  { file: 'memory/HANDOVER.md', maxLines: 240 },
  { file: 'ai/context/current-context.md', maxLines: 700 }
];

function lineCount(text) {
  return text.length === 0 ? 0 : text.split(/\r?\n/).length;
}

function readBaseline() {
  try {
    return readJson('ai/context/size-baselines.json');
  } catch {
    return { files: {} };
  }
}

function listMarkdown(relativeDir) {
  const base = projectPath(relativeDir);
  if (!fs.existsSync(base)) {
    return [];
  }
  return fs.readdirSync(base)
    .filter((file) => file.endsWith('.md'))
    .map((file) => `${relativeDir}/${file}`);
}

function listReviewSummaries() {
  const base = projectPath('ai/reviews');
  if (!fs.existsSync(base)) {
    return [];
  }
  const out = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else {
        const rel = full.replace(projectPath('') + path.sep, '').replace(/\\/g, '/');
        if (/summary\.md$|review-summary\.md$/i.test(rel)) {
          out.push(rel);
        }
      }
    }
  };
  walk(base);
  return out.sort();
}

function checkLimit({ file, maxLines, baselines, errors }) {
  if (!fs.existsSync(projectPath(file))) {
    return;
  }
  const lines = lineCount(readText(file));
  if (lines <= maxLines) {
    return;
  }
  const baseline = baselines.files?.[file];
  const baselineLines = Number(baseline?.lines || 0);
  ensure(
    baselineLines >= lines && typeof baseline.reason === 'string' && baseline.reason.trim().length > 0,
    `${file} has ${lines} lines, limit ${maxLines}. Add a justified ai/context/size-baselines.json entry or split the document.`,
    errors
  );
}

export function validateDocSize() {
  const errors = [];
  const baselines = readBaseline();

  for (const item of FIXED_LIMITS) {
    checkLimit({ ...item, baselines, errors });
  }
  for (const file of listMarkdown('ai/context/features')) {
    checkLimit({ file, maxLines: 500, baselines, errors });
  }
  for (const file of listReviewSummaries()) {
    checkLimit({ file, maxLines: 120, baselines, errors });
  }

  return errors;
}

if (isCli(import.meta.url)) {
  finish('check:doc-size', validateDocSize());
}
