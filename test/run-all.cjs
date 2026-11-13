/**
 * LOCII — full local test run.
 * Unit + rubric conformance + build + end-to-end + production bundle.
 * Run with: npm run verify
 */
const { execSync } = require('child_process');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const steps = [
  ['Scheduler engine',        'node test/srs.test.js'],
  ['Daily ritual',            'node test/streak.test.js'],
  ['Curator agent',           'node test/curator.test.js'],
  ['Pinch robustness',        'node test/pinch.test.js'],
  ['Rubric conformance',      'node test/rubric.test.js'],
  ['Production build',        'npx vite build'],
  ['End-to-end (dev server)', 'node test/e2e/smoke.cjs'],
  ['Browser tour',            'node test/e2e/tour.cjs'],
  ['Production bundle',       'node test/e2e/prod.cjs'],
];

const results = [];
for (const [name, cmd] of steps) {
  process.stdout.write(`\n▶ ${name}\n`);
  try {
    const out = execSync(cmd, { cwd: ROOT, encoding: 'utf8', stdio: 'pipe' });
    const summary = (out.match(/(\d+) passed/) || out.match(/(\d+\/\d+ checks passed)/) ||
                     out.match(/PRODUCTION BUILD OK/) || out.match(/built in [\d.]+s/) || [])[0] || 'ok';
    results.push([name, true, summary]);
    console.log(`  ✓ ${summary}`);
  } catch (e) {
    const out = (e.stdout || '') + (e.stderr || '');
    results.push([name, false, out.split('\n').filter(l => /FAIL|Error|error/.test(l)).slice(0, 4).join(' ')]);
    console.log(`  ✗ ${results[results.length - 1][2] || 'failed'}`);
  }
}

console.log('\n' + '─'.repeat(58));
for (const [name, ok, summary] of results) {
  console.log(`${ok ? '  ✓' : '  ✗'}  ${name.padEnd(26)} ${summary}`);
}
const failed = results.filter(r => !r[1]).length;
console.log('─'.repeat(58));
console.log(failed ? `\n${failed} step(s) failed\n` : `\nAll ${results.length} steps passed — ready to ship\n`);
process.exit(failed ? 1 : 0);
