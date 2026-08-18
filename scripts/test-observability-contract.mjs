import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const terraform = readFileSync('infrastructure/terraform/modules/monitoring/main.tf', 'utf8');
const variables = readFileSync('infrastructure/terraform/modules/monitoring/variables.tf', 'utf8');
const staging = readFileSync('infrastructure/terraform/environments/staging/main.tf', 'utf8');
const logger = readFileSync('apps/api/src/shared/logging/logger.ts', 'utf8');

for (const resource of [
  'google_logging_metric" "http_5xx',
  'google_logging_metric" "readiness_failures',
  'google_logging_metric" "auth_failures',
  'google_monitoring_dashboard" "operations',
  'google_monitoring_uptime_check_config" "health',
  'google_monitoring_alert_policy" "uptime',
  'google_monitoring_alert_policy" "http_5xx',
  'google_monitoring_alert_policy" "readiness',
  'google_monitoring_alert_policy" "memory',
]) {
  assert.ok(terraform.includes(resource), `Missing observability resource: ${resource}`);
}
for (const releaseField of [
  'app_version',
  'commit_sha',
  'image_digest',
  'Active release',
  'Image digest',
]) {
  assert.ok(terraform.includes(releaseField), `Missing active release metadata: ${releaseField}`);
}
for (const term of ['service_name', 'service_host', 'notification_email', 'provision']) {
  assert.ok(variables.includes(`variable "${term}"`), `Missing monitoring input: ${term}`);
}
assert.ok(
  staging.includes('image_digest       = local.image_digest'),
  'Staging Monitoring must receive the parsed immutable image digest',
);
for (const term of [
  'redact:',
  'req.headers.authorization',
  'body.password',
  'body.refreshToken',
  'sanitizeRequestUrl',
]) {
  assert.ok(logger.includes(term), `Missing log redaction contract: ${term}`);
}
for (const forbidden of [
  'MONGODB_URI',
  'ACCESS_TOKEN_SECRET',
  'AUTH_IDENTITY_PEPPER',
  'CLASSROOM_CODE_PEPPER',
]) {
  assert.ok(
    !terraform.includes(forbidden),
    `Secret name leaked into monitoring Terraform: ${forbidden}`,
  );
}
process.stdout.write(
  `${JSON.stringify({ event: 'observability.contract.tests_passed', resourcesChecked: 9 })}\n`,
);
