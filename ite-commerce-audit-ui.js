/* I.T.E. 4.0 — audit contabile integrato, esclusivamente diagnostico. */
(function(root){'use strict';
const C=root.ITECommerce,L=root.ITECommerceLedger,H=root.ITEHierarchyWorkspace,A=root.ITECommerceAudit;
const el=(tag,text)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=String(text);return n};
const euro=n=>(n/100).toLocaleString('it-IT',{style:'currency',currency:'EUR'});
function mount(){
 if(!C||!L||!H||!A||!root.localStorage||document.getElementById('ite40-commerce-audit'))return;
 const host=document.getElementById('ite40-ledger')||document.getElementById('ite40-commerce')||document.querySelector('main');if(!host)return;
 const panel=el('section');panel.id='ite40-commerce-audit';panel.className='panel';
 panel.append(el('h2','Riconciliazione contabile e flussi di cassa — collaudo 4.0'),
 el('p','Analisi in sola lettura. Nessuna proposta modifica automaticamente fatture o movimenti. Usare soltanto dati fittizi.'));
 const controls=el('div');controls.className='actions';const label=el('label','Situazione alla data '),date=el('input');date.type='date';date.value=new Date().toISOString().slice(0,10);label.append(date);
 const run=el('button','Analizza contabilità');run.type='button';controls.append(label,run);
 const status=el('p');status.setAttribute('role','status');const output=el('div');panel.append(controls,status,output);host.append(panel);
 function table(headers,rows){const t=el('table'),head=el('thead'),tr=el('tr');headers.forEach(h=>tr.append(el('th',h)));head.append(tr);t.append(head);const body=el('tbody');for(const row of rows){const r=el('tr');row.forEach(v=>r.append(el('td',v)));body.append(r)}t.append(body);const wrap=el('div');wrap.className='commerce-table';wrap.style.overflowX='auto';wrap.append(t);return wrap}
 function render(){try{
 const masters=H.load(localStorage),commerce=C.load(localStorage,masters),ledger=L.load(localStorage,commerce);
 const report=A.audit(ledger,commerce,{asOf:date.value}),proposals=A.proposeStatuses(ledger,commerce,{asOf:date.value});
 output.replaceChildren();
 const summary=el('p','Crediti da incassare: '+euro(report.totals.receivablesCents)+' · Debiti da pagare: '+euro(report.totals.payablesCents)+' · Note di credito da recuperare: '+euro(report.totals.creditsToRecoverCents)+' · Regolato: '+euro(report.totals.settledCents));output.append(summary);
 output.append(el('h3','Documenti ('+report.documents.length+')'),table(['Documento','Tipo','Direzione','Totale','Regolato','Residuo','Stato registrato','Stato calcolato'],report.documents.map(d=>[d.number||d.invoiceId,d.kind,d.direction,euro(d.totalCents),euro(d.settledCents),euro(d.remainingCents),d.storedStatus,d.expectedStatus])));
 output.append(el('h3','Flussi mensili'),table(['Mese','Entrate','Uscite','Saldo'],report.cashByMonth.map(m=>[m.month,euro(m.incomingCents),euro(m.outgoingCents),euro(m.netCents)])));
 output.append(el('h3','Anomalie e proposte ('+report.warnings.length+')'));
 if(!report.warnings.length)output.append(el('p','Nessuna anomalia rilevata nel periodo selezionato.'));
 else output.append(table(['Documento','Segnalazione','Stato registrato','Stato atteso'],report.warnings.map(w=>[w.invoiceId,w.code,w.stored||'—',w.expected||'Da verificare'])));
 output.append(el('p','Proposte di riallineamento: '+proposals.proposals.length+'. Applicazione automatica disabilitata.'));
 status.textContent='Analisi completata alla data '+report.asOf+'. Nessun dato modificato.';
 }catch(e){status.textContent='Analisi non disponibile: '+e.message;output.replaceChildren()}}
 run.addEventListener('click',render);render();
}
root.ITECommerceAuditUI=Object.freeze({mount});
if(typeof document!=='undefined'){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount()}
})(typeof window!=='undefined'?window:globalThis);
