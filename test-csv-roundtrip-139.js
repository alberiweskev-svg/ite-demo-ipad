/* I.T.E. 4.0.139 regression: no customer data. */
const assert=require("node:assert/strict");
const E=require("./ite-csv-roundtrip-139.js"),I=require("./ite-csv-import-138.js");
const catalog={clients:[{id:"C1",name:"Cliente TEST"}],sites:[{id:"S1",clientId:"C1",address:"Via Fittizia 1"}],systems:[{id:"Y1",siteId:"S1",description:"Riscaldamento TEST"}],equipment:[{id:"E1",systemId:"Y1",brand:"Marca",model:"Modello",serial:"SN1"}],operators:[{id:"O1",name:"Tecnico TEST",color:"#008000"}]};
const state={field:{catalog}};
for(const sep of [";",",","\t"]){const csv=E.exportCsv(state,sep);assert.equal(I.parse(csv,sep).length,5);assert.equal(E.roundtrip(state,I,sep).ok,true);}
assert.equal(E.audit(state).ok,true);
assert.throws(()=>E.exportCsv({field:{catalog:{...catalog,sites:[{id:"S1",clientId:"MISSING",address:"Test"}]}}}),/GERARCHIA_NON_VALIDA/);
assert.throws(()=>E.exportCsv(state,"|"),/SEPARATORE_NON_VALIDO/);
assert.equal(E.quote,undefined);
const special={field:{catalog:{...catalog,clients:[{id:"C1",name:"=1+1"}]}}};
assert.match(E.exportCsv(special),/'=1\+1/);assert.equal(E.roundtrip(special,I).ok,false);
console.log("4.0.139 CSV export and roundtrip: OK");
