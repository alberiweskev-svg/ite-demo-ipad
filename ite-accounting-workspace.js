/* I.T.E. 4.0 — Registro amministrativo locale, senza invio di documenti. */
(function(root){'use strict';
const KEY='ite40_accounting_v1';
const round=n=>Math.round((n+Number.EPSILON)*100)/100;
const validMoney=n=>typeof n==='number'&&Number.isFinite(n)&&n>=0&&Math.abs(n*100-Math.round(n*100))<1e-6;
const id=s=>typeof s==='string'&&s.trim().length>0&&s.length<=120;
const date=s=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&!Number.isNaN(Date.parse(s+'T12:00:00Z'))&&new Date(s+'T12:00:00Z').toISOString().slice(0,10)===s;
const kinds=['ACQUISTO','VENDITA','PROFORMA','TD04'];
const statuses=['DA_VERIFICARE','CONFERMATO'];
function validate(input){
 if(!input||typeof input!=='object'||!Array.isArray(input.documents)||input.documents.length>10000)throw Error('ARCHIVIO_NON_VALIDO');
 const keys=new Set(),documents=[];
 for(const d of input.documents){
  if(!d||!id(d.id)||!id(d.number)||!date(d.date)||!kinds.includes(d.kind)||!statuses.includes(d.status)||!id(d.counterparty)||!validMoney(d.taxable)||!validMoney(d.vat)||!validMoney(d.total)||!['10','22','MISTA','ALTRO'].includes(String(d.vatCategory||'ALTRO')))throw Error('DOCUMENTO_NON_VALIDO');
  if(Math.abs(round(d.taxable+d.vat)-d.total)>0.01)throw Error('TOTALE_NON_COHERENTE');
  if(d.status==='CONFERMATO'&&(!id(d.operator)||d.originalChecked!==true))throw Error('REVISIONE_OBBLIGATORIA');
  if(d.kind==='TD04'&&!['DA_RECUPERARE','PARZIALMENTE','RECUPERATA'].includes(d.creditStatus||'DA_RECUPERARE'))throw Error('STATO_NOTA_CREDITO_NON_VALIDO');
  if(d.kind==='TD04'&&(!validMoney(d.recovered||0)||(d.recovered||0)>d.total))throw Error('RECUPERO_NON_VALIDO');
  if(d.kind==='TD04'&&((d.recovered||0)===0?'DA_RECUPERARE':(d.recovered||0)===d.total?'RECUPERATA':'PARZIALMENTE')!==(d.creditStatus||'DA_RECUPERARE'))throw Error('STATO_RECUPERO_INCOERENTE');
  if(d.kind!=='TD04'&&(d.creditStatus!==undefined||d.recovered!==undefined))throw Error('CREDITO_NON_APPLICABILE');
  const unique=[d.kind,d.number.trim().toLocaleLowerCase('it'),d.date,d.counterparty.trim().toLocaleLowerCase('it')].join('|');
  if(keys.has(unique)||documents.some(x=>x.id===d.id))throw Error('DOCUMENTO_DUPLICATO');
  keys.add(unique);documents.push({...d,vatCategory:String(d.vatCategory||'ALTRO'),...(d.kind==='TD04'?{recovered:d.recovered||0,creditStatus:d.creditStatus||'DA_RECUPERARE'}:{})});
 }
 return {version:1,documents};
}
const empty=()=>validate({documents:[]});
function add(state,doc){const s=validate(state);return validate({documents:[...s.documents,{...doc,status:'DA_VERIFICARE'}]})}
function review(state,documentId,operator,originalChecked){const s=validate(state);if(!id(operator)||originalChecked!==true)throw Error('REVISIONE_OBBLIGATORIA');if(!s.documents.some(d=>d.id===documentId))throw Error('DOCUMENTO_NON_TROVATO');return validate({documents:s.documents.map(d=>d.id===documentId?{...d,status:'CONFERMATO',operator:operator.trim(),originalChecked:true}:d)})}
function recover(state,documentId,amount){const s=validate(state);if(!validMoney(amount)||amount===0)throw Error('IMPORTO_NON_VALIDO');return validate({documents:s.documents.map(d=>{if(d.id!==documentId)return d;if(d.kind!=='TD04')throw Error('NON_NOTA_CREDITO');const recovered=round((d.recovered||0)+amount);if(recovered>d.total)throw Error('RECUPERO_ECCESSIVO');return {...d,recovered,creditStatus:recovered===d.total?'RECUPERATA':'PARZIALMENTE'}})});}
function totals(state){const s=validate(state),result={ACQUISTO:0,VENDITA:0,PROFORMA:0,TD04:0,creditToRecover:0,pending:0};for(const d of s.documents){result[d.kind]=round(result[d.kind]+d.total);if(d.kind==='TD04')result.creditToRecover=round(result.creditToRecover+d.total-d.recovered);if(d.status==='DA_VERIFICARE')result.pending++}return result}
function parse(raw){let x;try{x=JSON.parse(raw)}catch(_){throw Error('JSON_NON_VALIDO')}if(x.version!==1)throw Error('VERSIONE_NON_SUPPORTATA');return validate(x)}
function save(storage,state){const s=validate(state),old=storage.getItem(KEY);storage.setItem(KEY+'_previous',old===null?JSON.stringify(empty()):old);storage.setItem(KEY,JSON.stringify(s));return s}
function load(storage){const raw=storage.getItem(KEY);return raw?parse(raw):empty()}
function classify(text,filename=''){const t=(String(text||'')+' '+String(filename||'')).toLocaleLowerCase('it');if(/\btd\s*04\b|nota di credito/.test(t))return 'TD04';if(/pro\s*forma|copia di cortesia|\bpr\s*[-/]\s*\d+/.test(t))return 'PROFORMA';if(/fattura/.test(t))return 'DA_VERIFICARE';return 'SCONOSCIUTO'}
const api=Object.freeze({KEY,empty,validate,add,review,recover,totals,parse,save,load,classify});root.ITEAccountingWorkspace=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
