/* I.T.E. 4.0.228 — cross-module operational controls; synthetic demo only. */
(function(root,factory){const api=factory();if(typeof module==="object"&&module.exports)module.exports=api;root.ITEOperations228=api;})(typeof globalThis!=="undefined"?globalThis:this,function(){"use strict";
const QUOTE_STATES=["BOZZA","INVIATO","ACCETTATO","RIFIUTATO"];
const transitions={BOZZA:["INVIATO"],INVIATO:["ACCETTATO","RIFIUTATO","BOZZA"],ACCETTATO:[],RIFIUTATO:["BOZZA"]};
function issues(s){const out=[],by=(type,id)=>s[type].find(x=>x.id===id);
 const issue=(code,id)=>out.push({code,id});
 for(const a of s.appointments){if(s.appointments.some(b=>b.id!==a.id&&b.operator===a.operator&&new Date(a.start)<new Date(b.end)&&new Date(a.end)>new Date(b.start)))issue("CONFLITTO_OPERATORE",a.id);}
 for(const i of s.interventions){const a=i.appointmentId&&by("appointments",i.appointmentId);if(a&&a.operator!==i.operator)issue("OPERATORE_DIVERSO",i.id);if(i.equipmentId){const e=by("equipment",i.equipmentId),p=e&&by("plants",e.plantId);if(p&&p.siteId!==i.siteId)issue("APPARECCHIO_SEDE_DIVERSA",i.id);}}
 for(const d of s.documents){if(d.clientId&&d.siteId){const site=by("sites",d.siteId);if(site&&site.clientId!==d.clientId)issue("DOCUMENTO_CLIENTE_DIVERSO",d.id);}}
 for(const f of s.invoices){if(f.quoteId){const q=by("quotes",f.quoteId);if(q&&q.clientId!==f.clientId)issue("FATTURA_CLIENTE_DIVERSO",f.id);}if(f.kind==="TD04"){const original=by("invoices",f.originalInvoiceId);if(original&&(original.kind!=="VENDITA"||original.clientId!==f.clientId))issue("TD04_ORIGINE_NON_VALIDA",f.id);}}
 return out;
}
function summary(s){const sum={clients:s.clients.length,sites:s.sites.length,plants:s.plants.length,equipment:s.equipment.length,appointments:s.appointments.length,openInterventions:s.interventions.filter(x=>x.status!=="CHIUSO").length,quotes:s.quotes.length,acceptedQuotes:s.quotes.filter(x=>x.status==="ACCETTATO").length,invoices:s.invoices.length,documents:s.documents.length,issues:issues(s)};return sum;}
function changeQuote(store,id,next){if(!QUOTE_STATES.includes(next))throw Error("STATO_PREVENTIVO_NON_VALIDO");return store.transact(store.snapshot().revision,s=>{const q=s.quotes.find(x=>x.id===id);if(!q)throw Error("PREVENTIVO_ASSENTE");if(!transitions[q.status].includes(next))throw Error("TRANSIZIONE_PREVENTIVO_NON_VALIDA");q.status=next;});}
function addCreditNote(store,sourceId,id,number,cents){return store.transact(store.snapshot().revision,s=>{const src=s.invoices.find(x=>x.id===sourceId);if(!src||src.kind!=="VENDITA")throw Error("FATTURA_ORIGINE_NON_VALIDA");if(!Number.isSafeInteger(cents)||cents<=0||!number||!number.trim())throw Error("NOTA_CREDITO_NON_VALIDA");const already=s.invoices.filter(x=>x.kind==="TD04"&&x.originalInvoiceId===sourceId).reduce((n,x)=>n+x.cents,0);if(already+cents>src.cents)throw Error("CREDITO_SUPERA_FATTURA");s.invoices.push({id,clientId:src.clientId,kind:"TD04",number,cents,originalInvoiceId:sourceId});});}
return Object.freeze({issues,summary,changeQuote,addCreditNote});
});
