'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('app.js','utf8');
const match=source.match(/function balance\(articleId\)\{[^\n]+\}/);
assert(match,'balance function missing');
const state={movements:[]};
const ctx={state,same:(a,b)=>String(a)===String(b),Number,String};
vm.createContext(ctx);vm.runInContext(match[0]+';this.balance=balance',ctx);
function check(movements,expected){state.movements=movements;const result=ctx.balance('10');if(Number.isNaN(expected))assert(Number.isNaN(result));else assert.equal(result,expected)}
check([{articleId:'10',quantity:3},{articleId:'10',quantity:-1},{articleId:'11',quantity:9}],2);
check([{articleId:10,quantity:'4'},{articleId:'10',quantity:'-1.5'}],2.5);
check([{articleId:'10',quantity:''}],NaN);
check([{articleId:'10',quantity:'invalid'}],NaN);
assert(source.includes("'Da verificare')+' '+esc(a.unit)"),'Warehouse warning missing');
assert(source.includes("if(!Number.isFinite(currentBalance))throw Error('Giacenza non verificabile"),'Invalid stock must block new movements');
assert(source.includes("if(m.siteId&&!core.cantieri.some(s=>same(s.id,m.siteId)))throw Error('Cantiere del movimento mancante')"),'Warehouse must validate site references');
assert(source.includes("if(!articleIds.has(m.articleId)||!Number.isFinite(m.quantity)"),'Warehouse must validate article references and quantities');
console.log('OK: 8 warehouse stock checks');
