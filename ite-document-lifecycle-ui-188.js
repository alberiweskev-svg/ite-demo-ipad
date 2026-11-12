/* I.T.E. 4.0.188 — azioni documentali nella stessa demo TEST. */
(function(root){"use strict";
function init(){
 const d=root.document,F=root.ITE_FiscalTest183,L=root.ITE_DocumentLifecycle188;
 const host=d&&d.getElementById("ite-fiscal-workspace-184"),bridge=root.ITE_FiscalWorkspaceBridge185;
 if(!host||!F||!L||!bridge)return;
 const panel=d.createElement("div");panel.className="panel";
 const title=d.createElement("h4");title.textContent="Ciclo documentale TEST — Proforma / Vendita / TD04";
 const info=d.createElement("p");info.className="hint";info.textContent="Solo documenti fittizi. La vendita nasce in BOZZA da una proforma REGISTRATA; la TD04 nasce in BOZZA da una vendita REGISTRATA. Nessun invio SDI.";
 const source=d.createElement("select");source.setAttribute("aria-label","Documento origine");
 const number=d.createElement("input");number.placeholder="Numero documento TEST";number.setAttribute("aria-label","Numero documento");
 const date=d.createElement("input");date.type="date";date.value="2026-11-12";date.setAttribute("aria-label","Data documento");
 const sale=d.createElement("button");sale.textContent="Crea vendita da proforma";sale.type="button";
 const credit=d.createElement("button");credit.textContent="Crea TD04 da vendita";credit.type="button";
 const refresh=d.createElement("button");refresh.textContent="Aggiorna documenti";refresh.type="button";refresh.className="secondary";
 const status=d.createElement("p");status.setAttribute("role","status");
 const grid=d.createElement("div");grid.className="grid";grid.append(source,number,date);const actions=d.createElement("div");actions.className="actions";actions.append(sale,credit,refresh);
 panel.append(title,info,grid,actions,status);host.append(panel);
 function render(){const docs=bridge.snapshot().documents;source.replaceChildren();for(const doc of docs.filter(x=>x.status==="REGISTRATO"&&["PROFORMA","VENDITA"].includes(x.type))){const option=d.createElement("option");option.value=doc.id;option.textContent=doc.type+" · "+doc.number;source.append(option)}const report=L.reconcile(bridge.snapshot());status.textContent=report.valid?"Collegamenti coerenti. Proforma convertite: "+report.convertedProformas+"; vendite con TD04: "+report.creditedSales+".":"Anomalie: "+report.issues.map(x=>x.code).join(", ")}
 function act(kind){try{const original=bridge.snapshot(),doc=original.documents.find(x=>x.id===source.value);if(!doc)throw Error("SELEZIONARE_DOCUMENTO");if(!root.confirm("Creare una BOZZA TEST da "+doc.number+"?"))return;const store=F.importTest(F.exportTest(original));const result=kind==="sale"?L.createSale(store,doc.id,number.value.trim(),date.value):L.createCredit(store,doc.id,number.value.trim(),date.value);const importer=root.ITE_FiscalWorkspaceImport188;if(!importer)throw Error("IMPORTAZIONE_NON_DISPONIBILE");importer(F.exportTest(store));status.textContent="Creata bozza TEST "+result.number+".";render()}catch(e){status.textContent="Operazione respinta: "+e.message}}
 sale.addEventListener("click",()=>act("sale"));credit.addEventListener("click",()=>act("credit"));refresh.addEventListener("click",render);render();
}
if(root.document){if(root.document.readyState==="loading")root.document.addEventListener("DOMContentLoaded",init,{once:true});else init()}
})(typeof globalThis!=="undefined"?globalThis:this);
