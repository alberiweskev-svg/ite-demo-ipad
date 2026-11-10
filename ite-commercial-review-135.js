/* I.T.E. 4.0.135 — commercial review, TEST only; never emits invoices or sends data. */
(function(root){"use strict";
const clone=x=>JSON.parse(JSON.stringify(x));
const str=x=>String(x??"").trim();
const cents=x=>Math.round((Number(x)+Number.EPSILON)*100);
const euro=x=>Math.round(x)/100;
function classify({filename="",text="",issuerIsITE=false}={}){
 const raw=(str(filename)+" "+str(text)).toUpperCase();
 const td04=/\bTD[\s._-]?04\b|NOTA\s+DI\s+CREDITO/.test(raw);
 const proforma=/\bPRO[\s-]?FORMA\b|\bPROFORMA\b|\bPR[\s._-]?[0-9]+\b/.test(raw);
 const courtesy=/COPIA\s+DI\s+CORTESIA/.test(raw);
 const kind=td04?"TD04":proforma?"PROFORMA":issuerIsITE?"VENDITA":"ACQUISTO";
 return {kind,confidence:td04||proforma?"INDIZIO":"DA_VERIFICARE",courtesy,requiresReview:true,notice:"Classificazione indicativa; non è una fattura emessa né una registrazione contabile."};
}
function inspect(state){
 if(!state||state.schema!=="ITE_OPERATIONS_123")throw Error("WORKSPACE_NON_VALIDO");
 const result=root.ITE_Audit124.audit(state);
 if(!result.ok)throw Error("AUDIT_NON_SUPERATO");
 const issues=[],rows=[],invoices=state.commercial.invoices,aps=state.field.catalog.appointments;
 const byId=new Map(invoices.map(i=>[i.id,i]));
 const sums={sales:0,purchases:0,proforma:0,credits:0,netSales:0};
 for(const d of invoices){
  const amount=cents(d.totals?.gross);
  if(!Number.isSafeInteger(amount)||amount<0){issues.push({id:d.id,code:"TOTALE_NON_VALIDO"});continue;}
  const expected=root.ITE_Commercial122.totals(d.lines);
  if(cents(expected.gross)!==amount)issues.push({id:d.id,code:"TOTALE_NON_COINCIDENTE"});
  const ap=d.appointmentId?aps.find(a=>a.id===d.appointmentId):null;
  if(d.appointmentId&&(!ap||ap.clientId!==d.clientId||ap.siteId!==d.siteId))issues.push({id:d.id,code:"APPUNTAMENTO_NON_COERENTE"});
  if(!d.appointmentId)issues.push({id:d.id,code:"NON_ATTRIBUITO_A_INTERVENTO",severity:"INFO"});
  if(d.type==="VENDITA")sums.sales+=amount;
  else if(d.type==="ACQUISTO")sums.purchases+=amount;
  else if(d.type==="PROFORMA")sums.proforma+=amount;
  else if(d.type==="TD04")sums.credits+=amount;
  else issues.push({id:d.id,code:"TIPO_NON_RICONOSCIUTO"});
  rows.push({id:d.id,type:d.type,clientId:d.clientId,siteId:d.siteId,appointmentId:d.appointmentId||null,gross:euro(amount),status:d.status||"DA_VERIFICARE"});
 }
 for(const d of invoices.filter(x=>x.type==="TD04")){
  const orig=byId.get(d.originalId);
  if(!orig||orig.type!=="VENDITA"||orig.clientId!==d.clientId||orig.siteId!==d.siteId)issues.push({id:d.id,code:"ORIGINE_TD04_INCOERENTE"});
  else if(d.appointmentId&&d.appointmentId!==orig.appointmentId)issues.push({id:d.id,code:"COLLEGAMENTO_TD04_INCOERENTE"});
 }
 for(const d of invoices.filter(x=>x.type==="VENDITA")){
  const credited=invoices.filter(x=>x.type==="TD04"&&x.originalId===d.id).reduce((a,x)=>a+cents(x.totals.gross),0);
  if(credited>cents(d.totals.gross))issues.push({id:d.id,code:"TD04_SUPERA_FATTURA"});
 }
 sums.netSales=sums.sales-sums.credits;
 return clone({revision:state.revision,rows,issues,totals:Object.fromEntries(Object.entries(sums).map(([k,v])=>[k,euro(v)])),notice:"TEST: proforma esclusa dalle vendite; acquisti separati; TD04 sottratte una sola volta. Nessuna registrazione fiscale."});
}
const api=Object.freeze({classify,inspect});
if(typeof module!=="undefined"&&module.exports)module.exports=api;
root.ITE_CommercialReview135=api;
})(typeof globalThis!=="undefined"?globalThis:this);
