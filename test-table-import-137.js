/* Node regression: node test-table-import-137.js */
const assert=require("node:assert/strict"),T=require("./ite-table-import-137.js");
const text=T.example;assert.equal(T.parse(text).length,2);
assert.deepEqual(T.parse(text).map(x=>x.type),["ADD_CLIENT","ADD_SITE"]);
assert.throws(()=>T.parse("kind\tid\nclient\t"),/OBBLIGATORIO/);
assert.throws(()=>T.parse("kind\tid\nunknown\tX"),/TIPO_RIGA/);
assert.throws(()=>T.parse("kind\tid\nclient\tX\tY"),/COLONNE_RIGA/);
assert.throws(()=>T.parse("kind\tid\tid\nclient\tX\tX"),/INTESTAZIONE/);
const calls=[];const deps={batch:{preview:(s,b)=>{calls.push(b);return {baseRevision:s.revision,operations:b.commands};},commit:(_s,b)=>({operations:b.commands})},operations:{},audit:{}};
assert.equal(T.preview({revision:4},text,"TEST",deps).operations.length,2);
assert.equal(calls[0].expectedRevision,4);
assert.throws(()=>T.commit({get:()=>({revision:5})},text,"TEST",deps,4),/REVISIONE_CAMBIATA/);
console.log("4.0.137 table import tests OK");
