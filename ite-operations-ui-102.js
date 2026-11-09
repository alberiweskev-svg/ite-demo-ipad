/* I.T.E. 4.0.102 — operations panel, shared TEST archive with 4.0.101. */
(function(){
"use strict";
const api=window.ITEWorkflow100,ops=window.ITEOperations102,KEY="ITE-WORKFLOW-TEST-101";
if(!api||!ops||!document.body)return;
const panel=document.createElement("section");panel.className="panel";panel.id="ite-operations-102";
panel.innerHTML='<h2>Operatività integrata 4.0.102 — TEST</h2><p class="hint">Aggiorna stati di appuntamenti, interventi, preventivi ed Extra. Nessuna emissione ufficiale.</p><div class="grid"><label>Registro<select id="op-kind"></select></label><label>Registrazione<select id="op-record"></select></label><label>Nuovo stato<select id="op-status"></select></label><label>Operatore<input id="op-actor" value="Tecnico TEST" maxlength="80"></label><label>Motivazione revisione<input id="op-reason" maxlength="200"></label><label>Quantità approvata (parziale)<input id="op-quantity" type="number" min="1" step="1"></label></div><div class="actions"><button id="op-save" type="button">Aggiorna stato TEST</button><button id="op-refresh" type="button" class="secondary">Aggiorna registri</button></div><p id="op-message" role="status" aria-live="polite"></p><h3>Resoconto operativo</h3><label>Cliente<select id="op-client"></select></label><pre id="op-report" style="white-space:pre-wrap;overflow-wrap:anywhere"></pre><h3>Storico registrazione</h3><div id="op-history"></div>';
(document.querySelector(".wrap")||document.body).appendChild(panel);
const $=id=>panel.querySelector("#"+id),escape=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
let state;
function load(){state=api.importJSON(localStorage.getItem(KEY)||api.exportJSON(api.fresh()));}
function options(rows,selected){return rows.map(r=>'<option value="'+escape(r.id)+'" '+(r.id===selected?"selected":"")+'>'+escape(r.name||r.description||r.id)+'</option>').join("");}
function refresh(){
try{load();const k=$("op-kind").value||"appointments";
$("op-kind").innerHTML=["appointments","interventions","quotes","extras"].map(x=>'<option '+(x===k?"selected":"")+'>'+x+'</option>').join("");
$("op-record").innerHTML=options(state.records[k],$("op-record").value);
$("op-client").innerHTML='<option value="">Tutti</option>'+options(state.records.clients,$("op-client").value);
drawStatus();drawReport();
}catch(e){$("op-message").textContent=e.message;}
}
function drawStatus(){
const k=$("op-kind").value,id=$("op-record").value,row=state.records[k].find(x=>x.id===id);
$("op-status").innerHTML=ops.allowed[k].map(x=>'<option>'+x+'</option>').join("");
if(row){const current=ops.statusOf(k,row);$("op-history").innerHTML=ops.history(state,k,id).map(x=>'<div class="item">'+escape(x.action)+" — "+escape(x.from||"")+" → "+escape(x.to||"")+" — "+escape(x.operator)+'</div>').join("");$("op-message").textContent="Stato attuale: "+current;}else $("op-history").textContent="Nessuna registrazione";
}
function drawReport(){try{const r=ops.report(state,$("op-client").value||null);$("op-report").textContent="Appuntamenti: "+r.appointments+" | Interventi: "+r.interventions+"\nPreventivi: € "+(r.quotesCents/100).toFixed(2)+" | Extra approvati: € "+(r.approvedExtrasCents/100).toFixed(2)+"\nVendite al netto TD04: € "+(r.netSalesCents/100).toFixed(2)+"\nInterventi aperti: "+(r.unclosedInterventions.join(", ")||"nessuno");}catch(e){$("op-message").textContent=e.message;}}
$("op-kind").onchange=refresh;$("op-record").onchange=drawStatus;$("op-client").onchange=drawReport;$("op-refresh").onclick=refresh;
$("op-save").onclick=()=>{
try{load();const kind=$("op-kind").value,id=$("op-record").value,status=$("op-status").value;
const next=ops.transition(state,kind,id,status,$("op-actor").value,state.revision,{reason:$("op-reason").value,approvedQuantity:Number($("op-quantity").value)});
const stored=localStorage.getItem(KEY);if(stored&&api.importJSON(stored).revision!==state.revision)throw Error("Conflitto archivio: aggiornare");
localStorage.setItem(KEY,api.exportJSON(next));refresh();$("op-message").textContent="Stato TEST salvato, revisione "+next.revision;
}catch(e){$("op-message").textContent="Non salvato: "+e.message;}
};
refresh();
})();