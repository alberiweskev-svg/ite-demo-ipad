/* I.T.E. 4.0 — Document intake staging, metadata only. No PDF bytes or network transmission.
 * Original 2.7.5 Di.Co./Di.Ri./GAS/POS/CAD modules remain untouched.
 */
(function(root){'use strict';
const TYPES=['DICO_ELETTRICO','DICO_IDRICO','DIRI','ALLEGATI_GAS','POS','CAD','FATTURA_ACQUISTO','FATTURA_VENDITA','PROFORMA','TD04','ALTRO'];
const STATES=['DA_CLASSIFICARE','DA_VERIFICARE','VERIFICATO','ARCHIVIATO'];
const clean=s=>String(s==null?'':s).trim();
const good=s=>typeof s==='string'&&s.length>0&&s.length<=240;
const validDate=s=>/^\d{4}-\d{2}-\d{2}$/.test(s)&&!Number.isNaN(Date.parse(s))&&new Date(s+'T12:00:00Z').toISOString().slice(0,10)===s;
function classify(filename='',text=''){
 const n=(clean(filename)+' '+clean(text)).toLocaleLowerCase('it');
 if(/\btd\s*0?4\b|nota di credito/.test(n))return 'TD04';
 if(/pro\s*forma|copia di cortesia|\bpr[- /]?\d+/.test(n))return 'PROFORMA';
 if(/dichiarazione di rispondenza|\bdi[ .-]?ri\b/.test(n))return 'DIRI';
 if(/dichiarazione di conformit[aà]|\bdi[ .-]?co\b/.test(n))return /elettric|\bdm\s*37.*lettera a/.test(n)?'DICO_ELETTRICO':/idraulic|idro.?sanitari|lettera d/.test(n)?'DICO_IDRICO':'ALTRO';
 if(/allegat[oi].*gas|\bgas\b.*allegat/.test(n))return 'ALLEGATI_GAS';
 if(/piano operativo di sicurezza|\bpos\b/.test(n))return 'POS';
 if(/\bcad\b|disegno tecnico/.test(n))return 'CAD';
 if(/fattura/.test(n))return 'ALTRO'; // purchase vs sale requires supplier verification
 return 'ALTRO';
}
function validate(s){
 if(!s||s.version!==1||!Array.isArray(s.items)||s.items.length>5000)throw Error('REGISTRO_NON_VALIDO');
 const ids=new Set(),fingerprints=new Set();
 const items=s.items.map(x=>{
  if(!x||!good(x.id)||!good(x.filename)||!TYPES.includes(x.type)||!STATES.includes(x.status)||!good(x.addedAt)||!validDate(x.addedAt)||typeof x.notes!=='string'||x.notes.length>2000)throw Error('DOCUMENTO_NON_VALIDO');
  if(x.clientId!==null&&x.clientId!==undefined&&!good(x.clientId))throw Error('CLIENTE_NON_VALIDO');
  if(x.siteId!==null&&x.siteId!==undefined&&!good(x.siteId))throw Error('SEDE_NON_VALIDA');
  if(x.number!==null&&x.number!==undefined&&clean(x.number).length>120)throw Error('NUMERO_NON_VALIDO');
  if(x.documentDate!==null&&x.documentDate!==undefined&&x.documentDate!==''&&!validDate(x.documentDate))throw Error('DATA_NON_VALIDA');
  if(x.status==='VERIFICATO'||x.status==='ARCHIVIATO'){
   if(!good(x.checkedBy)||x.originalChecked!==true||x.type==='ALTRO')throw Error('VERIFICA_ORIGINALE_OBBLIGATORIA');
  }
  if(ids.has(x.id))throw Error('ID_DUPLICATO');ids.add(x.id);
  const fingerprint=[clean(x.filename).toLowerCase(),clean(x.clientId),clean(x.siteId),clean(x.number)].join('|');
  if(fingerprints.has(fingerprint))throw Error('POSSIBILE_DUPLICATO');fingerprints.add(fingerprint);
  return {...x};
 });
 return {version:1,items};
}
const empty=()=>({version:1,items:[]});
function add(state,item){const s=validate(state);const x={type:'ALTRO',status:'DA_VERIFICARE',notes:'',clientId:null,siteId:null,number:null,documentDate:null,originalChecked:false,...item};return validate({version:1,items:[...s.items,x]})}
function update(state,id,patch){
 const s=validate(state);if(!s.items.some(x=>x.id===id))throw Error('DOCUMENTO_NON_TROVATO');
 const allowed=['type','status','notes','clientId','siteId','number','documentDate','checkedBy','originalChecked'];
 if(Object.keys(patch).some(k=>!allowed.includes(k)))throw Error('CAMPO_NON_MODIFICABILE');
 return validate({version:1,items:s.items.map(x=>x.id===id?{...x,...patch}:x)});
}
function verify(state,id,operator){if(!good(clean(operator)))throw Error('OPERATORE_OBBLIGATORIO');return update(state,id,{status:'VERIFICATO',checkedBy:clean(operator),originalChecked:true})}
function archive(state,id){const s=validate(state),item=s.items.find(x=>x.id===id);if(!item||item.status!=='VERIFICATO')throw Error('VERIFICA_PRELIMINARE_OBBLIGATORIA');return update(s,id,{status:'ARCHIVIATO'})}
function linkCheck(state,hierarchy){
 const s=validate(state),clients=new Set(hierarchy.clients.map(x=>x.id)),sites=new Map(hierarchy.sites.map(x=>[x.id,x.clientId]));
 for(const x of s.items){if(x.clientId&&!clients.has(x.clientId))throw Error('CLIENTE_INESISTENTE');if(x.siteId&&(!sites.has(x.siteId)||sites.get(x.siteId)!==x.clientId))throw Error('SEDE_NON_COHERENTE')}
 return s;
}
function summary(state){const s=validate(state);return {total:s.items.length,awaitingReview:s.items.filter(x=>x.status==='DA_VERIFICARE'||x.status==='DA_CLASSIFICARE').length,verified:s.items.filter(x=>x.status==='VERIFICATO').length,archived:s.items.filter(x=>x.status==='ARCHIVIATO').length,byType:Object.fromEntries(TYPES.map(t=>[t,s.items.filter(x=>x.type===t).length]))}}
function exportJSON(state){return JSON.stringify(validate(state),null,2)}
function importJSON(raw){let x;try{x=JSON.parse(raw)}catch(_){throw Error('JSON_NON_VALIDO')}return validate(x)}
const api=Object.freeze({TYPES,STATES,classify,empty,validate,add,update,verify,archive,linkCheck,summary,exportJSON,importJSON});
root.ITEDocumentIntake=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
