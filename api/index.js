const crypto = require('crypto');
const { Pool } = require('pg');

let pool;
let schemaReady = false;

const seedItems = [
  { id: 1, type: 'lost', title: 'iPhone 14 Pro - Space Black', category: 'Electronics', location: 'Lecture Theatre 1, Bosso Campus', date: '2026-06-25', description: 'Lost my iPhone 14 Pro in Space Black color. Has a purple case with FUTMINNA sticker on the back.', images: ['https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=400&h=300&fit=crop'], status: 'matched', reporter: 'nelson.m2834567@st.futminna.edu.ng', contact: '08012345678', securityQuestions: [{ question: 'What is the exact color of the phone case?', answer: 'Purple' }, { question: 'What sticker is on the back of the case?', answer: 'FUTMINNA' }] },
  { id: 2, type: 'found', title: 'Student ID Card - 2023/1/12345AB', category: 'ID Cards', location: 'School Library, Main Campus', date: '2026-06-27', description: 'Found a student ID card on the reading table at the school library second floor.', images: ['https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=400&h=300&fit=crop'], status: 'under_review', reporter: 'admin@futminna.edu.ng', contact: '08098765432' },
  { id: 3, type: 'lost', title: 'Laptop Bag - Black Dell', category: 'Bags', location: 'Cafeteria, Main Campus', date: '2026-06-28', description: 'Black Dell laptop bag containing a charger and notebooks.', images: ['https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=300&fit=crop'], status: 'reported', reporter: 'nelson.m2834567@st.futminna.edu.ng', contact: '08012345678' },
  { id: 4, type: 'found', title: 'Wallet - Brown Leather', category: 'Wallets', location: 'Student Center, Bosso Campus', date: '2026-06-26', description: 'Brown leather wallet found near the student center entrance.', images: ['https://images.unsplash.com/photo-1627123424574-724758594e93?w=400&h=300&fit=crop'], status: 'claim_initiated', reporter: 'admin@futminna.edu.ng', contact: '08098765432', claimant: 'nelson.m2834567@st.futminna.edu.ng', claim: { fullName: 'Nelson M.', matric: '2023/1/34567CF', phone: '08012345678', description: 'I can identify the contents of the wallet.', images: [] } }
];

const seedNotifications = [
  { userEmail: 'nelson.m2834567@st.futminna.edu.ng', type: 'match', title: 'Potential Match Found!', message: 'Your iPhone 14 Pro report may have a match. Review the details to initiate a claim.', time: '2 hours ago', read: false },
  { userEmail: 'nelson.m2834567@st.futminna.edu.ng', type: 'info', title: 'Welcome to FindHub', message: 'You can now report lost and found items from your dashboard.', time: '1 day ago', read: true }
];

function getPool() {
  if (!process.env.DATABASE_URL) {
    const error = new Error('DATABASE_URL is not configured. Add a Postgres database in Vercel and set DATABASE_URL.');
    error.statusCode = 500;
    throw error;
  }
  if (!pool) {
    pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined });
  }
  return pool;
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
  const body = Object.assign({}, payload, { iat: now, exp: now + expiresInSeconds });
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

async function sendOtpEmail(email, otp) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || 'FUTMINNA FindHub <onboarding@resend.dev>';
  if (!apiKey || typeof fetch !== 'function') return { sent: false };
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from,
        to: email,
        subject: 'Your FUTMINNA FindHub verification code',
        html: '<p>Your FUTMINNA FindHub verification code is:</p><h2>' + otp + '</h2><p>This code expires soon. If you did not request it, ignore this email.</p>'
      })
    });
    return { sent: response.ok, status: response.status };
  } catch (_) {
    return { sent: false };
  }
}

function createUser(input) {
  const salt = crypto.randomBytes(16).toString('hex');
  return { id: crypto.randomUUID(), email: String(input.email).toLowerCase(), passwordHash: hashPassword(String(input.password), salt), salt: salt, firstName: input.firstName, lastName: input.lastName, name: String(input.firstName + ' ' + input.lastName).trim(), role: input.role || 'student', matric: input.matric, department: input.department, phone: input.phone, verified: Boolean(input.verified) };
}

