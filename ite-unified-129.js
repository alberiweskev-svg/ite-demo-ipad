/* I.T.E. 4.0.129 - single TEST session, no network or persistent storage. */
(function(root){"use strict";
const copy=x=>JSON.parse(JSON.stringify(x));
function create(deps){
 const O=deps.operations,A=deps.audit,B=deps.booking;
 if(!O||!A||!B)throw Error("DIPENDENZE_ASSENTI");
 let state=O.empty(),listeners=new Set(),history=[];
 const validate=s=>{const restored=O.restore(s);const report=A.audit(restored);if(!report.ok)throw Error("AUDIT_NON_SUPERATO:"+JSON.stringify(report.errors||[]));return restored;};
 const notify=()=>{const snapshot=copy(state);for(const fn of listeners)try{fn(snapshot);}catch(_e){}};
 const replace=(next,actor,reason)=>{if(!String(actor||"").trim()||!String(reason||"").trim())throw Error("OPERATORE_E_MOTIVO_OBBLIGATORI");const checked=validate(next);history.push({revision:state.revision,actor,reason});state=checked;notify();return get();};
 const get=()=>copy(state);
 const subscribe=fn=>{if(typeof fn!=="function")throw Error("LISTENER_NON_VALIDO");listeners.add(fn);fn(get());return ()=>listeners.delete(fn);};
 const execute=(command,actor)=>{const next=O.apply(state,copy(command),actor);return replace(next,actor,"COMANDO:"+command.type);};
 const book=(record,actor)=>replace(B.book(state,copy(record),actor),actor,"PRENOTAZIONE");
 const transition=(type,id,actor,details)=>replace(B.transition(state,type,id,actor,copy(details||{})),actor,"INTERVENTO:"+type);
 const restore=(raw,actor)=>{const parsed=typeof raw==="string"?JSON.parse(raw):raw;return replace(parsed,actor,"RIPRISTINO_TEST");};
 const exportBackup=()=>{validate(state);return JSON.stringify({format:"ITE_129_TEST_BACKUP",state:get()},null,2);};
 const importBackup=(raw,actor)=>{const data=typeof raw==="string"?JSON.parse(raw):raw;if(data?.format!=="ITE_129_TEST_BACKUP")throw Error("FORMATO_BACKUP_NON_VALIDO");return restore(data.state,actor);};
 return Object.freeze({get,subscribe,execute,book,transition,restore,exportBackup,importBackup,history:()=>copy(history)});
}
const api=Object.freeze({create});
if(typeof module!=="undefined"&&module.exports)module.exports=api;
root.ITE_Unified129=api;
})(typeof globalThis!=="undefined"?globalThis:this);
