/* I.T.E. 4.0.155 — test with synthetic data only. */
"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs");
const I=require("./ite-inventory-154.js");
const html=fs.readFileSync("index.html","utf8");
assert.match(html,/ite-inventory-154\.js/);assert.match(html,/ite-inventory-ui-155\.js/);
const ui=fs.readFileSync("ite-inventory-ui-155.js","utf8");
for(const token of ["ITE_UnifiedSession129","ITE_Inventory154","I.reserve","I.dispatch","I.cancel","I.movement","I.item","S.subscribe"])assert.ok(ui.includes(token),token);
let s={schema:"ITE_OPERATIONS_123",revision:0,events:[],commercial:{estimates:[{id:"Q-TEST",status:"ACCETTATO"}]},inventory:{items:[],movements:[],reservations:[]}};
function change(fn){s=fn(s,"Tecnico TEST",s.revision);}
change((st,a,r)=>I.item(st,{id:"A",code:"MAT-TEST",description:"Raccordo fittizio",unit:"pz",unitPrice:5,vatRate:22},a,r));
change((st,a,r)=>I.movement(st,{id:"M1",itemId:"A",direction:"IN",quantity:10},a,r));
change((st,a,r)=>I.reserve(st,{id:"R1",estimateId:"Q-TEST",itemId:"A",quantity:4},a,r));
assert.equal(I.overview(s).items[0].available,6);
assert.throws(()=>I.movement(s,{id:"M2",itemId:"A",direction:"OUT",quantity:7},"Tecnico TEST",s.revision),/GIACENZA/);
change((st,a,r)=>I.dispatch(st,"R1","M2",a,r));
assert.equal(I.overview(s).items[0].onHand,6);
assert.equal(I.overview(s).items[0].reserved,0);
assert.equal(s.inventory.reservations[0].status,"SCARICATA");
assert.throws(()=>I.dispatch(s,"R1","M3","Tecnico TEST",s.revision),/PRENOTAZIONE_NON_ATTIVA/);
assert.throws(()=>I.item(s,{id:"B",code:"MAT-TEST",description:"Duplicato",unitPrice:1,vatRate:22},"Tecnico TEST",s.revision),/CODICE_DUPLICATO/);
assert.throws(()=>I.cancel(s,"R1","Tecnico TEST",s.revision),/PRENOTAZIONE_NON_ATTIVA/);
assert.equal(s.events.length,4);
console.log("PASS inventory 4.0.155: integration and stock lifecycle");
