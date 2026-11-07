const assert=require("node:assert/strict");const R=require("./ite-pdf-review-40.js");
const x=R.create({kind:"DIRI",bytes:100,hasEof:true,encrypted:false,warnings:[]});
assert.equal(R.summary([x]).pending,1);assert.equal(R.decide(x,"DIRI","approved").status,"approved");
assert.throws(()=>R.decide(x,"DA_VERIFICARE","approved"));assert.throws(()=>R.decide({...x,encrypted:true},"DIRI","approved"));
assert.throws(()=>R.manifest([x],"TEST-APP-1"));const m=R.manifest([R.decide(x,"DIRI","approved")],"TEST-APP-1");assert.equal(m.documents[0].type,"DIRI");assert(!JSON.stringify(m).includes(".pdf"));console.log("PDF review tests passed");