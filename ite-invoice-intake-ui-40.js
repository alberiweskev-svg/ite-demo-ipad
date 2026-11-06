/* I.T.E. 4.0.53 — reviewed invoice batch TEST panel; no network or PDF uploads. */
(function(){
"use strict";
const ledger=globalThis.ITEInvoiceLedger40,intake=globalThis.ITEInvoiceIntake40;
if(!ledger||!intake)return;
const KEY="ITE-4-INVOICES-TEST-1";
const make=(tag,text)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=String(text);return e;};
const section=make("section");section.className="panel";section.id="ite-invoice-intake-test";
section.append(make("h2","Revisione lotti fatture — TEST 4.0.53"),make("p","Inserire esclusivamente dati fittizi in formato JSON. La revisione non importa nulla senza approvazione esplicita. Nessun PDF viene caricato."));
const sample=[{id:"TEST-LOTTO-001",number:"PR-001",party:"Fornitore TEST",issuer:"Fornitore TEST",date:"2026-11-07",lines:[{quantity:1,unitPrice:100,vat:10}],expectedTotal:110}];
const textarea=make("textarea");textarea.rows=9;textarea.value=JSON.stringify(sample,null,2);textarea.setAttribute("aria-label","Lotto JSON fittizio");
const actions=make("div");actions.className="actions";const reviewButton=make("button","Analizza lotto TEST"),applyButton=make("button","Approva e importa documenti pronti");
reviewButton.type=applyButton.type="button";applyButton.disabled=true;actions.append(reviewButton,applyButton);
const output=make("div"),status=make("p");status.setAttribute("role","status");section.append(textarea,actions,status,output);
let proposed=null,accepted=[];
function load(){const raw=localStorage.getItem(KEY);return raw?ledger.importJson(raw):ledger.empty();}
reviewButton.addEventListener("click",()=>{output.replaceChildren();applyButton.disabled=true;proposed=null;accepted=[];try{
 const records=JSON.parse(textarea.value);const rows=intake.inspect(load(),records);
 proposed=records;accepted=rows.filter(r=>r.status==="READY").map(r=>r.index);
 for(const r of rows){const item=make("p",String(r.index+1)+". "+(r.number||"Senza numero")+" — "+r.status+" — "+r.type+" — "+(r.issues.join("; ")||"€ "+r.amounts.total.toFixed(2)));output.append(item);}
 status.textContent=accepted.length+" documenti pronti su "+rows.length+"; i documenti da verificare sono esclusi.";
 applyButton.disabled=accepted.length===0;
}catch(e){status.textContent="Lotto non valido: "+e.message;}});
applyButton.addEventListener("click",()=>{if(!proposed||!accepted.length)return;
 if(!confirm("Importare "+accepted.length+" documenti TEST pronti nell'archivio locale?"))return;
 try{const next=intake.apply(load(),proposed,accepted);localStorage.setItem(KEY,ledger.exportJson(next));const result=intake.reconcile(next);status.textContent="Importati "+accepted.length+" documenti TEST. Residui: vendite € "+result.openSales.toFixed(2)+", acquisti € "+result.openPurchases.toFixed(2)+", TD04 € "+result.creditsToRecover.toFixed(2)+". Ricaricare la pagina per aggiornare il pannello fatture.";applyButton.disabled=true;proposed=null;accepted=[];}catch(e){status.textContent="Importazione annullata: "+e.message;}
});
(document.querySelector("#ite-invoices-test")||document.querySelector("main .wrap")||document.body).append(section);
})();
