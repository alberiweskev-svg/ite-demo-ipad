'use strict';
const assert=require('node:assert/strict');
const intake=require('./ite-document-intake.js');
const admin=require('./ite-administrative-register.js');
for(const name of ['TD04.pdf','nota_TD04.pdf','nota-TD04.xml','nota TD 04.pdf','nota_di_credito.pdf']){
 assert.equal(intake.classify(name),'TD04',name);
 assert.equal(admin.classify({filename:name}).type,'TD04',name);
}
for(const name of ['proforma_12.pdf','copia_di_cortesia.pdf','PR_12.pdf']){
 assert.equal(intake.classify(name),'PROFORMA',name);
 assert.equal(admin.classify({filename:name}).type,'PROFORMA',name);
}
assert.equal(intake.classify('fattura.pdf'),'ALTRO');
assert.equal(admin.classify({filename:'fattura.pdf'}).type,null);
assert.equal(intake.classify('fattura_TD040.pdf'),'ALTRO');
assert.equal(admin.classify({filename:'fattura_TD040.pdf'}).type,null);
console.log('PASS: classificazione coerente tra intake e registro amministrativo');
