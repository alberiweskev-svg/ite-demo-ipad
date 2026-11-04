/* I.T.E. 4.0 — bridge verificato fra staging documentale e archivio contabile. */
(function(root){'use strict';
const Intake=root.ITEDocumentIntake||(typeof require==='function'?require('./ite-document-intake.js'):null);
const Commerce=root.ITECommerce||(typeof require==='function'?require('./ite-commerce.js'):null);
function preview(queue,documentId){
 const s=Intake.validate(queue),x=s.items.find(x=>x.id===documentId);
 if(!x)throw Error('DOCUMENTO_NON_TROVATO');
 const kind=x.type==='TD04'?'TD04':x.type==='PROFORMA'?'PROFORMA':x.type==='FATTURA_ACQUISTO'||x.type==='FATTURA_VENDITA'?'FATTURA':null;
 const direction=x.type==='FATTURA_ACQUISTO'?'ACQUISTO':x.type==='FATTURA_VENDITA'?'VENDITA':null;
 return {id:x.id,kind,direction,number:x.number||'',date:x.documentDate||'',ready:x.status==='VERIFICATO'&&!!kind&&!!direction&&!!x.number,requiresReview:true};
}
function importInvoice(queue,commerce,master,documentId,invoice){
 const p=preview(queue,documentId);
 if(!p.ready||!invoice||!invoice.id||invoice.kind!==p.kind||invoice.direction!==p.direction||invoice.number!==p.number||!Number.isSafeInteger(invoice.netCents)||invoice.netCents<0||!Number.isSafeInteger(invoice.vatCents)||invoice.vatCents<0||invoice.netCents+invoice.vatCents>1e11)throw Error('IMPORTAZIONE_RICHIEDE_VERIFICA');
 const next=Commerce.addInvoice(commerce,master,{...invoice,totalCents:invoice.netCents+invoice.vatCents,date:p.date});
 const archived=Intake.archive(queue,documentId);
 return {intake:archived,commerce:next};
}
const api=Object.freeze({preview,importInvoice});root.ITEDocumentIntakeCommerceBridge=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
