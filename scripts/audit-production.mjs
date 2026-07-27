import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const exceptionFile = new URL('../.github/security-audit-exceptions.json', import.meta.url);
const policy = JSON.parse(readFileSync(exceptionFile, 'utf8'));
const today = new Date();
const exceptions = new Map(
  policy.exceptions.map((exception) => {
    const expiresAt = new Date(`${exception.expiresOn}T23:59:59.999Z`);
    if (!Number.isFinite(expiresAt.getTime())) {
      throw new Error(`Invalid audit exception expiry for ${exception.advisory}`);
    }
    if (expiresAt < today) {
      throw new Error(`Audit exception ${exception.advisory} expired on ${exception.expiresOn}`);
    }
    return [exception.source, exception];
  }),
);

const audit =
  process.platform === 'win32'
    ? spawnSync(
        process.env.ComSpec ?? 'cmd.exe',
        ['/d', '/s', '/c', 'npm audit --omit=dev --json'],
        { encoding: 'utf8', shell: false },
      )
    : spawnSync('npm', ['audit', '--omit=dev', '--json'], {
        encoding: 'utf8',
        shell: false,
      });
if (audit.error) throw audit.error;

let report;
try {
  report = JSON.parse(audit.stdout);
} catch {
  process.stderr.write(audit.stderr || audit.stdout);
  throw new Error('npm audit did not return a valid JSON report');
}

const vulnerabilities = new Map(Object.entries(report.vulnerabilities ?? {}));
const allowedPackages = new Set();
let changed = true;
while (changed) {
  changed = false;
  for (const [packageName, vulnerability] of vulnerabilities) {
    if (allowedPackages.has(packageName)) continue;
    const allowed = vulnerability.via.every((via) => {
      if (typeof via === 'string') return allowedPackages.has(via);
      const exception = exceptions.get(via.source);
      return (
        exception?.package === via.name &&
        exception.severity === via.severity &&
        via.url.endsWith(exception.advisory)
      );
    });
    if (allowed) {
      allowedPackages.add(packageName);
      changed = true;
    }
  }
}

const blocked = [...vulnerabilities.entries()].filter(
  ([packageName, vulnerability]) =>
    ['high', 'critical'].includes(vulnerability.severity) && !allowedPackages.has(packageName),
);
if (blocked.length > 0) {
  process.stderr.write(
    `Production dependency audit failed: ${blocked
      .map(([packageName, vulnerability]) => `${packageName} (${vulnerability.severity})`)
      .join(', ')}\n`,
  );
  process.exitCode = 1;
} else {
  const accepted = [...allowedPackages].join(', ') || 'none';
  process.stdout.write(
    `Production dependency audit passed. Time-bound exceptions applied to: ${accepted}.\n`,
  );
}
