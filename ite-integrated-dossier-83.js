/* I.T.E. 4.0.83 — fascicolo economico integrato TEST, sola lettura degli archivi esistenti. */
(function(root,factory){
 const api=factory(typeof module==="object"&&module.exports?require("./ite-service-ledger-40.js"):root.ITEServiceLedger40,typeof module==="object"&&module.exports?require("./ite-estimate-finance-40.js"):root.ITEEstimateFinance40,typeof module==="object"&&module.exports?require("./ite-finance-workspace-40.js"):root.ITEFinanceWorkspace40);
 if(typeof module==="object"&&module.exports)module.exports=api;root.ITEIntegratedDossier83=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(L,E,F){
"use strict";
const SERVICE_KEY="ite-40-service-workspace-test-v1",FINANCE_KEY="ITE-4-FINANCE-WORKSPACE-TEST-1",ESTIMATE_KEY="ite-40-integrated-estimates-test-v1";
const clone=x=>JSON.parse(JSON.stringify(x));
function check(service,estimates,finance){
 L.validate(service);E.validate(estimates);F.validateArchive(finance);
 const ids=new Set(service.appointments.map(x=>x.id));
 const warnings=[];
 for(const e of estimates)if(!ids.has(e.appointmentId))warnings.push("PREVENTIVO_APPUNTAMENTO_ASSENTE:"+e.id);
 for(const l of finance.links)if(!ids.has(l.appointmentId))warnings.push("FATTURA_APPUNTAMENTO_ASSENTE:"+l.documentId);
 return warnings;
}
function report(service,estimates,finance){
 const warnings=check(service,estimates,finance),sr=L.report(service),er=E.summarize(estimates),fr=F.report(finance);
 const rows=service.appointments.map(a=>{
  const s=sr.find(x=>x.appointmentId===a.id);
  const es=er.filter(x=>x.appointmentId===a.id);
  const fs=fr.summaries.filter(x=>x.appointmentId===a.id);
  const sum=(items,key)=>items.reduce((v,x)=>v+(x[key]||0),0);
  const approvedCents=sum(es,"approvedCents"),salesCents=sum(fs,"salesCents");
  return {appointmentId:a.id,clientId:a.clientId,siteId:a.siteId,plantId:a.plantId,equipmentId:a.equipmentId,operatorId:a.operatorId,scheduledAt:a.scheduledAt,status:s.status,workedMinutes:s.workedMinutes,revisionCount:s.revisionCount,estimateCount:es.length,approvedCents,extraApprovedCents:sum(es,"extraApprovedCents"),salesCents,receivedCents:sum(fs,"receivedCents"),unbilledCents:Math.max(0,approvedCents-salesCents)};
 });
 for(const r of rows){if(r.salesCents>r.approvedCents)warnings.push("FATTURATO_SUPERIORE_APPROVATO:"+r.appointmentId);if(r.approvedCents&&!r.salesCents)warnings.push("APPROVATO_NON_FATTURATO:"+r.appointmentId);}
 return {schema:"ITE-INTEGRATED-DOSSIER-TEST-1",rows,warnings:[...new Set([...warnings,...fr.warnings])].sort(),credits:fr.credits};
}
function addEstimate(service,estimates,finance,estimate){
 check(service,estimates,finance);
 if(!service.appointments.some(a=>a.id===estimate.appointmentId))throw Error("Preventivo: appuntamento non presente nel fascicolo");
 const next=clone(estimates);next.push(clone(estimate));check(service,next,finance);return next;
}
function decide(service,estimates,finance,id,decisions){
 check(service,estimates,finance);const next=E.approve(estimates,id,decisions);check(service,next,finance);return next;
}
function importEstimates(raw,service,finance){
 if(typeof raw!=="string"||raw.length>1000000)throw Error("Import superiore a 1 MB");
 const data=JSON.parse(raw);
 if(!data||data.schema!=="ITE-INTEGRATED-ESTIMATES-TEST-1")throw Error("Schema preventivi incompatibile");
 check(service,data.estimates,finance);
 if(data.estimates.some(e=>!service.appointments.some(a=>a.id===e.appointmentId)))throw Error("Import: appuntamento non presente nel fascicolo");
 return clone(data.estimates);
}
function exportEstimates(service,estimates,finance){check(service,estimates,finance);return JSON.stringify({schema:"ITE-INTEGRATED-ESTIMATES-TEST-1",estimates},null,2);}
function mount(doc){
 if(!doc||!doc.createElement||!doc.defaultView)return false;
 if(doc.getElementById("ite-integrated-dossier-83"))return true;
 const storage=doc.defaultView.localStorage,host=doc.querySelector("#main-content")||doc.querySelector("main")||doc.body;
 const section=doc.createElement("section");section.id="ite-integrated-dossier-83";section.className="panel";host.appendChild(section);
 const el=(tag,parent,txt)=>{const n=doc.createElement(tag);if(txt!==undefined)n.textContent=txt;parent.appendChild(n);return n;};
 el("h2",section,"Fascicolo unico intervento / preventivo / fattura — TEST 4.0.83");
 el("p",section,"Riepilogo dei registri TEST locali esistenti, senza copiarli né inviarli a server. I preventivi integrati sono salvati separatamente e collegati agli ID appuntamento del fascicolo.");
 const controls=el("div",section);controls.className="actions";const status=el("p",section);status.setAttribute("role","status");const output=el("div",section);
 function load(){
  const service=L.importJSON(storage.getItem(SERVICE_KEY)||L.exportJSON(L.empty()));
  const finance=F.importJSON(storage.getItem(FINANCE_KEY)||F.exportJSON(F.empty()));
  const raw=storage.getItem(ESTIMATE_KEY);
  const estimates=raw?importEstimates(raw,service,finance):[];
  return {service,finance,estimates};
 }
 function refresh(){
  try{const {service,finance,estimates}=load(),r=report(service,estimates,finance);output.replaceChildren();
   el("p",output,"Appuntamenti: "+r.rows.length+" · Preventivi: "+estimates.length+" · Segnalazioni: "+r.warnings.length);
   const wrap=el("div",output);wrap.style.overflowX="auto";const table=el("table",wrap);const head=el("tr",el("thead",table));
   ["Appuntamento","Operatore","Stato","Minuti","Revisioni","Approvato €","Extra €","Fatturato €","Da fatturare €"].forEach(x=>el("th",head,x));
   const body=el("tbody",table);
   r.rows.forEach(x=>{const tr=el("tr",body);[x.appointmentId,x.operatorId,x.status,x.workedMinutes,x.revisionCount,...["approvedCents","extraApprovedCents","salesCents","unbilledCents"].map(k=>(x[k]/100).toFixed(2))].forEach(v=>el("td",tr,String(v)));});
   if(r.warnings.length)el("p",output,"Da verificare: "+r.warnings.join(" · "));
   status.textContent="Lettura dei registri TEST completata";
  }catch(e){status.textContent="Verifica archivi: "+e.message;}
 }
 const btn=(txt,fn)=>{const b=el("button",controls,txt);b.type="button";b.addEventListener("click",()=>{try{fn();refresh();}catch(e){status.textContent=e.message;}});};
 btn("Aggiorna fascicolo",refresh);
 btn("Crea preventivo TEST per primo appuntamento",()=>{
  const {service,finance,estimates}=load(),a=service.appointments[0];if(!a)throw Error("Creare prima un appuntamento TEST");
  const i=estimates.length+1,id="TEST-DOS-PREV-"+String(i).padStart(3,"0");
  const next=addEstimate(service,estimates,finance,{id,appointmentId:a.id,lines:[
   {id:"TEST-DOS-FOR-"+i,type:"FORNITURA",category:"IDRICO",description:"Materiale dimostrativo",quantity:1,unitPrice:100,status:"PROPOSTA",extra:false},
   {id:"TEST-DOS-POS-"+i,type:"POSA",category:"IDRICO",description:"Posa dimostrativa",quantity:1,unitPrice:80,status:"PROPOSTA",extra:false},
   {id:"TEST-DOS-EXT-"+i,type:"POSA",category:"IDRICO",description:"Lavoro Extra dimostrativo",quantity:1,unitPrice:40,status:"PROPOSTA",extra:true}
  ]});
  storage.setItem(ESTIMATE_KEY,exportEstimates(service,next,finance));
 });
 btn("Approva voci del primo preventivo TEST",()=>{
  const {service,finance,estimates}=load();if(!estimates.length)throw Error("Nessun preventivo TEST");
  const first=estimates[0],next=decide(service,estimates,finance,first.id,first.lines.map(l=>({lineId:l.id,status:"ACCETTATA"})));
  storage.setItem(ESTIMATE_KEY,exportEstimates(service,next,finance));
 });
 btn("Esporta preventivi TEST",()=>{
  const {service,finance,estimates}=load(),blob=new Blob([exportEstimates(service,estimates,finance)],{type:"application/json"});
  const url=URL.createObjectURL(blob),a=el("a",section);a.href=url;a.download="ite-preventivi-integrati-TEST.json";a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
 });
 const file=el("input",controls);file.type="file";file.accept=".json,application/json";file.setAttribute("aria-label","Importa preventivi integrati TEST");
 file.addEventListener("change",async()=>{try{const f=file.files&&file.files[0];if(!f)return;if(f.size>1000000)throw Error("File superiore a 1 MB");const {service,finance}=load();const next=importEstimates(await f.text(),service,finance);storage.setItem(ESTIMATE_KEY,exportEstimates(service,next,finance));refresh();}catch(e){status.textContent="Importazione annullata: "+e.message;}finally{file.value="";}});
 refresh();return true;
}
if(typeof document!=="undefined"){if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",()=>mount(document),{once:true});else mount(document);}
return Object.freeze({check,report,addEstimate,decide,importEstimates,exportEstimates,mount,keys:{SERVICE_KEY,FINANCE_KEY,ESTIMATE_KEY}});
});
