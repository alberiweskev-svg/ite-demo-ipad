/* I.T.E. 4.0.130 — guided TEST data entry on the shared 4.0.129 session. */
(function(root){"use strict";
const clean=v=>String(v??"").trim();
const specs=Object.freeze({
 client:{type:"ADD_CLIENT",fields:["id","name"],required:["id","name"]},
 site:{type:"ADD_SITE",fields:["id","clientId","address"],required:["id","clientId","address"]},
 system:{type:"ADD_SYSTEM",fields:["id","siteId","description"],required:["id","siteId"]},
 equipment:{type:"ADD_EQUIPMENT",fields:["id","systemId","brand","model","serial"],required:["id","systemId"]},
 operator:{type:"ADD_OPERATOR",fields:["id","name","color"],required:["id","name"]},
 appointment:{type:"SCHEDULE",fields:["id","clientId","siteId","systemId","equipmentId","operatorId","startAt","endAt","kind","notes"],required:["id","clientId","siteId","systemId","operatorId","startAt","endAt","kind"]}
});
function options(state,kind,selection={}){
 const c=state.field.catalog;
 const filter=(arr,field,value)=>arr.filter(x=>!value||x[field]===value).map(x=>({value:x.id,label:x.name||x.address||x.description||x.model||x.id}));
 return {clientId:filter(c.clients),siteId:filter(c.sites,"clientId",selection.clientId),systemId:filter(c.systems,"siteId",selection.siteId),equipmentId:filter(c.equipment,"systemId",selection.systemId),operatorId:filter(c.operators)};
}
function command(kind,values,state){
 const spec=specs[kind];if(!spec)throw Error("TIPO_NON_VALIDO");
 const r={};for(const key of spec.fields)r[key]=clean(values[key]);
 for(const key of spec.required)if(!r[key])throw Error("OBBLIGATORIO:"+key);
 const opts=options(state,kind,r);
 for(const key of ["clientId","siteId","systemId","equipmentId","operatorId"])if(r[key]&&!opts[key].some(o=>o.value===r[key]))throw Error("COLLEGAMENTO_NON_VALIDO:"+key);
 if(kind==="appointment"){
  for(const key of ["startAt","endAt"])if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(r[key])||!Number.isFinite(Date.parse(r[key])))throw Error("DATA_NON_VALIDA:"+key);
  if(Date.parse(r.endAt)<=Date.parse(r.startAt))throw Error("FINE_NON_SUCCESSIVA");
 }
 return {type:spec.type,record:r};
}
const api=Object.freeze({specs,options,command});
if(typeof module!=="undefined"&&module.exports)module.exports=api;
root.ITE_Guided130=api;
})(typeof globalThis!=="undefined"?globalThis:this);
