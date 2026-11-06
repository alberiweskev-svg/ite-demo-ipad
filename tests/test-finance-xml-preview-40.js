'use strict';const assert=require('node:assert/strict');const {parse}=require('../ite-finance-xml-preview-40.js');
function node(data){return {textContent:data||'',getElementsByTagName(){return []}}}
function element(fields){return {getElementsByTagName(name){return (fields[name]||[]).map(v=>typeof v==='string'?node(v):v)},closest(){return null}}}
const header=element({TipoDocumento:['TD04'],Numero:['NC-42'],Data:['2026-11-06'],ImportoTotaleDocumento:['122.00']});
const summary=element({ImponibileImporto:['100.00'],Imposta:['22.00']});
const supplier=element({Denominazione:['Fornitore Fittizio TEST']});
const customer=element({Denominazione:['Cliente Fittizio TEST']});
class Parser{parseFromString(){return {documentElement:{localName:'FatturaElettronica'},getElementsByTagName(name){return ({DatiGeneraliDocumento:[header],CedentePrestatore:[supplier],CessionarioCommittente:[customer],DatiRiepilogo:[summary]})[name]||[]}}}}
const preview=parse('<FatturaElettronica/>',{DOMParser:Parser});assert.equal(preview.documents[0].type,'TD04');assert.equal(preview.documents[0].credit,true);assert.equal(preview.documents[0].total,122);assert.equal(preview.documents[0].direction,'DA_VERIFICARE');assert.equal(preview.documents[0].status,'ANTEPRIMA_NON_REGISTRATA');
assert.throws(()=>parse('<!DOCTYPE x><FatturaElettronica/>',{DOMParser:Parser}),/ENTITA/);
assert.throws(()=>parse('x'.repeat(1500001),{DOMParser:Parser}),/GRANDE/);
const badHeader=element({TipoDocumento:['TD99'],Numero:['X'],Data:['2026-11-06']});
class BadParser extends Parser{parseFromString(){const d=super.parseFromString();const old=d.getElementsByTagName;d.getElementsByTagName=n=>n==='DatiGeneraliDocumento'?[badHeader]:old(n);return d}}
assert.throws(()=>parse('<FatturaElettronica/>',{DOMParser:BadParser}),/DA_VERIFICARE/);
console.log('Finance XML preview TEST: OK');
