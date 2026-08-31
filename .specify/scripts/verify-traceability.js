// Spec → implementation → test traceability checker (execution-aware).
//
// Every requirement ID declared in a colocated `src/**/*.spec.md` file, and every
// architectural principle ID ([ARC-NN]) declared in .specify/memory/constitution.md, must:
//   1. be tagged in implementation code as `// [REQ-AREA-NN]` (or `{/* [REQ-AREA-NN] */}`), and
//   2. appear in the title of at least one test that Vitest actually ran and that PASSED.
//      Skipped, todo, and failing tests do not count. Test coverage is read from Vitest's
//      JSON reporter, not from test-file text, so an ID that only appears in a comment
//      inside a test file does not satisfy the requirement.
// Reverse pass: IDs found in implementation tags, executed test titles, or design decision
// records (DESIGN_DECISIONS.md) that no spec declares fail the check (typos, or
// requirements removed without cleaning up).
//
// Usage: node .specify/scripts/verify-traceability.js [--matrix] [--results <vitest.json>]
//   --matrix           print the full ID → implementation files → passing tests table.
//   --results <file>   read an existing Vitest JSON report instead of running the suite
//                      (produce one with: vitest run --reporter=json --outputFile=<file>).

import fs from 'fs';
import os from 'os';
import path from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../..');
const srcRoot = path.join(projectRoot, 'src');
const REQ_REGEX = /\[(?:REQ-[A-Z]+|ARC)-\d+\]/g; // feature requirements and architectural principles
const CONSTITUTION_FILE = path.join(projectRoot, '.specify/memory/constitution.md');
const DECISIONS_FILE = path.join(projectRoot, 'DESIGN_DECISIONS.md');
const DECISION_HEADING = /^## (DR-\d{3})\b/;
const SKIP_DIRS = new Set(['node_modules', '.git', 'dist']);

const isSpec = (f) => f.endsWith('.spec.md');
const isTest = (f) => /\.test\.tsx?$/.test(f);
const isImpl = (f) => /\.tsx?$/.test(f) && !isTest(f) && !f.endsWith('.d.ts');

function walk(dir, predicate, files = []) {
  for (const entry of fs.readdirSync(dir)) {
    const fullPath = path.join(dir, entry);
    if (fs.statSync(fullPath).isDirectory()) {
      if (!SKIP_DIRS.has(entry)) walk(fullPath, predicate, files);
    } else if (predicate(entry)) {
      files.push(fullPath);
    }
  }
  return files;
}

// Map<requirementId, Set<relative file path>> from raw file text.
function collectIdsFromFiles(files) {
  const ids = new Map();
  for (const file of files) {
    const rel = path.relative(projectRoot, file);
    const matches = fs.readFileSync(file, 'utf-8').match(REQ_REGEX) || [];
    for (const id of matches) {
      if (!ids.has(id)) ids.set(id, new Set());
      ids.get(id).add(rel);
    }
  }
  return ids;
}

// Map<requirementId, Set<decisionId>> from `## DR-NNN` sections of DESIGN_DECISIONS.md.
function collectIdsFromDecisions() {
  const byReq = new Map();
  if (!fs.existsSync(DECISIONS_FILE)) return byReq;
  let current = null;
  for (const line of fs.readFileSync(DECISIONS_FILE, 'utf-8').split('\n')) {
    const heading = line.match(DECISION_HEADING);
    if (heading) { current = heading[1]; continue; }
    if (!current) continue;
    for (const id of line.match(REQ_REGEX) || []) {
      if (!byReq.has(id)) byReq.set(id, new Set());
      byReq.get(id).add(current);
    }
  }
  return byReq;
}

function parseArgs(argv) {
  const args = { matrix: false, results: null };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--matrix') args.matrix = true;
    else if (argv[i] === '--results') args.results = argv[++i];
    else {
      console.error(`Unknown argument: ${argv[i]}`);
      process.exit(2);
    }
  }
  if (args.results !== null && !args.results) {
    console.error('--results requires a file path');
    process.exit(2);
  }
  return args;
}

