/* I.T.E. 4.0 — Local document review gate. No file uploads. */
(function(root){'use strict';
const clean=x=>String(x??'').replace(/[\u0000-\u001f]/g,' ').trim();
const money=x=>{const n=Number(String(x).replace(/\./g,'').replace(',','.'));return Number.isFinite(n)&&n>=0?Math.round(n*100)/100:null};
const euro=x=>{const s=String(x||'').replace(/\s/g,'');return /^\d{1,3}(?:\.\d{3})*,\d{2}$|^\d+(?:[.,]\d{2})$/.test(s)?money(s):null};
const pattern=(s,re)=>{const m=s.match(re);return m?clean(m[1]):null};
function classify(name,text){const s=(name+' '+text).toLowerCase();if(/\btd04\b|nota di credito/.test(s))return 'TD04';if(/proforma|copia di cortesia/.test(s))return 'PROFORMA';if(/dichiarazione di rispondenza|\bdi\.?ri\.?\b/.test(s))return 'DIRI';if(/dichiarazione di conformit[aà]|\bdi\.?co\.?\b/.test(s))return 'DICO';if(/allegat[oi] (?:gas|h40|i40|a12|b12)/.test(s))return 'GAS';if(/piano operativo di sicurezza|\bpos\b/.test(s))return 'POS';if(/fattura/.test(s))return 'FATTURA_DA_CLASSIFICARE';return 'DA_VERIFICARE'}
function inspect(filename,text){if(typeof text!=='string'||text.length>250000)throw Error('TESTO_NON_VALIDO');const s=text.replace(/\r/g,'');const kind=classify(clean(filename),s);
const number=pattern(s,/(?:numero|n[.°º]|fattura\s*n[.°º]?)\s*[:#-]?\s*([A-Z0-9][A-Z0-9\/-]{0,35})/i);
const date=pattern(s,/(?:data(?:\s+documento)?|del)\s*[:#-]?\s*(\d{2}[\/.-]\d{2}[\/.-]\d{4})/i);
const candidates=[...s.matchAll(/(?:totale\s+(?:documento|fattura|da pagare)|importo\s+totale)\s*[:€ ]+([\d.,]+)/gi)].map(m=>euro(m[1])).filter(x=>x!==null);
return {filename:clean(filename).slice(0,180),kind,number,date,total:candidates.length===1?candidates[0]:null,requiresReview:true,extractedTextLength:s.length,warning:'Campi indicativi: confermare contro il documento originale; nessuna registrazione automatica'} }
function prepare(meta,fields){if(!meta||!meta.requiresReview)throw Error('REVISIONE_OBBLIGATORIA');const f={...fields};if(!clean(f.operator))throw Error('OPERATORE_OBBLIGATORIO');if(!f.confirmed)throw Error('CONFERMA_OBBLIGATORIA');if(!clean(f.type)||!clean(f.number)||!clean(f.party)||!clean(f.issued))throw Error('CAMPI_OBBLIGATORI');if(!/^\d{4}-\d{2}-\d{2}$/.test(f.issued))throw Error('DATA_NON_VALIDA');return {id:clean(f.id),type:clean(f.type),number:clean(f.number),party:clean(f.party),issued:f.issued,taxable:Number(f.taxable),vat:Number(f.vat),total:Number(f.total),source:'PDF',verified:false,originalId:clean(f.originalId)||null}}
const api=Object.freeze({classify,inspect,prepare});root.ITEDocumentReview=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
