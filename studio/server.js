const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const root = __dirname;
const projectPath = path.join(root, 'project.json');
const port = Number(process.env.PORT || 4173);
const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml' };

function send(res, status, body, type = 'application/json; charset=utf-8') {
  res.writeHead(status, { 'Content-Type': type, 'Cache-Control': 'no-store', 'Access-Control-Allow-Origin': '*' });
  res.end(body);
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  if (req.method === 'OPTIONS') { res.writeHead(204, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET,PUT,POST,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' }); return res.end(); }

  if (url.pathname === '/api/project' && req.method === 'GET') return send(res, 200, fs.readFileSync(projectPath, 'utf8'));
  if (url.pathname === '/api/project' && req.method === 'PUT') {
    let body = ''; req.setEncoding('utf8'); req.on('data', chunk => body += chunk);
    req.on('end', () => { try { const data = JSON.parse(body); fs.writeFileSync(projectPath, JSON.stringify(data, null, 2) + '\n'); send(res, 200, JSON.stringify({ ok: true })); } catch (error) { send(res, 400, JSON.stringify({ error: error.message })); } });
    return;
  }
  if (url.pathname === '/api/assets' && req.method === 'GET') {
    const folder = path.resolve(root, '../01_source');
    const files = [];
    const walk = dir => { for (const entry of fs.readdirSync(dir, { withFileTypes: true })) { const full = path.join(dir, entry.name); if (entry.isDirectory()) walk(full); else if (/\.(png|jpe?g|webp)$/i.test(entry.name)) files.push(path.relative(folder, full).split(path.sep).join('/')); } };
    walk(folder); return send(res, 200, JSON.stringify(files));
  }
  if (url.pathname === '/api/upload' && req.method === 'POST') {
    const filename = path.basename(decodeURIComponent(url.searchParams.get('name') || 'asset.png')).replace(/[^a-zA-Z0-9_.-]/g, '_');
    if (!/\.(png|jpe?g|webp)$/i.test(filename)) return send(res, 415, JSON.stringify({ error: 'Nur PNG, JPG und WEBP werden angenommen.' }));
    const outDir = path.resolve(root, '../01_source/inbox'); fs.mkdirSync(outDir, { recursive: true });
    const stream = fs.createWriteStream(path.join(outDir, filename)); req.pipe(stream);
    stream.on('finish', () => send(res, 201, JSON.stringify({ ok: true, name: `inbox/${filename}` })));
    stream.on('error', error => send(res, 500, JSON.stringify({ error: error.message })));
    return;
  }

  const assetPrefix = '/assets/';
  if (url.pathname.startsWith(assetPrefix)) {
    const folder = path.resolve(root, '../01_source');
    const file = path.resolve(folder, decodeURIComponent(url.pathname.slice(assetPrefix.length)));
    if (!file.startsWith(folder + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) return send(res, 404, 'Not found', 'text/plain');
    res.writeHead(200, { 'Content-Type': mime[path.extname(file).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-store' }); return fs.createReadStream(file).pipe(res);
  }

  const relative = url.pathname === '/' ? 'index.html' : decodeURIComponent(url.pathname.slice(1));
  const file = path.resolve(root, relative);
  if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) return send(res, 404, 'Not found', 'text/plain');
  res.writeHead(200, { 'Content-Type': mime[path.extname(file).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-store' }); fs.createReadStream(file).pipe(res);
});

server.listen(port, '127.0.0.1', () => console.log(`Slot Animation Studio: http://127.0.0.1:${port}`));
