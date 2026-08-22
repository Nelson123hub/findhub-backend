const http = require('http');
const fs = require('fs');
const path = require('path');
const apiHandler = require('./api/index.js');

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
};

function serveStatic(req, res) {
  let urlPath = req.url.split('?')[0];
  if (urlPath === '/') urlPath = '/index.html';

  // clean URLs: /dashboard -> /dashboard.html, /login -> /login.html
  if (!path.extname(urlPath)) {
    urlPath += '.html';
  }

  const filePath = path.join(ROOT, urlPath);

  // prevent path traversal outside project root
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403);
    return res.end('Forbidden');
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      return res.end('Not found');
    }
    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
    res.end(data);
  });
}

const server = http.createServer(async (req, res) => {
  if (req.url.startsWith('/api/')) {
    // mimic Vercel's ?path=$1 rewrite so the handler's routing logic keeps working
    const suffix = req.url.replace(/^\/api\//, '').split('?')[0];
    req.query = { path: suffix };
    return apiHandler(req, res);
  }
  return serveStatic(req, res);
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
