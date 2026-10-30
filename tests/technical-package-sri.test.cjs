'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
for (const file of ['ite-technical-package.js', 'ite-technical-package-ui.js']) {
  const tag = [...html.matchAll(/<script\b[^>]*>/gi)].map(x => x[0]).find(x => x.includes('./' + file + '?'));
  assert.ok(tag, 'Missing script: ' + file);
  const sri = tag.match(/\bintegrity="sha384-([A-Za-z0-9+/=]+)"/);
  assert.ok(sri, 'Missing SHA-384 SRI: ' + file);
  assert.match(tag, /\bcrossorigin="anonymous"/);
  const actual = crypto.createHash('sha384').update(fs.readFileSync(path.join(root, file))).digest('base64');
  assert.equal(sri[1], actual, 'SRI mismatch: ' + file);
}
console.log('Technical package script integrity verified');
