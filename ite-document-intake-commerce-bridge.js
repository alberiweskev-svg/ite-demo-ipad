/* I.T.E. 4.0 — importazione documenti verificati; nessun PDF o dato personale inviato. */
(function(root){'use strict';
const Intake=root.ITEDocumentIntake||(typeof require==='function'?require('./ite-document-intake.js'):null);
const Commerce=root.ITECommerce||(typeof require==='function'?require('./ite-commerce.js'):null);
const TYPES={FATTURA_ACQUISTO:{kind:'FATTURA',direction:'ACQUISTO'},FATTURA_VENDITA:{kind:'FATTURA',direction:'VENDITA'},PROFORMA:{kind:'PROFORMA'},TD04:{kind:'TD04'}};
const DIRECTIONS=['ACQUISTO','VENDITA'];
function preview(queue,documentId){
 const s=Intake.validate(queue),x=s.items.find(item=>item.id===documentId);
 if(!x)throw Error('DOCUMENTO_NON_TROVATO');
 const type=TYPES[x.type]||null;
 return {id:x.id,kind:type?.kind||null,direction:type?.direction||null,number:x.number||'',date:x.documentDate||'',ready:x.status==='VERIFICATO'&&!!type&&!!String(x.number||'').trim()&&!!x.documentDate,requiresReview:true,directionRequiresReview:!!type&&!type.direction};
}
function importInvoice(queue,commerce,master,documentId,invoice){
 const p=preview(queue,documentId),c=Commerce.validate(commerce,master);
 if(!p.ready||!invoice||typeof invoice.id!=='string'||!invoice.id.trim()||invoice.kind!==p.kind||!DIRECTIONS.includes(invoice.direction)||p.direction&&invoice.direction!==p.direction||invoice.number!==p.number||!Number.isSafeInteger(invoice.netCents)||invoice.netCents<0||!Number.isSafeInteger(invoice.vatCents)||invoice.vatCents<0||!Number.isSafeInteger(invoice.netCents+invoice.vatCents)||invoice.netCents+invoice.vatCents>1e11)throw Error('IMPORTAZIONE_RICHIEDE_VERIFICA');
 if(c.invoices.some(f=>f.id===invoice.id||f.sourceDocumentId===documentId||f.kind===invoice.kind&&f.direction===invoice.direction&&f.number===invoice.number&&f.date===p.date))throw Error('DOCUMENTO_CONTABILE_DUPLICATO');
 const next=Commerce.addInvoice(c,master,{...invoice,totalCents:invoice.netCents+invoice.vatCents,date:p.date});
 const f=next.invoices.find(x=>x.id===invoice.id);
 f.source='DOCUMENTO_VERIFICATO';f.sourceDocumentId=documentId;
 const checked=Commerce.validate(next,master),archived=Intake.archive(queue,documentId);
 return {intake:archived,commerce:checked};
}
function importBatch(queue,commerce,master,requests){
 if(!Array.isArray(requests)||!requests.length||requests.length>100)throw Error('LOTTO_NON_VALIDO');
 let intake=Intake.validate(queue),accounting=Commerce.validate(commerce,master);
 const ids=new Set();
 for(const request of requests){
  if(!request||ids.has(request.documentId))throw Error('LOTTO_DUPLICATO');
  ids.add(request.documentId);
  const result=importInvoice(intake,accounting,master,request.documentId,request.invoice);
  intake=result.intake;accounting=result.commerce;
 }
 return {intake,commerce:accounting};
}
const api=Object.freeze({preview,importInvoice,importBatch});
root.ITEDocumentIntakeCommerceBridge=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
