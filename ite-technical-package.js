/* I.T.E. 4.0 — manifest di consegna tecnica, sola lettura.
   NON genera Di.Co., Di.Ri., Allegati GAS o POS ufficiali. */
(function(root){'use strict';
const consistency=typeof module!=='undefined'&&module.exports?require('./ite-technical-consistency.js'):root.ITETechnicalConsistency;
const same=(a,b)=>String(a??'')===String(b??'');
const arr=x=>Array.isArray(x)?x:[];
const find=(xs,id)=>arr(xs).find(x=>same(x.id,id));
const clean=x=>String(x??'').trim();
const esc=x=>clean(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const cell=x=>{let s=String(x??'').replace(/[\u0000-\u001f\u007f]/g,' ');if(/^\s*[=+\-@]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';};
function manifest(practice,core,state){
 if(!consistency?.analyze)throw Error('Controllo coerenza non disponibile.');
 const report=consistency.analyze(practice,core,state);
 const docs=arr(state.documents),files=arr(state.files),links=arr(state.settings?.technicalAnnexLinks)
  .filter(x=>same(x.practiceId,practice.id)&&!x.removedAt);
 const ids=[...new Set([...arr(practice.linkedDocIds),...links.map(x=>x.documentId)].map(String))];
 const originals=ids.map(id=>{
  const d=find(docs,id),f=d?find(files,d.fileId):null;
  if(d&&!same(d.clientId||d.subjectId,practice.clientId))throw Error('Documento di altro cliente.');
  const revisionLinks=links.filter(x=>same(x.documentId,id));
  const validRevision=revisionLinks.every(x=>same(x.practiceRevision,practice.revision));
  const validHash=!!f&&/^[a-f0-9]{64}$/.test(String(f.hash||''));
  return {documentId:id,kind:clean(d?.type)||'Non classificato',fileName:clean(d?.sourceName),
   fileId:clean(d?.fileId),hash:validHash?f.hash:'',status:!d?'DOCUMENTO ASSENTE':
   !f?'FILE ASSENTE':!validHash?'HASH NON DISPONIBILE':!validRevision?'REVISIONE SUPERATA':'DA VERIFICARE'};
 });
 const proofs=arr(state.settings?.technicalEvidenceLinks).filter(x=>same(x.practiceId,practice.id)&&!x.removedAt).map(x=>{
  const check=find(state.settings?.fieldChecks,x.checkId);
  if(check&&!same(check.clientId,practice.clientId))throw Error('Prova di altro cliente.');
  if(check&&practice.interventionId&&!same(check.jobId,practice.interventionId))
   throw Error('Prova riferita a intervento differente.');
  if(check&&practice.deviceId&&check.deviceId&&!same(check.deviceId,practice.deviceId))
   throw Error('Prova riferita ad apparecchiatura differente.');
  return {checkId:String(x.checkId),revision:x.practiceRevision,status:!check?'PROVA ASSENTE':
   check.voidedAt?'PROVA STORNATA':!same(x.practiceRevision,practice.revision)?'REVISIONE SUPERATA':'DA VERIFICARE'};
 });
 const blocking=report.summary.blocking+originals.filter(x=>x.status!=='DA VERIFICARE').length+
  proofs.filter(x=>x.status!=='DA VERIFICARE').length;
 return {practiceId:String(practice.id),clientId:String(practice.clientId),type:clean(practice.type),
  reference:report.reference,revision:practice.revision,originals,proofs,
  issues:report.issues,proposals:report.proposals,blocking,review:report.summary.review,
  state:blocking?'BLOCCATA': 'DA VERIFICARE MANUALMENTE',
  disclaimer:'BOZZA INTERNA. Nessuna firma, attestazione o certificazione generata.'};
}
// Quadro operativo per consegna interna: nessuna firma o documento ufficiale.
function readiness(practices,clientId,core,state){
 const reports=bundle(practices,clientId,core,state);
 const groups={};let blocked=0,review=0,originals=0,proofs=0;
 for(const r of reports){
  const key=r.type||'Non classificata';
  if(!groups[key])groups[key]={count:0,blocked:0,review:0,originals:0,proofs:0};
  const g=groups[key];g.count++;
  if(r.state==='BLOCCATA'){g.blocked++;blocked++;}else{g.review++;review++;}
  g.originals+=r.originals.length;g.proofs+=r.proofs.length;
  originals+=r.originals.length;proofs+=r.proofs.length;
 }
 return {clientId:String(clientId),count:reports.length,blocked,review,originals,proofs,
  groups,reports,releaseAllowed:false,
  warning:'SOLO PREPARAZIONE INTERNA: il sistema non autorizza firma, rilascio o dichiarazione di conformita.'};
}
// Gate di preparazione: controlla anche riferimenti di revisione e identita dei file.
// I risultati sono indicativi e non abilitano emissione o firma.
function auditPackage(practices,clientId,core,state){
 const summary=readiness(practices,clientId,core,state);
 const findings=[];
 for(const r of summary.reports){
  if(!r.originals.length)findings.push({practiceId:r.practiceId,severity:'REVISIONE',code:'ORIGINALI_ASSENTI'});
  if(!r.proofs.length)findings.push({practiceId:r.practiceId,severity:'REVISIONE',code:'PROVE_ASSENTI'});
  for(const x of r.originals)if(x.status!=='DA VERIFICARE')
   findings.push({practiceId:r.practiceId,severity:'BLOCCANTE',code:x.status,sourceId:x.documentId});
  for(const x of r.proofs)if(x.status!=='DA VERIFICARE')
   findings.push({practiceId:r.practiceId,severity:'BLOCCANTE',code:x.status,sourceId:x.checkId});
 }
 return {clientId:summary.clientId,practices:summary.count,blocked:summary.blocked,
  review:summary.review,findings,readyForManualReview:summary.blocked===0,
  authorizedForIssue:false,disclaimer:'Esito interno: verifica tecnica, firme e modelli ufficiali sempre necessari.'};
}
function bundle(practices,clientId,core,state){
 if(!Array.isArray(practices)||!practices.length||practices.length>50)throw Error('Selezionare da 1 a 50 pratiche.');
 if(!clientId||!find(core?.clienti,clientId))throw Error('Cliente non valido.');
 const seen=new Set();
 return practices.map(p=>{
  if(!p||!same(p.clientId,clientId)||seen.has(String(p.id)))throw Error('Cliente diverso o pratica duplicata.');
  seen.add(String(p.id));return manifest(p,core,state);
 });
}
function csv(reports){
 if(!Array.isArray(reports))throw Error('Report non validi.');
 const lines=[['Pratica','Tipo','Revisione','Stato','Elemento','ID','Esito','SHA-256']];
 for(const r of reports){
  for(const d of r.originals)lines.push([r.reference,r.type,r.revision,r.state,'Originale',d.documentId,d.status,d.hash]);
  for(const p of r.proofs)lines.push([r.reference,r.type,r.revision,r.state,'Prova',p.checkId,p.status,'']);
  for(const i of r.issues)lines.push([r.reference,r.type,r.revision,r.state,'Controllo',i.area,i.level+': '+i.message,'']);
 }
 return '\uFEFF'+lines.map(row=>row.map(cell).join(';')).join('\r\n')+'\r\n';
}
function html(reports){
 if(!Array.isArray(reports))throw Error('Report non validi.');
 const sections=reports.map(r=>'<section><h2>'+esc(r.type)+' — '+esc(r.reference)+'</h2><p>Revisione '+esc(r.revision)+' · '+esc(r.state)+' · '+r.blocking+' blocchi</p>'+
 '<h3>Originali</h3><ul>'+r.originals.map(x=>'<li>'+esc(x.documentId)+' — '+esc(x.status)+'</li>').join('')+'</ul>'+
 '<h3>Prove</h3><ul>'+r.proofs.map(x=>'<li>'+esc(x.checkId)+' — '+esc(x.status)+'</li>').join('')+'</ul>'+
 '<h3>Controlli</h3><ul>'+r.issues.map(x=>'<li>'+esc(x.level)+' / '+esc(x.area)+': '+esc(x.message)+'</li>').join('')+'</ul></section>').join('');
 return '<!doctype html><html lang="it"><head><meta charset="utf-8"><title>ITE fascicolo interno</title><style>@page{size:A4;margin:15mm}body{font:12px Arial}section{break-after:page}li{overflow-wrap:anywhere}</style></head><body><h1>I.T.E. — Indice fascicolo tecnico</h1><p><b>BOZZA INTERNA NON FIRMATA. NON SOSTITUISCE DOCUMENTI ORIGINALI O DICHIARAZIONI.</b></p>'+sections+'</body></html>';
}
const api=Object.freeze({manifest,bundle,readiness,auditPackage,csv,html});
root.ITETechnicalPackage=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
