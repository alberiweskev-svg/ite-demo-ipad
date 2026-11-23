/* I.T.E. 4.0.287 - local TEST document backup, binary integrity and safe recovery. */
(function(root,factory){const api=factory();if(typeof module==="object"&&module.exports)module.exports=api;root.ITEDocBackup287=api;})(typeof globalThis!=="undefined"?globalThis:this,function(){"use strict";
const SCHEMA="ITE_DOC_BACKUP_287",LIMIT=32*1024*1024,MAX_FILES=80;
const fail=x=>{throw Error(x)},copy=x=>JSON.parse(JSON.stringify(x));
function encode(bytes){let s="";for(let i=0;i<bytes.length;i+=8192)s+=String.fromCharCode.apply(null,bytes.subarray(i,i+8192));if(typeof btoa!=="function")fail("BASE64_NON_DISPONIBILE");return btoa(s);}
function decode(s){if(typeof s!=="string"||!/^[A-Za-z0-9+/]*={0,2}$/.test(s)||s.length%4)fail("BASE64_NON_VALIDO");const v=atob(s),b=new Uint8Array(v.length);for(let i=0;i<v.length;i++)b[i]=v.charCodeAt(i);if(encode(b)!==s)fail("BASE64_NON_CANONICO");return b;}
function docApi(){if(!globalThis.ITEDoc286)fail("MODULO_DOCUMENTALE_NON_DISPONIBILE");return globalThis.ITEDoc286;}
function check(manifest){const api=docApi();if(!manifest||manifest.schema!=="ITE_DOC_MANIFEST_286")fail("MANIFEST_NON_VALIDO");return api.restore(manifest);}
async function create(state,adapter,cryptoApi){const api=docApi(),s=api.validate(state),docs=api.manifest(s),files=[],seen=new Set();let total=0;if(s.documents.length>MAX_FILES)fail("TROPPI_DOCUMENTI");
for(const d of s.documents){if(!d.pdf)continue;if(seen.has(d.pdf.key))continue;seen.add(d.pdf.key);const bytes=await adapter.get(d.pdf.key);if(!bytes)fail("PDF_MANCANTE_"+d.id);await api.verifyStored(s,d.id,adapter,cryptoApi);total+=bytes.length;if(total>LIMIT)fail("BACKUP_TROPPO_GRANDE");files.push({key:d.pdf.key,sha256:d.pdf.sha256,size:d.pdf.size,base64:encode(bytes)});}
return {schema:SCHEMA,mode:"TEST_ONLY",documents:docs,files};}
function inspect(archive){const api=docApi();if(!archive||archive.schema!==SCHEMA||archive.mode!=="TEST_ONLY"||!Array.isArray(archive.files)||archive.files.length>MAX_FILES)fail("BACKUP_NON_VALIDO");const s=check(archive.documents),expected=new Map(),actual=new Map();let total=0;
for(const d of s.documents)if(d.pdf){const p=expected.get(d.pdf.key);if(p&&(p.sha256!==d.pdf.sha256||p.size!==d.pdf.size))fail("CHIAVE_PDF_INCOERENTE");expected.set(d.pdf.key,d.pdf);}
for(const f of archive.files){if(!f||typeof f.key!=="string"||actual.has(f.key)||!expected.has(f.key))fail("FILE_ESTRANEO_O_DUPLICATO");const bytes=decode(f.base64);total+=bytes.length;if(total>LIMIT||bytes.length!==f.size||f.sha256!==expected.get(f.key).sha256||f.size!==expected.get(f.key).size)fail("DIMENSIONI_O_METADATI_INCOERENTI");api.verifyPdf(bytes);actual.set(f.key,bytes);}
if(actual.size!==expected.size)fail("PDF_MANCANTI");return {state:s,files:actual,count:actual.size,bytes:total,documents:s.documents.length};}
async function verify(archive,cryptoApi){const x=inspect(archive),api=docApi();for(const d of x.state.documents)if(d.pdf){const digest=await api.sha(x.files.get(d.pdf.key),cryptoApi);if(digest!==d.pdf.sha256)fail("HASH_NON_VALIDO_"+d.id);}return x;}
async function restore(archive,adapter,cryptoApi,storage,key,confirmation){if(confirmation!=="RIPRISTINA PDF TEST")fail("CONFERMA_OBBLIGATORIA");if(!adapter||typeof adapter.put!=="function"||typeof adapter.get!=="function"||typeof adapter.delete!=="function")fail("ADAPTER_NON_TRANSAZIONALE");const x=await verify(archive,cryptoApi),before=storage.getItem(key),old=new Map(),written=[];const next=JSON.stringify(x.state);
try{for(const [k,b] of x.files){old.set(k,await adapter.get(k));await adapter.put(k,b);written.push(k);const checkBytes=await adapter.get(k);if(!checkBytes||await docApi().sha(checkBytes,cryptoApi)!==await docApi().sha(b,cryptoApi))fail("RILETTURA_PDF_FALLITA");}
storage.setItem(key,next);if(storage.getItem(key)!==next)fail("RILETTURA_REGISTRO_FALLITA");return {restored:true,documents:x.documents,files:x.count,bytes:x.bytes};}
catch(e){let ok=true;try{if(before===null)storage.removeItem(key);else storage.setItem(key,before);}catch(_){ok=false;}
for(const k of written.reverse())try{const b=old.get(k);if(b===undefined||b===null)await adapter.delete(k);else await adapter.put(k,b);}catch(_){ok=false;}
if(!ok)fail("ROLLBACK_INCOMPLETO_VERIFICA_MANUALE");throw e;}}
return Object.freeze({SCHEMA,LIMIT,MAX_FILES,create,inspect,verify,restore,encode,decode});});
