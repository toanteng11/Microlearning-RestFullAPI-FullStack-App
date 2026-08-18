const DEFAULT_IMAGE_PREFIX =
  'asia-southeast1-docker.pkg.dev/microlearning-platform-502716/microlearning/microlearning-app';

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function validateImageReference(imageRef, expectedPrefix = DEFAULT_IMAGE_PREFIX) {
  if (typeof imageRef !== 'string' || imageRef.trim() !== imageRef) {
    throw new Error('Image reference must be a trimmed string.');
  }

  const pattern = new RegExp(`^${escapeRegExp(expectedPrefix)}@sha256:[a-f0-9]{64}$`);
  if (!pattern.test(imageRef)) {
    throw new Error(
      `Image reference must equal ${expectedPrefix}@sha256:<64 lowercase hex>; tags are forbidden.`,
    );
  }

  return imageRef;
}

export function validateReleaseManifest(manifest, options = {}) {
  const expectedPrefix = options.expectedPrefix ?? DEFAULT_IMAGE_PREFIX;
  const errors = [];
  const requiredStrings = [
    'image',
    'localImageId',
    'appVersion',
    'commitSha',
    'buildTime',
    'source',
    'generatedAt',
  ];

  if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest)) {
    return ['Manifest must be a JSON object.'];
  }
  if (manifest.schemaVersion !== 1) errors.push('schemaVersion must equal 1.');
  if (!['LOCAL_ONLY', 'REGISTRY_DIGEST'].includes(manifest.evidenceScope)) {
    errors.push('evidenceScope must be LOCAL_ONLY or REGISTRY_DIGEST.');
  }
  for (const field of requiredStrings) {
    if (typeof manifest[field] !== 'string' || manifest[field].length === 0) {
      errors.push(`${field} must be a non-empty string.`);
    }
  }
  if (typeof manifest.sizeBytes !== 'number' || manifest.sizeBytes <= 0) {
    errors.push('sizeBytes must be a positive number.');
  }
  if (typeof manifest.promotionEligible !== 'boolean') {
    errors.push('promotionEligible must be boolean.');
  }
  if (!manifest.evidence || typeof manifest.evidence !== 'object') {
    errors.push('evidence must be an object.');
  }
  if (!manifest.provenance || typeof manifest.provenance !== 'object') {
    errors.push('provenance must be an object.');
  }

  if (manifest.evidenceScope === 'LOCAL_ONLY') {
    if (manifest.registryDigest !== null || manifest.immutableImageRef !== null) {
      errors.push('LOCAL_ONLY evidence cannot claim a registry digest.');
    }
    if (manifest.promotionEligible) {
      errors.push('LOCAL_ONLY evidence cannot be promotion eligible.');
    }
  }

  if (manifest.evidenceScope === 'REGISTRY_DIGEST') {
    try {
      validateImageReference(manifest.registryDigest, expectedPrefix);
    } catch (error) {
      errors.push(error.message);
    }
    if (manifest.immutableImageRef !== manifest.registryDigest) {
      errors.push('immutableImageRef must equal registryDigest.');
    }
    for (const field of ['scanReportSha256', 'sbomSha256']) {
      const value = manifest.evidence?.[field];
      if (typeof value !== 'string' || !/^[a-f0-9]{64}$/.test(value)) {
        errors.push(`evidence.${field} must be a 64-character SHA-256 digest.`);
      }
    }
    if (manifest.evidence?.bundleName !== 'phase-07-release-candidate') {
      errors.push('Registry evidence bundleName must be phase-07-release-candidate.');
    }
    if (manifest.evidence?.retentionDays !== 30) {
      errors.push('Registry evidence retentionDays must equal 30.');
    }
    if (!/^[a-f0-9]{40}$/u.test(manifest.commitSha ?? '')) {
      errors.push('Registry release commitSha must be a full 40-character SHA.');
    }
    const provenanceStrings = [
      'repository',
      'trustedRef',
      'sourceWorkflow',
      'sourceRunId',
      'sourceRunUrl',
      'buildWorkflow',
      'buildRunId',
      'buildRunUrl',
    ];
    for (const field of provenanceStrings) {
      if (typeof manifest.provenance?.[field] !== 'string' || !manifest.provenance[field]) {
        errors.push(`provenance.${field} is required for registry evidence.`);
      }
    }
  }

  if (manifest.promotionEligible && manifest.promotionBlockReason !== null) {
    errors.push('promotionBlockReason must be null when promotionEligible is true.');
  }
  if (!manifest.promotionEligible && typeof manifest.promotionBlockReason !== 'string') {
    errors.push('promotionBlockReason is required while promotionEligible is false.');
  }

  return errors;
}

export { DEFAULT_IMAGE_PREFIX };
