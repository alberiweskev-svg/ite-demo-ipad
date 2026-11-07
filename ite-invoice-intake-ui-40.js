/* I.T.E. 4.0.54 — batch selection, stale-review guard, local pre-import backup. TEST ONLY. */
(function(){
"use strict";
const ledger=globalThis.ITEInvoiceLedger40,intake=globalThis.ITEInvoiceIntake40;
if(!ledger||!intake||typeof document==="undefined")return;
const KEY="ITE-4-INVOICES-TEST-1";
const make=(tag,value)=>{const el=document.createElement(tag);if(value!==undefined)el.textContent=String(value);return el;};
const section=make("section");section.className="panel";section.id="ite-invoice-intake-test";
section.append(make("h2","Revisione lotti fatture — TEST 4.0.54"),make("p","Solo dati fittizi. Nessun invio a server. Selezionare singolarmente i documenti da importare; prima del salvataggio viene scaricata una copia di sicurezza dell'archivio TEST."));
const sample=[{id:"TEST-LOTTO-001",number:"PR-001",party:"Fornitore TEST",issuer:"Fornitore TEST",date:"2026-11-07",lines:[{quantity:1,unitPrice:100,vat:10}],expectedTotal:110}];
const input=make("textarea");input.rows=9;input.value=JSON.stringify(sample,null,2);input.setAttribute("aria-label","Lotto JSON fittizio");
const actions=make("div");actions.className="actions";
const inspectButton=make("button","Analizza lotto"),importButton=make("button","Importa selezionati");
inspectButton.type=importButton.type="button";importButton.disabled=true;actions.append(inspectButton,importButton);
const status=make("p");status.setAttribute("role","status");
const summary=make("p"),results=make("div");
section.append(input,actions,status,summary,results);
let review=null;
function load(){const raw=localStorage.getItem(KEY);return raw?ledger.importJson(raw):ledger.empty();}
function reset(){review=null;importButton.disabled=true;summary.textContent="";results.replaceChildren();}
function selected(){return review?Array.from(review.checks.entries()).filter(([i,check])=>check.checked).map(([i])=>i):[];}
function refresh(){
 if(!review)return;
 try{const p=intake.plan(review.db,review.records,selected());summary.textContent=p.totals.count+" selezionati · Imponibile € "+p.totals.taxable.toFixed(2)+" · IVA € "+p.totals.vat.toFixed(2)+" · Totale € "+p.totals.total.toFixed(2)+" · Da verificare: "+p.reviewCount;importButton.disabled=!p.totals.count;}
 catch(e){status.textContent=e.message;importButton.disabled=true;}
}
input.addEventListener("input",()=>{reset();status.textContent="Lotto modificato: ripetere l'analisi prima di importare.";});
inspectButton.addEventListener("click",()=>{
 reset();
 try{
  const raw=localStorage.getItem(KEY),db=raw?ledger.importJson(raw):ledger.empty();
  const records=JSON.parse(input.value),rows=intake.inspect(db,records);
  const checks=new Map();
  for(const row of rows){
   const wrap=make("div");wrap.className="item";
   if(row.status==="READY"){
    const label=make("label"),check=make("input");check.type="checkbox";check.style.width="auto";check.checked=false;checks.set(row.index,check);
    label.append(check,document.createTextNode(" Seleziona documento "+(row.index+1)));wrap.append(label);check.addEventListener("change",refresh);
   }
   wrap.append(make("p",(row.number||"Senza numero")+" · "+row.type+" · "+row.status+" · "+(row.issues.join("; ")||(row.amounts?"€ "+row.amounts.total.toFixed(2):""))));
   results.append(wrap);
  }
  review={db,raw,records,checks};
  status.textContent=rows.filter(r=>r.status==="READY").length+" documenti pronti su "+rows.length+". Selezionare solo quelli verificati.";
  refresh();
 }catch(e){status.textContent="Analisi non riuscita: "+e.message;}
});
function downloadBackup(json){
 const blob=new Blob([json],{type:"application/json"});
 const url=URL.createObjectURL(blob),a=make("a");a.href=url;a.download="ITE-4-backup-fatture-TEST-prima-importazione.json";
 document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
}
importButton.addEventListener("click",()=>{
 if(!review)return;
 try{
  if(input.value!==JSON.stringify(review.records,null,2)&&JSON.stringify(JSON.parse(input.value))!==JSON.stringify(review.records))throw Error("Lotto cambiato: ripetere analisi");
  if(localStorage.getItem(KEY)!==review.raw)throw Error("Archivio cambiato: ripetere analisi");
  const indices=selected(),plan=intake.plan(review.db,review.records,indices);
  if(!indices.length)return;
  if(!confirm("Importare "+indices.length+" documenti TEST per € "+plan.totals.total.toFixed(2)+"? Verrà scaricato un backup preventivo."))return;
  const next=intake.apply(review.db,review.records,indices);
  const oldJson=ledger.exportJson(review.db),nextJson=ledger.exportJson(next);
  downloadBackup(oldJson);
  localStorage.setItem(KEY,nextJson);
  status.textContent="Importati "+indices.length+" documenti TEST. Backup richiesto al browser. Aggiornare il pannello fatture per visualizzare i nuovi dati.";
  reset();
 }catch(e){status.textContent="Importazione annullata: "+e.message;importButton.disabled=true;}
});
(document.querySelector("#ite-invoices-test")||document.querySelector("main .wrap")||document.body).append(section);
})();
