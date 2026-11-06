/* I.T.E. 4.0.40 — unico pannello di collegamento TEST senza trasferimenti remoti. */
(function(root){'use strict';if(typeof document==='undefined')return;
function mount(){
 const host=document.getElementById('anagrafiche'),api=root.ITE40HierarchyFinanceBridge;
 if(!host||!api)return;
 const panel=document.createElement('section');panel.className='panel';
 const title=document.createElement('h3');title.textContent='Collegamento anagrafiche → amministrazione — TEST 4.0.40';
 const note=document.createElement('p');note.textContent='Anteprima e sincronizzazione esplicita dei soli clienti fittizi. Fornitori e fatture restano invariati. I conflitti bloccano ogni scrittura.';
 const preview=document.createElement('button');preview.type='button';preview.textContent='Controlla collegamenti TEST';
 const sync=document.createElement('button');sync.type='button';sync.textContent='Sincronizza clienti TEST';sync.className='secondary';
 const out=document.createElement('pre');out.setAttribute('role','status');out.style.cssText='white-space:pre-wrap;overflow-wrap:anywhere';
 function show(){try{const p=api.inspect(root.localStorage);out.textContent='Clienti gerarchia: '+p.counts.clienti+' | Sedi: '+p.counts.sedi+' | Impianti: '+p.counts.impianti+' | Apparecchiature: '+p.counts.apparecchiature+' | Interventi: '+p.counts.interventi+'\nAnagrafiche contabili: '+p.subjects+'\nDa collegare: '+p.add.length+' | Già collegate: '+p.matched.length+' | Conflitti: '+p.conflicts.length+'\n'+p.conflicts.map(x=>x.id+' — '+x.reason).join('\n');sync.disabled=!!p.conflicts.length||!p.add.length}catch(e){sync.disabled=true;out.textContent='Controllo non disponibile: '+e.message}}
 preview.addEventListener('click',show);
 sync.addEventListener('click',()=>{try{const r=api.synchronize(root.localStorage);show();out.textContent+='\nSincronizzati: '+r.added}catch(e){out.textContent='Sincronizzazione annullata: '+e.message}});
 panel.append(title,note,preview,sync,out);host.append(panel);show();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})(typeof window!=='undefined'?window:globalThis);
