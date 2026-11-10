/* I.T.E. 4.0.134 — touch TEST guided assignment, shared 129 session. */
(function(){"use strict";
function mount(){
 if(document.getElementById("ite-document-links-134")||!window.ITE_DocumentLinks134||!window.ITE_UnifiedSession129)return;
 const session=window.ITE_UnifiedSession129,L=window.ITE_DocumentLinks134;
 const el=(tag,text)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n;};
 const panel=el("section");panel.id="ite-document-links-134";panel.className="panel";
 panel.append(el("h2","4.0.134 — Assegna documenti a interventi TEST"),el("p","Solo dati fittizi. Collegamento reversibile, con operatore e motivazione obbligatori; nessuna emissione o salvataggio remoto."));
 const group=el("select"),doc=el("select"),appointment=el("select"),actor=el("input"),reason=el("input"),status=el("p");
 actor.value="Tecnico TEST";reason.placeholder="Motivo della modifica";
 for(const [v,t] of [["estimates","Preventivi"],["invoices","Fatture / proforma / TD04"]]){const o=el("option",t);o.value=v;group.append(o);}
 const field=(title,input)=>{const label=el("label",title);label.style.cssText="display:flex;flex-direction:column;gap:5px;margin:8px 0";input.style.minHeight="40px";label.append(input);panel.append(label);};
 field("Categoria",group);field("Documento",doc);field("Appuntamento / intervento",appointment);field("Operatore",actor);field("Motivazione",reason);
 const option=(select,value,title)=>{const o=el("option",title);o.value=value;select.append(o);};
 const refreshAppointments=()=>{appointment.replaceChildren();option(appointment,"","Non attribuito alla sede");const id=doc.value;if(!id)return;try{for(const a of L.candidates(session.get(),group.value,id))option(appointment,a.id,a.id+" — "+a.startAt);const current=session.get().commercial[group.value].find(x=>x.id===id);appointment.value=current?.appointmentId||"";}catch(e){status.textContent=e.message;}};
 const refresh=()=>{const selected=doc.value;doc.replaceChildren();for(const x of session.get().commercial[group.value])option(doc,x.id,x.id+" — "+(x.type||x.status||""));if([...doc.options].some(x=>x.value===selected))doc.value=selected;refreshAppointments();};
 group.onchange=refresh;doc.onchange=refreshAppointments;
 const button=el("button","Salva collegamento TEST");button.type="button";button.onclick=()=>{try{L.assignSession(session,group.value,doc.value,appointment.value||null,actor.value,reason.value);status.textContent="Collegamento aggiornato nella sessione TEST.";reason.value="";}catch(e){status.textContent="Errore: "+e.message;}};
 panel.append(button,status);status.setAttribute("aria-live","polite");
 (document.querySelector("main")||document.body).append(panel);
 session.subscribe(refresh);
}
function wait(n=0){if(window.ITE_UnifiedSession129&&window.ITE_DocumentLinks134)mount();else if(n<80)setTimeout(()=>wait(n+1),150);}
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",()=>wait());else wait();
})();