function publicUser(user) {
  return { id: user.id, email: user.email, firstName: user.first_name, lastName: user.last_name, name: user.name, role: user.role, matric: user.matric, department: user.department, phone: user.phone };
}

function dbItem(row) {
  if (!row) return null;
  return { id: row.id, type: row.type, title: row.title, category: row.category, location: row.location, date: row.item_date, description: row.description, images: row.images || [], status: row.status, reporter: row.reporter, contact: row.contact, securityQuestions: row.security_questions || [], claimant: row.claimant, claimDate: row.claim_date, claim: row.claim || null, createdAt: row.created_at, updatedAt: row.updated_at, verifiedAt: row.verified_at };
}

function send(res, status, data) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(data));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    if (req.body && typeof req.body === 'object') return resolve(req.body);
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 15 * 1024 * 1024) reject(new Error('Request body too large'));
    });
    req.on('end', () => {
      if (!body) return resolve({});
      try { resolve(JSON.parse(body)); } catch (_) { reject(new Error('Invalid JSON body')); }
    });
  });
}

async function initDb() {
  if (schemaReady) return;
  const db = getPool();
  await db.query('CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL, salt TEXT NOT NULL, first_name TEXT NOT NULL, last_name TEXT NOT NULL, name TEXT NOT NULL, role TEXT NOT NULL DEFAULT \'student\', matric TEXT, department TEXT, phone TEXT, verified BOOLEAN NOT NULL DEFAULT false, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())');
  await db.query('CREATE TABLE IF NOT EXISTS pending_registrations (email TEXT PRIMARY KEY, data JSONB NOT NULL, otp TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())');
  await db.query('CREATE TABLE IF NOT EXISTS sessions (token TEXT PRIMARY KEY, email TEXT NOT NULL REFERENCES users(email) ON DELETE CASCADE, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())');
  await db.query('CREATE TABLE IF NOT EXISTS items (id SERIAL PRIMARY KEY, type TEXT NOT NULL, title TEXT NOT NULL, category TEXT NOT NULL, location TEXT NOT NULL, item_date TEXT NOT NULL, description TEXT NOT NULL, images JSONB NOT NULL DEFAULT \'[]\'::jsonb, status TEXT NOT NULL DEFAULT \'reported\', reporter TEXT NOT NULL, contact TEXT NOT NULL, security_questions JSONB NOT NULL DEFAULT \'[]\'::jsonb, claimant TEXT, claim_date TEXT, claim JSONB, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ, verified_at TIMESTAMPTZ)');
  await db.query('CREATE TABLE IF NOT EXISTS notifications (id SERIAL PRIMARY KEY, user_email TEXT NOT NULL, type TEXT NOT NULL DEFAULT \'info\', title TEXT NOT NULL, message TEXT NOT NULL, time TEXT NOT NULL DEFAULT \'Just now\', read BOOLEAN NOT NULL DEFAULT false, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())');

  const usersCount = await db.query('SELECT COUNT(*)::int AS count FROM users');
  if (usersCount.rows[0].count === 0) {
    const users = [createUser({ email: 'nelson.m2834567@st.futminna.edu.ng', password: 'demo123', firstName: 'Nelson', lastName: 'M.', role: 'student', matric: '2023/1/34567CF', department: 'Information Technology', phone: '08012345678', verified: true }), createUser({ email: 'admin@futminna.edu.ng', password: 'admin123', firstName: 'System', lastName: 'Admin', role: 'admin', matric: 'ADMIN001', department: 'ICT Directorate', phone: '08098765432', verified: true })];
    for (const user of users) {
      await db.query('INSERT INTO users (id, email, password_hash, salt, first_name, last_name, name, role, matric, department, phone, verified) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)', [user.id, user.email, user.passwordHash, user.salt, user.firstName, user.lastName, user.name, user.role, user.matric, user.department, user.phone, user.verified]);
    }
  }

  const itemsCount = await db.query('SELECT COUNT(*)::int AS count FROM items');
  if (itemsCount.rows[0].count === 0) {
    for (const item of seedItems) {
      await db.query('INSERT INTO items (id, type, title, category, location, item_date, description, images, status, reporter, contact, security_questions, claimant, claim_date, claim) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)', [item.id, item.type, item.title, item.category, item.location, item.date, item.description, JSON.stringify(item.images || []), item.status, item.reporter, item.contact, JSON.stringify(item.securityQuestions || []), item.claimant || null, item.claimDate || null, item.claim ? JSON.stringify(item.claim) : null]);
    }
    await db.query('SELECT setval(pg_get_serial_sequence(\'items\', \'id\'), (SELECT MAX(id) FROM items))');
  }

  const notificationsCount = await db.query('SELECT COUNT(*)::int AS count FROM notifications');
  if (notificationsCount.rows[0].count === 0) {
    for (const notification of seedNotifications) await addNotification(notification.userEmail, notification);
  }
  schemaReady = true;
}

