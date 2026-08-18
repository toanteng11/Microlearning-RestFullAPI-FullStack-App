import { readFileSync, readdirSync, statSync } from 'node:fs';
import { resolve } from 'node:path';

const bundleRoot = resolve(process.argv[2] ?? 'apps/web/dist');
const prohibitedPatterns = [
  {
    label: 'local development API URL',
    pattern: /https?:\/\/(?:localhost:\d+|127\.0\.0\.1(?::\d+)?)/iu,
  },
  { label: 'MongoDB connection string', pattern: /mongodb(?:\+srv)?:\/\//iu },
  { label: 'private key', pattern: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/u },
];
const textExtensions = new Set(['.css', '.html', '.js', '.json', '.map', '.txt']);

function listFiles(directory) {
  return readdirSync(directory).flatMap((name) => {
    const path = resolve(directory, name);
    return statSync(path).isDirectory() ? listFiles(path) : [path];
  });
}

const files = listFiles(bundleRoot).filter((path) =>
  [...textExtensions].some((extension) => path.endsWith(extension)),
);
const findings = [];

for (const file of files) {
  const content = readFileSync(file, 'utf8');
  for (const rule of prohibitedPatterns) {
    if (rule.pattern.test(content)) findings.push(`${rule.label}: ${file}`);
  }
}

if (findings.length > 0) {
  throw new Error(`Production Web bundle validation failed:\n${findings.join('\n')}`);
}

process.stdout.write(`Production Web bundle verified (${files.length} text artifacts).\n`);
