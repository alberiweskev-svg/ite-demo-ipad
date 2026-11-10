/* I.T.E. 4.0.145 — touch closeout in existing shared TEST session. */
(function(){"use strict";let attempts=0;
function mount(){
 const S=window.ITE_UnifiedSession129,C=window.ITE_Closeout145,R=window.ITE_TechnicalReports143,O=window.ITE_Operations123;
 if(!S||!C||!R||!O){if(++attempts<80)setTimeout(mount,100);return;}
 if(document.getElementById("ite-closeout-145"))return;
 const el=(tag,txt)=>{const x=document.createElement(tag);if(txt!==undefined)x.textContent=txt;return x;};
 const panel=el("section");panel.id="ite-closeout-145";panel.className="panel";
 panel.append(el("h2","Chiusura intervento con rapporto — TEST 4.0.145"),el("p","Chiusura consentita solo con rapporto tecnico COMPLETATO, checklist terminata e operatore coerente. Dati fittizi; nessun salvataggio remoto."));
 const select=el("select"),actor=el("input"),departure=el("input"),extra=el("textarea"),status=el("p"),button=el("button","Verifica e chiudi intervento TEST");
 actor.value="Tecnico TEST";departure.type="datetime-local";extra.rows=2;button.type="button";
 for(const [name,input] of [["Appuntamento",select],["Operatore che registra",actor],["Ora uscita",departure],["Altri lavori eseguiti",extra]]){const l=el("label",name);l.style.display="block";l.append(input);panel.append(l);}
 panel.append(button,status);
 function refresh(){
  const state=S.get(),selected=select.value,c=state.field.catalog;select.replaceChildren();
  for(const a of c.appointments){const o=el("option",(a.startAt||"")+" · "+(c.clients.find(x=>x.id===a.clientId)?.name||a.clientId)+" · "+a.id);o.value=a.id;select.append(o);}
  if(c.appointments.some(x=>x.id===selected))select.value=selected;
  update();
 }
 function update(){
  if(!select.value){status.textContent="Nessun appuntamento TEST.";return;}
  try{const x=C.inspect(S.get(),select.value);status.textContent=x.ready?"Pronto per la chiusura.":"Stato "+x.status+" · "+(x.errors.join(", ")||"Nessuna anomalia");}
  catch(e){status.textContent=e.message;}
 }
 select.addEventListener("change",update);
 button.addEventListener("click",()=>{try{
  const state=S.get(),at=departure.value;if(!at)throw Error("ORA_USCITA_OBBLIGATORIA");
  const next=C.close(state,{appointmentId:select.value,departedAt:new Date(at).toISOString(),additionalWork:extra.value},actor.value,state.revision,{operations:O,reports:R});
  S.restore(next,actor.value);status.textContent="Intervento chiuso nella sessione TEST · revisione "+next.revision;
 }catch(e){status.textContent="Chiusura non eseguita: "+e.message;}});
 S.subscribe(refresh);(document.querySelector("main")||document.querySelector(".wrap")||document.body).append(panel);
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",mount);else mount();
})();
