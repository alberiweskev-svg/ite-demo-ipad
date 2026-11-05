'use strict';
const assert=require('node:assert/strict');
const finance=require('./ite-finance-40.js');
const batch=require('./ite-finance-batch-40.js');
const parser=require('./ite-finance-xml-40.js');
function body(lines,total='241.00',type='TD01'){
 return '<FatturaElettronicaBody><DatiGenerali><DatiGeneraliDocumento><TipoDocumento>'+type+'</TipoDocumento><Data>2026-11-05</Data><Numero>TEST-MULTI-1</Numero><ImportoTotaleDocumento>'+total+'</ImportoTotaleDocumento></DatiGeneraliDocumento></DatiGenerali><DatiBeniServizi>'+lines.map(([n,v])=>'<DatiRiepilogo><ImponibileImporto>'+n+'</ImponibileImporto><Imposta>'+v+'</Imposta></DatiRiepilogo>').join('')+'</DatiBeniServizi></FatturaElettronicaBody>';
}
const header='<FatturaElettronicaHeader><CedentePrestatore><Anagrafica><Denominazione>TEST Fornitore</Denominazione></Anagrafica></CedentePrestatore><CessionarioCommittente><Anagrafica><Denominazione>TEST ITE</Denominazione></Anagrafica></CessionarioCommittente></FatturaElettronicaHeader>';
const xml=(lines,total,type)=>'<FatturaElettronica>'+header+body(lines,total,type)+'</FatturaElettronica>';
const lines=[['100.00','22.00'],['100.00','10.00'],['9.00','0.00']];
const row=parser.parse(xml(lines),'TEST-MULTI-1');
assert.equal(row.net,209);assert.equal(row.vat,32);assert.equal(row.total,241);

const saved=batch.importBatch(finance.empty(),[row],'DEMO','2026-11-05T13:00:00Z');
assert.equal(saved.imported,1);assert.equal(saved.state.documents[0].total,241);
assert.equal(parser.parse(xml([['0.01','0.00'],['0.02','0.00']],'0.03'),'TEST-MULTI-2').total,0.03);
assert.equal(parser.parse(xml(lines,'241.00','TD04'),'TEST-MULTI-3').kind,'TD04');
assert.throws(()=>parser.parse(xml(lines,'250.00'),'TEST-MULTI-4'),/TOTALE_XML_NON_COERENTE/);
assert.throws(()=>parser.parse(xml([['-1.00','0.00']],'1.00'),'TEST-MULTI-5'),/IMPORTO_NEGATIVO/);
assert.throws(()=>parser.parse(xml([],'0.00'),'TEST-MULTI-6'),/RIEPILOGHI_NON_VALIDI/);
assert.throws(()=>parser.parse('<FatturaElettronica>'+header+body(lines,'241.00')+body(lines,'241.00')+'</FatturaElettronica>','TEST-MULTI-7'),/MULTI_BODY_NON_SUPPORTATO/);
assert.throws(()=>parser.parse(xml(lines).replace('TEST Fornitore','Fornitore Reale'),'TEST-MULTI-8'),/SOLO_DATI_TEST/);
console.log('PASS: multiple VAT summaries, cents, TD04, batch integration, safety guards');
