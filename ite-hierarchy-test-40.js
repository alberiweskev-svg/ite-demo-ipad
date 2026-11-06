/* I.T.E. 4.0.39 — archivio gerarchico dimostrativo isolato. */
(function(root){'use strict';
const KEY='ITE40_HIERARCHY_TEST_V1', ID=/^TEST-[A-Za-z0-9_-]{1,70}$/, TYPES=['clienti','sedi','impianti','apparecchiature','interventi'];
const PARENT={sedi:['clienti','clienteId'],impianti:['sedi','sedeId'],apparecchiature:['impianti','impiantoId'],interventi:['apparecchiature','apparecchiaturaId']};
function check(data){
 if(!data||typeof data!=='object'||Array.isArray(data))throw Error('ARCHIVIO_NON_VALIDO');
 const result={},seen=new Set();
 for(const type of TYPES){
  const rows=data[type];if(!Array.isArray(rows)||rows.length>10000)throw Error('COLLEZIONE_NON_VALIDA_'+type);
  result[type]=rows.map(row=>{
   if(!row||typeof row!=='object'||!ID.test(row.id)||seen.has(row.id)||typeof row.nome!=='string'||!row.nome.trim()||row.nome.length>180)throw Error('RECORD_NON_VALIDO_O_DUPLICATO');
   seen.add(row.id);
   const obj={id:row.id,nome:row.nome.trim()};
   if(PARENT[type]){const key=PARENT[type][1];if(!ID.test(row[key]))throw Error('RIFERIMENTO_NON_VALIDO');obj[key]=row[key]}
   if(type==='interventi'){
    if(!['PROGRAMMATO','IN_CORSO','CHIUSO','REVISIONATO'].includes(row.stato))throw Error('STATO_NON_VALIDO');
    if(!ID.test(row.operatoreId))throw Error('OPERATORE_NON_VALIDO');
    if(row.arrivo!==null&&row.arrivo!==undefined&&(!Number.isSafeInteger(row.arrivo)||row.arrivo<0))throw Error('ARRIVO_NON_VALIDO');
    if(row.uscita!==null&&row.uscita!==undefined&&(!Number.isSafeInteger(row.uscita)||row.uscita<0))throw Error('USCITA_NON_VALIDA');
    if(row.uscita!=null&&(row.arrivo==null||row.uscita<row.arrivo))throw Error('TEMPI_NON_COHERENTI');
    if(row.stato==='CHIUSO'&&row.uscita==null)throw Error('CHIUSURA_SENZA_USCITA');
    obj.stato=row.stato;obj.operatoreId=row.operatoreId;obj.arrivo=row.arrivo??null;obj.uscita=row.uscita??null;
   }
   return obj;
  });
 }
 for(const type of TYPES.slice(1)){const [parent,key]=PARENT[type],ids=new Set(result[parent].map(x=>x.id));for(const row of result[type])if(!ids.has(row[key]))throw Error('GENITORE_ASSENTE_'+type)}
 return result;
}
function empty(){return Object.fromEntries(TYPES.map(x=>[x,[]]))}
function create(storage){
 if(!storage||typeof storage.getItem!=='function'||typeof storage.setItem!=='function')throw Error('STORAGE_ASSENTE');
 let state=empty();
 const get=()=>JSON.parse(JSON.stringify(state));
 function save(next){const checked=check(next);storage.setItem(KEY,JSON.stringify(checked));state=checked;return get()}
 function load(){const raw=storage.getItem(KEY);state=raw?check(JSON.parse(raw)):empty();return get()}
 function upsert(type,row){if(!TYPES.includes(type))throw Error('TIPO_NON_VALIDO');const next=get();next[type]=next[type].filter(x=>x.id!==row.id).concat([row]);return save(next)}
 function remove(type,id){if(!TYPES.includes(type)||!ID.test(id))throw Error('RIMOZIONE_NON_VALIDA');const next=get();next[type]=next[type].filter(x=>x.id!==id);return save(next)}
 function path(type,id){if(!TYPES.includes(type))throw Error('TIPO_NON_VALIDO');const result=[];let t=type,r=state[t].find(x=>x.id===id);if(!r)throw Error('RECORD_ASSENTE');while(r){result.unshift({type:t,...r});if(!PARENT[t])break;const [parent,key]=PARENT[t];r=state[parent].find(x=>x.id===r[key]);t=parent}return result}
 function exportBackup(){return JSON.stringify({format:'ITE40_HIERARCHY_TEST',version:1,data:get()},null,2)}
 function restore(text){if(typeof text!=='string'||text.length>3000000)throw Error('BACKUP_NON_VALIDO');const b=JSON.parse(text);if(!b||b.format!=='ITE40_HIERARCHY_TEST'||b.version!==1)throw Error('FORMATO_NON_VALIDO');return save(b.data)}
 return Object.freeze({load,get,save,upsert,remove,path,exportBackup,restore});
}
const api=Object.freeze({KEY,TYPES,empty,check,create});root.ITE40HierarchyTest=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
