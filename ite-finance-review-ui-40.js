/* I.T.E. 4.0.38 — pannello integrato di riconciliazione locale TEST. */
(function(root){'use strict';if(typeof document==='undefined')return;
function mount(){
 const host=document.getElementById('importazioni'),review=root.ITE40FinanceReview,ledgerApi=root.ITE40FinanceLedger;
 if(!host||!review||!ledgerApi)return;
 const panel=document.createElement('section');panel.className='panel';
 const title=document.createElement('h3');title.textContent='Riconciliazione fatture e anagrafiche TEST — 4.0.38';
 const note=document.createElement('p');note.textContent='Archivio esclusivamente locale e dimostrativo. Le anomalie non modificano le fatture. Nessun dato reale o documento viene trasmesso.';
 const form=document.createElement('form');form.innerHTML='<div class="grid"><label>ID soggetto TEST<input name="id" required value="TEST-C1"></label><label>Nome fittizio<input name="name" required value="Cliente dimostrativo"></label><label>Ruolo<select name="role"><option>CLIENTE</option><option>FORNITORE</option></select></label></div><button type="submit">Salva anagrafica TEST</button>';
 const actions=document.createElement('div');actions.className='actions';
 const refresh=document.createElement('button');refresh.type='button';refresh.textContent='Verifica registro e anagrafiche';
 const backup=document.createElement('button');backup.type='button';backup.textContent='Esporta anagrafiche TEST';backup.className='secondary';
 const picker=document.createElement('input');picker.type='file';picker.accept='.json,application/json';const pickerLabel=document.createElement('label');pickerLabel.textContent='Ripristina anagrafiche TEST ';pickerLabel.append(picker);
 actions.append(refresh,backup,pickerLabel);
 const output=document.createElement('pre');output.setAttribute('aria-live','polite');output.style.cssText='white-space:pre-wrap;overflow-wrap:anywhere;max-height:420px;overflow:auto';
 panel.append(title,note,form,actions,output);host.append(panel);
 let subjects,ledger;
 try{subjects=review.create(root.localStorage);subjects.load();ledger=ledgerApi.create(root.localStorage);ledger.load()}catch(e){output.textContent='Archivio non disponibile: '+e.message;return}
 function render(){
  try{
   const documents=ledgerApi.create(root.localStorage);const snapshot=documents.load();const result=subjects.audit(snapshot.documents);
   const euros=n=>(n/100).toFixed(2)+' €';
   output.textContent='Anagrafiche TEST: '+subjects.get().length+' | Documenti: '+result.documentCount+' | Stato: '+result.status+'\n'+
    'Acquisti: '+euros(result.totals.acquistiCents)+' | Vendite: '+euros(result.totals.venditeCents)+' | Proforma: '+euros(result.totals.proformaCents)+'\n'+
    'Note credito: '+euros(result.totals.noteCreditoCents)+' | Crediti residui: '+euros(result.totals.creditiResiduiCents)+'\n\n'+
    'Anomalie:\n'+(result.issues.length?result.issues.map(x=>x.documentId+' — '+x.code).join('\n'):'Nessuna')+
    '\n\nAnagrafiche:\n'+subjects.get().map(s=>s.id+' | '+s.role+' | '+s.name).join('\n');
  }catch(e){output.textContent='Verifica non completata: '+e.message}
 }
 form.addEventListener('submit',e=>{e.preventDefault();try{subjects.upsert(Object.fromEntries(new FormData(form)));render()}catch(err){output.textContent='Salvataggio rifiutato: '+err.message}});
 refresh.addEventListener('click',render);
 backup.addEventListener('click',()=>{const url=URL.createObjectURL(new Blob([subjects.exportBackup()],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='ite-anagrafiche-test.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)});
 picker.addEventListener('change',async()=>{const f=picker.files&&picker.files[0];if(!f)return;try{if(f.size>2000000)throw Error('BACKUP_TROPPO_GRANDE');subjects.restore(await f.text());render()}catch(e){output.textContent='Ripristino rifiutato: '+e.message}finally{picker.value=''}});
 render();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})(typeof window!=='undefined'?window:globalThis);
