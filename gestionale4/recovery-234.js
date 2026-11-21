/* I.T.E. 4.0.234 — crash-safe local demo persistence and recovery.
   Browser-only, synthetic demo; no server sync or production migration. */
(function(root,factory){const api=factory();if(typeof module==="object"&&module.exports)module.exports=api;root.ITERecovery234=api;})(typeof globalThis!=="undefined"?globalThis:this,function(){"use strict";
const MAX=3000000,MAX_HISTORY=5;
function checksum(text){let h=2166136261;for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,16777619);}return (h>>>0).toString(16).padStart(8,"0");}
function envelope(raw){if(typeof raw!=="string"||raw.length>MAX)throw Error("ARCHIVIO_TROPPO_GRANDE");return JSON.stringify({format:"ITE_RECOVERY_234",checksum:checksum(raw),raw});}
function unpack(text,validate){const v=JSON.parse(text);if(!v||v.format!=="ITE_RECOVERY_234"||typeof v.raw!=="string"||v.raw.length>MAX||checksum(v.raw)!==v.checksum)throw Error("BACKUP_NON_INTEGRO");const data=JSON.parse(v.raw);validate(data);return data;}
function keys(key){return {current:key,history:key+":history234",pending:key+":pending234"};}
function safeParseHistory(storage,key,validate){let rows=[];try{const raw=storage.getItem(keys(key).history);if(raw){const parsed=JSON.parse(raw);if(Array.isArray(parsed))rows=parsed;}}catch(_){}
return rows.filter(x=>{try{unpack(x,validate);return true;}catch(_){return false;}}).slice(0,MAX_HISTORY);}
function inspect(storage,key,validate){const k=keys(key),current=storage.getItem(k.current),pending=storage.getItem(k.pending),history=safeParseHistory(storage,key,validate);let valid=false,problem=null;
if(current!==null){try{validate(JSON.parse(current));valid=true;}catch(e){problem=e.message;}}
let interrupted=false;if(pending!==null){try{unpack(pending,validate);interrupted=true;}catch(e){problem=problem||e.message;}}
return {valid,problem,interrupted,history:history.map((entry,index)=>{const data=unpack(entry,validate);return {index,revision:data.revision,counts:Object.fromEntries(["clients","sites","plants","equipment","appointments","interventions","quotes","invoices","documents"].map(t=>[t,data[t].length]))};})};}
function persist(storage,key,raw,validate){const k=keys(key),next=JSON.parse(raw);validate(next);const previous=storage.getItem(k.current);if(previous===raw)return {saved:true,unchanged:true};
let history=safeParseHistory(storage,key,validate);if(previous!==null){try{validate(JSON.parse(previous));history=[envelope(previous),...history].slice(0,MAX_HISTORY);}catch(_){}}
const pending=envelope(raw);
// Two-phase local write: pending marker remains on quota/error; current is never deleted.
storage.setItem(k.pending,pending);
storage.setItem(k.current,raw);
try{storage.setItem(k.history,JSON.stringify(history));}catch(e){storage.removeItem(k.pending);return {saved:true,historySaved:false,warning:String(e.message||e)};}
storage.removeItem(k.pending);return {saved:true,historySaved:true};}
function restore(storage,key,index,validate){const history=safeParseHistory(storage,key,validate);if(!Number.isInteger(index)||index<0||index>=history.length)throw Error("VERSIONE_NON_DISPONIBILE");const data=unpack(history[index],validate);persist(storage,key,JSON.stringify(data),validate);return data;}
function recoverPending(storage,key,validate){const k=keys(key),raw=storage.getItem(k.pending);if(raw===null)throw Error("NESSUN_RECUPERO");const data=unpack(raw,validate);persist(storage,key,JSON.stringify(data),validate);return data;}
return Object.freeze({checksum,envelope,unpack,inspect,persist,restore,recoverPending});
});
