#!/usr/bin/env node
/*
 * Agent0 Feature Canvas — portable, auth-gated server.
 *
 * A self-contained way to put the feature canvas ONLINE for any project, behind a password,
 * without touching the app itself. Zero dependencies (Node built-ins only), so it runs on any
 * Node host — Railway, Render, Fly, a VPS — or locally. It serves ONLY two files (canvas.html
 * and FEATURE_TREE.json) from an allowlist; it never exposes app source, specs, or secrets.
 *
 * Think of it as a plugin: drop these three files together (canvas-server.cjs + canvas.html +
 * the project's FEATURE_TREE.json), set a password, and deploy — the app stays untouched.
 *
 * Environment:
 *   CANVAS_PASSWORD  REQUIRED. The server refuses to start without it.
 *   CANVAS_USER      Basic-auth username. Default: "admin".
 *   PORT             Listen port. Default: 8080. (Railway / Render / Fly set this for you.)
 *   CANVAS_ROOT      Directory holding canvas.html + FEATURE_TREE.json. Default: process.cwd().
 *
 * Run:   CANVAS_PASSWORD=secret node canvas-server.cjs
 * Then open the URL and log in with CANVAS_USER / CANVAS_PASSWORD.
 *
 * See docs/feature-canvas.md → "Put it online (auth-gated)" for deploy recipes.
 */
'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const USER = process.env.CANVAS_USER || 'admin';
const PASS = process.env.CANVAS_PASSWORD;
const PORT = parseInt(process.env.PORT, 10) || 8080;
const ROOT = path.resolve(process.env.CANVAS_ROOT || process.cwd());

if (!PASS) {
  console.error('[canvas] Refusing to start: CANVAS_PASSWORD is not set.');
  console.error('[canvas] Set a password, e.g.  CANVAS_PASSWORD=your-secret node canvas-server.cjs');
  process.exit(1);
}

// The ONLY paths this server will ever serve. Everything else 404s — the app is never exposed.
const ALLOW = {
  '/': 'canvas.html',
  '/canvas.html': 'canvas.html',
  '/FEATURE_TREE.json': 'FEATURE_TREE.json',
};
const TYPES = { '.html': 'text/html; charset=utf-8', '.json': 'application/json; charset=utf-8' };

function safeEqual(a, b) {
  const ab = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

function isAuthed(req) {
  const h = req.headers.authorization || '';
  if (!h.startsWith('Basic ')) return false;
  let decoded;
  try { decoded = Buffer.from(h.slice(6), 'base64').toString('utf8'); } catch { return false; }
  const i = decoded.indexOf(':');
  if (i < 0) return false;
  const u = decoded.slice(0, i);
  const p = decoded.slice(i + 1);
  // evaluate both halves regardless, to avoid short-circuit timing differences
  const okUser = safeEqual(u, USER);
  const okPass = safeEqual(p, PASS);
  return okUser && okPass;
}

const server = http.createServer((req, res) => {
  if (!isAuthed(req)) {
    res.writeHead(401, { 'WWW-Authenticate': 'Basic realm="Feature Canvas", charset="UTF-8"' });
    res.end('Authentication required.');
    return;
  }
  const urlPath = (req.url || '/').split('?')[0];
  const rel = ALLOW[urlPath];
  if (!rel) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found.');
    return;
  }
  fs.readFile(path.join(ROOT, rel), (err, data) => {
    if (err) {
      const msg = rel === 'FEATURE_TREE.json'
        ? '{"error":"FEATURE_TREE.json not found in CANVAS_ROOT — run /feature-tree to generate it"}'
        : 'Not found.';
      res.writeHead(404, { 'Content-Type': rel.endsWith('.json') ? 'application/json' : 'text/plain' });
      res.end(msg);
      return;
    }
    res.writeHead(200, {
      'Content-Type': TYPES[path.extname(rel)] || 'application/octet-stream',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'Referrer-Policy': 'no-referrer',
    });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`[canvas] serving ${ROOT} on port ${PORT} — basic auth on (user "${USER}").`);
  console.log('[canvas] only canvas.html + FEATURE_TREE.json are exposed; nothing else.');
});
