/* I.T.E. 4.0 — demo-only snapshot adapter. No production vault access. */
(function(root){'use strict';
const KEY='ite4.demo.snapshot.v1', BACKUP='ite4.demo.backup.v1';
function create(storage, validate){
 if(!storage||typeof storage.getItem!=='function'||typeof storage.setItem!=='function')throw Error('Storage non disponibile');
 if(typeof validate!=='function')throw Error('Validatore obbligatorio');
 function checked(state){const result=validate(state);if(!result||result.valid!==true)throw Error('Archivio non integro');return state}
 function parse(raw){if(!raw)return null;const doc=JSON.parse(raw);if(doc.schema!==1||!doc.state||typeof doc.state!=='object')throw Error('Formato archivio non supportato');checked(doc.state);return doc}
 function load(){return parse(storage.getItem(KEY))}
 function save(state){
  checked(state);
  const old=storage.getItem(KEY);
  if(old)parse(old); // Never overwrite an unreadable snapshot.
  const doc={schema:1,savedAt:new Date().toISOString(),state};
  const serialized=JSON.stringify(doc);
  if(old)storage.setItem(BACKUP,old);
  storage.setItem(KEY,serialized);
  const actual=storage.getItem(KEY);
  if(actual!==serialized)throw Error('Verifica scrittura fallita');
  return {savedAt:doc.savedAt,backupCreated:!!old};
 }
 function restoreBackup(){const raw=storage.getItem(BACKUP);if(!raw)throw Error('Backup assente');const doc=parse(raw);storage.setItem(KEY,raw);return doc}
 function clear(){storage.removeItem(KEY);storage.removeItem(BACKUP)}
 return Object.freeze({load,save,restoreBackup,clear});
}
const api=Object.freeze({create,KEY,BACKUP});
root.ITEDemoSnapshot=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
