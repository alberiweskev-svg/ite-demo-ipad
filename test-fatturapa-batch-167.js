const assert=require("node:assert/strict");const M=require("./ite-fatturapa-batch-167.js");
assert.equal(typeof M.extract,"function");assert.equal(typeof M.preview,"function");assert.equal(typeof M.commit,"function");
assert.throws(()=>M.extract([]),/NUMERO_FILE/);
assert.throws(()=>M.extract([{name:"a.pdf",text:"test"}]),/FILE_NON_VALIDO/);
assert.throws(()=>M.extract([{name:"a.xml",text:"x".repeat(2000001)}]),/FILE_TROPPO_GRANDE/);
assert.throws(()=>M.preview({revision:0},[{confirmed:false}],"IT03857941201"),/REVISIONE_UMANA/);
assert.throws(()=>M.extract([{name:"a.xml",text:"x"},{name:"A.XML",text:"y"}]),/PARSER_XML_NON_DISPONIBILE|XML_MALFORMATO/);
console.log("167 smoke: guardrails OK; full XML parse requires browser DOMParser");
