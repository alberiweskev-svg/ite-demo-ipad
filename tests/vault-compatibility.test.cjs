'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {inspect}=require('../ite-vault-compatibility.js');
const core=()=>({clienti:[{id:'c'}],immobili:[{id:'s',client_id:'c'}],impianti:[{id:'p',immobile_id:'s'}],apparecchiature:[{id:'d',impianto_id:'p'}],interventi:[],appuntamenti:[]});
const commerce=()=>({revision:1,documents:[],audit:[]});
test('compatible synthetic hierarchy does not mutate input',()=>{const c=core(),m=commerce(),before=JSON.stringify([c,m]);assert.equal(inspect(c,m).compatible,true);assert.equal(JSON.stringify([c,m]),before)});
test('orphan site is flagged',()=>{const c=core();c.immobili[0].client_id='missing';assert.equal(inspect(c,commerce()).compatible,false)});
test('duplicate and orphan appointment are flagged',()=>{const c=core();c.clienti.push({id:'c'});c.interventi.push({id:'j',appointmentId:'unknown'});assert.equal(inspect(c,commerce()).issues.length,2)});
test('missing audit and invalid revision are flagged',()=>{const m=commerce();delete m.audit;m.revision='1';assert.equal(inspect(core(),m).compatible,false)});
