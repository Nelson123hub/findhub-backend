const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');
const UPLOAD_DIR = path.join(ROOT, 'uploads');

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
  '.svg': 'image/svg+xml'
};

const seedItems = [
  {
    id: 1,
    type: 'lost',
    title: 'iPhone 14 Pro - Space Black',
    category: 'Electronics',
    location: 'Lecture Theatre 1, Bosso Campus',
    date: '2026-06-25',
    description: 'Lost my iPhone 14 Pro in Space Black color. Has a purple case with FUTMINNA sticker on the back.',
    images: ['https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=400&h=300&fit=crop'],
    status: 'matched',
    reporter: 'nelson.m2834567@st.futminna.edu.ng',
    contact: '08012345678',
    securityQuestions: [
      { question: 'What is the exact color of the phone case?', answer: 'Purple' },
      { question: 'What sticker is on the back of the case?', answer: 'FUTMINNA' }
    ]
  },
  {
    id: 2,
    type: 'found',
    title: 'Student ID Card - 2023/1/12345AB',
    category: 'ID Cards',
    location: 'School Library, Main Campus',
    date: '2026-06-27',
    description: 'Found a student ID card on the reading table at the school library second floor.',
    images: ['https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=400&h=300&fit=crop'],
    status: 'under_review',
    reporter: 'admin@futminna.edu.ng',
    contact: '08098765432'
  },
  {
    id: 3,
    type: 'lost',
    title: 'Laptop Bag - Black Dell',
    category: 'Bags',
    location: 'Cafeteria, Main Campus',
    date: '2026-06-28',
    description: 'Black Dell laptop bag containing a charger and notebooks.',
    images: ['https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=300&fit=crop'],
    status: 'reported',
    reporter: 'nelson.m2834567@st.futminna.edu.ng',
    contact: '08012345678'
  },
  {
    id: 4,
    type: 'found',
    title: 'Wallet - Brown Leather',
    category: 'Wallets',
    location: 'Student Center, Bosso Campus',
    date: '2026-06-26',
    description: 'Brown leather wallet found near the student center entrance.',
    images: ['https://images.unsplash.com/photo-1627123424574-724758594e93?w=400&h=300&fit=crop'],
    status: 'claim_initiated',
    reporter: 'admin@futminna.edu.ng',
    contact: '08098765432',
    claimant: 'nelson.m2834567@st.futminna.edu.ng',
    claim: {
      fullName: 'Nelson M.',
      matric: '2023/1/34567CF',
      phone: '08012345678',
      description: 'I can identify the contents of the wallet.'
    }
  }
];

const seedNotifications = [
  {
    id: 1,
    userEmail: 'nelson.m2834567@st.futminna.edu.ng',
    type: 'match',
    title: 'Potential Match Found!',
    message: 'Your iPhone 14 Pro report may have a match. Review the details to initiate a claim.',
    time: '2 hours ago',
    read: false
  },
  {
    id: 2,
    userEmail: 'nelson.m2834567@st.futminna.edu.ng',
    type: 'info',
    title: 'Welcome to FindHub',
    message: 'You can now report lost and found items from your dashboard.',
    time: '1 day ago',
    read: true
  }
];

function ensureStorage() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  if (!fs.existsSync(DB_FILE)) {
    writeDb({
      users: [
        createUser({ email: 'nelson.m2834567@st.futminna.edu.ng', password: 'demo123', firstName: 'Nelson', lastName: 'M.', role: 'student', matric: '2023/1/34567CF', department: 'Information Technology', phone: '08012345678', verified: true }),
        createUser({ email: 'admin@futminna.edu.ng', password: 'admin123', firstName: 'System', lastName: 'Admin', role: 'admin', matric: 'ADMIN001', department: 'ICT Directorate', phone: '08098765432', verified: true })
      ],
      items: seedItems,
      notifications: seedNotifications,
      pendingRegistrations: [],
      sessions: []
    });
  }
}

function readDb() {
  ensureStorage();
  return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
}

function writeDb(db) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

function hashPassword(password, salt) {
  return crypto.createHash('sha256').update(salt + ':' + password).digest('hex');
}

function base64Url(input) {
  return Buffer.from(JSON.stringify(input)).toString('base64url');
}

function getJwtSecret() {
  return process.env.JWT_SECRET || 'local-dev-findhub-secret-change-before-production';
}

