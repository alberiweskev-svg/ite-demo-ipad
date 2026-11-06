/* I.T.E. 4.0 - riconciliazione documenti TEST con anagrafiche, senza modificare gli archivi. */
(function(root){'use strict';
const TEST=/^TEST-[A-Za-z0-9_-]{1,70}$/;
const validId=x=>typeof x==='string'&&TEST.test(x);
const cents=x=>{if(!Number.isSafeInteger(x)||x<0)throw Error('IMPORTO_NON_VALIDO');return x;};
function indexSubjects(subjects){
 if(!Array.isArray(subjects)||subjects.length>10000)throw Error('ANAGRAFICHE_NON_VALIDE');
 const map=new Map();
 for(const s of subjects){
  if(!s||!validId(s.id)||map.has(s.id))throw Error('ANAGRAFICA_DUPLICATA_O_NON_TEST');
  map.set(s.id,s);
 }
 return map;
}
function reconcile(documents,subjects,options){
 if(!Array.isArray(documents)||documents.length>5000)throw Error('DOCUMENTI_NON_VALIDI');
 const byId=indexSubjects(subjects), allowed=new Set(['ACQUISTO','VENDITA']);
 const seen=new Set(),rows=[],issues=[];
 for(const d of documents){
  if(!d||!validId(d.id)||seen.has(d.id))throw Error('DOCUMENTO_DUPLICATO_O_NON_TEST');
  seen.add(d.id);
  if(!validId(d.subjectId)||!allowed.has(d.direction))throw Error('DOCUMENTO_NON_VALIDO');
  const subject=byId.get(d.subjectId);
  const flags=[];
  if(!subject)flags.push('ANAGRAFICA_ASSENTE');
  else if(subject.role&&((d.direction==='ACQUISTO'&&subject.role!=='FORNITORE')||(d.direction==='VENDITA'&&subject.role!=='CLIENTE')))flags.push('RUOLO_INCOERENTE');
  const total=cents(d.totalCents),taxable=cents(d.taxableCents),vat=cents(d.vatCents);
  if(Math.abs(taxable+vat-total)>1)flags.push('TOTALI_INCOERENTI');
  if(!Array.isArray(d.lines)||!d.lines.length||d.lines.some(l=>!['FORNITURA','POSA'].includes(l.kind)))flags.push('RIGHE_NON_CLASSIFICATE');
  const recovered=d.credit?cents(d.recoveredCents||0):0;
  if(recovered>total)flags.push('RECUPERO_ECCESSIVO');
  if(d.credit&&d.type!=='TD04')flags.push('TIPO_CREDITO_INCOERENTE');
  if(d.proforma&&d.type!=='PR')flags.push('TIPO_PROFORMA_INCOERENTE');
  if(d.credit&&d.proforma)flags.push('TIPI_INCOMPATIBILI');
  const row={documentId:d.id,subjectId:d.subjectId,subjectName:subject?String(subject.name||subject.ragioneSociale||subject.id):null,direction:d.direction,type:d.type,totalCents:total,credit:!!d.credit,proforma:!!d.proforma,recoveredCents:recovered,outstandingCreditCents:d.credit?total-recovered:0,flags};
  rows.push(row);for(const code of flags)issues.push({documentId:d.id,code});
 }
 const totals={acquistiCents:0,venditeCents:0,proformaCents:0,noteCreditoCents:0,creditiResiduiCents:0};
 for(const row of rows){
  if(row.credit){totals.noteCreditoCents+=row.totalCents;totals.creditiResiduiCents+=row.outstandingCreditCents;}
  else if(row.proforma)totals.proformaCents+=row.totalCents;
  else if(row.direction==='ACQUISTO')totals.acquistiCents+=row.totalCents;
  else totals.venditeCents+=row.totalCents;
 }
 if(Object.values(totals).some(v=>!Number.isSafeInteger(v)))throw Error('TOTALI_ECCESSIVI');
 return {status:issues.length?'DA_VERIFICARE':'COERENTE',rows,issues,totals,documentCount:rows.length,subjectCount:byId.size};
}
const api=Object.freeze({reconcile,indexSubjects});root.ITE40FinanceReconciliation=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
