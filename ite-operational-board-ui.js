/* I.T.E. 4.0 - integrated operational dashboard. Local read-only views. */
(function(root){'use strict';
const $=id=>document.getElementById(id);
const text=x=>String(x??'');
const esc=x=>text(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
const rows=x=>Array.isArray(x)?x:[];
let current=null,signature='';
function snapshot(){
 if(!root.ITEVault?.isUnlocked()||!root.ITE?.snapshot||!root.ITECommerce?.snapshot)throw Error('Sblocca prima l’archivio cifrato.');
 return {core:root.ITE.snapshot(),commerce:root.ITECommerce.snapshot()};
}
function filters(){
 return {clientId:$('ops-client').value,siteId:$('ops-site').value};
}
function inputSignature(data){return JSON.stringify(data);}
function options(){
 const data=snapshot(),selected=filters(),clients=rows(data.core.clienti),sites=rows(data.core.immobili);
 const client=$('ops-client'),site=$('ops-site');
 const previousClient=selected.clientId,previousSite=selected.siteId;
 client.replaceChildren(new Option('Tutti i clienti',''),...clients.map(c=>new Option(text(c.name||c.ragione_sociale||c.id),text(c.id))));
 client.value=clients.some(c=>text(c.id)===previousClient)?previousClient:'';
 site.replaceChildren(new Option('Tutte le sedi',''),...sites.filter(s=>!client.value||text(s.client_id)===client.value).map(s=>new Option(text(s.name||s.indirizzo||s.id),text(s.id))));
 site.value=sites.some(s=>text(s.id)===previousSite&&(!client.value||text(s.client_id)===client.value))?previousSite:'';
 return data;
}
function refresh(){
 const status=$('ops-status');
 try{
  const data=options(),board=root.ITEOperationalBoard.build(data.core,data.commerce,filters());
  const reconciliation=root.ITECoreReconciliation?.inspect(data.core,data.commerce);
  const hierarchy=root.ITECoreOperationsBridge?.bridge(data.core);
  current=board;signature=inputSignature(data);
  $('ops-summary').textContent=board.summary.items+' elementi · '+board.summary.blocking+' anomalie bloccanti · '+board.summary.review+' da verificare · '+board.workflow.totals.linked+' collegamenti operativi · '+board.workflow.totals.unlinked+' elementi scollegati';
  const kind=$('ops-kind').value,query=$('ops-search').value.trim().toLocaleLowerCase('it');
  const items=board.items.filter(x=>(!kind||x.kind===kind)&&(!query||[x.kind,x.id,x.status,x.description].join(' ').toLocaleLowerCase('it').includes(query)));
  $('ops-count').textContent=items.length+' elementi visualizzati';
  const list=$('ops-results');list.replaceChildren();
  for(const item of items.slice(0,500)){
   const el=document.createElement('article');el.className='item';
   const strong=document.createElement('strong');strong.textContent=item.kind+' · '+item.description;
   const small=document.createElement('small');small.textContent='ID '+item.id+' · Stato '+item.status+' · Sede '+(item.siteId||'non indicata');
   el.append(strong,small);list.append(el);
  }
  if(items.length>500){const p=document.createElement('p');p.textContent='Mostrati i primi 500 risultati. Usa i filtri.';list.append(p);}
  const issues=$('ops-issues');issues.replaceChildren();
  for(const link of board.workflow.links.slice(0,100)){
   const p=document.createElement('p');p.className='item';p.textContent='Flusso collegato · '+link.from+' → '+link.to;issues.append(p);
  }
  for(const warning of board.workflow.issues.slice(0,100)){
   const p=document.createElement('p');p.className='item';p.textContent='Flusso da verificare · '+warning.kind+' '+warning.id+' · '+warning.detail;issues.append(p);
  }
  for(const issue of board.issues.slice(0,200)){
   const p=document.createElement('p');p.className='item';p.textContent=issue.severity+' · '+issue.entity+' '+issue.id+' · '+issue.detail;issues.append(p);
  }
  if(hierarchy){
   const heading=document.createElement('h3');
   heading.textContent='Gerarchia cliente, sede, impianto, apparecchiatura';
   issues.append(heading);
   const counts=document.createElement('p');counts.className='item';
   const h=hierarchy.state;
   counts.textContent=h.clients.length+' clienti · '+h.sites.length+' sedi · '+h.systems.length+' impianti · '+h.devices.length+' apparecchiature · '+hierarchy.issues.length+' riferimenti da verificare';
   issues.append(counts);
   for(const issue of hierarchy.issues.slice(0,100)){
    const p=document.createElement('p');p.className='item';
    p.textContent='Gerarchia · '+issue.table+' · '+(issue.id||'senza ID')+' · '+issue.code;
    issues.append(p);
   }
  }
  if(reconciliation){
   const heading=document.createElement('h3');heading.textContent='Riconciliazione archivi (sola lettura)';issues.prepend(heading);
   const summary=document.createElement('p');summary.className='item';summary.textContent='Controlli incrociati: '+reconciliation.summary.appointments+' appuntamenti · '+reconciliation.summary.interventions+' interventi · '+reconciliation.summary.quotes+' preventivi · '+reconciliation.summary.extras+' Extra · '+reconciliation.summary.documents+' documenti · '+reconciliation.issues.length+' anomalie';heading.after(summary);
   if(reconciliation.supplierAudit?.length){
    const procurement=document.createElement('h3');procurement.textContent='Confronto preventivi fornitori / fatture acquisto';issues.append(procurement);
    const count=document.createElement('p');count.className='item';count.textContent=reconciliation.supplierAudit.length+' fatture controllate · '+reconciliation.supplierAudit.filter(x=>x.status==='DIFFERENZE').length+' con differenze · '+reconciliation.supplierAudit.filter(x=>x.status==='NON_ASSOCIATA').length+' non associate';issues.append(count);
    for(const audit of reconciliation.supplierAudit.slice(0,100)){
     const article=document.createElement('article');article.className='item';
     const heading=document.createElement('strong');heading.textContent='Fattura '+text(audit.invoiceId)+' · '+text(audit.status);article.append(heading);
     if(audit.quoteId){const ref=document.createElement('small');ref.textContent='Preventivo fornitore '+text(audit.quoteId);article.append(ref)}
     for(const change of rows(audit.differences).slice(0,100)){
      const line=document.createElement('p');
      line.textContent=text(change.code)+' · '+text(change.kind)+(Number.isFinite(change.delta)?' · differenza '+change.delta.toFixed(2)+' €':'')+(Number.isFinite(change.percent)?' ('+change.percent.toFixed(2)+'%)':'');
      article.append(line);
     }
     issues.append(article);
    }
   }
   if(reconciliation.supplierQuantityAudit?.length){
    const title=document.createElement('h3');title.textContent='Differenze quantità e prezzi fornitori';issues.append(title);
    for(const audit of reconciliation.supplierQuantityAudit.slice(0,100)){
     const article=document.createElement('article');article.className='item';
     const name=document.createElement('strong');name.textContent='Fattura '+text(audit.invoiceId)+' · '+text(audit.status);article.append(name);
     for(const difference of rows(audit.differences).slice(0,100)){
      const p=document.createElement('p');p.textContent=text(difference.code)+' · '+text(difference.kind)+' · '+Object.entries(difference).filter(([k,v])=>k!=='code'&&k!=='kind'&&(typeof v==='number'||typeof v==='string')).map(([k,v])=>k+': '+v).join(' · ');article.append(p);
     }
     issues.append(article);
    }
   }
   for(const issue of reconciliation.issues.slice(0,100)){
    const p=document.createElement('p');p.className='item';p.textContent='Riconciliazione · '+text(issue.domain||issue.table)+' · '+text(issue.id)+' · '+text(issue.code||issue.type);issues.append(p);
   }
  }
  status.textContent='Quadro aggiornato. Controlli incrociati in sola lettura; esportazione disponibile solo se i dati non cambiano.';
 }catch(e){current=null;signature='';$('ops-summary').textContent='';$('ops-results').replaceChildren();$('ops-issues').replaceChildren();status.textContent='Impossibile aggiornare: '+e.message;}
}
function download(type){
 try{
  if(!current)throw Error('Aggiorna il quadro prima di esportare.');
  const fresh=snapshot();
  if(inputSignature(fresh)!==signature)throw Error('Archivio modificato: aggiorna il quadro prima di esportare.');
  const rebuilt=root.ITEOperationalBoard.build(fresh.core,fresh.commerce,filters());
  const kind=$('ops-kind').value,query=$('ops-search').value.trim().toLocaleLowerCase('it');
  const filtered={...rebuilt,items:rebuilt.items.filter(x=>(!kind||x.kind===kind)&&(!query||[x.kind,x.id,x.status,x.description].join(' ').toLocaleLowerCase('it').includes(query)))};
  const data=type==='csv'?root.ITEOperationalBoard.csv(filtered):root.ITEOperationalBoard.html(filtered);
  const blob=new Blob([data],{type:type==='csv'?'text/csv;charset=utf-8':'text/html;charset=utf-8'});
  const url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download='ITE-quadro-operativo-interno.'+(type==='csv'?'csv':'html');
  document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
  $('ops-status').textContent='Esportazione interna preparata. Nessuna certificazione generata.';
 }catch(e){$('ops-status').textContent='Esportazione bloccata: '+e.message;}
}
function initSupplierWorkspace(){
 const host=$('ops-issues');if(!host||!root.ITEProcurementReviewWorkspace||$('ops-supplier-workspace'))return;
 const panel=document.createElement('section');panel.id='ops-supplier-workspace';panel.className='panel';
 const title=document.createElement('h3');title.textContent='Revisione locale righe fornitore (anteprima senza salvataggio)';
 const intro=document.createElement('p');intro.textContent='Incolla solo dati fittizi di prova. Nessun dato viene salvato o inserito automaticamente negli archivi.';
 const type=document.createElement('select');for(const t of ['Preventivo fornitore','Offerta fornitore','Fattura acquisto'])type.add(new Option(t,t));
 const id=document.createElement('input');id.placeholder='ID documento di prova';
 const supplier=document.createElement('input');supplier.placeholder='ID fornitore di prova';
 const raw=document.createElement('textarea');raw.rows=4;raw.placeholder='CODICE | QUANTITÀ | PREZZO | TOTALE (facoltativo)';
 const manual=document.createElement('textarea');manual.rows=4;manual.placeholder='Correggi: CODICE | QUANTITÀ | PREZZO, una riga per articolo';
 const operator=document.createElement('input');operator.placeholder='Operatore revisore (fittizio)';
 const quoteRef=document.createElement('input');quoteRef.placeholder='ID preventivo collegato (solo per fattura)';
 const compareButton=document.createElement('button');compareButton.type='button';compareButton.textContent='Confronta documenti confermati (solo anteprima)';
 let session=root.ITEProcurementReviewSession?.create();
 const output=document.createElement('pre');output.style.whiteSpace='pre-wrap';
 const stageButton=document.createElement('button');stageButton.type='button';stageButton.textContent='Prepara righe';
 const validateButton=document.createElement('button');validateButton.type='button';validateButton.textContent='Valida correzioni';
 const confirmButton=document.createElement('button');confirmButton.type='button';confirmButton.textContent='Conferma anteprima (non salvare)';
 let workspace=null;
 stageButton.addEventListener('click',()=>{try{
  workspace=root.ITEProcurementReviewWorkspace.prepare({id:id.value,type:type.value,supplierId:supplier.value,text:raw.value});
  manual.value=workspace.document.lines.map(x=>[x.code,x.qty,x.unitPrice].join(' | ')).join('\n');
  output.textContent='Righe riconosciute: '+workspace.document.lines.length+'; scartate: '+workspace.rejected.length+'\n'+JSON.stringify({issues:workspace.issues,rejected:workspace.rejected},null,2);
 }catch(e){output.textContent=e.message}});
 validateButton.addEventListener('click',()=>{try{
  if(!workspace)throw Error('Prepara prima il documento');
  workspace=root.ITEProcurementReviewWorkspace.correct(workspace,root.ITEProcurementReviewWorkspace.parseManual(manual.value));
  output.textContent=workspace.ready?'Righe valide. Puoi confermare l’anteprima.':'Correzioni necessarie: '+workspace.issues.join(', ');
 }catch(e){output.textContent=e.message}});
 confirmButton.addEventListener('click',()=>{try{
  if(!root.ITEProcurementReviewSession)throw Error('Modulo sessione non caricato');
  session=root.ITEProcurementReviewSession.add(session,workspace,root.ITEProcurementReviewWorkspace.parseManual(manual.value),operator.value,new Date().toISOString(),quoteRef.value);
  const confirmed=session.documents[session.documents.length-1];
  output.textContent='Documento aggiunto alla sessione temporanea, NON SALVATO: '+confirmed.id+' · '+confirmed.lines.length+' righe · totale '+session.documents.length+' documenti';
 }catch(e){output.textContent=e.message}});
 compareButton.addEventListener('click',()=>{try{
  if(!session)throw Error('Nessuna sessione disponibile');
  const result=root.ITEProcurementReviewSession.inspect(session);
  output.textContent='CONFRONTO TEMPORANEO (non salvato)\n'+JSON.stringify({documenti:result.documents,problemi:result.issues,prezzi:result.priceResult.records,quantita:result.quantityResult.records},null,2);
 }catch(e){output.textContent=e.message}});
 for(const element of [title,intro,type,id,supplier,raw,stageButton,manual,operator,quoteRef,validateButton,confirmButton,compareButton,output])panel.append(element);
 host.parentElement.append(panel);
}
function init(){
 if(!$('ops-client')||!root.ITEOperationalBoard)return;
 $('ops-client').addEventListener('change',()=>{$('ops-site').value='';refresh()});
 for(const id of ['ops-site','ops-kind','ops-search'])$(id).addEventListener(id==='ops-search'?'input':'change',refresh);
 $('ops-refresh').addEventListener('click',refresh);
 $('ops-csv').addEventListener('click',()=>download('csv'));
 $('ops-a4').addEventListener('click',()=>download('a4'));
 root.addEventListener('ite-pagechange',e=>{if(e.detail?.id==='quadro-operativo')refresh()});
 root.addEventListener('ite-vault-ready',refresh);
 initSupplierWorkspace();
 if(root.ITEVault?.isUnlocked())refresh();
}
if(typeof module!=='undefined'&&module.exports)module.exports={inputSignature};
if(typeof document!=='undefined')document.addEventListener('DOMContentLoaded',init,{once:true});
})(typeof window!=='undefined'?window:globalThis);
