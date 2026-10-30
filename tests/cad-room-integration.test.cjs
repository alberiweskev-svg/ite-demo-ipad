/* Synthetic-only CAD room regression: multiple rooms, isolation, report consistency. */
const {test}=require('node:test');
const assert=require('node:assert/strict');
const cad=require('../ite-cad.js');
const id=n=>'e_00000000-0000-4000-8000-'+String(n).padStart(12,'0');
const wall=(n,x,y,x2,y2)=>({id:id(n),kind:'wall',x,y,x2,y2,color:cad.COLORS[0],text:'',rotation:0});
const rectangle=(start,x,y,w,h)=>[
 wall(start,x,y,x+w,y),wall(start+1,x+w,y,x+w,y+h),
 wall(start+2,x+w,y+h,x,y+h),wall(start+3,x,y+h,x,y)
];
test('two disjoint calibrated rooms sum only their own areas',()=>{
 const r=cad.roomMeasurementReport([...rectangle(1,0,0,200,200),...rectangle(5,400,0,300,100)],1);
 assert.equal(r.rows.length,2);
 assert.equal(r.invalidCount,0);
 assert.equal(r.totalAreaSquareMeters,7);
 assert.equal(r.totalPerimeterMeters,16);
});
test('mixed valid room and open wall: invalid portion excluded from totals',()=>{
 const r=cad.roomMeasurementReport([...rectangle(1,0,0,200,100),wall(5,400,0,500,0)],1);
 assert.equal(r.rows.length,2);
 assert.equal(r.invalidCount,1);
 assert.equal(r.totalAreaSquareMeters,2);
 assert.equal(r.totalPerimeterMeters,6);
});
test('uncalibrated report never reports metric totals',()=>{
 const r=cad.roomMeasurementReport(rectangle(1,0,0,200,100));
 assert.equal(r.totalAreaSquareMeters,null);
 assert.equal(r.totalPerimeterMeters,null);
 assert.equal(r.rows[0].status,'SCALA NON CALIBRATA');
});
test('CSV contains headers and preliminary-measurement warning',()=>{
 const csv=cad.roomMeasurementCsv(rectangle(1,0,0,200,100),1);
 assert.ok(csv.startsWith('\uFEFF'));
 assert.match(csv,/Contorno/);
 assert.match(csv,/TOTALI INDICATIVI/);
 assert.match(csv,/sovrapposti/);
});
test('reversed wall orientation yields same room area and perimeter',()=>{
 const walls=rectangle(1,0,0,200,100).map(e=>({...e,x:e.x2,y:e.y2,x2:e.x,y2:e.y}));
 const r=cad.roomMeasurementReport(walls,1);
 assert.equal(r.invalidCount,0);
 assert.equal(r.totalAreaSquareMeters,2);
 assert.equal(r.totalPerimeterMeters,6);
});
test('invalid input is rejected rather than generating a misleading report',()=>{
 assert.throws(()=>cad.roomMeasurementReport(null,1),/non valido/);
 assert.throws(()=>cad.roomMeasurementReport([],0),/non valido/);
});
