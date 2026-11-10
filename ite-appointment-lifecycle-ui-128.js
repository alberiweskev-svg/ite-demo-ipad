/* I.T.E. 4.0.128 — touch appointment editing, synthetic workspace only. */
(function(){"use strict";
function mount(){
 if(!window.ITE_AppointmentLifecycle128||document.getElementById("ite-appointment-lifecycle-128"))return;
 const section=document.createElement("section");section.id="ite-appointment-lifecycle-128";section.className="panel";
 const title=document.createElement("h2");title.textContent="I.T.E. 4.0.128 — Sposta / annulla appuntamenti TEST";
 const hint=document.createElement("p");hint.textContent="Solo workspace fittizi. Modifiche in memoria: esportare il backup prima di chiudere.";
 const data=document.createElement("textarea");data.rows=4;data.placeholder="Workspace ITE_OPERATIONS_123 oppure backup ITE_126_TEST_EXPORT";data.setAttribute("aria-label","Workspace JSON TEST");
 const form=document.createElement("div");form.style.cssText="display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:8px";
 function field(label,type="text"){const wrap=document.createElement("label");wrap.textContent=label;wrap.style.cssText="display:flex;flex-direction:column;gap:4px";const el=document.createElement("input");el.type=type;el.style.minHeight="44px";wrap.append(el);form.append(wrap);return el;}
 const appointment=document.createElement("select");appointment.style.minHeight="44px";const wrap=document.createElement("label");wrap.textContent="Appuntamento";wrap.append(appointment);form.append(wrap);
 const operator=document.createElement("select");operator.style.minHeight="44px";const opWrap=document.createElement("label");opWrap.textContent="Tecnico";opWrap.append(operator);form.append(opWrap);
 const start=field("Nuovo inizio","datetime-local"),end=field("Nuova fine","datetime-local"),actor=field("Operatore modifica"),reason=field("Motivo obbligatorio");
 const controls=document.createElement("div");controls.style.cssText="display:flex;flex-wrap:wrap;gap:8px;margin:12px 0";
 const output=document.createElement("pre");output.style.cssText="white-space:pre-wrap;overflow-wrap:anywhere";output.setAttribute("aria-live","polite");
 let state=null;
 function btn(label,fn){const b=document.createElement("button");b.type="button";b.textContent=label;b.style.minHeight="44px";b.onclick=()=>{try{fn();}catch(e){output.textContent="Errore: "+e.message;}};controls.append(b);}
 function refresh(){appointment.replaceChildren();operator.replaceChildren();if(!state)return;
  window.ITE_AppointmentLifecycle128.list(state).forEach(a=>{const o=document.createElement("option");o.value=a.id;o.textContent=a.startAt+" — "+a.id;appointment.append(o);});
  state.field.catalog.operators.forEach(a=>{const o=document.createElement("option");o.value=a.id;o.textContent=a.name;operator.append(o);});fill();
 }
 function fill(){if(!state)return;const a=state.field.catalog.appointments.find(x=>x.id===appointment.value);if(a){start.value=a.startAt;end.value=a.endAt;operator.value=a.operatorId;}}
 appointment.onchange=fill;
 btn("Carica TEST",()=>{const raw=JSON.parse(data.value);state=raw.format==="ITE_126_TEST_EXPORT"?window.ITE_Booking126.importBackup(raw):window.ITE_Operations123.restore(raw);refresh();output.textContent="Caricato workspace revisione "+state.revision;});
 btn("Sposta appuntamento",()=>{if(!state)throw Error("CARICA_WORKSPACE");state=window.ITE_AppointmentLifecycle128.change(state,{type:"RESCHEDULE",id:appointment.value,startAt:start.value,endAt:end.value,operatorId:operator.value,reason:reason.value},actor.value);refresh();output.textContent="Spostamento TEST registrato, revisione "+state.revision;});
 btn("Annulla appuntamento",()=>{if(!state)throw Error("CARICA_WORKSPACE");state=window.ITE_AppointmentLifecycle128.change(state,{type:"CANCEL",id:appointment.value,reason:reason.value},actor.value);refresh();output.textContent="Annullamento TEST registrato, revisione "+state.revision;});
 btn("Esporta backup TEST",()=>{if(!state)throw Error("CARICA_WORKSPACE");data.value=window.ITE_Booking126.exportBackup(state);output.textContent="Backup aggiornato nel campo testo. Copiare e conservare localmente.";});
 section.append(title,hint,data,controls,form,output);(document.querySelector("main")||document.querySelector(".wrap")||document.body).append(section);
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",mount);else mount();
})();
