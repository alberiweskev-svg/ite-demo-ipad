const assert=require('node:assert/strict'),D=require('./ite-document-review.js'),R=require('./ite-administrative-register.js');
const cases=[['nota TD04','TD04'],['PROFORMA','PROFORMA'],['Dichiarazione di conformità','DICO'],['Dichiarazione di rispondenza','DIRI'],['Allegato gas H40','GAS'],['Piano operativo di sicurezza','POS']];
for(const [s,type] of cases)assert.equal(D.classify('file.pdf',s),type);
const p=D.inspect('fattura.pdf','Fattura n. 24/2026\nData 02/11/2026\nTotale documento € 1.234,50');assert.equal(p.number,'24/2026');assert.equal(p.total,1234.5);assert.equal(p.requiresReview,true);
assert.equal(D.inspect('x.pdf','Totale documento € 10,00\nTotale documento € 20,00').total,null);
assert.throws(()=>D.prepare(p,{operator:'Tecnico',confirmed:false}),/CONFERMA/);
const fields={id:'demo1',type:'VENDITA',number:'24/2026',party:'CLIENTE FITTIZIO',issued:'2026-11-02',taxable:100,vat:10,total:110,operator:'Tecnico',confirmed:true};
const doc=D.prepare(p,fields);assert.equal(doc.verified,false);assert.equal(doc.source,'PDF');const state=R.add(R.empty(),0,doc,'Tecnico');assert.equal(state.documents.length,1);
console.log('Document review: synthetic checks passed');
