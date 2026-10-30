/* I.T.E. 4.0 — collegamenti espliciti tra prove di intervento e pratiche tecniche.
   Riferimenti documentali interni, mai esiti di conformita, firme o dichiarazioni. */
(function(root){'use strict';
const same=(a,b)=>String(a??'')===String(b??'');
const arr=v=>Array.isArray(v)?v:[];
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clean=v=>String(v??'').trim();
const types=new Set(['Di.Co. elettrica','Di.Co. idrica / termica','Di.Ri.','Allegato gas H40','Allegato gas I40','Allegato gas A12','Allegato gas B12']);
const id=()=> 'te_'+(root.crypto?.randomUUID?.()||'test-'+Date.now()+'-'+Math.random().toString(36).slice(2));
const rows=state=>{const x=state?.settings?.technicalEvidenceLinks??[];if(!Array.isArray(x)||x.length>10000)throw Error('Registro riferimenti prove non valido.');return x;};
const find=(list,id)=>arr(list).find(x=>same(x.id,id));
function compatible(practice,check){
 if(!practice||!types.has(practice.type)||practice.status==='Annullata'||!check||!same(practice.clientId,check.clientId))return false;
 if(practice.interventionId)return same(practice.interventionId,check.jobId);
 if(!practice.deviceId||!check.deviceId||!same(practice.deviceId,check.deviceId))return false;
 if(practice.plantId&&(!check.plantId||!same(practice.plantId,check.plantId)))return false;
 if(practice.siteId&&(!check.siteId||!same(practice.siteId,check.siteId)))return false;
 return true;
}
function validate(state,core){
 const ledger=rows(state),practices=arr(state?.settings?.technicalDrafts),checks=arr(state?.settings?.fieldChecks);
 const seen=new Set(),active=new Set();
 for(const link of ledger){
  if(!link||typeof link.id!=='string'||!/^te_[a-zA-Z0-9_-]{5,120}$/.test(link.id)||seen.has(link.id))throw Error('Riferimento prova duplicato o non valido.');
  seen.add(link.id);
  const practice=find(practices,link.practiceId),check=find(checks,link.checkId);
  if(!practice||!check||!same(link.clientId,practice.clientId)||!same(link.clientId,check.clientId))
   throw Error('Riferimento prova privo di pratica o di cliente coerente.');
  // Annullare una pratica non cancella le evidenze storiche.
  if(!compatible({...practice,status:'Bozza'},check))throw Error('Riferimento prova con intervento o apparecchiatura incompatibile.');
  if(!Number.isSafeInteger(link.practiceRevision)||link.practiceRevision<1||link.practiceRevision>100000||
   !Number.isFinite(Date.parse(link.linkedAt))||typeof link.reviewer!=='string'||clean(link.reviewer).length<3||link.reviewer.length>100||
   typeof link.note!=='string'||clean(link.note).length<8||link.note.length>500)
   throw Error('Provenienza o revisore del riferimento incompleti.');
  if(link.removedAt){
   if(!Number.isFinite(Date.parse(link.removedAt))||typeof link.removedBy!=='string'||clean(link.removedBy).length<3||
      link.removedBy.length>100||typeof link.removedReason!=='string'||clean(link.removedReason).length<8||link.removedReason.length>500)
    throw Error('Revoca riferimento prova non valida.');
  }else{
   if(link.removedReason||link.removedBy)throw Error('Stato revoca incoerente.');
   const pair=String(link.practiceId)+'|'+String(link.checkId);
   if(active.has(pair))throw Error('Riferimento prova attivo duplicato.');
   active.add(pair);
  }
 }
 validateAnnexes(state);
 return true;
}
function attach(state,core,request){
 validate(state,core);
 const practice=find(state.settings.technicalDrafts,request.practiceId),check=find(state.settings.fieldChecks,request.checkId);
 if(!compatible(practice,check))throw Error('Prova non compatibile con cliente, pratica o intervento.');
 if(check.voidedAt)throw Error('Prova stornata: non collegabile.');
 if(rows(state).some(x=>!x.removedAt&&same(x.practiceId,practice.id)&&same(x.checkId,check.id)))throw Error('Prova gia collegata alla pratica.');
 const reviewer=clean(request.reviewer),note=clean(request.note);
 if(reviewer.length<3||reviewer.length>100||note.length<8||note.length>500)throw Error('Indicare revisore (3-100) e motivazione (8-500 caratteri).');
 if(!Number.isSafeInteger(practice.revision)||practice.revision<1)throw Error('Revisione pratica non valida.');
 const at=new Date().toISOString();
 const link={id:id(),practiceId:String(practice.id),practiceRevision:practice.revision,checkId:String(check.id),
  clientId:String(practice.clientId),reviewer,note,linkedAt:at,removedAt:'',removedBy:'',removedReason:''};
 if(!Array.isArray(state.audit))throw Error('Registro audit non disponibile.');
 state.settings.technicalEvidenceLinks=[...rows(state),link];
 state.audit.push({id:'audit_'+id(),at,action:'COLLEGA_PROVA_PRATICA',detail:{linkId:link.id,practiceId:link.practiceId,checkId:link.checkId,revision:link.practiceRevision}});
 return link;
}
function revoke(state,core,request){
 validate(state,core);
 const link=rows(state).find(x=>same(x.id,request.linkId));
 if(!link||link.removedAt)throw Error('Riferimento assente o gia revocato.');
 const reviewer=clean(request.reviewer),reason=clean(request.reason);
 if(reviewer.length<3||reviewer.length>100||reason.length<8||reason.length>500)throw Error('Revisore e motivazione di revoca obbligatori.');
 const at=new Date().toISOString();
 link.removedAt=at;link.removedBy=reviewer;link.removedReason=reason;
 state.audit.push({id:'audit_'+id(),at,action:'REVOCA_PROVA_PRATICA',detail:{linkId:link.id,practiceId:link.practiceId,checkId:link.checkId,reason}});
 return link;
}
function status(link,practice,check){
 if(link.removedAt)return 'Revocato';
 if(!check||check.voidedAt)return 'Prova stornata / assente';
 if(practice.status==='Annullata')return 'Pratica annullata';
 if(!same(link.practiceRevision,practice.revision))return 'Revisione pratica superata';
 if(check.outcome!=='Rilevato')return 'Da verificare / non eseguito';
 return 'Riferimento attivo - da verificare';
}
function summary(practice,links,checks,clientId){
 if(!practice||!same(practice.clientId,clientId))return [];
 return arr(links).filter(x=>same(x.practiceId,practice.id)&&same(x.clientId,clientId)).map(link=>{
  const check=find(checks,link.checkId);
  if(!check||!same(check.clientId,clientId))return null;
  return {id:link.id,practiceId:link.practiceId,checkId:link.checkId,reviewer:link.reviewer,note:link.note,
   linkedAt:link.linkedAt,removedAt:link.removedAt,removedReason:link.removedReason,
   category:check.category,kind:check.kind,label:check.label,value:check.value,unit:check.unit,
   outcome:check.outcome,jobId:check.jobId,measuredAt:check.createdAt,actorId:check.actorId,
   status:status(link,practice,check)};
 }).filter(Boolean);
}
function report(state,core,practiceId){
 validate(state,core);
 const p=find(state.settings.technicalDrafts,practiceId);
 if(!p)throw Error('Pratica tecnica non trovata.');
 return {practice:p,entries:summary(p,rows(state),state.settings.fieldChecks,p.clientId),annexes:annexSummary(state,p)};
}
const csvCell=v=>{let s=String(v??'');if(/^[\s\uFEFF\u0000-\u001f]*[=+\-@]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';};
function csv(result){
 const p=result.practice;
 const data=[['Pratica','Tipo','Revisione attuale','ID prova','Intervento','Data prova','Settore','Prova','Valore','Unita','Esito rilevato','Stato riferimento','Revisore dichiarato','Nota','Data collegamento','Motivo revoca']];
 for(const x of result.entries)data.push([p.fields?.reference||p.id,p.type,p.revision,x.checkId,x.jobId,x.measuredAt,x.category,x.label,x.value,x.unit,x.outcome,x.status,x.reviewer,x.note,x.linkedAt,x.removedReason]);
 return '\uFEFF'+data.map(x=>x.map(csvCell).join(';')).join('\r\n')+'\r\n'+(result.annexes?.length?'\r\n'+annexCsv(result).replace(/^\uFEFF/,''):'');
}
function html(result){
 const p=result.practice,trs=result.entries.map(x=>'<tr>'+[x.measuredAt,x.jobId,x.label,
  x.value?x.value+' '+x.unit:x.outcome,x.status,x.reviewer,x.note].map(y=>'<td>'+esc(y)+'</td>').join('')+'</tr>').join('');
 return '<!doctype html><html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Registro prove riferite - bozza</title><style>body{font:13px Arial,sans-serif;line-height:1.4;margin:16mm;color:#25313a}h1{color:#008c45}table{width:100%;border-collapse:collapse}td,th{border:1px solid #888;padding:6px;overflow-wrap:anywhere}th{text-align:left;background:#eee}.warning{border:2px solid #a33;padding:10px}@page{size:A4;margin:12mm}</style></head><body><h1>I.T.E. - Registro prove riferite alla pratica</h1><p class="warning"><b>BOZZA NON UFFICIALE, NON FIRMATA.</b> Riferimenti descrittivi a registrazioni di intervento. Non attestano esecuzione conforme, collaudo, tenuta, sicurezza, verifiche normative o sottoscrizioni. Verificare strumenti, misure, originali e modelli ufficiali.</p><p>Pratica: '+esc(p.type)+' - '+esc(p.fields?.reference||p.id)+' - revisione '+esc(p.revision)+' - cliente ID '+esc(p.clientId)+'</p><table><thead><tr><th>Data</th><th>Intervento</th><th>Rilevazione</th><th>Valore/esito</th><th>Stato</th><th>Revisore</th><th>Nota</th></tr></thead><tbody>'+trs+'</tbody></table><p>Registrazioni: '+result.entries.length+'. Gli originali e le firme non sono incorporati.</p></body></html>';
}
function candidates(state,practice){
 if(!practice||!types.has(practice.type)||practice.status==='Annullata')return [];
 return arr(state.settings?.fieldChecks).filter(c=>!c.voidedAt&&compatible(practice,c))
  .sort((a,b)=>String(b.createdAt||'').localeCompare(String(a.createdAt||''))).slice(0,200);
}

/* Milestone 37: indice originali tecnici importati, riferiti alla pratica senza duplicare PDF. */
const annexKinds=['Schema impianto','Elenco materiali','Progetto','Prove e verifiche','Requisiti tecnico-professionali','Allegato GAS','Libretto e schede tecniche','Documentazione fotografica','Altro allegato'];
const annexRows=s=>{const x=s?.settings?.technicalAnnexLinks??[];if(!Array.isArray(x)||x.length>10000)throw Error('Registro allegati non valido.');return x;};
const technicalDoc=d=>!!d&&/^(Di\.Co\.|Di\.Ri\.|Allegato gas |POS$|PSC$|DVR$|DURC$|CCIAA$|Formazione sicurezza$|Scheda sicurezza SDS$|Documento aziendale$)/.test(String(d.type||''));
const originalMetadata=(s,d)=>{const f=arr(s?.files).find(x=>same(x.id,d?.fileId));return !!f&&typeof f.hash==='string'&&/^[a-f0-9]{64}$/.test(f.hash)&&f.id==='file_'+f.hash&&Number.isSafeInteger(f.size)&&f.size>0&&typeof f.base64==='string'&&f.base64.length>0;};
function annexCompatible(p,d){
 return !!p&&!!d&&types.has(p.type)&&technicalDoc(d)&&same(p.clientId,d.clientId||d.subjectId)&&
 (!d.propertyId||!p.propertyId||same(d.propertyId,p.propertyId))&&
 (!d.siteId||!p.siteId||same(d.siteId,p.siteId))&&
 (!d.plantId||!p.plantId||same(d.plantId,p.plantId))&&
 (!d.deviceId||!p.deviceId||same(d.deviceId,p.deviceId))&&
 (!d.jobId||!p.interventionId||same(d.jobId,p.interventionId));
}
function validateAnnexes(s){
 const ids=new Set(),active=new Set();
 for(const a of annexRows(s)){
  if(!a||typeof a.id!=='string'||!/^ta_[a-zA-Z0-9_-]{5,120}$/.test(a.id)||ids.has(a.id))throw Error('Identificativo allegato duplicato o non valido.');
  ids.add(a.id);
  const p=find(s.settings.technicalDrafts,a.practiceId),d=find(s.documents,a.documentId);
  if(!p||!d||!same(p.clientId,a.clientId)||!annexCompatible(p,d))throw Error('Allegato non coerente con pratica o cliente.');
  if(!annexKinds.includes(a.category)||!Number.isSafeInteger(a.practiceRevision)||a.practiceRevision<1||
     !Number.isFinite(Date.parse(a.linkedAt))||typeof a.reviewer!=='string'||clean(a.reviewer).length<3||a.reviewer.length>100||
     typeof a.note!=='string'||clean(a.note).length<8||a.note.length>500)throw Error('Dati o provenienza allegato non validi.');
  if(a.removedAt){
   if(!Number.isFinite(Date.parse(a.removedAt))||typeof a.removedBy!=='string'||clean(a.removedBy).length<3||
      a.removedBy.length>100||typeof a.removedReason!=='string'||clean(a.removedReason).length<8||a.removedReason.length>500)throw Error('Revoca allegato incompleta.');
  }else{
   if(a.removedBy||a.removedReason)throw Error('Revoca allegato incoerente.');
   const key=a.practiceId+'|'+a.documentId;if(active.has(key))throw Error('Originale gia collegato alla pratica.');active.add(key);
  }
 }
 return true;
}
function attachAnnex(s,core,req){
 validate(s,core);
 const p=find(s.settings.technicalDrafts,req.practiceId),d=find(s.documents,req.documentId);
 if(!p||p.status==='Annullata'||!annexCompatible(p,d)||!originalMetadata(s,d))throw Error('Originale mancante o non compatibile con cliente e pratica.');
 if(!annexKinds.includes(req.category)||!Number.isSafeInteger(p.revision)||p.revision<1)throw Error('Categoria o revisione non valida.');
 if(annexRows(s).some(x=>!x.removedAt&&same(x.practiceId,p.id)&&same(x.documentId,d.id)))throw Error('Originale gia collegato.');
 const reviewer=clean(req.reviewer),note=clean(req.note);
 if(reviewer.length<3||reviewer.length>100||note.length<8||note.length>500)throw Error('Revisore (3-100) e motivazione (8-500) obbligatori.');
 if(!Array.isArray(s.audit))throw Error('Audit non disponibile.');
 const at=new Date().toISOString(),a={id:'ta_'+(root.crypto?.randomUUID?.()||Date.now()+'_'+Math.random().toString(36).slice(2)),
  practiceId:String(p.id),practiceRevision:p.revision,clientId:String(p.clientId),documentId:String(d.id),category:req.category,
  reviewer,note,linkedAt:at,removedAt:'',removedBy:'',removedReason:''};
 s.settings.technicalAnnexLinks=[...annexRows(s),a];
 s.audit.push({id:'audit_'+id(),at,action:'COLLEGA_ORIGINALE_PRATICA',detail:{practiceId:a.practiceId,documentId:a.documentId,category:a.category}});
 return a;
}
function revokeAnnex(s,core,req){
 validate(s,core);
 const a=annexRows(s).find(x=>same(x.id,req.linkId));if(!a||a.removedAt)throw Error('Allegato assente o gia revocato.');
 const reviewer=clean(req.reviewer),reason=clean(req.reason);
 if(reviewer.length<3||reviewer.length>100||reason.length<8||reason.length>500)throw Error('Revisore e motivazione di revoca obbligatori.');
 a.removedAt=new Date().toISOString();a.removedBy=reviewer;a.removedReason=reason;
 s.audit.push({id:'audit_'+id(),at:a.removedAt,action:'REVOCA_ORIGINALE_PRATICA',detail:{practiceId:a.practiceId,documentId:a.documentId,reason}});
 return a;
}
function annexSummary(s,p){
 if(!p)return [];
 return annexRows(s).filter(a=>same(a.practiceId,p.id)&&same(a.clientId,p.clientId)).map(a=>{
  const d=find(s.documents,a.documentId);if(!annexCompatible(p,d))return null;
  const status=a.removedAt?'Revocato':p.status==='Annullata'?'Pratica annullata':
   !same(a.practiceRevision,p.revision)?'Revisione superata':!originalMetadata(s,d)?'Originale mancante':'Originale riferito - da verificare';
  return {id:a.id,documentId:a.documentId,category:a.category,sourceName:d.sourceName||'',number:d.number||'',
   type:d.type,reviewer:a.reviewer,note:a.note,linkedAt:a.linkedAt,removedReason:a.removedReason,status,
   hasOriginal:originalMetadata(s,d)&&!a.removedAt};
 }).filter(Boolean);
}
function annexCandidates(s,p){
 const active=new Set(annexRows(s).filter(a=>!a.removedAt&&same(a.practiceId,p.id)).map(a=>String(a.documentId)));
 return arr(s.documents).filter(d=>p.status!=='Annullata'&&annexCompatible(p,d)&&originalMetadata(s,d)&&!active.has(String(d.id))).slice(0,200);
}
function annexReport(s,core,practiceId){
 validate(s,core);const p=find(s.settings.technicalDrafts,practiceId);if(!p)throw Error('Pratica non trovata.');
 return {practice:p,annexes:annexSummary(s,p)};
}
function annexCsv(r){
 const p=r.practice,lines=[['Pratica','Revisione','Categoria','Documento','File','Stato','Revisore','Motivazione','Data','Revoca']];
 for(const a of r.annexes)lines.push([p.fields?.reference||p.id,p.revision,a.category,a.number||a.documentId,a.sourceName,a.status,a.reviewer,a.note,a.linkedAt,a.removedReason]);
 return '\uFEFF'+lines.map(x=>x.map(csvCell).join(';')).join('\r\n')+'\r\n';
}
function annexHtml(r){
 const rows=r.annexes.map(a=>'<tr>'+[a.category,a.type,a.number||a.documentId,a.sourceName,a.status,a.reviewer].map(x=>'<td>'+esc(x)+'</td>').join('')+'</tr>').join('');
 return '<!doctype html><html lang="it"><head><meta charset="utf-8"><title>Indice allegati - bozza</title><style>body{font:13px Arial,sans-serif;margin:16mm}table{border-collapse:collapse;width:100%}td,th{border:1px solid #888;padding:6px;overflow-wrap:anywhere}@page{size:A4;margin:12mm}</style></head><body><h1>I.T.E. - Indice allegati originali</h1><p><b>BOZZA NON UFFICIALE E NON FIRMATA.</b> Indice di riferimenti; i PDF non sono incorporati, la conformita non e attestata.</p><p>'+esc(r.practice.type)+' - '+esc(r.practice.fields?.reference||r.practice.id)+'</p><table><thead><tr><th>Categoria</th><th>Tipo</th><th>Riferimento</th><th>File</th><th>Stato</th><th>Revisore</th></tr></thead><tbody>'+rows+'</tbody></table></body></html>';
}
function openAnnex(practiceId){
 const s=root.ITECommerce.snapshot(),r=annexReport(s,root.ITE.snapshot(),practiceId),p=r.practice,choices=annexCandidates(s,p);
 const overlay=root.document.createElement('div');overlay.id='ite-tech-annex-overlay';overlay.style.cssText='position:fixed;inset:0;z-index:100002;background:#102a3ddd;display:flex;align-items:center;justify-content:center;padding:12px';
 const card=root.document.createElement('div');card.setAttribute('role','dialog');card.setAttribute('aria-modal','true');card.setAttribute('aria-label','Allegati originali della pratica');
 card.style.cssText='background:white;color:#21313b;border-radius:12px;padding:18px;max-width:960px;width:100%;max-height:92vh;overflow:auto';
 const opts=choices.map(d=>'<option value="'+esc(d.id)+'">'+esc(d.type)+' · '+esc(d.number||d.sourceName||d.id)+'</option>').join('');
 const items=r.annexes.map(a=>'<li><strong>'+esc(a.category)+'</strong> · '+esc(a.sourceName)+' · '+esc(a.status)+
  (a.hasOriginal?' <button type="button" class="secondary" data-annex-open="'+esc(a.documentId)+'">Apri originale</button>':'')+
  (a.status!=='Revocato'?' <button type="button" class="secondary" data-annex-revoke="'+esc(a.id)+'">Revoca</button>':' · '+esc(a.removedReason))+'</li>').join('');
 card.innerHTML='<h3>Allegati originali — '+esc(p.type)+'</h3><p class="hint">Solo documenti tecnici gia importati e assegnati allo stesso cliente. Nessuna copia, invio esterno o attestazione di conformita. Originali verificati con SHA-256 prima del collegamento.</p>'+
  '<ul>'+(items||'<li>Nessun originale collegato.</li>')+'</ul><div class="grid"><label>Documento tecnico<select id="ite-annex-document"><option value="">— Seleziona —</option>'+opts+'</select></label>'+
  '<label>Categoria<select id="ite-annex-category">'+annexKinds.map(x=>'<option>'+esc(x)+'</option>').join('')+'</select></label>'+
  '<label>Revisore dichiarato<input id="ite-annex-reviewer" maxlength="100"></label>'+
  '<label>Motivazione<input id="ite-annex-note" maxlength="500"></label></div><p id="ite-annex-status" role="status"></p>'+
  '<div class="actions"><button type="button" data-annex-add '+(!opts?'disabled':'')+'>Verifica e collega con backup</button><button type="button" class="secondary" data-annex-html>Indice A4</button><button type="button" class="secondary" data-annex-csv>CSV</button><button type="button" class="secondary" data-annex-close>Chiudi</button></div>';
 overlay.append(card);root.document.body.append(overlay);
 const msg=card.querySelector('#ite-annex-status'),reviewer=()=>card.querySelector('#ite-annex-reviewer').value;
 const write=async(fn,req,reason)=>{
  if(!root.ITEVault?.isUnlocked?.()||root.ITECommerce.busy())throw Error('Archivio non pronto.');
  if(!root.ITEHistory?.create)throw Error('Backup preventivo non disponibile.');
  await root.ITEHistory.create(reason);await root.ITECommerce.mutate(next=>fn(next,root.ITE.snapshot(),req));
  overlay.remove();root.ITETechnicalDrafts?.render?.();openAnnex(practiceId);
 };
 card.addEventListener('click',async e=>{
  const b=e.target.closest('button');if(!b)return;
  if(b.hasAttribute('data-annex-close')){overlay.remove();return;}
  if(b.dataset.annexOpen){try{await root.ITECommerce.openOriginal(b.dataset.annexOpen);msg.textContent='Originale verificato.';}catch(err){msg.textContent=err.message;}return;}
  if(b.hasAttribute('data-annex-html')||b.hasAttribute('data-annex-csv')){
   if(!root.confirm('Il file esportato contiene riferimenti cliente NON cifrati. Continuare?'))return;
   try{const current=annexReport(root.ITECommerce.snapshot(),root.ITE.snapshot(),practiceId),isCsv=b.hasAttribute('data-annex-csv');
    download(isCsv?annexCsv(current):annexHtml(current),'ITE_ALLEGATI_BOZZA_'+String(practiceId).replace(/[^A-Za-z0-9_-]/g,'')+(isCsv?'.csv':'.html'),isCsv?'text/csv;charset=utf-8':'text/html;charset=utf-8');
    msg.textContent='Indice locale non cifrato. Gli originali non sono incorporati.';}catch(err){msg.textContent=err.message;}return;
  }
  if(b.hasAttribute('data-annex-add')||b.hasAttribute('data-annex-revoke')){
   b.disabled=true;
   try{
    if(b.hasAttribute('data-annex-add')){
     const documentId=card.querySelector('#ite-annex-document').value;if(!documentId)throw Error('Seleziona un originale.');
     await root.ITECommerce.technicalOriginalHints([documentId]);
     await write(attachAnnex,{practiceId,documentId,category:card.querySelector('#ite-annex-category').value,reviewer:reviewer(),note:card.querySelector('#ite-annex-note').value},'Prima collegamento originale a pratica');
    }else{
     const reason=root.prompt('Motivazione della revoca (almeno 8 caratteri):');if(reason===null){b.disabled=false;return;}
     await write(revokeAnnex,{linkId:b.dataset.annexRevoke,reviewer:reviewer(),reason},'Prima revoca originale da pratica');
    }
   }catch(err){msg.textContent='Operazione non eseguita: '+err.message;b.disabled=false;}
  }
 });
 card.querySelector('[data-annex-close]').focus();
}

function download(text,name,type){
 const url=URL.createObjectURL(new Blob([text],{type})),a=root.document.createElement('a');
 a.href=url;a.download=name;root.document.body.append(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(url),60000);
}
function open(practiceId){
 const state=root.ITECommerce.snapshot(),core=root.ITE.snapshot(),result=report(state,core,practiceId),p=result.practice;
 const checks=candidates(state,p),existing=new Set(result.entries.filter(x=>x.status!=='Revocato').map(x=>x.checkId));
 const overlay=root.document.createElement('div');overlay.id='ite-tech-evidence-overlay';
 overlay.style.cssText='position:fixed;inset:0;z-index:100001;background:#102a3ddd;display:flex;align-items:center;justify-content:center;padding:12px';
 const card=root.document.createElement('div');card.setAttribute('role','dialog');card.setAttribute('aria-modal','true');card.setAttribute('aria-label','Prove riferite alla pratica');
 card.style.cssText='background:white;color:#21313b;border-radius:12px;padding:18px;max-width:900px;width:100%;max-height:92vh;overflow:auto';
 const options=checks.filter(x=>!existing.has(String(x.id))).map(x=>'<option value="'+esc(x.id)+'">'+esc(x.createdAt?.slice(0,10)||'')+' · '+esc(x.label)+' · '+esc(x.outcome)+' · intervento '+esc(x.jobId)+'</option>').join('');
 const items=result.entries.map(x=>'<li><strong>'+esc(x.label)+'</strong> · '+esc(x.status)+' · '+esc(x.measuredAt)+' · '+esc(x.note)+
  (x.status==='Revocato'?' · Revoca: '+esc(x.removedReason):' <button type="button" class="secondary" data-evidence-revoke="'+esc(x.id)+'">Revoca riferimento</button>')+'</li>').join('');
 card.innerHTML='<h3>Prove collegate — '+esc(p.type)+'</h3><p class="hint">Collegamento esplicito, non trasferisce misure nei campi ufficiali, non compila firme o esiti di conformità. Le prove stornate e le revisioni superate restano visibili.</p>'+
  '<ul>'+ (items||'<li>Nessuna prova riferita.</li>')+'</ul><div class="grid"><label>Prova registrata<select id="ite-evidence-check"><option value="">— Seleziona —</option>'+options+'</select></label>'+
  '<label>Revisore (nome dichiarato)<input id="ite-evidence-reviewer" maxlength="100" placeholder="Nome del verificatore"></label>'+
  '<label>Motivazione / contesto della prova<input id="ite-evidence-note" maxlength="500" placeholder="Perché collegare questa rilevazione"></label></div>'+
  '<p id="ite-evidence-status" role="status"></p><div class="actions"><button type="button" data-evidence-add '+(!options?'disabled':'')+'>Collega con backup</button><button type="button" class="secondary" data-evidence-html>Esporta A4 (HTML)</button><button type="button" class="secondary" data-evidence-csv>Esporta CSV</button><button type="button" class="secondary" data-evidence-close>Chiudi</button></div>';
 overlay.append(card);root.document.body.append(overlay);
 const msg=card.querySelector('#ite-evidence-status');
 const reviewer=()=>card.querySelector('#ite-evidence-reviewer').value;
 const write=async (operation,request,reason)=>{
  if(!root.ITEVault?.isUnlocked?.()||root.ITECommerce?.busy?.())throw Error('Archivio non sbloccato o occupato.');
  if(!root.ITEHistory?.create)throw Error('Backup preventivo non disponibile.');
  await root.ITEHistory.create(reason);
  await root.ITECommerce.mutate(next=>operation(next,root.ITE.snapshot(),request));
  overlay.remove();root.ITETechnicalDrafts?.render?.();open(practiceId);
 };
 card.addEventListener('click',async event=>{
  const b=event.target.closest('button');if(!b)return;
  if(b.hasAttribute('data-evidence-close')){overlay.remove();return;}
  if(b.hasAttribute('data-evidence-html')||b.hasAttribute('data-evidence-csv')){
   if(!root.confirm('Il file esportato NON e cifrato e contiene dati della pratica. Continuare?'))return;
   try{const current=report(root.ITECommerce.snapshot(),root.ITE.snapshot(),practiceId),csvMode=b.hasAttribute('data-evidence-csv');
    download(csvMode?csv(current):html(current),'ITE_PROVE_PRATICA_BOZZA_'+String(practiceId).replace(/[^a-z0-9_-]/gi,'_')+(csvMode?'.csv':'.html'),csvMode?'text/csv;charset=utf-8':'text/html;charset=utf-8');
    msg.textContent='Esportazione locale non cifrata. Nessuna conformita attestata.';
   }catch(e){msg.textContent=e.message;}return;
  }
  if(b.hasAttribute('data-evidence-add')||b.hasAttribute('data-evidence-revoke')){
   b.disabled=true;
   try{
    if(b.hasAttribute('data-evidence-add')){
     await write(attach,{practiceId,checkId:card.querySelector('#ite-evidence-check').value,reviewer:reviewer(),note:card.querySelector('#ite-evidence-note').value},'Prima collegamento prova a pratica');
    }else{
     const reason=root.prompt('Motivazione della revoca (almeno 8 caratteri):');
     if(reason===null){b.disabled=false;return;}
     await write(revoke,{linkId:b.dataset.evidenceRevoke,reviewer:reviewer(),reason},'Prima revoca collegamento prova a pratica');
    }
   }catch(e){msg.textContent='Operazione non eseguita: '+e.message;b.disabled=false;}
  }
 });
 card.querySelector('[data-evidence-close]').focus();
}
function install(){
 const panel=root.document?.getElementById('technical-drafts-panel'),list=panel?.querySelector('#tech-list');
 if(!list||list.dataset.iteEvidenceInstalled)return;
 list.dataset.iteEvidenceInstalled='1';
 const refresh=()=>{
  for(const b of list.querySelectorAll('[data-tech-edit]')){
   if(!b.parentElement.querySelector('[data-tech-evidence="'+b.dataset.techEdit+'"]')){
    const button=root.document.createElement('button');button.type='button';button.className='secondary';
    button.dataset.techEvidence=b.dataset.techEdit;button.textContent='Prove collegate';b.insertAdjacentElement('afterend',button);
   }
   if(!b.parentElement.querySelector('[data-tech-annex="'+b.dataset.techEdit+'"]')){
    const button=root.document.createElement('button');button.type='button';button.className='secondary';
    button.dataset.techAnnex=b.dataset.techEdit;button.textContent='Allegati originali';b.insertAdjacentElement('afterend',button);
   }
  }
 };
 refresh();new MutationObserver(refresh).observe(list,{childList:true});
 list.addEventListener('click',event=>{
  const button=event.target.closest('[data-tech-evidence],[data-tech-annex]');if(!button)return;
  event.preventDefault();event.stopPropagation();
  try{
   if(!root.ITEVault?.isUnlocked?.()||root.ITECommerce?.busy?.())throw Error('Archivio non pronto.');
   if(button.dataset.techAnnex)openAnnex(button.dataset.techAnnex);else open(button.dataset.techEvidence);
  }catch(e){const s=panel.querySelector('#tech-status');if(s)s.textContent='Prove non aperte: '+e.message;}
 },true);
}
const api=Object.freeze({compatible,validate,attach,revoke,status,summary,report,candidates,csv,html,install,annexKinds,technicalDoc,originalMetadata,annexCompatible,validateAnnexes,attachAnnex,revokeAnnex,annexSummary,annexCandidates,annexReport,annexCsv,annexHtml});
root.ITETechnicalEvidence=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
if(root.document&&root.addEventListener){root.addEventListener('ite-vault-ready',install);root.addEventListener('ite-pagechange',install);if(root.ITEVault?.isUnlocked?.())install();}
})(typeof window!=='undefined'?window:globalThis);
