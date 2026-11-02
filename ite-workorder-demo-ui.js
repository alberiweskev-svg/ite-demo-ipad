/* I.T.E. 4.0 — isolated synthetic ledger workspace, never writes operational records. */
(function(root){'use strict';
function init(){
const w=root.ITEWorkorderLedger,p=root.ITEWorkorderPersistence;if(!w||!p||!root.document)return;
const parent=document.querySelector('.wrap')||document.body;
const section=document.createElement('section');section.className='panel';section.id='ite-ledger-demo';
section.innerHTML='<h2>Interventi, preventivi ed Extra — collaudo 4.0</h2><p>Solo dati fittizi. Archivio locale di questo browser, separato dal gestionale operativo. Non inserire dati clienti reali.</p><p id="ite-ledger-status" role="status"></p><div style="display:flex;flex-wrap:wrap;gap:8px"><button type="button" data-action="new">Crea intervento demo</button><button type="button" data-action="quote">Aggiungi preventivo</button><button type="button" data-action="extra">Aggiungi Extra</button><button type="button" data-action="approve">Approva Extra</button><button type="button" data-action="download">Esporta backup JSON</button><button type="button" data-action="recover">Ripristina backup precedente</button></div><pre id="ite-ledger-output" style="white-space:pre-wrap;overflow-wrap:anywhere"></pre>';
parent.appendChild(section);const status=section.querySelector('#ite-ledger-status'),output=section.querySelector('#ite-ledger-output');
function show(message){try{const result=p.load(root.localStorage),s=result.state;status.textContent=message+(result.recovered?' — backup recuperabile':'');output.textContent='Revisione '+s.revision+' | Interventi '+s.orders.length+' | Preventivi '+s.quotes.length+' | Extra '+s.extras.length+(s.quotes.length?' | Totale ultimo preventivo € '+w.totals(s,s.quotes[s.quotes.length-1].id).gross.toFixed(2):'')}catch(e){status.textContent='Archivio non leggibile: '+e.message}}
function run(action){try{if(action==='download'){const blob=new Blob([p.exportBackup(root.localStorage)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='ite4-demo-backup.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);return show('Backup esportato')}
if(action==='recover'){p.restore(root.localStorage);return show('Backup precedente ripristinato')}
const loaded=p.load(root.localStorage);if(loaded.recovered)throw Error('Ripristinare il backup prima di modificare');const s=loaded.state,rev=s.revision,at=new Date().toISOString(),actor='TECNICO DEMO';let next;
if(action==='new'){const id='DEMO-O'+(s.orders.length+1);next=w.addOrder(s,rev,{id,clientId:'DEMO-C1',siteId:'DEMO-S1',systemId:'DEMO-I1',appointmentId:'DEMO-A'+(s.orders.length+1),operatorId:'DEMO-T1'},actor,at)}
else if(action==='quote'){const o=s.orders[s.orders.length-1];if(!o)throw Error('Creare prima un intervento');const id='DEMO-Q'+(s.quotes.length+1);next=w.addQuote(s,rev,{id,orderId:o.id,validDays:30,lines:[{id:id+'-F',type:'FORNITURA',description:'Lavabo dimostrativo',quantity:1,unitPrice:200,vatRate:10},{id:id+'-P',type:'POSA',description:'Posa dimostrativa',quantity:1,unitPrice:100,vatRate:10}]},actor,at)}
else if(action==='extra'){const q=s.quotes[s.quotes.length-1];if(!q)throw Error('Creare prima un preventivo');const id='DEMO-E'+(s.extras.length+1);next=w.addExtra(s,rev,{id,quoteId:q.id,lines:[{id:id+'-P',type:'POSA',description:'Lavorazione aggiuntiva demo',quantity:1,unitPrice:50,vatRate:10}]},actor,at)}
else if(action==='approve'){const e=s.extras.find(x=>x.status==='BOZZA'||x.status==='INVIATO');if(!e)throw Error('Nessun Extra da approvare');next=w.extraStatus(s,rev,e.id,e.status==='BOZZA'?'INVIATO':'ACCETTATO',actor,at)}
else return;
p.save(root.localStorage,next,rev,at);show('Operazione salvata localmente: '+action);
}catch(e){show('Operazione non riuscita: '+e.message)}}
section.addEventListener('click',e=>{const button=e.target.closest('button[data-action]');if(button)run(button.dataset.action)});show('Banco prova pronto');
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})(typeof window!=='undefined'?window:globalThis);
