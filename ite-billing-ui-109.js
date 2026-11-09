/* I.T.E. 4.0.109 — TEST reconciliation UI; browser-local only. */
(function(){"use strict";
const base=window.ITEWorkflow100,mod=window.ITEBilling109,KEY="ITE-WORKFLOW-TEST-101";
if(!base||!mod||!document.body)return;
const host=document.createElement("section");host.id="ite-billing-109";host.className="panel";
host.innerHTML='<h2>Controllo fatture e note di credito — 4.0.109 TEST</h2><p class="hint">Controllo in sola lettura delle proforma, vendite e TD04. Nessuna emissione fiscale.</p><label>Cliente<select id="billing109-client"></select></label><div class="actions"><button id="billing109-check" type="button">Verifica coerenza</button><button id="billing109-export" type="button">Esporta rapporto JSON TEST</button></div><p role="status" aria-live="polite" id="billing109-status"></p><pre id="billing109-result" style="white-space:pre-wrap;overflow-wrap:anywhere"></pre>';
(document.querySelector(".wrap")||document.body).appendChild(host);
const el=id=>host.querySelector("#billing109-"+id);
function state(){return base.importJSON(localStorage.getItem(KEY)||base.exportJSON(base.fresh()));}
function refresh(){try{const s=state(),previous=el("client").value;el("client").replaceChildren(new Option("Seleziona cliente TEST",""),...s.records.clients.map(x=>new Option(x.name||x.id,x.id)));if(s.records.clients.some(x=>x.id===previous))el("client").value=previous;}catch(e){el("status").textContent=e.message;}}
function report(){const id=el("client").value;if(!id)throw Error("Selezionare un cliente");return mod.audit(state(),id);}
el("check").onclick=()=>{try{const r=report();el("result").textContent=JSON.stringify(r,null,2);el("status").textContent=r.issues.length?"Anomalie rilevate: "+r.issues.length:"Nessuna anomalia rilevata dal controllo TEST";}catch(e){el("status").textContent="Controllo non eseguito: "+e.message;}};
el("export").onclick=()=>{try{const json=JSON.stringify(report(),null,2),url=URL.createObjectURL(new Blob([json],{type:"application/json"})),a=document.createElement("a");a.href=url;a.download="ite-4.0.109-riconciliazione-test.json";a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}catch(e){el("status").textContent=e.message;}};
refresh();
})();