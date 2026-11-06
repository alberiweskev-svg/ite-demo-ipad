/* I.T.E. 4.0.42 — TEST workflow bridge. All state stays local; no real records. */
(function(root,factory){const api=factory(root);if(typeof module==='object'&&module.exports)module.exports=api;root.ITEWorkflowBridge40=api;})(typeof globalThis!=='undefined'?globalThis:this,function(root){
'use strict';
const KEY='ITE40_WORKFLOW_TEST_V1';
const empty=()=>({clients:[],sites:[],plants:[],equipment:[],operators:[],appointments:[],interventions:[],estimates:[]});
function fromHierarchy(h){
 const db=empty(),get=(k)=>h[k]||[];
 db.clients=get('clienti').map(x=>({id:x.id,name:x.nome}));
 db.sites=get('sedi').map(x=>({id:x.id,clientId:x.clienteId,name:x.nome}));
 db.plants=get('impianti').map(x=>({id:x.id,siteId:x.sedeId,name:x.nome}));
 db.equipment=get('apparecchiature').map(x=>({id:x.id,plantId:x.impiantoId,name:x.nome}));
 return db;
}
function reconcile(current,h){
 const incoming=fromHierarchy(h),next=JSON.parse(JSON.stringify(current));
 for(const key of ['clients','sites','plants','equipment']){
  const map=new Map(next[key].map(x=>[x.id,x]));
  for(const row of incoming[key]){
   const old=map.get(row.id);
   if(old&&JSON.stringify(old)!==JSON.stringify(row))throw Error('Conflitto anagrafico '+row.id);
   if(!old)next[key].push(row);
  }
 }
 return next;
}
function create(storage,engine){
 if(!storage||!engine)throw Error('Archivio o motore assente');
 let state=empty();
 const get=()=>JSON.parse(JSON.stringify(state));
 function save(db){engine.validate(db);storage.setItem(KEY,JSON.stringify(db));state=JSON.parse(JSON.stringify(db));return get()}
 function load(){const raw=storage.getItem(KEY);state=raw?JSON.parse(raw):empty();engine.validate(state);return get()}
 function apply(fn){return save(fn(get()))}
 function sync(h){return apply(db=>reconcile(db,h))}
 function operator(id,name){return apply(db=>{if(!/^TEST-[A-Z0-9-]{2,60}$/.test(id))throw Error('ID TEST non valido');if(db.operators.some(x=>x.id===id))throw Error('Operatore duplicato');db.operators.push({id,name});return db})}
 function estimate(id,clientId){return apply(db=>{if(db.estimates.some(x=>x.id===id))throw Error('Preventivo duplicato');db.estimates.push({id,clientId,lines:[]});return db})}
 function backup(){return JSON.stringify({format:'ITE40_WORKFLOW_TEST',version:1,data:get()},null,2)}
 function restore(json){if(typeof json!=='string'||json.length>3000000)throw Error('Backup troppo grande');const obj=JSON.parse(json);if(obj.format!=='ITE40_WORKFLOW_TEST'||obj.version!==1)throw Error('Formato backup non valido');return save(obj.data)}
 return Object.freeze({load,get,save,sync,operator,estimate,backup,restore,schedule:a=>apply(db=>engine.schedule(db,a)),transition:(...args)=>apply(db=>engine.transition(db,...args)),addExtra:(...args)=>apply(db=>engine.addExtra(db,...args)),approveExtra:(...args)=>apply(db=>engine.approveExtra(db,...args))});
}
return {KEY,empty,fromHierarchy,reconcile,create};
});
