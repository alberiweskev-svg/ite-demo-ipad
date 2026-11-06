/* I.T.E. 4.0.49: non-destructive document preparation panel, TEST only. */
(function(root){'use strict';if(typeof document==='undefined')return;
function mount(){
 const api=root.ITEDocumentPreparation40,host=document.getElementById('ite-dossier-test');
 if(!api||!host)return;
 const panel=document.createElement('section');panel.className='panel';panel.id='ite-preparation-test';
 const heading=document.createElement('h4');heading.textContent='Preparazione documenti tecnici — TEST 4.0.49';
 const warning=document.createElement('p');warning.className='hint';warning.textContent='Bozza strutturata per Di.Co., Di.Ri., GAS, POS, CAD e rapporti. Non importa PDF, non firma, non emette dichiarazioni. Dati esclusivamente fittizi.';
 const select=document.createElement('select'),refresh=document.createElement('button'),fields=document.createElement('div'),preview=document.createElement('pre'),message=document.createElement('p'),generate=document.createElement('button');
 refresh.type='button';refresh.textContent='Aggiorna fascicoli TEST';
 generate.type='button';generate.textContent='Prepara bozza per revisione';
 preview.style.cssText='white-space:pre-wrap;overflow-wrap:anywhere';
 message.setAttribute('aria-live','polite');fields.className='grid';
 panel.append(heading,warning,select,refresh,fields,generate,message,preview);host.append(panel);
 let docs=[];
 function current(){return docs.find(d=>d.id===select.value)}
 function draw(){fields.replaceChildren();const d=current();if(!d)return;for(const key of api.REQUIRED[d.type]||[]){const label=document.createElement('label');label.textContent=api.LABELS[key];const input=document.createElement('input');input.dataset.key=key;input.maxLength=250;input.placeholder='Dato fittizio TEST';label.append(input);fields.append(label)}}
 function load(){try{const raw=root.localStorage.getItem('ITE40_TECH_DOSSIER_TEST_1');const db=raw?JSON.parse(raw):{documents:[]};docs=(db.documents||[]).filter(d=>api.TYPES.includes(d.type)&&['DRAFT','REVIEW'].includes(d.state)&&/^TEST-/.test(d.id));const old=select.value;select.replaceChildren();for(const d of docs){const opt=document.createElement('option');opt.value=d.id;opt.textContent=d.id+' — '+d.type;select.append(opt)}if(docs.some(d=>d.id===old))select.value=old;draw();message.textContent=docs.length?'Compilare i campi fittizi e verificare la bozza.':'Nessuna bozza TEST disponibile.'}catch(e){message.textContent='Archivio TEST non leggibile: '+e.message}}
 select.addEventListener('change',draw);refresh.addEventListener('click',load);
 generate.addEventListener('click',()=>{try{const d=current();if(!d)throw Error('Selezionare una bozza TEST');const values={};for(const el of fields.querySelectorAll('input'))values[el.dataset.key]=el.value;const result=api.prepare(d,values);preview.textContent=api.preview(result,d);message.textContent=result.readyForManualReview?'Campi presenti: serve comunque revisione tecnica, allegati e firma.':'Campi da completare: '+result.missing.join(', ')}catch(e){message.textContent='Preparazione rifiutata: '+e.message}});
 load();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})(typeof window!=='undefined'?window:globalThis);
