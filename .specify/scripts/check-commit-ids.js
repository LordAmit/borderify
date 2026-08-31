// Commit-message traceability check.
//
// Rule 1 — IDs in messages. A commit that changes anything under `src/` must reference at
//   least one declared ID in bracketed form — `[REQ-AREA-NN]` or `[ARC-NN]` — in its subject
//   or body, or carry `[NO-REQ]` (a src/ change with no requirement impact; the body says why).
//   Referenced IDs must be declared in a spec or the constitution at that commit or its parent,
//   so a commit that removes a requirement may still cite it.
//
// Rule 2 — bug-fix discipline. A commit whose subject uses the `fix` type (`fix: …`,
//   `fix(scope): …`) and changes `src/` must cite IDs (no `[NO-REQ]`), and the change set
//   under review must ADD, for every cited ID, (a) a spec line carrying the ID and (b) a test
//   title carrying the ID. The change set is the whole push/PR range in CI, or the current
//   branch plus staged changes in the commit-msg hook, so spec, test, and fix may be separate
//   commits. Each failure becomes a requirement (usually an EARS Unwanted Behavior line,
//   "If <condition>, then the system shall <response>") with a test, not only a patch.
//
// Usage:
//   node .specify/scripts/check-commit-ids.js <base>..<head>   CI: check every non-merge commit in the range
//   node .specify/scripts/check-commit-ids.js --message <file>  commit-msg hook: check one message against staged files
//
// Exit codes: 0 pass, 1 a commit violates the convention, 2 usage error.

import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const ID_REGEX = /\[(?:REQ-[A-Z]+|ARC)-\d+\]/g;
const NO_REQ = '[NO-REQ]';
const CONSTITUTION = '.specify/memory/constitution.md';
const FIX_SUBJECT = /^fix(\([^)]*\))?!?:/i;
const UNWANTED_BEHAVIOR = /^\*\s+(?:\*\*)?\[(?:REQ-[A-Z]+|ARC)-\d+\](?:\*\*)?\s+If .+, then the (?:system|app) shall/i;

const git = (...args) => execFileSync('git', args, { cwd: projectRoot, encoding: 'utf-8' }).trim();
const tryGit = (...args) => { try { return git(...args); } catch { return null; } };
const isDeclaringFile = (f) => (f.startsWith('src/') && f.endsWith('.spec.md')) || f === CONSTITUTION;
const isTestFile = (f) => f.startsWith('src/') && /\.test\.tsx?$/.test(f);
const isSrc = (f) => f.startsWith('src/');

// ---------- declared IDs ----------

function declaredIdsAt(rev) {
  const ids = new Set();
  const files = tryGit('ls-tree', '-r', '--name-only', rev);
  if (files === null) return ids;
  for (const f of files.split('\n').filter(isDeclaringFile)) {
    const content = tryGit('show', `${rev}:${f}`);
    if (content === null) continue;
    for (const id of content.match(ID_REGEX) || []) ids.add(id);
  }
  return ids;
}

function declaredIdsInWorkingTree() {
  const ids = new Set();
  const files = git('ls-files', '--cached', '--others', '--exclude-standard', 'src', '.specify/memory').split('\n');
  for (const f of files.filter(isDeclaringFile)) {
    const abs = path.join(projectRoot, f);
    if (!fs.existsSync(abs)) continue;
    for (const id of fs.readFileSync(abs, 'utf-8').match(ID_REGEX) || []) ids.add(id);
  }
  return ids;
}

const union = (...sets) => new Set(sets.flatMap((s) => [...s]));

// ---------- added lines in a diff ----------

