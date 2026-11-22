/* Synthetic-only cross-domain regression for I.T.E. 4.0.265 */
const assert=require("node:assert/strict");
const M=require("./ite-workspace-audit-265.js");
const field={clients:[{id:"c"}],sites:[{id:"s",clientId:"c"}],systems:[{id:"y",siteId:"s"}],equipment:[{id:"e",systemId:"y"}],operators:[{id:"o"}],appointments:[{id:"a",clientId:"c",siteId:"s",equipmentId:"e",operatorId:"o",start:"2026-11-22T09:00:00",end:"2026-11-22T10:00:00"}],interventions:[{id:"i",appointmentId:"a",operatorId:"o"}]};
const commercial={extras:[{id:"x",interventionId:"i",kind:"POSA",priceCents:1000}],quotes:[{id:"q",interventionId:"i",extraIds:["x"],totalCents:1000}]};
const fiscal=[{id:"f",type:"VENDITA",direction:"OUT",documentCode:"TD01",date:"2026-11-22",counterpartyId:"c",number:"1",netCents:1000,vatCents:100,grossCents:1100}];
const docs=[{id:"d",clientId:"c",siteId:"s",equipmentId:"e",interventionId:"i"}];
const links=[{documentId:"f",clientId:"c",quoteId:"q",interventionId:"i"}];
const clean=M.audit(field,commercial,fiscal,docs,links);assert.equal(clean.valid,true,JSON.stringify(clean.issues));assert.equal(clean.counts.links,1);
const wrong=M.audit(field,{...commercial,quotes:[{...commercial.quotes[0],totalCents:999}]},[...fiscal,{id:"credit",type:"NOTA_CREDITO",direction:"OUT",documentCode:"TD04",date:"2026-11-22",counterpartyId:"c",number:"2",referenceId:"missing",netCents:100,vatCents:0,grossCents:100}],docs,[{...links[0],quoteId:"missing"}]);
for(const code of ["PREVENTIVO_TOTALE_DIVERSO","TD04_RIFERIMENTO","TD04_SEGNO","COLLEGAMENTO_PREVENTIVO"])assert(wrong.issues.some(x=>x.code===code),code);
const mismatch=M.audit(field,commercial,fiscal,[{...docs[0],siteId:"other"}],links);assert(mismatch.issues.some(x=>x.code==="DOCUMENTO_APPARECCHIATURA_SEDE"));
const escaped=M.csv({schema:"ITE_AUDIT_265",issues:[{code:"X",id:"=1+1"}]});assert(escaped.includes("'=1+1"));assert.throws(()=>M.csv({schema:"bad"}));
assert.equal(field.clients.length,1);assert.equal(fiscal.length,1);console.log("ITE 4.0.265 synthetic cross-domain regression OK");
