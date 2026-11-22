/* I.T.E. 4.0.273 — pannello di collaudo rapportini, solo dati fittizi. */
(function(){
"use strict";
function mount(){
const api=window.ITEFieldReport273;if(!api||document.getElementById("ite-report273"))return;
const target=document.querySelector("main")||document.querySelector(".wrap")||document.body;
const panel=document.createElement("section");panel.id="ite-report273";panel.className="panel";
panel.innerHTML='<h2>Rapportino intervento — collaudo 4.0.273</h2><p class="hint">Solo dati sintetici locali. Non caricare dati clienti o fotografie reali.</p><div class="grid"><label>Operatore<input id="r273-operator" value="TECNICO-DEMO"></label><label>Descrizione attività<input id="r273-description" value="Verifica impianto dimostrativo"></label><label>Tipologia<select id="r273-type"><option>POSA</option><option>FORNITURA</option><option>SMONTAGGIO</option><option>SMALTIMENTO</option><option>EXTRA</option></select></label><label>Note<input id="r273-notes" value="Prova sintetica"></label></div><div class="actions"><button type="button" id="r273-start">Sono arrivato</button><button type="button" id="r273-add">Aggiungi attività</button><button type="button" id="r273-close">Chiudi intervento</button><button type="button" id="r273-export">Esporta JSON</button></div><pre id="r273-output" style="white-space:pre-wrap;overflow-wrap:anywhere"></pre>';
target.appendChild(panel);
const get=id=>panel.querySelector("#"+id),key="ite-4.0.273-synthetic-report";let report=null;
function display(message){get("r273-output").textContent=message+"\n"+(report?JSON.stringify(report,null,2):"Nessun rapportino");}
function action(fn){try{fn();if(report)api.save(localStorage,key,report);display("Operazione verificata");}catch(e){display("ERRORE: "+e.message);}}
get("r273-start").onclick=()=>action(()=>{report=api.newReport({id:"R-DEMO-273",appointmentId:"A-DEMO",clientId:"C-DEMO",siteId:"S-DEMO",plantId:"P-DEMO",equipmentId:"E-DEMO",operatorId:get("r273-operator").value,arrival:new Date().toISOString()});});
get("r273-add").onclick=()=>action(()=>{if(!report)throw Error("Avvia prima l'intervento");report=api.addActivity(report,{type:get("r273-type").value,description:get("r273-description").value,extra:get("r273-type").value==="EXTRA"});});
get("r273-close").onclick=()=>action(()=>{if(!report)throw Error("Avvia prima l'intervento");report=api.close(report,{departure:new Date().toISOString(),notes:get("r273-notes").value,otherWorkConfirmed:true});});
get("r273-export").onclick=()=>{try{if(!report)throw Error("Nessun rapporto");const blob=new Blob([JSON.stringify(report,null,2)],{type:"application/json"}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="ite-rapportino-demo-273.json";a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}catch(e){display("ERRORE: "+e.message);}};
try{report=api.load(localStorage,key);display("Archivio sintetico disponibile");}catch(e){display("Archivio non leggibile: "+e.message);}
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",mount);else mount();
})();
