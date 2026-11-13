/* I.T.E. 4.0.206 — bounded reversible TEST workflow session; no persistent storage. */
(function(root,factory){const api=factory(typeof module==="object"&&module.exports?require("./ite-operational-batch-202.js"):root.ITEOperationalBatch202);if(typeof module==="object"&&module.exports)module.exports=api;root.ITEOperationalSession206=api;})(typeof globalThis!=="undefined"?globalThis:this,function(B){"use strict";
const copy=x=>JSON.parse(JSON.stringify(x));
function create(field,commercial,limit=40){
 if(!Number.isSafeInteger(limit)||limit<1||limit>200)throw Error("LIMITE_SESSIONE");
 const initial=B.audit(field,commercial);if(!initial.valid)throw Error("ARCHIVIO_TEST_NON_VALIDO");
 let snapshots=[{field:copy(field),commercial:copy(commercial),events:[],label:"Inizio TEST"}],cursor=0;
 function current(){return copy(snapshots[cursor]);}
 function status(){return {index:cursor,length:snapshots.length,canUndo:cursor>0,canRedo:cursor<snapshots.length-1,events:snapshots.slice(1,cursor+1).flatMap(x=>x.events).length,report:B.audit(snapshots[cursor].field,snapshots[cursor].commercial)};}
 function apply(actions,label){
  const before=current(),result=B.transact(before.field,before.commercial,actions);
  if(!result.report.valid)throw Error("INTEGRITA_SESSIONE");
  const next={field:copy(result.field),commercial:copy(result.commercial),events:copy(result.events),label:String(label||"Operazioni TEST").slice(0,120)};
  snapshots=snapshots.slice(0,cursor+1);snapshots.push(next);
  if(snapshots.length>limit+1)snapshots.shift();cursor=snapshots.length-1;
  return {state:current(),status:status()};
 }
 function undo(){if(cursor===0)throw Error("NESSUNA_OPERAZIONE_DA_ANNULLARE");cursor--;return {state:current(),status:status()};}
 function redo(){if(cursor>=snapshots.length-1)throw Error("NESSUNA_OPERAZIONE_DA_RIPRISTINARE");cursor++;return {state:current(),status:status()};}
 function reset(field2,commercial2){if(!B.audit(field2,commercial2).valid)throw Error("ARCHIVIO_TEST_NON_VALIDO");snapshots=[{field:copy(field2),commercial:copy(commercial2),events:[],label:"Inizio TEST"}];cursor=0;return {state:current(),status:status()};}
 return Object.freeze({current,status,apply,undo,redo,reset});
}
return Object.freeze({create});
});
