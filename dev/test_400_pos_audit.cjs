'use strict';
const assert=require('node:assert/strict');
globalThis.ITEPosRegisters=require('../pos-operativo.js');
const api=require('../pos-audit.js');
const base={
 personale:'• Operatore TEST | Idraulico | Formazione da verificare',
 attrezzature:'• Trapano TEST | Posa tubazioni | Verifiche da effettuare',
 rischi:'• Posa tubazioni | Urto | Delimitare area',
 dpi:'• Posa tubazioni | Guanti e occhiali | Delimitazione area',
 emergenze:'• Infortunio | Chiamare soccorsi | Addetto TEST'
};
const good=api.audit(base);
assert.equal(good.counts.personale,1);
assert.equal(good.links.length,1);
assert.equal(good.links[0].dpiMatched,true);
assert.equal(good.summary.prioritarie,0);
const broken=api.audit({...base,dpi:'• Altra fase | Guanti | ',emergenze:'',personale:'• Operatore TEST | Idraulico | ',rischi:'• Posa tubazioni | Urto | '});
assert.ok(broken.issues.some(x=>x.message.includes('Fase senza corrispondenza')));
assert.ok(broken.issues.some(x=>x.message.includes('Misura preventiva')));
assert.ok(broken.issues.some(x=>x.message.includes('emergenza')));
assert.ok(broken.issues.some(x=>x.message.includes('Formazione')));
assert.ok(broken.issues.some(x=>x.message.includes('Protezione collettiva')));
assert.equal(api.audit({...base,dpi:'• POSA   TUBAZIONI | Guanti | Barriere'}).links[0].dpiMatched,true);
assert.ok(api.audit({...base,rischi:'Testo libero precedente\n'+base.rischi}).legacyPresent.includes('rischi'));
const attack={...base,rischi:'• =SOMMA(A1:A2) | <img src=x onerror=alert(1)> | Delimitare'};
const r=api.audit(attack),html=api.render(r),print=api.printable(r,'<script>alert(1)</script>'),csv=api.csv(r);
assert.ok(!html.includes('<img src='));
assert.ok(!print.includes('<script>alert(1)</script>'));
assert.ok(print.includes('BOZZA NON FIRMATA'));
assert.ok(print.includes('default-src'));
assert.ok(csv.includes('"\'=SOMMA(A1:A2)'));
assert.ok(!csv.includes('\n=SOMMA'));
assert.throws(()=>api.audit({...base,rischi:'A'.repeat(2001)}),/limite/);
assert.throws(()=>api.audit({...base,rischi:123}),/campo POS deve essere testuale|campo POS/);
assert.equal(api.audit({...base,rischi:''}).counts.rischi,0);
console.log('OK: POS audit 5 registri, fasi-DPI, anomalie, legacy, escaping HTML, CSV injection, A4 e limiti');
