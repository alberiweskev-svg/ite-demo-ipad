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
  current=board;signature=inputSignature(data);
  $('ops-summary').textContent=board.summary.items+' elementi · '+board.summary.blocking+' anomalie bloccanti · '+board.summary.review+' da verificare';
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
  for(const issue of board.issues.slice(0,200)){
   const p=document.createElement('p');p.className='item';p.textContent=issue.severity+' · '+issue.entity+' '+issue.id+' · '+issue.detail;issues.append(p);
  }
  status.textContent='Quadro aggiornato. Esportazione disponibile solo se i dati non cambiano.';
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
function init(){
 if(!$('ops-client')||!root.ITEOperationalBoard)return;
 $('ops-client').addEventListener('change',()=>{$('ops-site').value='';refresh()});
 for(const id of ['ops-site','ops-kind','ops-search'])$(id).addEventListener(id==='ops-search'?'input':'change',refresh);
 $('ops-refresh').addEventListener('click',refresh);
 $('ops-csv').addEventListener('click',()=>download('csv'));
 $('ops-a4').addEventListener('click',()=>download('a4'));
 root.addEventListener('ite-pagechange',e=>{if(e.detail?.id==='quadro-operativo')refresh()});
 root.addEventListener('ite-vault-ready',refresh);
 if(root.ITEVault?.isUnlocked())refresh();
}
if(typeof module!=='undefined'&&module.exports)module.exports={inputSignature};
if(typeof document!=='undefined')document.addEventListener('DOMContentLoaded',init,{once:true});
})(typeof window!=='undefined'?window:globalThis);
