'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const root = __dirname;
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const version = JSON.parse(fs.readFileSync(path.join(root, 'version.json'), 'utf8'));
assert.equal(version.channel, 'development', 'Release checks must not silently switch channel');
assert.equal(version.published, false, 'Development branch must not advertise publication');
const scripts = [...html.matchAll(/<script\b([^>]*)><\/script>/gi)];
assert(scripts.length > 0, 'index.html has no script assets');
let checked = 0;
let signed = 0;
for (const [, attrs] of scripts) {
  const src = /\bsrc\s*=\s*["']([^"']+)["']/i.exec(attrs)?.[1];
  if (!src) continue;
  if (/^(https?:)?\/\//i.test(src) || src.startsWith('data:')) continue;
  const asset = src.split(/[?#]/, 1)[0];
  const resolved = path.resolve(root, asset);
  assert(resolved.startsWith(root + path.sep), 'Script path escapes the repository: ' + src);
  assert(fs.existsSync(resolved), 'Missing script referenced by index.html: ' + src);
  assert(fs.statSync(resolved).isFile(), 'Script path is not a file: ' + src);
  checked++;
  const integrity = /\bintegrity\s*=\s*["']([^"']+)["']/i.exec(attrs)?.[1];
  if (integrity) {
    const checks = integrity.trim().split(/\s+/).filter(Boolean);
    assert(checks.length > 0, 'Empty integrity attribute: ' + src);
    const contents = fs.readFileSync(resolved);
    assert(checks.some(token => {
      const match = /^(sha256|sha384|sha512)-(.+)$/.exec(token);
      return match && crypto.createHash(match[1]).update(contents).digest('base64') === match[2];
    }), 'Script integrity mismatch: ' + src);
    signed++;
  }
}
assert(checked > 0, 'No local scripts checked');
console.log('Release asset smoke test OK:', checked, 'local scripts,', signed, 'integrity-verified.');
