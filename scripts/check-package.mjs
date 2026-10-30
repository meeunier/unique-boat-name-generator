import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const temporary = mkdtempSync(join(tmpdir(), 'boat-name-package-'));
const consumer = join(temporary, 'consumer');
const env = { ...process.env, npm_config_cache: join(temporary, 'npm-cache') };
function run(command, args, cwd = root) {
  return execFileSync(command, args, { cwd, env, encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] });
}

try {
  const [pack] = JSON.parse(run('npm', ['pack', '--json', '--ignore-scripts', '--pack-destination', temporary]));
  const files = pack.files.map((file) => file.path);
  for (const path of ['dist/esm/index.js', 'dist/esm/index.d.ts', 'dist/cjs/index.cjs', 'dist/cjs/index.d.cts', 'LICENSE', 'THIRD_PARTY_NOTICES.md']) {
    assert.ok(files.includes(path), `Missing packaged file: ${path}`);
  }
  assert.ok(!files.some((path) => /^(src|test|research|examples|scripts|dist\/web)\//.test(path)), 'Development files must stay out of the package');
  mkdirSync(consumer);
  writeFileSync(join(consumer, 'package.json'), JSON.stringify({ name: 'package-consumer', private: true, type: 'module' }));
  run('npm', ['install', '--ignore-scripts', '--offline', '--no-audit', '--no-fund', '--package-lock=false', join(temporary, pack.filename)], consumer);

  const checks = `
const boat = api.generateBoatName({ seed: 'package-check' });
assert.equal(typeof boat.display, 'string');
assert.equal(boat.username, api.toUsername(boat.display));
assert.deepEqual(boat, api.generateName({ seed: 'package-check' }));
const username = api.generateUsername({ seed: 'package-check' });
assert.equal(typeof username, 'string');
assert.match(username, /^[a-z0-9]+(?:_[a-z0-9]+)*_[1-9]\\d{3}$/);
assert.equal(api.usernameStream({ seed: 'package-check' }).next().value, username);
assert.equal(await api.claimUsername(() => true, { seed: 'package-check' }), username);
assert.equal(api.usernameCapacity(), api.USERNAME_BASES.length * 9000);
const batch = api.generateUsernames(100, { seed: 'package-check' });
assert.equal(new Set(batch).size, 100);
assert.equal((await api.claimBoatName(() => true)).source === 'character', false);
`;
  writeFileSync(join(consumer, 'esm.mjs'), `import assert from 'node:assert/strict';\nimport * as api from 'unique-boat-name-generator';\n${checks}`);
  writeFileSync(join(consumer, 'commonjs.cjs'), `const assert = require('node:assert/strict');\nconst api = require('unique-boat-name-generator');\n(async () => { ${checks} })().catch(error => { console.error(error); process.exitCode = 1; });`);
  run(process.execPath, ['esm.mjs'], consumer);
  run(process.execPath, ['commonjs.cjs'], consumer);

  const types = `
import {
  generateBoatName, generateUsername, generateUsernames, usernameStream,
  claimUsername, claimBoatName, type BoatName, type Username,
} from 'unique-boat-name-generator';
const boat: BoatName = generateBoatName();
const username: Username = generateUsername();
const names: string[] = generateUsernames(2);
const reservedUser: Promise<string> = claimUsername(candidate => candidate.length > 0);
const reservedBoat: Promise<BoatName> = claimBoatName(candidate => candidate.username.length > 0);
const item: IteratorResult<string, void> = usernameStream().next();
// @ts-expect-error Usernames have no display-name object.
generateUsername().display;
// @ts-expect-error Username suffixes are fixed by the package.
generateUsername({ suffix: false });
`;
  for (const extension of ['mts', 'cts']) writeFileSync(join(consumer, `types.${extension}`), types);
  run(process.execPath, [join(root, 'node_modules/typescript/bin/tsc'), '--strict', '--noEmit', '--target', 'ES2019', '--module', 'NodeNext', '--moduleResolution', 'NodeNext', 'types.mts', 'types.cts'], consumer);
  console.log(`Package checked: ${pack.name}@${pack.version}; ${files.length} files. ESM, CommonJS and TypeScript imports pass.`);
} finally {
  rmSync(temporary, { recursive: true, force: true });
}
