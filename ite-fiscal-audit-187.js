/* I.T.E. 4.0.187 — audit documentale TEST: lettura sola, nessuna emissione fiscale. */
(function(root){"use strict";
const clone=x=>JSON.parse(JSON.stringify(x));
const safe=s=>{let v=String(s==null?"":s).replace(/[\r\n\t]/g," ").slice(0,500);return /^[\s]*[=+@\-]/.test(v)?"'"+v:v};
const csv=s=>'"'+safe(s).replace(/"/g,'""')+'"';
function audit(store){
 const F=root.ITE_FiscalTest183;if(!F)throw Error("MOTORE_FISCALE_ASSENTE");
 if(!store||store.schema!=="ITE_FISCAL_TEST_183"||!Array.isArray(store.documents))throw Error("ARCHIVIO_INVALIDO");
 const issues=[],byType={},byStatus={},byVat={},links=new Map(),keys=new Set(),rows=[];
 for(const d of store.documents){
  const id=String(d&&d.id||"");let valid=true;
  try{
   const errs=F.validate(d);if(errs.length){issues.push(...errs.map(code=>({id,code})));valid=false}
   if(!valid)continue;
   const t=F.totals(d);
   if(JSON.stringify(t)!==JSON.stringify(d.totals)){issues.push({id,code:"TOTALE_ALTERATO"});continue}
   const key=d.type+"|"+d.date.slice(0,4)+"|"+d.number.trim().toUpperCase();
   if(keys.has(key))issues.push({id,code:"NUMERO_DUPLICATO"});keys.add(key);
   if(d.sourceQuoteId){if(d.type!=="PROFORMA")issues.push({id,code:"COLLEGAMENTO_NON_PROFORMA"});if(links.has(d.sourceQuoteId))issues.push({id,code:"PREVENTIVO_DUPLICATO"});links.set(d.sourceQuoteId,id)}
   if(d.type==="TD04"&&d.reference&&d.reference.date>d.date)issues.push({id,code:"TD04_DATA_PRECEDENTE"});
   const state=d.status||"BOZZA";
   for(const [map,key] of [[byType,d.type],[byStatus,state]]){const a=map[key]||(map[key]={count:0,netCents:0,vatCents:0,totalCents:0});a.count++;a.netCents+=t.netCents;a.vatCents+=t.vatCents;a.totalCents+=t.totalCents}
   for(const [rate,v] of Object.entries(t.vatGroups)){const a=byVat[rate]||(byVat[rate]={netCents:0,vatCents:0});a.netCents+=v.netCents;a.vatCents+=v.vatCents}
   rows.push({id,type:d.type,number:d.number,date:d.date,counterparty:d.counterparty,status:state,sourceQuoteId:d.sourceQuoteId||"",netCents:t.netCents,vatCents:t.vatCents,totalCents:t.totalCents});
  }catch(e){issues.push({id,code:"DOCUMENTO_NON_CALCOLABILE"})}
 }
 return clone({valid:issues.length===0,count:rows.length,issues,byType,byStatus,byVat,rows});
}
function exportCSV(store){
 const report=audit(store);if(!report.valid)throw Error("ARCHIVIO_INCOERENTE");
 const header=["ID","Tipo","Numero","Data","Controparte","Stato","Preventivo","Imponibile EUR","IVA EUR","Totale EUR"];
 const lines=[header.map(csv).join(";")];
 for(const r of report.rows){lines.push([r.id,r.type,r.number,r.date,r.counterparty,r.status,r.sourceQuoteId,(r.netCents/100).toFixed(2),(r.vatCents/100).toFixed(2),(r.totalCents/100).toFixed(2)].map(csv).join(";"))}
 return "\uFEFF"+lines.join("\r\n")+"\r\n";
}
const api=Object.freeze({audit,exportCSV});if(typeof module!=="undefined"&&module.exports)module.exports=api;root.ITE_FiscalAudit187=api;
})(typeof globalThis!=="undefined"?globalThis:this);