// From unified diff text, collect IDs on ADDED lines, split by spec files and test files.
// Returns { spec: Map<id, {files:Set, unwanted:boolean}>, test: Map<id, Set<file>> }.
function addedIdsInDiff(diffText) {
  const spec = new Map();
  const test = new Map();
  let file = null;
  for (const line of diffText.split('\n')) {
    if (line.startsWith('+++ ')) { file = line.startsWith('+++ b/') ? line.slice(6) : null; continue; }
    if (!file || !line.startsWith('+') || line.startsWith('+++')) continue;
    const added = line.slice(1);
    const ids = added.match(ID_REGEX) || [];
    if (ids.length === 0) continue;
    if (isDeclaringFile(file)) {
      for (const id of ids) {
        if (!spec.has(id)) spec.set(id, { files: new Set(), unwanted: false });
        spec.get(id).files.add(file);
        if (UNWANTED_BEHAVIOR.test(added.trim())) spec.get(id).unwanted = true;
      }
    } else if (isTestFile(file)) {
      // Only test *titles* count: it('[ID] …'), test('[ID] …'), describe('[ID] …').
      if (!/\b(?:it|test|describe)(?:\.\w+)*\(\s*['"`][^'"`]*\[(?:REQ-[A-Z]+|ARC)-\d+\]/.test(added)) continue;
      for (const id of ids) {
        if (!test.has(id)) test.set(id, new Set());
        test.get(id).add(file);
      }
    }
  }
  return { spec, test };
}

// ---------- per-commit evaluation ----------

function checkMessage(message, subject, changedFiles, declared, added) {
  const touchesSrc = changedFiles.some(isSrc);
  const ids = [...new Set(message.match(ID_REGEX) || [])];
  const noReq = message.includes(NO_REQ);
  const isFix = FIX_SUBJECT.test(subject);
  const problems = [];
  const warnings = [];

  // Rule 1
  if (touchesSrc && ids.length === 0 && !noReq) {
    problems.push(`changes src/ but references no [REQ-…]/[ARC-…] ID (or ${NO_REQ} with a reason in the body)`);
  }
  if (noReq && ids.length > 0) problems.push(`uses ${NO_REQ} together with IDs; use one or the other`);
  if (noReq && ids.length === 0) warnings.push(`${NO_REQ}: declared as having no requirement impact`);
  const unknown = ids.filter((id) => !declared.has(id));
  if (unknown.length > 0) problems.push(`references IDs declared in no spec: ${unknown.join(', ')}`);

  // Rule 2
  if (isFix && touchesSrc) {
    if (noReq) problems.push(`a fix that changes src/ cannot use ${NO_REQ}; cite the requirement it restores or adds`);
    for (const id of ids) {
      const specHit = added.spec.get(id);
      const testHit = added.test.get(id);
      if (!specHit) problems.push(`fix cites ${id} but this change set adds no spec line carrying it (add an EARS line, usually Unwanted Behavior: "If …, then the system shall …")`);
      if (!testHit) problems.push(`fix cites ${id} but this change set adds no test whose title carries it`);
      if (specHit && !specHit.unwanted) warnings.push(`spec change for ${id} is not an Unwanted Behavior line; fine if the fix restores an existing requirement, otherwise state the failure condition as "If …, then the system shall …"`);
    }
  }
  return { ids, problems, warnings, touchesSrc, isFix };
}

function report(label, result) {
  const tag = result.isFix ? ' [fix]' : '';
  const idText = result.ids.length ? result.ids.join(' ') : (result.touchesSrc ? '(no IDs)' : '(no src/ change)');
  if (result.problems.length === 0) {
    console.log(`✅ ${label}${tag} — ${idText}`);
  } else {
    console.error(`❌ ${label}${tag} — ${idText}`);
    result.problems.forEach((p) => console.error(`     ${p}`));
  }
  result.warnings.forEach((w) => console.warn(`   ⚠️  ${w}`));
  return result.problems.length === 0;
}

// ---------- modes ----------

function parseRange(range) {
  let base, head;
  if (range.includes('...')) { [base, head] = range.split('...'); base = git('merge-base', base, head || 'HEAD'); }
  else if (range.includes('..')) { [base, head] = range.split('..'); }
  else { console.error(`❌ Range must be <base>..<head>, got "${range}"`); process.exit(2); }
  head = head || 'HEAD';
  const baseSha = tryGit('rev-parse', '--verify', `${base}^{commit}`);
  const headSha = tryGit('rev-parse', '--verify', `${head}^{commit}`);
  if (!baseSha || !headSha) { console.error(`❌ Cannot resolve range "${range}"`); process.exit(2); }
  return { baseSha, headSha, label: range };
}

function checkRange(range) {
  const { baseSha, headSha, label } = parseRange(range);
  const shas = git('rev-list', '--no-merges', '--reverse', `${baseSha}..${headSha}`).split('\n').filter(Boolean);
  const added = addedIdsInDiff(git('diff', '--unified=0', baseSha, headSha, '--', 'src', CONSTITUTION));
  console.log(`\n🔍 Checking ${shas.length} commit(s) in ${label} for requirement-ID references and bug-fix discipline...\n`);
  let ok = true;
  for (const sha of shas) {
    const message = git('log', '-1', '--format=%B', sha);
    const subject = git('log', '-1', '--format=%s', sha);
    const files = git('diff-tree', '--no-commit-id', '--name-only', '-r', '--root', sha).split('\n').filter(Boolean);
    const declared = union(declaredIdsAt(sha), declaredIdsAt(`${sha}^`));
    ok = report(`${sha.slice(0, 8)} ${subject}`, checkMessage(message, subject, files, declared, added)) && ok;
  }
  console.log(ok ? '\n✅ Commit traceability check passed.\n' : '\n❌ Commit traceability check failed. See .specify/specify.md, "Commit message convention".\n');
  process.exit(ok ? 0 : 1);
}

function checkMessageFile(file) {
  if (!file || !fs.existsSync(file)) { console.error('❌ --message requires a readable file path'); process.exit(2); }
  const raw = fs.readFileSync(file, 'utf-8');
  const lines = [];
  for (const line of raw.split('\n')) {
    if (/^# -{8,} >8 -{8,}$/.test(line)) break; // scissors
    if (!line.startsWith('#')) lines.push(line);
  }
  const message = lines.join('\n').trim();
  const subject = (lines.find((l) => l.trim() !== '') || '').trim();
  const staged = git('diff', '--cached', '--name-only').split('\n').filter(Boolean);
  const declared = union(declaredIdsInWorkingTree(), declaredIdsAt('HEAD'));
  // Change set = this branch since it left its upstream (or origin/main), plus what is staged now.
  const upstream = tryGit('rev-parse', '--verify', '--quiet', '@{upstream}') || tryGit('rev-parse', '--verify', '--quiet', 'origin/main');
  const base = (upstream && tryGit('merge-base', upstream, 'HEAD')) || (tryGit('rev-parse', '--verify', '--quiet', 'HEAD') || null);
  const diffText = base ? git('diff', '--cached', '--unified=0', base, '--', 'src', CONSTITUTION) : '';
  const ok = report('commit message', checkMessage(message, subject, staged, declared, addedIdsInDiff(diffText)));
  if (!ok) console.error('\nSee .specify/specify.md, "Commit message convention". Example: `fix(render): … [REQ-REND-06]` with the spec line and test added on this branch.\n');
  process.exit(ok ? 0 : 1);
}

const argv = process.argv.slice(2);
if (argv[0] === '--message') checkMessageFile(argv[1]);
else if (argv.length === 1 && !argv[0].startsWith('--')) checkRange(argv[0]);
else { console.error('Usage: check-commit-ids.js <base>..<head> | --message <file>'); process.exit(2); }
