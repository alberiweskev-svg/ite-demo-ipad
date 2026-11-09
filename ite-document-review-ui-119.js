/* I.T.E. 4.0.119 — unified touch PDF review with per-document links. */
(function(){"use strict";
function mount(){
 const pdf=window.ITE_DocumentPdfBridge118,api=window.ITE_DocumentReview119;
 const host=document.getElementById("ite-document-batch-117")||document.getElementById("ite-doc-intake-114");
 if(!pdf||!api||!host||document.getElementById("ite-pdf-review-119"))return;
 const section=document.createElement("section");section.id="ite-pdf-review-119";section.className="panel";
 const title=document.createElement("h3");title.textContent="PDF → revisione per documento — 4.0.119";section.appendChild(title);
 const note=document.createElement("p");note.className="hint";note.textContent="Solo PDF fittizi per collaudo. Lettura locale senza invio o salvataggio dei file. I PDF scansiti o illeggibili restano bloccati; le associazioni si correggono per ciascun documento.";section.appendChild(note);
 function field(name,element){const label=document.createElement("label");label.textContent=name;label.appendChild(element);section.appendChild(label);return element;}
 const files=field("PDF TEST (massimo 20)",document.createElement("input"));files.type="file";files.accept=".pdf,application/pdf";files.multiple=true;
 const registry=field("Archivio anagrafico TEST JSON",document.createElement("textarea"));registry.rows=4;registry.value=JSON.stringify({clients:[{id:"C-TEST"}],sites:[{id:"S-TEST",clientId:"C-TEST"}],plants:[{id:"P-TEST",siteId:"S-TEST"}],equipment:[],invoices:[]});
 const workspace=field("Workspace anagrafico TEST JSON (catalog con clients, sites, systems, equipment)",document.createElement("textarea"));workspace.rows=3;workspace.placeholder="Incollare solo dati fittizi; nessun caricamento automatico dall'archivio operativo";
 const invoices=field("Fatture TEST JSON (opzionale)",document.createElement("textarea"));invoices.rows=2;invoices.value="[]";
 const defaults=field("Collegamenti iniziali JSON",document.createElement("textarea"));defaults.rows=2;defaults.value=JSON.stringify({clientId:"C-TEST",siteId:"S-TEST",plantId:"P-TEST"});
 const operator=field("Operatore TEST",document.createElement("input"));operator.value="Tecnico TEST";
 const controls=document.createElement("div");controls.className="actions";section.appendChild(controls);
 const items=document.createElement("div");section.appendChild(items);
 const output=document.createElement("pre");output.setAttribute("aria-live","polite");output.style.whiteSpace="pre-wrap";output.style.overflowWrap="anywhere";section.appendChild(output);
 let state=null;
 function button(text,action){const b=document.createElement("button");b.type="button";b.textContent=text;b.addEventListener("click",async()=>{b.disabled=true;try{await action()}catch(e){output.textContent="Errore: "+e.message}finally{b.disabled=false}});controls.appendChild(b);}
 function readRegistry(){return JSON.parse(registry.value);}
 function render(){
  items.replaceChildren();if(!state)return;
  for(const d of state.batch.documents){
   const card=document.createElement("div");card.className="item";
   const h=document.createElement("strong");h.textContent=d.key+" — "+d.metadata.type+" — "+d.status;card.appendChild(h);
   const info=document.createElement("p");info.textContent="N. "+(d.metadata.number||"da verificare")+" · Data "+(d.metadata.date||"da verificare")+" · "+d.validation.issues.join("; ");card.appendChild(info);
   const select=document.createElement("input");select.type="checkbox";select.dataset.key=d.key;select.disabled=d.status!=="PRONTO_PER_CONFERMA";select.style.width="auto";card.appendChild(select);card.appendChild(document.createTextNode(" Seleziona per conferma"));
   const fields={};const grid=document.createElement("div");grid.className="grid";
   for(const key of ["clientId","siteId","plantId","equipmentId","originalInvoiceId"]){
    const l=document.createElement("label");l.textContent=key;const inp=document.createElement("input");inp.value=d.links[key]||"";inp.disabled=d.status==="CONFERMATO_TEST";fields[key]=inp;l.appendChild(inp);grid.appendChild(l);
   }
   card.appendChild(grid);
   const save=document.createElement("button");save.type="button";save.textContent="Verifica collegamenti";save.disabled=d.status==="CONFERMATO_TEST";
   save.addEventListener("click",()=>{try{const links={};for(const k in fields)links[k]=fields[k].value;state=api.updateLinks(state,d.key,links,readRegistry());render();output.textContent="Collegamenti verificati per "+d.key;}catch(e){output.textContent="Errore: "+e.message}});
   card.appendChild(save);items.appendChild(card);
  }
 }
 button("Collega anagrafiche TEST al controllo documenti",()=>{
  const bridge=window.ITE_DocumentRegistryBridge120;if(!bridge)throw Error("Adattatore anagrafiche non disponibile");
  if(!workspace.value.trim())throw Error("Inserire il workspace TEST");
  const mapped=bridge.addInvoices(bridge.convert(JSON.parse(workspace.value)),JSON.parse(invoices.value));
  registry.value=JSON.stringify(mapped,null,2);
  if(state){const result=bridge.audit(state,mapped);output.textContent=JSON.stringify(result,null,2);}
  else output.textContent="Anagrafiche TEST collegate: "+mapped.clients.length+" clienti, "+mapped.sites.length+" sedi, "+mapped.plants.length+" impianti, "+mapped.equipment.length+" apparecchiature.";
 });
 button("Rivaluta documenti confermati rispetto all'archivio TEST",()=>{
  if(!state)throw Error("Prima preparare una revisione");
  const bridge=window.ITE_DocumentRegistryBridge120;if(!bridge)throw Error("Adattatore non disponibile");
  output.textContent=JSON.stringify(bridge.audit(state,readRegistry()),null,2);
 });
 button("Estrai PDF e prepara revisione",async()=>{const preview=await pdf.preview(files.files,readRegistry(),JSON.parse(defaults.value));state=api.review(preview,readRegistry());files.value="";render();output.textContent=JSON.stringify(pdf.summary(preview),null,2);});
 button("Conferma documenti selezionati",()=>{if(!state)throw Error("Prima analizzare i PDF");const keys=Array.from(items.querySelectorAll("input[type=checkbox]:checked")).map(x=>x.dataset.key);const result=api.confirm(state,keys,operator.value,readRegistry());state=result.state;render();output.textContent=JSON.stringify({approved:result.approved,errors:result.errors},null,2);});
 button("Visualizza metadati TEST",()=>{if(!state)throw Error("Nessuna revisione");output.textContent=JSON.stringify(api.exportMetadata(state),null,2);});
 host.appendChild(section);
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",mount);else mount();
})();
