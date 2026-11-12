/* I.T.E. 4.0.189 — pannello fascicolo economico nella demo unica, sola lettura. */
(function(root){"use strict";
function init(){
 const d=root.document,engine=root.ITE_OperationsDossier189;if(!d||!engine)return;
 const parent=d.getElementById("ite-fiscal-workspace-184");if(!parent)return;
 const section=d.createElement("section");section.className="panel";section.id="ite-operations-dossier-189";
 const title=d.createElement("h3");title.textContent="Fascicolo economico integrato — TEST 4.0.189";
 const note=d.createElement("p");note.className="hint";note.textContent="Riconciliazione proforma, vendite, acquisti e TD04 della sessione fittizia. Nessuna emissione fiscale, nessun invio dati.";
 const actions=d.createElement("div");actions.className="actions";
 const refresh=d.createElement("button");refresh.type="button";refresh.textContent="Aggiorna fascicolo TEST";
 const download=d.createElement("button");download.type="button";download.textContent="Esporta CSV verificato";
 const output=d.createElement("div");output.setAttribute("aria-live","polite");
 actions.append(refresh,download);section.append(title,note,actions,output);parent.append(section);
 let report=null;const euro=n=>(n/100).toLocaleString("it-IT",{style:"currency",currency:"EUR"});
 function render(){
  output.replaceChildren();try{
   const bridge=root.ITE_FiscalWorkspaceBridge185;if(!bridge)throw Error("REGISTRO_NON_DISPONIBILE");
   report=engine.build({fiscal:bridge.snapshot()});
   const p=d.createElement("p");p.textContent="Documenti: "+report.documents.length+" · Vendite registrate: "+euro(report.balance.salesCents)+" · TD04: "+euro(report.balance.creditsCents)+" · Vendite al netto delle note: "+euro(report.balance.netSalesCents)+" · Acquisti: "+euro(report.balance.purchasesCents);output.append(p);
   const status=d.createElement("p");status.textContent=report.valid?"Collegamenti e importi verificati.":"Anomalie: "+report.issues.map(x=>x.code).join(", ");output.append(status);
   const list=d.createElement("div");for(const doc of report.documents){const item=d.createElement("div");item.className="item";item.textContent=doc.type+" "+doc.number+" — "+doc.status+" — "+euro(doc.totalCents||0)+(doc.originProformaId?" · origine proforma: "+doc.originProformaId:"")+(doc.originSaleId?" · origine vendita: "+doc.originSaleId:"");list.append(item)}output.append(list);
   download.disabled=!report.valid||!report.documents.length;
  }catch(err){report=null;download.disabled=true;output.textContent="Fascicolo non disponibile: "+err.message;}
 }
 refresh.addEventListener("click",render);
 download.addEventListener("click",()=>{try{render();const csv=engine.csv(report);const url=URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"}));const a=d.createElement("a");a.href=url;a.download="ITE-4.0.189-FASCICOLO-TEST.csv";section.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000)}catch(e){output.textContent="Esportazione bloccata: "+e.message}});
 render();
}
if(root.document){if(root.document.readyState==="loading")root.document.addEventListener("DOMContentLoaded",init,{once:true});else init()}
})(typeof globalThis!=="undefined"?globalThis:this);
