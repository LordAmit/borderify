// Commit-message traceability check.
//
// A commit that changes anything under `src/` must reference at least one declared ID
// in bracketed form — `[REQ-AREA-NN]` or `[ARC-NN]` — in its subject or body, or carry
// `[NO-REQ]` (a src/ change with no requirement impact; the body must say why).
// Referenced IDs must be declared in a spec or the constitution at that commit or its
// parent, so a commit that removes a requirement may still cite it.
//
// Usage:
//   node .specify/scripts/check-commit-ids.js <rev-range>        CI: check every non-merge commit in the range
//   node .specify/scripts/check-commit-ids.js --message <file>   commit-msg hook: check one message against staged files
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

const git = (...args) => execFileSync('git', args, { cwd: projectRoot, encoding: 'utf-8' }).trim();
const isDeclaringFile = (f) => (f.startsWith('src/') && f.endsWith('.spec.md')) || f === CONSTITUTION;

// IDs declared by spec files + constitution at a git revision (empty set if the revision does not exist).
function declaredIdsAt(rev) {
  const ids = new Set();
  let files;
  try { files = git('ls-tree', '-r', '--name-only', rev).split('\n'); } catch { return ids; }
  for (const f of files.filter(isDeclaringFile)) {
    let content;
    try { content = git('show', `${rev}:${f}`); } catch { continue; }
    for (const id of content.match(ID_REGEX) || []) ids.add(id);
  }
  return ids;
}

// IDs declared in the working tree (used by the commit-msg hook, where the commit does not exist yet).
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

function union(...sets) { return new Set(sets.flatMap((s) => [...s])); }

// Returns { ids, problems, warnings } for one commit message + its changed files.
function checkMessage(message, changedFiles, declared) {
  const touchesSrc = changedFiles.some((f) => f.startsWith('src/'));
  const ids = [...new Set(message.match(ID_REGEX) || [])];
  const noReq = message.includes(NO_REQ);
  const problems = [];
  const warnings = [];
  if (touchesSrc && ids.length === 0 && !noReq) {
    problems.push(`changes src/ but references no [REQ-…]/[ARC-…] ID (or ${NO_REQ} with a reason in the body)`);
  }
  if (noReq && ids.length > 0) problems.push(`uses ${NO_REQ} together with IDs; use one or the other`);
  if (noReq && ids.length === 0) warnings.push(`${NO_REQ}: declared as having no requirement impact`);
  const unknown = ids.filter((id) => !declared.has(id));
  if (unknown.length > 0) problems.push(`references IDs declared in no spec: ${unknown.join(', ')}`);
  return { ids, problems, warnings, touchesSrc };
}

function report(label, result) {
  const idText = result.ids.length ? result.ids.join(' ') : (result.touchesSrc ? '(no IDs)' : '(no src/ change)');
  if (result.problems.length === 0) {
    console.log(`✅ ${label} — ${idText}`);
  } else {
    console.error(`❌ ${label} — ${idText}`);
    result.problems.forEach((p) => console.error(`     ${p}`));
  }
  result.warnings.forEach((w) => console.warn(`   ⚠️  ${w}`));
  return result.problems.length === 0;
}

function checkRange(range) {
  let shas;
  try { shas = git('rev-list', '--no-merges', '--reverse', range).split('\n').filter(Boolean); }
  catch (e) { console.error(`❌ Cannot resolve range "${range}": ${e.message.split('\n')[0]}`); process.exit(2); }
  console.log(`\n🔍 Checking ${shas.length} commit(s) in ${range} for requirement-ID references...\n`);
  let ok = true;
  for (const sha of shas) {
    const message = git('log', '-1', '--format=%B', sha);
    const subject = git('log', '-1', '--format=%s', sha);
    const files = git('diff-tree', '--no-commit-id', '--name-only', '-r', '--root', sha).split('\n').filter(Boolean);
    const declared = union(declaredIdsAt(sha), declaredIdsAt(`${sha}^`));
    ok = report(`${sha.slice(0, 8)} ${subject}`, checkMessage(message, files, declared)) && ok;
  }
  console.log(ok ? '\n✅ Commit traceability check passed.\n' : '\n❌ Commit traceability check failed. See .specify/specify.md, "Commit message convention".\n');
  process.exit(ok ? 0 : 1);
}

function checkMessageFile(file) {
  if (!file || !fs.existsSync(file)) { console.error('❌ --message requires a readable file path'); process.exit(2); }
  // Drop comment lines and everything after a scissors line, as git itself does.
  const raw = fs.readFileSync(file, 'utf-8');
  const message = raw.split('\n').reduce((acc, line) => {
    if (acc.done) return acc;
    if (/^# -{8,} >8 -{8,}$/.test(line)) return { ...acc, done: true };
    if (!line.startsWith('#')) acc.lines.push(line);
    return acc;
  }, { lines: [], done: false }).lines.join('\n');
  const staged = git('diff', '--cached', '--name-only').split('\n').filter(Boolean);
  const declared = union(declaredIdsInWorkingTree(), declaredIdsAt('HEAD'));
  const ok = report('commit message', checkMessage(message, staged, declared));
  if (!ok) console.error('\nSee .specify/specify.md, "Commit message convention". Retry with an ID in the message, e.g. `fix(render): … [REQ-REND-06]`.\n');
  process.exit(ok ? 0 : 1);
}

const argv = process.argv.slice(2);
if (argv[0] === '--message') checkMessageFile(argv[1]);
else if (argv.length === 1 && !argv[0].startsWith('--')) checkRange(argv[0]);
else { console.error('Usage: check-commit-ids.js <rev-range> | --message <file>'); process.exit(2); }
