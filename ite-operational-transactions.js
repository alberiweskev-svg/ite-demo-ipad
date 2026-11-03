/* I.T.E. 4.0 — transactional demo operations, no network and no production records. */
(function(root){'use strict';
const H=root.ITEHierarchyWorkspace||(typeof require==='function'?require('./ite-hierarchy-workspace.js'):null);
const C=root.ITECalendarService||(typeof require==='function'?require('./ite-calendar-service.js'):null);
const Q=root.ITECommercialWorkspace||(typeof require==='function'?require('./ite-commercial-workspace.js'):null);
const A=root.ITEAccountingWorkspace||(typeof require==='function'?require('./ite-accounting-workspace.js'):null);
function engines(){if(!H||!C||!Q||!A)throw Error('MOTORI_NON_DISPONIBILI')}
function checked(s){engines();return {hierarchy:H.validate(s.hierarchy),commercial:Q.validate(s.commercial,s.hierarchy),accounting:A.validate(s.accounting)}}
function copy(s){return JSON.parse(JSON.stringify(checked(s)))}
function transaction(state,fn){const next=fn(copy(state));return checked(next)}
function scheduleAppointment(state,record){return transaction(state,s=>{s.hierarchy=H.add(s.hierarchy,'appointments',record);const clashes=C.conflicts(s.hierarchy).filter(c=>c.first===record.id||c.second===record.id);if(clashes.length)throw Error('OPERATORE_OCCUPATO');return s})}
function beginService(state,appointmentId,operator,id){return transaction(state,s=>{s.hierarchy=H.createIntervention(s.hierarchy,appointmentId,operator,id);return s})}
function clockService(state,interventionId,action,when){return transaction(state,s=>{s.hierarchy=H.clock(s.hierarchy,interventionId,action,when);return s})}
function createEstimate(state,quote){return transaction(state,s=>{s.commercial=Q.addQuote(s.commercial,s.hierarchy,quote);return s})}
function acceptAndReserve(state,quoteId){return transaction(state,s=>{s.commercial=Q.accept(s.commercial,s.hierarchy,quoteId);s.commercial=Q.reserve(s.commercial,s.hierarchy,quoteId);return s})}
function dischargeMaterials(state,quoteId){return transaction(state,s=>{s.commercial=Q.discharge(s.commercial,s.hierarchy,quoteId);return s})}
function registerDocument(state,document){return transaction(state,s=>{s.accounting=A.add(s.accounting,document);return s})}
function dashboard(state){const s=checked(state),cal=C.summary(s.hierarchy),quotes=s.commercial.quotes;return {clients:s.hierarchy.clients.length,sites:s.hierarchy.sites.length,plants:s.hierarchy.plants.length,devices:s.hierarchy.devices.length,appointments:cal.appointments,conflicts:cal.conflicts,inProgress:cal.inProgress,completed:cal.completed,quotes:quotes.length,acceptedQuotes:quotes.filter(q=>q.status==='ACCETTATO').length,documents:s.accounting.documents.length}}
const api=Object.freeze({checked,transaction,scheduleAppointment,beginService,clockService,createEstimate,acceptAndReserve,dischargeMaterials,registerDocument,dashboard});
root.ITEOperationalTransactions=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
