/* I.T.E. 4.0 — CAD regression tests. Synthetic coordinates only. Run: node test-cad-precision-regression.js */
'use strict';
const assert=require('node:assert/strict');
const cad=require('./ite-cad.js');
let checks=0;
function test(name,fn){fn();checks++;process.stdout.write('OK '+name+'\n')}
const a=cad.make('wall',{x:100,y:100},{x:300,y:100});
const b=cad.make('wall',{x:200,y:0},{x:200,y:200});
test('muro punto-punto orizzontale',()=>{assert.equal(a.kind,'wall');assert.equal(a.y,a.y2);assert.equal(a.x2-a.x,200)});
test('muro ortogonale guidato',()=>assert.deepEqual(cad.orthogonalPoint({x:100,y:100},{x:289,y:117}),{x:289,y:100}));
test('ortogonale verticale',()=>assert.deepEqual(cad.orthogonalPoint({x:100,y:100},{x:112,y:280}),{x:100,y:280}));
test('incrocio muri',()=>assert.deepEqual(cad.segmentIntersection({x:100,y:100},{x:300,y:100},{x:200,y:0},{x:200,y:200}),{x:200,y:100}));
test('parallele senza intersezione',()=>assert.equal(cad.segmentIntersection({x:0,y:0},{x:100,y:0},{x:0,y:20},{x:100,y:20}),null));
test('snap intersezione avanzato',()=>assert.deepEqual(cad.snapPoint({x:202,y:101},[a,b],true,18,true),{x:200,y:100}));
test('snap disabilitato',()=>assert.deepEqual(cad.snapPoint({x:207,y:103},[a,b],false),{x:210,y:100}));
test('quota orizzontale',()=>assert.deepEqual(cad.axisDimensionPoint({x:10,y:20},{x:70,y:90},'horizontal'),{x:70,y:20}));
test('quota verticale',()=>assert.deepEqual(cad.axisDimensionPoint({x:10,y:20},{x:70,y:90},'vertical'),{x:10,y:90}));
test('strumenti presenti',()=>{for(const x of ['wall','line','rect','dimension','label','symbol'])assert.ok(cad.KINDS.includes(x))});
test('non modificare disegno in caso di errore',()=>{const original=JSON.stringify([a]);assert.throws(()=>cad.operate([a],'add',null,{element:{id:'err'}}));assert.equal(JSON.stringify([a]),original)});
test('rifiuta geometria degenerata',()=>assert.throws(()=>cad.make('wall',{x:100,y:100},{x:100,y:100})));
test('rifiuta coordinate non numeriche',()=>assert.throws(()=>cad.orthogonalPoint({x:NaN,y:10},{x:20,y:30})));
test('limite scala',()=>{assert.equal(cad.validScale(1),true);assert.equal(cad.validScale(0),false);assert.equal(cad.validScale(101),false)});
console.log('CAD precision regression: '+checks+' controlli superati');
