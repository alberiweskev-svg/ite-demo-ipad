/* I.T.E. 4.0.134 — transactional TEST document-to-appointment assignment. */
(function(root){"use strict";
const copy=x=>JSON.parse(JSON.stringify(x));
const clean=x=>String(x??"").trim();
function candidates(state,group,id){
 if(!["estimates","invoices"].includes(group))throw Error("GRUPPO_NON_VALIDO");
 const doc=state.commercial[group].find(x=>x.id===id);
 if(!doc)throw Error("DOCUMENTO_INESISTENTE");
 return state.field.catalog.appointments.filter(a=>a.clientId===doc.clientId&&a.siteId===doc.siteId).map(a=>({id:a.id,startAt:a.startAt,operatorId:a.operatorId,kind:a.kind}));
}
function assign(state,group,id,appointmentId,actor,reason){
 if(!clean(actor)||!clean(reason))throw Error("OPERATORE_E_MOTIVO_OBBLIGATORI");
 if(!["estimates","invoices"].includes(group))throw Error("GRUPPO_NON_VALIDO");
 const next=copy(state),doc=next.commercial[group].find(x=>x.id===id);
 if(!doc)throw Error("DOCUMENTO_INESISTENTE");
 const target=appointmentId===null||appointmentId===""?null:clean(appointmentId);
 if(target&&!candidates(state,group,id).some(a=>a.id===target))throw Error("APPUNTAMENTO_CLIENTE_SEDE_INCOERENTE");
 if(doc.appointmentId===target||(doc.appointmentId==null&&target===null))throw Error("NESSUNA_MODIFICA");
 if(group==="invoices"&&doc.type==="TD04"){
  const original=next.commercial.invoices.find(x=>x.id===doc.originalId&&x.type==="VENDITA");
  if(!original)throw Error("FATTURA_ORIGINE_NON_VALIDA");
  if(target&&original.appointmentId!==target)throw Error("TD04_NON_COERENTE_CON_ORIGINE");
 }
 if(group==="invoices"&&doc.type==="VENDITA"){
  const credits=next.commercial.invoices.filter(x=>x.type==="TD04"&&x.originalId===doc.id);
  if(credits.some(x=>x.appointmentId&&x.appointmentId!==target))throw Error("TD04_GIA_COLLEGATA_ALTRO_INTERVENTO");
 }
 const previous=doc.appointmentId||null;
 if(target)doc.appointmentId=target;else delete doc.appointmentId;
 next.revision++;
 next.events.push({revision:next.revision,type:"LINK_DOCUMENT_APPOINTMENT",group,id,previous,target,actor:clean(actor),reason:clean(reason),at:new Date().toISOString()});
 const audit=root.ITE_Audit124.audit(next);
 if(!audit.ok)throw Error("AUDIT_NON_SUPERATO:"+audit.errors.join("|"));
 const links=root.ITE_Reconcile133.checkLinks(next);
 if(links.length)throw Error("COLLEGAMENTI_NON_VALIDI:"+JSON.stringify(links));
 return next;
}
function assignSession(session,group,id,appointmentId,actor,reason){
 const next=assign(session.get(),group,id,appointmentId,actor,reason);
 return session.restore(next,actor);
}
const api=Object.freeze({candidates,assign,assignSession});
if(typeof module!=="undefined"&&module.exports)module.exports=api;
root.ITE_DocumentLinks134=api;
})(typeof globalThis!=="undefined"?globalThis:this);