// Runs the full Vitest suite with the JSON reporter and returns the parsed report.
function runVitest() {
  const outputFile = path.join(os.tmpdir(), `borderify-vitest-${process.pid}.json`);
  console.log('🧪 Running Vitest (json reporter) to collect executed test results...');
  const result = spawnSync(
    'npx',
    ['vitest', 'run', '--reporter=json', `--outputFile=${outputFile}`],
    { cwd: projectRoot, encoding: 'utf-8', shell: process.platform === 'win32' }
  );
  if (result.error) {
    console.error(`❌ Could not start Vitest: ${result.error.message}`);
    process.exit(2);
  }
  if (!fs.existsSync(outputFile)) {
    console.error('❌ Vitest produced no JSON report.');
    if (result.stderr) console.error(result.stderr);
    if (result.stdout) console.error(result.stdout);
    process.exit(2);
  }
  try {
    return JSON.parse(fs.readFileSync(outputFile, 'utf-8'));
  } finally {
    fs.rmSync(outputFile, { force: true });
  }
}

function loadResults(resultsPath) {
  const abs = path.resolve(projectRoot, resultsPath);
  if (!fs.existsSync(abs)) {
    console.error(`❌ Results file not found: ${abs}`);
    process.exit(2);
  }
  return JSON.parse(fs.readFileSync(abs, 'utf-8'));
}

// From a Vitest JSON report, build:
//   passing: Map<id, Set<"file › fullName">>   tests that ran and passed
//   other:   Map<id, Array<{ test, status }>>  tests carrying the ID that did not pass
function collectIdsFromResults(report) {
  const passing = new Map();
  const other = new Map();
  for (const fileResult of report.testResults || []) {
    const rel = path.relative(projectRoot, fileResult.name);
    for (const assertion of fileResult.assertionResults || []) {
      // fullName = ancestor describe titles + test title, so IDs in describe blocks count too.
      const ids = new Set(assertion.fullName.match(REQ_REGEX) || []);
      if (ids.size === 0) continue;
      const label = `${rel} › ${assertion.fullName}`;
      for (const id of ids) {
        if (assertion.status === 'passed') {
          if (!passing.has(id)) passing.set(id, new Set());
          passing.get(id).add(label);
        } else {
          if (!other.has(id)) other.set(id, []);
          other.get(id).push({ test: label, status: assertion.status });
        }
      }
    }
  }
  return { passing, other };
}

