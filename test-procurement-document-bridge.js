'use strict';
const assert=require('node:assert/strict');
const adapter=require('./ite-procurement-document-bridge.js');
const reconciliation=require('./ite-core-reconciliation.js');
const core={clienti:[],immobili:[],impianti:[],apparecchiature:[],appuntamenti:[],interventi:[]};
const docs=[
 {id:'Q-1',type:'Preventivo fornitore',supplierId:'SUP-1',lines:[{code:'VAL-01',unitPrice:10},{code:'TUB-02',unitPrice:20}]},
 {id:'F-1',type:'Fattura acquisto',supplierId:'SUP-1',supplierQuoteId:'Q-1',lines:[{code:'VAL-01',unitPrice:11},{code:'TUB-02',unitPrice:20}]}
];
const original=JSON.stringify(docs);
let data=adapter.merge({documents:docs});
assert.equal(data.quotes.length,1);assert.equal(data.invoices.length,1);
let report=reconciliation.inspect(core,{documents:docs});
assert.equal(report.supplierAudit.length,1);
assert.equal(report.supplierAudit[0].status,'DIFFERENZE');
assert.equal(report.supplierAudit[0].differences[0].kind,'AUMENTO');
assert.equal(report.supplierAudit[0].differences[0].percent,10);
assert.equal(JSON.stringify(docs),original);
report=reconciliation.inspect(core,{documents:[...docs,{id:'PR-1',type:'Proforma acquisto',supplierId:'SUP-1',lines:[{code:'VAL-01',unitPrice:1}]}]});
assert.equal(report.supplierAudit.length,1);
data=adapter.merge({documents:[...docs,{...docs[1],id:'F-2',supplierQuoteId:''}]});
assert.ok(data.issues.some(x=>x.code==='EXPLICIT_QUOTE_LINK_MISSING'));
data=adapter.merge({documents:[...docs,{id:'F-3',type:'Fattura acquisto',supplierId:'SUP-1',lines:[]}]});
assert.ok(data.issues.some(x=>x.code==='SUPPLIER_LINES_NEED_REVIEW'));
data=adapter.merge({documents:docs,purchaseInvoices:[{id:'F-1',supplierId:'SUP-1',supplierQuoteId:'Q-1',lines:[{code:'VAL-01',unitPrice:11}]}]});
assert.ok(data.issues.some(x=>x.code==='INVOICE_SOURCE_COLLISION'));
assert.equal(data.invoices.length,1);
console.log('Procurement document bridge: 6 synthetic checks passed');
