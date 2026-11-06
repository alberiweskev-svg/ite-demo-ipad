/* I.T.E. 4.0.39 — navigazione gerarchica TEST in demo unica. */
(function(root){'use strict';if(typeof document==='undefined')return;
function mount(){
 const host=document.getElementById('anagrafiche')||document.getElementById('importazioni'),api=root.ITE40HierarchyTest;if(!host||!api)return;
 const section=document.createElement('section');section.className='panel';
 const heading=document.createElement('h3');heading.textContent='Cliente → Sede → Impianto → Apparecchiatura → Intervento — TEST 4.0.39';
 const note=document.createElement('p');note.textContent='Solo dati fittizi TEST. Archivio locale indipendente: nessuna modifica alla versione operativa.';
 const form=document.createElement('form');
 const type=document.createElement('select');for(const t of api.TYPES){const o=document.createElement('option');o.value=t;o.textContent=t;type.append(o)}
 const id=document.createElement('input');id.required=true;id.value='TEST-C1';id.placeholder='TEST-ID';
 const nome=document.createElement('input');nome.required=true;nome.value='Cliente dimostrativo';nome.placeholder='Descrizione fittizia';
 const parent=document.createElement('select');const operator=document.createElement('input');operator.placeholder='TEST-OPERATORE';operator.value='TEST-TECNICO1';
 const status=document.createElement('select');for(const s of ['PROGRAMMATO','IN_CORSO','CHIUSO','REVISIONATO']){const o=document.createElement('option');o.value=s;o.textContent=s;status.append(o)}
 const arrivo=document.createElement('input');arrivo.type='datetime-local';const uscita=document.createElement('input');uscita.type='datetime-local';
 const submit=document.createElement('button');submit.type='submit';submit.textContent='Salva elemento TEST';
 const output=document.createElement('pre');output.style.cssText='white-space:pre-wrap;overflow-wrap:anywhere;max-height:400px;overflow:auto';output.setAttribute('aria-live','polite');
 const backup=document.createElement('button');backup.type='button';backup.textContent='Esporta gerarchia TEST';
 const restore=document.createElement('input');restore.type='file';restore.accept='.json,application/json';
 const refresh=document.createElement('button');refresh.type='button';refresh.textContent='Aggiorna elenco';
 form.append(type,id,nome,parent,operator,status,arrivo,uscita,submit);section.append(heading,note,form,refresh,backup,restore,output);host.append(section);
 let db;try{db=api.create(root.localStorage);db.load()}catch(e){output.textContent='Archivio non disponibile: '+e.message;return}
 const keys={sedi:'clienteId',impianti:'sedeId',apparecchiature:'impiantoId',interventi:'apparecchiaturaId'};
 const parents={sedi:'clienti',impianti:'sedi',apparecchiature:'impianti',interventi:'apparecchiature'};
 function fields(){const t=type.value;parent.replaceChildren();if(parents[t])for(const x of db.get()[parents[t]]){const o=document.createElement('option');o.value=x.id;o.textContent=x.nome+' ('+x.id+')';parent.append(o)}
 parent.hidden=!parents[t];operator.hidden=status.hidden=arrivo.hidden=uscita.hidden=t!=='interventi'}
 function render(){const all=db.get();output.textContent=api.TYPES.map(t=>t.toUpperCase()+' ('+all[t].length+')\n'+all[t].map(x=>x.id+' | '+x.nome+(keys[t]?' | '+x[keys[t]]:'')+(t==='interventi'?' | '+x.stato+' | '+x.operatoreId:'')).join('\n')).join('\n\n');fields()}
 type.addEventListener('change',fields);
 form.addEventListener('submit',e=>{e.preventDefault();try{const t=type.value,row={id:id.value.trim(),nome:nome.value.trim()};if(keys[t])row[keys[t]]=parent.value;if(t==='interventi'){row.operatoreId=operator.value.trim();row.stato=status.value;row.arrivo=arrivo.value?new Date(arrivo.value).getTime():null;row.uscita=uscita.value?new Date(uscita.value).getTime():null}db.upsert(t,row);render()}catch(err){output.textContent='Salvataggio rifiutato: '+err.message}});
 refresh.addEventListener('click',render);
 backup.addEventListener('click',()=>{const url=URL.createObjectURL(new Blob([db.exportBackup()],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='ite-gerarchia-test.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)});
 restore.addEventListener('change',async()=>{const f=restore.files&&restore.files[0];if(!f)return;try{if(f.size>3000000)throw Error('FILE_TROPPO_GRANDE');db.restore(await f.text());render()}catch(e){output.textContent='Ripristino rifiutato: '+e.message}finally{restore.value=''}});
 render();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})(typeof window!=='undefined'?window:globalThis);
