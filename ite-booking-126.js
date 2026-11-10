/* I.T.E. 4.0.126 — integrated TEST appointment booking and intervention lifecycle. */
(function(root){"use strict";
const clone=x=>JSON.parse(JSON.stringify(x));
const required=(v,label)=>{if(!String(v??"").trim())throw Error("OBBLIGATORIO:"+label);return String(v).trim();};
function choices(state,clientId="",siteId="",systemId=""){
 const c=state.field.catalog;
 return {clients:c.clients.map(x=>({id:x.id,label:x.name})),
 sites:c.sites.filter(x=>!clientId||x.clientId===clientId).map(x=>({id:x.id,label:x.address,clientId:x.clientId})),
 systems:c.systems.filter(x=>!siteId||x.siteId===siteId).map(x=>({id:x.id,label:x.model||x.description||x.id,siteId:x.siteId})),
 equipment:c.equipment.filter(x=>!systemId||x.systemId===systemId).map(x=>({id:x.id,label:x.model||x.id,systemId:x.systemId})),
 operators:c.operators.map(x=>({id:x.id,label:x.name,color:x.color||"#64748b"}))};
}
function book(state,record,actor){
 if(!root.ITE_Operations123||!root.ITE_Calendar125||!root.ITE_Audit124)throw Error("DIPENDENZE_ASSENTI");
 if(!root.ITE_Audit124.audit(state).ok)throw Error("WORKSPACE_NON_VALIDO");
 const r={id:required(record.id,"id"),clientId:required(record.clientId,"clientId"),siteId:required(record.siteId,"siteId"),systemId:required(record.systemId,"systemId"),equipmentId:String(record.equipmentId||""),operatorId:required(record.operatorId,"operatorId"),startAt:required(record.startAt,"startAt"),endAt:required(record.endAt,"endAt"),kind:required(record.kind,"kind"),notes:String(record.notes||"")};
 if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(r.startAt)||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(r.endAt))throw Error("FORMATO_ORARIO_LOCALE");
 if(!Number.isFinite(Date.parse(r.startAt))||!Number.isFinite(Date.parse(r.endAt))||Date.parse(r.endAt)<=Date.parse(r.startAt))throw Error("ORARIO_NON_VALIDO");
 const c=state.field.catalog;
 if(!c.sites.some(x=>x.id===r.siteId&&x.clientId===r.clientId))throw Error("SEDE_CLIENTE_NON_COERENTI");
 if(!c.systems.some(x=>x.id===r.systemId&&x.siteId===r.siteId))throw Error("IMPIANTO_SEDE_NON_COERENTE");
 if(r.equipmentId&&!c.equipment.some(x=>x.id===r.equipmentId&&x.systemId===r.systemId))throw Error("APPARECCHIATURA_IMPIANTO_NON_COERENTE");
 const collisions=root.ITE_Calendar125.conflicts(state,r);
 if(collisions.length)throw Error("SOVRAPPOSIZIONE_OPERATORE:"+collisions.join(","));
 return root.ITE_Operations123.apply(state,{type:"SCHEDULE",record:r},required(actor,"actor"));
}
function transition(state,type,id,actor,{at,reason,additionalWork}={}){
 if(!["ARRIVE","CLOSE","REVISE"].includes(type))throw Error("AZIONE_NON_VALIDA");
 const command={type,id:required(id,"id")};
 if(type==="REVISE")command.reason=required(reason,"reason");
 else {if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(String(at||"")))throw Error("FORMATO_ORARIO_LOCALE");command.at=at;}
 if(type==="CLOSE")command.additionalWork=String(additionalWork||"");
 return root.ITE_Operations123.apply(state,command,required(actor,"actor"));
}
function exportBackup(state){if(!root.ITE_Audit124.audit(state).ok)throw Error("AUDIT_NON_SUPERATO");return JSON.stringify({format:"ITE_126_TEST_EXPORT",state:clone(state)},null,2);}
function importBackup(json){const data=typeof json==="string"?JSON.parse(json):json;if(data?.format!=="ITE_126_TEST_EXPORT")throw Error("FORMATO_BACKUP_NON_VALIDO");const state=root.ITE_Operations123.restore(data.state);if(!root.ITE_Audit124.audit(state).ok)throw Error("AUDIT_NON_SUPERATO");return state;}
const api=Object.freeze({choices,book,transition,exportBackup,importBackup});
if(typeof module!=="undefined"&&module.exports)module.exports=api;root.ITE_Booking126=api;
})(typeof globalThis!=="undefined"?globalThis:this);
