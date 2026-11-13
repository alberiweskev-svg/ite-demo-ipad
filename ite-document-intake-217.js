/* I.T.E. 4.0.217 — safe document intake queue, TEST ONLY.
   Never persists PDF bytes, extracted text, or real customer information. */
(function(root,factory){const api=factory();if(typeof module==="object"&&module.exports)module.exports=api;root.ITEDocumentIntake217=api;})(typeof globalThis!=="undefined"?globalThis:this,function(){"use strict";
const SCHEMA="ITE_DOCUMENT_INTAKE_TEST_217",MAX=1000,MAX_JSON=250000;
const TYPES=Object.freeze(["DICO_ELETTRICA","DICO_IDRICA","DIRI","ALLEGATI_GAS","POS","CAD","ALTRO"]);
const STATES=Object.freeze(["DA_CLASSIFICARE","DA_VERIFICARE","VERIFICATO","SCARTATO"]);
const clone=x=>JSON.parse(JSON.stringify(x)),fail=x=>{throw Error(x);};
const id=x=>typeof x==="string"&&/^[a-zA-Z0-9_-]{1,80}$/.test(x);
const str=(x,n)=>typeof x==="string"&&x.length<=n&&!/[\u0000-\u001f]/.test(x);
function validate(items){
 if(!Array.isArray(items)||items.length>MAX)fail("REGISTRO_NON_VALIDO");
 const ids=new Set();
 for(const x of items){
  if(!x||typeof x!=="object"||Array.isArray(x)||!id(x.id)||ids.has(x.id))fail("ID_NON_VALIDO");
  ids.add(x.id);
  if(!TYPES.includes(x.type)||!STATES.includes(x.status)||!str(x.label,120)||!str(x.note,300))fail("METADATI_NON_VALIDI");
  if(!Number.isSafeInteger(x.size)||x.size<0||x.size>25000000)fail("DIMENSIONE_NON_VALIDA");
  if(x.clientId!==null&&x.clientId!==undefined&&!id(x.clientId))fail("CLIENTE_NON_VALIDO");
  if(x.siteId!==null&&x.siteId!==undefined&&!id(x.siteId))fail("SEDE_NON_VALIDA");
  if(x.interventionId!==null&&x.interventionId!==undefined&&!id(x.interventionId))fail("INTERVENTO_NON_VALIDO");
  if(!/^TEST-[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(x.created))fail("DATA_NON_VALIDA");
  if(Object.keys(x).some(k=>!["id","type","status","label","note","size","clientId","siteId","interventionId","created"].includes(k)))fail("CAMPO_NON_AMMESSO");
 }
 return true;
}
function checkRelations(items,field){
 validate(items);
 if(!field||!Array.isArray(field.clients)||!Array.isArray(field.sites)||!Array.isArray(field.interventions)||!Array.isArray(field.appointments))fail("ANAGRAFICA_NON_VALIDA");
 const clients=new Set(field.clients.map(x=>x.id)),sites=new Map(field.sites.map(x=>[x.id,x])),appointments=new Map(field.appointments.map(x=>[x.id,x])),interventions=new Map(field.interventions.map(x=>[x.id,x]));
 for(const x of items){
  if(x.clientId&&!clients.has(x.clientId))fail("CLIENTE_ORFANO");
  if(x.siteId&&(!sites.has(x.siteId)||!x.clientId||sites.get(x.siteId).clientId!==x.clientId))fail("SEDE_INCOERENTE");
  if(x.interventionId){
   const intervention=interventions.get(x.interventionId),appointment=intervention&&appointments.get(intervention.appointmentId);
   if(!appointment||!x.clientId||appointment.clientId!==x.clientId||x.siteId&&appointment.siteId!==x.siteId)fail("INTERVENTO_INCOERENTE");
  }
 }
 return true;
}
function pdfSignature(bytes){
 if(!(bytes instanceof Uint8Array)||bytes.length<8||bytes.length>25000000)fail("PDF_NON_VALIDO");
 const header=String.fromCharCode(...bytes.subarray(0,8));
 if(!/^%PDF-1\.[0-7]/.test(header)&&!header.startsWith("%PDF-2.0"))fail("FIRMA_PDF_NON_VALIDA");
 return {format:"PDF",size:bytes.length,warning:"Firma iniziale soltanto: non certifica integrità, autenticità o contenuto del PDF."};
}
function create(field,initial=[]){
 checkRelations(initial,field);let items=clone(initial);
 function snapshot(){return clone(items);}
 function replace(next){checkRelations(next,field);items=clone(next);return snapshot();}
 function add(meta){return replace([...items,meta]);}
 function update(key,patch){
  if(!id(key)||!items.some(x=>x.id===key)||!patch||typeof patch!=="object"||Array.isArray(patch)||Object.keys(patch).some(k=>k==="id"||!["type","status","label","note","clientId","siteId","interventionId"].includes(k)))fail("MODIFICA_NON_VALIDA");
  return replace(items.map(x=>x.id===key?{...x,...patch}:x));
 }
 function remove(key){if(!items.some(x=>x.id===key))fail("DOCUMENTO_MANCANTE");return replace(items.filter(x=>x.id!==key));}
 function exportJson(){const s=JSON.stringify({schema:SCHEMA,mode:"SYNTHETIC_TEST_ONLY",items});if(s.length>MAX_JSON)fail("REGISTRO_TROPPO_GRANDE");return s;}
 function importJson(raw){if(typeof raw!=="string"||raw.length>MAX_JSON)fail("REGISTRO_TROPPO_GRANDE");let p;try{p=JSON.parse(raw);}catch(_){fail("JSON_NON_VALIDO");}if(!p||p.schema!==SCHEMA||p.mode!=="SYNTHETIC_TEST_ONLY")fail("FORMATO_NON_COMPATIBILE");return replace(p.items);}
 return Object.freeze({snapshot,replace,add,update,remove,exportJson,importJson});
}
return Object.freeze({SCHEMA,TYPES,STATES,validate,checkRelations,pdfSignature,create});
});