function signJwt(payload, expiresInSeconds = 60 * 60 * 24 * 7) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const body = { ...payload, iat: now, exp: now + expiresInSeconds };
  const unsigned = base64Url(header) + '.' + base64Url(body);
  const signature = crypto.createHmac('sha256', getJwtSecret()).update(unsigned).digest('base64url');
  return unsigned + '.' + signature;
}

function verifyJwt(token) {
  const parts = String(token || '').split('.');
  if (parts.length !== 3) return null;
  const unsigned = parts[0] + '.' + parts[1];
  const expected = crypto.createHmac('sha256', getJwtSecret()).update(unsigned).digest('base64url');
  if (!crypto.timingSafeEqual(Buffer.from(parts[2]), Buffer.from(expected))) return null;
  const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
  if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
  return payload;
}

function sendOtpEmail(email, otp) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || 'FUTMINNA FindHub <onboarding@resend.dev>';
  if (!apiKey || typeof fetch !== 'function') {
    return Promise.resolve({ sent: false });
  }

  return fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + apiKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from,
      to: email,
      subject: 'Your FUTMINNA FindHub verification code',
      html: '<p>Your FUTMINNA FindHub verification code is:</p><h2>' + otp + '</h2><p>This code expires soon. If you did not request it, ignore this email.</p>'
    })
  }).then(async response => ({ sent: response.ok, status: response.status })).catch(() => ({ sent: false }));
}

function createUser(input) {
  const salt = crypto.randomBytes(16).toString('hex');
  return {
    id: crypto.randomUUID(),
    email: String(input.email).toLowerCase(),
    passwordHash: hashPassword(String(input.password), salt),
    salt,
    firstName: input.firstName,
    lastName: input.lastName,
    name: String(input.firstName + ' ' + input.lastName).trim(),
    role: input.role || 'student',
    matric: input.matric,
    department: input.department,
    phone: input.phone,
    verified: Boolean(input.verified),
    createdAt: new Date().toISOString()
  };
}

function publicUser(user) {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    name: user.name,
    role: user.role,
    matric: user.matric,
    department: user.department,
    phone: user.phone
  };
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  };
}

function sendJson(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders() });
  res.end(JSON.stringify(data));
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 15 * 1024 * 1024) reject(new Error('Request body too large'));
    });
    req.on('end', () => {
      if (!body) return resolve({});
      try { resolve(JSON.parse(body)); } catch { reject(new Error('Invalid JSON body')); }
    });
  });
}

function authUser(req, db) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  const payload = verifyJwt(token);
  return payload ? db.users.find(u => u.email === payload.email) : null;
}

function requireAuth(req, res, db) {
  const user = authUser(req, db);
  if (!user) sendJson(res, 401, { error: 'Please login to continue' });
  return user;
}

function saveImages(images, prefix) {
  if (!Array.isArray(images)) return [];
  return images.slice(0, 5).map((image, index) => {
    if (typeof image !== 'string') return null;
    if (!image.startsWith('data:image/')) return image;
    const match = image.match(/^data:image\/(png|jpeg|jpg|webp);base64,(.+)$/);
    if (!match) return null;
    const ext = match[1] === 'jpeg' ? 'jpg' : match[1];
    const filename = prefix + '-' + Date.now() + '-' + index + '.' + ext;
    fs.writeFileSync(path.join(UPLOAD_DIR, filename), Buffer.from(match[2], 'base64'));
    return '/uploads/' + filename;
  }).filter(Boolean);
}

function addNotification(db, userEmail, data) {
  if (!userEmail) return;
  db.notifications.unshift({
    id: Date.now() + Math.floor(Math.random() * 1000),
    userEmail,
    type: data.type || 'info',
    title: data.title,
    message: data.message,
    time: 'Just now',
    read: false
  });
}

