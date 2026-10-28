'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('app.js','utf8');
function extract(name){const start=source.indexOf('function '+name+'(');assert(start>=0,'Missing '+name);const begin=source.indexOf('{',start);let depth=0,quote='',escaped=false;for(let i=begin;i<source.length;i++){const c=source[i];if(quote){if(escaped){escaped=false;continue}if(c==='\\'){escaped=true;continue}if(c===quote)quote='';continue}if(c==='"'||c==="'"||c==='\x60'){quote=c;continue}if(c==='{')depth++;else if(c==='}'&&!--depth)return source.slice(start,i+1)}throw Error('Unterminated '+name)}
const ctx={Number,Array,String,Error};vm.createContext(ctx);
vm.runInContext(['extraNet','quoteNet','quoteVat','quoteValidate'].map(extract).join(';'),ctx);
const lines=[{line_type:'Fornitura',description:'Rubinetto fittizio',qty:2,price:120,discount:10,vat:22},{line_type:'Posa',description:'Posa fittizia',qty:1,price:80,discount:0,vat:10}];
assert.equal(ctx.quoteValidate(lines),true);assert.equal(ctx.quoteNet({lines}),296);assert.ok(Math.abs(ctx.quoteVat({lines})-55.52)<1e-6);
assert.equal(ctx.quoteNet({amount:123}),123);assert.equal(ctx.quoteVat({amount:123}),0);
for(const invalid of [[],[{...lines[0],line_type:''}],[{...lines[0],qty:0}],[{...lines[0],price:-1}],[{...lines[0],discount:101}],[{...lines[0],vat:101}],[{...lines[0],description:''}]])assert.throws(()=>ctx.quoteValidate(invalid));
for(const pattern of [/data-fin-quote-edit/,/data-fin-quote-print/,/data-field="line_type"/,/DA DISTINGUERE/,/signed_document_verified='no'/])assert.match(source,pattern);
console.log('OK: itemized quotes, supply/install, VAT, legacy values, invalid inputs, approval reset, extra categories');
