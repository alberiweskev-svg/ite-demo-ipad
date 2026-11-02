/* I.T.E. 4.0 — Technical-document review and integrity workspace.
 * Metadata only; no original PDF content. Does not modify legacy 2.7.5 modules.
 */
(function(root){'use strict';
const KEY='ite40_technical_documents_demo_v1';
const ALLOWED=['DICO','DIRI','GAS','POS'];
const clean=v=>String(v??'').trim().slice(0,180);
const stamp=()=>new Date().toISOString();
function dateOK(v){if(!/^\d{4}-\d{2}-\d{2}$/.test(v||''))return false;const d=new Date(v+'T00:00:00Z');return !Number.isNaN(d.valueOf())&&d.toISOString().slice(0,10)===v}
function checkArchive(records){if(!Array.isArray(records)||records.length>5000)throw Error('ARCHIVIO_NON_VALIDO');
const ids=new Set(),keys=new Set();return records.map((r,i)=>{if(!r||!ALLOWED.includes(r.kind)||!clean(r.id)||!clean(r.clientId)||!clean(r.siteId)||!clean(r.number)||!dateOK(r.issued))throw Error('DOCUMENTO_NON_VALIDO_'+i);
const id=clean(r.id),key=[r.kind,clean(r.clientId),clean(r.number)].join('|').toUpperCase();if(ids.has(id)||keys.has(key))throw Error('DOCUMENTO_DUPLICATO');ids.add(id);keys.add(key);return {...r}})}
function read(raw){if(!raw)return [];let value;try{value=JSON.parse(raw)}catch(_){throw Error('ARCHIVIO_DANNEGGIATO')}return checkArchive(value)}
function verify(records,id,operator,confirmed){const docs=checkArchive(records);if(!clean(operator))throw Error('OPERATORE_OBBLIGATORIO');if(confirmed!==true)throw Error('CONFERMA_OBBLIGATORIA');const index=docs.findIndex(x=>x.id===id);if(index<0)throw Error('DOCUMENTO_NON_TROVATO');if(docs[index].status==='VERIFICATO')throw Error('GIA_VERIFICATO');docs[index]={...docs[index],status:'VERIFICATO',verifiedBy:clean(operator),verifiedAt:stamp()};return docs}
function batchAppend(records,inputs){const previous=checkArchive(records);if(!Array.isArray(inputs)||!inputs.length||inputs.length>100)throw Error('LOTTO_NON_VALIDO');const intake=root.ITETechnicalIntake||(typeof require==='function'?require('./ite-technical-intake.js'):null);if(!intake)throw Error('MOTORE_TECNICO_ASSENTE');let next=previous;for(const input of inputs)next=intake.append(next,input);return checkArchive(next)}
function audit(records,masters){const docs=checkArchive(records),m=masters||{};const clients=m.clients||[],sites=m.sites||[],plants=m.plants||[],devices=m.devices||[];const has=(a,id)=>a.some(x=>clean(x.id)===clean(id));const get=(a,id)=>a.find(x=>clean(x.id)===clean(id));
return docs.map(d=>{const issues=[];if(clients.length&&!has(clients,d.clientId))issues.push('CLIENTE_NON_TROVATO');
if(sites.length){const site=get(sites,d.siteId);if(!site)issues.push('SEDE_NON_TROVATA');else if(clean(site.clientId)!==d.clientId)issues.push('SEDE_CLIENTE_INCOERENTE')}
if(d.plantId&&plants.length){const p=get(plants,d.plantId);if(!p)issues.push('IMPIANTO_NON_TROVATO');else if(clean(p.siteId)!==d.siteId)issues.push('IMPIANTO_SEDE_INCOERENTE')}
if(d.deviceId&&devices.length){const a=get(devices,d.deviceId);if(!a)issues.push('APPARECCHIATURA_NON_TROVATA');else if(!d.plantId||clean(a.plantId)!==d.plantId)issues.push('APPARECCHIATURA_IMPIANTO_INCOERENTE')}
return {id:d.id,kind:d.kind,number:d.number,status:d.status,issues,ready:issues.length===0&&d.status==='VERIFICATO'}})}
function mount(){if(typeof document==='undefined')return false;const host=document.getElementById('ite-technical-intake');if(!host||document.getElementById('ite-technical-audit'))return false;
const section=document.createElement('section');section.id='ite-technical-audit';const heading=document.createElement('h3');heading.textContent='Revisione e integrità documenti tecnici';const note=document.createElement('p');note.textContent='Verifica manuale dei riferimenti Di.Co., Di.Ri., GAS e POS. Solo metadati locali: non sostituisce la verifica dei PDF originali o i moduli 2.7.5.';
const operator=document.createElement('input');operator.placeholder='Operatore responsabile';operator.setAttribute('aria-label','Operatore responsabile');
const confirm=document.createElement('input');confirm.type='checkbox';const label=document.createElement('label');label.append(confirm,document.createTextNode(' Confermo il confronto con il documento originale'));
const status=document.createElement('p');status.setAttribute('role','status');const list=document.createElement('div');const refresh=document.createElement('button');refresh.type='button';refresh.textContent='Aggiorna elenco';const exportButton=document.createElement('button');exportButton.type='button';exportButton.textContent='Esporta metadati JSON';
function render(){list.replaceChildren();try{const records=read(localStorage.getItem(KEY));const results=audit(records);status.textContent=records.length+' documenti tecnici registrati';for(const r of results){const line=document.createElement('div');const description=document.createElement('span');description.textContent=r.kind+' '+r.number+' — '+r.status+(r.issues.length?' — '+r.issues.join(', '):'');line.append(description);if(r.status!=='VERIFICATO'){const button=document.createElement('button');button.type='button';button.textContent='Verifica';button.addEventListener('click',()=>{try{const updated=verify(read(localStorage.getItem(KEY)),r.id,operator.value,confirm.checked);localStorage.setItem(KEY,JSON.stringify(updated));confirm.checked=false;render()}catch(e){status.textContent='Verifica bloccata: '+e.message}});line.append(button)}list.append(line)}}catch(e){status.textContent='Archivio non modificato: '+e.message}}
refresh.addEventListener('click',render);exportButton.addEventListener('click',()=>{try{const data=JSON.stringify(read(localStorage.getItem(KEY)),null,2);const blob=new Blob([data],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='ite40-documenti-tecnici-metadati.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}catch(e){status.textContent=e.message}});
section.append(heading,note,operator,label,refresh,exportButton,status,list);host.append(section);render();return true}
const api=Object.freeze({KEY,checkArchive,read,verify,batchAppend,audit,mount});root.ITETechnicalAudit=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
if(typeof document!=='undefined'){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount()}
})(typeof window!=='undefined'?window:globalThis);
