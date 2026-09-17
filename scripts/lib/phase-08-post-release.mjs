import {
  HTTPS_URL,
  isObject,
  rejectSecrets,
  requireSha256,
  requireString,
  requireUtc,
  validateEnvelope,
  validateExactEvidenceIds,
} from './phase-08-evidence-utils.mjs';

const CHECKPOINTS = Object.freeze([
  ['T+0', 0],
  ['T+15m', 15 * 60 * 1000],
  ['T+1h', 60 * 60 * 1000],
  ['T+24h', 24 * 60 * 60 * 1000],
  ['T+72h', 72 * 60 * 60 * 1000],
]);
const METRIC_FIELDS = Object.freeze([
  'errorRatePercent',
  'p95LatencyMs',
  'instanceCount',
  'restartCount',
  'mongoErrorCount',
  'authFailureCount',
]);
const EVIDENCE_IDS = Object.freeze(['P08-EV-038', 'P08-EV-039', 'P08-EV-040']);

function validateCheckpoint(checkpoint, expected, deployedAt, identity, errors, index) {
  const path = `observationWindow.checkpoints[${index}]`;
  if (!isObject(checkpoint)) {
    errors.push(`${path} must be an object.`);
    return;
  }
  if (checkpoint.label !== expected[0]) errors.push(`${path}.label must equal ${expected[0]}.`);
  if (checkpoint.status !== 'PASS') errors.push(`${path}.status must equal PASS.`);
  const recordedAt = requireUtc(checkpoint, 'recordedAtUtc', errors, `${path}.recordedAtUtc`);
  if (recordedAt && deployedAt && Date.parse(recordedAt) < Date.parse(deployedAt) + expected[1]) {
    errors.push(`${path}.recordedAtUtc is earlier than ${expected[0]}.`);
  }
  if (checkpoint.revision !== identity?.productionRevision) {
    errors.push(`${path}.revision must match the Production revision.`);
  }
  if (checkpoint.imageDigest !== identity?.imageDigest) {
    errors.push(`${path}.imageDigest must match the immutable release image.`);
  }
  if (!isObject(checkpoint.metrics)) {
    errors.push(`${path}.metrics must be an object.`);
    return;
  }
  if (checkpoint.metrics.readyStatus !== 200)
    errors.push(`${path}.metrics.readyStatus must equal 200.`);
  for (const field of METRIC_FIELDS) {
    if (typeof checkpoint.metrics[field] !== 'number' || checkpoint.metrics[field] < 0) {
      errors.push(`${path}.metrics.${field} must be a non-negative number.`);
    }
  }
  requireString(checkpoint, 'source', errors, `${path}.source`);
}