async function getAuthUser(req) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!token) return null;
  const payload = verifyJwt(token);
  if (!payload) return null;
  const result = await getPool().query('SELECT * FROM users WHERE email = $1', [payload.email]);
  return result.rows[0] || null;
}

async function requireAuth(req, res) {
  const user = await getAuthUser(req);
  if (!user) send(res, 401, { error: 'Please login to continue' });
  return user;
}

async function addNotification(userEmail, data) {
  if (!userEmail) return;
  await getPool().query('INSERT INTO notifications (user_email, type, title, message, time, read) VALUES ($1,$2,$3,$4,$5,$6)', [userEmail, data.type || 'info', data.title, data.message, data.time || 'Just now', Boolean(data.read)]);
}

function normalizeImages(images) {
  if (!Array.isArray(images)) return [];
  return images.slice(0, 5).filter(image => typeof image === 'string' && image.length < 4000000);
}

async function handle(req, res) {
  await initDb();
  const db = getPool();
  const url = new URL(req.url, 'https://findhub.local');
  let pathname = url.pathname;

  if (pathname === '/api/index.js' || pathname === '/api/index') {
    const rawPath = req.query?.path || req.query?.[0] || '';
    if (Array.isArray(rawPath)) {
      pathname = '/api/' + rawPath.join('/');
    } else if (rawPath) {
      pathname = '/api/' + String(rawPath).replace(/^\/+/, '');
    }
  }

  if (!pathname.startsWith('/api/') && Array.isArray(req.query?.path)) {
    pathname = '/api/' + req.query.path.join('/');
  }

  if (req.method === 'GET' && pathname === '/api/health') return send(res, 200, { ok: true, app: 'FUTMINNA FindHub', database: 'postgres' });

  if (req.method === 'POST' && pathname === '/api/auth/login') {
    const body = await readBody(req);
    const email = String(body.email || '').trim().toLowerCase();
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];
    const valid = user && user.password_hash === hashPassword(String(body.password || ''), user.salt);
    if (!valid) return send(res, 401, { error: 'Invalid email or password' });
    const token = signJwt({ sub: user.id, email: user.email, role: user.role });
    return send(res, 200, { token: token, user: publicUser(user) });
  }

  if (req.method === 'POST' && pathname === '/api/auth/logout') {
    return send(res, 200, { ok: true });
  }

  if (req.method === 'POST' && pathname === '/api/auth/register/request') {
    const body = await readBody(req);
    const email = String(body.email || '').trim().toLowerCase();
    const existing = await db.query('SELECT email FROM users WHERE email = $1', [email]);
    if (existing.rows.length) return send(res, 409, { error: 'An account already exists with this email' });
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    await db.query('INSERT INTO pending_registrations (email, data, otp) VALUES ($1,$2,$3) ON CONFLICT (email) DO UPDATE SET data = EXCLUDED.data, otp = EXCLUDED.otp, created_at = NOW()', [email, JSON.stringify(Object.assign({}, body, { email: email })), otp]);
    const emailResult = await sendOtpEmail(email, otp);
    return send(res, 200, { message: emailResult.sent ? 'Verification code sent to your email' : 'Verification code generated', emailSent: emailResult.sent, devCode: emailResult.sent ? undefined : otp });
  }

  if (req.method === 'POST' && pathname === '/api/auth/register/verify') {
    const body = await readBody(req);
    const email = String(body.email || '').trim().toLowerCase();
    const pendingResult = await db.query('SELECT * FROM pending_registrations WHERE email = $1', [email]);
    const pending = pendingResult.rows[0];
    if (!pending || pending.otp !== String(body.otp || '').trim()) return send(res, 400, { error: 'Invalid verification code' });
    const user = createUser(Object.assign({}, pending.data, { role: 'student', verified: true }));
    await db.query('INSERT INTO users (id, email, password_hash, salt, first_name, last_name, name, role, matric, department, phone, verified) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)', [user.id, user.email, user.passwordHash, user.salt, user.firstName, user.lastName, user.name, user.role, user.matric, user.department, user.phone, user.verified]);
    await db.query('DELETE FROM pending_registrations WHERE email = $1', [email]);
    await addNotification(user.email, { type: 'info', title: 'Account Created', message: 'Welcome to FUTMINNA FindHub.' });
    const inserted = await db.query('SELECT * FROM users WHERE email = $1', [user.email]);
    return send(res, 201, { user: publicUser(inserted.rows[0]) });
  }

  if (req.method === 'GET' && pathname === '/api/items') {
    const result = await db.query('SELECT * FROM items ORDER BY id DESC');
    return send(res, 200, { items: result.rows.map(dbItem) });
  }

  if (req.method === 'POST' && pathname === '/api/items') {
    const user = await requireAuth(req, res);
    if (!user) return;
    const body = await readBody(req);
    const result = await db.query('INSERT INTO items (type, title, category, location, item_date, description, images, status, reporter, contact, security_questions) VALUES ($1,$2,$3,$4,$5,$6,$7,\'reported\',$8,$9,$10) RETURNING *', [body.type, body.title, body.category, body.location, body.date, body.description, JSON.stringify(normalizeImages(body.images)), user.email, body.contact || user.phone, JSON.stringify(body.securityQuestions || [])]);
    const item = dbItem(result.rows[0]);
    await addNotification(user.email, { type: 'info', title: 'Report Submitted', message: 'Your report for "' + item.title + '" has been saved.' });
    return send(res, 201, { item: item });
  }

  const itemMatch = pathname.match(/^\/api\/items\/(\d+)$/);
  if (itemMatch && req.method === 'PUT') {
    const user = await requireAuth(req, res);
    if (!user) return;
    const id = Number(itemMatch[1]);
    const oldResult = await db.query('SELECT * FROM items WHERE id = $1', [id]);
    const oldItem = oldResult.rows[0];
    if (!oldItem) return send(res, 404, { error: 'Item not found' });
    if (user.role !== 'admin' && oldItem.reporter !== user.email) return send(res, 403, { error: 'You cannot edit this report' });
    const body = await readBody(req);
    const status = user.role === 'admin' && body.status ? body.status : oldItem.status;
    const result = await db.query('UPDATE items SET type=$1, title=$2, category=$3, location=$4, item_date=$5, description=$6, contact=$7, status=$8, security_questions=$9, updated_at=NOW() WHERE id=$10 RETURNING *', [body.type, body.title, body.category, body.location, body.date, body.description, body.contact, status, JSON.stringify(body.securityQuestions || []), id]);
    const item = dbItem(result.rows[0]);
    await addNotification(item.reporter, { type: 'info', title: 'Report Updated', message: 'Your report "' + item.title + '" has been updated.' });
    return send(res, 200, { item: item });
  }

  if (itemMatch && req.method === 'DELETE') {
    const user = await requireAuth(req, res);
    if (!user) return;
    const id = Number(itemMatch[1]);
    const oldResult = await db.query('SELECT * FROM items WHERE id = $1', [id]);
    const oldItem = oldResult.rows[0];
    if (!oldItem) return send(res, 404, { error: 'Item not found' });
    if (user.role !== 'admin' && oldItem.reporter !== user.email) return send(res, 403, { error: 'You cannot delete this report' });
    await db.query('DELETE FROM items WHERE id = $1', [id]);
    return send(res, 200, { ok: true });
  }

  const claimMatch = pathname.match(/^\/api\/items\/(\d+)\/claims$/);
  if (claimMatch && req.method === 'POST') {
    const user = await requireAuth(req, res);
    if (!user) return;
    const id = Number(claimMatch[1]);
    const oldResult = await db.query('SELECT * FROM items WHERE id = $1', [id]);
    const oldItem = oldResult.rows[0];
    if (!oldItem) return send(res, 404, { error: 'Item not found' });
    if (oldItem.reporter === user.email) return send(res, 400, { error: 'You cannot claim your own report' });
    const body = await readBody(req);
    const claim = { fullName: body.fullName, matric: body.matric, phone: body.phone, description: body.description, images: normalizeImages(body.images) };
    const result = await db.query('UPDATE items SET status=\'claim_initiated\', claimant=$1, claim_date=$2, claim=$3, updated_at=NOW() WHERE id=$4 RETURNING *', [user.email, new Date().toISOString().slice(0, 10), JSON.stringify(claim), id]);
    const item = dbItem(result.rows[0]);
    await addNotification(user.email, { type: 'claim', title: 'Claim Submitted', message: 'Your claim for "' + item.title + '" is awaiting admin verification.' });
    await addNotification(item.reporter, { type: 'claim', title: 'New Claim Received', message: 'Someone submitted a claim for "' + item.title + '".' });
    return send(res, 200, { item: item });
  }

  const verifyMatch = pathname.match(/^\/api\/items\/(\d+)\/verify$/);
  if (verifyMatch && req.method === 'POST') {
    const user = await requireAuth(req, res);
    if (!user) return;
    if (user.role !== 'admin') return send(res, 403, { error: 'Admin access required' });
    const id = Number(verifyMatch[1]);
    const body = await readBody(req);
    const status = body.action === 'reject' ? 'matched' : 'verified';
    const result = await db.query('UPDATE items SET status=$1, verified_at=NOW(), updated_at=NOW() WHERE id=$2 RETURNING *', [status, id]);
    const item = dbItem(result.rows[0]);
    if (!item) return send(res, 404, { error: 'Item not found' });
    await addNotification(item.claimant, { type: body.action === 'reject' ? 'alert' : 'claim', title: body.action === 'reject' ? 'Claim Rejected' : 'Claim Verified', message: body.action === 'reject' ? 'Your claim for "' + item.title + '" was rejected.' : 'Your claim for "' + item.title + '" has been verified.' });
    return send(res, 200, { item: item });
  }

  if (req.method === 'GET' && pathname === '/api/notifications') {
    const user = await requireAuth(req, res);
    if (!user) return;
    const result = await db.query('SELECT * FROM notifications WHERE user_email=$1 ORDER BY id DESC', [user.email]);
    return send(res, 200, { notifications: result.rows.map(row => ({ id: row.id, type: row.type, title: row.title, message: row.message, time: row.time, read: row.read })) });
  }

  if (req.method === 'PATCH' && pathname === '/api/notifications/read') {
    const user = await requireAuth(req, res);
    if (!user) return;
    await db.query('UPDATE notifications SET read=true WHERE user_email=$1', [user.email]);
    return send(res, 200, { ok: true });
  }

  return send(res, 404, { error: 'Route not found' });
}

module.exports = async function handler(req, res) {
  try {
    await handle(req, res);
  } catch (error) {
    send(res, error.statusCode || 500, { error: error.message || 'Server error' });
  }
};