function verifyTraceability() {
  const args = parseArgs(process.argv.slice(2));

  const specFiles = walk(srcRoot, isSpec);
  const implFiles = walk(srcRoot, isImpl);
  const testFiles = walk(srcRoot, isTest);

  const specIds = collectIdsFromFiles(
    fs.existsSync(CONSTITUTION_FILE) ? [...specFiles, CONSTITUTION_FILE] : specFiles
  );
  const implIds = collectIdsFromFiles(implFiles);
  const testTextIds = collectIdsFromFiles(testFiles); // text scan, used only for the comment-only warning
  const decisionIds = collectIdsFromDecisions();

  const report = args.results ? loadResults(args.results) : runVitest();
  const { passing, other } = collectIdsFromResults(report);

  const reqs = [...specIds.keys()].sort();
  const executedIds = new Set([...passing.keys(), ...other.keys()]);

  const arcCount = reqs.filter((id) => id.startsWith('[ARC-')).length;
  console.log(`\n🔍 Found ${reqs.length} IDs: ${reqs.length - arcCount} requirements in ${specFiles.length} colocated spec files + ${arcCount} architectural principles in the constitution.`);
  console.log(`📂 Scanned ${implFiles.length} implementation files for tags.`);
  console.log(
    `🧪 Vitest ran ${report.numTotalTests ?? '?'} tests: ` +
    `${report.numPassedTests ?? '?'} passed, ${report.numFailedTests ?? '?'} failed, ` +
    `${report.numPendingTests ?? 0} skipped, ${report.numTodoTests ?? 0} todo.`
  );

  const missingImpl = reqs.filter((id) => !implIds.has(id));
  const missingPassingTest = reqs.filter((id) => !passing.has(id));
  const unknownImpl = [...implIds.keys()].filter((id) => !specIds.has(id)).sort();
  const unknownTest = [...executedIds].filter((id) => !specIds.has(id)).sort();
  const commentOnlyInTests = [...testTextIds.keys()].filter((id) => !executedIds.has(id)).sort();
  const unknownDecision = [...decisionIds.keys()].filter((id) => !specIds.has(id)).sort();

  if (args.matrix) {
    console.log('\nID              | Implementation                     | Passing tests                      | Decisions');
    console.log('----------------|------------------------------------|------------------------------------|----------');
    for (const id of reqs) {
      const impl = [...(implIds.get(id) || [])].join(', ') || '—';
      const tests = passing.get(id);
      const testCol = tests ? `${tests.size} passing (${[...tests].map((t) => t.split(' › ')[0]).filter((v, i, a) => a.indexOf(v) === i).join(', ')})` : '—';
      const decisions = [...(decisionIds.get(id) || [])].join(', ') || '—';
      console.log(`${id.padEnd(15)} | ${impl.padEnd(34)} | ${testCol.padEnd(34)} | ${decisions}`);
    }
  }

  // Per-pass summary: each link in the chain is reported explicitly, pass or fail.
  const mark = (ok) => (ok ? '✅' : '❌');
  const orphanCount = unknownImpl.length + unknownTest.length + unknownDecision.length;
  console.log('\nPasses:');
  console.log(`  ${mark(missingImpl.length === 0)} 1. spec → implementation: ${reqs.length - missingImpl.length}/${reqs.length} IDs tagged in a non-test source file`);
  console.log(`  ${mark(missingPassingTest.length === 0)} 2. spec → test: ${reqs.length - missingPassingTest.length}/${reqs.length} IDs carried by an executed, passing test`);
  console.log(`  ${mark(orphanCount === 0)} 3. reverse (orphans): ${orphanCount} IDs used in code, tests, or decision records that no spec declares`);

  let failed = false;
  const fail = (title, lines) => {
    if (lines.length === 0) return;
    failed = true;
    console.error(`\n❌ ${title}`);
    lines.forEach((l) => console.error(`  - ${l}`));
  };
  const warn = (title, lines) => {
    if (lines.length === 0) return;
    console.warn(`\n⚠️  ${title}`);
    lines.forEach((l) => console.warn(`  - ${l}`));
  };

  fail(
    'Requirements with no implementation tag (add `// [REQ-…]` above the satisfying function or block):',
    missingImpl
  );
  fail(
    'Requirements with no passing test (each ID must be in the title of at least one executed, passing test):',
    missingPassingTest.map((id) => {
      const nonPassing = other.get(id) || [];
      if (nonPassing.length === 0) return `${id} — no executed test carries this ID`;
      return `${id} — only non-passing tests: ${nonPassing.map((t) => `${t.test} [${t.status}]`).join('; ')}`;
    })
  );
  fail('IDs tagged in implementation code but declared in no spec:', unknownImpl);
  fail('IDs in executed test titles but declared in no spec:', unknownTest);
  fail(
    'IDs cited in DESIGN_DECISIONS.md but declared in no spec:',
    unknownDecision.map((id) => `${id} (cited by ${[...decisionIds.get(id)].join(', ')})`)
  );
  warn(
    'IDs that appear in test-file text but in no executed test title (comments do not count as coverage):',
    commentOnlyInTests.map((id) => `${id} in ${[...testTextIds.get(id)].join(', ')}`)
  );

  if (failed) {
    console.error('\n❌ Traceability Check Failed! See .specify/specify.md for the convention.\n');
    process.exit(1);
  }
  console.log(`\n✅ Traceability Check Passed! All ${reqs.length} requirement and principle IDs are tagged in implementation code and covered by a passing test.\n`);
  process.exit(0);
}

verifyTraceability();
