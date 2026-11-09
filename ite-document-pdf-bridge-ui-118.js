/* I.T.E. 4.0.118 — integrated PDF local intake in existing document workspace. */
(function(){"use strict";
function mount(){
 const api=window.ITE_DocumentPdfBridge118, batchApi=window.ITE_DocumentBatch117;
 if(!api||!batchApi||document.getElementById("ite-pdf-bridge-118"))return;
 const host=document.getElementById("ite-document-batch-117")||document.getElementById("ite-doc-intake-114");
 if(!host)return;
 const section=document.createElement("section");section.id="ite-pdf-bridge-118";section.className="panel";
 const h=document.createElement("h3");h.textContent="PDF locali → verifica documenti — 4.0.118";section.appendChild(h);
 const p=document.createElement("p");p.textContent="Elaborazione esclusivamente nel browser. Non vengono caricati o conservati PDF. Per i test usare solo documenti fittizi. PDF scansiti richiedono verifica manuale/OCR.";section.appendChild(p);
 function field(label,element){const l=document.createElement("label");l.textContent=label;l.appendChild(element);section.appendChild(l);return element;}
 const files=field("Seleziona PDF fittizi (massimo 20)",document.createElement("input"));files.type="file";files.accept=".pdf,application/pdf";files.multiple=true;
 const registry=field("Archivio fittizio JSON",document.createElement("textarea"));registry.rows=4;registry.value=JSON.stringify({clients:[{id:"C-TEST"}],sites:[{id:"S-TEST",clientId:"C-TEST"}],plants:[{id:"P-TEST",siteId:"S-TEST"}],equipment:[],invoices:[]});
 const links=field("Collegamenti JSON",document.createElement("textarea"));links.rows=2;links.value=JSON.stringify({clientId:"C-TEST",siteId:"S-TEST",plantId:"P-TEST"});
 const operator=field("Operatore TEST",document.createElement("input"));operator.value="Tecnico TEST";
 const result=document.createElement("pre");result.setAttribute("aria-live","polite");result.style.whiteSpace="pre-wrap";result.style.overflowWrap="anywhere";
 const selection=document.createElement("div");let state=null;
 function button(label,fn){const b=document.createElement("button");b.type="button";b.textContent=label;b.addEventListener("click",async()=>{b.disabled=true;try{await fn()}catch(e){result.textContent="Errore: "+e.message}finally{b.disabled=false}});section.appendChild(b);}
 function render(){selection.replaceChildren();if(!state)return;for(const d of state.batch.documents){const l=document.createElement("label");const c=document.createElement("input");c.type="checkbox";c.value=d.key;c.disabled=d.status!=="PRONTO_PER_CONFERMA";l.appendChild(c);l.appendChild(document.createTextNode(" "+d.key+" — "+d.metadata.type+" — "+d.status+" — "+d.validation.issues.join("; ")));selection.appendChild(l);}}
 button("Estrai e verifica PDF locali",async()=>{state=await api.preview(files.files,JSON.parse(registry.value),JSON.parse(links.value));files.value="";render();result.textContent=JSON.stringify(api.summary(state),null,2)});
 button("Conferma documenti TEST selezionati",()=>{if(!state)throw Error("Prima analizzare i PDF");const keys=Array.from(selection.querySelectorAll("input:checked")).map(c=>c.value);const approved=batchApi.approveBatch(state.batch,keys,operator.value,JSON.parse(registry.value));state.batch=approved.batch;render();result.textContent=JSON.stringify({approved:approved.approved,errors:approved.errors,dossier:batchApi.dossier(state.batch)},null,2)});
 section.appendChild(selection);section.appendChild(result);host.appendChild(section);
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",mount);else mount();
})();
