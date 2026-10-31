/* I.T.E. 4.0 — vault integration gate.
 * Read-only capability assessment; never opens, migrates, or writes databases.
 * IndexedDB transactions cannot span distinct database instances.
 */
(function(root){'use strict';
const allowed=Object.freeze(['ITE_DEMO_DOCUMENTI_312','ITE_COMMERCIO_V1','ITE_BACKUP_HISTORY_V1']);
function assess(configuration){
 const cfg=configuration||{},databases=Array.isArray(cfg.databases)?cfg.databases:[];
 const issues=[];
 if(!databases.length)issues.push('Database non dichiarati');
 if(databases.some(x=>!allowed.includes(x)))issues.push('Database sconosciuto');
 if(new Set(databases).size!==databases.length)issues.push('Database duplicati');
 if(new Set(databases).size>1)issues.push('IndexedDB non supporta transazioni atomiche tra database distinti');
 if(cfg.encryptionVerified!==true)issues.push('Cifratura non verificata');
 if(cfg.backupRestoreTested!==true)issues.push('Ripristino backup non collaudato');
 if(cfg.auditInSameTransaction!==true)issues.push('Audit non incluso nella stessa transazione');
 if(cfg.durableCommitVerified!==true)issues.push('Durabilità commit non verificata');
 return Object.freeze({allowedToPersist:issues.length===0,readOnly:true,issues:Object.freeze(issues)});
}
function requireSafe(configuration){const result=assess(configuration);if(!result.allowedToPersist)throw Error('Integrazione archivio bloccata: '+result.issues.join('; '));return true}
const api=Object.freeze({assess,requireSafe,allowedDatabases:allowed});
root.ITEVaultIntegrationGate=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
