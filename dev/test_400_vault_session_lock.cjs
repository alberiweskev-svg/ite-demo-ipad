'use strict';
// Regression: a browser without Web Locks must never open two encrypted sessions.
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('vault.js','utf8');
const start=source.indexOf('async function acquireLock(){');
const end=source.indexOf('\nasync function launch(){',start);
assert(start>=0&&end>start,'Vault session lock function not found');
const code=source.slice(start,end)+'\nthis.acquireLock=acquireLock;this.release=()=>releaseLock?.();';
function scenario(navigator){
 const context={navigator,releaseLock:null,Promise,Error};
 vm.createContext(context);vm.runInContext(code,context);
 return context;
}
(async()=>{
 for(const navigator of [{},{locks:{}},{locks:{request:null}}]){
  const context=scenario(navigator);
  await assert.rejects(context.acquireLock(),/blocco sicuro delle sessioni/,
   'Missing Web Locks must fail closed instead of allowing concurrent access');
 }
 let locked=false,requests=0;
 const locks={async request(name,options,callback){
  requests++;
  assert.equal(name,'ITE_VAULT_SINGLE_SESSION');
  assert.equal(options.ifAvailable,true);
  if(locked)return callback(null);
  locked=true;
  try{return await callback({name})}finally{locked=false}
 }};
 const first=scenario({locks});
 await first.acquireLock();
 assert.equal(locked,true,'Session lock must remain held after acquisition');
 const second=scenario({locks});
 await assert.rejects(second.acquireLock(),/già aperto in un’altra scheda/,
  'A second tab must be denied while the first holds the lock');
 assert.equal(locked,true,'Rejected tab must not release the active session lock');
 first.release();
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(locked,false,'Closing the first tab must release its lock');
 await second.acquireLock();
 assert.equal(locked,true,'A new session must acquire the released lock');
 second.release();
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(locked,false);
 assert.equal(requests,3);
 console.log('OK: unsupported Web Locks fail closed; exclusive sessions and release are enforced');
})().catch(error=>{console.error(error);process.exitCode=1});
