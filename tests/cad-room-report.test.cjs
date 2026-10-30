const {test}=require('node:test');
const assert=require('node:assert/strict');
const cad=require('../ite-cad.js');
const id=n=>'e_00000000-0000-4000-8000-'+String(n).padStart(12,'0');
const wall=(n,x,y,x2,y2)=>({id:id(n),kind:'wall',x,y,x2,y2,color:cad.COLORS[0],text:'',rotation:0});
test('room report totals calibrated closed rooms',()=>{
 const e=[wall(1,0,0,400,0),wall(2,400,0,400,300),wall(3,400,300,0,300),wall(4,0,300,0,0)];
 const r=cad.roomMeasurementReport(e,1);
 assert.equal(r.totalAreaSquareMeters,12);assert.equal(r.totalPerimeterMeters,14);
 assert.equal(r.rows[0].status,'INDICATIVO');
 const csv=cad.roomMeasurementCsv(e,1);
 assert.match(csv,/TOTALI INDICATIVI/);assert.match(csv,/12/);
});
test('open walls never count in totals',()=>{
 const e=[wall(1,0,0,400,0),wall(2,400,0,400,300)];
 const r=cad.roomMeasurementReport(e,1);
 assert.equal(r.invalidCount,1);assert.equal(r.totalAreaSquareMeters,0);
 assert.equal(r.rows[0].areaSquareMeters,null);
});
test('unscaled measurements do not claim metric totals',()=>{
 const e=[wall(1,0,0,400,0),wall(2,400,0,400,300),wall(3,400,300,0,300),wall(4,0,300,0,0)];
 const r=cad.roomMeasurementReport(e);
 assert.equal(r.totalAreaSquareMeters,null);
 assert.equal(r.rows[0].status,'SCALA NON CALIBRATA');
});
test('self-intersecting room excluded from report totals',()=>{
 const e=[wall(1,0,0,200,200),wall(2,200,200,0,200),wall(3,0,200,200,0),wall(4,200,0,0,0)];
 const r=cad.roomMeasurementReport(e,1);
 assert.equal(r.invalidCount,1);assert.equal(r.totalAreaSquareMeters,0);
});
