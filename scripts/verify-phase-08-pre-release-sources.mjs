import { emitValidationEvent, readJson, writeValidationReport } from './lib/phase-08-cli.mjs';
import { verifyPhase08PreReleaseSources } from './lib/phase-08-pre-release-sources.mjs';

const [identityPath, systemTestPath, uatPath, readinessPath, planOnlyPath, outputPath] =
  process.argv.slice(2);

if (!outputPath) {
  throw new Error(
    'Usage: node scripts/verify-phase-08-pre-release-sources.mjs <identity.json> <system-test.json> <uat.json> <production-readiness.json> <plan-only.json> <report.json>',
  );
}

const report = verifyPhase08PreReleaseSources({
  releaseIdentity: readJson(identityPath, 'release identity').value,
  systemTest: readJson(systemTestPath, 'System Test summary').value,
  uat: readJson(uatPath, 'UAT summary').value,
  productionReadiness: readJson(readinessPath, 'Production readiness').value,
  productionTerraformReadiness: readJson(planOnlyPath, 'Production Terraform PLAN_ONLY').value,
});

writeValidationReport(outputPath, 'G5_SOURCE_VERIFICATION', report);
emitValidationEvent('phase-08.pre_release_sources.verified', {
  releaseId: report.releaseIdentity.releaseId,
  planHash: report.sources.planHash,
});
