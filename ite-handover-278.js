/* I.T.E. 4.0.278: technical handover readiness, metadata-only, synthetic demo. */
(function(root,factory){const api=factory(root.ITEDossier269,root.ITETechnical271,root.ITEAudit277);if(typeof module==="object"&&module.exports)module.exports=factory(require("./ite-dossier-269.js"),require("./ite-technical-register-271.js"),require("./ite-audit-277.js"));root.ITEHandover278=api;})(typeof globalThis!=="undefined"?globalThis:this,function(dossier,technical,audit277){"use strict";
const REQUIREMENTS=Object.freeze({GAS:["DICO","GAS"],ELETTRICO:["DICO"],IDRICO:["DICO"],TERMICO:["DICO"],GENERICA:[]});
function safe(x){return JSON.parse(JSON.stringify(x));}
function resolve(state,register,siteId,options={}){
const s=dossier.validate(state),r=technical.validate(register,s),site=s.sites.find(x=>x.id===siteId);if(!site)throw Error("SEDE_NON_TROVATA");
if(typeof options!=="object"||options===null||Array.isArray(options))throw Error("OPZIONI_NON_VALIDE");
const category=options.category||"GENERICA";if(!Object.prototype.hasOwnProperty.call(REQUIREMENTS,category))throw Error("CATEGORIA_NON_VALIDA");
const required=options.requiredTypes===undefined?REQUIREMENTS[category]:options.requiredTypes;
if(!Array.isArray(required)||required.some(x=>!technical.TYPES.includes(x))||new Set(required).size!==required.length)throw Error("REQUISITI_NON_VALIDI");
const docs=r.documents.filter(x=>x.siteId===siteId),missing=required.filter(type=>!docs.some(x=>x.type===type&&x.status==="ARCHIVIATO"&&x.filename));
const pending=docs.filter(x=>x.status!=="ARCHIVIATO").map(x=>({id:x.id,type:x.type,status:x.status}));
const noFile=docs.filter(x=>x.status==="ARCHIVIATO"&&!x.filename).map(x=>x.id);
const siteDevices=s.devices.filter(x=>s.systems.some(y=>y.id===x.systemId&&y.siteId===siteId));
const interventions=s.interventions.filter(x=>x.siteId===siteId);
const open=interventions.filter(x=>x.status!=="CHIUSO").map(x=>x.id);
const issues=audit277.audit(s,r).issues.filter(x=>x.id===siteId||interventions.some(i=>i.id===x.id)||docs.some(doc=>doc.id===x.id));
const blockers=[...missing.map(x=>({code:"TIPO_RICHIESTO_MANCANTE",type:x})),...noFile.map(id=>({code:"PDF_NON_ASSOCIATO",id})),...open.map(id=>({code:"INTERVENTO_APERTO",id}))];
return safe({schema:"ITE_HANDOVER_278",siteId,clientId:site.clientId,category,sourceRevisions:{dossier:s.revision,technical:r.revision},status:blockers.length?"INCOMPLETO":"PRONTO_PER_REVISIONE",requiredTypes:required,missingTypes:missing,counts:{systems:s.systems.filter(x=>x.siteId===siteId).length,devices:siteDevices.length,interventions:interventions.length,documents:docs.length,archived:docs.filter(x=>x.status==="ARCHIVIATO").length},documents:docs.map(x=>({id:x.id,type:x.type,status:x.status,filename:x.filename,size:x.size,deviceId:x.deviceId,interventionId:x.interventionId})),pending,blockers,issues});
}
function buildAll(state,register,options={}){const s=dossier.validate(state);return safe({schema:"ITE_HANDOVER_BATCH_278",sites:s.sites.map(x=>resolve(s,register,x.id,options))});}
function exportJSON(state,register,siteId,options){return JSON.stringify(resolve(state,register,siteId,options),null,2);}
return Object.freeze({REQUIREMENTS,resolve,buildAll,exportJSON});
});