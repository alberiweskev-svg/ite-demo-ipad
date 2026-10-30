/* Milestone 44 - synthetic geometry regression; run: node --test tests/cad-room-measurements.test.cjs */
const {test}=require('node:test');
const assert=require('node:assert/strict');
const cad=require('../ite-cad.js');
const id=n=>'e_00000000-0000-4000-8000-'+String(n).padStart(12,'0');
const wall=(n,x,y,x2,y2)=>({id:id(n),kind:'wall',x,y,x2,y2,color:cad.COLORS[0],text:'',rotation:0});
const rect=(n,x,y,x2,y2)=>({id:id(n),kind:'rect',x,y,x2,y2,color:cad.COLORS[0],text:'',rotation:0});
test('closed rectangular room: calibrated area and perimeter',()=>{
 const rows=[wall(1,0,0,400,0),wall(2,400,0,400,300),wall(3,400,300,0,300),wall(4,0,300,0,0)];
 const result=cad.roomMeasurements(rows,1);
 assert.equal(result.openContours,0);
 assert.equal(result.contours[0].perimeterMeters,14);
 assert.equal(result.contours[0].areaSquareMeters,12);
});
test('open walls never produce an invented area',()=>{
 const result=cad.roomMeasurements([wall(1,0,0,400,0),wall(2,400,0,400,300)],1);
 assert.equal(result.openContours,1);
 assert.equal(result.contours[0].areaSquareMeters,null);
});
test('unscaled rectangle retains geometric quantities without metric claims',()=>{
 const result=cad.roomMeasurements([rect(1,0,0,200,100)]);
 assert.equal(result.calibrated,false);
 assert.equal(result.contours[0].areaUnits,20000);
 assert.equal(result.contours[0].areaSquareMeters,null);
});
test('invalid scale is rejected',()=>assert.throws(()=>cad.roomMeasurements([],0),/Rilievo|Scala|non valida/));
