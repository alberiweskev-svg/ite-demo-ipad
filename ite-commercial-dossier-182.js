/* I.T.E. 4.0.182 — synthetic intervention commercial dossier; read-only, no fiscal issuance. */
(function(root){"use strict";
const copy=x=>JSON.parse(JSON.stringify(x));
const arr=x=>Array.isArray(x)?x:[];
const cents=x=>Number.isFinite(x)&&x>=0&&Number.isSafeInteger(Math.round(x*100))?Math.round(x*100):null;
function build(field,commerce){
 if(!field||!commerce||!Array.isArray(field.interventions)||!Array.isArray(commerce.extras)||!Array.isArray(commerce.quotes))throw Error("ARCHIVI_NON_DISPONIBILI");
 const issues=[],records=[],used=new Set(),interventions=new Map(arr(field.interventions).map(x=>[x.id,x]));
 const extraMap=new Map();
 for(const x of commerce.extras){if(extraMap.has(x.id))issues.push({code:"EXTRA_DUPLICATO",id:x.id});extraMap.set(x.id,x);if(!interventions.has(x.interventionId))issues.push({code:"EXTRA_ORFANO",id:x.id})}
 const quoteIds=new Set();
 for(const q of commerce.quotes){if(quoteIds.has(q.id))issues.push({code:"PREVENTIVO_DUPLICATO",id:q.id});quoteIds.add(q.id);
 const i=interventions.get(q.interventionId);if(!i){issues.push({code:"PREVENTIVO_ORFANO",id:q.id});continue}
 let total=0,valid=true;const kinds={FORNITURA:0,POSA:0,SMONTAGGIO:0,SMALTIMENTO:0,ALTRO:0};
 for(const id of arr(q.extraIds)){const x=extraMap.get(id);
 if(!x||x.interventionId!==q.interventionId||x.status!=="ACCETTATO"){issues.push({code:"RIGA_NON_AMMISSIBILE",id:q.id+":"+id});valid=false;continue}
 const amount=cents(x.unitPrice*x.quantity);if(amount===null||!Number.isFinite(x.quantity)||x.quantity<=0){issues.push({code:"IMPORTO_NON_VALIDO",id:x.id});valid=false;continue}
 total+=amount;kinds[x.kind]=(kinds[x.kind]||0)+amount;
 const key=q.interventionId+":"+id;if(used.has(key)&&q.status!=="ANNULLATO")issues.push({code:"EXTRA_IN_PIU_PREVENTIVI",id:key});if(q.status!=="ANNULLATO")used.add(key);
 }
 if(!valid||total!==q.totalCents)issues.push({code:"TOTALE_NON_COINCIDE",id:q.id});
 records.push({id:q.id,interventionId:q.interventionId,clientId:i.clientId||"",siteId:i.siteId||"",status:q.status,lines:arr(q.extraIds).length,totalCents:total,kinds});
 }
 const stats={quotes:records.length,openCents:0,acceptedCents:0,rejectedCents:0,extrasPending:0};
 for(const r of records){if(r.status==="ACCETTATO")stats.acceptedCents+=r.totalCents;else if(r.status==="DA_ACCETTARE")stats.openCents+=r.totalCents;else if(r.status==="NON_ACCETTATO")stats.rejectedCents+=r.totalCents}
 stats.extrasPending=commerce.extras.filter(x=>x.status==="PROPOSTO").length;
 return copy({schema:"ITE_DOSSIER_182",valid:issues.length===0,stats,records,issues});
}
function csv(dossier){if(!dossier||dossier.schema!=="ITE_DOSSIER_182")throw Error("DOSSIER_NON_VALIDO");
 const safe=v=>{let s=String(v??"");if(/^[\s]*[=+@\-\t\r]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';};
 const lines=[["Preventivo","Intervento","Cliente","Sede","Stato","Righe","Fornitura EUR","Posa EUR","Smontaggio EUR","Smaltimento EUR","Altro EUR","Totale EUR"]];
 for(const r of dossier.records)lines.push([r.id,r.interventionId,r.clientId,r.siteId,r.status,r.lines,...["FORNITURA","POSA","SMONTAGGIO","SMALTIMENTO","ALTRO"].map(k=>((r.kinds[k]||0)/100).toFixed(2)),(r.totalCents/100).toFixed(2)]);
 return "\uFEFF"+lines.map(row=>row.map(safe).join(";")).join("\r\n")+"\r\n";
}
const api=Object.freeze({build,csv});if(typeof module!=="undefined"&&module.exports)module.exports=api;root.ITE_CommercialDossier182=api;
})(typeof globalThis!=="undefined"?globalThis:this);
