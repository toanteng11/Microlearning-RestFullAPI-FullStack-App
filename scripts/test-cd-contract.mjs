import {
  validateDeploymentRecord,
  validateReleaseLineage,
  validateTrustedWorkflowRun,
} from './lib/cd-contract.mjs';

const repository = 'toanteng11/Microlearning-RestFullAPI-FullStack-App';
const commitSha = 'a'.repeat(40);
const imageRef = `asia-southeast1-docker.pkg.dev/microlearning-platform-502716/microlearning/microlearning-app@sha256:${'b'.repeat(64)}`;

function expectFailure(action, pattern) {
  try {
    action();
  } catch (error) {
    if (pattern.test(error instanceof Error ? error.message : String(error))) return;
    throw error;
  }
  throw new Error(`Expected failure matching ${pattern}.`);
}

const ciRun = {
  id: 101,
  name: 'Continuous Integration',
  status: 'completed',
  conclusion: 'success',
  event: 'push',
  head_branch: 'main',
  head_sha: commitSha,
  html_url: 'https://github.com/example/repository/actions/runs/101',
  head_repository: { full_name: repository },
};
const trustedCi = validateTrustedWorkflowRun(ciRun, {
  workflowName: 'Continuous Integration',
  repository,
});
if (trustedCi.commitSha !== commitSha || trustedCi.runId !== '101') {
  throw new Error('Trusted CI normalization is incorrect.');
}

expectFailure(
  () =>
    validateTrustedWorkflowRun(
      { ...ciRun, conclusion: 'failure' },
      {
        workflowName: 'Continuous Integration',
        repository,
      },
    ),
  /successfully/u,
);
expectFailure(
  () =>
    validateTrustedWorkflowRun(
      { ...ciRun, event: 'pull_request' },
      {
        workflowName: 'Continuous Integration',
        repository,
      },
    ),
  /not trusted/u,
);
expectFailure(
  () =>
    validateTrustedWorkflowRun(
      { ...ciRun, head_repository: { full_name: 'attacker/fork' } },
      { workflowName: 'Continuous Integration', repository },
    ),
  /repository/u,
);
expectFailure(
  () =>
    validateTrustedWorkflowRun(
      { ...ciRun, head_branch: 'feature/cloud' },
      {
        workflowName: 'Continuous Integration',
        repository,
      },
    ),
  /main/u,
);

const manifest = {
  schemaVersion: 1,
  evidenceScope: 'REGISTRY_DIGEST',
  image: `microlearning-platform:release-${commitSha}`,
  localImageId: `sha256:${'c'.repeat(64)}`,
  localContentDigest: null,
  immutableImageRef: imageRef,
  registryDigest: imageRef,
  sizeBytes: 64,
  runtimeUser: 'node',
  appVersion: '0.1.0',
  commitSha,
  buildTime: '2026-08-17T00:00:00.000Z',
  source: `https://github.com/${repository}`,
  generatedAt: '2026-08-17T00:01:00.000Z',
  evidence: {
    scanReport: 'artifacts/phase-07/scan/microlearning-production-trivy.json',
    scanReportSha256: 'd'.repeat(64),
    sbom: 'artifacts/phase-07/sbom/microlearning-production.cdx.json',
    sbomSha256: 'e'.repeat(64),
    bundleName: 'phase-07-release-candidate',
    retentionDays: 30,
  },
  provenance: {
    repository,
    trustedRef: 'refs/heads/main',
    sourceWorkflow: 'Continuous Integration',
    sourceRunId: '101',
    sourceRunUrl: 'https://github.com/example/repository/actions/runs/101',
    buildWorkflow: 'Build And Publish',
    buildRunId: '102',
    buildRunUrl: 'https://github.com/example/repository/actions/runs/102',
  },
  promotionEligible: false,
  promotionBlockReason: 'Staging smoke is pending.',
};
validateReleaseLineage(manifest, { repository, buildRunId: '102', expectedCommit: commitSha });
expectFailure(
  () =>
    validateReleaseLineage({ ...manifest, registryDigest: `${imageRef}:latest` }, { repository }),
  /invalid|forbidden|reference/iu,
);
expectFailure(
  () =>
    validateReleaseLineage(
      { ...manifest, provenance: { ...manifest.provenance, sourceWorkflow: 'Pull Request CI' } },
      { repository, buildRunId: '102' },
    ),
  /Continuous Integration/iu,
);

const deployment = {
  schemaVersion: 1,
  environment: 'staging',
  repository,
  commitSha,
  imageRef,
  serviceUrl: 'https://microlearning-staging.example.run.app',
  revision: 'microlearning-staging-00001-abc',
  sourceBuildRunId: '102',
  deploymentWorkflowRunId: '103',
  releaseManifest: manifest,
  decision: 'CANDIDATE',
};
validateDeploymentRecord(deployment, {
  repository,
  deploymentRunId: '103',
  expectedDecision: 'CANDIDATE',
});
expectFailure(
  () => validateDeploymentRecord({ ...deployment, repository: 'attacker/fork' }, { repository }),
  /repository/u,
);

process.stdout.write(`${JSON.stringify({ event: 'cd.contract.tests_passed' })}\n`);
