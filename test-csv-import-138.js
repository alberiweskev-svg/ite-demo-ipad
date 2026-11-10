/* Node: node test-csv-import-138.js */
const assert=require("node:assert/strict"),T=require("./ite-csv-import-138.js");
const sample=T.example;
assert.equal(T.parse(sample,";").length,4);
assert.deepEqual(T.parse(sample,";").map(x=>x.kind),["client","site","system","equipment"]);
assert.deepEqual(T.csv('a;b\n"x;y";z\n',";"),[["a","b"],["x;y","z"]]);
assert.throws(()=>T.parse('kind;id;name\nclient;X;A\nclient;X;B',";"),/ID_DUPLICATO/);
assert.throws(()=>T.parse('kind;id;name\nclient;X;"bad',";"),/VIRGOLETTE_NON_CHIUSE/);
assert.throws(()=>T.parse('kind;id;name\nclient;X;A;B',";"),/COLONNE_RIGA/);
const state={revision:3,field:{catalog:{clients:[],sites:[],systems:[],equipment:[],operators:[]}}};
const prepared=T.prepare(state,sample,";");
assert.equal(prepared.commands.length,4);assert.equal(prepared.expectedRevision,3);
assert.throws(()=>T.prepare({...state,field:{catalog:{...state.field.catalog,clients:[{id:"CL138"}]}}},sample,";"),/ID_GIA_PRESENTE/);
const deps={batch:{preview:(s,b)=>({baseRevision:s.revision,operations:b.commands}),commit:(s,b)=>({operations:b.commands})},operations:{},audit:{}};
assert.equal(T.preview(state,sample,"Operatore TEST",deps,";").operations.length,4);
const session={get:()=>state};assert.throws(()=>T.commit(session,sample,"Operatore TEST",deps,2,";"),/REVISIONE_CAMBIATA/);
console.log("PASS 4.0.138 CSV/TSV parsing, sorting, validation and preview");
