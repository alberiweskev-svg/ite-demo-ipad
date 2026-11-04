/* I.T.E. 4.0: registro tecnico documentale, solo metadati di collaudo. */
(function(root){'use strict';
const clone=x=>JSON.parse(JSON.stringify(x));
const kinds=new Set(['DICO_ELETTRICA','DICO_IDRICA','DIRI','ALLEGATI_GAS','POS','CAD']);
const clean=(v,n=180)=>{if(typeof v!=='string'||!v.trim()||v.length>n)throw Error('CAMPO_NON_VALIDO');return v.trim()};
const date=v=>/^\d{4}-\d{2}-\d{2}$/.test(v)&&!Number.isNaN(Date.parse(v))&&new Date(v+'T00:00:00Z').toISOString().slice(0,10)===v;
function checkHierarchy(h,link){
 if(!h||!Array.isArray(h.clients))throw Error('ANAGRAFICHE_ASSENTI');
 const client=h.clients.find(x=>x.id===link.clientId);if(!client)throw Error('CLIENTE_ASSENTE');
 const sites=client.sites||client.sedi||[];const site=sites.find(x=>x.id===link.siteId);if(!site)throw Error('SEDE_NON_DEL_CLIENTE');
 if(link.plantId){const plant=(site.plants||site.impianti||[]).find(x=>x.id===link.plantId);if(!plant)throw Error('IMPIANTO_NON_DELLA_SEDE');
 if(link.deviceId&&!(plant.devices||plant.apparecchiature||[]).some(x=>x.id===link.deviceId))throw Error('APPARECCHIATURA_NON_DELL_IMPIANTO');
 }else if(link.deviceId)throw Error('IMPIANTO_OBBLIGATORIO');
 return true;
}
function normalize(raw,h){
 if(!raw||typeof raw!=='object')throw Error('DOCUMENTO_NON_VALIDO');
 const id=clean(raw.id,80);if(!id.startsWith('TEST-'))throw Error('SOLO_DATI_FITTIZI');
 if(!kinds.has(raw.kind))throw Error('TIPO_DOCUMENTO_NON_VALIDO');
 const link={clientId:clean(raw.clientId,80),siteId:clean(raw.siteId,80),plantId:raw.plantId?clean(raw.plantId,80):null,deviceId:raw.deviceId?clean(raw.deviceId,80):null};
 checkHierarchy(h,link);
 if(!date(raw.date))throw Error('DATA_NON_VALIDA');
 return {id,kind:raw.kind,number:clean(raw.number,80),date:raw.date,link,status:'BOZZA_DA_VERIFICARE',revision:0,history:[],attachments:[],source:'METADATI_MANUALI',notes:typeof raw.notes==='string'?raw.notes.slice(0,500):''};
}
function addBatch(state,rows,h){
 if(!state||!Array.isArray(state.records)||!Array.isArray(rows)||!rows.length||rows.length>100)throw Error('LOTTO_NON_VALIDO');
 const next=clone(state),seen=new Set(next.records.map(x=>x.id));
 for(const raw of rows){const d=normalize(raw,h);if(seen.has(d.id))throw Error('DOCUMENTO_DUPLICATO');seen.add(d.id);next.records.push(d)}
 return next;
}
function transition(state,id,action,operator,at,reason){
 const next=clone(state),d=next.records.find(x=>x.id===id);if(!d)throw Error('DOCUMENTO_ASSENTE');
 clean(operator,80);if(!/^\d{4}-\d{2}-\d{2}T/.test(at)||!Number.isFinite(Date.parse(at)))throw Error('DATA_OPERAZIONE_NON_VALIDA');
 const rules={BOZZA_DA_VERIFICARE:{CONFERMA:'VERIFICATO',RESPINGI:'DA_CORREGGERE'},DA_CORREGGERE:{RIPRESENTA:'BOZZA_DA_VERIFICARE'},VERIFICATO:{RIAPRI:'DA_CORREGGERE'}};
 const target=(rules[d.status]||{})[action];if(!target)throw Error('TRANSIZIONE_NON_CONSENTITA');
 if(action!=='CONFERMA')clean(reason,500);
 d.history.push({from:d.status,to:target,action,operator,at,reason:reason||''});d.status=target;d.revision++;return next;
}
function attachMetadata(state,id,item){
 const next=clone(state),d=next.records.find(x=>x.id===id);if(!d)throw Error('DOCUMENTO_ASSENTE');
 if(d.status==='VERIFICATO')throw Error('RIAPRIRE_PRIMA_DI_MODIFICARE');
 if(!item||!['SCHEMA','MATERIALI','PROVE','ALLEGATO_OBBLIGATORIO','ALTRO'].includes(item.kind))throw Error('ALLEGATO_NON_VALIDO');
 const attachment={id:clean(item.id,80),kind:item.kind,label:clean(item.label,180),verified:false};
 if(!attachment.id.startsWith('TEST-'))throw Error('SOLO_DATI_FITTIZI');
 if(d.attachments.some(x=>x.id===attachment.id))throw Error('ALLEGATO_DUPLICATO');
 d.attachments.push(attachment);d.revision++;return next;
}
function overview(state){return state.records.map(d=>({id:d.id,kind:d.kind,number:d.number,status:d.status,clientId:d.link.clientId,siteId:d.link.siteId,attachments:d.attachments.length,revision:d.revision}));}
const api=Object.freeze({checkHierarchy,normalize,addBatch,transition,attachMetadata,overview});
root.ITETechnicalRegister=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
