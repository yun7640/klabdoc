'use strict';
/**
 * 사용자 저장소.
 * - DATABASE_URL 이 설정되면 PostgreSQL(Railway Postgres 플러그인)을 사용한다.
 * - 없거나 연결에 실패하면 메모리 저장소로 자동 폴백한다(서버는 항상 기동).
 * 두 경우 모두 동일한 인터페이스를 노출한다.
 */
const bcrypt = require('bcryptjs');
const { SEED_USERS, DEFAULT_PIN } = require('./seed');

let mode = process.env.DATABASE_URL ? 'pg' : 'mem'; // 실제 사용 모드(초기화 실패 시 mem으로 전환)
let pool = null;

async function initPg() {
  const { Pool } = require('pg');
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.PGSSL === 'disable' ? false : { rejectUnauthorized: false },
    connectionTimeoutMillis: 8000,
    max: 5
  });
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id          TEXT PRIMARY KEY,
      name        TEXT NOT NULL,
      role        TEXT NOT NULL,
      grp         TEXT NOT NULL,
      pin_hash    TEXT NOT NULL,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
  const { rows } = await pool.query('SELECT COUNT(*)::int AS c FROM users');
  if (rows[0].c === 0) {
    const hash = bcrypt.hashSync(DEFAULT_PIN, 10);
    for (const u of SEED_USERS) {
      await pool.query(
        'INSERT INTO users (id,name,role,grp,pin_hash) VALUES ($1,$2,$3,$4,$5) ON CONFLICT (id) DO NOTHING',
        [u.id, u.name, u.role, u.group, hash]
      );
    }
    console.log(`[db] seeded ${SEED_USERS.length} users (PIN=${DEFAULT_PIN})`);
  }
}

// ---- 메모리 폴백 ----
const mem = new Map();
function initMem() {
  const hash = bcrypt.hashSync(DEFAULT_PIN, 10);
  mem.clear();
  for (const u of SEED_USERS) mem.set(u.id, { ...u, pin_hash: hash });
  console.log(`[db] in-memory store seeded ${SEED_USERS.length} users (PIN=${DEFAULT_PIN})`);
}

async function init() {
  if (mode === 'pg') {
    try {
      await initPg();
      console.log('[db] using PostgreSQL');
      return;
    } catch (e) {
      console.error('[db] PostgreSQL init failed — falling back to in-memory store:', e.message);
      mode = 'mem';
    }
  }
  initMem();
  if (!process.env.DATABASE_URL) console.log('[db] set DATABASE_URL (Railway PostgreSQL) for persistent accounts');
}

function currentMode() { return mode; }

function rowToUser(r) {
  return { id: r.id, name: r.name, role: r.role, group: r.grp || r.group };
}

async function getUser(id) {
  if (mode === 'pg') {
    const { rows } = await pool.query('SELECT * FROM users WHERE id=$1', [id]);
    return rows[0] || null;
  }
  return mem.get(id) || null;
}

async function listUsers() {
  if (mode === 'pg') {
    const { rows } = await pool.query('SELECT id,name,role,grp FROM users ORDER BY id');
    return rows.map(rowToUser);
  }
  return [...mem.values()].map(rowToUser);
}

async function verifyPin(id, pin) {
  const u = await getUser(id);
  if (!u) return null;
  const ok = bcrypt.compareSync(String(pin || ''), u.pin_hash);
  return ok ? rowToUser(u) : null;
}

async function setPin(id, newPin) {
  const hash = bcrypt.hashSync(String(newPin), 10);
  if (mode === 'pg') { await pool.query('UPDATE users SET pin_hash=$1 WHERE id=$2', [hash, id]); return; }
  const u = mem.get(id); if (u) u.pin_hash = hash;
}

async function addUser({ id, name, role, group, pin }) {
  const hash = bcrypt.hashSync(String(pin || DEFAULT_PIN), 10);
  if (mode === 'pg') {
    await pool.query(
      'INSERT INTO users (id,name,role,grp,pin_hash) VALUES ($1,$2,$3,$4,$5)',
      [id, name, role, group, hash]
    );
  } else {
    if (mem.has(id)) throw new Error('duplicate id');
    mem.set(id, { id, name, role, group, pin_hash: hash });
  }
  return { id, name, role, group };
}

module.exports = { init, currentMode, getUser, listUsers, verifyPin, setPin, addUser };
