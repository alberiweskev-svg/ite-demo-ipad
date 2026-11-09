/* TEST-only integrated console for 4.0.123; data remain in page memory. */
(function(){
"use strict";
function mount(){
 if(!window.ITE_Operations123||document.getElementById("ite-operations-123"))return;
 const O=window.ITE_Operations123,section=document.createElement("section");section.id="ite-operations-123";section.className="panel";
 const h=document.createElement("h2");h.textContent="I.T.E. 4.0.123 — Workspace integrato TEST";section.appendChild(h);
 const p=document.createElement("p");p.className="hint";p.textContent="Anagrafiche, appuntamenti, interventi, preventivi, Extra e documenti fiscali in un unico stato TEST. Nessun dato viene inviato o salvato automaticamente. Non inserire dati reali.";section.appendChild(p);
 const actor=document.createElement("input");actor.value="Tecnico TEST";actor.setAttribute("aria-label","Operatore TEST");
 const type=document.createElement("select");type.setAttribute("aria-label","Operazione");
 const types=["ADD_CLIENT","ADD_SITE","ADD_SYSTEM","ADD_EQUIPMENT","ADD_OPERATOR","SCHEDULE","ARRIVE","CLOSE","REVISE","ESTIMATE","ACCEPT_ESTIMATE","EXTRA","APPROVE_EXTRA","INVOICE"];
 for(const t of types){const opt=document.createElement("option");opt.value=t;opt.textContent=t;type.appendChild(opt);}
 const payload=document.createElement("textarea");payload.rows=5;payload.setAttribute("aria-label","Comando JSON TEST");payload.value=JSON.stringify({record:{id:"CLI-TEST",name:"Cliente fittizio"}},null,2);
 const run=document.createElement("button");run.textContent="Esegui operazione TEST";run.type="button";
 const backup=document.createElement("button");backup.textContent="Esporta backup JSON TEST";backup.type="button";backup.className="secondary";
 const restore=document.createElement("button");restore.textContent="Ripristina JSON TEST";restore.type="button";restore.className="secondary";
 const dossier=document.createElement("button");dossier.textContent="Fascicolo cliente TEST";dossier.type="button";dossier.className="secondary";
 const output=document.createElement("pre");output.style.whiteSpace="pre-wrap";output.style.overflowWrap="anywhere";output.setAttribute("aria-live","polite");
 let state=O.empty();
 const show=x=>{output.textContent=JSON.stringify(x,null,2);};
 const label=(title,el)=>{const l=document.createElement("label");l.textContent=title;l.appendChild(el);section.appendChild(l);};
 label("Operatore",actor);label("Funzione",type);label("Dati comando JSON",payload);
 const buttons=document.createElement("div");buttons.className="actions";for(const b of [run,backup,restore,dossier])buttons.appendChild(b);section.appendChild(buttons);section.appendChild(output);
 run.onclick=()=>{try{state=O.apply(state,{type:type.value,...JSON.parse(payload.value)},actor.value);show({revision:state.revision,lastEvent:state.events.at(-1),counts:{clients:state.field.catalog.clients.length,appointments:state.field.catalog.appointments.length,estimates:state.commercial.estimates.length,extras:state.commercial.extras.length,invoices:state.commercial.invoices.length}});}catch(e){show({error:e.message});}};
 backup.onclick=()=>show(state);
 restore.onclick=()=>{try{state=O.restore(payload.value);show({restored:true,revision:state.revision});}catch(e){show({error:e.message});}};
 dossier.onclick=()=>{try{const v=JSON.parse(payload.value);show(O.dossier(state,v.clientId));}catch(e){show({error:e.message});}};
 (document.querySelector("main")||document.querySelector(".wrap")||document.body).appendChild(section);
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",mount);else mount();
})();