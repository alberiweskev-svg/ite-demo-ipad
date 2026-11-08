"use strict";
const assert=require("node:assert/strict");
const B=require("./ite-workspace-bundle-89.js"),L=require("./ite-service-ledger-40.js");
function store(initial={},failAt=Infinity){
 const map=new Map(Object.entries(initial));let writes=0;
 return {getItem:k=>map.has(k)?map.get(k):null,setItem(k,v){if(++writes===failAt)throw Error("quota");map.set(k,v);},removeItem(k){if(++writes===failAt)throw Error("quota");map.delete(k);},dump:()=>Object.fromEntries(map)};
}
const service=JSON.stringify(L.empty());
const initial={[B.KEYS.service]:service};
const s=store(initial);
const bundle=B.snapshot(s);
assert.equal(bundle.archives.finance,null);
assert.deepEqual(B.deserialize(B.serialize(bundle)),bundle);
const dest=store({[B.KEYS.service]:"old",[B.KEYS.finance]:"old"});
assert.equal(B.restore(dest,bundle),true);
assert.deepEqual(dest.dump(),initial);
assert.throws(()=>B.validateBundle({...bundle,archives:{...bundle.archives,service:"{}"}}));
assert.throws(()=>B.validateBundle({...bundle,archives:{...bundle.archives,service:null}}));
assert.throws(()=>B.deserialize("x".repeat(3001025)));
const broken=store({[B.KEYS.service]:"old",[B.KEYS.finance]:"old"},2);
assert.throws(()=>B.restore(broken,bundle),/quota/);
assert.deepEqual(broken.dump(),{[B.KEYS.service]:"old",[B.KEYS.finance]:"old"});
assert.deepEqual(s.dump(),initial);
console.log("PASS 4.0.89 bundle: roundtrip, assenti, schema, dimensione, ripristino e rollback");
