const assert=require("node:assert/strict"),test=require("node:test"),crypto=require("node:crypto");
const a=require("../ite-declaration-review-294.js");
const hash=bytes=>crypto.createHash("sha256").update(bytes).digest("hex");
const bytes=Buffer.from("%PDF-1.4 TEST ONLY");const digest=hash(bytes);
function fixture(){return {schema:"ITE_DECLARATION_REVIEW_294",mode:"TEST_ONLY",packet:{issues:[]},documentEvidence:[{id:"TEST-PDF",hash:digest,pdfPresent:true}],revision:1,signature:"stable"};}
test("integrity of document checked",async()=>{const v=await a.verify(fixture(),async()=>bytes,async b=>hash(b));assert.equal(v.verified,true);assert.equal(v.canIssue,false);});
test("tampered PDF blocks review",async()=>{const v=await a.verify(fixture(),async()=>Buffer.from("bad"),async b=>hash(b));assert.equal(v.verified,false);assert.equal(v.checks[0].issue,"HASH_DIVERSO");});
test("missing expected digest blocks review",async()=>{const s=fixture();s.documentEvidence[0].hash="";assert.equal((await a.verify(s,async()=>bytes,async b=>hash(b))).verified,false);});
test("missing PDF blocks review",async()=>{const s=fixture();s.documentEvidence[0].pdfPresent=false;assert.equal((await a.verify(s,async()=>bytes,async b=>hash(b))).verified,false);});
test("changed state invalidates export",async()=>{const s=await a.verify(fixture(),async()=>bytes,async b=>hash(b));const latest=fixture();latest.signature="changed";assert.equal(a.exportManifest(s,latest).verified,false);});
test("stable state retains verified status, never authorizes issuance",async()=>{const s=await a.verify(fixture(),async()=>bytes,async b=>hash(b));const x=a.exportManifest(s,fixture());assert.equal(x.readyForHumanReview,true);assert.equal(x.canDeliverOfficial,false);assert.equal(x.signature,undefined);});
test("canonical object key ordering",()=>assert.equal(a.canonical({b:2,a:1}),a.canonical({a:1,b:2})));
test("read errors fail closed",async()=>{const v=await a.verify(fixture(),async()=>{throw Error("disk");},async b=>hash(b));assert.equal(v.verified,false);});