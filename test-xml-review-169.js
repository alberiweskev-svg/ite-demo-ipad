/* 4.0.169 regression tests — fictitious documents only. */
const assert=require("node:assert/strict"),fs=require("node:fs"),vm=require("node:vm");
const fake=[
 {name:"test-a.xml",number:"A1",date:"2026-11-11",issuerVat:"11111111111",type:"TD01",net:100,vat:22,total:122},
 {name:"test-b.xml",number:"B2",date:"2026-11-11",issuerVat:"22222222222",type:"TD01",net:50,vat:11,total:61}
];
const mockX={extract:()=>fake.map(x=>({...x})),preview:(state,rows)=>({revision:state.revision,documents:rows}),commit:(state,plan)=>({state:{...state,revision:state.revision+1},imported:plan.documents.length})};
const sandbox={ITE_FatturaPABatch167:mockX,ITE_XmlReconcile168:require("./ite-xml-reconcile-168.js")};sandbox.globalThis=sandbox;
vm.runInNewContext(fs.readFileSync("ite-xml-review-169.js","utf8"),sandbox);
const M=sandbox.ITE_XmlReview169;
const existing={id:"i1",issuerVat:"11111111111",number:"A1",documentDate:"2026-11-11",documentType:"FATTURA",net:100,vat:22,gross:122};
const state={revision:7,commercial:{invoices:[existing]}};
const p=M.review(state,[{name:"a.xml"},{name:"b.xml"}],"03857941201");
assert.equal(p.eligible.length,1);assert.equal(p.eligible[0],1);assert.equal(p.blocked[0].status,"GIA_PRESENTE");
assert.throws(()=>M.register(state,p,[],"Tecnico TEST","03857941201"),/CONFERME/);
assert.throws(()=>M.register({...state,revision:8},p,[true],"Tecnico TEST","03857941201"),/REVISIONE/);
const result=M.register(state,p,[true],"Tecnico TEST","03857941201");
assert.equal(result.imported,1);assert.equal(result.state.revision,8);assert.equal(state.revision,7);
const changed={...state,commercial:{invoices:[...state.commercial.invoices,{...existing,id:"i2",issuerVat:"22222222222",number:"B2",net:51,vat:11,gross:62}]}};
assert.throws(()=>M.register(changed,p,[true],"Tecnico TEST","03857941201"),/RICONCILIAZIONE/);
const html=fs.readFileSync("index.html","utf8");
assert(html.includes('ite-xml-reconcile-168.js'));assert(html.includes('ite-xml-review-169.js'));assert(html.includes('ite-xml-review-ui-169.js'));
assert(html.indexOf('ite-xml-reconcile-168.js')<html.indexOf('ite-xml-review-169.js'));
assert(html.indexOf('ite-xml-review-169.js')<html.indexOf('ite-xml-review-ui-169.js'));
console.log("4.0.169 XML reconciliation and review tests passed");
