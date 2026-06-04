import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../..');

// EARS Patterns (regex checks on requirement content)
const EARS_PATTERNS = [
  {
    name: 'Ubiquitous',
    // e.g. "The system shall load..."
    regex: /^The (?:system|app) shall/i
  },
  {
    name: 'Event-Driven',
    // e.g. "When a user selects..., the system shall..."
    regex: /^When .+, the (?:system|app) shall/i
  },
  {
    name: 'State-Driven',
    // e.g. "While batch export is active, the system shall..."
    regex: /^While .+, the (?:system|app) shall/i
  },
  {
    name: 'Unwanted Behavior',
    // e.g. "If an image is corrupt, then the system shall..."
    regex: /^If .+, then the (?:system|app) shall/i
  },
  {
    name: 'Optional',
    // e.g. "Where image scale limits are set, the system shall..."
    regex: /^Where .+, the (?:system|app) shall/i
  }
];

function lintSpecs() {
  const specPath = path.join(projectRoot, '.specify/specify.md');
  const content = fs.readFileSync(specPath, 'utf-8');
  const lines = content.split('\n');

  console.log(`\n🔍 Linting EARS requirements in specify.md...`);

  let errorCount = 0;
  let successCount = 0;

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    // Matches markdown list item with requirement tag: e.g. * **[REQ-EXIF-01]** The system shall...
    // or * [REQ-EXIF-01] The system shall...
    const reqMatch = trimmed.match(/^\*\s+(?:\*\*|)?(\[REQ-[A-Z]+-\d+\])(?:\*\*|)?\s+(.+)$/i);
    
    if (reqMatch) {
      const id = reqMatch[1];
      const reqText = reqMatch[2].trim();
      
      let matchedPattern = null;
      for (const pattern of EARS_PATTERNS) {
        if (pattern.regex.test(reqText)) {
          matchedPattern = pattern.name;
          break;
        }
      }

      if (matchedPattern) {
        successCount++;
      } else {
        errorCount++;
        console.error(`❌ Line ${index + 1}: Requirement ${id} violates EARS syntax rules!`);
        console.error(`   Content: "${reqText}"`);
        console.error(`   Expected one of the following patterns:`);
        console.error(`     - Ubiquitous: "The system shall [action]"`);
        console.error(`     - Event-Driven: "When [trigger], the system shall [action]"`);
        console.error(`     - State-Driven: "While [state], the system shall [action]"`);
        console.error(`     - Unwanted Behavior: "If [condition], then the system shall [action]"`);
        console.error(`     - Optional: "Where [feature is enabled], the system shall [action]"\n`);
      }
    }
  });

  if (errorCount > 0) {
    console.error(`❌ Spec Lint Failed! Found ${errorCount} invalid EARS requirement(s).\n`);
    process.exit(1);
  } else {
    console.log(`✅ Spec Lint Passed! All ${successCount} requirements successfully matched EARS patterns.\n`);
    process.exit(0);
  }
}

lintSpecs();
