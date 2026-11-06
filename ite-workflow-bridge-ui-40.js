/* I.T.E. 4.0.42 — integrated workflow TEST controls, no production records. */
(function(root){'use strict';if(typeof document==='undefined')return;
function mount(){
 const host=document.getElementById('calendario')||document.getElementById('anagrafiche')||document.getElementById('importazioni');
 const engine=root.ITEWorkflows40,bridge=root.ITEWorkflowBridge40,hierarchy=root.ITE40HierarchyTest;
 if(!host||!engine||!bridge||!hierarchy)return;
 const panel=document.createElement('section');panel.className='panel';panel.id='ite-workflow-test';
 const title=document.createElement('h3');title.textContent='Appuntamenti, interventi e preventivi — TEST 4.0.42';
 const info=document.createElement('p');info.className='hint';info.textContent='Solo dati fittizi TEST e archivio locale. Sincronizzazione esplicita dalla gerarchia TEST; nessun accesso a dati operativi.';
 const status=document.createElement('p');status.setAttribute('aria-live','polite');
 const output=document.createElement('pre');output.style.cssText='white-space:pre-wrap;overflow-wrap:anywhere;max-height:380px;overflow:auto';
 const controls=document.createElement('div');controls.className='grid';
 function field(label,type='text'){const l=document.createElement('label');l.textContent=label;const input=document.createElement('input');input.type=type;input.required=true;l.append(input);return {l,input}}
 function selector(label){const l=document.createElement('label');l.textContent=label;const input=document.createElement('select');l.append(input);return {l,input}}
 const operator=field('ID operatore TEST'),operatorName=field('Nome operatore fittizio'),equipment=selector('Apparecchiatura'),technician=selector('Operatore'),appointment=field('ID appuntamento TEST'),start=field('Inizio','datetime-local'),end=field('Fine','datetime-local'),action=selector('Azione intervento'),when=field('Ora azione','datetime-local'),estimate=field('ID preventivo TEST'),client=selector('Cliente'),extra=field('ID voce Extra TEST'),amount=field('Importo Extra','number'),decision=selector('Esito Extra');
 for(const x of [operator,operatorName,equipment,technician,appointment,start,end,action,when,estimate,client,extra,amount,decision])controls.append(x.l);
 for(const v of ['ARRIVE','CLOSE','REVISE']){const o=document.createElement('option');o.value=v;o.textContent=v;action.input.append(o)}
 for(const v of ['ACCEPTED','REJECTED']){const o=document.createElement('option');o.value=v;o.textContent=v;decision.input.append(o)}
 amount.input.min='0';amount.input.step='0.01';
 const actions=document.createElement('div');actions.className='actions';
 function button(label,fn){const b=document.createElement('button');b.type='button';b.textContent=label;b.addEventListener('click',()=>{try{fn();status.textContent='Operazione TEST completata';render()}catch(e){status.textContent='Operazione rifiutata: '+e.message}});actions.append(b)}
 const db=bridge.create(root.localStorage,engine);
 try{db.load()}catch(e){status.textContent='Archivio locale non disponibile: '+e.message;return}
 const timestamp=v=>{if(!v)throw Error('Data e ora obbligatorie');return v+':00'};
 function render(){
  const d=db.get();
  for(const [select,rows] of [[equipment.input,d.equipment],[technician.input,d.operators],[client.input,d.clients]]){
   const old=select.value;select.replaceChildren();for(const r of rows){const o=document.createElement('option');o.value=r.id;o.textContent=(r.name||r.id)+' ('+r.id+')';select.append(o)}if(rows.some(x=>x.id===old))select.value=old;
  }
  output.textContent='Clienti '+d.clients.length+' | Sedi '+d.sites.length+' | Impianti '+d.plants.length+' | Apparecchiature '+d.equipment.length+' | Operatori '+d.operators.length+'\n\nAPPUNTAMENTI\n'+d.appointments.map(x=>x.id+' | '+x.start+' → '+x.end+' | '+x.operatorId+' | '+x.status).join('\n')+'\n\nINTERVENTI\n'+d.interventions.map(x=>x.id+' | '+x.status+' | eventi '+x.history.length).join('\n')+'\n\nPREVENTIVI\n'+d.estimates.map(x=>x.id+' | '+x.lines.map(l=>l.id+': '+l.amount+' € '+l.status).join(', ')).join('\n');
 }
 button('Sincronizza gerarchia TEST',()=>{const h=hierarchy.create(root.localStorage);h.load();db.sync(h.get())});
 button('Aggiungi operatore TEST',()=>db.operator(operator.input.value.trim(),operatorName.input.value.trim()));
 button('Fissa appuntamento',()=>{const d=db.get(),eq=d.equipment.find(x=>x.id===equipment.input.value);if(!eq)throw Error('Apparecchiatura mancante');const plant=d.plants.find(x=>x.id===eq.plantId),site=d.sites.find(x=>x.id===plant.siteId);db.schedule({id:appointment.input.value.trim(),equipmentId:eq.id,clientId:site.clientId,siteId:site.id,operatorId:technician.input.value,start:timestamp(start.input.value),end:timestamp(end.input.value)})});
 button('Registra arrivo / chiusura / revisione',()=>db.transition(appointment.input.value.trim(),action.input.value,timestamp(when.input.value),technician.input.value,'Operazione dimostrativa'));
 button('Crea preventivo TEST',()=>db.estimate(estimate.input.value.trim(),client.input.value));
 button('Aggiungi Extra',()=>db.addExtra(estimate.input.value.trim(),{id:extra.input.value.trim(),amount:Number(amount.input.value)}));
 button('Approva / rifiuta Extra',()=>db.approveExtra(estimate.input.value.trim(),extra.input.value.trim(),decision.input.value==='ACCEPTED'));
 button('Esporta backup TEST',()=>{const url=URL.createObjectURL(new Blob([db.backup()],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='ite-workflow-test-4.0.42.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)});
 const restore=document.createElement('input');restore.type='file';restore.accept='.json,application/json';restore.setAttribute('aria-label','Ripristina backup workflow TEST');
 restore.addEventListener('change',async()=>{try{const file=restore.files&&restore.files[0];if(!file)return;if(file.size>3000000)throw Error('File troppo grande');db.restore(await file.text());status.textContent='Backup TEST ripristinato';render()}catch(e){status.textContent='Ripristino rifiutato: '+e.message}finally{restore.value=''}});
 panel.append(title,info,controls,actions,restore,status,output);host.append(panel);render();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})(typeof window!=='undefined'?window:globalThis);
