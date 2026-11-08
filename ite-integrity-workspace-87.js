/* I.T.E. 4.0.87 - audit integrato TEST, nessuna trasmissione o modifica degli archivi. */
(function(root){
"use strict";
const I=root.ITEIntegrity86,L=root.ITEServiceLedger40,E=root.ITEEstimateWorkflow40;
if(typeof document==="undefined"||!I||!L||!E)return;
const SERVICE_KEY="ite-40-service-workspace-test-v1";
function mount(doc){
 if(doc.getElementById("ite-integrity-workspace-87"))return;
 const host=doc.querySelector("main")||doc.body;if(!host)return;
 const section=doc.createElement("section");section.id="ite-integrity-workspace-87";section.className="panel";
 const add=(tag,parent,value)=>{const n=doc.createElement(tag);if(value!==undefined)n.textContent=value;parent.appendChild(n);return n;};
 add("h2",section,"Controllo integrità fascicoli e preventivi — TEST");
 add("p",section,"Audit in sola lettura: confronta appuntamenti, gerarchia tecnica, operatori, conflitti, preventivi, Extra e riconciliazione economica. Solo dati TEST: non caricare documenti o anagrafiche reali.");
 const actions=add("div",section);actions.className="actions";
 const run=add("button",actions,"Verifica archivi TEST");run.type="button";
 const download=add("button",actions,"Esporta rapporto JSON");download.type="button";download.disabled=true;
 const label=add("label",section,"Archivio preventivi TEST (JSON, facoltativo)");
 const input=add("input",label);input.type="file";input.accept=".json,application/json";
 const status=add("p",section);status.setAttribute("role","status");status.setAttribute("aria-live","polite");
 const output=add("div",section);let commerce=E.empty(),last=null;
 const render=r=>{
  output.replaceChildren();
  add("p",output,"Appuntamenti interventi: "+r.serviceAppointments+" · Appuntamenti preventivi: "+r.estimateAppointments+" · Errori: "+r.counts.errors+" · Avvisi: "+r.counts.warnings+" · Informazioni: "+r.counts.info);
  const list=add("ul",output);
  for(const item of r.issues){const li=add("li",list,item.severity.toUpperCase()+" · "+item.code+" · "+(item.appointmentId||"Generale")+" · "+item.detail);li.style.marginBottom="8px";}
  if(!r.issues.length)add("p",output,"Nessuna anomalia rilevata nei dati TEST selezionati.");
 };
 function audit(){
  try{
   const raw=localStorage.getItem(SERVICE_KEY);
   if(!raw)throw Error("Archivio interventi TEST non presente: inizializzare prima il fascicolo dimostrativo.");
   const service=L.importJSON(raw);
   last=I.inspect(service,commerce);render(last);download.disabled=false;
   status.textContent="Audit completato in sola lettura. Nessun archivio modificato.";
  }catch(err){last=null;download.disabled=true;output.replaceChildren();status.textContent="Audit non eseguito: "+err.message;}
 }
 run.addEventListener("click",audit);
 input.addEventListener("change",async()=>{
  const file=input.files&&input.files[0];if(!file)return;
  try{
   if(file.size>1000000)throw Error("File oltre 1 MB");
   const next=E.importJSON(await file.text());
   commerce=next;status.textContent="Archivio preventivi TEST validato. Avviare il controllo.";last=null;download.disabled=true;output.replaceChildren();
  }catch(err){status.textContent="Importazione rifiutata: "+err.message;}
  input.value="";
 });
 download.addEventListener("click",()=>{
  if(!last)return;
  const blob=new Blob([JSON.stringify(last,null,2)],{type:"application/json"});
  const url=URL.createObjectURL(blob),a=doc.createElement("a");
  a.href=url;a.download="ite-audit-test-4.0.87.json";doc.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
 });
 host.appendChild(section);
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",()=>mount(document),{once:true});else mount(document);
root.ITEIntegrityWorkspace87={mount};
})(typeof globalThis!=="undefined"?globalThis:this);
