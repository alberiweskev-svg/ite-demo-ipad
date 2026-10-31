'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {assess,requireSafe}=require('../ite-vault-integration-gate.js');
const verified={databases:['ITE_COMMERCIO_V1'],encryptionVerified:true,backupRestoreTested:true,auditInSameTransaction:true,durableCommitVerified:true};
test('cross-database writes blocked even if all flags are true',()=>{
 const result=assess({...verified,databases:['ITE_DEMO_DOCUMENTI_312','ITE_COMMERCIO_V1']});
 assert.equal(result.allowedToPersist,false);assert.match(result.issues.join(' '),/database distinti/);
});
test('missing backup restore verification blocks writes',()=>{
 assert.throws(()=>requireSafe({...verified,backupRestoreTested:false}),/Ripristino backup/);
});
test('unrecognized or repeated databases are rejected',()=>{
 assert.equal(assess({...verified,databases:['UNKNOWN']}).allowedToPersist,false);
 assert.equal(assess({...verified,databases:['ITE_COMMERCIO_V1','ITE_COMMERCIO_V1']}).allowedToPersist,false);
});
test('single verified database passes capability gate only',()=>{
 assert.equal(requireSafe(verified),true);assert.equal(assess(verified).readOnly,true);
});
