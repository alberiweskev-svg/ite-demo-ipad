/* I.T.E. 4.0.29 — Ordini di lavoro integrati, solo dati TEST. Nessun PDF o dato reale. */
(function(root){'use strict';
const clone=x=>JSON.parse(JSON.stringify(x));
const id=x=>{if(typeof x!=='string'||!/^TEST-[A-Za-z0-9_-]{1,70}$/.test(x))throw Error('SOLO_DATI_TEST');return x};
const stamp=x=>{if(typeof x!=='string'||!/^\d{4}-\d{2}-\d{2}T/.test(x)||!Number.isFinite(Date.parse(x)))throw Error('DATA_NON_VALIDA');return new Date(x).toISOString()};
const label=(x,n=500)=>{if(typeof x!=='string'||!x.trim()||x.length>n)throw Error('TESTO_NON_VALIDO');return x.trim()};
const base=s=>{if(!s||!['clients','operators','appointments','interventions','quotes','audit'].every(k=>Array.isArray(s[k])))throw Error('ARCHIVIO_NON_VALIDO');return s};
function link(s,appointmentId){
 const a=s.appointments.find(x=>x.id===id(appointmentId));if(!a)throw Error('APPUNTAMENTO_ASSENTE');
 const c=s.clients.find(x=>x.id===a.clientId),site=c?.sites?.find(x=>x.id===a.siteId),plant=site?.plants?.find(x=>x.id===a.plantId);
 if(!plant||(a.deviceId&&!plant.devices?.some(x=>x.id===a.deviceId)))throw Error('GERARCHIA_NON_VALIDA');
 if(!s.operators.some(x=>x.id===a.operatorId))throw Error('OPERATORE_ASSENTE');
 return a;
}
function records(s){return Array.isArray(s.workOrders)?s.workOrders:[]}
function audit(s,action,actor,at,orderId){s.audit.push({action,operator:id(actor),at:stamp(at),workOrderId:orderId})}
function create(state,raw,actor,at){
 const s=clone(base(state)),a=link(s,raw.appointmentId),key=id(raw.id);
 if(records(s).some(x=>x.id===key))throw Error('ID_DUPLICATO');
 if(a.status==='ANNULLATO')throw Error('APPUNTAMENTO_ANNULLATO');
 if(!s.workOrders)s.workOrders=[];
 s.workOrders.push({id:key,appointmentId:a.id,clientId:a.clientId,siteId:a.siteId,plantId:a.plantId,deviceId:a.deviceId||null,operatorId:a.operatorId,status:'PREPARATO',quoteIds:[],documents:[],notes:[],history:[{action:'CREATO',at:stamp(at),actor:id(actor)}]});
 audit(s,'ORDINE_LAVORO_CREATO',actor,at,key);return s;
}
function mutate(state,key,actor,at,action,fn){
 const s=clone(base(state)),w=records(s).find(x=>x.id===id(key));if(!w)throw Error('ORDINE_LAVORO_ASSENTE');
 link(s,w.appointmentId);fn(s,w);w.history.push({action,at:stamp(at),actor:id(actor)});audit(s,'ORDINE_LAVORO_'+action,actor,at,key);return s;
}
function attachQuote(state,key,quoteId,actor,at){
 return mutate(state,key,actor,at,'PREVENTIVO_COLLEGATO',(s,w)=>{
 if(w.status==='ARCHIVIATO')throw Error('ORDINE_ARCHIVIATO');
 const q=s.quotes.find(x=>x.id===id(quoteId));if(!q)throw Error('PREVENTIVO_ASSENTE');
 if(q.clientId!==w.clientId)throw Error('PREVENTIVO_CLIENTE_DIVERSO');
 if(w.quoteIds.includes(q.id))throw Error('PREVENTIVO_GIA_COLLEGATO');
 w.quoteIds.push(q.id);
 });
}
const TYPES=['DICO_ELETTRICA','DICO_IDRICA','DIRI','ALLEGATI_GAS','POS','CAD','RAPPORTO'];
function attachDocument(state,key,doc,actor,at){
 return mutate(state,key,actor,at,'DOCUMENTO_COLLEGATO',(_s,w)=>{
 if(w.status==='ARCHIVIATO')throw Error('ORDINE_ARCHIVIATO');
 const ref=id(doc.id);if(!TYPES.includes(doc.type))throw Error('TIPO_DOCUMENTO_NON_VALIDO');
 if(w.documents.some(x=>x.id===ref))throw Error('DOCUMENTO_GIA_COLLEGATO');
 w.documents.push({id:ref,type:doc.type,title:label(doc.title,120),status:'DA_COMPILARE'});
 });
}
function documentStatus(state,key,documentId,status,actor,at){
 return mutate(state,key,actor,at,'STATO_DOCUMENTO',(_s,w)=>{
 if(w.status==='ARCHIVIATO')throw Error('ORDINE_ARCHIVIATO');
 const d=w.documents.find(x=>x.id===id(documentId));if(!d)throw Error('DOCUMENTO_ASSENTE');
 if(!['DA_COMPILARE','IN_REVISIONE','VERIFICATO'].includes(status))throw Error('STATO_NON_VALIDO');
 d.status=status;
 });
}
function note(state,key,text,actor,at){
 return mutate(state,key,actor,at,'NOTA_AGGIUNTA',(_s,w)=>{if(w.status==='ARCHIVIATO')throw Error('ORDINE_ARCHIVIATO');w.notes.push({text:label(text),at:stamp(at),actor:id(actor)})});
}
function synchronize(state,key,actor,at){
 return mutate(state,key,actor,at,'SINCRONIZZATO',(s,w)=>{
 const a=link(s,w.appointmentId),i=s.interventions.find(x=>x.appointmentId===a.id);
 if(a.operatorId!==w.operatorId)w.operatorId=a.operatorId;
 w.status=i?.status==='CHIUSO'?'COMPLETATO':i?.status==='APERTO'?'IN_CORSO':'PREPARATO';
 });
}
function archive(state,key,actor,at){
 return mutate(state,key,actor,at,'ARCHIVIATO',(s,w)=>{
 const a=link(s,w.appointmentId),i=s.interventions.find(x=>x.appointmentId===a.id);
 if(a.status!=='CHIUSO'||i?.status!=='CHIUSO')throw Error('INTERVENTO_NON_CHIUSO');
 if(w.documents.some(x=>x.status!=='VERIFICATO'))throw Error('DOCUMENTI_DA_VERIFICARE');
 w.status='ARCHIVIATO';
 });
}
function dossier(state,key){
 const s=base(state),w=records(s).find(x=>x.id===id(key));if(!w)throw Error('ORDINE_LAVORO_ASSENTE');
 const a=link(s,w.appointmentId),i=s.interventions.find(x=>x.appointmentId===a.id);
 const quotes=w.quoteIds.map(qid=>s.quotes.find(q=>q.id===qid)).filter(Boolean);
 const totals={fornituraCents:0,posaCents:0,extraDaApprovareCents:0,extraApprovatiCents:0};
 for(const q of quotes)for(const l of q.lines){const n=Math.round(l.quantity*l.unitPrice*100);if(!Number.isSafeInteger(n)||n<0)throw Error('IMPORTO_NON_VALIDO');if(l.extra&&!l.approved)totals.extraDaApprovareCents+=n;else{totals[l.kind==='FORNITURA'?'fornituraCents':'posaCents']+=n;if(l.extra)totals.extraApprovatiCents+=n;}}
 return clone({order:w,appointment:a,intervention:i||null,quotes:quotes.map(q=>({id:q.id,status:q.status})),totals,alerts:[...(i?[]:['INTERVENTO_NON_AVVIATO']),...(w.documents.some(x=>x.status!=='VERIFICATO')?['DOCUMENTI_NON_VERIFICATI']:[])]});
}
const api=Object.freeze({create,attachQuote,attachDocument,documentStatus,note,synchronize,archive,dossier});
root.ITE40WorkOrders=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
