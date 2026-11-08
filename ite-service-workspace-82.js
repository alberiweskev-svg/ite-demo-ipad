/* I.T.E. 4.0.82 - Workspace fascicolo TEST. No operational data, no network. */
(function(root){
"use strict";
const ledger=root.ITEServiceLedger40;
if(!ledger||typeof document==="undefined")return;
const KEY="ite-40-service-workspace-test-v1";
const ids={client:"TEST-CLIENT-01",site:"TEST-SITE-01",plant:"TEST-PLANT-01",equipment:"TEST-EQUIP-01",operator:"TEST-OP-01",appointment:"TEST-APT-01"};
const fixture=()=>{
 let s=ledger.empty();
 for(const [collection,item] of [
 ["clients",{id:ids.client,name:"Cliente dimostrativo"}],
 ["sites",{id:ids.site,clientId:ids.client,name:"Sede dimostrativa"}],
 ["plants",{id:ids.plant,siteId:ids.site,name:"Impianto termico TEST"}],
 ["equipment",{id:ids.equipment,plantId:ids.plant,name:"Generatore TEST"}],
 ["operators",{id:ids.operator,name:"Operatore TEST"}],
 ["appointments",{id:ids.appointment,clientId:ids.client,siteId:ids.site,plantId:ids.plant,equipmentId:ids.equipment,operatorId:ids.operator,scheduledAt:"2026-11-12T09:00:00"}]
 ])s=ledger.add(s,collection,item);
 return s;
};
let state=fixture();
function safeLoad(){try{const raw=localStorage.getItem(KEY);if(raw)state=ledger.importJSON(raw);}catch(e){state=fixture();}}
function persist(){ledger.validate(state);localStorage.setItem(KEY,ledger.exportJSON(state));}
function el(tag,props={},parent){const n=document.createElement(tag);for(const [k,v] of Object.entries(props)){if(k==="text")n.textContent=v;else if(k==="className")n.className=v;else n.setAttribute(k,v);}if(parent)parent.appendChild(n);return n;}
function render(){
 const host=document.getElementById("ite-service-workspace-82");if(!host)return;
 host.replaceChildren();
 el("h2",{text:"Fascicolo interventi 4.0 — collaudo TEST"},host);
 el("p",{className:"hint",text:"Archivio dimostrativo locale e separato. Nessun cliente reale, nessun PDF o invio a server. Prima di cancellare i dati esportare il backup JSON."},host);
 const actions=el("div",{className:"actions"},host);
 function btn(title,fn){const b=el("button",{type:"button",text:title},actions);b.addEventListener("click",fn);}
 const notice=el("p",{role:"status","aria-live":"polite"},host);
 function feedback(msg){notice.textContent=msg;}
 const picker=el("select",{"aria-label":"Appuntamento TEST"},host);
 state.appointments.forEach(a=>el("option",{value:a.id,text:a.id+" — "+a.scheduledAt},picker));
 const op=el("select",{"aria-label":"Operatore TEST"},host);
 state.operators.forEach(o=>el("option",{value:o.id,text:o.name+" ("+o.id+")"},op));
 const at=el("input",{type:"datetime-local","aria-label":"Data e ora evento"},host);
 at.value=new Date(Date.now()-new Date().getTimezoneOffset()*60000).toISOString().slice(0,16);
 const desc=el("input",{type:"text",placeholder:"Descrizione attività (facoltativa)",maxlength:"1000"},host);
 for(const [label,type] of [["Sono arrivato","arrived"],["Modifica lavoro","amended"],["Chiudi intervento","closed"],["Revisiona intervento","reopened"]]){
 btn(label,()=>{try{state=ledger.event(state,picker.value,type,op.value,at.value,desc.value);persist();render();}catch(e){feedback(e.message);}});
 }
 btn("Aggiungi appuntamento TEST",()=>{try{
 const next=state.appointments.length+1;
 const id="TEST-APT-"+String(next).padStart(2,"0");
 state=ledger.add(state,"appointments",{id,clientId:ids.client,siteId:ids.site,plantId:ids.plant,equipmentId:ids.equipment,operatorId:op.value,scheduledAt:at.value});
 persist();render();
 }catch(e){feedback(e.message);}});
 btn("Esporta backup JSON",()=>{const blob=new Blob([ledger.exportJSON(state)],{type:"application/json"});const url=URL.createObjectURL(blob);const a=el("a",{href:url,download:"ite-fascicolo-TEST.json"},host);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);});
 const file=el("input",{type:"file",accept:".json,application/json","aria-label":"Importa archivio TEST"},host);
 file.addEventListener("change",async()=>{try{const f=file.files[0];if(!f)return;if(f.size>1000000)throw Error("File superiore a 1 MB");const imported=ledger.importJSON(await f.text());state=imported;persist();render();}catch(e){feedback("Importazione annullata: "+e.message);}});
 btn("Ripristina dati fittizi",()=>{if(!confirm("Sostituire tutti i dati TEST locali?"))return;state=fixture();persist();render();});
 const report=ledger.report(state);
 el("h3",{text:"Agenda e storico interventi"},host);
 const table=el("table",{},host),thead=el("thead",{},table),tr=el("tr",{},thead);
 ["Appuntamento","Stato","Minuti chiusi","Revisioni","Eventi"].forEach(x=>el("th",{text:x},tr));
 const tbody=el("tbody",{},table);
 report.forEach(r=>{const row=el("tr",{},tbody);[r.appointmentId,r.status,String(r.workedMinutes),String(r.revisionCount),r.events.map(e=>e.type+" "+e.at+" ("+e.operatorId+")").join("; ")||"—"].forEach(x=>el("td",{text:x},row));});
}
function mount(){
 if(document.getElementById("ite-service-workspace-82"))return;
 const main=document.querySelector("#main-content")||document.querySelector("main");if(!main)return;
 const section=el("section",{id:"ite-service-workspace-82",className:"panel"},main);
 safeLoad();render();
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",mount,{once:true});else mount();
root.ITEServiceWorkspace82=Object.freeze({fixture,mount});
})(typeof globalThis!=="undefined"?globalThis:this);
