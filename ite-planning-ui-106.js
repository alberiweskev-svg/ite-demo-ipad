/* I.T.E. 4.0.106 - planning console, isolated TEST data, no operational writes */
(function(){
"use strict";
const API=window.ITEWorkflow100, PLAN=window.ITEPlanning105, KEY="ITE-WORKFLOW-TEST-101";
if(!API||!PLAN||!document.body)return;
const host=document.createElement("section");host.id="ite-planning-106";host.className="panel";
host.innerHTML=`<h2>Agenda operativa 4.0.106 — TEST</h2><p class="hint">Dati fittizi esclusivamente nel browser. Gli appuntamenti aprono interventi e fascicoli collegati. Nessuna sincronizzazione o emissione ufficiale.</p>
<div class="grid"><label>Operatore responsabile<input id="p106-actor" value="Tecnico TEST"></label><label>Operatore assegnato<select id="p106-operator"></select></label><label>Cliente<select id="p106-client"></select></label><label>Sede<select id="p106-site"></select></label><label>Impianto<select id="p106-plant"></select></label><label>Apparecchiatura<select id="p106-device"></select></label><label>Inizio<input id="p106-start" type="datetime-local"></label><label>Fine<input id="p106-end" type="datetime-local"></label></div>
<div class="actions"><button id="p106-create" type="button">Fissa appuntamento</button><button id="p106-refresh" type="button" class="secondary">Aggiorna agenda</button></div>
<div class="grid"><label>Appuntamento<select id="p106-appointment"></select></label><label>Motivazione riprogrammazione<input id="p106-reason" placeholder="Motivazione (almeno 5 caratteri)"></label><label>Arrivo tecnico<input id="p106-arrival" type="datetime-local"></label><label>Uscita tecnico<input id="p106-departure" type="datetime-local"></label><label>Descrizione lavori<input id="p106-notes" placeholder="Lavori eseguiti"></label></div>
<div class="actions"><button id="p106-move" type="button">Riprogramma</button><button id="p106-arrive" type="button">Sono arrivato</button><button id="p106-close" type="button">Chiudi intervento</button><button id="p106-dossier" type="button" class="secondary">Apri fascicolo</button></div>
<p id="p106-status" role="status" aria-live="polite"></p><h3>Appuntamenti e interventi</h3><div id="p106-agenda"></div><h3>Fascicolo collegato</h3><pre id="p106-details" style="white-space:pre-wrap;overflow-wrap:anywhere;max-height:360px;overflow:auto"></pre>`;
(document.querySelector(".wrap")||document.body).appendChild(host);
const $=id=>host.querySelector("#p106-"+id), esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const load=()=>API.importJSON(localStorage.getItem(KEY)||API.exportJSON(API.fresh()));
const save=s=>localStorage.setItem(KEY,API.exportJSON(s));
const iso=id=>{const v=$(id).value;if(!v||!Number.isFinite(Date.parse(v)))throw Error("Data e ora obbligatorie: "+id);return new Date(v).toISOString();};
const local=v=>{if(!v)return "";const d=new Date(v);const z=n=>String(n).padStart(2,"0");return d.getFullYear()+"-"+z(d.getMonth()+1)+"-"+z(d.getDate())+"T"+z(d.getHours())+":"+z(d.getMinutes());};
const id=prefix=>prefix+"-"+Date.now().toString(36).toUpperCase()+"-"+Math.random().toString(36).slice(2,6).toUpperCase();
function options(select,rows,selected){select.innerHTML='<option value="">Seleziona...</option>'+rows.map(r=>'<option value="'+esc(r.id)+'"'+(r.id===selected?' selected':'')+'>'+esc(r.name||r.startsAt||r.id)+" ("+esc(r.id)+")</option>").join("");}
function render(){
const s=load(),r=s.records,keep={};["operator","client","site","plant","device","appointment"].forEach(k=>keep[k]=$(k).value);
options($("operator"),r.operators,keep.operator);options($("client"),r.clients,keep.client);
const client=$("client").value;options($("site"),r.sites.filter(x=>!client||x.clientId===client),keep.site);
const site=$("site").value;options($("plant"),r.plants.filter(x=>(!client||x.clientId===client)&&(!site||x.siteId===site)),keep.plant);
const plant=$("plant").value;options($("device"),r.devices.filter(x=>(!client||x.clientId===client)&&(!plant||x.plantId===plant)),keep.device);
options($("appointment"),r.appointments,keep.appointment);
$("agenda").innerHTML=r.appointments.slice().sort((a,b)=>String(a.startsAt).localeCompare(String(b.startsAt))).map(a=>{
const job=r.interventions.find(x=>x.appointmentId===a.id),op=r.operators.find(x=>x.id===a.operatorId);
return '<div class="item"><strong>'+esc(new Date(a.startsAt).toLocaleString("it-IT"))+' — '+esc(op?.name||a.operatorId)+'</strong><small>'+esc(a.id)+' | '+esc(a.status||"PROGRAMMATO")+' | '+esc(job?.status||"Da avviare")+'</small></div>';
}).join("")||'<p class="hint">Nessun appuntamento TEST.</p>';
}
function run(action){try{const s=load(),next=action(s);if(next){save(next);render();$("status").textContent="Operazione TEST salvata. Revisione "+next.revision;}}catch(e){$("status").textContent="Non salvato: "+e.message;}}
function actor(){const v=$("actor").value.trim();if(!v)throw Error("Operatore responsabile obbligatorio");return v;}
function appointment(){const v=$("appointment").value;if(!v)throw Error("Selezionare un appuntamento");return v;}
$("client").addEventListener("change",render);$("site").addEventListener("change",render);$("plant").addEventListener("change",render);
$("refresh").onclick=render;
$("create").onclick=()=>run(s=>PLAN.createAppointment(s,{id:id("TEST-APPT"),clientId:$("client").value,siteId:$("site").value,plantId:$("plant").value,deviceId:$("device").value,operatorId:$("operator").value,startsAt:iso("start"),endsAt:iso("end")},actor(),s.revision));
$("move").onclick=()=>run(s=>PLAN.reviseAppointment(s,appointment(),{startsAt:iso("start"),endsAt:iso("end"),operatorId:$("operator").value},actor(),$("reason").value,s.revision));
$("arrive").onclick=()=>run(s=>PLAN.startJob(s,appointment(),id("TEST-JOB"),iso("arrival"),actor(),s.revision));
$("close").onclick=()=>run(s=>{const job=s.records.interventions.find(x=>x.appointmentId===appointment()&&x.status==="IN_CORSO");if(!job)throw Error("Nessun intervento in corso");return PLAN.closeJob(s,job.id,iso("departure"),actor(),$("notes").value,s.revision);});
$("dossier").onclick=()=>{try{$("details").textContent=JSON.stringify(PLAN.dossier(load(),appointment()),null,2);$("status").textContent="Fascicolo TEST in sola lettura";}catch(e){$("status").textContent=e.message;}};
$("appointment").addEventListener("change",()=>{const a=load().records.appointments.find(x=>x.id===$("appointment").value);if(a){$("start").value=local(a.startsAt);$("end").value=local(a.endsAt);$("operator").value=a.operatorId;}});
render();
})();