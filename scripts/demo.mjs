import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = new URL('../dist/web/', import.meta.url);
const base = process.argv[2] ?? '/';
if (!/^\/(?:[a-zA-Z0-9_-]+\/)*$/.test(base)) throw new TypeError('Invalid base path.');
const port = Number(process.env.PORT ?? 4173);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new RangeError('Invalid port.');
const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.md': 'text/plain', '.ttf': 'font/ttf' };
const server = createServer(async (req, res) => {
  const pathname = new URL(req.url, 'http://localhost').pathname;
  if (base !== '/' && (pathname === '/' || pathname === base.slice(0, -1))) {
    res.writeHead(302, { Location: base }).end();
    return;
  }
  const path = pathname.startsWith(base) ? pathname.slice(base.length) || 'index.html' : '';
  if (!['GET', 'HEAD'].includes(req.method) ||
      !/^(index\.html|style\.css|app\.js|lib\/[\w/.-]+\.js|fonts\/(HankenGrotesk\.ttf|OFL\.txt)|LICENSE|THIRD_PARTY_NOTICES\.md)$/.test(path) ||
      path.split('/').includes('..')) {
    res.writeHead(404).end('Not found');
    return;
  }
  try {
    const content = await readFile(fileURLToPath(new URL(path, root)));
    const extension = path.slice(path.lastIndexOf('.'));
    res.writeHead(200, { 'Content-Type': `${types[extension] ?? 'text/plain'}; charset=utf-8`, 'Cache-Control': 'no-store' });
    res.end(req.method === 'HEAD' ? undefined : content);
  } catch {
    res.writeHead(404).end('Not found');
  }
});
server.listen(port, '127.0.0.1', () => console.log(`Boat name generator: http://127.0.0.1:${port}${base}`));
