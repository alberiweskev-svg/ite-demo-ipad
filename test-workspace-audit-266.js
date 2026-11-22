/* I.T.E. 4.0.266 — synthetic integrated audit regression, no real records. */
const assert=require("node:assert/strict"),audit=require("./ite-workspace-audit-266.js");
const field={clients:[{id:"c1"},{id:"c2"}],sites:[{id:"s1",clientId:"c1"},{id:"s2",clientId:"c2"}],systems:[{id:"y1",siteId:"s1"},{id:"y2",siteId:"s2"}],equipment:[{id:"e1",systemId:"y1"},{id:"e2",systemId:"y2"}],operators:[{id:"o1"}],appointments:[{id:"a1",clientId:"c1",siteId:"s1",equipmentId:"e1",operatorId:"o1",start:"2026-11-22T09:00:00",end:"2026-11-22T10:00:00"}],interventions:[{id:"i1",appointmentId:"a1",operatorId:"o1",arrivedAt:"2026-11-22T09:00:00",exitedAt:"2026-11-22T10:00:00",status:"CHIUSO"}]};
const commercial={extras:[{id:"x1",interventionId:"i1",kind:"FORNITURA",priceCents:10000},{id:"x2",interventionId:"i1",kind:"POSA",priceCents:5000}],quotes:[{id:"q1",interventionId:"i1",clientId:"c1",siteId:"s1",extraIds:["x1","x2"],totalCents:15000}]};
const fiscal=[{id:"f1",type:"VENDITA",direction:"OUT",documentCode:"TD01",date:"2026-11-22",counterpartyId:"c1",clientId:"c1",siteId:"s1",quoteId:"q1",number:"1",netCents:15000,vatCents:1500,grossCents:16500},{id:"n1",type:"NOTA_CREDITO",direction:"OUT",documentCode:"TD04",date:"2026-11-22",counterpartyId:"c1",clientId:"c1",siteId:"s1",number:"2",referenceId:"f1",netCents:-1000,vatCents:-100,grossCents:-1100}];
const docs=[{id:"d1",type:"DICO",clientId:"c1",siteId:"s1",equipmentId:"e1",interventionId:"i1"}];
const links=[{documentId:"d1",clientId:"c1",quoteId:"q1",interventionId:"i1"}];
const clean=audit.audit(field,commercial,fiscal,docs,links);assert.equal(clean.valid,true,JSON.stringify(clean.issues));assert.equal(clean.counts.fiscal,2);assert.equal(clean.readOnly,true);
const broken=audit.audit({...field,interventions:[{...field.interventions[0],exitedAt:null}]},{...commercial,quotes:[{...commercial.quotes[0],clientId:"c2"}]},[{...fiscal[0],siteId:"s2"},{...fiscal[1],grossCents:-20000,netCents:-19000,vatCents:-1000}], [{...docs[0],equipmentId:"e2"}],[{...links[0],clientId:"c2"}]);
for(const code of ["INTERVENTO_CHIUSO_SENZA_USCITA","PREVENTIVO_CLIENTE_INTERVENTO","FISCALE_SEDE_CLIENTE","TD04_SUPERA_ORIGINALE","DOCUMENTO_APPARECCHIATURA_INTERVENTO","COLLEGAMENTO_TECNICO_CLIENTE"])assert(broken.issues.some(i=>i.code===code),code);
assert(broken.categories.fiscale>0&&broken.categories.tecnico>0);
assert(audit.csv({schema:"ITE_AUDIT_266",issues:[{code:"X",id:"=2+2"}]}).includes("'=2+2"));assert.throws(()=>audit.csv({schema:"BAD"}));
assert.equal(field.interventions[0].exitedAt,"2026-11-22T10:00:00");assert.equal(fiscal[1].grossCents,-1100);
console.log("ITE 4.0.266 synthetic integrated audit OK");
