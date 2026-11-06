const assert=require("node:assert/strict");
const p=require("./ite-document-preparation-40.js");
for(const type of p.TYPES){
 const d={id:"TEST-DOC-001",type,state:"DRAFT",attachments:[]};
 const empty=p.prepare(d,{});
 assert.equal(empty.readyForManualReview,false);
 assert.equal(empty.validForIssue,false);
 assert.equal(empty.missing.length,p.REQUIRED[type].length);
 const fields=Object.fromEntries(p.REQUIRED[type].map(k=>[k,"Valore fittizio TEST"]));
 const full=p.prepare(d,fields);
 assert.equal(full.readyForManualReview,true);
 assert.equal(full.validForIssue,false);
 assert.match(p.preview(full,d),/NON VALIDA PER EMISSIONE/);
 assert.deepEqual(p.importJson(p.exportJson(full,d),d),full);
 const altered={...full,validForIssue:true};
 assert.throws(()=>p.validate(altered,d),/Emissione/);
 const tampered={...full,missing:["committente"]};
 assert.throws(()=>p.validate(tampered,d),/alterati/);
 assert.throws(()=>p.prepare({...d,id:"CLIENTE-REALE"},fields),/TEST/);
 assert.throws(()=>p.prepare({...d,state:"APPROVED"},fields),/modificabile/);
 assert.throws(()=>p.prepare(d,{...fields,iban:"segreto"}),/non riconosciuto/);
 assert.throws(()=>p.prepare(d,{...fields,[p.REQUIRED[type][0]]:"X".repeat(251)}),/troppo lungo/);
}
const d={id:"TEST-DOC-002",type:"DICO_IDRICO",state:"DRAFT",attachments:[]};
const q=p.prepare(d,{committente:" Mario   TEST "},{source:"PDF"});
assert.equal(q.fields.committente,"Mario TEST");
assert(q.flags.includes("DATI_DA_CONFRONTARE_CON_PDF_ORIGINALE"));
assert(q.flags.includes("VERIFICHE_TECNICHE_E_FIRME_NON_ATTESTATE"));
assert.throws(()=>p.importJson('{"schema":"wrong"}',d),/incompatibile/);
console.log("ITE 4.0.49: seven document families, required fields, safe import/export, anti-forgery tests passed");

const hierarchy={
 clients:[{id:"TEST-C-1",name:"Cliente Demo"}],
 sites:[{id:"TEST-S-1",clientId:"TEST-C-1",address:"Via Esempio 1",name:"Sede Demo"}],
 plants:[{id:"TEST-P-1",siteId:"TEST-S-1",name:"Impianto Demo"}],
 equipment:[{id:"TEST-E-1",plantId:"TEST-P-1",model:"Generatore Demo"}],
 operators:[{id:"TEST-O-1",name:"Tecnico Demo"}],
 appointments:[{id:"TEST-A-1",clientId:"TEST-C-1",siteId:"TEST-S-1",equipmentId:"TEST-E-1",operatorId:"TEST-O-1"}]
};
const linked={id:"TEST-DOC-3",type:"DICO_IDRICO",state:"DRAFT",attachments:[],link:{clientId:"TEST-C-1",siteId:"TEST-S-1",plantId:"TEST-P-1",equipmentId:"TEST-E-1",appointmentId:"TEST-A-1"}};
const suggestion=p.suggest(linked,hierarchy,{impresa:"Impresa TEST"});
assert.equal(suggestion.fields.committente,"Cliente Demo");
assert.equal(suggestion.fields.indirizzo,"Via Esempio 1");
assert.match(suggestion.fields.descrizioneImpianto,/Impianto Demo/);
assert.equal(suggestion.fields.impresa,"Impresa TEST");
assert.equal(suggestion.requiresManualVerification,true);
const kept=p.suggest(linked,hierarchy,{committente:"Nome inserito a mano"});
assert.equal(kept.fields.committente,"Nome inserito a mano");
assert(kept.conflicts.includes("committente"));
assert(!kept.filled.includes("committente"));
assert.throws(()=>p.suggest({...linked,link:{...linked.link,clientId:"CLIENTE-REALE"}},hierarchy),/non TEST/);
assert.throws(()=>p.suggest(linked,{...hierarchy,sites:[{...hierarchy.sites[0],clientId:"TEST-C-2"}]}),/non coerenti/);
assert.throws(()=>p.suggest({...linked,link:{...linked.link,equipmentId:"TEST-E-404"}},hierarchy),/non trovato/);
const report=p.prepare(linked,suggestion.fields);
assert.equal(report.validForIssue,false);
assert(report.missing.includes("responsabileTecnico"));
console.log("ITE 4.0.50: TEST hierarchy autofill, conflict protection, broken links and issue guard passed");
