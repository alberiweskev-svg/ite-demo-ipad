/* I.T.E. 4.0 — intake testo estratto da PDF, esclusivamente collaudo sintetico. Nessun upload remoto. */
(function(root){'use strict';
const clone=x=>JSON.parse(JSON.stringify(x));
const types=['DICO_ELETTRICA','DICO_IDRICA','DIRI','ALLEGATI_GAS','POS','CAD'];
const rules=[
 ['number',/(?:numero|n[.°º]|nr)\s*[:#-]?\s*([A-Z0-9/-]{2,40})/i],
 ['date',/(?:data|emissione)\s*[:#-]?\s*(\d{2}[/-]\d{2}[/-]\d{4}|\d{4}-\d{2}-\d{2})/i],
 ['committente',/(?:committente|cliente)\s*[:#-]?\s*([^\r\n]{3,100})/i],
 ['address',/(?:indirizzo|ubicazione|immobile)\s*[:#-]?\s*([^\r\n]{3,120})/i],
 ['plant',/(?:impianto|tipologia impianto)\s*[:#-]?\s*([^\r\n]{3,100})/i]
];
function iso(s){if(!s)return null;const m=s.match(/^(\d{2})[/-](\d{2})[/-](\d{4})$/);const d=m?m[3]+'-'+m[2]+'-'+m[1]:s;return /^\d{4}-\d{2}-\d{2}$/.test(d)&&!Number.isNaN(Date.parse(d))&&new Date(d+'T00:00:00Z').toISOString().slice(0,10)===d?d:null}
function parse(text,kind){if(typeof text!=='string'||text.length>200000||text.length<20)throw Error('TESTO_NON_VALIDO');if(!types.includes(kind))throw Error('TIPO_NON_VALIDO');if(!/\bTEST[- _]/i.test(text))throw Error('SOLO_TESTI_FITTIZI');
 const fields={};for(const [key,re] of rules){const m=text.match(re);fields[key]=m?m[1].trim():null}
 fields.date=iso(fields.date);const missing=['number','date','committente','address'].filter(k=>!fields[k]);
 return {kind,fields,missing,confidence:Math.round((4-missing.length)/4*100),source:'TESTO_ESTRATTO_SIMULATO',requiresReview:true};
}
function previewBatch(items){if(!Array.isArray(items)||!items.length||items.length>100)throw Error('LOTTO_NON_VALIDO');return items.map((item,i)=>{try{return {index:i,ok:true,result:parse(item.text,item.kind)}}catch(e){return {index:i,ok:false,error:e.message}}})}
function register(state,items,hierarchy,registerApi,operator,at){if(typeof operator!=='string'||!operator.trim()||!operator.toUpperCase().includes('TEST'))throw Error('OPERATORE_TEST_OBBLIGATORIO');if(!Number.isFinite(Date.parse(at)))throw Error('DATA_NON_VALIDA');
 const previews=previewBatch(items);if(previews.some(p=>!p.ok||p.result.missing.length))throw Error('REVISIONE_CAMPI_OBBLIGATORIA');
 const rows=previews.map((p,i)=>{const item=items[i];if(!/^TEST-[A-Z0-9-]{1,60}$/.test(item.id))throw Error('ID_TEST_OBBLIGATORIO');
 return {id:item.id,kind:p.result.kind,number:p.result.fields.number,date:p.result.fields.date,clientId:item.clientId,siteId:item.siteId,plantId:item.plantId,deviceId:item.deviceId,notes:'Import testo sintetico, verifica manuale obbligatoria'}});
 const next=registerApi.addBatch(state,rows,hierarchy);
 next.records.slice(-rows.length).forEach((r,i)=>{r.source='TESTO_ESTRATTO_SIMULATO';r.extracted=clone(previews[i].result.fields);r.history.push({action:'IMPORTA_TESTO',operator,at,from:null,to:'BOZZA_DA_VERIFICARE',reason:'Campi estratti da testo sintetico; richiede controllo'});});
 return next;
}
const api=Object.freeze({parse,previewBatch,register});root.ITEPdfIntake=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
