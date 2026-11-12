/* I.T.E. 4.0.191 — scadenziario integrato nella demo TEST, senza persistenza remota. */
(function(root){"use strict";
function init(){
 const d=root.document,A=root.ITE_Settlement190,F=root.ITE_FiscalWorkspaceBridge185;
 if(!d||!A||!F)return;
 const parent=d.getElementById("ite-fiscal-workspace-184");if(!parent)return;
 const section=d.createElement("section");section.className="panel";section.id="ite-settlement-workspace-191";
 const h=d.createElement("h3");h.textContent="Scadenziario e incassi/pagamenti — TEST";
 const note=d.createElement("p");note.className="hint";note.textContent="Solo dati fittizi e sessione temporanea. Nessuna contabilità, nessuna sincronizzazione, nessun documento reale.";
 const status=d.createElement("p");status.setAttribute("role","status");
 const form=d.createElement("form");form.className="grid";
 const label=(name,el)=>{const l=d.createElement("label");l.textContent=name;l.append(el);form.append(l);return el};
 const select=label("Fattura registrata",d.createElement("select"));
 const due=label("Scadenza",d.createElement("input"));due.type="date";due.required=true;due.value="2026-12-12";
 const add=d.createElement("button");add.type="submit";add.textContent="Crea scadenza TEST";form.append(add);
 const pay=d.createElement("form");pay.className="grid";
 const entrySelect=d.createElement("select");const wrap=d.createElement("label");wrap.textContent="Scadenza da incassare/pagare";wrap.append(entrySelect);pay.append(wrap);
 const amount=d.createElement("input");amount.type="number";amount.min="0.01";amount.step="0.01";amount.required=true;const amountWrap=d.createElement("label");amountWrap.textContent="Importo movimento (€)";amountWrap.append(amount);pay.append(amountWrap);
 const paidOn=d.createElement("input");paidOn.type="date";paidOn.value="2026-11-12";paidOn.required=true;const dateWrap=d.createElement("label");dateWrap.textContent="Data movimento";dateWrap.append(paidOn);pay.append(dateWrap);
 const method=d.createElement("select");for(const m of ["BONIFICO","CONTANTI","POS","ALTRO"]){const o=d.createElement("option");o.value=m;o.textContent=m;method.append(o)}const mw=d.createElement("label");mw.textContent="Metodo";mw.append(method);pay.append(mw);
 const payButton=d.createElement("button");payButton.type="submit";payButton.textContent="Registra movimento TEST";pay.append(payButton);
 const actions=d.createElement("div");actions.className="actions";const refresh=d.createElement("button");refresh.textContent="Aggiorna scadenziario";refresh.type="button";const csv=d.createElement("button");csv.textContent="Esporta CSV verificato";csv.type="button";const json=d.createElement("button");json.textContent="Esporta JSON TEST";json.type="button";const reset=d.createElement("button");reset.textContent="Svuota scadenziario TEST";reset.type="button";reset.className="secondary";actions.append(refresh,csv,json,reset);
 const output=d.createElement("div");output.setAttribute("aria-live","polite");section.append(h,note,form,pay,actions,status,output);parent.append(section);
 let ledger=A.create();let sequence=0;
 root.ITEFinanceSession195=root.ITEFinanceSession195||{};
 root.ITEFinanceSession195.simple=()=>JSON.parse(JSON.stringify(ledger));
 const conflicts=()=>{const other=root.ITEFinanceSession195.installments?.();return new Set((other?.plans||[]).map(p=>p.documentId));};
 const changed=()=>d.dispatchEvent(new Event("ite-finance-changed-195"));
 const euro=n=>(n/100).toLocaleString("it-IT",{style:"currency",currency:"EUR"});
 function download(name,content,type){const url=URL.createObjectURL(new Blob([content],{type}));const a=d.createElement("a");a.href=url;a.download=name;section.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000)}
 function snapshot(){return F.snapshot()}
 function report(){return A.inspect(snapshot(),ledger)}
 function render(){
  const fiscal=snapshot();const used=new Set([...ledger.entries.map(e=>e.documentId),...conflicts()]);select.replaceChildren();
  for(const doc of fiscal.documents.filter(x=>["VENDITA","ACQUISTO"].includes(x.type)&&x.status==="REGISTRATO"&&!used.has(x.id))){const o=d.createElement("option");o.value=doc.id;o.textContent=doc.type+" "+doc.number+" — "+euro(doc.totals.totalCents);select.append(o)}
  add.disabled=!select.options.length;entrySelect.replaceChildren();output.replaceChildren();
  let r;try{r=A.inspect(fiscal,ledger)}catch(e){status.textContent="Controllo non disponibile: "+e.message;payButton.disabled=true;return}
  status.textContent=r.valid?"Registro coerente — dati TEST.":"Anomalie: "+r.issues.join("; ");
  for(const row of r.rows){if(row.outstandingCents>0){const o=d.createElement("option");o.value=row.id;o.textContent=row.number+" — residuo "+euro(row.outstandingCents);entrySelect.append(o)}
   const item=d.createElement("div");item.className="item";item.textContent=row.type+" "+row.number+" · scadenza "+row.dueDate+" · totale "+euro(row.amountCents)+" · pagato "+euro(row.paidCents)+" · residuo "+euro(row.outstandingCents);output.append(item)}
  payButton.disabled=!entrySelect.options.length||!r.valid;csv.disabled=json.disabled=!r.valid;
  const t=d.createElement("strong");t.textContent="Da incassare "+euro(r.totals.openReceivablesCents)+" · Da pagare "+euro(r.totals.openPayablesCents);output.prepend(t);
 }
 form.addEventListener("submit",e=>{e.preventDefault();try{const doc=snapshot().documents.find(x=>x.id===select.value);if(!doc)throw Error("FATTURA_NON_SELEZIONATA");if(conflicts().has(doc.id))throw Error("FATTURA_GIA_RATEIZZATA");ledger=A.addEntry(snapshot(),ledger,{id:"sc_"+(++sequence),documentId:doc.id,dueDate:due.value,amountCents:doc.totals.totalCents});render();changed()}catch(e){status.textContent="Scadenza respinta: "+e.message}});
 pay.addEventListener("submit",e=>{e.preventDefault();try{const n=Number(amount.value);if(!Number.isFinite(n)||n<=0||Math.round(n*100)!==n*100)throw Error("IMPORTO_NON_VALIDO");ledger=A.addPayment(snapshot(),ledger,{id:"mov_"+(++sequence),entryId:entrySelect.value,date:paidOn.value,amountCents:Math.round(n*100),method:method.value});amount.value="";render()}catch(e){status.textContent="Movimento respinto: "+e.message}});
 refresh.addEventListener("click",render);
 csv.addEventListener("click",()=>{try{download("ITE-4.0.191-SCADENZIARIO-TEST.csv",A.csv(report()),"text/csv;charset=utf-8")}catch(e){status.textContent=e.message}});
 json.addEventListener("click",()=>{try{download("ITE-4.0.191-SCADENZIARIO-TEST.json",A.exportTest(snapshot(),ledger),"application/json")}catch(e){status.textContent=e.message}});
 reset.addEventListener("click",()=>{if(!root.confirm("Eliminare solo lo scadenziario fittizio?"))return;ledger=A.create();sequence=0;render();changed()});
 d.addEventListener("ite-finance-changed-195",render);
 render();
}
if(root.document){if(root.document.readyState==="loading")root.document.addEventListener("DOMContentLoaded",init,{once:true});else init()}
})(typeof globalThis!=="undefined"?globalThis:this);
