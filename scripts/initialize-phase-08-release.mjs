import { emitValidationEvent, readJson } from './lib/phase-08-cli.mjs';
import { initializePhase08Workspace } from './lib/phase-08-workspace.mjs';

const [profilePath, rootPath] = process.argv.slice(2);
const { value: profile } = readJson(profilePath, 'Phase 08 release profile');
const { releasePath } = initializePhase08Workspace(profile, rootPath);
emitValidationEvent('phase-08.workspace.initialized', {
  releaseId: profile.releaseId,
  releasePath,
});
