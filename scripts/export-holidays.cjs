// Writes holidays.json (the online holiday list the app downloads) from src/data/holidays-2026.ts.
// Edit the online list directly for moon-sighting changes and special closures; run this only to reset it to the
// bundled schedule. Usage: node scripts/export-holidays.cjs
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'src/data/holidays-2026.ts'), 'utf8');
const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const loaded = { exports: {} };
new Function("module", "exports", js)(loaded, loaded.exports); // the repo's own data file, as in check-calendar.cjs
const holidays = loaded.exports.holidays2026.map(({ date, name, scope, kind, subjectToMoon }) => ({ date, name, scope, kind, ...(subjectToMoon ? { subjectToMoon: true } : {}) }));
const list = { app: 'jk-calendar', updated: new Date().toISOString().slice(0, 10), note: 'Edit dates here after a GAD order; phones update within hours. subjectToMoon marks Islamic holidays that depend on moon sighting.', holidays };
fs.writeFileSync(path.join(root, 'holidays.json'), JSON.stringify(list, null, 2) + '\n');
console.log(`Wrote holidays.json with ${holidays.length} holidays (${holidays.filter(h => h.subjectToMoon).length} subject to moon sighting).`);
