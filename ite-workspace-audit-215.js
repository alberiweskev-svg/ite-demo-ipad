/* I.T.E. 4.0.215 — cross-module fiscal/customer/quote audit. SYNTHETIC TEST ONLY.
   Read-only analysis: does not rewrite the workspace, fiscal records or production data. */
(function(root,factory){const api=factory();if(typeof module==="object"&&module.exports)module.exports=api;root.ITEWorkspaceAudit215=api;})(typeof globalThis!=="undefined"?globalThis:this,function(){"use strict";
const copy=x=>JSON.parse(JSON.stringify(x));
const fail=s=>{throw Error(s);};
const safeId=x=>typeof x==="string"&&x.length>0&&x.length<=100;
function audit(workspace,links=[]){
 if(!workspace||!workspace.field||!workspace.commercial||!Array.isArray(workspace.fiscal))fail("WORKSPACE_NON_VALIDO");
 const F=(typeof globalThis!=="undefined"&&globalThis.ITEFiscalLedger211)||(typeof require==="function"?require("./ite-fiscal-ledger-211.js"):null);
 const S=(typeof globalThis!=="undefined"&&globalThis.ITEWorkspaceStore209)||(typeof require==="function"?require("./ite-workspace-store-209.js"):null);
 if(!F||!S)fail("DIPENDENZE_MANCANTI");
 S.validate(workspace.field,workspace.commercial);F.validate(workspace.fiscal);
 if(!Array.isArray(links)||links.length>5000)fail("COLLEGAMENTI_NON_VALIDI");
 const clients=new Map(workspace.field.clients.map(x=>[x.id,x]));
 const sites=new Map(workspace.field.sites.map(x=>[x.id,x]));
 const equipment=new Map(workspace.field.equipment.map(x=>[x.id,x]));
 const appointments=new Map(workspace.field.appointments.map(x=>[x.id,x]));
 const interventions=new Map(workspace.field.interventions.map(x=>[x.id,x]));
 const quotes=new Map(workspace.commercial.quotes.map(x=>[x.id,x]));
 const docs=new Map(workspace.fiscal.map(x=>[x.id,x]));
 const used=new Set(),issues=[],resolved=[];
 for(const raw of links){
  if(!raw||!safeId(raw.documentId)||!safeId(raw.clientId)||raw.quoteId!==undefined&&!safeId(raw.quoteId)||raw.interventionId!==undefined&&!safeId(raw.interventionId))fail("COLLEGAMENTO_MALFORMATO");
  if(used.has(raw.documentId))fail("DOCUMENTO_COLLEGATO_DUE_VOLTE");
  used.add(raw.documentId);
  const d=docs.get(raw.documentId),c=clients.get(raw.clientId);
  if(!d){issues.push({code:"DOCUMENTO_MANCANTE",documentId:raw.documentId});continue;}
  if(!c){issues.push({code:"CLIENTE_MANCANTE",documentId:d.id,clientId:raw.clientId});continue;}
  if(d.direction==="IN"){issues.push({code:"ACQUISTO_NON_ASSOCIABILE_A_CLIENTE",documentId:d.id});continue;}
  if(raw.quoteId&&!quotes.has(raw.quoteId)){issues.push({code:"PREVENTIVO_MANCANTE",documentId:d.id});continue;}
  if(raw.interventionId&&!interventions.has(raw.interventionId)){issues.push({code:"INTERVENTO_MANCANTE",documentId:d.id});continue;}
  const q=raw.quoteId?quotes.get(raw.quoteId):null;
  if(q&&raw.interventionId&&q.interventionId!==raw.interventionId){issues.push({code:"PREVENTIVO_INTERVENTO_DIVERSO",documentId:d.id});continue;}
  const intervention=q?interventions.get(q.interventionId):raw.interventionId?interventions.get(raw.interventionId):null;
  const appointment=intervention?appointments.get(intervention.appointmentId):null;
  if(intervention&&(!appointment||appointment.clientId!==c.id||!sites.has(appointment.siteId)||!equipment.has(appointment.equipmentId))){issues.push({code:"GERARCHIA_CLIENTE_INCOERENTE",documentId:d.id});continue;}
  if(d.type==="NOTA_CREDITO"){const original=links.find(x=>x.documentId===d.referenceId);if(!original||original.clientId!==c.id){issues.push({code:"TD04_CLIENTE_ORIGINALE_NON_COLLEGATO",documentId:d.id});continue;}}
  resolved.push({documentId:d.id,clientId:c.id,quoteId:raw.quoteId||null,interventionId:intervention?intervention.id:null,grossCents:d.grossCents,status:d.status,type:d.type});
 }
 const unlinked=workspace.fiscal.filter(d=>d.direction==="OUT"&&!used.has(d.id)).map(d=>d.id);
 const byClient={};
 for(const r of resolved){const o=byClient[r.clientId]||(byClient[r.clientId]={clientId:r.clientId,venditeCents:0,proformaCents:0,noteCreditoCents:0,documents:0});if(r.status==="ANNULLATO")continue;o.documents++;if(r.type==="VENDITA")o.venditeCents+=r.grossCents;if(r.type==="PROFORMA")o.proformaCents+=r.grossCents;if(r.type==="NOTA_CREDITO")o.noteCreditoCents+=r.grossCents;}
 return copy({mode:"SYNTHETIC_TEST_ONLY",linked:resolved,unlinked,issues,byClient:Object.values(byClient).sort((a,b)=>a.clientId.localeCompare(b.clientId))});
}
function validateLinks(workspace,links){const result=audit(workspace,links);if(result.issues.length)fail("COLLEGAMENTI_INCOERENTI:"+result.issues[0].code);return result;}
function encodeLinks(links){if(!Array.isArray(links)||links.length>5000)fail("COLLEGAMENTI_NON_VALIDI");const result=JSON.stringify({schema:"ITE_FISCAL_LINKS_215",mode:"SYNTHETIC_TEST_ONLY",links});if(result.length>200000)fail("DIMENSIONE_NON_VALIDA");return result;}
function decodeLinks(json){if(typeof json!=="string"||json.length>200000)fail("DIMENSIONE_NON_VALIDA");let parsed;try{parsed=JSON.parse(json);}catch(_){fail("JSON_NON_VALIDO");}if(!parsed||parsed.schema!=="ITE_FISCAL_LINKS_215"||parsed.mode!=="SYNTHETIC_TEST_ONLY"||!Array.isArray(parsed.links))fail("FORMATO_NON_COMPATIBILE");return copy(parsed.links);}
return Object.freeze({audit,validateLinks,encodeLinks,decodeLinks});
});
