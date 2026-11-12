/* I.T.E. 4.0.177 — iPad-friendly agenda giorno/settimana/mese in existing workspace. */
(function(root){"use strict";
function init(){const d=root.document,B=root.ITE_FieldWorkspaceBridge174,C=root.ITE_Calendar177;if(!d||!B||!C)return;const parent=d.getElementById("ite-field-workspace-172");if(!parent)return;
const host=d.createElement("section");host.id="ite-calendar-177";host.className="panel";parent.append(host);
const el=(tag,t)=>{const x=d.createElement(tag);if(t!==undefined)x.textContent=t;return x};
host.append(el("h3","Calendario operativo — TEST 4.0.177"));const note=el("p","Agenda collegata agli appuntamenti della sessione TEST. Non memorizza dati e non sostituisce il calendario operativo.");note.className="hint";host.append(note);
const controls=el("div");controls.className="actions";host.append(controls);
const date=el("input");date.type="date";date.value=new Date().toISOString().slice(0,10);date.setAttribute("aria-label","Data calendario");controls.append(date);
const mode=el("select");mode.setAttribute("aria-label","Vista calendario");[["giorno","Giorno"],["settimana","Settimana"],["mese","Mese"]].forEach(([v,t])=>{const o=el("option",t);o.value=v;mode.append(o)});mode.value="settimana";controls.append(mode);
const tech=el("select");tech.setAttribute("aria-label","Filtra tecnico");controls.append(tech);
const prev=el("button","Precedente"),next=el("button","Successivo"),print=el("button","Stampa agenda TEST");for(const b of [prev,next,print]){b.type="button";controls.append(b)}
const output=el("div");host.append(output);
const dateLabel=iso=>new Date(iso).toLocaleString("it-IT",{dateStyle:"short",timeStyle:"short"});
function move(n){if(!date.value)return;const r=C.range(date.value,mode.value);if(mode.value==="giorno")date.value=C.shift(date.value,n);else if(mode.value==="settimana")date.value=C.shift(date.value,n*7);else date.value=C.shift(r.first,n<0?-1:32).slice(0,7)+"-01";render()}
prev.addEventListener("click",()=>move(-1));next.addEventListener("click",()=>move(1));print.addEventListener("click",()=>{const w=root.open("","_blank");if(!w)return;const snap=C.project(B.snapshot(),date.value,mode.value,tech.value);const safe=t=>String(t??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));const html='<!doctype html><html lang="it"><meta charset="utf-8"><title>Agenda TEST</title><body><h1>Agenda I.T.E. — SOLO TEST</h1><p>'+safe(snap.range.first)+" — "+safe(snap.range.last)+'</p><table border="1" cellpadding="6"><tr><th>Inizio</th><th>Fine</th><th>Cliente</th><th>Sede</th><th>Apparecchiatura</th><th>Tecnico</th><th>Stato</th></tr>'+snap.rows.map(x=>"<tr>"+[x.start,x.end,x.client,x.site,x.equipment,x.operator,x.status].map(y=>"<td>"+safe(y)+"</td>").join("")+"</tr>").join("")+"</table></body></html>";w.document.write(html);w.document.close();w.focus();w.print()});
[date,mode,tech].forEach(x=>x.addEventListener("change",render));
function render(){const s=B.snapshot(),selected=tech.value;tech.replaceChildren();const all=el("option","Tutti i tecnici");all.value="";tech.append(all);s.operators.forEach(o=>{const x=el("option",o.name);x.value=o.id;tech.append(x)});tech.value=s.operators.some(x=>x.id===selected)?selected:"";
output.replaceChildren();let v;try{v=C.project(s,date.value,mode.value,tech.value)}catch(e){output.append(el("p",e.message));return}
output.append(el("h4",v.range.first+" — "+v.range.last));output.append(el("p",v.totals.appointments+" appuntamenti · "+v.totals.closed+" chiusi · "+v.totals.plannedMinutes+" minuti programmati · "+v.totals.workedMinutes+" minuti lavorati"));
if(v.overlaps.length)output.append(el("p","Attenzione: "+v.overlaps.length+" sovrapposizioni per tecnico"));
const workload=el("div");workload.className="item";workload.append(el("strong","Carico per tecnico"));v.technicians.forEach(t=>workload.append(el("p",t.name+": "+t.appointments+" appuntamenti · "+t.plannedMinutes+" minuti programmati · "+t.workedMinutes+" minuti lavorati")));output.append(workload);
const days=el("div");days.className="item";days.append(el("strong","Distribuzione giornaliera"));v.days.filter(x=>x.appointments.length).forEach(x=>days.append(el("p",x.date+": "+x.appointments.length+" appuntamenti · "+x.plannedMinutes+" minuti")));output.append(days);
const table=el("table");table.style.width="100%";const head=el("tr");["Inizio","Fine","Cliente / sede","Impianto","Tecnico","Stato"].forEach(t=>head.append(el("th",t)));table.append(head);
v.rows.forEach(a=>{const tr=el("tr");[dateLabel(a.start),dateLabel(a.end),a.client+" — "+a.site,a.equipment,a.operator,a.status+(a.interventionStatus?" / "+a.interventionStatus:"")].forEach(t=>tr.append(el("td",t)));table.append(tr)});output.append(table);if(!v.rows.length)output.append(el("p","Nessun appuntamento nel periodo selezionato."))}
B.subscribe(render);render()}
if(root.document){if(root.document.readyState==="loading")root.document.addEventListener("DOMContentLoaded",init,{once:true});else init()}
})(typeof globalThis!=="undefined"?globalThis:this);
