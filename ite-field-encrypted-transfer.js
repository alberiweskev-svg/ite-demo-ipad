/* I.T.E. 4.0 — encrypted field workspace transport, no automatic persistence. */
(function(root){'use strict';
const workspace=root.ITEFieldWorkspace||(typeof require==='function'?require('./ite-field-workspace.js'):null);
function vaultReady(vault){return !!(vault&&typeof vault.isUnlocked==='function'&&vault.isUnlocked()&&typeof vault.sealBackup==='function'&&typeof vault.openBackup==='function')}
function exportEncrypted(data,vault){
 if(!vaultReady(vault))throw Error('ARCHIVIO_CIFRATO_BLOCCATO');
 const snapshot=workspace.snapshot(data);
 const encrypted=vault.sealBackup(snapshot);
 if(encrypted?.format!=='ITE-encrypted-backup'||!encrypted.payload)throw Error('CIFRATURA_NON_RIUSCITA');
 return encrypted;
}
async function importEncrypted(raw,vault){
 if(!vaultReady(vault))throw Error('ARCHIVIO_CIFRATO_BLOCCATO');
 if(!raw||raw.format!=='ITE-encrypted-backup')throw Error('BACKUP_CIFRATO_NON_VALIDO');
 const decoded=await vault.openBackup(raw);
 return workspace.restore(decoded);
}
const api=Object.freeze({vaultReady,exportEncrypted,importEncrypted});
root.ITEFieldEncryptedTransfer=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
