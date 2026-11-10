/* I.T.E. 4.0.130 — touch-friendly guided entry, same TEST session as 4.0.129. */
(function(){"use strict";
function mount(){
 const G=window.ITE_Guided130,S=window.ITE_UnifiedSession129;
 if(!G||!S||document.getElementById("ite-guided-130"))return;
 const node=(tag,txt)=>{const x=document.createElement(tag);if(txt!==undefined)x.textContent=txt;return x;};
 const panel=node("section");panel.id="ite-guided-130";panel.className="panel";
 panel.append(node("h2","I.T.E. 4.0.130 — Inserimento guidato TEST"),node("p","Un solo archivio di sessione con la console 4.0.129. Nessun dato reale, salvataggio automatico o invio online."));
 const actor=node("input");actor.value="Tecnico TEST";actor.setAttribute("aria-label","Operatore responsabile");
 const kind=node("select");for(const k of Object.keys(G.specs)){const o=node("option",k);o.value=k;kind.append(o);}
 const fields=node("div"),status=node("p"),form=node("form");
 status.setAttribute("aria-live","polite");form.append(node("label","Operatore TEST"),actor,node("label","Scheda"),kind,fields);
 const submit=node("button","Salva nella sessione TEST");submit.type="submit";form.append(submit);panel.append(form,status);
 const labels={id:"Codice univoco",name:"Nome",clientId:"Cliente",siteId:"Sede",systemId:"Impianto",equipmentId:"Apparecchiatura (facoltativa)",operatorId:"Tecnico",address:"Indirizzo",description:"Descrizione",brand:"Marca",model:"Modello",serial:"Matricola",color:"Colore",startAt:"Inizio (AAAA-MM-GGTHH:MM)",endAt:"Fine (AAAA-MM-GGTHH:MM)",kind:"Tipo intervento",notes:"Note"};
 const inputs={};
 function render(){
  const prev={};for(const [k,v] of Object.entries(inputs))prev[k]=v.value;
  for(const k of Object.keys(inputs))delete inputs[k];fields.replaceChildren();
  const current=kind.value,spec=G.specs[current],opts=G.options(S.get(),current,prev);
  for(const key of spec.fields){
   const wrap=node("label",labels[key]||key);wrap.style.cssText="display:flex;flex-direction:column;gap:5px;margin:10px 0";
   let input;
   if(opts[key]){input=node("select");const empty=node("option","— Seleziona —");empty.value="";input.append(empty);for(const choice of opts[key]){const opt=node("option",choice.label);opt.value=choice.value;input.append(opt);}}
   else {input=node("input");input.type="text";input.placeholder=key==="startAt"||key==="endAt"?"2026-11-10T09:00":labels[key]||key;}
   input.style.minHeight="44px";input.value=prev[key]||"";input.required=spec.required.includes(key);
   if(["clientId","siteId","systemId"].includes(key))input.addEventListener("change",render);
   inputs[key]=input;wrap.append(input);fields.append(wrap);
  }
 }
 kind.addEventListener("change",()=>{for(const k of Object.keys(inputs))delete inputs[k];render();});
 form.addEventListener("submit",e=>{e.preventDefault();try{const vals=Object.fromEntries(Object.entries(inputs).map(([k,v])=>[k,v.value]));const cmd=G.command(kind.value,vals,S.get());S.execute(cmd,actor.value);status.textContent="Registrazione TEST riuscita. Revisione "+S.get().revision;for(const key of Object.keys(inputs))delete inputs[key];render();}catch(err){status.textContent="Errore: "+err.message;}});
 S.subscribe(s=>{status.dataset.revision=String(s.revision);});
 render();(document.querySelector("main")||document.body).append(panel);
}
let attempts=0;function wait(){if(window.ITE_Guided130&&window.ITE_UnifiedSession129)mount();else if(++attempts<60)setTimeout(wait,100);}
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",wait);else wait();
})();
