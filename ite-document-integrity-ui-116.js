/* I.T.E. 4.0.116 — no fabricated registry entries, explicit fictional records only. */
(function(){"use strict";function mount(){
 if(!window.ITE_DocumentIntegrity116||document.getElementById("ite-document-integrity-116"))return;
 const api=window.ITE_DocumentIntegrity116,host=document.querySelector("main")||document.querySelector(".wrap")||document.body;
 const box=document.createElement("section");box.className="panel";box.id="ite-document-integrity-116";
 const h=document.createElement("h2");h.textContent="Fascicolo tecnico/fiscale — collegamenti verificati TEST";box.appendChild(h);
 const note=document.createElement("p");note.textContent="Solo dati fittizi inseriti manualmente. Non caricare documenti o dati reali. Nessun PDF viene letto, salvato o inviato. Gli ID devono esistere nell'archivio TEST indicato.";box.appendChild(note);
 const fields={};function field(name,label,multi){const l=document.createElement("label");l.textContent=label;const el=document.createElement(multi?"textarea":"input");if(multi)el.rows=4;el.setAttribute("aria-label",label);l.appendChild(el);box.appendChild(l);fields[name]=el;}
 field("registry","Archivio TEST JSON (clients, sites, plants, equipment, invoices)",true);
 fields.registry.value=JSON.stringify({clients:[{id:"C-TEST"}],sites:[{id:"S-TEST",clientId:"C-TEST"}],plants:[{id:"P-TEST",siteId:"S-TEST"}],equipment:[{id:"E-TEST",plantId:"P-TEST"}],invoices:[{id:"F-TEST",clientId:"C-TEST"}]},null,2);
 field("text","Testo fittizio documento",true);field("filename","Nome file fittizio");for(const [k,label] of [["clientId","ID cliente"],["siteId","ID sede"],["plantId","ID impianto"],["equipmentId","ID apparecchiatura (facoltativo)"],["originalInvoiceId","ID fattura originaria TD04 (se applicabile)"],["operator","Operatore TEST"]])field(k,label);
 const out=document.createElement("pre");out.style.whiteSpace="pre-wrap";out.style.overflowWrap="anywhere";out.setAttribute("aria-live","polite");
 const records=[];let pending=null;const read=()=>JSON.parse(fields.registry.value);
 function button(label,handler){const b=document.createElement("button");b.type="button";b.textContent=label;b.addEventListener("click",()=>{try{handler()}catch(e){out.textContent="Errore: "+e.message}});box.appendChild(b)}
 button("Verifica collegamenti",()=>{const links={};for(const k of ["clientId","siteId","plantId","equipmentId","originalInvoiceId"])links[k]=fields[k].value;pending=api.prepare({text:fields.text.value,filename:fields.filename.value},links,read());out.textContent=JSON.stringify(pending,null,2)});
 button("Conferma bozza TEST",()=>{if(!pending)throw Error("Verifica prima la bozza");const d=api.confirm(pending,fields.operator.value,read());records.push(d);pending=null;out.textContent=JSON.stringify(api.dossier(records,d.links.clientId),null,2)});
 box.appendChild(out);host.appendChild(box);
}if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",mount);else mount()})();
