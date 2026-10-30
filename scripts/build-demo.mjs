import { copyFile, cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const output = new URL('dist/web/', root);
const base = process.argv[2] ?? '/';
if (!/^\/(?:[a-zA-Z0-9_-]+\/)*$/.test(base)) {
  throw new TypeError('The base path must start and end with a slash, for example /boat-names/.');
}

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
const html = await readFile(new URL('examples/web/index.html', root), 'utf8');
await writeFile(new URL('index.html', output), html.replace('<head>', `<head>\n    <base href="${base}">`));
for (const file of ['app.js', 'style.css']) {
  await copyFile(new URL(`examples/web/${file}`, root), new URL(file, output));
}
await cp(new URL('examples/web/fonts/', root), new URL('fonts/', output), { recursive: true });
await cp(new URL('dist/esm/', root), new URL('lib/', output), {
  recursive: true,
  filter: (source) => !source.endsWith('.d.ts'),
});
for (const file of ['LICENSE', 'THIRD_PARTY_NOTICES.md']) {
  await copyFile(new URL(file, root), new URL(file, output));
}
console.log(`Built static demo in dist/web for ${base}`);
