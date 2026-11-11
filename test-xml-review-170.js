/* I.T.E. 4.0.170 — security and regression tests, fictitious data only. */
const assert=require("node:assert/strict"),fs=require("node:fs"),vm=require("node:vm");
const extracted=[
 {name:"fake-a.xml",fileName:"fake-a.xml",number:"A1",date:"2026-11-11",issuerVat:"11111111111",type:"TD01",net:100,vat:22,total:122},
 {name:"fake-b.xml",fileName:"fake-b.xml",number:"B2",date:"2026-11-11",issuerVat:"22222222222",type:"TD04",net:50,vat:11,total:61}
];
let committed=null;
const X={extract:()=>structuredClone(extracted),preview:(state,rows,vat)=>({revision:state.revision,rows,vat}),commit:(state,plan,actor)=>{committed={plan,actor};return {state:{...state,revision:state.revision+1},imported:plan.rows.length};}};
const context={ITE_FatturaPABatch167:X,ITE_XmlReconcile168:require("./ite-xml-reconcile-168.js")};context.globalThis=context;
vm.runInNewContext(fs.readFileSync("ite-xml-review-169.js","utf8"),context);
const M=context.ITE_XmlReview169,vat="03857941201";
const invoice={id:"i1",issuerVat:"11111111111",number:"A1",documentDate:"2026-11-11",documentType:"FATTURA",net:100,vat:22,gross:122};
const state={revision:3,commercial:{invoices:[invoice]}};
const p=M.review(state,[{name:"fake-a.xml"},{name:"fake-b.xml"}],vat);
assert.equal(p.eligible.length,1);assert.equal(p.eligible[0],1);
assert.throws(()=>M.register(state,structuredClone(p),[true],"TEST",vat),/ANTEPRIMA_NON_AUTENTICA/);
assert.throws(()=>M.register(state,p,[true],"TEST","99999999999"),/PARTITA_IVA_CAMBIATA/);
assert.throws(()=>M.register(state,p,[true],"",vat),/OPERATORE/);
assert.throws(()=>M.register(state,p,[],"TEST",vat),/CONFERME/);
assert.throws(()=>M.register({...state,revision:4},p,[true],"TEST",vat),/REVISIONE/);
p.eligible.splice(0,1,0);p.extracted[1].net=999;p.reconciliation.results[1].status="GIA_PRESENTE";
extracted[1].net=999;
const out=M.register(state,p,[true],"Operatore TEST",vat);
assert.equal(out.imported,1);assert.equal(committed.plan.rows.length,1);
assert.equal(committed.plan.rows[0].number,"B2");assert.equal(committed.plan.rows[0].net,50);
assert.equal(state.revision,3);
const changed={...state,commercial:{invoices:[...state.commercial.invoices,{id:"i2",issuerVat:"22222222222",number:"B2",documentDate:"2026-11-11",documentType:"TD04",net:50,vat:11,gross:61}]}};
assert.throws(()=>M.register(changed,p,[true],"TEST",vat),/RICONCILIAZIONE_CAMBIATA/);
const allExisting={revision:3,commercial:{invoices:[invoice,{id:"i2",issuerVat:"22222222222",number:"B2",documentDate:"2026-11-11",documentType:"TD04",net:50,vat:11,gross:61}]}};
extracted[1].net=50;
const p2=M.review(allExisting,[],vat);
assert.throws(()=>M.register(allExisting,p2,[],"TEST",vat),/NESSUN_DOCUMENTO_NUOVO/);
assert.throws(()=>M.review(state,[], ""),/PARTITA_IVA_OBBLIGATORIA/);
console.log("4.0.170 guarded XML review: all assertions passed");
