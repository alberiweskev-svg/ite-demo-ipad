/* I.T.E. 4.0.121 — unified TEST field operations panel; browser memory only. */
(function(){"use strict";function mount(){
 const api=window.ITE_FieldWorkspace121,host=document.getElementById("ite-doc-intake-114")||document.querySelector("main")||document.body;
 if(!api||!host||document.getElementById("ite-field-121"))return;
 const panel=document.createElement("section");panel.id="ite-field-121";panel.className="panel";
 const h=document.createElement("h2");h.textContent="Anagrafiche, agenda e interventi — TEST 4.0.121";panel.appendChild(h);
 const note=document.createElement("p");note.textContent="Solo dati fittizi. Workspace in memoria, senza sincronizzazione, salvataggio automatico o caricamento server. Esportare il JSON prima di chiudere la pagina.";panel.appendChild(note);
 const area=document.createElement("textarea");area.rows=9;area.setAttribute("aria-label","Workspace TEST JSON");panel.appendChild(area);
 const action=document.createElement("select");for(const name of ["clients","sites","systems","equipment","operators","appointments","arrive","close","revise"]){const option=document.createElement("option");option.value=name;option.textContent=name;action.appendChild(option);}panel.appendChild(action);
 const data=document.createElement("textarea");data.rows=4;data.placeholder='Record JSON TEST, oppure {"appointmentId":"A1","at":"2026-11-10T09:00:00Z","additionalWork":"","reason":""}';panel.appendChild(data);
 const actor=document.createElement("input");actor.value="Tecnico TEST";actor.setAttribute("aria-label","Operatore TEST");panel.appendChild(actor);
 const day=document.createElement("input");day.type="date";day.value="2026-11-10";panel.appendChild(day);
 const out=document.createElement("pre");out.style.whiteSpace="pre-wrap";out.style.overflowWrap="anywhere";out.setAttribute("aria-live","polite");
 let state=api.empty();function render(){area.value=JSON.stringify(state,null,2);}
 function button(label,fn){const b=document.createElement("button");b.type="button";b.textContent=label;b.addEventListener("click",()=>{try{fn();render();out.textContent="Operazione completata. Revisione TEST: "+state.revision;}catch(e){out.textContent="Errore: "+e.message;}});panel.appendChild(b);}
 button("Importa workspace TEST",()=>{const parsed=JSON.parse(area.value);const check=api.validate(parsed);if(!check.ok)throw Error(check.errors.join("; "));state=parsed;});
 button("Esegui operazione",()=>{const payload=JSON.parse(data.value),kind=action.value;if(kind==="appointments")state=api.schedule(state,payload,actor.value);else if(kind==="arrive")state=api.arrive(state,payload.appointmentId,payload.at,actor.value);else if(kind==="close")state=api.close(state,payload.appointmentId,payload.at,payload.additionalWork,actor.value);else if(kind==="revise")state=api.revise(state,payload.appointmentId,payload.reason,actor.value);else state=api.add(state,kind,payload,actor.value);});
 const agenda=document.createElement("button");agenda.type="button";agenda.textContent="Mostra agenda del giorno";agenda.addEventListener("click",()=>{try{out.textContent=JSON.stringify(api.agenda(state,day.value),null,2);}catch(e){out.textContent=e.message;}});panel.appendChild(agenda);
 panel.appendChild(out);host.appendChild(panel);render();
}if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",mount);else mount();})();
