'use strict';
const assert=require('node:assert/strict');
const local=require('./ite-field-local-time.js');
assert.equal(local.toLocal(local.parseLocal('2026-11-05T09:30')),'2026-11-05T09:30');
assert.throws(()=>local.parseLocal('2026-02-30T09:00'),/INESISTENTE/);
assert.throws(()=>local.parseLocal('2026-11-05T25:00'),/INESISTENTE/);
assert.throws(()=>local.parseLocal('2026-11-05'),/FORMATO/);
if(process.env.TZ==='Europe/Rome'){
 assert.throws(()=>local.parseLocal('2026-03-29T02:30'),/INESISTENTE/);
 assert.throws(()=>local.parseLocal('2026-10-25T02:30'),/AMBIGUA/);
 assert.equal(local.toLocal(local.parseLocal('2026-03-29T03:30')),'2026-03-29T03:30');
}
console.log('PASS strict local time and DST validation');
