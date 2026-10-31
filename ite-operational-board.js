/* I.T.E. 4.0 - quadro operativo integrato, sola lettura, dati locali. */
(function(root){'use strict';
const integrity=typeof module!=='undefined'&&module.exports?require('./ite-operational-integrity.js'):root.ITEOperationalIntegrity;
const rows=x=>Array.isArray(x)?x:[];
const key=x=>String(x??'').trim();
const safe=x=>{let s=key(x).replace(/[\u0000-\u001f\u007f]/g,' ');if(/^[=+@-]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';};
const escape=x=>key(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const find=(xs,id)=>rows(xs).find(x=>key(x?.id)===key(id));
function build(core,commerce={},options={}){
 const report=integrity.inspect(core,commerce);
 const workflow=workflows(core,commerce,options);
 const clientFilter=key(options.clientId),siteFilter=key(options.siteId);
 const clients=rows(core.clienti),sites=rows(core.immobili),plants=rows(core.impianti),devices=rows(core.apparecchiature),jobs=rows(core.interventi);
 if(clientFilter&&!find(clients,clientFilter))throw Error('Cliente non presente.');
 if(siteFilter){const site=find(sites,siteFilter);if(!site||clientFilter&&key(site.client_id)!==clientFilter)throw Error('Sede non appartenente al cliente.');}
 const ownerSite=siteId=>key(find(sites,siteId)?.client_id);
 const ownerPlant=plantId=>key(find(plants,plantId)?.immobile_id);
 const ownerDevice=deviceId=>ownerPlant(find(devices,deviceId)?.impianto_id);
 const selectedSite=siteId=>!siteFilter||key(siteId)===siteFilter;
 const selectedClient=clientId=>!clientFilter||key(clientId)===clientFilter;
 const items=[];
 function add(kind,id,clientId,siteId,status,description,source){
  if(!selectedClient(clientId)||!selectedSite(siteId))return;
  items.push({kind,id:key(id),clientId:key(clientId),siteId:key(siteId),status,description:key(description),source});
 }
 for(const s of sites)add('Sede',s.id,s.client_id,s.id,'ANAGRAFICA',s.name||s.indirizzo||'Sede',s);
 for(const p of plants){const sid=key(p.immobile_id);add('Impianto',p.id,ownerSite(sid),sid,'ANAGRAFICA',p.name||p.tipo||'Impianto',p);}
 for(const d of devices){const sid=ownerDevice(d.id);add('Apparecchiatura',d.id,ownerSite(sid),sid,'ANAGRAFICA',d.modello||d.name||'Apparecchiatura',d);}
 for(const j of jobs)add('Intervento',j.id,j.client_id,j.immobile_id,j.workflow_status||'DA VERIFICARE',j.description||j.tipo||'Intervento',j);
 for(const a of rows(core.appuntamenti)){const sid=key(a.immobile_id||a.siteId);add('Appuntamento',a.id,a.client_id||a.clientId||ownerSite(sid),sid,a.status||'PROGRAMMATO',a.description||a.tipo||'Appuntamento',a);}
 for(const q of rows(commerce.quotes||commerce.preventivi)){const sid=key(q.siteId||q.immobile_id);add('Preventivo',q.id,q.clientId||q.client_id||ownerSite(sid),sid,q.status||'DA ACCETTARE',q.description||'Preventivo',q);}
 for(const e of rows(commerce.extras)){const sid=key(e.siteId||e.immobile_id);add('Extra',e.id,e.clientId||e.client_id||ownerSite(sid),sid,e.status||'DA APPROVARE',e.description||'Extra',e);}
 for(const d of rows(commerce.documents)){const sid=key(d.siteId);add('Documento',d.id,d.clientId||d.subjectId||ownerSite(sid),sid,d.status||'DA VERIFICARE',d.type||'Documento',d);}
 for(const p of rows(commerce.settings?.technicalDrafts)){const sid=key(p.propertyId);add('Pratica tecnica',p.id,p.clientId||ownerSite(sid),sid,p.status||'BOZZA',p.type||'Pratica',p);}
 const issues=report.issues.filter(i=>{
  if(!clientFilter&&!siteFilter)return true;
  const match=items.some(x=>x.id===i.id&&({'intervento':'Intervento','documento':'Documento','pratica':'Pratica tecnica','sede':'Sede','impianto':'Impianto','apparecchiatura':'Apparecchiatura'}[i.entity]===x.kind));
  return match;
 });
 const summary={items:items.length,blocking:issues.filter(x=>x.severity==='BLOCCANTE').length,review:issues.filter(x=>x.severity==='REVISIONE').length};
 const groups={};for(const item of items){const g=groups[item.kind]||(groups[item.kind]={count:0,states:{}});g.count++;g.states[item.status]=(g.states[item.status]||0)+1;}
 return {workflow,filter:{clientId:clientFilter,siteId:siteFilter},items:items.map(({source,...item})=>item),issues,summary,groups,releaseAllowed:false,disclaimer:'Quadro diagnostico interno, non abilita fatturazione, firma o rilascio documenti.'};
}

/* Percorsi operativi correlati: pianificazione -> intervento -> offerta/extra -> contabilità.
   La relazione è ammessa soltanto se cliente e sede coincidono; nessun dato viene scritto. */
function workflows(core,commerce={},options={}){
 const clients=rows(core.clienti),sites=rows(core.immobili),jobs=rows(core.interventi);
 const appointments=rows(core.appuntamenti),quotes=rows(commerce.quotes||commerce.preventivi);
 const extras=rows(commerce.extras),documents=rows(commerce.documents);
 const clientFilter=key(options.clientId),siteFilter=key(options.siteId);
 const siteOwner=id=>key(find(sites,id)?.client_id);
 const reference=(x,kind)=>{
  const siteId=key(x.siteId||x.immobile_id||x.propertyId),clientId=key(x.clientId||x.client_id||x.subjectId||siteOwner(siteId));
  return {kind,id:key(x.id),siteId,clientId,source:x};
 };
 const records=[
  ...appointments.map(x=>reference(x,'Appuntamento')),
  ...jobs.map(x=>reference(x,'Intervento')),
  ...quotes.map(x=>reference(x,'Preventivo')),
  ...extras.map(x=>reference(x,'Extra')),
  ...documents.map(x=>reference(x,'Documento'))
 ];
 const issues=[],linked=[],stages={appointments:0,interventions:0,quotes:0,extras:0,documents:0};
 const seen=new Set();
 for(const item of records){
  if(!item.id||!item.siteId||!item.clientId||!find(clients,item.clientId)||siteOwner(item.siteId)!==item.clientId){
   issues.push({kind:item.kind,id:item.id,code:'RIFERIMENTO_NON_COERENTE',detail:'Cliente o sede mancanti o discordanti'});
   continue;
  }
  const identity=item.kind+':'+item.id;
  if(seen.has(identity)){issues.push({kind:item.kind,id:item.id,code:'ID_DUPLICATO',detail:'Identificativo duplicato'});continue;}
  seen.add(identity);
  const src=item.source;
  const parentId=key(src.interventionId||src.intervento_id||src.jobId||src.job_id||src.appointmentId||src.appuntamento_id||src.quoteId||src.preventivo_id);
  if(parentId){
   const candidates=records.filter(x=>x.id===parentId&&x.kind!==item.kind);
   const allowed=candidates.find(x=>x.clientId===item.clientId&&x.siteId===item.siteId);
   if(!allowed)issues.push({kind:item.kind,id:item.id,code:'COLLEGAMENTO_NON_VALIDO',detail:'Riferimento a un altro cliente/sede oppure inesistente'});
   else linked.push({from:allowed.kind+':'+allowed.id,to:identity});
  }
  if((clientFilter&&clientFilter!==item.clientId)||(siteFilter&&siteFilter!==item.siteId))continue;
  if(item.kind==='Appuntamento')stages.appointments++;
  if(item.kind==='Intervento')stages.interventions++;
  if(item.kind==='Preventivo')stages.quotes++;
  if(item.kind==='Extra')stages.extras++;
  if(item.kind==='Documento')stages.documents++;
 }
 const visible=records.filter(x=>x.clientId&&x.siteId&&(!clientFilter||x.clientId===clientFilter)&&(!siteFilter||x.siteId===siteFilter)&&siteOwner(x.siteId)===x.clientId);
 const visibleKeys=new Set(visible.map(x=>x.kind+':'+x.id));
 return {stages,links:linked.filter(x=>visibleKeys.has(x.from)&&visibleKeys.has(x.to)),
  issues:issues.filter(x=>!clientFilter&&!siteFilter||visible.some(v=>v.kind===x.kind&&v.id===x.id)),
  totals:{linked:linked.filter(x=>visibleKeys.has(x.from)&&visibleKeys.has(x.to)).length,unlinked:visible.filter(x=>!linked.some(l=>l.to===x.kind+':'+x.id||l.from===x.kind+':'+x.id)).length},
  warning:'Collegamenti ricostruiti a scopo diagnostico; nessuna fattura o intervento viene creato automaticamente.'};
}

function csv(board){
 const lines=[['Tipo','ID','Cliente','Sede','Stato','Descrizione'],...board.items.map(x=>[x.kind,x.id,x.clientId,x.siteId,x.status,x.description])];
 lines.push(['FLUSSO','Collegamenti',board.workflow?.totals.linked||0,'Scollegati',board.workflow?.totals.unlinked||0,'']);
 for(const link of rows(board.workflow?.links))lines.push(['COLLEGAMENTO',link.from,'',link.to,'','']);
 for(const x of rows(board.workflow?.issues))lines.push(['FLUSSO',x.id,'',x.kind,x.code,x.detail]);
 lines.push(['ANOMALIE','','','','','']);
 for(const x of board.issues)lines.push([x.entity,x.id,'','',x.severity,x.code+': '+x.detail]);
 return '\uFEFF'+lines.map(r=>r.map(safe).join(';')).join('\r\n')+'\r\n';
}
function html(board){
 const items=board.items.map(x=>'<tr>'+[x.kind,x.id,x.clientId,x.siteId,x.status,x.description].map(v=>'<td>'+escape(v)+'</td>').join('')+'</tr>').join('');
 const workflow=board.workflow||{totals:{linked:0,unlinked:0},links:[],issues:[]};
 const flowHtml='<h2>Flusso operativo</h2><p>Collegamenti validi: '+workflow.totals.linked+' · Elementi senza collegamenti: '+workflow.totals.unlinked+'</p><ul>'+workflow.links.map(x=>'<li>'+escape(x.from)+' → '+escape(x.to)+'</li>').join('')+workflow.issues.map(x=>'<li>'+escape(x.kind)+' '+escape(x.id)+': '+escape(x.code)+'</li>').join('')+'</ul>';
 const issues=board.issues.map(x=>'<li>'+escape(x.severity)+' — '+escape(x.entity)+' '+escape(x.id)+': '+escape(x.detail)+'</li>').join('');
 return '<!doctype html><html lang="it"><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src \'none\'; style-src \'unsafe-inline\'"><title>I.T.E. quadro operativo interno</title><style>body{font:12px Arial}table{border-collapse:collapse;width:100%}td,th{border:1px solid #999;padding:5px}@page{size:A4;margin:15mm}</style></head><body><h1>I.T.E. — Quadro operativo interno</h1><p>BOZZA INTERNA — NON CERTIFICA CONFORMITÀ O DOCUMENTI FISCALI</p><p>Elementi: '+board.summary.items+' · Blocchi: '+board.summary.blocking+' · Revisioni: '+board.summary.review+'</p><table><thead><tr><th>Tipo</th><th>ID</th><th>Cliente</th><th>Sede</th><th>Stato</th><th>Descrizione</th></tr></thead><tbody>'+items+'</tbody></table>'+flowHtml+'<h2>Anomalie</h2><ul>'+issues+'</ul></body></html>';
}
const api=Object.freeze({build,workflows,csv,html});root.ITEOperationalBoard=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
