/* I.T.E. 4.0 — local workspace dirty state, no customer data leaves the device. */
(function(root){'use strict';
const workspace=root.ITEFieldWorkspace||(typeof require==='function'?require('./ite-field-workspace.js'):null);
const fingerprint=data=>JSON.stringify(workspace.snapshot(data));
function create(){let baseline=null;return Object.freeze({
 markSaved(data){baseline=fingerprint(data);return true},
 isDirty(data){return data!==null&&fingerprint(data)!==baseline},
 reset(){baseline=null},
 hasBaseline(){return baseline!==null}
})}
const api=Object.freeze({create});root.ITEFieldDirtyGuard=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
