/* I.T.E. 4.0.141 — touch booking and intervention console in the shared TEST session. */
(function(){"use strict";
let attempts=0;function mount(){
 const S=window.ITE_UnifiedSession129,A=window.ITE_CalendarActions141,B=window.ITE_Booking126;
 if(!S||!A||!B){if(++attempts<100)setTimeout(mount,100);return;}
 if(document.getElementById("ite-calendar-actions-141"))return;
 const e=(tag,text)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n;};
 const panel=e("section");panel.id="ite-calendar-actions-141";panel.className="panel";
 panel.append(e("h2","Agenda operativa 4.0.141 — TEST"),e("p","Prenotazione, disponibilità tecnico, arrivo, chiusura e revisione intervento. Solo dati fittizi; sessione temporanea, nessun salvataggio server."));
 const layout=e("div");layout.style.cssText="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px";panel.append(layout);
 const field=(label,tag="input")=>{const l=e("label",label),n=e(tag);l.style.cssText="display:flex;flex-direction:column;gap:4px";n.style.minHeight="44px";l.append(n);layout.append(l);return n;};
 const actor=field("Operatore TEST");actor.value="Tecnico TEST";
 const id=field("ID appuntamento");const client=field("Cliente","select"),site=field("Sede","select"),system=field("Impianto","select"),equipment=field("Apparecchiatura","select"),operator=field("Tecnico","select");
 const date=field("Data");date.type="date";date.value=new Date().toISOString().slice(0,10);
 const slot=field("Fascia disponibile","select");const kind=field("Tipo intervento");kind.value="MANUTENZIONE";const notes=field("Note fittizie","textarea");
 const buttons=e("div");buttons.style.cssText="display:flex;gap:8px;flex-wrap:wrap;margin:12px 0";panel.append(buttons);
 const output=e("p");output.setAttribute("aria-live","polite");panel.append(output);
 const task=field("Appuntamento per intervento","select"),at=field("Ora effettiva (locale)");at.type="datetime-local";const reason=field("Motivo revisione / altri lavori");
 const actions=e("div");actions.style.cssText="display:flex;gap:8px;flex-wrap:wrap;margin:12px 0";panel.append(actions);
 function options(node,items,blank=true){const prev=node.value;node.replaceChildren();if(blank){const o=e("option","Selezionare");o.value="";node.append(o);}for(const x of items){const o=e("option",x.label);o.value=x.id;node.append(o);}if(items.some(x=>x.id===prev))node.value=prev;}
 function refresh(){const c=S.get().field.catalog;options(client,c.clients.map(x=>({id:x.id,label:x.name})));options(site,c.sites.filter(x=>x.clientId===client.value).map(x=>({id:x.id,label:x.address})));options(system,c.systems.filter(x=>x.siteId===site.value).map(x=>({id:x.id,label:x.model||x.description||x.id})));options(equipment,c.equipment.filter(x=>x.systemId===system.value).map(x=>({id:x.id,label:x.model||x.id})));options(operator,c.operators.map(x=>({id:x.id,label:x.name})));options(task,c.appointments.map(x=>({id:x.id,label:x.startAt+" · "+x.id+" · "+x.status})));slots();}
 function slots(){try{if(!operator.value||!date.value){options(slot,[]);return;}const a=A.available(S.get(),operator.value,date.value);options(slot,a.map(x=>({id:x.startAt+"|"+x.endAt,label:x.startAt.slice(11)+" – "+x.endAt.slice(11)})));}catch(err){output.textContent=err.message;}}
 function button(name,where,fn){const b=e("button",name);b.type="button";b.style.minHeight="44px";b.onclick=()=>{try{fn();}catch(err){output.textContent="Errore: "+err.message;}};where.append(b);}
 button("Verifica e prenota",buttons,()=>{const times=slot.value.split("|"),record={id:id.value,clientId:client.value,siteId:site.value,systemId:system.value,equipmentId:equipment.value,operatorId:operator.value,kind:kind.value,notes:notes.value,startAt:times[0],endAt:times[1]};const v=A.validate(S.get(),record);if(!v.ok)throw Error("SOVRAPPOSIZIONE:"+v.conflicts.join(","));S.book(record,actor.value);output.textContent="Appuntamento TEST creato nella sessione condivisa.";});
 function transition(type){const data=A.intervention(S.get(),task.value);if(!data.allowed.includes(type))throw Error("TRANSIZIONE_NON_CONSENTITA");const details=type==="REVISE"?{reason:reason.value}:{at:at.value,additionalWork:type==="CLOSE"?reason.value:""};S.transition(type,task.value,actor.value,details);output.textContent=type+" registrato nella sessione TEST.";}
 button("Sono arrivato",actions,()=>transition("ARRIVE"));button("Chiudi intervento",actions,()=>transition("CLOSE"));button("Revisiona intervento",actions,()=>transition("REVISE"));
 client.onchange=()=>{site.value="";system.value="";equipment.value="";refresh();};site.onchange=()=>{system.value="";equipment.value="";refresh();};system.onchange=()=>{equipment.value="";refresh();};operator.onchange=slots;date.onchange=slots;
 S.subscribe(refresh);(document.querySelector("main")||document.body).append(panel);
 }if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",mount);else mount();
})();
