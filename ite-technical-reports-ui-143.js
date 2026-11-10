/* I.T.E. 4.0.143 — editable TEST reports in shared session. */
(function(){"use strict";
let tries=0;
function mount(){
 const S=window.ITE_UnifiedSession129,R=window.ITE_TechnicalReports143,T=window.ITE_Technical142;
 if(!S||!R||!T){if(++tries<100)setTimeout(mount,100);return;}
 if(document.getElementById("ite-technical-reports-143"))return;
 const el=(tag,txt)=>{const n=document.createElement(tag);if(txt!==undefined)n.textContent=txt;return n;};
 const section=el("section");section.id="ite-technical-reports-143";section.className="panel";
 section.append(el("h2","Rapporti tecnici compilabili — TEST 4.0.143"),el("p","Scheda collegata all'appuntamento. Dati fittizi, senza caricamento fotografie, firma o invio server. I riferimenti agli allegati sono solo descrittivi."));
 const appointment=el("select"),operator=el("select"),status=el("select"),actor=el("input"),notes=el("textarea"),extra=el("textarea"),checks=el("div"),measurements=el("textarea"),attachments=el("textarea"),feedback=el("p");
 actor.value="Tecnico TEST";notes.rows=4;extra.rows=2;measurements.rows=3;attachments.rows=3;
 measurements.placeholder="Una misura per riga: pressione|1.5|bar";attachments.placeholder="Un riferimento per riga: FOTO|foto-fittizia.jpg";
 const add=(label,node)=>{const l=el("label",label);l.append(node);section.append(l);};
 add("Appuntamento",appointment);add("Operatore del rapporto",operator);add("Stato",status);add("Operatore che registra",actor);add("Descrizione, prove ed esito",notes);add("Altri lavori eseguiti",extra);
 section.append(el("h3","Checklist tecnica indicativa"),checks);
 add("Misure (descrizione|valore|unità)",measurements);add("Riferimenti allegati (FOTO/RAPPORTO/ALTRO|nome)",attachments);
 const save=el("button","Salva rapporto TEST");save.type="button";section.append(save,feedback);
 const option=(select,value,label)=>{const o=el("option",label);o.value=value;select.append(o);};
 function load(){
 const state=S.get(),c=state.field.catalog,old=(state.technicalReports||[]).find(x=>x.appointmentId===appointment.value);
 operator.replaceChildren();for(const x of c.operators)option(operator,x.id,x.name||x.id);
 status.replaceChildren();for(const x of R.states)option(status,x,x.replaceAll("_"," "));
 const a=c.appointments.find(x=>x.id===appointment.value);if(!a)return;
 operator.value=old?.operatorId||a.operatorId;status.value=old?.status||"BOZZA";notes.value=old?.notes||"";extra.value=old?.additionalWork||"";
 measurements.value=(old?.measurements||[]).map(x=>[x.label,x.value,x.unit].join("|")).join("\n");
 attachments.value=(old?.attachments||[]).map(x=>[x.type,x.name].join("|")).join("\n");
 checks.replaceChildren();const labels=old?.checks.map(x=>x.label)||T.templates[String(a.kind||"").toUpperCase()]||T.templates.CONTROLLO;
 for(const label of labels){const l=el("label"),input=el("input");input.type="checkbox";input.style.width="auto";input.dataset.label=label;input.checked=!!old?.checks.find(x=>x.label===label&&x.done);l.append(input,document.createTextNode(" "+label));checks.append(l);}
 }
 function refresh(){const c=S.get().field.catalog,current=appointment.value;appointment.replaceChildren();for(const a of c.appointments)option(appointment,a.id,(a.startAt||"")+" · "+(c.clients.find(x=>x.id===a.clientId)?.name||a.clientId)+" · "+a.id);if(c.appointments.some(x=>x.id===current))appointment.value=current;load();}
 appointment.onchange=load;
 const lines=(text,count)=>text.split(/\r?\n/).map(x=>x.trim()).filter(Boolean).map(line=>{const parts=line.split("|").map(x=>x.trim());if(parts.length!==count)throw Error("FORMATO_RIGA_NON_VALIDO");return parts;});
 save.onclick=()=>{try{
 const state=S.get(),a=state.field.catalog.appointments.find(x=>x.id===appointment.value);if(!a)throw Error("APPUNTAMENTO_MANCANTE");
 const old=(state.technicalReports||[]).find(x=>x.appointmentId===a.id);
 const record={id:old?.id||"TR-"+a.id,appointmentId:a.id,operatorId:operator.value,kind:a.kind||"CONTROLLO",status:status.value,notes:notes.value,additionalWork:extra.value,checks:[...checks.querySelectorAll("input")].map(x=>({label:x.dataset.label,done:x.checked})),measurements:lines(measurements.value,3).map(([label,value,unit])=>({label,value:Number(value),unit})),attachments:lines(attachments.value,2).map(([type,name])=>({type,name}))};
 const next=R.save(state,record,actor.value,state.revision);S.restore(next,actor.value);feedback.textContent="Rapporto salvato nella sessione TEST. Revisione "+next.revision;feedback.style.color="green";
 }catch(e){feedback.textContent="Errore: "+e.message;feedback.style.color="darkred";}};
 S.subscribe(refresh);(document.querySelector("main")||document.querySelector(".wrap")||document.body).append(section);
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",mount);else mount();
})();
