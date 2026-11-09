/* I.T.E. 4.0.112 — financial audit in unified TEST demo. */
(function(root){"use strict";
if(!root.document||!root.ITEWorkflow100||!root.ITEFinancialAudit112)return;
const doc=root.document,base=root.ITEWorkflow100,audit=root.ITEFinancialAudit112,KEY="ITE-WORKFLOW-TEST-101";
const section=doc.createElement("section");section.className="panel";section.id="ite-financial-audit-112";
section.innerHTML='<h2>Verifica contabile e sicurezza bozze — 4.0.112 TEST</h2><p class="hint">Controllo in sola lettura: righe, quantità, approvazioni, proforma, TD04 e clienti. Non emette fatture.</p><label>Ambito <select id="audit112-client"></select></label><div class="actions"><button type="button" id="audit112-run">Esegui verifica</button><button type="button" id="audit112-export">Esporta JSON TEST</button></div><p id="audit112-status" role="status" aria-live="polite"></p><div id="audit112-result"></div>';
(doc.querySelector(".wrap")||doc.body).appendChild(section);
const el=id=>section.querySelector("#audit112-"+id),read=()=>base.importJSON(root.localStorage.getItem(KEY)||base.exportJSON(base.fresh()));
function refresh(){const previous=el("client").value,s=read();el("client").replaceChildren(new Option("Tutti i clienti TEST",""),...s.records.clients.map(c=>new Option(c.name||c.id,c.id)));if(s.records.clients.some(c=>c.id===previous))el("client").value=previous;}
function compute(){return audit.inspect(read(),el("client").value||undefined);}
function show(r){const out=el("result");out.replaceChildren();const h=doc.createElement("h3");h.textContent="Anomalie: "+r.issues.length;out.append(h);for(const i of r.issues){const p=doc.createElement("p");p.textContent=i.code+" — "+(i.invoiceId||"Archivio")+" — "+i.detail;out.append(p);}for(const c of r.clients){const p=doc.createElement("p");p.textContent=c.clientId+" | Vendite "+(c.salesCents/100).toFixed(2)+" EUR | TD04 "+(c.creditsCents/100).toFixed(2)+" EUR | Netto "+(c.netSalesCents/100).toFixed(2)+" EUR | Proforma "+(c.proformaCents/100).toFixed(2)+" EUR | Acquisti "+(c.purchasesCents/100).toFixed(2)+" EUR";out.append(p);}el("status").textContent="Revisione "+r.revision+" — "+(r.valid?"Controlli superati":"Anomalie da correggere")+" — Nessuna emissione fiscale.";}
function run(fn){try{refresh();fn();}catch(e){el("status").textContent="Verifica non eseguita: "+e.message;}}
el("run").addEventListener("click",()=>run(()=>show(compute())));
el("export").addEventListener("click",()=>run(()=>{const r=compute();show(r);const url=URL.createObjectURL(new Blob([JSON.stringify(r,null,2)],{type:"application/json"})),a=doc.createElement("a");a.href=url;a.download="ite-audit-112-TEST.json";a.click();root.setTimeout(()=>URL.revokeObjectURL(url),1000);}));
root.addEventListener("storage",e=>{if(e.key===KEY)run(refresh);});run(refresh);
})(typeof window!=="undefined"?window:globalThis);
