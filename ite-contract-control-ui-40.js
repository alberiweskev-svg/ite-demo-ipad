/* I.T.E. 4.0.60 — controllo contratti nella demo unica Safari, TEST. */
(function(root){'use strict';if(typeof document==='undefined'||!root.ITEContractControl40)return;
const C=root.ITEContractControl40,Q=root.ITEQuotes40,I=root.ITEInvoiceLedger40,S=root.ITEContractSettlement40;
const panel=document.createElement('section');panel.id='ite-contract-control-test';panel.className='panel';
const h=document.createElement('h2');h.textContent='Controllo contratti, acconti ed Extra — TEST 4.0.60';
const hint=document.createElement('p');hint.textContent='Riepilogo di sola lettura. Nessuna fattura emessa o dato trasmesso.';
const actions=document.createElement('div');actions.className='actions';const refresh=document.createElement('button'),download=document.createElement('button');refresh.type=download.type='button';refresh.textContent='Aggiorna controllo';download.textContent='Esporta CSV TEST';actions.append(refresh,download);
const status=document.createElement('p');status.setAttribute('role','status');const out=document.createElement('div');panel.append(h,hint,actions,status,out);
let latest=null;const read=(k,api)=>{const v=localStorage.getItem(k);return v?api.importJson(v):api.empty();};
function render(){try{const q=read('ITE-4-QUOTES-TEST-1',Q),i=read('ITE-4-INVOICES-TEST-1',I),raw=localStorage.getItem('ITE-4-CONTRACT-SETTLEMENT-TEST-1'),s=raw?S.importJson(raw,q,i):S.empty();latest=C.overview(q,i,s);out.replaceChildren();
const t=latest.totals,summary=document.createElement('p');summary.textContent='Contratti € '+t.contractTotal.toFixed(2)+' · Fatturato € '+t.billed.toFixed(2)+' · Incassato € '+t.paid.toFixed(2)+' · Da incassare € '+t.unpaid.toFixed(2)+' · Da fatturare € '+t.remainingToInvoice.toFixed(2);out.append(summary);
for(const c of latest.contracts){const p=document.createElement('p');p.className='item';p.textContent=c.id+' · '+c.customer+' · Contratto € '+c.contractTotal.toFixed(2)+' · Fatturato € '+c.billed.toFixed(2)+' · Residuo € '+c.remainingToInvoice.toFixed(2)+(c.issues.length?' · ATTENZIONE: '+c.issues.join(', '):'');out.append(p);}
const note=document.createElement('p');note.textContent='Fatture vendita TEST non collegate: '+latest.unlinkedSales.length+'. Segnalazioni: '+latest.warnings+'. '+latest.notice;out.append(note);status.textContent='Controllo aggiornato.';
}catch(e){latest=null;out.replaceChildren();status.textContent='Controllo non disponibile: '+e.message;}}
refresh.addEventListener('click',render);download.addEventListener('click',()=>{try{render();if(!latest)return;const blob=new Blob([C.csv(latest)],{type:'text/csv;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='ITE-4.0.60-contratti-TEST.csv';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}catch(e){status.textContent=e.message;}});
document.addEventListener('ite:invoice-ledger-updated',render);document.addEventListener('ite:quotes-updated',render);root.addEventListener('storage',e=>{if(['ITE-4-QUOTES-TEST-1','ITE-4-INVOICES-TEST-1','ITE-4-CONTRACT-SETTLEMENT-TEST-1'].includes(e.key))render();});
(document.querySelector('#ite-contract-settlement-test')||document.body).insertAdjacentElement('afterend',panel);render();
})(typeof globalThis!=='undefined'?globalThis:this);