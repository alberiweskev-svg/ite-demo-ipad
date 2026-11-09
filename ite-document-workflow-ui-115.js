/* I.T.E. 4.0.115 — integrated fictional document review, no upload or persistence. */
(function(){"use strict";
function mount(){
 if(!window.ITE_DocumentWorkflow115||document.getElementById("ite-doc-review-115"))return;
 const api=window.ITE_DocumentWorkflow115, section=document.createElement("section");
 section.id="ite-doc-review-115";section.className="panel";
 const h=document.createElement("h2");h.textContent="Fascicolo documenti — revisione integrata TEST";section.appendChild(h);
 const p=document.createElement("p");p.className="hint";p.textContent="Solo dati fittizi. Nessun PDF, cliente reale o documento viene caricato, salvato o trasmesso. Conferma manuale obbligatoria.";section.appendChild(p);
 const txt=document.createElement("textarea");txt.rows=5;txt.placeholder="Testo documento fittizio";section.appendChild(txt);
 const file=document.createElement("input");file.placeholder="Nome documento fittizio";section.appendChild(file);
 const client=document.createElement("input");client.placeholder="ID cliente TEST (es. C1)";section.appendChild(client);
 const site=document.createElement("input");site.placeholder="ID sede TEST (es. S1)";section.appendChild(site);
 const plant=document.createElement("input");plant.placeholder="ID impianto TEST (es. I1)";section.appendChild(plant);
 const operator=document.createElement("input");operator.placeholder="Operatore TEST";section.appendChild(operator);
 const add=document.createElement("button");add.textContent="Aggiungi alla revisione";add.type="button";section.appendChild(add);
 const out=document.createElement("pre");out.style.whiteSpace="pre-wrap";out.style.overflowWrap="anywhere";out.setAttribute("aria-live","polite");section.appendChild(out);
 const records=[];let registry={clients:[],sites:[],plants:[],equipment:[],invoices:[]};
 const render=()=>{out.textContent=JSON.stringify({documents:records,dossier:api.dossier(records,client.value)},null,2)};
 add.addEventListener("click",()=>{
  try{
   const item=api.classifyBatch([{text:txt.value,filename:file.value}])[0];item.key="TEST-"+String(records.length+1).padStart(4,"0");
   const c=client.value.trim(),s=site.value.trim(),pl=plant.value.trim();
   registry.clients=c?[{id:c}]:[];registry.sites=s?[{id:s,clientId:c}]:[];registry.plants=pl?[{id:pl,siteId:s}]:[];
   const reviewed=api.review(item,{links:{clientId:c,siteId:s,plantId:pl},operator:operator.value},registry);
   records.push(reviewed);render();
  }catch(e){out.textContent="Errore: "+e.message}
 });
 const confirm=document.createElement("button");confirm.type="button";confirm.className="secondary";confirm.textContent="Conferma ultima bozza valida TEST";section.appendChild(confirm);
 confirm.addEventListener("click",()=>{try{if(!records.length)throw Error("Nessuna bozza");records[records.length-1]=api.approve(records[records.length-1],operator.value);render()}catch(e){out.textContent="Errore: "+e.message}});
 (document.querySelector("main")||document.querySelector(".wrap")||document.body).appendChild(section);
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",mount);else mount();
})();
