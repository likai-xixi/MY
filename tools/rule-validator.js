import { ensure, fileExists, finish, hasHeading, isCli, listFiles, readText } from './common.js';

export const REQUIRED_AGENT_HEADINGS = [
  '## Role',
  '## Owns',
  '## Inputs',
  '## Outputs',
  '## Non-goals',
  '## Required checks',
  '## Handoff'
];

export function validateAgents() {
  const errors = [];
  const misleadingRulesText = ['Rules', 'enforced.'].join(' ');

  ensure(fileExists('AGENTS.md'), 'AGENTS.md is missing.', errors);
  if (fileExists('AGENTS.md')) {
    const agentsTop = readText('AGENTS.md');
    ensure(!agentsTop.includes(misleadingRulesText), `AGENTS.md still contains the misleading text "${misleadingRulesText}".`, errors);
    ensure(hasHeading(agentsTop, '## Mission'), 'AGENTS.md must include ## Mission.', errors);
    ensure(hasHeading(agentsTop, '## Work Loop'), 'AGENTS.md must include ## Work Loop.', errors);
    ensure(hasHeading(agentsTop, '## Role Routing'), 'AGENTS.md must include ## Role Routing.', errors);
    ensure(hasHeading(agentsTop, '## Hard Rules'), 'AGENTS.md must include ## Hard Rules.', errors);
  }

  const agentFiles = listFiles('agents', (file) => file.endsWith('.md'));
  ensure(agentFiles.length >= 6, 'At least six agent role files are required.', errors);

  for (const file of agentFiles) {
    const text = readText(file);
    for (const heading of REQUIRED_AGENT_HEADINGS) {
      ensure(hasHeading(text, heading), `${file} must include ${heading}.`, errors);
    }
  }

  return errors;
}

if (isCli(import.meta.url)) {
  finish('validate:agents', validateAgents());
}
