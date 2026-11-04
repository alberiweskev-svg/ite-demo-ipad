/* Read-only financial audit panel; uses the same local TEST archive as finance demo. */
(function(root){'use strict';
if(typeof document==='undefined'||!root.ITEFinanceAudit)return;
const KEY='ite40-finance-demo-v1';
const el=(tag,text)=>{const x=document.createElement(tag);if(text!==undefined)x.textContent=String(text);return x};
function build(){
 if(document.getElementById('ite-finance-audit'))return;
 const parent=document.getElementById('ite-finance-demo');if(!parent)return;
 const box=el('div');box.id='ite-finance-audit';box.className='panel';
 box.appendChild(el('h3','Controllo incrociato documenti e movimenti'));
 box.appendChild(el('p','Analisi in sola lettura dell’archivio locale TEST-. Nessun dato viene inviato o pubblicato.'));
 const actions=el('div');actions.className='actions';
 const run=el('button','Verifica archivio');run.type='button';
 const exportBtn=el('button','Esporta esito JSON');exportBtn.type='button';exportBtn.className='secondary';
 actions.append(run,exportBtn);box.appendChild(actions);
 const out=el('div');out.id='ite-finance-audit-result';out.setAttribute('role','status');box.appendChild(out);
 parent.appendChild(box);
 let last=null;
 function inspect(){
  out.replaceChildren();last=null;
  try{
   const state=JSON.parse(localStorage.getItem(KEY)||'{"documents":[],"movements":[]}');
   if(!Array.isArray(state.documents)||state.documents.some(d=>!String(d.id||'').startsWith('TEST-')))throw Error('SOLO_ARCHIVIO_TEST');
   if(!Array.isArray(state.movements)||state.movements.some(m=>!String(m.id||'').startsWith('TEST-')))throw Error('SOLO_MOVIMENTI_TEST');
   const report=root.ITEFinanceAudit.inspect(state);last=root.ITEFinanceAudit.snapshot(state);
   out.appendChild(el('p','Documenti: '+report.counts.documents+' · Movimenti: '+report.counts.movements+' · Errori: '+report.counts.errors+' · Avvisi: '+report.counts.warnings));
   for(const item of report.errors)out.appendChild(el('p','ERRORE '+item.code+' — '+item.id));
   for(const item of report.warnings)out.appendChild(el('p','AVVISO '+item.code+' — '+item.id));
   const table=el('table'),head=el('tr');
   for(const name of ['Documento','Totale €','Associato €','Residuo €'])head.appendChild(el('th',name));
   table.appendChild(head);
   for(const b of report.balances){const row=el('tr');for(const val of [b.number,(b.totalCents/100).toFixed(2),(b.paidCents/100).toFixed(2),(b.remainingCents/100).toFixed(2)])row.appendChild(el('td',val));table.appendChild(row)}
   out.appendChild(table);
  }catch(e){out.appendChild(el('p','Verifica non disponibile: '+e.message))}
 }
 run.addEventListener('click',inspect);
 exportBtn.addEventListener('click',()=>{
  inspect();if(!last)return;
  const url=URL.createObjectURL(new Blob([JSON.stringify(last,null,2)],{type:'application/json'}));
  const a=el('a');a.href=url;a.download='ITE40-TEST-audit-contabile.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
 });
 inspect();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',build);else build();
})(typeof window!=='undefined'?window:globalThis);
