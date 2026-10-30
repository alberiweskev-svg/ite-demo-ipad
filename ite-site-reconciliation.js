/* I.T.E. 4.0 — controllo integrato commessa, sola lettura.
   Importi approvati/fatturati/costi in imponibile; incassi e residui fatture al lordo IVA.
   Nessun utile definitivo, emissione fatture o movimento automatico. */
(function(root){'use strict';
const eq=(a,b)=>String(a??'')===String(b??'');
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const eur=c=>(c/100).toLocaleString('it-IT',{style:'currency',currency:'EUR'});
const safeCents=n=>Number.isSafeInteger(n)&&Math.abs(n)<=1e12?n:null;
const label=x=>String(x.number||x.description||x.name||x.id||'');
function analyze(site,core,commerce){
 if(!site||!(core?.cantieri||[]).some(s=>eq(s.id,site.id)&&eq(s.client_id,site.client_id))||!(core.clienti||[]).some(c=>eq(c.id,site.client_id)))throw Error('Cantiere e cliente non disponibili.');
 if(!root.ITEContractBilling?.calculate||!root.ITEJobEconomics?.analyze)throw Error('Moduli economici non disponibili.');
 const billing=root.ITEContractBilling.calculate(site,commerce);
 const costs=root.ITEJobEconomics.analyze(site,core,commerce);
 const alerts=[],sources=[],invoices=[];
 for(const w of billing.warnings||[])alerts.push({level:'warning',message:w});
 for(const w of costs.warnings||[])alerts.push({level:'warning',message:w});
 if(billing.settlementWarning)alerts.push({level:'warning',message:billing.settlementWarning});
 for(const source of billing.sources){
  if(!source.value)continue;
  const approved=safeCents(source.value.netCents),allocated=safeCents(source.allocatedCents);
  if(approved===null||allocated===null)throw Error('Importi lavori non validi.');
  sources.push({id:String(source.id),type:source.sourceType,label:label(source),approved,allocated,pending:approved-allocated});
  if(allocated===0)alerts.push({level:'info',message:'Lavoro approvato senza fattura attribuita: '+label(source)});
  if(allocated>approved)alerts.push({level:'warning',message:'Attribuzione superiore al lavoro approvato: '+label(source)});
 }
 for(const doc of billing.docs){
  if(!doc.value){
   alerts.push({level:'warning',message:'Fattura associata al cantiere con dati o cliente da verificare.'});
   continue;
  }
  const net=safeCents(doc.value.netCents),allocated=safeCents(doc.allocatedCents);
  if(net===null||allocated===null)throw Error('Importi fattura non validi.');
  invoices.push({id:String(doc.id),label:label(doc),net,allocated,pending:net-allocated});
  if(allocated===0)alerts.push({level:'info',message:'Fattura registrata non attribuita ai lavori: '+label(doc)});
  if(allocated>net)alerts.push({level:'warning',message:'Attribuzione superiore alla fattura: '+label(doc)});
 }
 const approved=safeCents(billing.approvedCents),attributed=safeCents(billing.attributedCents),
  invoiced=safeCents(billing.invoicedCents),knownCost=safeCents(costs.knownCost),
  collectedGross=safeCents(billing.settledGrossCents),outstandingGross=safeCents(billing.remainingGrossCents);
 if([approved,attributed,invoiced,knownCost,collectedGross,outstandingGross].some(n=>n===null))throw Error('Totali economici non validi.');
 const missingMaterialCost=Number(costs.material?.unknownCount||0);
 const openSessions=Number(costs.work?.unclosed||0);
 const unassignedMaterials=Array.isArray(costs.material?.unassigned)?costs.material.unassigned.length:0;
 if(missingMaterialCost)alerts.push({level:'warning',message:missingMaterialCost+' consumi senza costo storico verificato.'});
 if(openSessions)alerts.push({level:'warning',message:openSessions+' sessioni di lavoro aperte, escluse dai costi.'});
 if(unassignedMaterials)alerts.push({level:'info',message:unassignedMaterials+' consumi materiali non completamente attribuiti a Forniture.'});
 if(!sources.length)alerts.push({level:'warning',message:'Nessun lavoro approvato: confronto economico non disponibile.'});
 if(knownCost>approved&&sources.length)alerts.push({level:'warning',message:'Costi noti superiori ai lavori approvati: verificare il consuntivo.'});
 if(invoiced>attributed)alerts.push({level:'info',message:'Imponibile fatturato non completamente attribuito ai lavori approvati.'});
 if(attributed>approved)alerts.push({level:'warning',message:'Attribuzioni superiori all’imponibile approvato.'});
 const reliable=sources.length>0&&!missingMaterialCost&&!openSessions&&!billing.settlementWarning&&!(billing.warnings||[]).length&&!(costs.warnings||[]).length;
 return {siteId:String(site.id),clientId:String(site.client_id),siteName:String(site.name||site.id),
  approved,attributed,invoiced,knownCost,collectedGross,outstandingGross,
  approvedUnattributed:approved-attributed,invoiceUnattributed:invoiced-attributed,
  indicativeDifference:sources.length?approved-knownCost:null,
  reliable,alerts,sources,invoices,missingMaterialCost,openSessions,unassignedMaterials,
  materialCents:costs.materialCents,laborCents:costs.work.costCents,expenseCents:costs.expenseCents};
}
function render(site,core,commerce){
 const r=analyze(site,core,commerce),amount=n=>n===null?'Non disponibile':eur(n);
 return '<section class="panel" id="ite-site-reconciliation" data-recon-site="'+esc(site.id)+'"><h3>Quadro integrato commessa · lavori, fatture, incassi e costi</h3>'+
 '<p class="hint">Controllo interno in sola lettura. Imponibili approvati, attribuiti e fatturati separati dagli incassi lordi IVA. Non emette fatture, non modifica magazzino e non calcola l’utile fiscale.</p>'+
 '<dl class="data-pairs">'+[
 ['Lavori approvati (netto)',r.approved],['Attribuiti a fatture (netto)',r.attributed],
 ['Approvato non attribuito (netto)',r.approvedUnattributed],['Fatture registrate (netto)',r.invoiced],
 ['Fatture non attribuite (netto)',r.invoiceUnattributed],['Incassi/compensazioni fatture (lordo)',r.collectedGross],
 ['Residuo fatture (lordo)',r.outstandingGross],['Materiali costo noto',r.materialCents],
 ['Manodopera registrata',r.laborCents],['Spese aggiuntive',r.expenseCents],
 ['Totale costi noti',r.knownCost],['Differenza indicativa, NON utile',r.indicativeDifference]
 ].map(x=>'<div><dt>'+esc(x[0])+'</dt><dd>'+amount(x[1])+'</dd></div>').join('')+'</dl>'+
 '<p class="hint">'+(r.reliable?'I dati noti sono coerenti nei controlli automatici; restano esclusi oneri, imposte e costi non registrati.':'Confronto incompleto: verificare gli avvisi prima di utilizzare gli importi.')+'</p>'+
 (r.alerts.length?'<details open><summary>Verifiche e anomalie ('+r.alerts.length+')</summary>'+r.alerts.map(x=>'<p>'+esc(x.level==='warning'?'Da verificare: ':'Nota: ')+esc(x.message)+'</p>').join('')+'</details>':'')+
 '<details><summary>Preventivi ed Extra approvati ('+r.sources.length+')</summary>'+r.sources.map(x=>'<div class="item"><strong>'+esc(x.type==='quote'?'Preventivo · ':'Extra · ')+esc(x.label)+'</strong><p>Approvato '+eur(x.approved)+' · attribuito '+eur(x.allocated)+' · residuo '+eur(x.pending)+'</p></div>').join('')+'</details>'+
 '<details><summary>Fatture vendita valide ('+r.invoices.length+')</summary>'+r.invoices.map(x=>'<div class="item"><strong>'+esc(x.label)+'</strong><p>Imponibile '+eur(x.net)+' · attribuito '+eur(x.allocated)+' · non attribuito '+eur(x.pending)+'</p></div>').join('')+'</details>'+
 '<div class="actions"><button type="button" class="secondary" data-recon-csv="'+esc(site.id)+'">Esporta quadro CSV interno</button><a class="btn" href="#importazioni">Verifica fatture</a></div>'+
 '<p class="hint">La differenza indicativa non è un margine netto; incassi lordi e fatturato netto non sono sommabili. Nessun dato è inviato all’esterno.</p></section>';
}
function csv(site,core,commerce){
 const r=analyze(site,core,commerce),rows=[['Sezione','Cantiere','Riferimento','Descrizione','Importo EUR','Stato']];
 const add=(section,ref,description,n,status='')=>rows.push([section,r.siteName,ref,description,n===null?'':(n/100).toFixed(2),status]);
 add('Riepilogo','','Approvato netto',r.approved);
 add('Riepilogo','','Attribuito netto',r.attributed);
 add('Riepilogo','','Fatturato netto',r.invoiced);
 add('Riepilogo','','Incassato lordo',r.collectedGross);
 add('Riepilogo','','Residuo fatture lordo',r.outstandingGross);
 add('Riepilogo','','Costi noti',r.knownCost,'Parziale');
 add('Riepilogo','','Differenza indicativa',r.indicativeDifference,'NON UTILE');
 for(const x of r.sources)add('Lavoro',x.id,x.label,x.pending,'Approvato non attribuito');
 for(const x of r.invoices)add('Fattura',x.id,x.label,x.pending,'Imponibile non attribuito');
 for(const x of r.alerts)rows.push(['Verifica',r.siteName,'',x.message,'',x.level]);
 const cell=v=>{let s=String(v??'');if(/^[\s\uFEFF]*[=+@\-]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';};
 return '\uFEFF'+rows.map(row=>row.map(cell).join(';')).join('\r\n')+'\r\n';
}
function mount(){
 if(!root.document||!root.ITECommerce||!root.ITE||root.ITERouter?.current?.()!=='scheda-cantiere')return;
 const host=root.document.getElementById('worksite-detail'),id=host?.querySelector('[data-work-edit]')?.dataset.workEdit;
 if(!id)return;
 const core=root.ITE.snapshot(),site=core.cantieri.find(s=>eq(s.id,id));
 if(!site)return;
 const old=host.querySelector('#ite-site-reconciliation');
 if(old&&eq(old.dataset.reconSite,id))return;
 if(old)old.remove();
 try{host.insertAdjacentHTML('beforeend',render(site,core,root.ITECommerce.snapshot()));}
 catch(e){const warning=root.document.createElement('p');warning.textContent='Quadro commessa non disponibile: '+e.message;host.append(warning);}
}
function initialize(){
 const host=root.document.getElementById('worksite-detail');
 if(host)new MutationObserver(()=>mount()).observe(host,{childList:true});
 root.addEventListener('ite-pagechange',mount);
 root.document.addEventListener('click',e=>{
  const b=e.target.closest('[data-recon-csv]');if(!b)return;
  try{
   if(!root.confirm('Il CSV contiene dati di commessa NON cifrati. Esportare?'))return;
   const core=root.ITE.snapshot(),site=core.cantieri.find(s=>eq(s.id,b.dataset.reconCsv));
   if(!site)throw Error('Cantiere non trovato.');
   const blob=new Blob([csv(site,core,root.ITECommerce.snapshot())],{type:'text/csv;charset=utf-8'});
   const url=URL.createObjectURL(blob),a=root.document.createElement('a');
   a.href=url;a.download='ITE_quadro_commessa_'+String(site.id).replace(/[^A-Za-z0-9_-]/g,'')+'.csv';
   root.document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);
  }catch(err){root.alert('Quadro commessa: '+err.message);}
 });
 mount();
}
const api=Object.freeze({analyze,render,csv});
root.ITESiteReconciliation=api;
if(root.document&&root.addEventListener)root.addEventListener('ite-vault-ready',initialize);
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
