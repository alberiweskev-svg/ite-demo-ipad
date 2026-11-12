/* I.T.E. 4.0.195 — single finance overview, TEST-only; no remote storage. */
(function(root){"use strict";
function init(){
 const d=root.document,F=root.ITE_FiscalWorkspaceBridge185,R=root.ITEFinanceReconciliation194;
 const S=root.ITE_Settlement190,I=root.ITE_Installments192;
 const parent=d&&d.getElementById("ite-fiscal-workspace-184");
 if(!parent||!F||!R||!S||!I)return;
 const panel=d.createElement("section");panel.className="panel";panel.id="ite-finance-overview-195";
 const heading=d.createElement("h3");heading.textContent="Controllo unico scadenze e rate — TEST";
 const help=d.createElement("p");help.className="hint";help.textContent="Confronta entrambi i registri senza sommare due volte una fattura. Solo dati fittizi, nessuna contabilità operativa o sincronizzazione.";
 const dateLabel=d.createElement("label");dateLabel.textContent="Situazione al";
 const date=d.createElement("input");date.type="date";date.value=new Date().toISOString().slice(0,10);dateLabel.append(date);
 const actions=d.createElement("div");actions.className="actions";
 const refresh=d.createElement("button");refresh.type="button";refresh.textContent="Verifica tutti i registri";
 const exportCsv=d.createElement("button");exportCsv.type="button";exportCsv.textContent="Esporta riepilogo CSV verificato";
 actions.append(refresh,exportCsv);
 const status=d.createElement("p");status.setAttribute("role","status");
 const output=d.createElement("div");output.setAttribute("aria-live","polite");
 panel.append(heading,help,dateLabel,actions,status,output);
 const first=d.getElementById("ite-settlement-workspace-191");if(first)parent.insertBefore(panel,first);else parent.append(panel);
 const euro=n=>(n/100).toLocaleString("it-IT",{style:"currency",currency:"EUR"});
 let latest=null;
 function snapshot(){
  const sessions=root.ITEFinanceSession195||{};
  if(typeof sessions.simple!=="function"||typeof sessions.installments!=="function")throw Error("REGISTRI_NON_DISPONIBILI");
  return R.audit(F.snapshot(),sessions.simple(),sessions.installments(),date.value,{simple:S,installments:I});
 }
 function render(){
  output.replaceChildren();latest=null;
  try{
   const report=snapshot();latest=report;exportCsv.disabled=!report.valid;
   status.textContent=report.valid?"Riconciliazione coerente — TEST.":"Operazione bloccata: "+report.issues.join("; ");
   const totals=d.createElement("p");totals.textContent="Crediti "+euro(report.totals.receivablesCents)+" · Incassato "+euro(report.totals.receivedCents)+" · Da incassare "+euro(report.totals.openReceivablesCents)+" · Debiti "+euro(report.totals.payablesCents)+" · Pagato "+euro(report.totals.paidCents)+" · Da pagare "+euro(report.totals.openPayablesCents);output.append(totals);
   const overdue=d.createElement("p");overdue.textContent="Scaduto da incassare "+euro(report.totals.overdueReceivablesCents)+" · Scaduto da pagare "+euro(report.totals.overduePayablesCents);output.append(overdue);
   for(const r of report.rows){const row=d.createElement("div");row.className="item";row.textContent=r.source+" · "+r.type+" · "+r.documentId+(r.installmentId?" / "+r.installmentId:"")+" · "+r.dueDate+" · residuo "+euro(r.outstandingCents);output.append(row)}
  }catch(err){exportCsv.disabled=true;status.textContent="Controllo non disponibile: "+err.message}
 }
 function download(text){const url=URL.createObjectURL(new Blob([text],{type:"text/csv;charset=utf-8"}));const a=d.createElement("a");a.href=url;a.download="ITE-4.0.195-RICONCILIAZIONE-TEST.csv";panel.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000)}
 refresh.addEventListener("click",render);date.addEventListener("change",render);
 exportCsv.addEventListener("click",()=>{try{const current=snapshot();if(!current.valid)throw Error("REPORT_NON_VALIDO");download(R.csv(current))}catch(e){status.textContent="Esportazione bloccata: "+e.message}});
 d.addEventListener("ite-finance-changed-195",render);
 render();
}
if(root.document){if(root.document.readyState==="loading")root.document.addEventListener("DOMContentLoaded",init,{once:true});else init()}
})(typeof globalThis!=="undefined"?globalThis:this);
