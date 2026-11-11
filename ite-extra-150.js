/* I.T.E. 4.0.150 — commercial EXTRA approval and quote assembly. TEST-only. */
(function(root){"use strict";
const M=typeof require==="function"?require("./ite-commercial-149.js"):root.ITE_Commercial149;
const clone=x=>JSON.parse(JSON.stringify(x)),s=x=>String(x??"").trim();
const STATES=["DA_APPROVARE","PARZIALMENTE_APPROVATO","APPROVATO","RIFIUTATO"];
function checkExtra(x){
 if(!x||!s(x.id)||!s(x.clientId)||!s(x.siteId))throw Error("EXTRA_DATI_OBBLIGATORI");
 const rows=M.normalizeLines(x.lines);
 const approved=x.approvedLineIds||[];
 if(!Array.isArray(approved)||new Set(approved).size!==approved.length||approved.some(id=>!rows.some(r=>r.id===id)))throw Error("APPROVAZIONE_NON_VALIDA");
 const status=s(x.status||"DA_APPROVARE");
 if(!STATES.includes(status))throw Error("STATO_EXTRA_NON_VALIDO");
 if((status==="APPROVATO"&&approved.length!==rows.length)||(status==="PARZIALMENTE_APPROVATO"&&(!approved.length||approved.length===rows.length))||(["DA_APPROVARE","RIFIUTATO"].includes(status)&&approved.length))throw Error("STATO_APPROVAZIONE_INCOERENTE");
 return {...x,status,approvedLineIds:approved,lines:rows.map(({id,kind,description,quantity,unitPrice,vatRate})=>({id,kind,description,quantity,unitPrice,vatRate}))};
}
function saveExtra(state,extra,actor,expectedRevision){
 if(!state||state.revision!==expectedRevision)throw Error("REVISIONE_OBSOLETA");
 if(!s(actor))throw Error("OPERATORE_OBBLIGATORIO");
 const e=checkExtra(extra);M.validateLinks(state,e.clientId,e.siteId,e.appointmentId);
 if(!Array.isArray(state.commercial?.extras)||!Array.isArray(state.events))throw Error("ARCHIVIO_NON_VALIDO");
 const next=clone(state),arr=next.commercial.extras,idx=arr.findIndex(x=>x.id===e.id),old=idx>=0?arr[idx]:null;
 if(old&&["APPROVATO","RIFIUTATO"].includes(old.status)&&JSON.stringify(old.lines)!==JSON.stringify(e.lines))throw Error("EXTRA_FINALIZZATO");
 const row={id:e.id,clientId:e.clientId,siteId:e.siteId,appointmentId:e.appointmentId||"",category:s(e.category||"ALTRO"),description:s(e.description),status:e.status,lines:e.lines,approvedLineIds:e.approvedLineIds,updatedAt:new Date().toISOString()};
 if(idx>=0)arr[idx]=row;else arr.push(row);
 next.revision++;next.events.push({revision:next.revision,type:old?"UPDATE_EXTRA":"CREATE_EXTRA",actor:s(actor),extraId:e.id,at:row.updatedAt});
 return next;
}
function approve(state,id,approvedIds,actor,expectedRevision){
 const e=state.commercial?.extras?.find(x=>x.id===id);if(!e)throw Error("EXTRA_INESISTENTE");
 if(!Array.isArray(approvedIds))throw Error("APPROVAZIONE_NON_VALIDA");
 const status=approvedIds.length===0?"RIFIUTATO":approvedIds.length===e.lines.length?"APPROVATO":"PARZIALMENTE_APPROVATO";
 return saveExtra(state,{...e,status,approvedLineIds:approvedIds},actor,expectedRevision);
}
function summary(state,id){
 const e=state.commercial?.extras?.find(x=>x.id===id);if(!e)throw Error("EXTRA_INESISTENTE");
 const checked=checkExtra(e),all=M.totals(checked.lines),accepted=checked.lines.filter(r=>checked.approvedLineIds.includes(r.id));
 return {id,status:checked.status,all,approved:accepted.length?M.totals(accepted):{net:0,vat:0,gross:0,rows:[]},approvedCount:accepted.length,totalCount:checked.lines.length};
}
function quoteFromApproved(state,extraIds,estimateId,actor,expectedRevision){
 if(!Array.isArray(extraIds)||!extraIds.length||new Set(extraIds).size!==extraIds.length)throw Error("EXTRA_OBBLIGATORI");
 const extras=extraIds.map(id=>state.commercial?.extras?.find(x=>x.id===id));
 if(extras.some(x=>!x))throw Error("EXTRA_INESISTENTE");
 const first=extras[0];
 if(extras.some(x=>x.clientId!==first.clientId||x.siteId!==first.siteId||x.appointmentId!==first.appointmentId))throw Error("EXTRA_COLLEGAMENTI_DIVERSI");
 const lines=extras.flatMap(e=>{const c=checkExtra(e);return c.lines.filter(r=>c.approvedLineIds.includes(r.id)).map(r=>({...r,id:e.id+":"+r.id}));});
 if(!lines.length)throw Error("NESSUNA_VOCE_APPROVATA");
 if(state.commercial.estimates?.some(x=>x.id===estimateId))throw Error("PREVENTIVO_GIA_PRESENTE");
 return M.saveEstimate(state,{id:estimateId,clientId:first.clientId,siteId:first.siteId,appointmentId:first.appointmentId,status:"DA_ACCETTARE",lines},actor,expectedRevision);
}
const api=Object.freeze({checkExtra,saveExtra,approve,summary,quoteFromApproved});
if(typeof module!=="undefined"&&module.exports)module.exports=api;
root.ITE_Extra150=api;
})(typeof globalThis!=="undefined"?globalThis:this);
