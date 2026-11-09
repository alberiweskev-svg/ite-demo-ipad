/* I.T.E. 4.0.108 — intervention-linked commercial TEST workspace. */
(function(){"use strict";
const base=window.ITEWorkflow100,svc=window.ITEServiceCommerce108,KEY="ITE-WORKFLOW-TEST-101";
if(!base||!svc||!document.body)return;
const host=document.createElement("section");host.className="panel";host.id="ite-service-commerce-108";
host.innerHTML='<h2>Intervento → preventivo → Extra → proforma — 4.0.108 TEST</h2><p class="hint">Solo archivio locale di collaudo. Nessuna fatturazione ufficiale.</p><div class="grid"><label>Intervento<select id="sc108-job"></select></label><label>Operatore<input id="sc108-actor" value="Tecnico TEST"></label><label>Categoria<select id="sc108-category"><option>FORNITURA</option><option>POSA</option><option>SMONTAGGIO</option><option>SMALTIMENTO</option></select></label><label>Quantità<input id="sc108-qty" type="number" min="1" step="1" value="1"></label><label>Prezzo unitario €<input id="sc108-price" type="number" min="0" step=".01" value="0"></label><label>Preventivo<select id="sc108-quote"></select></label><label>Extra<select id="sc108-extra"></select></label><label>Quantità approvata<input id="sc108-approved" type="number" min="1" step="1" value="1"></label><label>Motivazione<input id="sc108-reason" value="Accettazione TEST"></label></div><div class="actions"><button id="sc108-line">Aggiungi voce preventivo</button><button id="sc108-link">Collega preventivo esistente</button><button id="sc108-accept">Accetta voce</button><button id="sc108-newextra">Aggiungi Extra</button><button id="sc108-approve">Approva Extra parziale</button><button id="sc108-approveall">Approva Extra totale</button><button id="sc108-draft">Prepara proforma TEST</button><button id="sc108-refresh">Aggiorna fascicolo</button></div><p role="status" aria-live="polite" id="sc108-status"></p><pre id="sc108-dossier" style="white-space:pre-wrap;overflow-wrap:anywhere"></pre>';
(document.querySelector(".wrap")||document.body).appendChild(host);
const $=k=>host.querySelector("#sc108-"+k),load=()=>base.importJSON(localStorage.getItem(KEY)||base.exportJSON(base.fresh())),save=s=>localStorage.setItem(KEY,base.exportJSON(s));
const uid=()=> "TEST-SC-"+Date.now().toString(36).toUpperCase()+"-"+Math.random().toString(36).slice(2,8).toUpperCase();
function options(el,rows,selected){el.replaceChildren(new Option("Seleziona...",""),...rows.map(x=>new Option(x.id,x.id)));if(rows.some(x=>x.id===selected))el.value=selected;}
const job=()=>$("job").value,actor=()=>$("actor").value,reason=()=>$("reason").value;
const quantity=k=>{const n=Number($(k).value);if(!Number.isSafeInteger(n)||n<1||n>10000)throw Error("Quantità non valida");return n;};
const price=()=>{const n=Number($("price").value);if(!Number.isFinite(n)||n<0||n>1000000||Math.round(n*100)!==n*100&&Math.abs(Math.round(n*100)-n*100)>1e-6)throw Error("Prezzo non valido");return Math.round(n*100);};
function render(){const s=load(),selected=job();options($("job"),s.records.interventions,selected);
const id=job(),j=s.records.interventions.find(x=>x.id===id);
options($("quote"),j?s.records.quotes.filter(x=>x.clientId===j.clientId&&(!x.interventionId||x.interventionId===id)):[],$("quote").value);
options($("extra"),j?s.records.extras.filter(x=>x.interventionId===id):[],$("extra").value);
if(!id){$("dossier").textContent="Creare prima un appuntamento e aprire l’intervento TEST.";return;}
const d=svc.dossier(s,id);$("dossier").textContent="Cliente: "+(d.client?.name||d.client?.id)+"\nImpianto: "+(d.plant?.name||"")+
"\nPreventivi collegati: "+d.quotes.length+"\nExtra collegati: "+d.extras.length+"\nProforma/fatture TEST: "+d.invoices.length+
"\nDocumenti collegati: "+d.documents.length+"\nPreventivi accettati: € "+(d.totals.acceptedCents/100).toFixed(2)+
"\nExtra approvati: € "+(d.totals.approvedExtrasCents/100).toFixed(2)+"\nStato: NON UFFICIALE";
}
function run(f){try{const s=load(),n=f(s);save(n);render();$("status").textContent="Salvato TEST, revisione "+n.revision;}catch(e){$("status").textContent="Non salvato: "+e.message;}}
$("job").onchange=render;$("refresh").onclick=render;
$("line").onclick=()=>run(s=>svc.addQuoteLine(s,job(),{id:uid(),clientId:s.records.interventions.find(x=>x.id===job())?.clientId,category:$("category").value,quantity:quantity("qty"),unitCents:price()},actor(),s.revision));
$("link").onclick=()=>run(s=>svc.attachQuote(s,job(),$("quote").value,actor(),reason(),s.revision));
$("accept").onclick=()=>run(s=>window.ITECommerce107.transition(s,"quotes",$("quote").value,"ACCETTATO",actor(),reason(),s.revision));
$("newextra").onclick=()=>run(s=>svc.addExtra(s,job(),{id:uid(),clientId:s.records.interventions.find(x=>x.id===job())?.clientId,quoteId:$("quote").value,category:$("category").value,quantity:quantity("qty"),unitCents:price()},actor(),s.revision));
$("approve").onclick=()=>run(s=>window.ITECommerce107.transition(s,"extras",$("extra").value,"PARZIALE",actor(),reason(),s.revision,quantity("approved")));
$("approveall").onclick=()=>run(s=>window.ITECommerce107.transition(s,"extras",$("extra").value,"APPROVATO",actor(),reason(),s.revision));
$("draft").onclick=()=>run(s=>svc.prepareInvoice(s,job(),uid(),actor(),s.revision));
render();
})();