import { fileExists, finish, isCli, listFiles, readJson } from './common.js';

function readProfile() {
  try {
    return readJson('ai/project-profile.json');
  } catch (error) {
    return { error };
  }
}

function detectRuoyiSignals(profile = {}) {
  const profileSignals = profile.signals || {};
  if (profileSignals.hasRuoYiAdmin || profileSignals.hasRuoYiUi) {
    return true;
  }
  if (fileExists('ruoyi-admin') || fileExists('ruoyi-ui')) {
    return true;
  }
  const files = listFiles('.', (file) => !file.startsWith('node_modules/') && !file.startsWith('.git/'));
  return files.some((file) => file.startsWith('ruoyi-admin/') || file.startsWith('ruoyi-ui/'));
}

export function validateProfileLock() {
  const profile = readProfile();
  const errors = [];
  if (profile.error) {
    return [`ai/project-profile.json is missing or unreadable: ${profile.error.message}`];
  }

  const ruoyiDetected = detectRuoyiSignals(profile);
  if (profile.templateSetup === true && !ruoyiDetected) {
    return [];
  }

  if (profile.templateSetup === true && ruoyiDetected) {
    errors.push('RuoYi project structure was detected while templateSetup=true. Run npm run profile:setup or npm run profile:adopt -- ruoyi && npm run profile:lock before business development.');
  }

  if (!profile.locked) {
    errors.push('ai/project-profile.json must be locked before business development. Run npm run profile:setup, or run profile:detect/profile:adopt/profile:lock during project setup.');
  }

  if (ruoyiDetected && profile.adapter !== 'ruoyi') {
    errors.push('RuoYi project structure was detected, but ai/project-profile.json adapter is not ruoyi. Run npm run profile:adopt -- ruoyi and npm run profile:lock during setup.');
  }

  if (!profile.adapterRules) {
    errors.push('ai/project-profile.json must include adapterRules. Run npm run profile:setup or npm run profile:lock.');
  }

  const ruleOwnership = profile.ruleOwnership || {};
  if (ruleOwnership.scannerCanBeEditedDuringBusinessWork !== false) {
    errors.push('Profile ruleOwnership must keep scannerCanBeEditedDuringBusinessWork=false. Scanner/rule changes require rule-change mode.');
  }

  return errors;
}

if (isCli(import.meta.url)) {
  finish('check:profile-lock', validateProfileLock());
}
