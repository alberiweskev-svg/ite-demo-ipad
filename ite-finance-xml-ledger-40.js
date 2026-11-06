(function(root){'use strict';
const intake=root.ITE40FinanceIntake||(typeof module!=='undefined'?require('./ite-finance-intake-40.js'):null);
const TEST=/^TEST-[A-Za-z0-9_-]{1,70}$/;
function convert(preview,review){
 if(!preview||preview.status!=='ANTEPRIMA_NON_REGISTRATA'||!['TD01','TD04','TD24','TD25'].includes(preview.type))throw Error('ANTEPRIMA_NON_VALIDA');
 if(!review||!TEST.test(review.id||'')||!TEST.test(review.subjectId||''))throw Error('SOLO_DATI_TEST');
 if(!['ACQUISTO','VENDITA'].includes(review.direction))throw Error('DIREZIONE_DA_CONFERMARE');
 if(review.confirmed!==true)throw Error('CONFERMA_UMANA_OBBLIGATORIA');
 if(!Array.isArray(review.lines)||!review.lines.length)throw Error('RIGHE_DA_VERIFICARE');
 const doc={id:review.id,subjectId:review.subjectId,direction:review.direction,type:preview.type,number:preview.number,issuedAt:preview.issuedAt,taxable:preview.taxable,vat:preview.vat,total:preview.total,lines:review.lines.map(l=>({kind:l.kind,description:l.description,quantity:l.quantity,unitPrice:l.unitPrice}))};
 return intake.normalize(doc);
}
function register(ledger,preview,review){
 if(!ledger||typeof ledger.add!=='function')throw Error('ARCHIVIO_ASSENTE');
 const doc=convert(preview,review);
 return ledger.add(doc);
}
const api=Object.freeze({convert,register});root.ITE40FinanceXmlLedger=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
