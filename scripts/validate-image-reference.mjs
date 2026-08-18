import { validateImageReference } from './lib/release-contract.mjs';

const imageRef = process.argv[2];
const expectedPrefix = process.argv[3];

if (!imageRef) {
  throw new Error('Usage: node scripts/validate-image-reference.mjs <image-ref> [expected-prefix]');
}

validateImageReference(imageRef, expectedPrefix);
process.stdout.write(`${JSON.stringify({ event: 'image.reference.validated', imageRef })}\n`);
