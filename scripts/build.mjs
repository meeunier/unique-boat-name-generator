// Builds dist/esm (ES modules) and dist/cjs (CommonJS, .cjs) with plain tsc.
import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const tsc = join('node_modules', '.bin', 'tsc');
for (const dir of ['dist/esm', 'dist/cjs']) rmSync(dir, { recursive: true, force: true });
execFileSync(tsc, ['-p', 'tsconfig.json'], { stdio: 'inherit' });
execFileSync(tsc, ['-p', 'tsconfig.json', '--module', 'CommonJS', '--moduleResolution', 'Node10',
  '--verbatimModuleSyntax', 'false', '--outDir', 'dist/cjs'], { stdio: 'inherit' });

function walk(dir) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) { walk(p); continue; }
    const fix = (s) => s.replace(/(from\s+['"]|require\(['"])(\.{1,2}\/[^'"]+)\.js(['"])/g, '$1$2.cjs$3');
    if (p.endsWith('.js')) {
      writeFileSync(p, fix(readFileSync(p, 'utf8')));
      renameSync(p, p.replace(/\.js$/, '.cjs'));
    } else if (p.endsWith('.d.ts')) {
      writeFileSync(p, fix(readFileSync(p, 'utf8')));
      renameSync(p, p.replace(/\.d\.ts$/, '.d.cts'));
    }
  }
}
walk('dist/cjs');
writeFileSync('dist/cjs/package.json', JSON.stringify({ type: 'commonjs' }) + '\n');
console.log('built dist/esm and dist/cjs');
