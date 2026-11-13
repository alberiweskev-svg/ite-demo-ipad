const assert=require("node:assert/strict");
const B=require("../ite-operational-batch-202.js");
const field={clients:[{id:"c"}],sites:[{id:"s",clientId:"c"}],systems:[{id:"sys",siteId:"s"}],equipment:[{id:"e",systemId:"sys"}],operators:[{id:"op"}],appointments:[],interventions:[]};
const commercial={extras:[],quotes:[]},before=JSON.stringify([field,commercial]);
const at="2026-11-13T09:00:00+01:00";
const actions=[
 {type:"APPOINTMENT_CREATE",id:"a",clientId:"c",siteId:"s",equipmentId:"e",operatorId:"op",start:at,end:"2026-11-13T10:00:00+01:00"},
 {type:"ARRIVAL",appointmentId:"a",interventionId:"i",at:"2026-11-13T09:05:00+01:00"},
 {type:"EXTRA_ADD",id:"material",interventionId:"i",kind:"FORNITURA",description:"Materiale fittizio",priceCents:15000},
 {type:"EXTRA_ADD",id:"labor",interventionId:"i",kind:"POSA",description:"Posa fittizia",priceCents:9000},
 {type:"EXTRA_APPROVE",id:"material",status:"APPROVATO"},
 {type:"EXTRA_APPROVE",id:"labor",status:"APPROVATO"},
 {type:"QUOTE_CREATE",id:"q",interventionId:"i",extraIds:["material","labor"]},
 {type:"QUOTE_DECIDE",id:"q",status:"ACCETTATO"},
 {type:"CLOSE",interventionId:"i",at:"2026-11-13T09:55:00+01:00"}
];
const done=B.transact(field,commercial,actions);
assert.equal(done.events.length,9);
assert.equal(done.report.valid,true);
assert.equal(done.report.totals.approvedSupplyCents,15000);
assert.equal(done.report.totals.approvedInstallationCents,9000);
assert.equal(done.report.totals.acceptedQuotesCents,24000);
assert.equal(done.field.interventions[0].durationMinutes,50);
assert.equal(JSON.stringify([field,commercial]),before);
assert.throws(()=>B.transact(field,commercial,[actions[0],actions[0]]),/LOTTO_ANNULLATO_PASSO_2/);
assert.equal(JSON.stringify([field,commercial]),before);
assert.throws(()=>B.transact(field,commercial,[actions[0],actions[1],actions[2],actions[3],actions[4],actions[6],actions[7]]),/LOTTO_ANNULLATO_INTEGRITA/);
const corrupt=JSON.parse(JSON.stringify(done));corrupt.field.sites[0].clientId="missing";
assert(B.audit(corrupt.field,corrupt.commercial).issues.some(x=>x.startsWith("SEDE_CLIENTE")));
const duplicate=JSON.parse(JSON.stringify(done));duplicate.commercial.quotes.push({...duplicate.commercial.quotes[0],id:"q2"});
assert(B.audit(duplicate.field,duplicate.commercial).issues.some(x=>x.startsWith("EXTRA_DOPPIO_PREVENTIVO")));
assert.throws(()=>B.transact(field,commercial,[]),/LOTTO_NON_VALIDO/);
console.log("4.0.202: atomic rollback, end-to-end, separated supply/install, integrity and duplicate commercial checks OK");