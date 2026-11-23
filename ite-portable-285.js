/* I.T.E. 4.0.285 — portable TEST archive: validated snapshot, dry-run and transactional restore. */
(function(root,factory){const api=factory();if(typeof module==="object"&&module.exports)module.exports=api;root.ITEPortable285=api;})(typeof globalThis!=="undefined"?globalThis:this,function(){"use strict";
const SCHEMA="ITE_PORTABLE_285",MAX=4000000;
const names=["dossier","sales","purchases","receivables","payables"];
const clone=x=>JSON.parse(JSON.stringify(x));
function dependencies(root){return {dossier:root.ITEDossier269,sales:root.ITESales281,purchases:root.ITEPurchases279,receivables:root.ITECashflow282,payables:root.ITEPayables280};}
function verifySet(data,apis){if(!data||typeof data!=="object"||Array.isArray(data))throw Error("ARCHIVIO_MANCANTE");
for(const n of names)if(!apis[n]||typeof apis[n].validate!=="function"||typeof apis[n].KEY!=="string")throw Error("MODULO_NON_DISPONIBILE_"+n);
const d=apis.dossier.validate(data.dossier);
for(const n of names.slice(1))apis[n].validate(data[n],d);
return clone(data);}
function read(storage,apis){const d=apis.dossier.load(storage);return verifySet({dossier:d,sales:apis.sales.load(storage,d),purchases:apis.purchases.load(storage,d),receivables:apis.receivables.load(storage,apis.sales.load(storage,d),d),payables:apis.payables.load(storage,apis.purchases.load(storage,d),d)},apis);}
function digest(str){let h=2166136261;for(let i=0;i<str.length;i++){h^=str.charCodeAt(i);h=Math.imul(h,16777619);}return (h>>>0).toString(16).padStart(8,"0");}
function create(storage,apis){const data=read(storage,apis),payload=JSON.stringify(data);if(payload.length>MAX)throw Error("ARCHIVIO_TROPPO_GRANDE");return {schema:SCHEMA,mode:"TEST_ONLY",checksum:digest(payload),data};}
function parse(raw,apis){if(typeof raw!=="string"||raw.length>MAX+1000)throw Error("FILE_TROPPO_GRANDE");const snap=JSON.parse(raw);if(!snap||snap.schema!==SCHEMA||snap.mode!=="TEST_ONLY"||!snap.data||typeof snap.checksum!=="string")throw Error("FORMATO_NON_VALIDO");
if(digest(JSON.stringify(snap.data))!==snap.checksum)throw Error("INTEGRITA_NON_VALIDA");return verifySet(snap.data,apis);}
function inspect(raw,storage,apis){const incoming=parse(raw,apis),current=read(storage,apis);return {schema:SCHEMA,mode:"TEST_ONLY",canRestore:true,registers:names.map(n=>({name:n,currentRevision:current[n].revision,incomingRevision:incoming[n].revision,currentRecords:count(current[n]),incomingRecords:count(incoming[n])})),warning:"La sostituzione riguarda solo i cinque registri TEST; non include PDF, foto, allegati o archivi operativi."};}
function count(v){return Object.values(v).reduce((s,x)=>s+(Array.isArray(x)?x.length:0),0);}
function restore(raw,storage,apis,confirm){if(confirm!=="SOSTITUISCI ARCHIVI TEST")throw Error("CONFERMA_OBBLIGATORIA");const incoming=parse(raw,apis),before=read(storage,apis),keys=names.map(n=>apis[n].KEY),original=keys.map(k=>storage.getItem(k));
try{for(const n of names)storage.setItem(apis[n].KEY,JSON.stringify(incoming[n]));const actual=read(storage,apis);if(JSON.stringify(actual)!==JSON.stringify(incoming))throw Error("RILETTURA_NON_COHERENTE");return {restored:true,registers:names.length};}
catch(e){let rollbackOk=true;for(let i=0;i<keys.length;i++){try{if(original[i]===null)storage.removeItem(keys[i]);else storage.setItem(keys[i],original[i]);}catch(_){rollbackOk=false;}}if(!rollbackOk)throw Error("RIPRISTINO_FALLITO_BACKUP_MANUALE_NECESSARIO");throw e;}}
return Object.freeze({SCHEMA,names,dependencies,verifySet,read,create,parse,inspect,restore,digest});
});