export function validatePhase08PostRelease(record) {
  const errors = [];
  if (!validateEnvelope(record, 'POST_RELEASE_OBSERVATION', errors)) return errors;
  requireSha256(record, 'productionDeploymentSha256', errors);

  const window = record.observationWindow;
  if (!isObject(window)) {
    errors.push('observationWindow must be an object.');
  } else {
    const deployedAt = requireUtc(
      window,
      'deployedAtUtc',
      errors,
      'observationWindow.deployedAtUtc',
    );
    requireUtc(window, 'startedAtUtc', errors, 'observationWindow.startedAtUtc');
    const endedAt = requireUtc(window, 'endedAtUtc', errors, 'observationWindow.endedAtUtc');
    if (!Array.isArray(window.checkpoints) || window.checkpoints.length !== CHECKPOINTS.length) {
      errors.push('observationWindow.checkpoints must contain exactly five checkpoints.');
    } else {
      CHECKPOINTS.forEach((expected, index) =>
        validateCheckpoint(
          window.checkpoints[index],
          expected,
          deployedAt,
          record.releaseIdentity,
          errors,
          index,
        ),
      );
      const last = window.checkpoints.at(-1)?.recordedAtUtc;
      if (endedAt && last && Date.parse(endedAt) < Date.parse(last)) {
        errors.push('observationWindow.endedAtUtc must not precede T+72h.');
      }
    }
  }

  const alert = record.alertTest;
  if (!isObject(alert)) {
    errors.push('alertTest must be an object.');
  } else {
    if (alert.status !== 'PASS') errors.push('alertTest.status must equal PASS.');
    if (alert.acknowledged !== true) errors.push('alertTest.acknowledged must be true.');
    requireUtc(alert, 'testedAtUtc', errors, 'alertTest.testedAtUtc');
    requireString(alert, 'destination', errors, 'alertTest.destination');
    requireString(alert, 'actor', errors, 'alertTest.actor');
    requireString(alert, 'evidence', errors, 'alertTest.evidence');
  }

  const logReview = record.logReview;
  if (!isObject(logReview)) {
    errors.push('logReview must be an object.');
  } else {
    if (logReview.status !== 'PASS') errors.push('logReview.status must equal PASS.');
    if (logReview.requestIdObserved !== true)
      errors.push('logReview.requestIdObserved must be true.');
    if (logReview.releaseIdentityObserved !== true) {
      errors.push('logReview.releaseIdentityObserved must be true.');
    }
    if (logReview.redactionStatus !== 'PASS') {
      errors.push('logReview.redactionStatus must equal PASS.');
    }
    requireUtc(logReview, 'reviewedAtUtc', errors, 'logReview.reviewedAtUtc');
  }

  if (!Array.isArray(record.incidents)) {
    errors.push('incidents must be an array.');
  } else {
    record.incidents.forEach((incident, index) => {
      const path = `incidents[${index}]`;
      if (!isObject(incident)) {
        errors.push(`${path} must be an object.`);
        return;
      }
      requireString(incident, 'id', errors, `${path}.id`);
      requireString(incident, 'owner', errors, `${path}.owner`);
      requireString(incident, 'decision', errors, `${path}.decision`);
      if (!['CLOSED', 'ACCEPTED_FOLLOW_UP'].includes(incident.status)) {
        errors.push(`${path}.status must be CLOSED or ACCEPTED_FOLLOW_UP.`);
      }
      if (['CRITICAL', 'HIGH'].includes(incident.severity) && incident.status !== 'CLOSED') {
        errors.push(`${path} Critical/High incident must be CLOSED.`);
      }
    });
  }

  const recovery = record.recovery;
  if (!isObject(recovery)) {
    errors.push('recovery must be an object.');
  } else {
    if (!['PASS', 'NOT_REQUIRED'].includes(recovery.status)) {
      errors.push('recovery.status must be PASS or NOT_REQUIRED.');
    }
    if (!['ROLLBACK_VERIFIED', 'NO_ROLLBACK_REQUIRED'].includes(recovery.strategy)) {
      errors.push('recovery.strategy is invalid.');
    }
    requireString(recovery, 'rationale', errors, 'recovery.rationale');
    requireSha256(recovery, 'evidenceSha256', errors, 'recovery.evidenceSha256');
  }

  const hypercare = record.hypercare;
  if (!isObject(hypercare)) {
    errors.push('hypercare must be an object.');
  } else {
    if (hypercare.status !== 'CLOSED') errors.push('hypercare.status must equal CLOSED.');
    if (hypercare.recommendation !== 'GO') errors.push('hypercare.recommendation must equal GO.');
    if (hypercare.unresolvedCritical !== 0 || hypercare.unresolvedHigh !== 0) {
      errors.push('hypercare unresolved Critical and High counts must equal zero.');
    }
    requireString(hypercare, 'owner', errors, 'hypercare.owner');
    requireUtc(hypercare, 'closedAtUtc', errors, 'hypercare.closedAtUtc');
  }

  if (
    record.releaseIdentity?.productionUrl &&
    !HTTPS_URL.test(record.releaseIdentity.productionUrl)
  ) {
    errors.push('Production URL must use HTTPS.');
  }
  validateExactEvidenceIds(record.evidenceIds, EVIDENCE_IDS, errors);
  rejectSecrets(record, errors);
  return errors;
}

export function assertValidPhase08PostRelease(record) {
  const errors = validatePhase08PostRelease(record);
  if (errors.length > 0)
    throw new Error(`Phase 08 post-release evidence failed:\n- ${errors.join('\n- ')}`);
  return record;
}

export const PHASE08_POST_RELEASE = Object.freeze({ CHECKPOINTS, EVIDENCE_IDS, METRIC_FIELDS });
