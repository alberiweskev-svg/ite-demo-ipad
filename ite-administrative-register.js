/* I.T.E. 4.0 — Registro amministrativo isolato: nessun PDF o dato reale incluso. */
(function(root){'use strict';
const clone=x=>JSON.parse(JSON.stringify(x));
const TYPES=Object.freeze(['ACQUISTO','VENDITA','PROFORMA','TD04']);
const STATES=Object.freeze(['DA_RECUPERARE','PARZIALMENTE_RECUPERATA','RECUPERATA']);
const round=n=>Math.round((n+Number.EPSILON)*100)/100;
function money(n){if(typeof n!=='number'||!Number.isFinite(n)||n<0||round(n)!==n)throw Error('IMPORTO_NON_VALIDO');return n}
function str(v,k){if(typeof v!=='string'||!v.trim())throw Error(k+'_OBBLIGATORIO');return v.trim()}
function date(v){str(v,'DATA');if(!/^\d{4}-\d{2}-\d{2}$/.test(v)||Number.isNaN(Date.parse(v+'T00:00:00Z'))||new Date(v+'T00:00:00Z').toISOString().slice(0,10)!==v)throw Error('DATA_NON_VALIDA');return v}
function normalize(d){
 if(!d||typeof d!=='object'||Array.isArray(d))throw Error('DOCUMENTO_NON_VALIDO');
 const type=str(d.type,'TIPO').toUpperCase();if(!TYPES.includes(type))throw Error('TIPO_NON_VALIDO');
 const id=str(d.id,'ID'),number=str(d.number,'NUMERO'),issued=date(d.issued),party=str(d.party,'CONTROPARTE');
 const taxable=money(d.taxable),vat=money(d.vat),total=money(d.total);
 if(Math.abs(round(taxable+vat)-total)>0.01)throw Error('TOTALI_INCOERENTI');
 if(type==='TD04'&&d.originalId!==undefined)str(d.originalId,'FATTURA_ORIGINALE');
 const recovered=type==='TD04'?money(d.recovered===undefined?0:d.recovered):0;
 if(recovered>total)throw Error('RECUPERO_ECCESSIVO');
 return {id,type,number,issued,party,taxable,vat,total,recovered,originalId:type==='TD04'?(d.originalId||null):null,source:d.source==='PDF'?'PDF':'MANUALE',verified:d.verified===true,notes:typeof d.notes==='string'?d.notes.slice(0,1000):''};
}
function creditStatus(d){if(d.type!=='TD04')return null;return d.recovered===0?STATES[0]:d.recovered>=d.total?STATES[2]:STATES[1]}
function empty(){return {schema:1,revision:0,documents:[],audit:[]}}
function validate(s){if(!s||s.schema!==1||!Number.isSafeInteger(s.revision)||s.revision<0||!Array.isArray(s.documents)||!Array.isArray(s.audit))throw Error('ARCHIVIO_NON_VALIDO');const ids=new Set(),keys=new Set();for(const d of s.documents){const n=normalize(d);if(ids.has(n.id))throw Error('ID_DUPLICATO');ids.add(n.id);const k=n.type+'|'+n.number.toUpperCase()+'|'+n.party.toUpperCase();if(keys.has(k))throw Error('DOCUMENTO_DUPLICATO');keys.add(k)}return true}
function transact(state,revision,actor,action,fn){validate(state);if(state.revision!==revision)throw Error('REVISIONE_NON_CORRENTE');str(actor,'OPERATORE');const next=clone(state);fn(next);validate(next);next.revision++;next.audit.push({revision:next.revision,actor,action});return next}
function add(state,revision,document,actor){const d=normalize(document);return transact(state,revision,actor,'INSERIMENTO:'+d.id,s=>{s.documents.push(d)})}
function verify(state,revision,id,actor){return transact(state,revision,actor,'VERIFICA:'+id,s=>{const d=s.documents.find(x=>x.id===id);if(!d)throw Error('DOCUMENTO_NON_TROVATO');d.verified=true})}
function recover(state,revision,id,amount,actor){money(amount);return transact(state,revision,actor,'RECUPERO:'+id,s=>{const d=s.documents.find(x=>x.id===id);if(!d||d.type!=='TD04')throw Error('TD04_NON_TROVATA');d.recovered=round(d.recovered+amount);if(d.recovered>d.total)throw Error('RECUPERO_ECCESSIVO')})}
function summary(state){validate(state);const out={counts:{ACQUISTO:0,VENDITA:0,PROFORMA:0,TD04:0},totals:{ACQUISTO:0,VENDITA:0,PROFORMA:0,TD04:0},creditOutstanding:0,unverified:0,creditStates:{DA_RECUPERARE:0,PARZIALMENTE_RECUPERATA:0,RECUPERATA:0}};for(const d of state.documents){out.counts[d.type]++;out.totals[d.type]=round(out.totals[d.type]+d.total);if(!d.verified)out.unverified++;if(d.type==='TD04'){out.creditOutstanding=round(out.creditOutstanding+round(d.total-d.recovered));out.creditStates[creditStatus(d)]++}}return out}
function classify(meta){const name=String(meta&&meta.filename||'').toLowerCase(),text=String(meta&&meta.text||'').toLowerCase();if(/\btd04\b|nota di credito/.test(text+' '+name))return {type:'TD04',confidence:'INDIZIO',requiresReview:true};if(/proforma|copia di cortesia|\bpr[\s_-]?\d/.test(text+' '+name))return {type:'PROFORMA',confidence:'INDIZIO',requiresReview:true};return {type:null,confidence:'INSUFFICIENTE',requiresReview:true}}
function exportJSON(state){validate(state);return JSON.stringify(state)}
function importJSON(json){if(typeof json!=='string'||json.length>5000000)throw Error('IMPORT_NON_VALIDO');const s=JSON.parse(json);validate(s);return clone(s)}
const api=Object.freeze({TYPES,STATES,empty,normalize,validate,add,verify,recover,creditStatus,summary,classify,exportJSON,importJSON});
root.ITEAdministrativeRegister=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
