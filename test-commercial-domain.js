/* Synthetic tests; run: node test-commercial-domain.js */
'use strict';
const assert=require('node:assert/strict'),c=require('./ite-commercial-domain.js');
const cases=[];
function check(name,fn){fn();cases.push(name)}
check('markup tiers',()=>{for(const [v,r] of [[100,.30],[101,.25],[500,.25],[501,.20],[1000,.20],[1001,.15],[5000,.15],[5001,.05]])assert.equal(c.markup(v).rate,r)});
check('supply installation separated',()=>{const p=c.addPair([],{id:'lavabo',description:'lavabo con colonna',supplyPrice:200,installationPrice:120});assert.deepEqual(p.map(x=>x.kind),['FORNITURA','POSA']);assert.equal(p.length,2)});
check('quote totals and expiry',()=>{const q=c.build({id:'Q-TEST',clientId:'C-TEST',siteId:'S-TEST',issuedAt:'2026-11-01',validDays:30,lines:c.addPair([],{id:'a',description:'lavabo',supplyPrice:200,installationPrice:120})});assert.equal(q.expiresAt,'2026-12-01');assert.equal(q.totals.net,320);assert.equal(q.totals.vat,32);assert.equal(q.totals.gross,352)});
check('crm description excludes prices',()=>{const p=c.addPair([],{id:'a',description:'rubinetto',supplyPrice:100,installationPrice:80});assert.equal(c.crmText(p[0]),'Fornitura rubinetto')});
check('reject duplicate IDs',()=>{const p=c.addPair([],{id:'a',description:'rubinetto',supplyPrice:100,installationPrice:80});assert.throws(()=>c.build({id:'q',clientId:'c',siteId:'s',issuedAt:'2026-11-01',lines:[p[0],p[0]]}),/DUPLICATO/)});
check('reject invalid amount',()=>assert.throws(()=>c.addPair([],{id:'x',description:'x',supplyPrice:-1,installationPrice:5}),/PREZZI/));
check('reject invalid tax',()=>assert.throws(()=>c.line({id:'x',description:'x',kind:'POSA',quantity:1,unitPrice:100,vatRate:.17}),/ALIQUOTA/));
check('TD04 not payable',()=>assert.deepEqual(c.classifyDocument({type:'TD04',issuerIsITE:true}),{category:'NOTA_CREDITO_VENDITA',paymentDue:false,recoveryStatus:'DA_RECUPERARE'}));
check('proforma not payable',()=>assert.equal(c.classifyDocument({type:'PR'}).paymentDue,false));
check('unknown invoice flagged',()=>assert.equal(c.classifyDocument({type:'?' }).category,'DA_VERIFICARE'));
console.log('OK: '+cases.length+' synthetic commercial-domain tests');
