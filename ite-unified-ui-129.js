/* I.T.E. 4.0.129 - one touch-first TEST console for field and commercial operations. */
(function(){"use strict";
function mount(){
 if(document.getElementById("ite-unified-129")||!window.ITE_Unified129)return;
 const session=window.ITE_Unified129.create({operations:window.ITE_Operations123,audit:window.ITE_Audit124,booking:window.ITE_Booking126});
 const el=(tag,text)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n;};
 const section=el("section");section.id="ite-unified-129";section.className="panel";
 section.append(el("h2","I.T.E. 4.0.129 — Console unica TEST"),el("p","Dati esclusivamente fittizi. Nessuna persistenza, sincronizzazione remota o emissione fiscale. Non inserire clienti reali."));
 const actor=el("input");actor.value="Tecnico TEST";actor.setAttribute("aria-label","Operatore");
 const type=el("select");for(const v of ["ADD_CLIENT","ADD_SITE","ADD_SYSTEM","ADD_EQUIPMENT","ADD_OPERATOR","SCHEDULE","ARRIVE","CLOSE","REVISE","ESTIMATE","ACCEPT_ESTIMATE","EXTRA","APPROVE_EXTRA","INVOICE"]){const o=el("option",v);o.value=v;type.append(o);}
 const payload=el("textarea");payload.rows=5;payload.value=JSON.stringify({record:{id:"CLI-DEMO",name:"Cliente fittizio"}},null,2);
 const backup=el("textarea");backup.rows=5;backup.placeholder="Backup TEST JSON";
 const output=el("pre");output.setAttribute("aria-live","polite");output.style.cssText="white-space:pre-wrap;overflow-wrap:anywhere;max-height:280px;overflow:auto";
 const summary=el("p");summary.setAttribute("aria-live","polite");
 const label=(name,node)=>{const l=el("label",name);l.style.cssText="display:flex;flex-direction:column;gap:5px;margin:8px 0";node.style.minHeight="40px";l.append(node);section.append(l);};
 label("Operatore TEST",actor);label("Operazione",type);label("Dati comando JSON TEST",payload);
 const buttons=el("div");buttons.style.cssText="display:flex;flex-wrap:wrap;gap:8px";
 const add=(name,fn)=>{const b=el("button",name);b.type="button";b.onclick=()=>{try{fn();}catch(e){output.textContent="Errore: "+e.message;}};buttons.append(b);};
 const report=s=>{const c=s.field.catalog;summary.textContent="Revisione "+s.revision+" · Clienti "+c.clients.length+" · Appuntamenti "+c.appointments.length+" · Preventivi "+s.commercial.estimates.length+" · Extra "+s.commercial.extras.length+" · Fatture TEST "+s.commercial.invoices.length;};
 session.subscribe(report);
 add("Esegui operazione",()=>{const command={type:type.value,...JSON.parse(payload.value)};session.execute(command,actor.value);output.textContent="Operazione confermata nella sessione TEST.";});
 add("Fascicolo cliente",()=>{const id=JSON.parse(payload.value).clientId;output.textContent=JSON.stringify(window.ITE_Operations123.dossier(session.get(),id),null,2);});
 add("Agenda",()=>{const p=JSON.parse(payload.value);output.textContent=JSON.stringify(window.ITE_Operations123.agenda(session.get(),p.date,p.operatorId),null,2);});
 add("Prepara backup",()=>{backup.value=session.exportBackup();output.textContent="Backup TEST pronto: copiarlo e conservarlo.";});
 add("Ripristina backup",()=>{session.importBackup(backup.value,actor.value);output.textContent="Backup TEST ripristinato e verificato.";});
 add("Controllo integrità",()=>{output.textContent=JSON.stringify(window.ITE_Audit124.audit(session.get()),null,2);});
 section.append(buttons,summary);label("Backup TEST (copia/incolla)",backup);section.append(output);
 (document.querySelector("main")||document.querySelector(".wrap")||document.body).append(section);
 window.ITE_UnifiedSession129=session;
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",mount);else mount();
})();
