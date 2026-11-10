/* I.T.E. 4.0.140 — touch day/week/month calendar, read-only TEST. */
(function(){"use strict";function mount(){const S=window.ITE_UnifiedSession129,C=window.ITE_Calendar140;if(!S||!C||document.getElementById("ite-calendar-140"))return;
const el=(tag,t)=>{const x=document.createElement(tag);if(t!==undefined)x.textContent=t;return x;};
const panel=el("section");panel.id="ite-calendar-140";panel.className="panel";panel.append(el("h2","Agenda integrata 4.0.140 — TEST"),el("p","Giorno, settimana e mese con tecnico, stato e tempi di intervento. Sola lettura; non inserire dati reali."));
const filters=el("div");filters.style.cssText="display:flex;gap:10px;flex-wrap:wrap;align-items:end";panel.append(filters);
function control(title,node){const l=el("label",title);l.style.cssText="display:flex;flex-direction:column;gap:4px";node.style.minHeight="44px";l.append(node);filters.append(l);}
const date=el("input");date.type="date";date.value=new Date().toISOString().slice(0,10);control("Data",date);
const mode=el("select");for(const x of ["giorno","settimana","mese"]){const o=el("option",x);o.value=x;mode.append(o);}mode.value="settimana";control("Vista",mode);
const op=el("select"),status=el("select");control("Tecnico",op);control("Stato",status);
const prev=el("button","Precedente"),next=el("button","Successivo"),print=el("button","Stampa agenda");for(const b of [prev,next,print]){b.type="button";b.style.minHeight="44px";filters.append(b);}
const info=el("p"),body=el("div");info.setAttribute("aria-live","polite");panel.append(info,body);
function choices(node,arr){const old=node.value;node.replaceChildren();const empty=el("option","Tutti");empty.value="";node.append(empty);for(const [value,label] of arr){const o=el("option",label);o.value=value;node.append(o);}node.value=arr.some(x=>x[0]===old)?old:"";}
function render(){try{const state=S.get(),cat=state.field.catalog;choices(op,cat.operators.map(x=>[x.id,x.name||x.id]));choices(status,[...new Set(cat.appointments.map(x=>x.status))].map(x=>[x,x]));const v=C.view(state,date.value,mode.value,op.value,status.value);
info.textContent=v.from+" — "+C.add(v.to,-1)+" · "+v.counts.appointments+" appuntamenti · "+v.counts.interventions+" interventi · "+v.counts.operators+" tecnici · "+v.conflicts.length+" sovrapposizioni rilevate";body.replaceChildren();
const wrap=el("div");wrap.style.overflowX="auto";const table=el("table");table.style.cssText="width:100%;min-width:680px;border-collapse:collapse";const head=el("tr");for(const h of ["Giorno","Orario","Cliente / sede","Tecnico","Stato","Intervento / tempi"]){const th=el("th",h);th.style.cssText="padding:8px;text-align:left;border-bottom:1px solid #999";head.append(th);}table.append(head);
for(const r of v.rows){const tr=el("tr"),values=[r.date,r.startAt.slice(11,16)+"–"+r.endAt.slice(11,16),r.client+" · "+r.site,r.operator,r.status,r.intervention?(r.intervention.status+" · "+(r.intervention.arrivedAt||"")+" / "+(r.intervention.departedAt||"")):"Non avviato"];for(const val of values){const td=el("td",val);td.style.cssText="padding:8px;border-bottom:1px solid #ddd";tr.append(td);}table.append(tr);}wrap.append(table);body.append(wrap);
if(!v.rows.length)body.append(el("p","Nessun appuntamento nel periodo selezionato."));const h=el("h3","Carico giornaliero per tecnico");body.append(h);for(const [key,minutes] of Object.entries(v.load))body.append(el("p",key.replace("|"," · ")+" — "+Math.round(minutes)+" minuti programmati"));if(v.conflicts.length)body.append(el("p","Attenzione: "+v.conflicts.map(x=>x.first+" / "+x.second).join(", ")));
}catch(e){info.textContent="Verifica agenda: "+e.message;body.replaceChildren();}}
for(const n of [date,mode,op,status])n.addEventListener("change",render);
function shift(n){try{date.value=C.add(date.value,mode.value==="giorno"?n:mode.value==="settimana"?n*7:n*28);render();}catch(e){info.textContent=e.message;}}
prev.onclick=()=>shift(-1);next.onclick=()=>shift(1);print.onclick=()=>window.print();S.subscribe(render);(document.querySelector("main")||document.body).append(panel);render();}
let tries=0;function wait(){if(window.ITE_Calendar140&&window.ITE_UnifiedSession129)mount();else if(++tries<100)setTimeout(wait,100);}if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",wait);else wait();
})();
