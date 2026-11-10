/* I.T.E. 4.0.126 — single integrated, touch-first TEST booking panel; memory only. */
(function(){"use strict";
function mount(){
 if(!window.ITE_Booking126||document.getElementById("ite-booking-126"))return;
 const section=document.createElement("section");section.id="ite-booking-126";section.className="panel";
 const h=document.createElement("h2");h.textContent="I.T.E. 4.0.126 — Appuntamenti e interventi TEST";section.append(h);
 const hint=document.createElement("p");hint.textContent="Solo dati fittizi. Nessun salvataggio remoto o automatico. Importare il workspace TEST; esportare un backup prima di chiudere la pagina.";section.append(hint);
 const workspace=document.createElement("textarea");workspace.rows=4;workspace.placeholder="Incolla workspace ITE_OPERATIONS_123 TEST oppure backup ITE_126_TEST_EXPORT";workspace.setAttribute("aria-label","Workspace TEST");section.append(workspace);
 const buttons=document.createElement("div");buttons.style.cssText="display:flex;flex-wrap:wrap;gap:8px";
 const button=(label,fn)=>{const b=document.createElement("button");b.type="button";b.textContent=label;b.onclick=fn;buttons.append(b);return b;};
 const form=document.createElement("div");form.style.cssText="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:8px;margin:12px 0";
 const field=(label,type="text")=>{const wrap=document.createElement("label");wrap.textContent=label;wrap.style.cssText="display:flex;flex-direction:column;gap:4px";const el=document.createElement("input");el.type=type;el.style.minHeight="40px";wrap.append(el);form.append(wrap);return el;};
 const selector=label=>{const wrap=document.createElement("label");wrap.textContent=label;wrap.style.cssText="display:flex;flex-direction:column;gap:4px";const el=document.createElement("select");el.style.minHeight="40px";wrap.append(el);form.append(wrap);return el;};
 const id=field("ID appuntamento"),client=selector("Cliente"),site=selector("Sede"),system=selector("Impianto"),equipment=selector("Apparecchiatura"),operator=selector("Tecnico");
 const start=field("Inizio","datetime-local"),end=field("Fine","datetime-local"),kind=selector("Tipo intervento"),notes=field("Note"),actor=field("Operatore che registra");
 for(const k of ["MANUTENZIONE_CALDAIA","RIPARAZIONE","CLIMATIZZAZIONE","IDRICO","ELETTRICO","SOPRALLUOGO","ALTRO"]){const o=document.createElement("option");o.value=k;o.textContent=k.replaceAll("_"," ");kind.append(o);}
 const job=selector("Appuntamento per intervento"),at=field("Ora arrivo/uscita","datetime-local"),reason=field("Motivo revisione"),additional=field("Lavori aggiuntivi");
 const output=document.createElement("pre");output.style.cssText="white-space:pre-wrap;overflow-wrap:anywhere;max-height:350px;overflow:auto";output.setAttribute("aria-live","polite");
 let state=null;
 const show=(message)=>{output.textContent=message;};
 const selectOptions=(el,arr,empty=true)=>{const old=el.value;el.replaceChildren();if(empty){const o=document.createElement("option");o.value="";o.textContent="Seleziona";el.append(o);}for(const x of arr){const o=document.createElement("option");o.value=x.id;o.textContent=x.label;el.append(o);}if([...el.options].some(x=>x.value===old))el.value=old;};
 const refresh=()=>{if(!state)return;const c=window.ITE_Booking126.choices(state,client.value,site.value,system.value);selectOptions(client,c.clients);selectOptions(site,c.sites);selectOptions(system,c.systems);selectOptions(equipment,c.equipment);selectOptions(operator,c.operators);selectOptions(job,state.field.catalog.appointments.map(a=>({id:a.id,label:a.id+" · "+a.startAt+" · "+a.status})));};
 const run=fn=>{try{fn();}catch(e){show("Errore: "+e.message);}};
 client.onchange=()=>{site.value="";system.value="";equipment.value="";refresh();};site.onchange=()=>{system.value="";equipment.value="";refresh();};system.onchange=()=>{equipment.value="";refresh();};
 button("Carica workspace TEST",()=>run(()=>{const raw=JSON.parse(workspace.value);state=raw.format==="ITE_126_TEST_EXPORT"?window.ITE_Booking126.importBackup(raw):window.ITE_Operations123.restore(raw);if(!window.ITE_Audit124.audit(state).ok)throw Error("AUDIT_NON_SUPERATO");refresh();show("Workspace caricato. Revisione "+state.revision);}));
 button("Crea appuntamento",()=>run(()=>{if(!state)throw Error("CARICA_WORKSPACE");state=window.ITE_Booking126.book(state,{id:id.value,clientId:client.value,siteId:site.value,systemId:system.value,equipmentId:equipment.value,operatorId:operator.value,startAt:start.value,endAt:end.value,kind:kind.value,notes:notes.value},actor.value);refresh();show("Appuntamento creato. Revisione "+state.revision);}));
 for(const [label,type] of [["Sono arrivato","ARRIVE"],["Chiudi intervento","CLOSE"],["Revisiona intervento","REVISE"]])button(label,()=>run(()=>{if(!state)throw Error("CARICA_WORKSPACE");state=window.ITE_Booking126.transition(state,type,job.value,actor.value,{at:at.value,reason:reason.value,additionalWork:additional.value});refresh();show(type+" registrato. Revisione "+state.revision);}));
 button("Esporta backup TEST",()=>run(()=>{if(!state)throw Error("CARICA_WORKSPACE");const data=window.ITE_Booking126.exportBackup(state);workspace.value=data;show("Backup TEST pronto nel campo testo: copiarlo e conservarlo prima di chiudere.");}));
 button("Agenda del giorno",()=>run(()=>{if(!state)throw Error("CARICA_WORKSPACE");const date=(start.value||at.value).slice(0,10);if(!date)throw Error("INDICA_DATA");show(JSON.stringify(window.ITE_Calendar125.calendar(state,{date,view:"day"}).entries,null,2));}));
 section.append(buttons,form,output);(document.querySelector("main")||document.querySelector(".wrap")||document.body).append(section);
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",mount);else mount();
})();
