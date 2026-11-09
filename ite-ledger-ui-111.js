/* I.T.E. 4.0.111 — unified commercial preflight, local TEST only. */
(function(root){ "use strict";
const base=root.ITEWorkflow100,ledger=root.ITELedger110,KEY="ITE-WORKFLOW-TEST-101";
if(!base||!ledger||!root.document||!root.document.body)return;
const doc=root.document,host=doc.createElement("section");host.className="panel";host.id="ite-ledger-111";
host.innerHTML='<h2>Controllo economico integrato — 4.0.111 TEST</h2><p class="hint">Verifica preventivi, Extra, vendite, proforma, acquisti e TD04 senza modificare i dati. Le bozze non sono documenti fiscali.</p><label>Cliente TEST<select id="ledger111-client"></select></label><div class="actions"><button type="button" id="ledger111-check">Controlla archivio</button><button type="button" id="ledger111-export">Esporta rapporto JSON</button></div><p id="ledger111-status" role="status" aria-live="polite"></p><div id="ledger111-summary" class="cards"></div><div id="ledger111-issues"></div>';
(doc.querySelector(".wrap")||doc.body).appendChild(host);
const find=id=>host.querySelector("#ledger111-"+id),money=c=>(c/100).toLocaleString("it-IT",{style:"currency",currency:"EUR"});
function read(){return base.importJSON(root.localStorage.getItem(KEY)||base.exportJSON(base.fresh()));}
function refresh(){const old=find("client").value,s=read();find("client").replaceChildren(new Option("Tutti i clienti TEST",""),...s.records.clients.map(c=>new Option(c.name||c.id,c.id)));if(s.records.clients.some(c=>c.id===old))find("client").value=old;}
function compute(){const s=read(),id=find("client").value||undefined;return ledger.inspect(s,id);}
function render(r){find("summary").replaceChildren();for(const c of r.clients){const tile=doc.createElement("div");tile.className="item";const name=doc.createElement("strong");name.textContent=c.clientId;tile.append(name);for(const [label,key] of [["Vendite","salesCents"],["Note credito TD04","creditsCents"],["Vendite nette","netSalesCents"],["Proforma (non fatturate)","proformaCents"],["Acquisti","purchasesCents"]]){const p=doc.createElement("p");p.textContent=label+": "+money(c[key]);tile.append(p);}find("summary").append(tile);}
find("issues").replaceChildren();const heading=doc.createElement("h3");heading.textContent="Anomalie: "+r.issues.length;find("issues").append(heading);for(const issue of r.issues){const item=doc.createElement("div");item.className="work-check amber";item.textContent=[issue.code,issue.invoiceId||"",issue.detail||""].join(" — ");find("issues").append(item);}
find("status").textContent="Revisione "+r.revision+" · "+(r.valid?"Nessuna anomalia rilevata":"Bozze da verificare")+" · Solo TEST, nessuna emissione fiscale.";}
function handle(fn){try{refresh();fn();}catch(e){find("status").textContent="Operazione non eseguita: "+e.message;}}
find("check").addEventListener("click",()=>handle(()=>render(compute())));
find("export").addEventListener("click",()=>handle(()=>{const report=compute(),blob=new Blob([JSON.stringify(report,null,2)],{type:"application/json"}),url=URL.createObjectURL(blob),a=doc.createElement("a");a.href=url;a.download="ite-ledger-111-TEST.json";a.click();root.setTimeout(()=>URL.revokeObjectURL(url),1000);render(report);}));
root.addEventListener("storage",e=>{if(e.key===KEY)handle(refresh);});
handle(refresh);
})(typeof window!=="undefined"?window:globalThis);
