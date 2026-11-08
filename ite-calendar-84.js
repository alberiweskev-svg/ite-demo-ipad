/* I.T.E. 4.0.84 — Pianificazione calendario TEST integrata nel fascicolo. */
(function(root,factory){
 const api=factory(typeof module==="object"&&module.exports?require("./ite-service-ledger-40.js"):root.ITEServiceLedger40);
 if(typeof module==="object"&&module.exports)module.exports=api;root.ITECalendar84=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(L){
"use strict";
const KEY="ite-40-service-workspace-test-v1";
function assert(c,m){if(!c)throw Error(m);}
function stamp(v){const n=Date.parse(v);assert(typeof v==="string"&&/^\d{4}-\d\d-\d\dT\d\d:\d\d/.test(v)&&Number.isFinite(n),"Data/ora non valida");return n;}
function plan(service,options={}){
 L.validate(service);
 const minutes=options.defaultMinutes===undefined?60:Number(options.defaultMinutes);
 assert(Number.isInteger(minutes)&&minutes>=15&&minutes<=720,"Durata predefinita non valida");
 const operator=options.operatorId||"",status=options.status||"all",from=options.from?stamp(options.from):-Infinity,to=options.to?stamp(options.to):Infinity;
 assert(from<=to,"Intervallo invertito");
 if(operator)assert(service.operators.some(x=>x.id===operator),"Operatore sconosciuto");
 assert(["all","scheduled","arrived","closed","reopened"].includes(status),"Filtro stato non valido");
 const jobs=new Map(service.jobs.map(j=>[j.appointmentId,j]));
 const rows=service.appointments.map(a=>{
  const start=stamp(a.scheduledAt),duration=a.durationMinutes===undefined?minutes:Number(a.durationMinutes);
  assert(Number.isInteger(duration)&&duration>=15&&duration<=720,"Durata appuntamento non valida");
  const job=jobs.get(a.id),state=job?job.status:"scheduled";
  return {id:a.id,clientId:a.clientId,siteId:a.siteId,plantId:a.plantId,equipmentId:a.equipmentId,operatorId:a.operatorId,start,end:start+duration*60000,durationMinutes:duration,status:state,conflicts:[]};
 }).sort((a,b)=>a.start-b.start||a.id.localeCompare(b.id));
 const byOperator=new Map();
 for(const r of rows){if(!byOperator.has(r.operatorId))byOperator.set(r.operatorId,[]);byOperator.get(r.operatorId).push(r);}
 for(const group of byOperator.values()){
  for(let i=0;i<group.length;i++)for(let j=i+1;j<group.length&&group[j].start<group[i].end;j++){
   if(group[i].start<group[j].end){group[i].conflicts.push(group[j].id);group[j].conflicts.push(group[i].id);}
  }
 }
 return {schema:"ITE-CALENDAR-TEST-84",rows:rows.filter(r=>(!operator||r.operatorId===operator)&&(status==="all"||r.status===status)&&r.start<=to&&r.end>=from),conflictPairs:rows.reduce((n,r)=>n+r.conflicts.length,0)/2};
}
function csv(service,options){
 const data=plan(service,options),quote=x=>'"'+String(x).replace(/"/g,'""').replace(/^[=+@\-\t\r]/,"'")+'"';
 const header=["Appuntamento","Inizio","Fine","Operatore","Cliente","Sede","Impianto","Apparecchiatura","Stato","Conflitti"];
 return "\uFEFF"+[header,...data.rows.map(r=>[r.id,new Date(r.start).toISOString(),new Date(r.end).toISOString(),r.operatorId,r.clientId,r.siteId,r.plantId,r.equipmentId,r.status,r.conflicts.join(";")])].map(row=>row.map(quote).join(";")).join("\r\n");
}
function mount(doc){
 if(!doc||!doc.defaultView||!doc.createElement||doc.getElementById("ite-calendar-84"))return false;
 const host=doc.querySelector("#ite-integrated-dossier-83")||doc.querySelector("#main-content")||doc.querySelector("main")||doc.body;
 const section=doc.createElement("section");section.id="ite-calendar-84";section.className="panel";host.appendChild(section);
 const add=(tag,parent,text)=>{const e=doc.createElement(tag);if(text!==undefined)e.textContent=text;parent.appendChild(e);return e;};
 add("h2",section,"Calendario operatori e conflitti — TEST 4.0.84");
 add("p",section,"Lettura dell'archivio appuntamenti TEST già utilizzato dal fascicolo. Nessuna copia dei dati, nessun invio a server.");
 const controls=add("div",section);controls.className="actions";
 const select=add("select",controls);select.setAttribute("aria-label","Filtra operatore");
 const status=add("select",controls);status.setAttribute("aria-label","Filtra stato");
 for(const v of ["all","scheduled","arrived","closed","reopened"]){const o=add("option",status,v);o.value=v;}
 const msg=add("p",section);msg.setAttribute("role","status");
 const output=add("div",section);
 function load(){return L.importJSON(doc.defaultView.localStorage.getItem(KEY)||L.exportJSON(L.empty()));}
 function options(){return {operatorId:select.value,status:status.value};}
 function render(){
  try{
   const service=load(),selected=select.value;select.replaceChildren();const all=add("option",select,"Tutti gli operatori");all.value="";
   service.operators.forEach(x=>{const o=add("option",select,x.name||x.id);o.value=x.id;});select.value=selected;
   const result=plan(service,options());output.replaceChildren();
   add("p",output,"Appuntamenti: "+result.rows.length+" · Sovrapposizioni operatore: "+result.conflictPairs);
   const wrap=add("div",output);wrap.style.overflowX="auto";const table=add("table",wrap),head=add("tr",add("thead",table));
   ["Appuntamento","Inizio","Operatore","Stato","Durata min","Conflitti"].forEach(x=>add("th",head,x));
   const body=add("tbody",table);result.rows.forEach(r=>{const tr=add("tr",body);[r.id,new Date(r.start).toLocaleString("it-IT"),r.operatorId,r.status,r.durationMinutes,r.conflicts.join(", ")||"—"].forEach(v=>add("td",tr,String(v)));});
   msg.textContent="Calendario TEST aggiornato";
  }catch(e){msg.textContent="Calendario non disponibile: "+e.message;}
 }
 select.addEventListener("change",render);status.addEventListener("change",render);
 const refresh=add("button",controls,"Aggiorna calendario");refresh.type="button";refresh.addEventListener("click",render);
 const exportBtn=add("button",controls,"Esporta calendario CSV TEST");exportBtn.type="button";
 exportBtn.addEventListener("click",()=>{try{const data=csv(load(),options()),url=URL.createObjectURL(new Blob([data],{type:"text/csv;charset=utf-8"})),a=add("a",section);a.href=url;a.download="ite-calendario-TEST.csv";a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}catch(e){msg.textContent=e.message;}});
 render();return true;
}
if(typeof document!=="undefined"){if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",()=>mount(document),{once:true});else mount(document);}
return Object.freeze({plan,csv,mount});
});
