/* I.T.E. 4.0 — encrypted local persistence, explicit save, no network. */
(function(root){'use strict';
const workspace=root.ITEFieldWorkspace||(typeof require==='function'?require('./ite-field-workspace.js'):null);
const KEY='ite_307_demo_ipad_v1_field_workspace_v1';
function check(vault){if(!vault||!vault.isUnlocked?.()||!vault.storage?.getItem||!vault.storage?.setItem||!vault.storage?.removeItem)throw Error('ARCHIVIO_CIFRATO_BLOCCATO')}
function save(data,vault){check(vault);const state=workspace.snapshot(data);vault.storage.setItem(KEY,JSON.stringify(state));return {saved:true,appointments:state.appointments.length,readOnly:true}}
function load(vault){check(vault);const raw=vault.storage.getItem(KEY);if(raw===null)return null;let parsed;try{parsed=JSON.parse(raw)}catch(_){throw Error('ARCHIVIO_LOCALE_NON_LEGGIBILE')}return workspace.restore(parsed)}
function clear(vault){check(vault);vault.storage.removeItem(KEY);return {cleared:true}}
const api=Object.freeze({save,load,clear,KEY});root.ITEFieldPersistence=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
