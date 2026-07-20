'use strict';
/**
 * K-LabDoc 서버
 * - 정적 프론트엔드(public/index.html)를 호스팅
 * - Railway에서 동작하는 로그인/인증 API 제공 (JWT)
 */
require('dotenv').config();
const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-only-change-me';
const TOKEN_TTL = process.env.TOKEN_TTL || '8h';

if (JWT_SECRET === 'dev-only-change-me') {
  console.warn('[warn] JWT_SECRET 미설정 — 배포 환경에서는 반드시 환경변수로 설정하세요.');
}

app.set('trust proxy', 1);
app.use(helmet({ contentSecurityPolicy: false })); // 단일 파일 인라인 스크립트 허용
app.use(compression());
app.use(cors());
app.use(express.json({ limit: '1mb' }));

// ---- 인증 미들웨어 ----
function auth(req, res, next) {
  const h = req.headers.authorization || '';
  const t = h.startsWith('Bearer ') ? h.slice(7) : null;
  if (!t) return res.status(401).json({ error: 'no_token' });
  try { req.user = jwt.verify(t, JWT_SECRET); next(); }
  catch { return res.status(401).json({ error: 'invalid_token' }); }
}
function requireDoctor(req, res, next) {
  if (req.user && req.user.role === '담당 전문의') return next();
  return res.status(403).json({ error: 'forbidden' });
}

// ---- API ----
const api = express.Router();
const loginLimiter = rateLimit({ windowMs: 60 * 1000, max: 20, standardHeaders: true, legacyHeaders: false });

api.get('/health', (req, res) => res.json({ ok: true, store: db.currentMode() === 'pg' ? 'postgres' : 'memory', time: new Date().toISOString() }));

// 로그인 화면용 사용자 목록(PIN 제외)
api.get('/users', async (req, res) => {
  try { res.json({ users: await db.listUsers() }); }
  catch (e) { res.status(500).json({ error: 'server_error' }); }
});

// 로그인: id + pin → JWT
api.post('/auth/login', loginLimiter, async (req, res) => {
  const { id, pin } = req.body || {};
  if (!id || pin == null) return res.status(400).json({ error: 'missing_fields' });
  try {
    const u = await db.verifyPin(id, pin);
    if (!u) return res.status(401).json({ error: 'invalid_credentials' });
    const token = jwt.sign({ sub: u.id, name: u.name, role: u.role, group: u.group }, JWT_SECRET, { expiresIn: TOKEN_TTL });
    res.json({ token, user: u });
  } catch (e) { res.status(500).json({ error: 'server_error' }); }
});

// 내 정보
api.get('/auth/me', auth, (req, res) => {
  res.json({ user: { id: req.user.sub, name: req.user.name, role: req.user.role, group: req.user.group } });
});

// PIN 변경
api.post('/auth/change-pin', auth, async (req, res) => {
  const { oldPin, newPin } = req.body || {};
  if (!newPin || String(newPin).length < 4) return res.status(400).json({ error: 'weak_pin' });
  try {
    const ok = await db.verifyPin(req.user.sub, oldPin);
    if (!ok) return res.status(401).json({ error: 'invalid_credentials' });
    await db.setPin(req.user.sub, newPin);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: 'server_error' }); }
});

// 사용자 추가 (전문의 권한)
api.post('/users', auth, requireDoctor, async (req, res) => {
  const { id, name, role, group, pin } = req.body || {};
  if (!id || !name || !role || !group) return res.status(400).json({ error: 'missing_fields' });
  try { res.json({ user: await db.addUser({ id, name, role, group, pin }) }); }
  catch (e) { res.status(409).json({ error: 'duplicate_or_error' }); }
});

app.use('/api', api);

// ---- 정적 프론트엔드 ----
app.use(express.static(path.join(__dirname, '..', 'public'), { extensions: ['html'] }));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, '..', 'public', 'index.html')));

// 서버는 항상 즉시 기동(healthcheck 통과 보장). DB 초기화는 그 뒤에 수행하며 실패해도 종료하지 않는다.
app.listen(PORT, '0.0.0.0', () => console.log(`[klabdoc] listening on :${PORT}`));
db.init().catch((e) => console.error('[db] init error (continuing):', e.message));
