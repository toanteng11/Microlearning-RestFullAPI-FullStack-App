import { ESLint } from 'eslint';

const eslint = new ESLint();
const [result] = await eslint.lintText('const intentionallyUnused = 1;\n', {
  filePath: 'apps/api/src/negative-gate.ts',
});

const expectedViolation = result.messages.some(
  (message) => message.ruleId === '@typescript-eslint/no-unused-vars' && message.severity === 2,
);

if (!expectedViolation || result.errorCount === 0) {
  throw new Error('Negative lint gate failed: the intentional violation was not rejected.');
}

console.log('Negative lint gate passed: intentional unused variable was rejected.');
