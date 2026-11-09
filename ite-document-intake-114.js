/* I.T.E. 4.0.114 — document intake, metadata only; no PDF upload or persistence. */
(function(root){
"use strict";
const clean=s=>String(s==null?"":s).replace(/\s+/g," ").trim();
const norm=s=>clean(s).normalize("NFD").replace(/[\u0300-\u036f]/g,"").toUpperCase();
const money=s=>{const v=clean(s).replace(/[^\d,.-]/g,"");if(!v)return null;const n=Number(v.includes(",")?v.replace(/\./g,"").replace(",","."):v);return Number.isFinite(n)?Math.round(n*100)/100:null};
const patterns={
 DICO:/\b(?:DI\.?CO\.?|DICHIARAZIONE DI CONFORMITA)\b/i,
 DIRI:/\b(?:DI\.?RI\.?|DICHIARAZIONE DI RISPONDENZA)\b/i,
 GAS:/\b(?:ALLEGATI? (?:OBBLIGATORI )?(?:GAS|TECNICI)|DELIBERA 40\/2014|ALLEGATO (?:H|I)\/40)\b/i,
 POS:/\b(?:PIANO OPERATIVO DI SICUREZZA|P\.?O\.?S\.?)\b/i,
 PROFORMA:/\b(?:PRO\s?FORMA|PROFORMA|AVVISO DI PAGAMENTO)\b/i,
 TD04:/\b(?:TD04|NOTA DI CREDITO)\b/i,
 FATTURA:/\b(?:FATTURA|TD01|TD24)\b/i,
 LISTINO:/\b(?:LISTINO PREZZI|CATALOGO PREZZI)\b/i
};
function classify(text,filename){
 const s=norm(text+" "+filename);
 for(const k of ["TD04","PROFORMA","DIRI","DICO","GAS","POS","LISTINO","FATTURA"])if(patterns[k].test(s))return k;
 return "DA_VERIFICARE";
}
function extract(text,filename){
 const s=String(text||"").slice(0,100000), type=classify(s,filename);
 const find=re=>{const m=s.match(re);return m?clean(m[1]):null};
 const number=find(/(?:numero|n\.|nr\.?|fattura\s*n\.?)[\s:#-]*([A-Z0-9\/-]{1,35})/i);
 const date=find(/(?:data|del)[\s:]*([0-3]?\d[\/.-][01]?\d[\/.-](?:20)?\d{2})/i);
 const total=money(find(/(?:totale\s+(?:documento|fattura|da pagare)|importo\s+totale)[\s:€]*([\d.,]+)/i));
 const taxable=money(find(/(?:imponibile)[\s:€]*([\d.,]+)/i));
 const vat=money(find(/(?:totale\s+iva|iva\s+totale)[\s:€]*([\d.,]+)/i));
 return {type,filename:clean(filename).slice(0,180),number,date,total:total==null?null:Math.abs(total),taxable,vat,confidence:type==="DA_VERIFICARE"?"low":"heuristic",requiresReview:true};
}
function validate(meta,links){
 const issues=[];const type=meta&&meta.type;
 if(!meta||!patterns[type]&&type!=="DA_VERIFICARE")issues.push("Tipo documento non valido");
 if(!links||!links.clientId)issues.push("Cliente/fornitore da associare manualmente");
 if(["DICO","DIRI","GAS"].includes(type)&&(!links||!links.siteId||!links.plantId))issues.push("Sede e impianto obbligatori per documenti tecnici");
 if(type==="TD04"&&(!links||!links.originalInvoiceId))issues.push("TD04: fattura originaria obbligatoria");
 if(["FATTURA","PROFORMA","TD04"].includes(type)&&meta.total==null)issues.push("Totale non rilevato");
 return {ok:issues.length===0,issues};
}
function draft(text,filename,links){
 const meta=extract(text,filename),check=validate(meta,links);
 return {metadata:meta,links:Object.assign({},links||{}),validation:check,status:"DA_VERIFICARE",source:"TEST_LOCAL_ONLY",pdfStored:false};
}
const api=Object.freeze({classify,extract,validate,draft,money});
if(typeof module!=="undefined"&&module.exports)module.exports=api;
root.ITE_DocumentIntake114=api;
})(typeof globalThis!=="undefined"?globalThis:this);