async function handleApi(req, res, url) {
  const db = readDb();
  try {
    if (req.method === 'GET' && url.pathname === '/api/health') {
      return sendJson(res, 200, { ok: true, app: 'FUTMINNA FindHub' });
    }

    if (req.method === 'POST' && url.pathname === '/api/auth/login') {
      const body = await parseBody(req);
      const email = String(body.email || '').trim().toLowerCase();
      const user = db.users.find(u => u.email === email);
      const valid = user && user.passwordHash === hashPassword(String(body.password || ''), user.salt);
      if (!valid) return sendJson(res, 401, { error: 'Invalid email or password' });
      const token = signJwt({ sub: user.id, email: user.email, role: user.role });
      return sendJson(res, 200, { token, user: publicUser(user) });
    }

    if (req.method === 'POST' && url.pathname === '/api/auth/register/request') {
      const body = await parseBody(req);
      const email = String(body.email || '').trim().toLowerCase();
      if (db.users.some(u => u.email === email)) return sendJson(res, 409, { error: 'An account already exists with this email' });
      const otp = String(Math.floor(100000 + Math.random() * 900000));
      db.pendingRegistrations = db.pendingRegistrations.filter(p => p.email !== email);
      db.pendingRegistrations.push({ ...body, email, otp, createdAt: new Date().toISOString() });
      writeDb(db);
      const emailResult = await sendOtpEmail(email, otp);
      return sendJson(res, 200, {
        message: emailResult.sent ? 'Verification code sent to your email' : 'Verification code generated',
        emailSent: emailResult.sent,
        devCode: emailResult.sent ? undefined : otp
      });
    }

    if (req.method === 'POST' && url.pathname === '/api/auth/register/verify') {
      const body = await parseBody(req);
      const email = String(body.email || '').trim().toLowerCase();
      const pending = db.pendingRegistrations.find(p => p.email === email);
      if (!pending || pending.otp !== String(body.otp || '').trim()) return sendJson(res, 400, { error: 'Invalid verification code' });
      const user = createUser({ ...pending, role: 'student', verified: true });
      db.users.push(user);
      db.pendingRegistrations = db.pendingRegistrations.filter(p => p.email !== email);
      addNotification(db, user.email, { type: 'info', title: 'Account Created', message: 'Welcome to FUTMINNA FindHub.' });
      writeDb(db);
      return sendJson(res, 201, { user: publicUser(user) });
    }

    if (req.method === 'POST' && url.pathname === '/api/auth/logout') {
      return sendJson(res, 200, { ok: true });
    }

    if (req.method === 'GET' && url.pathname === '/api/items') {
      return sendJson(res, 200, { items: db.items });
    }

    if (req.method === 'POST' && url.pathname === '/api/items') {
      const user = requireAuth(req, res, db);
      if (!user) return;
      const body = await parseBody(req);
      const nextId = Math.max(0, ...db.items.map(i => Number(i.id) || 0)) + 1;
      const item = {
        id: nextId,
        type: body.type,
        title: body.title,
        category: body.category,
        location: body.location,
        date: body.date,
        description: body.description,
        images: saveImages(body.images, 'item-' + nextId),
        status: 'reported',
        reporter: user.email,
        contact: body.contact || user.phone,
        securityQuestions: Array.isArray(body.securityQuestions) ? body.securityQuestions : [],
        createdAt: new Date().toISOString()
      };
      db.items.unshift(item);
      addNotification(db, user.email, { type: 'info', title: 'Report Submitted', message: 'Your report for "' + item.title + '" has been saved.' });
      writeDb(db);
      return sendJson(res, 201, { item });
    }

    const itemMatch = url.pathname.match(/^\/api\/items\/(\d+)$/);
    if (itemMatch && req.method === 'PUT') {
      const user = requireAuth(req, res, db);
      if (!user) return;
      const id = Number(itemMatch[1]);
      const item = db.items.find(i => Number(i.id) === id);
      if (!item) return sendJson(res, 404, { error: 'Item not found' });
      if (user.role !== 'admin' && item.reporter !== user.email) return sendJson(res, 403, { error: 'You cannot edit this report' });

      const body = await parseBody(req);
      const editableFields = ['type', 'title', 'category', 'location', 'date', 'description', 'contact'];
      editableFields.forEach(field => {
        if (body[field] !== undefined) item[field] = body[field];
      });
      if (user.role === 'admin' && body.status !== undefined) {
        item.status = body.status;
      }
      if (Array.isArray(body.securityQuestions)) {
        item.securityQuestions = body.securityQuestions.filter(q => q && q.question && q.answer);
      }
      if (Array.isArray(body.images) && body.images.length > 0) {
        item.images = saveImages(body.images, 'item-' + id);
      }
      item.updatedAt = new Date().toISOString();

      addNotification(db, item.reporter, {
        type: 'info',
        title: 'Report Updated',
        message: 'Your report "' + item.title + '" has been updated.'
      });
      writeDb(db);
      return sendJson(res, 200, { item });
    }

    if (itemMatch && req.method === 'DELETE') {
      const user = requireAuth(req, res, db);
      if (!user) return;
      const id = Number(itemMatch[1]);
      const item = db.items.find(i => Number(i.id) === id);
      if (!item) return sendJson(res, 404, { error: 'Item not found' });
      if (user.role !== 'admin' && item.reporter !== user.email) return sendJson(res, 403, { error: 'You cannot delete this report' });
      db.items = db.items.filter(i => Number(i.id) !== id);
      writeDb(db);
      return sendJson(res, 200, { ok: true });
    }

    const claimMatch = url.pathname.match(/^\/api\/items\/(\d+)\/claims$/);
    if (claimMatch && req.method === 'POST') {
      const user = requireAuth(req, res, db);
      if (!user) return;
      const id = Number(claimMatch[1]);
      const item = db.items.find(i => Number(i.id) === id);
      if (!item) return sendJson(res, 404, { error: 'Item not found' });
      if (item.reporter === user.email) return sendJson(res, 400, { error: 'You cannot claim your own report' });
      const body = await parseBody(req);
      item.status = 'claim_initiated';
      item.claimant = user.email;
      item.claimDate = new Date().toISOString().slice(0, 10);
      item.claim = {
        fullName: body.fullName,
        matric: body.matric,
        phone: body.phone,
        description: body.description,
        images: saveImages(body.images, 'claim-' + id)
      };
      addNotification(db, user.email, { type: 'claim', title: 'Claim Submitted', message: 'Your claim for "' + item.title + '" is awaiting admin verification.' });
      addNotification(db, item.reporter, { type: 'claim', title: 'New Claim Received', message: 'Someone submitted a claim for "' + item.title + '".' });
      writeDb(db);
      return sendJson(res, 200, { item });
    }

    const verifyMatch = url.pathname.match(/^\/api\/items\/(\d+)\/verify$/);
    if (verifyMatch && req.method === 'POST') {
      const user = requireAuth(req, res, db);
      if (!user) return;
      if (user.role !== 'admin') return sendJson(res, 403, { error: 'Admin access required' });
      const id = Number(verifyMatch[1]);
      const body = await parseBody(req);
      const item = db.items.find(i => Number(i.id) === id);
      if (!item) return sendJson(res, 404, { error: 'Item not found' });
      item.status = body.action === 'reject' ? 'matched' : 'verified';
      item.verifiedAt = new Date().toISOString();
      addNotification(db, item.claimant, {
        type: body.action === 'reject' ? 'alert' : 'claim',
        title: body.action === 'reject' ? 'Claim Rejected' : 'Claim Verified',
        message: body.action === 'reject' ? 'Your claim for "' + item.title + '" was rejected.' : 'Your claim for "' + item.title + '" has been verified.'
      });
      writeDb(db);
      return sendJson(res, 200, { item });
    }

    if (req.method === 'GET' && url.pathname === '/api/notifications') {
      const user = requireAuth(req, res, db);
      if (!user) return;
      return sendJson(res, 200, { notifications: db.notifications.filter(n => n.userEmail === user.email) });
    }

    if (req.method === 'PATCH' && url.pathname === '/api/notifications/read') {
      const user = requireAuth(req, res, db);
      if (!user) return;
      db.notifications.forEach(n => { if (n.userEmail === user.email) n.read = true; });
      writeDb(db);
      return sendJson(res, 200, { ok: true });
    }

    return sendJson(res, 404, { error: 'Route not found' });
  } catch (error) {
    return sendJson(res, 400, { error: error.message || 'Request failed' });
  }
}

function serveStatic(req, res, url) {
  let requestedPath = decodeURIComponent(url.pathname);
  if (requestedPath === '/') requestedPath = '/index.html';
  const filePath = path.normalize(path.join(ROOT, requestedPath));
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403);
    return res.end('Forbidden');
  }
  fs.readFile(filePath, (error, content) => {
    if (error) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('Not found');
    }
    res.writeHead(200, { 'Content-Type': MIME_TYPES[path.extname(filePath).toLowerCase()] || 'application/octet-stream' });
    res.end(content);
  });
}

ensureStorage();
const findhubServer = http.createServer((req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, corsHeaders());
    return res.end();
  }
  const url = new URL(req.url, 'http://' + req.headers.host);
  if (url.pathname.startsWith('/api/')) return handleApi(req, res, url);
  serveStatic(req, res, url);
});

if (require.main === module) {
  findhubServer.listen(PORT, () => {
    console.log('FUTMINNA FindHub running at http://localhost:' + PORT);
  });
}

module.exports = { findhubServer };
