/* I.T.E. 4.0.85 — Inserimento rapido calendario TEST e gestione conflitti. */
(function(root,factory){
 const api=factory(typeof module==="object"&&module.exports?require("./ite-service-ledger-40.js"):root.ITEServiceLedger40,
 typeof module==="object"&&module.exports?require("./ite-calendar-84.js"):root.ITECalendar84);
 if(typeof module==="object"&&module.exports)module.exports=api;
 root.ITECalendarBooking85=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(L,C){
 "use strict";
 const KEY="ite-40-service-workspace-test-v1";
 const check=(ok,message)=>{if(!ok)throw Error(message);};
 const copy=s=>JSON.parse(JSON.stringify(s));
 function validTime(value){
  check(typeof value==="string"&&/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value),"Data/ora locale non valida");
  const d=new Date(value);
  check(Number.isFinite(d.getTime())&&d.getFullYear()===Number(value.slice(0,4))&&d.getMonth()+1===Number(value.slice(5,7))&&d.getDate()===Number(value.slice(8,10))&&d.getHours()===Number(value.slice(11,13))&&d.getMinutes()===Number(value.slice(14,16)),"Data/ora inesistente");
  return d.getTime();
 }
 function schedule(state,item,allowConflict=false){
  L.validate(state);check(item&&typeof item==="object","Appuntamento mancante");
  check(/^TEST-[A-Z0-9-]{2,60}$/.test(item.id||""),"ID TEST non valido");
  validTime(item.scheduledAt);
  const duration=Number(item.durationMinutes);
  check(Number.isInteger(duration)&&duration>=15&&duration<=720,"Durata tra 15 e 720 minuti");
  check(state.operators.some(o=>o.id===item.operatorId),"Operatore non presente");
  const n=copy(state);
  check(!n.appointments.some(a=>a.id===item.id),"ID appuntamento duplicato");
  n.appointments.push({id:item.id,clientId:item.clientId,siteId:item.siteId,plantId:item.plantId,equipmentId:item.equipmentId,operatorId:item.operatorId,scheduledAt:item.scheduledAt,durationMinutes:duration});
  L.validate(n);
  const row=C.plan(n).rows.find(r=>r.id===item.id);
  check(allowConflict||row.conflicts.length===0,"Sovrapposizione con: "+row.conflicts.join(", "));
  return n;
 }
 function reschedule(state,id,changes,allowConflict=false){
  L.validate(state);const n=copy(state),a=n.appointments.find(x=>x.id===id);
  check(a,"Appuntamento non trovato");
  check(!n.jobs.some(j=>j.appointmentId===id),"Intervento già avviato: modifica orari non consentita");
  check(changes&&typeof changes==="object","Modifiche mancanti");
  const time=changes.scheduledAt===undefined?a.scheduledAt:changes.scheduledAt;
  validTime(time);
  const duration=changes.durationMinutes===undefined?(a.durationMinutes||60):Number(changes.durationMinutes);
  check(Number.isInteger(duration)&&duration>=15&&duration<=720,"Durata non valida");
  const op=changes.operatorId===undefined?a.operatorId:changes.operatorId;
  check(n.operators.some(o=>o.id===op),"Operatore inesistente");
  a.scheduledAt=time;a.durationMinutes=duration;a.operatorId=op;
  L.validate(n);
  const row=C.plan(n).rows.find(r=>r.id===id);
  check(allowConflict||!row.conflicts.length,"Sovrapposizione con: "+row.conflicts.join(", "));
  return n;
 }
 function cancel(state,id){
  L.validate(state);const n=copy(state);
  check(!n.jobs.some(j=>j.appointmentId===id),"Intervento già avviato: impossibile eliminare");
  const before=n.appointments.length;n.appointments=n.appointments.filter(a=>a.id!==id);
  check(before!==n.appointments.length,"Appuntamento inesistente");
  L.validate(n);return n;
 }
 function mount(doc){
  if(!doc||!doc.defaultView||doc.getElementById("ite-calendar-booking-85"))return false;
  const host=doc.getElementById("ite-calendar-84")||doc.getElementById("ite-service-workspace-82")||doc.querySelector("main");
  if(!host)return false;
  const el=(tag,parent,label)=>{const x=doc.createElement(tag);if(label!==undefined)x.textContent=label;parent.appendChild(x);return x;};
  const section=el("section",host);section.id="ite-calendar-booking-85";section.className="panel";
  el("h2",section,"Inserimento rapido e ripianificazione — TEST 4.0.85");
  el("p",section,"Appuntamenti collegati al fascicolo TEST locale. Le sovrapposizioni sono bloccate salvo autorizzazione esplicita; interventi già avviati non possono essere cancellati o ripianificati.");
  const form=el("form",section),grid=el("div",form);grid.className="grid";
  const field=(label,type)=>{const wrap=el("label",grid,label),input=el(type==="select"?"select":"input",wrap);if(type!=="select")input.type=type;return input;};
  const appointment=field("Appuntamento (vuoto = nuovo)","select");
  const operator=field("Operatore","select");
  const client=field("Cliente","select"),site=field("Sede","select"),plant=field("Impianto","select"),equipment=field("Apparecchiatura","select");
  const time=field("Inizio locale","datetime-local"),duration=field("Durata in minuti","number");duration.min="15";duration.max="720";duration.step="15";duration.value="60";
  const conflict=el("label",form,"Consenti sovrapposizione verificata ");const checkbox=el("input",conflict);checkbox.type="checkbox";checkbox.style.width="auto";
  const actions=el("div",form);actions.className="actions";
  const save=el("button",actions,"Salva appuntamento");save.type="submit";
  const del=el("button",actions,"Elimina appuntamento non avviato");del.type="button";del.className="danger";
  const refresh=el("button",actions,"Aggiorna elenco");refresh.type="button";
  const msg=el("p",section);msg.setAttribute("role","status");msg.setAttribute("aria-live","polite");
  function load(){return L.importJSON(doc.defaultView.localStorage.getItem(KEY)||L.exportJSON(L.empty()));}
  function store(s){doc.defaultView.localStorage.setItem(KEY,L.exportJSON(s));doc.defaultView.dispatchEvent(new Event("ite-service-test-changed"));}
  function fill(select,items,placeholder){const old=select.value;select.replaceChildren();const blank=el("option",select,placeholder);blank.value="";items.forEach(x=>{const o=el("option",select,x.name||x.id);o.value=x.id;});if(items.some(x=>x.id===old))select.value=old;}
  function refreshForm(){
   try{const s=load();fill(appointment,s.appointments.map(x=>({id:x.id,name:x.id+" · "+x.scheduledAt})),"Nuovo appuntamento");
   fill(operator,s.operators,"Seleziona operatore");fill(client,s.clients,"Seleziona cliente");fill(site,s.sites,"Seleziona sede");fill(plant,s.plants,"Seleziona impianto");fill(equipment,s.equipment,"Seleziona apparecchiatura");
   msg.textContent="Archivio TEST: "+s.appointments.length+" appuntamenti.";
  }catch(e){msg.textContent=e.message;}
  }
  function loadSelection(){
   try{const s=load(),a=s.appointments.find(x=>x.id===appointment.value);if(!a)return;
    for(const [node,key] of [[operator,"operatorId"],[client,"clientId"],[site,"siteId"],[plant,"plantId"],[equipment,"equipmentId"]])node.value=a[key];
    time.value=a.scheduledAt.slice(0,16);duration.value=String(a.durationMinutes||60);
   }catch(e){msg.textContent=e.message;}
  }
  appointment.addEventListener("change",loadSelection);
  form.addEventListener("submit",e=>{e.preventDefault();try{
   const s=load(),data={operatorId:operator.value,clientId:client.value,siteId:site.value,plantId:plant.value,equipmentId:equipment.value,scheduledAt:time.value,durationMinutes:Number(duration.value)};
   const next=appointment.value?reschedule(s,appointment.value,data,checkbox.checked):schedule(s,{...data,id:"TEST-APT-"+String(Date.now()).slice(-11)},checkbox.checked);
   store(next);refreshForm();msg.textContent="Appuntamento TEST salvato.";
  }catch(err){msg.textContent="Salvataggio annullato: "+err.message;}});
  del.addEventListener("click",()=>{try{check(appointment.value,"Seleziona un appuntamento");check(doc.defaultView.confirm("Eliminare l'appuntamento TEST selezionato?"),"Operazione annullata");store(cancel(load(),appointment.value));refreshForm();msg.textContent="Appuntamento TEST eliminato.";}catch(e){msg.textContent=e.message;}});
  refresh.addEventListener("click",refreshForm);
  doc.defaultView.addEventListener("storage",e=>{if(e.key===KEY)refreshForm();});
  refreshForm();return true;
 }
 if(typeof document!=="undefined"){const start=()=>mount(document);if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();}
 return Object.freeze({schedule,reschedule,cancel,mount,validTime});
});
