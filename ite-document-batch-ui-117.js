/* I.T.E. 4.0.117 — integrated local TEST batch panel, no file picker/network. */
(function(){"use strict";
function mount(){
 if(!window.ITE_DocumentBatch117||document.getElementById("ite-document-batch-117"))return;
 const api=window.ITE_DocumentBatch117,host=document.querySelector("main")||document.querySelector(".wrap")||document.body;
 const section=document.createElement("section");section.id="ite-document-batch-117";section.className="panel";
 const h=document.createElement("h2");h.textContent="Revisione documenti in lotto — TEST 4.0.117";section.appendChild(h);
 const note=document.createElement("p");note.className="hint";note.textContent="Solo dati inventati. Non inserire dati clienti o PDF reali. Il lotto rimane in memoria nella pagina e non viene salvato o inviato.";section.appendChild(note);
 function field(label,value,rows){const l=document.createElement("label");l.textContent=label;const e=document.createElement(rows?"textarea":"input");if(rows)e.rows=rows;e.value=value||"";l.appendChild(e);section.appendChild(l);return e;}
 const registry=field("Archivio anagrafico fittizio JSON",JSON.stringify({clients:[{id:"C-TEST"}],sites:[{id:"S-TEST",clientId:"C-TEST"}],plants:[{id:"P-TEST",siteId:"S-TEST"}],equipment:[{id:"E-TEST",plantId:"P-TEST"}],invoices:[{id:"F-TEST",clientId:"C-TEST"}]},null,2),5);
 const entries=field("Documenti TEST JSON (array: filename, text, links)",JSON.stringify([{filename:"dico-prova.pdf",text:"Dichiarazione di conformità numero 12 data 01/11/2026",links:{clientId:"C-TEST",siteId:"S-TEST",plantId:"P-TEST"}}],null,2),6);
 const operator=field("Operatore TEST","Tecnico prova");
 const list=document.createElement("div");const output=document.createElement("pre");output.setAttribute("aria-live","polite");output.style.whiteSpace="pre-wrap";output.style.overflowWrap="anywhere";
 let batch=null;
 function button(label,fn){const b=document.createElement("button");b.type="button";b.textContent=label;b.addEventListener("click",()=>{try{fn()}catch(e){output.textContent="Errore: "+e.message}});section.appendChild(b);}
 function render(){list.replaceChildren();if(!batch)return;for(const d of batch.documents){const l=document.createElement("label");l.className="item";const check=document.createElement("input");check.type="checkbox";check.dataset.key=d.key;check.style.width="auto";check.disabled=d.status!=="PRONTO_PER_CONFERMA";l.appendChild(check);l.appendChild(document.createTextNode(" "+d.key+" — "+d.metadata.type+" — "+d.status+" — "+(d.validation.issues||[]).join("; ")));list.appendChild(l);}}
 button("Analizza lotto TEST",()=>{batch=api.makeBatch(JSON.parse(entries.value),JSON.parse(registry.value));render();output.textContent=JSON.stringify({documents:batch.documents.map(d=>({key:d.key,status:d.status,validation:d.validation}))},null,2)});
 button("Conferma selezionati",()=>{if(!batch)throw Error("Analizzare prima il lotto");const keys=Array.from(list.querySelectorAll("input:checked")).map(e=>e.dataset.key);const result=api.approveBatch(batch,keys,operator.value,JSON.parse(registry.value));batch=result.batch;render();output.textContent=JSON.stringify({approved:result.approved,errors:result.errors},null,2)});
 button("Mostra fascicolo TEST",()=>{if(!batch)throw Error("Nessun lotto");output.textContent=JSON.stringify(api.dossier(batch),null,2)});
 section.appendChild(list);section.appendChild(output);host.appendChild(section);
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",mount);else mount();
})();
