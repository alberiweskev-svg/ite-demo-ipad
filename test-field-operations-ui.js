'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
const H=require('./ite-hierarchy-workspace.js'),F=require('./ite-field-operations.js');
const html=fs.readFileSync('index.html','utf8');
const ui=fs.readFileSync('ite-field-operations-ui.js','utf8');
for(const path of ['ite-hierarchy-workspace.js','ite-field-operations.js','ite-field-operations-ui.js']){
 assert(html.includes('src="./'+path+'?'),path+' missing from unified demo');
}
assert(html.indexOf('ite-hierarchy-workspace.js')<html.indexOf('ite-field-operations.js'));
assert(html.indexOf('ite-field-operations.js')<html.indexOf('ite-field-operations-ui.js'));
for(const operation of ['Registra appuntamento','Sono arrivato','Chiudi intervento','Riapri per revisione','Concludi revisione','Aggiorna agenda']){
 assert(ui.includes(operation),'Missing UI action '+operation);
}
let s=H.empty();
s=H.add(s,'clients',{id:'C',name:'Cliente fittizio'});
s=H.add(s,'sites',{id:'S',clientId:'C',address:'Via Demo 10'});
s=H.add(s,'plants',{id:'P',siteId:'S'});
s=H.add(s,'devices',{id:'D',plantId:'P'});
s=F.schedule(s,{id:'A',clientId:'C',siteId:'S',deviceId:'D',operator:'Operatore demo',start:'2026-11-04T08:00',end:'2026-11-04T09:00'});
assert.throws(()=>F.schedule(s,{id:'B',clientId:'C',siteId:'S',operator:'Operatore demo',start:'2026-11-04T08:30',end:'2026-11-04T09:30'}),/OPERATORE_GIA_OCCUPATO/);
s=F.start(s,'A','Operatore demo','I','2026-11-04T08:05');
s=F.close(s,'I','2026-11-04T08:50',[{description:'Lavoro extra dimostrativo'}]);
s=F.reopen(s,'I','Operatore demo','2026-11-04T10:00','Rettifica');
s=F.revise(s,'I','Operatore demo',{leftAt:'2026-11-04T08:55'},'2026-11-04T10:05');
assert.equal(s.interventions[0].status,'CONCLUSO');
assert.equal(s.interventions[0].history.length,3);
console.log('PASS: unified UI script ordering, actions, schedule conflicts and full intervention lifecycle');
