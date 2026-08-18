import { mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, extname, join, resolve } from 'node:path';

const [targetPathValue, outputPathValue] = process.argv.slice(2);
if (!targetPathValue || !outputPathValue) {
  throw new Error('Usage: node scripts/scan-e2e-artifacts.mjs <artifact-directory> <report.json>');
}
const targetPath = resolve(targetPathValue);
const outputPath = resolve(outputPathValue);
const exactSecret = process.env.E2E_SECRET_CANARY;
if (!exactSecret) throw new Error('E2E_SECRET_CANARY is required for artifact redaction scan.');

const textExtensions = new Set(['.html', '.json', '.txt', '.xml', '.log', '.md']);
const findings = [];
let filesScanned = 0;

function scan(path) {
  const metadata = statSync(path);
  if (metadata.isDirectory()) {
    for (const entry of readdirSync(path)) scan(join(path, entry));
    return;
  }
  if (!textExtensions.has(extname(path).toLowerCase())) return;
  filesScanned += 1;
  const content = readFileSync(path, 'utf8');
  const rules = [
    ['synthetic-password', content.includes(exactSecret)],
    ['mongodb-uri', /mongodb\+srv:\/\//iu.test(content)],
    ['bearer-jwt', /bearer\s+eyJ[a-z0-9_-]+\./iu.test(content)],
    ['service-account-key', /"private_key"\s*:/u.test(content)],
    ['google-credential-file', /gha-creds-[a-z0-9-]+\.json/iu.test(content)],
  ];
  for (const [rule, matched] of rules) {
    if (matched) findings.push({ rule, file: path.replaceAll('\\', '/') });
  }
}

scan(targetPath);
const report = {
  schemaVersion: 1,
  scannedAt: new Date().toISOString(),
  target: targetPath.replaceAll('\\', '/'),
  filesScanned,
  findings,
  status: findings.length === 0 ? 'PASS' : 'FAIL',
};
mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);
if (findings.length > 0) {
  throw new Error(`Cloud E2E artifact redaction failed with ${findings.length} finding(s).`);
}
process.stdout.write(
  `${JSON.stringify({ event: 'cloud.e2e_artifacts.redaction_passed', filesScanned })}\n`,
);
