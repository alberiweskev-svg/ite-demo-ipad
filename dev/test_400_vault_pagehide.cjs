'use strict';
// Synthetic lifecycle regression: closing a Safari tab must release live IndexedDB connections.
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('vault.js','utf8');
const start=source.indexOf('const databaseCache=new WeakMap()');
const end=source.indexOf('\nfunction openDatabase(',start);
assert(start>=0&&end>start,'IndexedDB connection tracking code not found');
assert(/addEventListener\('pagehide',\(\)=>\{closeActiveDatabases\(\);releaseLock\?\.\(\);\}\)/.test(source),
 'pagehide must close IndexedDB connections before releasing the exclusive session lock');
const context={WeakMap,Set,Proxy,Reflect};
vm.createContext(context);
vm.runInContext(source.slice(start,end)+'\nthis.wrap=databaseProxy;this.closeAll=closeActiveDatabases;',context);
let firstCloses=0,secondCloses=0,thirdCloses=0;
const first={name:'ITE_DEMO_DOCUMENTI_312',close(){firstCloses++}};
const second={name:'ITE_COMMERCIO_V1',close(){secondCloses++;throw Error('Simulated close failure')}};
const third={name:'ITE_BACKUP_HISTORY_V1',close(){thirdCloses++}};
const wrapped=context.wrap(first);
assert.equal(context.wrap(first),wrapped,'Database proxy should be cached');
wrapped.close();
assert.equal(firstCloses,1,'Explicit close must reach the underlying database');
context.wrap(second);
context.wrap(third);
assert.doesNotThrow(()=>context.closeAll(),'One failed close must not prevent other connections from closing');
assert.equal(firstCloses,1,'Already-closed database must not be closed twice');
assert.equal(secondCloses,1,'Failed close must be attempted once');
assert.equal(thirdCloses,1,'Remaining database must close despite an earlier failure');
context.closeAll();
assert.equal(thirdCloses,1,'Repeated pagehide cleanup must be idempotent');
console.log('OK: vault closes active IndexedDB connections before session release; explicit close and failure isolation verified');


// Milestone 39: forced idle lock must fail closed before navigation, close DB
// connections and release Web Locks even if a form has unsaved changes.
const lockStart=source.indexOf('function lock(force=false){');
const lockEnd=source.indexOf('\nasync function acquireLock()',lockStart);
assert(lockStart>=0&&lockEnd>lockStart,'Vault lock function not found');
const trace=[],secret=new Uint8Array([12,34,56]);
const shell={hidden:false},form={hidden:false},documentElement={style:{}};
const lockContext={
  locking:false,ready:true,secret,releaseLock:()=>trace.push('release'),
  closeActiveDatabases:()=>trace.push('close'),
  window:{ITECommerce:{busy:()=>false}},
  document:{documentElement,getElementById(id){return id==='app-shell'?shell:id==='appointment-form'?form:null}},
  location:{reload(){trace.push('reload')}},
  alert(){trace.push('alert')}
};
vm.createContext(lockContext);
vm.runInContext(source.slice(lockStart,lockEnd)+'\nthis.lock=lock;',lockContext);
lockContext.lock(false);
assert.deepEqual(trace,['alert'],'Manual lock must protect unsaved forms');
assert.equal(shell.hidden,false,'Rejected manual lock must leave form accessible');
trace.length=0;
lockContext.lock(true);
assert.deepEqual(trace,['close','release','reload'],'Forced lock must close connections and release session before reload');
assert.equal(shell.hidden,true,'Forced lock must immediately hide application shell');
assert.equal(documentElement.style.visibility,'hidden','Forced lock must immediately mask the entire page');
assert.deepEqual(Array.from(secret),[0,0,0],'Forced lock must zero encryption key bytes');
assert.equal(lockContext.ready,false,'Forced lock must disable vault access');
assert.equal(lockContext.secret,null,'Forced lock must drop encryption key reference');
assert.equal(lockContext.releaseLock,null,'Released Web Lock must not be retained');
lockContext.lock(true);
assert.deepEqual(trace,['close','release','reload'],'Repeated inactivity events must not cause multiple reloads');
console.log('OK: forced idle lock masks UI, zeroes key, closes DBs and releases Web Lock once');
